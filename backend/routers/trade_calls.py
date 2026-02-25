"""Trade Calls API — record, resolve, and get performance stats."""

import logging
from datetime import datetime, timedelta
from typing import Optional

from core.database import get_db
from fastapi import APIRouter, Depends, Query
from models.trade_call import TradeCall
from pydantic import BaseModel
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/trade-calls", tags=["trade-calls"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class TradeCallCreate(BaseModel):
    symbol: str
    side: str
    entry_price: float
    stop_loss: float
    tp0: Optional[float] = None
    tp1: float
    tp2: float
    tp3: float
    confidence: int
    reason: Optional[str] = None
    rsi4h: Optional[float] = None
    has_convergence: bool = False
    rr: Optional[float] = None


class TradeCallOut(BaseModel):
    id: int
    symbol: str
    side: str
    entry_price: float
    stop_loss: float
    tp0: Optional[float]
    tp1: float
    tp2: float
    tp3: float
    confidence: int
    reason: Optional[str]
    rsi4h: Optional[float]
    has_convergence: bool
    rr: Optional[float]
    status: str
    tp0_hit: bool
    tp1_hit: bool
    tp2_hit: bool
    tp3_hit: bool
    sl_hit: bool
    best_tp_reached: int
    exit_price: Optional[float]
    profit_pct: Optional[float]
    created_at: datetime
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── POST /api/v1/trade-calls — Record a new call (with dedup) ────────────────

@router.post("", response_model=dict)
async def create_trade_call(payload: TradeCallCreate, db: AsyncSession = Depends(get_db)):
    """Record a new trade call. Deduplicates: same symbol+side within 4h is skipped."""
    cutoff = datetime.utcnow() - timedelta(hours=4)

    # Check for duplicate
    stmt = select(TradeCall).where(
        and_(
            TradeCall.symbol == payload.symbol,
            TradeCall.side == payload.side,
            TradeCall.created_at >= cutoff,
        )
    )
    result = await db.execute(stmt)
    existing = result.scalars().first()

    if existing:
        return {"created": False, "message": "Duplicate call (same symbol/side within 4h)", "id": existing.id}

    # Create new call
    expires = datetime.utcnow() + timedelta(hours=72)
    call = TradeCall(
        symbol=payload.symbol,
        side=payload.side,
        entry_price=payload.entry_price,
        stop_loss=payload.stop_loss,
        tp0=payload.tp0,
        tp1=payload.tp1,
        tp2=payload.tp2,
        tp3=payload.tp3,
        confidence=payload.confidence,
        reason=payload.reason,
        rsi4h=payload.rsi4h,
        has_convergence=payload.has_convergence,
        rr=payload.rr,
        status="active",
        expires_at=expires,
    )
    db.add(call)
    await db.commit()
    await db.refresh(call)

    logger.info(f"[TradeCall] Created call #{call.id}: {call.symbol} {call.side} @ {call.entry_price}")
    return {"created": True, "id": call.id}


# ── GET /api/v1/trade-calls — List calls ─────────────────────────────────────

@router.get("", response_model=list[TradeCallOut])
async def list_trade_calls(
    status: Optional[str] = Query(None, description="Filter by status: active, resolved, expired"),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
):
    """List trade calls, optionally filtered by status."""
    stmt = select(TradeCall).order_by(TradeCall.created_at.desc()).limit(limit).offset(offset)
    if status:
        stmt = stmt.where(TradeCall.status == status)
    result = await db.execute(stmt)
    return result.scalars().all()


# ── GET /api/v1/trade-calls/stats — Performance statistics ───────────────────

