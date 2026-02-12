# -*- coding: utf-8 -*-
"""
🌐 ROUTES API - DONNÉES CRYPTO EN TEMPS RÉEL
Endpoints REST pour le frontend
"""

from fastapi import APIRouter, HTTPException, Query, Depends, Request
from fastapi.responses import JSONResponse
from typing import Optional, List
from datetime import datetime

# Import des services
try:
    from crypto_data_service import crypto_service
except ImportError:
    crypto_service = None
    print("⚠️ crypto_data_service non disponible")

try:
    from auth_service import auth_service
except ImportError:
    auth_service = None
    print("⚠️ auth_service non disponible")

# Router API
api_router = APIRouter(prefix="/api/v2", tags=["API v2"])


# ============================================================================
# 🔐 MIDDLEWARE D'AUTHENTIFICATION
# ============================================================================

async def get_current_user(request: Request) -> Optional[dict]:
    """Récupère l'utilisateur courant depuis la session ou le token"""
    # Vérifier le token dans les headers
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        if auth_service:
            user = auth_service.validate_session(token)
            if user:
                return user
    
    # Vérifier la session
    session_token = request.cookies.get("session_token")
    if session_token and auth_service:
        user = auth_service.validate_session(session_token)
        if user:
            return user
    
    return None


async def require_auth(request: Request) -> dict:
    """Middleware qui requiert une authentification"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentification requise")
    return user


# ============================================================================
# 📊 ENDPOINTS MARKET DATA
# ============================================================================

@api_router.get("/prices")
async def get_prices(
    symbols: str = Query(default="bitcoin,ethereum,solana", description="IDs séparés par virgule")
):
    """
    Récupère les prix actuels des cryptos
    
    - **symbols**: Liste d'IDs CoinGecko séparés par virgule
    """
    if not crypto_service:
        raise HTTPException(status_code=503, detail="Service non disponible")
    
    try:
        symbol_list = [s.strip().lower() for s in symbols.split(",")]
        data = await crypto_service.get_crypto_prices(symbol_list)
        
        return {
            "success": True,
            "data": data,
            "timestamp": datetime.now().isoformat(),
            "source": "CoinGecko"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/market-overview")
async def get_market_overview():
    """
    Vue d'ensemble du marché crypto
    
    Inclut: market cap total, volume 24h, dominance BTC/ETH, etc.
    """
    if not crypto_service:
        raise HTTPException(status_code=503, detail="Service non disponible")
    
    try:
        data = await crypto_service.get_market_overview()
        
        return {
            "success": True,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/top-coins")
async def get_top_coins(
    limit: int = Query(default=20, ge=1, le=100, description="Nombre de coins")
):
    """
    Top N cryptos par market cap
    
    - **limit**: Nombre de coins à retourner (1-100)
    """
    if not crypto_service:
        raise HTTPException(status_code=503, detail="Service non disponible")
    
    try:
        data = await crypto_service.get_top_coins(limit)
        
        return {
            "success": True,
            "data": data,
            "count": len(data),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/trending")
async def get_trending():
    """
    Cryptos trending (les plus recherchées)
    """
    if not crypto_service:
        raise HTTPException(status_code=503, detail="Service non disponible")
    
    try:
        data = await crypto_service.get_trending_coins()
        
        return {
            "success": True,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# 😱 FEAR & GREED INDEX
# ============================================================================

@api_router.get("/fear-greed")
async def get_fear_greed(
    limit: int = Query(default=1, ge=1, le=30, description="Jours d'historique")
):
    """
    Fear & Greed Index
    
    - **limit**: Nombre de jours d'historique (1-30)
    """
    if not crypto_service:
        raise HTTPException(status_code=503, detail="Service non disponible")
    
    try:
        data = await crypto_service.get_fear_greed_index(limit)
        
        return {
            "success": True,
            "data": data,
            "timestamp": datetime.now().isoformat(),
            "source": "Alternative.me"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# 🐋 WHALE TRANSACTIONS
# ============================================================================

@api_router.get("/whale-transactions")
async def get_whale_transactions(
    min_btc: float = Query(default=100.0, ge=10, description="Montant minimum en BTC"),
    limit: int = Query(default=20, ge=1, le=50, description="Nombre de transactions")
):
    """
    Transactions whale BTC récentes
    
    - **min_btc**: Montant minimum en BTC
    - **limit**: Nombre de transactions à retourner
    """
    if not crypto_service:
        raise HTTPException(status_code=503, detail="Service non disponible")
    
    try:
        data = await crypto_service.get_whale_transactions(min_btc, limit)
        
        return {
            "success": True,
            "data": data,
            "count": len(data),
            "timestamp": datetime.now().isoformat(),
            "source": "Blockchain.info"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# 📈 HISTORIQUE
# ============================================================================

@api_router.get("/history/{coin_id}")
async def get_price_history(
    coin_id: str,
    days: int = Query(default=30, ge=1, le=365, description="Nombre de jours")
):
    """
    Historique des prix d'une crypto
    
    - **coin_id**: ID CoinGecko (ex: bitcoin, ethereum)
    - **days**: Nombre de jours d'historique (1-365)
    """
    if not crypto_service:
        raise HTTPException(status_code=503, detail="Service non disponible")
    
    try:
        data = await crypto_service.get_price_history(coin_id.lower(), days)
        
        return {
            "success": True,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# 🔍 RECHERCHE
# ============================================================================

@api_router.get("/search")
async def search_coins(
    q: str = Query(..., min_length=1, description="Terme de recherche")
):
    """
    Recherche de cryptos par nom ou symbole
    
    - **q**: Terme de recherche
    """
    if not crypto_service:
        raise HTTPException(status_code=503, detail="Service non disponible")
    
    try:
        data = await crypto_service.search_coins(q)
        
        return {
            "success": True,
            "data": data,
            "query": q,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# 🔧 META & STATUS
# ============================================================================

@api_router.get("/meta/status")
async def get_status():
    """
    Statut de l'API et des services
    """
    return {
        "ok": True,
        "services": {
            "crypto_data": crypto_service is not None,
            "auth": auth_service is not None
        },
        "sources": ["CoinGecko", "Binance", "Alternative.me", "Blockchain.info"],
        "server_time_utc": datetime.utcnow().isoformat(),
        "server_time_local": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "version": "2.0.0"
    }


@api_router.get("/meta/health")
async def health_check():
    """
    Health check pour les load balancers
    """
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


# ============================================================================
# 🔐 AUTHENTIFICATION
# ============================================================================

@api_router.post("/auth/login")
async def login(request: Request):
    """
    Connexion utilisateur
    """
    if not auth_service:
        raise HTTPException(status_code=503, detail="Service non disponible")
    
    try:
        data = await request.json()
        email = data.get("email", "").strip()
        password = data.get("password", "")
        
        if not email or not password:
            raise HTTPException(status_code=400, detail="Email et mot de passe requis")
        
        # Récupérer l'IP
        ip_address = request.client.host if request.client else None
        
        result = auth_service.authenticate(email, password, ip_address)
        
        if "error" in result:
            raise HTTPException(status_code=401, detail=result["message"])
        
        response = JSONResponse({
            "success": True,
            "user": result,
            "message": "Connexion réussie"
        })
        
        # Définir le cookie de session
        response.set_cookie(
            key="session_token",
            value=result["session_token"],
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=86400  # 24 heures
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/auth/register")
async def register(request: Request):
    """
    Inscription utilisateur
    """
    if not auth_service:
        raise HTTPException(status_code=503, detail="Service non disponible")
    
    try:
        data = await request.json()
        email = data.get("email", "").strip()
        username = data.get("username", "").strip()
        password = data.get("password", "")
        
        if not email or not username or not password:
            raise HTTPException(status_code=400, detail="Tous les champs sont requis")
        
        if len(password) < 8:
            raise HTTPException(status_code=400, detail="Le mot de passe doit avoir au moins 8 caractères")
        
        user = auth_service.create_user(email, username, password)
        
        if not user:
            raise HTTPException(status_code=409, detail="Cet email est déjà utilisé")
        
        return {
            "success": True,
            "message": "Compte créé avec succès",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/auth/logout")
async def logout(request: Request):
    """
    Déconnexion utilisateur
    """
    if not auth_service:
        raise HTTPException(status_code=503, detail="Service non disponible")
    
    try:
        token = request.cookies.get("session_token")
        if token:
            auth_service.logout(token)
        
        response = JSONResponse({
            "success": True,
            "message": "Déconnexion réussie"
        })
        
        response.delete_cookie("session_token")
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/auth/me")
async def get_current_user_info(user: dict = Depends(require_auth)):
    """
    Récupère les informations de l'utilisateur connecté
    """
    return {
        "success": True,
        "user": user
    }


print("✅ Routes API v2 chargées")