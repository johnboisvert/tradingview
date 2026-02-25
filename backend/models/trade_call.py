"""TradeCall model for tracking trading signals and their outcomes."""

from datetime import datetime

from core.database import Base
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text


class TradeCall(Base):
    __tablename__ = "trade_calls"

    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(50), nullable=False, index=True)
    side = Column(String(10), nullable=False)  # LONG or SHORT
    entry_price = Column(Float, nullable=False)
    stop_loss = Column(Float, nullable=False)
    tp0 = Column(Float, nullable=True)
    tp1 = Column(Float, nullable=False)
    tp2 = Column(Float, nullable=False)
    tp3 = Column(Float, nullable=False)
    confidence = Column(Integer, nullable=False)
    reason = Column(Text, nullable=True)
    rsi4h = Column(Float, nullable=True)
    has_convergence = Column(Boolean, default=False)
    rr = Column(Float, nullable=True)

    # Status & resolution
    status = Column(String(20), default="active")  # active, resolved, expired
    tp0_hit = Column(Boolean, default=False)
    tp1_hit = Column(Boolean, default=False)
    tp2_hit = Column(Boolean, default=False)
    tp3_hit = Column(Boolean, default=False)
    sl_hit = Column(Boolean, default=False)
    best_tp_reached = Column(Integer, default=0)  # 0, 1, 2, 3
    exit_price = Column(Float, nullable=True)
    profit_pct = Column(Float, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)