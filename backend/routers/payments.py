"""
Payment router — Stripe checkout sessions + Interac/Crypto instructions.
"""
import logging
import os
from typing import Literal, Optional

import stripe
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/payment", tags=["payment"])

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_stripe_key() -> str:
    key = os.environ.get("STRIPE_SECRET_KEY", "")
    if not key:
        raise HTTPException(status_code=503, detail="Stripe not configured")
    return key


def _frontend_host(request: Request) -> str:
    host = request.headers.get("App-Host", "")
    if host and not host.startswith(("http://", "https://")):
        host = f"https://{host}"
    if not host:
        origin = request.headers.get("origin", "")
        host = origin or str(request.base_url).rstrip("/")
    return host.rstrip("/")


# Plan name → display label (used in Stripe line item)
PLAN_LABELS: dict[str, str] = {
    "premium": "Abonnement Premium — CryptoIA",
    "advanced": "Abonnement Advanced — CryptoIA",
    "pro": "Abonnement Pro — CryptoIA",
    "elite": "Abonnement Elite — CryptoIA",
}

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class CreateSessionRequest(BaseModel):
    plan: Literal["premium", "advanced", "pro", "elite"]
    amount_cad: float          # price in CAD dollars (e.g. 29.99)
    promo_code: Optional[str] = None


class CreateSessionResponse(BaseModel):
    session_id: str
    url: str


class VerifyPaymentRequest(BaseModel):
    session_id: str


class VerifyPaymentResponse(BaseModel):
    status: str          # "complete" | "open" | "expired"
    payment_status: str  # "paid" | "unpaid" | "no_payment_required"
    plan: str
    amount_total: int    # cents
    currency: str


class PublishableKeyResponse(BaseModel):
    publishable_key: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/config", response_model=PublishableKeyResponse)
async def get_stripe_config():
    """Return the Stripe publishable key so the frontend can initialise Stripe.js."""
    # We derive the publishable key from the secret key prefix pattern:
    # sk_live_... → pk_live_...   |   sk_test_... → pk_test_...
    # If a separate STRIPE_PUBLISHABLE_KEY env var is set, prefer that.
    pk = os.environ.get("STRIPE_PUBLISHABLE_KEY", "")
    if not pk:
        sk = os.environ.get("STRIPE_SECRET_KEY", "")
        if sk.startswith("sk_live_"):
            pk = sk.replace("sk_live_", "pk_live_", 1)
        elif sk.startswith("sk_test_"):
            pk = sk.replace("sk_test_", "pk_test_", 1)
    return PublishableKeyResponse(publishable_key=pk)


@router.post("/create_payment_session", response_model=CreateSessionResponse)
async def create_payment_session(data: CreateSessionRequest, request: Request):
    """Create a Stripe Checkout session for a subscription plan."""
    stripe.api_key = _get_stripe_key()
    host = _frontend_host(request)

    amount_cents = int(round(data.amount_cad * 100))
    label = PLAN_LABELS.get(data.plan, f"Abonnement {data.plan.capitalize()} — CryptoIA")

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "cad",
                        "product_data": {"name": label},
                        "unit_amount": amount_cents,
                        "recurring": {"interval": "month"},
                    },
                    "quantity": 1,
                }
            ],
            mode="subscription",
            success_url=f"{host}/payment-success?session_id={{CHECKOUT_SESSION_ID}}&plan={data.plan}",
            cancel_url=f"{host}/abonnements",
            metadata={"plan": data.plan},
            allow_promotion_codes=True,
        )
        return CreateSessionResponse(session_id=session.id, url=session.url)
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")


@router.post("/verify_payment", response_model=VerifyPaymentResponse)
async def verify_payment(data: VerifyPaymentRequest):
    """Verify a Stripe Checkout session status."""
    stripe.api_key = _get_stripe_key()
    try:
        session = stripe.checkout.Session.retrieve(data.session_id)
        plan = session.metadata.get("plan", "unknown") if session.metadata else "unknown"
        return VerifyPaymentResponse(
            status=session.status,
            payment_status=session.payment_status,
            plan=plan,
            amount_total=session.amount_total or 0,
            currency=session.currency or "cad",
        )
    except stripe.error.StripeError as e:
        logger.error(f"Stripe verify error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected verify error: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")