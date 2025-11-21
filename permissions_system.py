"""
Système de permissions pour Trading Dashboard Pro
Gère l'accès aux fonctionnalités selon le plan d'abonnement
"""

from enum import Enum
from datetime import datetime
from typing import Optional, List
from fastapi import HTTPException, Depends, Request
from fastapi.responses import JSONResponse

class SubscriptionPlan(str, Enum):
    """Plans d'abonnement disponibles"""
    FREE = "free"
    ONE_MONTH = "1_month"
    THREE_MONTHS = "3_months"
    SIX_MONTHS = "6_months"
    ONE_YEAR = "1_year"

class Feature(str, Enum):
    """Features disponibles dans l'application"""
    # Features de base (FREE)
    BASIC_DASHBOARD = "basic_dashboard"
    FEAR_GREED_CURRENT = "fear_greed_current"
    BASIC_TRADES = "basic_trades"
    
    # Features Premium (1 MOIS+)
    TRADINGVIEW_WEBHOOKS = "tradingview_webhooks"
    TELEGRAM_ALERTS = "telegram_alerts"
    TP_SL_MONITORING = "tp_sl_monitoring"
    TRADE_HISTORY_30_DAYS = "trade_history_30_days"
    
    # Features Advanced (3 MOIS+)
    AI_PREDICTIONS = "ai_predictions"
    MARKET_ANALYSIS = "market_analysis"
    FEAR_GREED_HISTORY_6M = "fear_greed_history_6m"
    TRADE_HISTORY_90_DAYS = "trade_history_90_days"
    WHALE_ALERTS = "whale_alerts"
    
    # Features Pro (6 MOIS+)
    MULTI_EXCHANGE = "multi_exchange"
    ADVANCED_ANALYTICS = "advanced_analytics"
    FEAR_GREED_HISTORY_12M = "fear_greed_history_12m"
    TRADE_HISTORY_UNLIMITED = "trade_history_unlimited"
    CUSTOM_INDICATORS = "custom_indicators"
    PRIORITY_SUPPORT = "priority_support"
    
    # Features Elite (1 AN+)
    API_ACCESS = "api_access"
    BACKTESTING = "backtesting"
    PORTFOLIO_TRACKING = "portfolio_tracking"
    TAX_REPORTS = "tax_reports"
    WHITE_LABEL = "white_label"
    DEDICATED_SUPPORT = "dedicated_support"

# Configuration des features par plan
PLAN_FEATURES = {
    SubscriptionPlan.FREE: [
        Feature.BASIC_DASHBOARD,
        Feature.FEAR_GREED_CURRENT,
        Feature.BASIC_TRADES,
    ],
    SubscriptionPlan.ONE_MONTH: [
        Feature.BASIC_DASHBOARD,
        Feature.FEAR_GREED_CURRENT,
        Feature.BASIC_TRADES,
        Feature.TRADINGVIEW_WEBHOOKS,
        Feature.TELEGRAM_ALERTS,
        Feature.TP_SL_MONITORING,
        Feature.TRADE_HISTORY_30_DAYS,
    ],
    SubscriptionPlan.THREE_MONTHS: [
        Feature.BASIC_DASHBOARD,
        Feature.FEAR_GREED_CURRENT,
        Feature.BASIC_TRADES,
        Feature.TRADINGVIEW_WEBHOOKS,
        Feature.TELEGRAM_ALERTS,
        Feature.TP_SL_MONITORING,
        Feature.TRADE_HISTORY_30_DAYS,
        Feature.AI_PREDICTIONS,
        Feature.MARKET_ANALYSIS,
        Feature.FEAR_GREED_HISTORY_6M,
        Feature.TRADE_HISTORY_90_DAYS,
        Feature.WHALE_ALERTS,
    ],
    SubscriptionPlan.SIX_MONTHS: [
        Feature.BASIC_DASHBOARD,
        Feature.FEAR_GREED_CURRENT,
        Feature.BASIC_TRADES,
        Feature.TRADINGVIEW_WEBHOOKS,
        Feature.TELEGRAM_ALERTS,
        Feature.TP_SL_MONITORING,
        Feature.TRADE_HISTORY_30_DAYS,
        Feature.AI_PREDICTIONS,
        Feature.MARKET_ANALYSIS,
        Feature.FEAR_GREED_HISTORY_6M,
        Feature.TRADE_HISTORY_90_DAYS,
        Feature.WHALE_ALERTS,
        Feature.MULTI_EXCHANGE,
        Feature.ADVANCED_ANALYTICS,
        Feature.FEAR_GREED_HISTORY_12M,
        Feature.TRADE_HISTORY_UNLIMITED,
        Feature.CUSTOM_INDICATORS,
        Feature.PRIORITY_SUPPORT,
    ],
    SubscriptionPlan.ONE_YEAR: [
        # Toutes les features
        Feature.BASIC_DASHBOARD,
        Feature.FEAR_GREED_CURRENT,
        Feature.BASIC_TRADES,
        Feature.TRADINGVIEW_WEBHOOKS,
        Feature.TELEGRAM_ALERTS,
        Feature.TP_SL_MONITORING,
        Feature.TRADE_HISTORY_30_DAYS,
        Feature.AI_PREDICTIONS,
        Feature.MARKET_ANALYSIS,
        Feature.FEAR_GREED_HISTORY_6M,
        Feature.TRADE_HISTORY_90_DAYS,
        Feature.WHALE_ALERTS,
        Feature.MULTI_EXCHANGE,
        Feature.ADVANCED_ANALYTICS,
        Feature.FEAR_GREED_HISTORY_12M,
        Feature.TRADE_HISTORY_UNLIMITED,
        Feature.CUSTOM_INDICATORS,
        Feature.PRIORITY_SUPPORT,
        Feature.API_ACCESS,
        Feature.BACKTESTING,
        Feature.PORTFOLIO_TRACKING,
        Feature.TAX_REPORTS,
        Feature.WHITE_LABEL,
        Feature.DEDICATED_SUPPORT,
    ],
}