@router.get("/stats", response_model=dict)
async def get_trade_stats(db: AsyncSession = Depends(get_db)):
    """Get aggregated performance statistics for all resolved calls."""
    # Total counts
    total_q = await db.execute(select(func.count(TradeCall.id)))
    total = total_q.scalar() or 0

    active_q = await db.execute(select(func.count(TradeCall.id)).where(TradeCall.status == "active"))
    active = active_q.scalar() or 0

    resolved_q = await db.execute(select(func.count(TradeCall.id)).where(TradeCall.status == "resolved"))
    resolved = resolved_q.scalar() or 0

    expired_q = await db.execute(select(func.count(TradeCall.id)).where(TradeCall.status == "expired"))
    expired = expired_q.scalar() or 0

    # Win rates (resolved only — win = at least TP1 hit before SL)
    resolved_calls_q = await db.execute(
        select(TradeCall).where(TradeCall.status.in_(["resolved", "expired"]))
    )
    resolved_calls = resolved_calls_q.scalars().all()

    wins = 0
    tp0_hits = 0
    tp1_hits = 0
    tp2_hits = 0
    tp3_hits = 0
    sl_hits = 0
    long_wins = 0
    long_total = 0
    short_wins = 0
    short_total = 0
    total_profit = 0.0
    profits = []

    # By confidence bucket
    conf_buckets = {"low": {"wins": 0, "total": 0}, "mid": {"wins": 0, "total": 0}, "high": {"wins": 0, "total": 0}, "very_high": {"wins": 0, "total": 0}}

    # Win rate over time (by week)
    weekly_data: dict[str, dict] = {}

    for c in resolved_calls:
        is_win = c.tp1_hit and not c.sl_hit
        if is_win:
            wins += 1
        if c.tp0_hit:
            tp0_hits += 1
        if c.tp1_hit:
            tp1_hits += 1
        if c.tp2_hit:
            tp2_hits += 1
        if c.tp3_hit:
            tp3_hits += 1
        if c.sl_hit:
            sl_hits += 1

        if c.profit_pct is not None:
            total_profit += c.profit_pct
            profits.append(c.profit_pct)

        # Side stats
        if c.side == "LONG":
            long_total += 1
            if is_win:
                long_wins += 1
        else:
            short_total += 1
            if is_win:
                short_wins += 1

        # Confidence bucket
        if c.confidence < 50:
            bucket = "low"
        elif c.confidence < 65:
            bucket = "mid"
        elif c.confidence < 80:
            bucket = "high"
        else:
            bucket = "very_high"
        conf_buckets[bucket]["total"] += 1
        if is_win:
            conf_buckets[bucket]["wins"] += 1

        # Weekly tracking
        if c.created_at:
            week_key = c.created_at.strftime("%Y-W%W")
            if week_key not in weekly_data:
                weekly_data[week_key] = {"wins": 0, "total": 0}
            weekly_data[week_key]["total"] += 1
            if is_win:
                weekly_data[week_key]["wins"] += 1

    total_resolved = len(resolved_calls)
    win_rate = round(wins / total_resolved * 100, 1) if total_resolved > 0 else 0
    avg_profit = round(total_profit / len(profits), 2) if profits else 0

    # Weekly win rate sorted
    weekly_sorted = []
    for wk in sorted(weekly_data.keys()):
        d = weekly_data[wk]
        wr = round(d["wins"] / d["total"] * 100, 1) if d["total"] > 0 else 0
        weekly_sorted.append({"week": wk, "wins": d["wins"], "total": d["total"], "win_rate": wr})

    return {
        "total_calls": total,
        "active_calls": active,
        "resolved_calls": resolved,
        "expired_calls": expired,
        "win_rate": win_rate,
        "tp0_rate": round(tp0_hits / total_resolved * 100, 1) if total_resolved > 0 else 0,
        "tp1_rate": round(tp1_hits / total_resolved * 100, 1) if total_resolved > 0 else 0,
        "tp2_rate": round(tp2_hits / total_resolved * 100, 1) if total_resolved > 0 else 0,
        "tp3_rate": round(tp3_hits / total_resolved * 100, 1) if total_resolved > 0 else 0,
        "sl_rate": round(sl_hits / total_resolved * 100, 1) if total_resolved > 0 else 0,
        "avg_profit_pct": avg_profit,
        "long_win_rate": round(long_wins / long_total * 100, 1) if long_total > 0 else 0,
        "short_win_rate": round(short_wins / short_total * 100, 1) if short_total > 0 else 0,
        "long_total": long_total,
        "short_total": short_total,
        "confidence_buckets": {
            "<50%": {"win_rate": round(conf_buckets["low"]["wins"] / conf_buckets["low"]["total"] * 100, 1) if conf_buckets["low"]["total"] > 0 else 0, "total": conf_buckets["low"]["total"]},
            "50-65%": {"win_rate": round(conf_buckets["mid"]["wins"] / conf_buckets["mid"]["total"] * 100, 1) if conf_buckets["mid"]["total"] > 0 else 0, "total": conf_buckets["mid"]["total"]},
            "65-80%": {"win_rate": round(conf_buckets["high"]["wins"] / conf_buckets["high"]["total"] * 100, 1) if conf_buckets["high"]["total"] > 0 else 0, "total": conf_buckets["high"]["total"]},
            ">80%": {"win_rate": round(conf_buckets["very_high"]["wins"] / conf_buckets["very_high"]["total"] * 100, 1) if conf_buckets["very_high"]["total"] > 0 else 0, "total": conf_buckets["very_high"]["total"]},
        },
        "weekly_win_rate": weekly_sorted,
    }


