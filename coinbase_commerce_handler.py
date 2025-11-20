"""
COINBASE COMMERCE HANDLER
Gère les paiements en cryptomonnaies (BTC, ETH, USDC, etc.)
"""

import os
import json
import hmac
import hashlib
from datetime import datetime
from typing import Dict, Optional
import httpx
from starlette.requests import Request
from starlette.responses import JSONResponse

# Configuration Coinbase Commerce
COINBASE_API_KEY = os.getenv("COINBASE_COMMERCE_KEY")
COINBASE_WEBHOOK_SECRET = os.getenv("COINBASE_WEBHOOK_SECRET")
COINBASE_API_URL = "https://api.commerce.coinbase.com"

# Prix des plans en USD (vous pouvez les modifier)
PLAN_PRICES = {
    "premium": 19.99,
    "vip": 49.99
}

# ═══════════════════════════════════════════════════════════════════════════════
# 1️⃣ CRÉER UNE CHARGE (INVOICE) COINBASE
# ═══════════════════════════════════════════════════════════════════════════════

async def create_coinbase_charge(
    plan_name: str,
    user_email: str,
    user_id: int
) -> Dict:
    """
    Crée une charge (invoice) Coinbase Commerce
    
    Retourne:
    {
        "success": True/False,
        "charge_id": "xxxxx",
        "hosted_url": "https://commerce.coinbase.com/charges/xxxxx",
        "error": "message d'erreur si échouée"
    }
    """
    
    if not COINBASE_API_KEY:
        return {
            "success": False,
            "error": "COINBASE_COMMERCE_KEY non configurée"
        }
    
    plan_name = plan_name.lower()
    if plan_name not in PLAN_PRICES:
        return {
            "success": False,
            "error": f"Plan '{plan_name}' inconnu"
        }
    
    price_usd = PLAN_PRICES[plan_name]
    
    # Préparer les données de la charge
    charge_data = {
        "name": f"Plan {plan_name.upper()} - Trading Dashboard",
        "description": f"Abonnement {plan_name} mensuel",
        "pricing_type": "fixed_price",
        "local_price": {
            "amount": str(price_usd),
            "currency": "USD"
        },
        "metadata": {
            "plan": plan_name,
            "user_id": str(user_id),
            "user_email": user_email
        },
        "redirect_url": f"{os.getenv('APP_URL', 'http://localhost:8000')}/crypto-success",
        "cancel_url": f"{os.getenv('APP_URL', 'http://localhost:8000')}/pricing"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{COINBASE_API_URL}/charges",
                json=charge_data,
                headers={
                    "X-CC-Api-Key": COINBASE_API_KEY,
                    "X-CC-Version": "2018-03-22",
                    "Content-Type": "application/json"
                },
                timeout=10
            )
        
        if response.status_code != 201:
            print(f"❌ Coinbase error: {response.status_code} - {response.text}")
            return {
                "success": False,
                "error": f"Erreur Coinbase: {response.status_code}"
            }
        
        data = response.json()
        charge = data.get("data", {})
        
        return {
            "success": True,
            "charge_id": charge.get("id"),
            "hosted_url": charge.get("hosted_url"),
            "address": charge.get("address"),
            "amount": charge.get("local_price", {}).get("amount")
        }
    
    except Exception as e:
        print(f"❌ Exception creating Coinbase charge: {e}")
        return {
            "success": False,
            "error": str(e)
        }

# ═══════════════════════════════════════════════════════════════════════════════
# 2️⃣ RÉCUPÉRER LES DÉTAILS D'UNE CHARGE
# ═══════════════════════════════════════════════════════════════════════════════

async def get_coinbase_charge(charge_id: str) -> Dict:
    """Récupère les détails d'une charge Coinbase"""
    
    if not COINBASE_API_KEY:
        return {"success": False, "error": "API key not configured"}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{COINBASE_API_URL}/charges/{charge_id}",
                headers={
                    "X-CC-Api-Key": COINBASE_API_KEY,
                    "X-CC-Version": "2018-03-22"
                },
                timeout=10
            )
        
        if response.status_code != 200:
            return {"success": False, "error": f"Status {response.status_code}"}
        
        return {
            "success": True,
            "data": response.json().get("data", {})
        }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

# ═══════════════════════════════════════════════════════════════════════════════
# 3️⃣ VÉRIFIER LA SIGNATURE DU WEBHOOK (SÉCURITÉ!)
# ═══════════════════════════════════════════════════════════════════════════════

def verify_coinbase_webhook(request_body: bytes, signature_header: str) -> bool:
    """
    Vérifie que le webhook vient vraiment de Coinbase
    
    ⚠️  TRÈS IMPORTANT pour la sécurité!
    """
    
    if not COINBASE_WEBHOOK_SECRET:
        print("❌ COINBASE_WEBHOOK_SECRET not configured!")
        return False
    
    try:
        # Créer la signature attendue
        expected_signature = hmac.new(
            COINBASE_WEBHOOK_SECRET.encode(),
            request_body,
            hashlib.sha256
        ).hexdigest()
        
        # Comparer avec celle reçue
        return hmac.compare_digest(expected_signature, signature_header)
    
    except Exception as e:
        print(f"❌ Webhook verification error: {e}")
        return False

# ═══════════════════════════════════════════════════════════════════════════════
# 4️⃣ TRAITER LES ÉVÉNEMENTS WEBHOOK
# ═══════════════════════════════════════════════════════════════════════════════

