"""Public + Admin pricing endpoints.

GET  /api/v1/pricing          — public, returns all plan prices
PUT  /api/v1/admin/pricing    — admin-only, upserts plan prices
"""

import logging
from typing import Optional

from core.database import get_db
from dependencies.auth import get_admin_user
from fastapi import APIRouter, Depends
from models.pricing import PlanPricing
from pydantic import BaseModel as PydanticBase
from schemas.auth import UserResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

# ── Schemas ──────────────────────────────────────────────────────────────────

class PlanPricesSchema(PydanticBase):
    premium: float = 0.0
    advanced: float = 0.0
    pro: float = 0.0
    elite: float = 0.0


class PricingResponse(PydanticBase):
    monthly: PlanPricesSchema
    annual: PlanPricesSchema
    annual_discount: float


class PricingUpdateRequest(PydanticBase):
    monthly: Optional[PlanPricesSchema] = None
    annual: Optional[PlanPricesSchema] = None
    annual_discount: Optional[float] = None


# ── Default values (match frontend DEFAULT_PLAN_PRICES) ──────────────────────

DEFAULT_MONTHLY = {"premium": 19.99, "advanced": 34.99, "pro": 54.99, "elite": 79.99}
DEFAULT_ANNUAL_DISCOUNT = 20.0


def _compute_default_annual(monthly: dict, discount: float) -> dict:
    factor = 1 - discount / 100
    return {k: round(v * factor, 2) for k, v in monthly.items()}


# ── Helpers ──────────────────────────────────────────────────────────────────

async def _get_value(db: AsyncSession, key: str) -> Optional[float]:
    result = await db.execute(select(PlanPricing).where(PlanPricing.key == key))
    row = result.scalar_one_or_none()
    return row.value if row else None


async def _upsert_value(db: AsyncSession, key: str, value: float) -> None:
    result = await db.execute(select(PlanPricing).where(PlanPricing.key == key))
    row = result.scalar_one_or_none()
    if row:
        row.value = value
    else:
        db.add(PlanPricing(key=key, value=value))


# ── Public Router ────────────────────────────────────────────────────────────

router = APIRouter(prefix="/api/v1/pricing", tags=["pricing"])


@router.get("", response_model=PricingResponse)
async def get_pricing(db: AsyncSession = Depends(get_db)):
    """Public endpoint — returns plan prices for all visitors."""
    try:
        # Monthly prices
        monthly = {}
        for plan in ("premium", "advanced", "pro", "elite"):
            val = await _get_value(db, f"monthly_{plan}")
            monthly[plan] = val if val is not None else DEFAULT_MONTHLY[plan]

        # Annual discount
        disc_val = await _get_value(db, "annual_discount")
        annual_discount = disc_val if disc_val is not None else DEFAULT_ANNUAL_DISCOUNT

        # Annual prices
        default_annual = _compute_default_annual(monthly, annual_discount)
        annual = {}
        for plan in ("premium", "advanced", "pro", "elite"):
            val = await _get_value(db, f"annual_{plan}")
            annual[plan] = val if val is not None else default_annual[plan]

        return PricingResponse(
            monthly=PlanPricesSchema(**monthly),
            annual=PlanPricesSchema(**annual),
            annual_discount=annual_discount,
        )
    except Exception as e:
        logger.error(f"Failed to fetch pricing: {e}", exc_info=True)
        # Return defaults on any DB error so the page still works
        default_annual = _compute_default_annual(DEFAULT_MONTHLY, DEFAULT_ANNUAL_DISCOUNT)
        return PricingResponse(
            monthly=PlanPricesSchema(**DEFAULT_MONTHLY),
            annual=PlanPricesSchema(**default_annual),
            annual_discount=DEFAULT_ANNUAL_DISCOUNT,
        )


# ── Admin Router ─────────────────────────────────────────────────────────────

admin_router = APIRouter(prefix="/api/v1/admin/pricing", tags=["admin-pricing"])


@admin_router.put("")
async def update_pricing(
    body: PricingUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _current_user: UserResponse = Depends(get_admin_user),
):
    """Admin-only endpoint — upsert plan prices."""
    try:
        if body.monthly:
            for plan in ("premium", "advanced", "pro", "elite"):
                await _upsert_value(db, f"monthly_{plan}", getattr(body.monthly, plan))

        if body.annual:
            for plan in ("premium", "advanced", "pro", "elite"):
                await _upsert_value(db, f"annual_{plan}", getattr(body.annual, plan))

        if body.annual_discount is not None:
            await _upsert_value(db, "annual_discount", body.annual_discount)

        await db.commit()
        return {"success": True, "message": "Pricing updated successfully"}
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to update pricing: {e}", exc_info=True)
        return {"success": False, "message": f"Failed to update pricing: {str(e)}"}