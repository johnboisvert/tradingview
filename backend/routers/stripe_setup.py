"""
Stripe setup helper — endpoint pour vérifier la configuration Stripe.
"""
import logging
import os

import stripe
from fastapi import APIRouter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/stripe-setup", tags=["stripe-setup"])


@router.get("/check")
async def check_stripe_config():
    """
    Vérifie si Stripe est correctement configuré.
    Retourne le statut de la configuration sans exposer les clés.
    """
    sk = os.environ.get("STRIPE_SECRET_KEY", "")
    pk = os.environ.get("STRIPE_PUBLISHABLE_KEY", "")
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

    config_status = {
        "stripe_secret_key": {
            "configured": bool(sk),
            "mode": "live" if sk.startswith("sk_live_") else "test" if sk.startswith("sk_test_") else "missing",
            "hint": sk[:12] + "..." if sk else "NON CONFIGURÉ",
        },
        "stripe_publishable_key": {
            "configured": bool(pk),
            "mode": "live" if pk.startswith("pk_live_") else "test" if pk.startswith("pk_test_") else "missing",
            "hint": pk[:12] + "..." if pk else "NON CONFIGURÉ",
        },
        "stripe_webhook_secret": {
            "configured": bool(webhook_secret),
            "hint": "whsec_..." if webhook_secret else "NON CONFIGURÉ (optionnel mais recommandé)",
        },
        "ready": bool(sk),
    }

    # Test de connexion API Stripe si clé présente
    if sk:
        try:
            stripe.api_key = sk
            account = stripe.Account.retrieve()
            config_status["stripe_account"] = {
                "id": account.id,
                "country": account.country,
                "currency": account.default_currency,
                "charges_enabled": account.charges_enabled,
                "payouts_enabled": account.payouts_enabled,
            }
            config_status["connection"] = "✅ Connexion Stripe réussie"
        except stripe.error.AuthenticationError:
            config_status["connection"] = "❌ Clé Stripe invalide"
            config_status["ready"] = False
        except Exception as e:
            config_status["connection"] = f"⚠️ Erreur: {str(e)}"

    return config_status