# ── POST /api/v1/trade-calls/resolve — Check active calls against Binance ───

@router.post("/resolve", response_model=dict)
async def resolve_active_calls(db: AsyncSession = Depends(get_db)):
    """Check active calls against current Binance prices and resolve them."""
    import httpx

    stmt = select(TradeCall).where(TradeCall.status == "active")
    result = await db.execute(stmt)
    active_calls = result.scalars().all()

    if not active_calls:
        return {"resolved": 0, "expired": 0, "checked": 0}

    # Gather unique symbols
    symbols = list({c.symbol for c in active_calls})

    # Fetch current prices from Binance
    prices: dict[str, float] = {}
    async with httpx.AsyncClient(timeout=10) as client:
        for sym in symbols:
            try:
                resp = await client.get(
                    f"https://api.binance.com/api/v3/ticker/price?symbol={sym}"
                )
                if resp.status_code == 200:
                    data = resp.json()
                    prices[sym] = float(data["price"])
            except Exception as e:
                logger.warning(f"[TradeCall] Failed to fetch price for {sym}: {e}")

    now = datetime.utcnow()
    resolved_count = 0
    expired_count = 0

    for call in active_calls:
        # Check expiry (72h)
        if call.expires_at and now >= call.expires_at:
            call.status = "expired"
            call.resolved_at = now
            expired_count += 1
            logger.info(f"[TradeCall] Call #{call.id} {call.symbol} expired")
            continue

        current_price = prices.get(call.symbol)
        if current_price is None:
            continue

        # Check TP/SL hits based on side
        if call.side == "LONG":
            if current_price <= call.stop_loss:
                call.sl_hit = True
                call.status = "resolved"
                call.exit_price = current_price
                call.profit_pct = round((current_price - call.entry_price) / call.entry_price * 100, 2)
                call.resolved_at = now
                resolved_count += 1
                logger.info(f"[TradeCall] Call #{call.id} {call.symbol} LONG SL hit @ {current_price}")
                continue

            if call.tp0 and current_price >= call.tp0:
                call.tp0_hit = True
            if current_price >= call.tp1:
                call.tp0_hit = True
                call.tp1_hit = True
                call.best_tp_reached = max(call.best_tp_reached, 1)
            if current_price >= call.tp2:
                call.tp2_hit = True
                call.best_tp_reached = max(call.best_tp_reached, 2)
            if current_price >= call.tp3:
                call.tp3_hit = True
                call.best_tp_reached = max(call.best_tp_reached, 3)
                call.status = "resolved"
                call.exit_price = current_price
                call.profit_pct = round((current_price - call.entry_price) / call.entry_price * 100, 2)
                call.resolved_at = now
                resolved_count += 1
                logger.info(f"[TradeCall] Call #{call.id} {call.symbol} LONG TP3 hit @ {current_price}")

        else:  # SHORT
            if current_price >= call.stop_loss:
                call.sl_hit = True
                call.status = "resolved"
                call.exit_price = current_price
                call.profit_pct = round((call.entry_price - current_price) / call.entry_price * 100, 2)
                call.resolved_at = now
                resolved_count += 1
                logger.info(f"[TradeCall] Call #{call.id} {call.symbol} SHORT SL hit @ {current_price}")
                continue

            if call.tp0 and current_price <= call.tp0:
                call.tp0_hit = True
            if current_price <= call.tp1:
                call.tp0_hit = True
                call.tp1_hit = True
                call.best_tp_reached = max(call.best_tp_reached, 1)
            if current_price <= call.tp2:
                call.tp2_hit = True
                call.best_tp_reached = max(call.best_tp_reached, 2)
            if current_price <= call.tp3:
                call.tp3_hit = True
                call.best_tp_reached = max(call.best_tp_reached, 3)
                call.status = "resolved"
                call.exit_price = current_price
                call.profit_pct = round((call.entry_price - current_price) / call.entry_price * 100, 2)
                call.resolved_at = now
                resolved_count += 1
                logger.info(f"[TradeCall] Call #{call.id} {call.symbol} SHORT TP3 hit @ {current_price}")

    await db.commit()

    return {"resolved": resolved_count, "expired": expired_count, "checked": len(active_calls)}