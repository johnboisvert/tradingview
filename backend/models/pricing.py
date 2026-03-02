"""PlanPricing model — stores subscription plan prices in the database."""

from models.base import BaseModel
from sqlalchemy import Column, Float, String


class PlanPricing(BaseModel):
    __tablename__ = "plan_pricing"

    key = Column(String(50), unique=True, nullable=False, index=True)
    # key values: "monthly_premium", "monthly_advanced", "monthly_pro", "monthly_elite",
    #             "annual_premium", "annual_advanced", "annual_pro", "annual_elite",
    #             "annual_discount"
    value = Column(Float, nullable=False, default=0.0)