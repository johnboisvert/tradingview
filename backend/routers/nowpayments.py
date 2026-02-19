"""
NOWPayments router — Hosted checkout + IPN webhook for crypto payments.
"""
import hashlib
import hmac
import json
import logging
import os
import time
from typing import Literal, Optional

import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/nowpayments", tags=["nowpayments"])

NOWPAYMENTS_API_URL = "https://api.nowpayments.io/v1"

PLAN_LABELS: dict[str, str] = {
    "premium": "Abonnement Premium — CryptoIA",
    "advanced": "Abonnement Advanced — CryptoIA",
    "pro": "Abonnement Pro — CryptoIA",
    "elite": "Abonnement Elite — CryptoIA",
}


def _get_api_key() -> str:
    key = os.environ.get("NOWPAYMENTS_API_KEY", "")
    if not key:
        raise HTTPException(
            status_code=503,
            detail="NOWPayments non configuré — ajoutez NOWPAYMENTS_API_KEY dans Railway"
        )
    return key


def _get_ipn_secret() -> str:
    return os.environ.get("NOWPAYMENTS_IPN_SECRET", "")


def _frontend_host(request: Request) -> str:
    host = request.headers.get("App-Host", "")
    if host and not host.startswith(("http://", "https://")):
        host = f"https://{host}"
    if not host:
        origin = request.headers.get("origin", "")
        host = origin or str(request.base_url).rstrip("/")
    return host.rstrip("/")


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class CreateCryptoPaymentRequest(BaseModel):
    plan: Literal["premium", "advanced", "pro", "elite"]
    amount_cad: float
    user_email: Optional[str] = None


class CreateCryptoPaymentResponse(BaseModel):
    payment_url: str
    payment_id: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/status")
async def nowpayments_status():
    """Check NOWPayments API connectivity."""
    api_key = _get_api_key()
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{NOWPAYMENTS_API_URL}/status",
                headers={"x-api-key": api_key},
            )
            return resp.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"NOWPayments inaccessible: {str(e)}")


@router.post("/create_payment", response_model=CreateCryptoPaymentResponse)
async def create_crypto_payment(data: CreateCryptoPaymentRequest, request: Request):
    """
    Create a NOWPayments hosted checkout link for a subscription plan.
    Returns a URL to redirect the user to the NOWPayments payment page.
    """
    api_key = _get_api_key()
    host = _frontend_host(request)

    label = PLAN_LABELS.get(data.plan, f"Abonnement {data.plan.capitalize()} — CryptoIA")
    order_id = f"cryptoia_{data.plan}_{int(time.time())}"

    payload = {
        "price_amount": round(data.amount_cad, 2),
        "price_currency": "cad",
        "order_id": order_id,
        "order_description": label,
        "ipn_callback_url": f"{host}/api/v1/nowpayments/webhook",
        "success_url": f"{host}/payment-success?provider=nowpayments&plan={data.plan}&order_id={order_id}",
        "cancel_url": f"{host}/abonnements",
        "is_fixed_rate": True,
        "is_fee_paid_by_user": False,
    }

    if data.user_email:
        payload["customer_email"] = data.user_email

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{NOWPAYMENTS_API_URL}/invoice",
                headers={
                    "x-api-key": api_key,
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            if resp.status_code != 200:
                logger.error(f"NOWPayments error {resp.status_code}: {resp.text}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Erreur NOWPayments: {resp.json().get('message', resp.text)}"
                )
            result = resp.json()
            logger.info(f"NOWPayments invoice created: id={result.get('id')}, order_id={order_id}, plan={data.plan}")
            return CreateCryptoPaymentResponse(
                payment_url=result.get("invoice_url", ""),
                payment_id=str(result.get("id", "")),
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"NOWPayments create_payment error: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")


@router.post("/webhook")
async def nowpayments_webhook(request: Request):
    """
    IPN webhook — NOWPayments calls this when a payment status changes.
    Verifies HMAC-SHA512 signature and logs plan activation on 'finished' status.

    Configurez dans NOWPayments Dashboard :
    IPN URL : https://votre-domaine.up.railway.app/api/v1/nowpayments/webhook
    """
    ipn_secret = _get_ipn_secret()
    body_bytes = await request.body()

    # Verify HMAC-SHA512 signature if secret is configured
    if ipn_secret:
        sig_header = request.headers.get("x-nowpayments-sig", "")
        try:
            body_dict = json.loads(body_bytes)
            # NOWPayments signs the sorted JSON body
            sorted_body = json.dumps(body_dict, sort_keys=True, separators=(",", ":"))
            expected_sig = hmac.new(
                ipn_secret.encode("utf-8"),
                sorted_body.encode("utf-8"),
                hashlib.sha512,
            ).hexdigest()
            if not hmac.compare_digest(expected_sig, sig_header):
                logger.warning("NOWPayments IPN signature mismatch")
                raise HTTPException(status_code=401, detail="Signature invalide")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"IPN signature verification error: {e}")
            raise HTTPException(status_code=400, detail="Corps IPN invalide")

    try:
        payload = json.loads(body_bytes)
        payment_status = payload.get("payment_status", "")
        order_id = payload.get("order_id", "")
        payment_id = str(payload.get("payment_id", ""))
        actually_paid = payload.get("actually_paid", 0)
        pay_currency = payload.get("pay_currency", "")

        logger.info(
            f"NOWPayments IPN: payment_id={payment_id}, status={payment_status}, "
            f"order_id={order_id}, paid={actually_paid} {pay_currency}"
        )

        # Extract plan from order_id (format: cryptoia_{plan}_{timestamp})
        plan = "unknown"
        if order_id.startswith("cryptoia_"):
            parts = order_id.split("_")
            if len(parts) >= 2:
                plan = parts[1]

        # Only activate on confirmed/finished status
        if payment_status in ("finished", "confirmed"):
            logger.info(f"✅ NOWPayments payment CONFIRMED: plan={plan}, order_id={order_id}, payment_id={payment_id}")
            # TODO: Activate user plan in database when user auth is implemented
            # await db.execute("UPDATE users SET plan=? WHERE nowpayments_order_id=?", plan, order_id)

        elif payment_status == "partially_paid":
            logger.warning(f"⚠️ NOWPayments partially_paid: plan={plan}, order_id={order_id}")

        elif payment_status in ("failed", "refunded", "expired"):
            logger.warning(f"❌ NOWPayments payment {payment_status}: plan={plan}, order_id={order_id}")

        return {"status": "ok", "payment_id": payment_id, "plan": plan, "payment_status": payment_status}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"IPN processing error: {e}")
        raise HTTPException(status_code=500, detail="Erreur traitement IPN")