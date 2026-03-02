"""
Payment router — Stripe checkout sessions + webhook pour activation sécurisée.
"""
import json
import logging
from datetime import datetime, timedelta
from typing import Literal, Optional

import stripe
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/payment", tags=["payment"])

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_stripe_key() -> str:
    key = settings.stripe_secret_key
    if not key:
        raise HTTPException(
            status_code=503,
            detail="Stripe non configuré — ajoutez STRIPE_SECRET_KEY dans les variables d'environnement Railway"
        )
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
    billing_period: Literal["monthly", "annual"] = "monthly"
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
    billing_period: str  # "monthly" | "annual"
    subscription_end: str  # ISO date string


class PublishableKeyResponse(BaseModel):
    publishable_key: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/config", response_model=PublishableKeyResponse)
async def get_stripe_config():
    """Return the Stripe publishable key so the frontend can initialise Stripe.js."""
    pk = settings.stripe_publishable_key
    if not pk:
        sk = settings.stripe_secret_key
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

    is_annual = data.billing_period == "annual"

    if is_annual:
        # For annual billing: charge the full annual amount as a single payment
        # then create a yearly recurring subscription
        amount_cents = int(round(data.amount_cad * 100))
        interval = "year"
        interval_count = 1
    else:
        # Monthly billing
        amount_cents = int(round(data.amount_cad * 100))
        interval = "month"
        interval_count = 1

    label = PLAN_LABELS.get(data.plan, f"Abonnement {data.plan.capitalize()} — CryptoIA")
    if is_annual:
        label += " (Annuel)"

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "cad",
                        "product_data": {"name": label},
                        "unit_amount": amount_cents,
                        "recurring": {
                            "interval": interval,
                            "interval_count": interval_count,
                        },
                    },
                    "quantity": 1,
                }
            ],
            mode="subscription",
            success_url=f"{host}/payment-success?session_id={{CHECKOUT_SESSION_ID}}&plan={data.plan}&billing={data.billing_period}",
            cancel_url=f"{host}/abonnements",
            metadata={
                "plan": data.plan,
                "billing_period": data.billing_period,
            },
            allow_promotion_codes=True,
        )
        logger.info(f"Stripe session created: {session.id} for plan={data.plan}, billing={data.billing_period}")
        return CreateSessionResponse(session_id=session.id, url=session.url)
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail=str(e.user_message if hasattr(e, 'user_message') else str(e)))
    except Exception as e:
        logger.error(f"Unexpected error creating Stripe session: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")


@router.post("/verify_payment", response_model=VerifyPaymentResponse)
async def verify_payment(data: VerifyPaymentRequest):
    """Verify a Stripe Checkout session status and activate plan if paid."""
    stripe.api_key = _get_stripe_key()
    try:
        session = stripe.checkout.Session.retrieve(data.session_id)
        metadata = session.metadata or {}
        plan = metadata.get("plan", "unknown")
        billing_period = metadata.get("billing_period", "monthly")

        # Calculate subscription end date
        now = datetime.utcnow()
        if billing_period == "annual":
            subscription_end = (now + timedelta(days=365)).strftime("%Y-%m-%d")
        else:
            subscription_end = (now + timedelta(days=30)).strftime("%Y-%m-%d")

        logger.info(
            f"Stripe verify: session={data.session_id}, status={session.status}, "
            f"plan={plan}, billing={billing_period}, end={subscription_end}"
        )

        return VerifyPaymentResponse(
            status=session.status,
            payment_status=session.payment_status,
            plan=plan,
            amount_total=session.amount_total or 0,
            currency=session.currency or "cad",
            billing_period=billing_period,
            subscription_end=subscription_end,
        )
    except stripe.error.StripeError as e:
        logger.error(f"Stripe verify error: {e}")
        raise HTTPException(status_code=400, detail=str(e.user_message if hasattr(e, 'user_message') else str(e)))
    except Exception as e:
        logger.error(f"Unexpected verify error: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")


@router.post("/stripe_webhook")
async def stripe_webhook(request: Request):
    """
    Stripe webhook — reçoit les événements Stripe et active le plan après paiement confirmé.
    Configurez l'URL dans Stripe Dashboard : https://dashboard.stripe.com/webhooks
    URL : https://votre-domaine.up.railway.app/api/v1/payment/stripe_webhook
    Événements à activer : checkout.session.completed, invoice.payment_succeeded
    """
    webhook_secret = settings.stripe_webhook_secret
    body = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        if webhook_secret and sig_header:
            # Vérification de signature Stripe (recommandé en production)
            stripe.api_key = settings.stripe_secret_key
            event = stripe.Webhook.construct_event(body, sig_header, webhook_secret)
        else:
            # Mode développement sans signature (à éviter en production)
            logger.warning("Stripe webhook reçu sans vérification de signature — configurez STRIPE_WEBHOOK_SECRET")
            event = json.loads(body)
    except ValueError:
        logger.error("Stripe webhook: corps invalide")
        raise HTTPException(status_code=400, detail="Corps invalide")
    except stripe.error.SignatureVerificationError:
        logger.error("Stripe webhook: signature invalide")
        raise HTTPException(status_code=401, detail="Signature Stripe invalide")

    event_type = event.get("type") if isinstance(event, dict) else event.type

    # ── checkout.session.completed ──────────────────────────────────────────
    if event_type == "checkout.session.completed":
        session_obj = event["data"]["object"] if isinstance(event, dict) else event.data.object
        session_id = session_obj.get("id") if isinstance(session_obj, dict) else session_obj.id
        metadata = session_obj.get("metadata", {}) if isinstance(session_obj, dict) else (session_obj.metadata or {})
        payment_status = session_obj.get("payment_status", "") if isinstance(session_obj, dict) else session_obj.payment_status
        plan = metadata.get("plan", "unknown")
        billing_period = metadata.get("billing_period", "monthly")
        customer_email = (
            session_obj.get("customer_details", {}).get("email", "")
            if isinstance(session_obj, dict)
            else getattr(getattr(session_obj, "customer_details", None), "email", "")
        )

        logger.info(
            f"✅ Stripe checkout.session.completed: session={session_id}, plan={plan}, "
            f"billing={billing_period}, payment_status={payment_status}, email={customer_email}"
        )

        # TODO: Activate plan in database when user auth is fully implemented
        # await db.execute(
        #     "UPDATE users SET plan=?, billing_period=?, subscription_end=? WHERE email=?",
        #     plan, billing_period, subscription_end, customer_email
        # )

    # ── invoice.payment_succeeded (renouvellements) ─────────────────────────
    elif event_type == "invoice.payment_succeeded":
        invoice = event["data"]["object"] if isinstance(event, dict) else event.data.object
        subscription_id = invoice.get("subscription") if isinstance(invoice, dict) else invoice.subscription
        customer_id = invoice.get("customer") if isinstance(invoice, dict) else invoice.customer
        logger.info(f"✅ Stripe invoice.payment_succeeded: subscription={subscription_id}, customer={customer_id}")

    # ── customer.subscription.deleted (annulation) ──────────────────────────
    elif event_type == "customer.subscription.deleted":
        subscription = event["data"]["object"] if isinstance(event, dict) else event.data.object
        customer_id = subscription.get("customer") if isinstance(subscription, dict) else subscription.customer
        logger.info(f"❌ Stripe subscription.deleted: customer={customer_id}")
        # TODO: Reset plan to "free" in database

    else:
        logger.info(f"Stripe webhook event (unhandled): {event_type}")

    return {"status": "ok"}