# Messages d'upgrade en français
UPGRADE_MESSAGES = {
    SubscriptionPlan.FREE: {
        "title": "🔒 Feature Premium",
        "message": "Cette fonctionnalité nécessite un abonnement Premium (1 mois minimum).",
        "cta": "Upgrade vers Premium",
        "min_plan": "1_month"
    },
    SubscriptionPlan.ONE_MONTH: {
        "title": "🔒 Feature Advanced",
        "message": "Cette fonctionnalité nécessite un abonnement Advanced (3 mois minimum).",
        "cta": "Upgrade vers Advanced",
        "min_plan": "3_months"
    },
    SubscriptionPlan.THREE_MONTHS: {
        "title": "🔒 Feature Pro",
        "message": "Cette fonctionnalité nécessite un abonnement Pro (6 mois minimum).",
        "cta": "Upgrade vers Pro",
        "min_plan": "6_months"
    },
    SubscriptionPlan.SIX_MONTHS: {
        "title": "🔒 Feature Elite",
        "message": "Cette fonctionnalité nécessite un abonnement Elite (1 an).",
        "cta": "Upgrade vers Elite",
        "min_plan": "1_year"
    },
}

class PermissionManager:
    """Gestionnaire de permissions"""
    
    @staticmethod
    def has_feature(user_plan: str, feature: Feature) -> bool:
        """Vérifie si un plan a accès à une feature"""
        try:
            plan = SubscriptionPlan(user_plan)
            return feature in PLAN_FEATURES.get(plan, [])
        except ValueError:
            # Plan invalide = traiter comme FREE
            return feature in PLAN_FEATURES[SubscriptionPlan.FREE]
    
    @staticmethod
    def get_user_features(user_plan: str) -> List[Feature]:
        """Retourne toutes les features disponibles pour un plan"""
        try:
            plan = SubscriptionPlan(user_plan)
            return PLAN_FEATURES.get(plan, PLAN_FEATURES[SubscriptionPlan.FREE])
        except ValueError:
            return PLAN_FEATURES[SubscriptionPlan.FREE]
    
    @staticmethod
    def get_required_plan(feature: Feature) -> Optional[SubscriptionPlan]:
        """Retourne le plan minimum requis pour une feature"""
        for plan, features in PLAN_FEATURES.items():
            if feature in features:
                return plan
        return None
    
    @staticmethod
    def get_upgrade_message(current_plan: str, feature: Feature) -> dict:
        """Génère un message d'upgrade personnalisé"""
        required_plan = PermissionManager.get_required_plan(feature)
        
        if not required_plan:
            return {
                "title": "❌ Feature non disponible",
                "message": "Cette fonctionnalité n'est pas encore disponible.",
                "cta": None,
                "min_plan": None
            }
        
        try:
            current = SubscriptionPlan(current_plan)
            
            # Si le plan actuel a déjà accès
            if PermissionManager.has_feature(current_plan, feature):
                return {
                    "title": "✅ Feature disponible",
                    "message": "Vous avez accès à cette fonctionnalité.",
                    "cta": None,
                    "min_plan": None
                }
            
            # Message d'upgrade selon le plan actuel
            return UPGRADE_MESSAGES.get(current, UPGRADE_MESSAGES[SubscriptionPlan.FREE])
            
        except ValueError:
            return UPGRADE_MESSAGES[SubscriptionPlan.FREE]
    
    @staticmethod
    def is_subscription_active(subscription_end: Optional[datetime]) -> bool:
        """Vérifie si l'abonnement est actif"""
        if not subscription_end:
            return False
        return datetime.now() < subscription_end
    
    @staticmethod
    def get_plan_price(plan: str) -> float:
        """Retourne le prix d'un plan"""
        prices = {
            SubscriptionPlan.FREE: 0.0,
            SubscriptionPlan.ONE_MONTH: 29.99,
            SubscriptionPlan.THREE_MONTHS: 74.97,
            SubscriptionPlan.SIX_MONTHS: 134.94,
            SubscriptionPlan.ONE_YEAR: 239.88,
        }
        try:
            return prices.get(SubscriptionPlan(plan), 0.0)
        except ValueError:
            return 0.0
    
    @staticmethod
    def get_plan_name(plan: str) -> str:
        """Retourne le nom français du plan"""
        names = {
            SubscriptionPlan.FREE: "Gratuit",
            SubscriptionPlan.ONE_MONTH: "Premium (1 mois)",
            SubscriptionPlan.THREE_MONTHS: "Advanced (3 mois)",
            SubscriptionPlan.SIX_MONTHS: "Pro (6 mois)",
            SubscriptionPlan.ONE_YEAR: "Elite (1 an)",
        }
        try:
            return names.get(SubscriptionPlan(plan), "Gratuit")
        except ValueError:
            return "Gratuit"

