# -*- coding: utf-8 -*-
"""
💳 PAYMENT ROUTES - STRIPE + COINBASE COMMERCE
Routes pour gérer les paiements réels Stripe et Coinbase
"""

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.responses import JSONResponse
import os
import json

payment_router = APIRouter()

# Imports optionnels
try:
    import stripe
    STRIPE_AVAILABLE = True
except ImportError:
    STRIPE_AVAILABLE = False

try:
    from payment_system import (
        create_stripe_checkout_session,
        create_coinbase_payment,
        SUBSCRIPTION_PLANS
    )
    PAYMENT_SYSTEM_AVAILABLE = True
except ImportError:
    PAYMENT_SYSTEM_AVAILABLE = False

# Configuration
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_PUBLIC_KEY = os.getenv("STRIPE_PUBLIC_KEY", "")

if STRIPE_AVAILABLE and STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

# ============================================================================
# 💳 ENDPOINTS STRIPE CHECKOUT
# ============================================================================

@payment_router.post("/stripe-checkout")
async def stripe_checkout(request: Request):
    """Crée une session Stripe Checkout"""
    try:
        data = await request.json()
        plan = data.get('plan', 'monthly')
        email = data.get('email', 'user@example.com')
        
        if not STRIPE_AVAILABLE or not STRIPE_SECRET_KEY:
            return JSONResponse({
                "success": False,
                "message": "Stripe non configuré"
            }, status_code=500)
        
        if not PAYMENT_SYSTEM_AVAILABLE:
            return JSONResponse({
                "success": False,
                "message": "Payment system non disponible"
            }, status_code=500)
        
        # URLs
        base_url = "https://tradingview-production-5763.up.railway.app"
        success_url = f"{base_url}/payment-success?plan={plan}"
        cancel_url = f"{base_url}/payment-cancel?plan={plan}"
        
        # Créer session
        checkout_url, error = create_stripe_checkout_session(
            plan, email, success_url, cancel_url
        )
        
        if error:
            return JSONResponse({
                "success": False,
                "message": error
            }, status_code=400)
        
        print(f"✅ Session Stripe: {plan} - {email}")
        return JSONResponse({
            "success": True,
            "checkout_url": checkout_url
        })
    
    except Exception as e:
        print(f"❌ Stripe error: {e}")
        return JSONResponse({
            "success": False,
            "message": str(e)
        }, status_code=500)

# ============================================================================
# 💳 ENDPOINTS COINBASE CHECKOUT
# ============================================================================

@payment_router.post("/coinbase-checkout")
async def coinbase_checkout(request: Request):
    """Crée un paiement Coinbase Commerce"""
    try:
        from coinbase_commerce import Client
        
        data = await request.json()
        plan = data.get('plan', 'monthly')
        email = data.get('email', 'user@example.com')
        
        # Vérifier Coinbase
        COINBASE_API_KEY = os.getenv("COINBASE_COMMERCE_KEY", "")
        if not COINBASE_API_KEY:
            return JSONResponse({
                "success": False,
                "message": "Coinbase Commerce non configuré"
            }, status_code=500)
        
        if not PAYMENT_SYSTEM_AVAILABLE:
            return JSONResponse({
                "success": False,
                "message": "Payment system non disponible"
            }, status_code=500)
        
        # Client Coinbase
        coinbase_client = Client(api_key=COINBASE_API_KEY)
        
        # Créer paiement
        charge, error = create_coinbase_payment(plan, email, coinbase_client)
        
        if error:
            return JSONResponse({
                "success": False,
                "message": error
            }, status_code=400)
        
        print(f"✅ Paiement Coinbase: {plan} - {email}")
        return JSONResponse({
            "success": True,
            "charge_id": charge.id,
            "hosted_url": charge.hosted_url,
            "address": charge.address,
            "plan": plan
        })
    
    except Exception as e:
        print(f"❌ Coinbase error: {e}")
        return JSONResponse({
            "success": False,
            "message": str(e)
        }, status_code=500)

# ============================================================================
# ✅ PAGES DE SUCCÈS/ANNULATION
# ============================================================================

@payment_router.get("/payment-success", response_class=HTMLResponse)
async def payment_success(plan: str = "monthly"):
    """Page de succès"""
    return HTMLResponse(f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>✅ Paiement Réussi</title>
    <style>
        body {{
            font-family: 'Segoe UI';
            background: #0f172a;
            color: #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
        }}
        .container {{
            background: #1e293b;
            padding: 60px;
            border-radius: 16px;
            text-align: center;
            max-width: 600px;
        }}
        .checkmark {{ font-size: 80px; margin-bottom: 20px; }}
        h1 {{ color: #22c55e; margin-bottom: 20px; }}
        p {{ color: #cbd5e1; font-size: 18px; line-height: 1.6; margin-bottom: 30px; }}
        .plan {{ background: #0f172a; padding: 20px; border-radius: 8px; margin: 30px 0; color: #3b82f6; font-weight: 600; }}
        a {{ display: inline-block; margin-top: 30px; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; }}
        a:hover {{ background: #2563eb; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="checkmark">✅</div>
        <h1>Paiement Réussi!</h1>
        <p>Merci! Votre abonnement est actif.</p>
        <div class="plan">Plan: {plan.upper()}</div>
        <p>Vous avez accès à TOUTES les fonctionnalités premium!</p>
        <a href="/">Retour au Dashboard</a>
    </div>
</body>
</html>""")

@payment_router.get("/payment-cancel", response_class=HTMLResponse)
async def payment_cancel(plan: str = "monthly"):
    """Page d'annulation"""
    return HTMLResponse("""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>❌ Paiement Annulé</title>
    <style>
        body {{
            font-family: 'Segoe UI';
            background: #0f172a;
            color: #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
        }}
        .container {{
            background: #1e293b;
            padding: 60px;
            border-radius: 16px;
            text-align: center;
            max-width: 600px;
        }}
        .icon {{ font-size: 80px; margin-bottom: 20px; }}
        h1 {{ color: #ef4444; margin-bottom: 20px; }}
        p {{ color: #cbd5e1; font-size: 18px; line-height: 1.6; margin-bottom: 30px; }}
        a {{ display: inline-block; margin-top: 30px; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; }}
        a:hover {{ background: #2563eb; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">❌</div>
        <h1>Paiement Annulé</h1>
        <p>Vous pouvez réessayer quand vous le souhaitez.</p>
        <a href="/pricing-new">Retour aux Plans</a>
    </div>
</body>
</html>""")

print("✅ Payment routes chargées")