def process_coinbase_webhook_event(event: Dict) -> Dict:
    """
    Traite les événements du webhook Coinbase
    
    Les événements importants:
    - charge:confirmed → Paiement confirmé ✅
    - charge:failed → Paiement échoué ❌
    - charge:delayed → En attente ⏳
    """
    
    event_type = event.get("type")
    charge = event.get("data", {})
    
    return {
        "event_type": event_type,
        "charge_id": charge.get("id"),
        "status": charge.get("status"),
        "amount": charge.get("local_price", {}).get("amount"),
        "user_id": charge.get("metadata", {}).get("user_id"),
        "plan": charge.get("metadata", {}).get("plan"),
        "user_email": charge.get("metadata", {}).get("user_email"),
        "received_at": charge.get("received_at")
    }

# ═══════════════════════════════════════════════════════════════════════════════
# 5️⃣ ROUTES FASTAPI POUR COINBASE
# ═══════════════════════════════════════════════════════════════════════════════

async def route_create_coinbase_charge(request: Request):
    """
    POST /api/crypto/create-charge
    
    Crée une charge Coinbase pour un plan spécifique
    Body: {"plan": "premium", "user_id": 1, "user_email": "user@example.com"}
    """
    
    try:
        body = await request.json()
        plan = body.get("plan", "").lower()
        user_id = body.get("user_id")
        user_email = body.get("user_email")
        
        if not all([plan, user_id, user_email]):
            return JSONResponse(
                {"success": False, "error": "Missing fields"},
                status_code=400
            )
        
        result = await create_coinbase_charge(plan, user_email, user_id)
        
        if result["success"]:
            return JSONResponse({
                "success": True,
                "hosted_url": result["hosted_url"],
                "charge_id": result["charge_id"]
            })
        else:
            return JSONResponse(
                {"success": False, "error": result["error"]},
                status_code=400
            )
    
    except Exception as e:
        return JSONResponse(
            {"success": False, "error": str(e)},
            status_code=500
        )

async def route_webhook_coinbase(request: Request):
    """
    POST /webhook/coinbase
    
    Reçoit les événements Coinbase Commerce
    (charge:confirmed, charge:failed, etc.)
    """
    
    # Récupérer le body brut pour vérifier la signature
    body = await request.body()
    signature = request.headers.get("X-CC-Webhook-Signature", "")
    
    # ⚠️ VÉRIFIER QUE C'EST VRAIMENT COINBASE!
    if not verify_coinbase_webhook(body, signature):
        print("❌ Invalid Coinbase webhook signature!")
        return JSONResponse(
            {"error": "Invalid signature"},
            status_code=401
        )
    
    try:
        event = json.loads(body)
        
        # Traiter l'événement
        event_data = process_coinbase_webhook_event(event)
        
        print(f"✅ Événement Coinbase reçu: {event_data['event_type']}")
        print(f"   Charge ID: {event_data['charge_id']}")
        print(f"   Status: {event_data['status']}")
        print(f"   Plan: {event_data['plan']}")
        print(f"   User ID: {event_data['user_id']}")
        
        # ⚠️ À FAIRE: Activer l'abonnement de l'utilisateur
        # On va le faire dans subscription_system.py
        # et l'appeler depuis ici!
        
        return JSONResponse({"success": True})
    
    except Exception as e:
        print(f"❌ Webhook processing error: {e}")
        return JSONResponse(
            {"error": str(e)},
            status_code=500
        )

async def route_check_charge_status(request: Request, charge_id: str):
    """
    GET /api/crypto/charge/{charge_id}
    
    Vérifie le statut d'une charge Coinbase
    """
    
    result = await get_coinbase_charge(charge_id)
    
    if result["success"]:
        charge = result["data"]
        return JSONResponse({
            "success": True,
            "status": charge.get("status"),
            "amount": charge.get("local_price", {}).get("amount"),
            "timeline": charge.get("timeline", [])
        })
    else:
        return JSONResponse(
            {"success": False, "error": result["error"]},
            status_code=400
        )

async def route_crypto_success(request: Request):
    """
    GET /crypto-success?chargeId=xxxxx
    
    Page affichée après paiement confirmé
    """
    
    charge_id = request.query_params.get("chargeId", "")
    
    if not charge_id:
        return JSONResponse(
            {"error": "Missing chargeId"},
            status_code=400
        )
    
    # Vérifier le statut de la charge
    result = await get_coinbase_charge(charge_id)
    
    if not result["success"]:
        return JSONResponse(
            {"error": "Charge not found"},
            status_code=404
        )
    
    charge = result["data"]
    status = charge.get("status")
    
    # Retourner une réponse simple (vous pouvez créer une page HTML)
    return JSONResponse({
        "success": True,
        "message": "Paiement reçu!",
        "status": status,
        "amount": charge.get("local_price", {}).get("amount")
    })

# ═══════════════════════════════════════════════════════════════════════════════
# 🧪 TEST: Vérifier la connexion Coinbase
# ═══════════════════════════════════════════════════════════════════════════════

async def test_coinbase_connection() -> bool:
    """Teste si la connexion à Coinbase fonctionne"""
    
    if not COINBASE_API_KEY:
        print("❌ COINBASE_COMMERCE_KEY not configured")
        return False
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{COINBASE_API_URL}/charges",
                headers={
                    "X-CC-Api-Key": COINBASE_API_KEY,
                    "X-CC-Version": "2018-03-22"
                },
                timeout=10
            )
        
        if response.status_code == 200:
            print("✅ Coinbase Commerce connection OK!")
            return True
        else:
            print(f"❌ Coinbase error: {response.status_code}")
            return False
    
    except Exception as e:
        print(f"❌ Coinbase connection error: {e}")
        return False
