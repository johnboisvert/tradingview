"""
Routes protégées avec système de permissions
Exemples d'intégration du middleware de permissions
"""

from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse, JSONResponse
from permissions_system import (
    Feature, 
    PermissionManager, 
    require_feature, 
    check_feature_access,
    SubscriptionPlan
)
from datetime import datetime

router = APIRouter()

# Templates Jinja2 (optionnel)
try:
    from fastapi.templating import Jinja2Templates
    templates = Jinja2Templates(directory="templates")
    TEMPLATES_AVAILABLE = True
except:
    templates = None
    TEMPLATES_AVAILABLE = False
    print("⚠️  Jinja2 non disponible - templates désactivés")

# ============================================================================
# ROUTES PROTÉGÉES PAR PERMISSIONS
# ============================================================================

@router.get("/api/predictions")
async def get_ai_predictions(
    request: Request,
    user: dict = Depends(require_feature(Feature.AI_PREDICTIONS))
):
    """
    Route protégée - AI Predictions
    Nécessite: Plan 3 mois minimum
    """
    # Code de prédiction AI ici
    return JSONResponse({
        "success": True,
        "message": "Accès autorisé aux prédictions AI",
        "user_plan": user.get("subscription_plan"),
        "predictions": [
            {"symbol": "BTC", "prediction": "bullish", "confidence": 0.85},
            {"symbol": "ETH", "prediction": "neutral", "confidence": 0.65},
        ]
    })

@router.post("/api/webhook/tradingview")
async def tradingview_webhook(
    request: Request,
    user: dict = Depends(require_feature(Feature.TRADINGVIEW_WEBHOOKS))
):
    """
    Route protégée - TradingView Webhooks
    Nécessite: Plan 1 mois minimum
    """
    data = await request.json()
    
    # Traiter le webhook TradingView
    return JSONResponse({
        "success": True,
        "message": "Webhook reçu et traité",
        "user": user.get("email"),
        "alert": data
    })

@router.get("/api/whale-alerts")
async def whale_alerts(
    request: Request,
    user: dict = Depends(require_feature(Feature.WHALE_ALERTS))
):
    """
    Route protégée - Whale Alerts
    Nécessite: Plan 3 mois minimum
    """
    return JSONResponse({
        "success": True,
        "message": "Accès aux alertes whale",
        "alerts": [
            {
                "amount": 1000,
                "symbol": "BTC",
                "type": "transfer",
                "timestamp": datetime.now().isoformat()
            }
        ]
    })

@router.get("/api/advanced-analytics")
async def advanced_analytics(
    request: Request,
    user: dict = Depends(require_feature(Feature.ADVANCED_ANALYTICS))
):
    """
    Route protégée - Advanced Analytics
    Nécessite: Plan 6 mois minimum
    """
    return JSONResponse({
        "success": True,
        "message": "Accès aux analytics avancées",
        "analytics": {
            "win_rate": 0.68,
            "sharpe_ratio": 1.45,
            "max_drawdown": 0.12,
            "total_return": 0.34
        }
    })

@router.get("/api/backtesting")
async def backtesting(
    request: Request,
    user: dict = Depends(require_feature(Feature.BACKTESTING))
):
    """
    Route protégée - Backtesting
    Nécessite: Plan 1 an
    """
    return JSONResponse({
        "success": True,
        "message": "Accès au backtesting",
        "backtest_id": "bt_12345"
    })

# ============================================================================
# DASHBOARD AVEC FEATURES CONDITIONNELLES
# ============================================================================

# 🆕 TEMPORAIRE: Commenté car nécessite Jinja2
# Décommenter après avoir ajouté jinja2 dans requirements.txt

# @router.get("/dashboard-permissions", response_class=HTMLResponse)
# async def dashboard_with_permissions(request: Request):
#     """Dashboard principal avec vérification des permissions pour chaque section"""
#     
#     if not TEMPLATES_AVAILABLE:
#         return JSONResponse({"error": "Templates non disponibles"}, status_code=503)
#     
#     user = request.session.get("user")
#     if not user:
#         return templates.TemplateResponse("login.html", {
#             "request": request,
#             "error": "Veuillez vous connecter"
#         })
#     
#     # Vérifier l'accès à chaque feature
#     features_status = {
#         "basic_dashboard": check_feature_access(user, Feature.BASIC_DASHBOARD),
#         "fear_greed": check_feature_access(user, Feature.FEAR_GREED_CURRENT),
#         "fear_greed_history_6m": check_feature_access(user, Feature.FEAR_GREED_HISTORY_6M),
#         "fear_greed_history_12m": check_feature_access(user, Feature.FEAR_GREED_HISTORY_12M),
#         "tradingview_webhooks": check_feature_access(user, Feature.TRADINGVIEW_WEBHOOKS),
#         "telegram_alerts": check_feature_access(user, Feature.TELEGRAM_ALERTS),
#         "ai_predictions": check_feature_access(user, Feature.AI_PREDICTIONS),
#         "whale_alerts": check_feature_access(user, Feature.WHALE_ALERTS),
#         "advanced_analytics": check_feature_access(user, Feature.ADVANCED_ANALYTICS),
#         "backtesting": check_feature_access(user, Feature.BACKTESTING),
#         "api_access": check_feature_access(user, Feature.API_ACCESS),
#     }
#     
#     # Infos sur l'abonnement
#     subscription_info = {
#         "plan": user.get("subscription_plan", SubscriptionPlan.FREE),
#         "plan_name": PermissionManager.get_plan_name(user.get("subscription_plan", SubscriptionPlan.FREE)),
#         "is_active": PermissionManager.is_subscription_active(user.get("subscription_end")),
#         "end_date": user.get("subscription_end"),
#         "features_count": len(PermissionManager.get_user_features(user.get("subscription_plan", SubscriptionPlan.FREE)))
#     }
#     
#     return templates.TemplateResponse("dashboard_with_permissions.html", {
#         "request": request,
#         "user": user,
#         "features": features_status,
#         "subscription": subscription_info
#     })

