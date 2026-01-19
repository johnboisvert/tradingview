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

# ============================================================================
# 🎯 PAGE PRICING COMPLÈTE - AVEC TOUS LES PLANS + STRIPE + COINBASE
# ============================================================================

@payment_router.get("/pricing-complete", response_class=HTMLResponse)
async def pricing_complete():
    """Page de pricing COMPLÈTE avec 5 plans et paiements Stripe + Coinbase"""
    return HTMLResponse("""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>💳 Plans d'Abonnement Premium - Trading Dashboard Pro</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: #0f172a; 
            color: #e2e8f0;
        }
        .container { max-width: 1400px; margin: 0 auto; padding: 40px 20px; }
        .header {
            text-align: center;
            margin-bottom: 60px;
        }
        .header h1 {
            font-size: 48px;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .header p { color: #94a3b8; font-size: 18px; }
        .pricing-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 25px;
            margin-bottom: 60px;
        }
        .pricing-card {
            background: #1e293b;
            border: 2px solid #334155;
            border-radius: 16px;
            padding: 40px 30px;
            text-align: center;
            transition: all 0.3s;
            position: relative;
            display: flex;
            flex-direction: column;
        }
        .pricing-card:hover {
            transform: translateY(-10px);
            border-color: #3b82f6;
            box-shadow: 0 20px 40px rgba(59, 130, 246, 0.2);
        }
        .pricing-card.featured {
            border-color: #3b82f6;
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
            transform: scale(1.05);
        }
        .pricing-card .badge {
            position: absolute;
            top: -15px;
            left: 50%;
            transform: translateX(-50%);
            background: #3b82f6;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        .pricing-card h3 {
            font-size: 26px;
            margin-bottom: 8px;
            margin-top: 10px;
        }
        .pricing-card p { color: #94a3b8; margin-bottom: 20px; font-size: 14px; }
        .price {
            font-size: 42px;
            font-weight: bold;
            color: #22c55e;
            margin: 20px 0;
        }
        .price small { font-size: 14px; color: #94a3b8; }
        .features {
            text-align: left;
            margin: 25px 0;
            list-style: none;
            flex-grow: 1;
        }
        .features li {
            padding: 10px 0;
            border-bottom: 1px solid #334155;
            color: #cbd5e1;
            font-size: 14px;
        }
        .features li:last-child { border-bottom: none; }
        .features li:before {
            content: "✅ ";
            color: #22c55e;
            margin-right: 8px;
        }
        .payment-buttons {
            display: flex;
            gap: 10px;
            margin-top: 30px;
            flex-wrap: wrap;
        }
        .btn-buy {
            flex: 1;
            min-width: 120px;
            padding: 12px;
            border: none;
            border-radius: 8px;
            color: white;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        .btn-stripe {
            background: #635bff;
        }
        .btn-stripe:hover {
            background: #5451f0;
            transform: scale(1.05);
        }
        .btn-coinbase {
            background: #0052ff;
        }
        .btn-coinbase:hover {
            background: #0047e6;
            transform: scale(1.05);
        }
        .btn-buy:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .free-badge {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            margin-top: 10px;
        }
        .faq {
            background: #1e293b;
            border-radius: 12px;
            padding: 40px;
            margin-top: 60px;
        }
        .faq h2 { margin-bottom: 30px; color: #3b82f6; }
        .faq-item {
            margin-bottom: 20px;
            border-bottom: 1px solid #334155;
            padding-bottom: 20px;
        }
        .faq-item strong { color: #e2e8f0; }
        .faq-item p { color: #94a3b8; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💳 Plans d'Abonnement Premium</h1>
            <p>Choisissez le plan parfait pour vos besoins de trading</p>
        </div>

        <div class="pricing-grid">
            <!-- Plan Gratuit -->
            <div class="pricing-card">
                <h3>🆓 Gratuit</h3>
                <p>Pour débuter</p>
                <div class="price">
                    $0<br><small>/mois</small>
                </div>
                <ul class="features">
                    <li>Accès limité au dashboard</li>
                    <li>Fear & Greed Index</li>
                    <li>1 alerte par semaine</li>
                    <li>Avec publicités</li>
                </ul>
                <span class="free-badge">✅ GRATUIT - Pas de paiement</span>
                <button class="btn-buy btn-stripe" onclick="alert('Accès gratuit - Pas de paiement requis')" style="margin-top: 30px; background: #10b981;">
                    Accès Gratuit
                </button>
            </div>

            <!-- Plan 1 Mois -->
            <div class="pricing-card">
                <h3>💳 1 Mois</h3>
                <p>Essai court terme</p>
                <div class="price">
                    $29.99<br><small>/mois</small>
                </div>
                <ul class="features">
                    <li>Accès complet au dashboard</li>
                    <li>Trades illimités</li>
                    <li>Tous les indicateurs IA</li>
                    <li>Webhooks TradingView</li>
                    <li>Support prioritaire</li>
                </ul>
                <div class="payment-buttons">
                    <button class="btn-buy btn-stripe" onclick="buyStripe('monthly', 29.99)">💳 Stripe</button>
                    <button class="btn-buy btn-coinbase" onclick="buyCoinbase('monthly', 29.99)">₿ Crypto</button>
                </div>
            </div>

            <!-- Plan 3 Mois (Featured) -->
            <div class="pricing-card featured">
                <div class="badge">⭐ MEILLEUR RAPPORT</div>
                <h3>💎 3 Mois</h3>
                <p>Sauvegarde 17%</p>
                <div class="price">
                    $74.97<br><small>pour 3 mois</small>
                </div>
                <ul class="features">
                    <li>Accès complet au dashboard</li>
                    <li>Trades illimités</li>
                    <li>Tous les indicateurs IA</li>
                    <li>Webhooks TradingView</li>
                    <li>Support 24/7 Premium</li>
                    <li>✨ 17% réduit</li>
                </ul>
                <div class="payment-buttons">
                    <button class="btn-buy btn-stripe" onclick="buyStripe('3months', 74.97)">💳 Stripe</button>
                    <button class="btn-buy btn-coinbase" onclick="buyCoinbase('3months', 74.97)">₿ Crypto</button>
                </div>
            </div>

            <!-- Plan 6 Mois -->
            <div class="pricing-card">
                <h3>👑 6 Mois</h3>
                <p>Sauvegarde 25%</p>
                <div class="price">
                    $134.94<br><small>pour 6 mois</small>
                </div>
                <ul class="features">
                    <li>Accès complet au dashboard</li>
                    <li>Trades illimités</li>
                    <li>Tous les indicateurs IA</li>
                    <li>Webhooks TradingView</li>
                    <li>Support 24/7 Premium</li>
                    <li>✨ 25% réduit</li>
                </ul>
                <div class="payment-buttons">
                    <button class="btn-buy btn-stripe" onclick="buyStripe('6months', 134.94)">💳 Stripe</button>
                    <button class="btn-buy btn-coinbase" onclick="buyCoinbase('6months', 134.94)">₿ Crypto</button>
                </div>
            </div>

            <!-- Plan 1 An -->
            <div class="pricing-card">
                <h3>🚀 1 An</h3>
                <p>Sauvegarde 33%</p>
                <div class="price">
                    $239.88<br><small>/an</small>
                </div>
                <ul class="features">
                    <li>Accès complet au dashboard</li>
                    <li>Trades illimités</li>
                    <li>Tous les indicateurs IA</li>
                    <li>Webhooks TradingView</li>
                    <li>Support 24/7 Premium</li>
                    <li>✨ 33% réduit</li>
                </ul>
                <div class="payment-buttons">
                    <button class="btn-buy btn-stripe" onclick="buyStripe('yearly', 239.88)">💳 Stripe</button>
                    <button class="btn-buy btn-coinbase" onclick="buyCoinbase('yearly', 239.88)">₿ Crypto</button>
                </div>
            </div>
        </div>

        <div class="faq">
            <h2>❓ Questions Fréquentes</h2>
            
            <div class="faq-item">
                <strong>💳 Quelle est la différence entre Stripe et Crypto?</strong>
                <p><strong>Stripe:</strong> Paiement par carte bancaire (Visa, Mastercard). <strong>Crypto:</strong> Paiement en Bitcoin, Ethereum, ou autres cryptomonnaies.</p>
            </div>
            
            <div class="faq-item">
                <strong>🔄 Puis-je changer de plan?</strong>
                <p>Oui! Vous pouvez upgrader ou downgrader à tout moment. Les modifications se feront au prochain cycle.</p>
            </div>
            
            <div class="faq-item">
                <strong>🔐 Est-ce sécurisé?</strong>
                <p>Oui! Stripe (PCI DSS) et Coinbase Commerce offrent la sécurité bancaire.</p>
            </div>
            
            <div class="faq-item">
                <strong>📞 Avez-vous du support?</strong>
                <p>Bien sûr! Contactez notre équipe via Telegram ou email pour toute question.</p>
            </div>
        </div>
    </div>

    <script>
        async function buyStripe(plan, amount) {
            const btn = event.target;
            btn.disabled = true;
            btn.textContent = 'Chargement...';
            
            try {
                const res = await fetch('/api/stripe-checkout', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({plan, amount, email: 'user@example.com'})
                });
                
                const data = await res.json();
                if (data.success && data.checkout_url) {
                    window.location.href = data.checkout_url;
                } else {
                    alert('Erreur: ' + (data.message || 'Impossible de créer la session'));
                    btn.disabled = false;
                    btn.textContent = '💳 Stripe';
                }
            } catch (e) {
                alert('Erreur: ' + e.message);
                btn.disabled = false;
                btn.textContent = '💳 Stripe';
            }
        }
        
        async function buyCoinbase(plan, amount) {
            const btn = event.target;
            btn.disabled = true;
            btn.textContent = 'Chargement...';
            
            try {
                const res = await fetch('/api/coinbase-checkout', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({plan, amount, email: 'user@example.com'})
                });
                
                const data = await res.json();
                if (data.success && data.hosted_url) {
                    window.location.href = data.hosted_url;
                } else {
                    alert('Erreur: ' + (data.message || 'Impossible de créer le paiement'));
                    btn.disabled = false;
                    btn.textContent = '₿ Crypto';
                }
            } catch (e) {
                alert('Erreur: ' + e.message);
                btn.disabled = false;
                btn.textContent = '₿ Crypto';
            }
        }
    </script>
</body>
</html>""")