# Middleware de vérification des permissions
def require_feature(feature: Feature):
    """Décorateur pour protéger les routes avec vérification de permissions"""
    def dependency(request: Request):
        # Récupérer l'utilisateur de la session
        user = request.session.get("user")
        
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Authentification requise"
            )
        
        # Récupérer le plan de l'utilisateur
        user_plan = user.get("subscription_plan", SubscriptionPlan.FREE)
        subscription_end = user.get("subscription_end")
        
        # Vérifier si l'abonnement est actif
        if not PermissionManager.is_subscription_active(subscription_end) and user_plan != SubscriptionPlan.FREE:
            # Abonnement expiré, rétrograder vers FREE
            user_plan = SubscriptionPlan.FREE
            user["subscription_plan"] = SubscriptionPlan.FREE
        
        # Vérifier les permissions
        if not PermissionManager.has_feature(user_plan, feature):
            upgrade_info = PermissionManager.get_upgrade_message(user_plan, feature)
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "permission_denied",
                    "current_plan": user_plan,
                    "required_feature": feature,
                    "upgrade_info": upgrade_info
                }
            )
        
        return user
    
    return dependency

# Fonction helper pour les templates
def check_feature_access(user: dict, feature: Feature) -> dict:
    """Vérifie l'accès à une feature et retourne les infos d'upgrade si nécessaire"""
    user_plan = user.get("subscription_plan", SubscriptionPlan.FREE)
    subscription_end = user.get("subscription_end")
    
    # Vérifier expiration
    if not PermissionManager.is_subscription_active(subscription_end) and user_plan != SubscriptionPlan.FREE:
        user_plan = SubscriptionPlan.FREE
    
    has_access = PermissionManager.has_feature(user_plan, feature)
    
    return {
        "has_access": has_access,
        "current_plan": user_plan,
        "plan_name": PermissionManager.get_plan_name(user_plan),
        "upgrade_info": None if has_access else PermissionManager.get_upgrade_message(user_plan, feature)
    }

# Export des classes et fonctions principales
__all__ = [
    'SubscriptionPlan',
    'Feature',
    'PermissionManager',
    'require_feature',
    'check_feature_access',
    'PLAN_FEATURES',
]