# ============================================================================
# API DE VÉRIFICATION DES PERMISSIONS (pour JavaScript)
# ============================================================================

@router.get("/api/check-feature/{feature_name}")
async def check_feature_api(feature_name: str, request: Request):
    """API pour vérifier l'accès à une feature depuis JavaScript"""
    
    user = request.session.get("user")
    if not user:
        return JSONResponse({
            "has_access": False,
            "error": "not_authenticated"
        }, status_code=401)
    
    try:
        feature = Feature(feature_name)
        access_info = check_feature_access(user, feature)
        
        return JSONResponse({
            "has_access": access_info["has_access"],
            "current_plan": access_info["current_plan"],
            "plan_name": access_info["plan_name"],
            "upgrade_info": access_info["upgrade_info"]
        })
    
    except ValueError:
        return JSONResponse({
            "has_access": False,
            "error": "invalid_feature"
        }, status_code=400)

@router.get("/api/my-features")
async def get_my_features(request: Request):
    """Retourne toutes les features disponibles pour l'utilisateur connecté"""
    
    user = request.session.get("user")
    if not user:
        return JSONResponse({
            "error": "not_authenticated"
        }, status_code=401)
    
    user_plan = user.get("subscription_plan", SubscriptionPlan.FREE)
    features = PermissionManager.get_user_features(user_plan)
    
    return JSONResponse({
        "plan": user_plan,
        "plan_name": PermissionManager.get_plan_name(user_plan),
        "features": [f.value for f in features],
        "is_active": PermissionManager.is_subscription_active(user.get("subscription_end"))
    })

# ============================================================================
# COMPARAISON DES PLANS (Page Pricing)
# ============================================================================

@router.get("/compare-plans")
async def compare_plans(request: Request):
    """Page de comparaison des plans avec toutes les features"""
    
    plans_comparison = []
    
    for plan in SubscriptionPlan:
        features = PermissionManager.get_user_features(plan.value)
        
        plans_comparison.append({
            "plan": plan.value,
            "name": PermissionManager.get_plan_name(plan.value),
            "price": PermissionManager.get_plan_price(plan.value),
            "features_count": len(features),
            "features": [
                {
                    "name": f.value,
                    "label": f.value.replace("_", " ").title()
                }
                for f in features
            ]
        })
    
    return JSONResponse({
        "plans": plans_comparison
    })

# ============================================================================
# GESTION DES ERREURS 403 (Permission Denied)
# ============================================================================
# NOTE: L'exception handler 403 est défini dans main.py car les APIRouter
# ne supportent pas les exception_handlers (seulement l'app FastAPI principale)

# ============================================================================
# HELPERS POUR LES TEMPLATES JINJA2
# ============================================================================

def register_template_functions(templates):
    """Enregistre les fonctions helper pour les templates"""
    
    if not templates or not TEMPLATES_AVAILABLE:
        return
    
    try:
        @templates.env.globals['has_feature']
        def template_has_feature(user: dict, feature_name: str) -> bool:
            """Vérifie si l'utilisateur a accès à une feature (pour templates)"""
            try:
                feature = Feature(feature_name)
                user_plan = user.get("subscription_plan", SubscriptionPlan.FREE)
                return PermissionManager.has_feature(user_plan, feature)
            except:
                return False
        
        @templates.env.globals['get_upgrade_message']
        def template_upgrade_message(user: dict, feature_name: str) -> dict:
            """Récupère le message d'upgrade pour une feature (pour templates)"""
            try:
                feature = Feature(feature_name)
                return check_feature_access(user, feature)
            except:
                return {"has_access": False, "upgrade_info": None}
        
        @templates.env.globals['format_plan_name']
        def template_format_plan(plan: str) -> str:
            """Formate le nom du plan en français"""
            return PermissionManager.get_plan_name(plan)
    except Exception as e:
        print(f"⚠️  Erreur enregistrement template functions: {e}")

# Export du router
__all__ = ['router', 'register_template_functions']
