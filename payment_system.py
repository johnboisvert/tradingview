# -*- coding: utf-8 -*-
"""
💳 SYSTÈME DE PAIEMENT - STRIPE + COINBASE COMMERCE
Gère les abonnements avec Stripe et Coinbase Commerce
"""

import os
import json
import stripe
from datetime import datetime, timedelta

# Configuration Stripe
STRIPE_PUBLIC_KEY = os.getenv("STRIPE_PUBLIC_KEY", "")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY
    print("✅ Stripe configuré")
else:
    print("⚠️  Stripe non configuré")

# Plans d'abonnement
SUBSCRIPTION_PLANS = {
    "free": {
        "name": "Gratuit",
        "price": 0,
        "currency": "usd",
        "interval": None,
        "features": [
            "Accès limité au dashboard",
            "Fear & Greed Index",
            "1 alerte par semaine",
            "Données avec délai",
            "Avec publicités"
        ]
    },
    "monthly": {
        "name": "1 Mois",
        "price": 2999,  # $29.99 en cents
        "currency": "usd",
        "interval": "month",
        "interval_count": 1,
        "features": [
            "Accès complet au dashboard",
            "Trades illimités",
            "Tous les indicateurs IA",
            "Webhooks TradingView",
            "Support prioritaire",
            "Pas de publicités"
        ]
    },
    "3months": {
        "name": "3 Mois",
        "price": 7497,  # $74.97 (3 x $24.99, réduit)
        "currency": "usd",
        "interval": "month",
        "interval_count": 3,
        "features": [
            "Accès complet au dashboard",
            "Trades illimités",
            "Tous les indicateurs IA",
            "Webhooks TradingView",
            "Support prioritaire",
            "Pas de publicités",
            "✨ Sauvegarde 17% vs mensuel"
        ]
    },
    "6months": {
        "name": "6 Mois",
        "price": 13494,  # $134.94 (6 x $22.49, réduit)
        "currency": "usd",
        "interval": "month",
        "interval_count": 6,
        "features": [
            "Accès complet au dashboard",
            "Trades illimités",
            "Tous les indicateurs IA",
            "Webhooks TradingView",
            "Support prioritaire",
            "Pas de publicités",
            "✨ Sauvegarde 25% vs mensuel"
        ]
    },
    "yearly": {
        "name": "1 An",
        "price": 23988,  # $239.88 (12 x $19.99, réduit)
        "currency": "usd",
        "interval": "year",
        "interval_count": 1,
        "features": [
            "Accès complet au dashboard",
            "Trades illimités",
            "Tous les indicateurs IA",
            "Webhooks TradingView",
            "Support prioritaire 24/7",
            "Pas de publicités",
            "✨ Sauvegarde 33% vs mensuel"
        ]
    }
}

def get_plan_price_display(plan_key):
    """Retourne le prix formaté pour affichage"""
    plan = SUBSCRIPTION_PLANS.get(plan_key)
    if not plan:
        return "N/A"
    
    if plan_key == "free":
        return "Gratuit"
    
    price_dollars = plan["price"] / 100
    
    if plan_key == "monthly":
        return f"${price_dollars:.2f}/mois"
    elif plan_key == "3months":
        return f"${price_dollars:.2f} pour 3 mois"
    elif plan_key == "6months":
        return f"${price_dollars:.2f} pour 6 mois"
    elif plan_key == "yearly":
        return f"${price_dollars:.2f}/an"
    
    return f"${price_dollars:.2f}"

def create_stripe_checkout_session(plan_key, user_email, success_url, cancel_url):
    """Crée une session Stripe Checkout"""
    try:
        if not STRIPE_SECRET_KEY:
            return None, "Stripe non configuré"
        
        plan = SUBSCRIPTION_PLANS.get(plan_key)
        if not plan or plan_key == "free":
            return None, "Plan invalide"
        
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": plan["currency"],
                    "product_data": {
                        "name": f"Trading Dashboard Pro - {plan['name']}",
                        "description": "Accès à toutes les fonctionnalités premium"
                    },
                    "unit_amount": plan["price"],
                    "recurring": {
                        "interval": plan["interval"],
                        "interval_count": plan.get("interval_count", 1)
                    } if plan["interval"] else None
                },
                "quantity": 1,
            }],
            mode="subscription" if plan["interval"] else "payment",
            customer_email=user_email,
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "plan": plan_key,
                "user_email": user_email
            }
        )
        
        return session.url, None
    
    except Exception as e:
        print(f"❌ Stripe checkout error: {e}")
        return None, str(e)

def create_coinbase_payment(plan_key, user_email, coinbase_client):
    """Crée un paiement Coinbase Commerce"""
    try:
        if not coinbase_client:
            return None, "Coinbase non configuré"
        
        plan = SUBSCRIPTION_PLANS.get(plan_key)
        if not plan or plan_key == "free":
            return None, "Plan invalide"
        
        # Convertir cents en dollars
        amount_usd = plan["price"] / 100
        
        charge = coinbase_client.charge.create(
            name=f"Trading Dashboard Pro - {plan['name']}",
            description=f"Abonnement {plan['name']} au Trading Dashboard Pro",
            local_price={
                "amount": str(amount_usd),
                "currency": "USD"
            },
            pricing_type="fixed_price",
            receipt_email=user_email,
            metadata={
                "plan": plan_key,
                "email": user_email
            }
        )
        
        return charge, None
    
    except Exception as e:
        print(f"❌ Coinbase payment error: {e}")
        return None, str(e)

def get_subscription_expiry(plan_key):
    """Calcule la date d'expiration de l'abonnement"""
    plan = SUBSCRIPTION_PLANS.get(plan_key)
    if not plan or plan_key == "free":
        return None  # Gratuit, pas d'expiration
    
    now = datetime.now()
    
    if plan_key == "monthly":
        return now + timedelta(days=30)
    elif plan_key == "3months":
        return now + timedelta(days=90)
    elif plan_key == "6months":
        return now + timedelta(days=180)
    elif plan_key == "yearly":
        return now + timedelta(days=365)
    
    return None

print("✅ Payment system chargé")
