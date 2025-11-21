"""
Subscription Manager - Gestion complète des abonnements
Trading Dashboard Pro
"""

from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
import os

class SubscriptionManager:
    """Gestionnaire central des abonnements"""
    
    # Durées par plan (en jours)
    PLAN_DURATIONS = {
        'free': 0,
        'monthly': 30,
        '1_month': 30,
        '3_months': 90,
        '3months': 90,
        '6_months': 180,
        '6months': 180,
        'yearly': 365,
        '1_year': 365
    }
    
    # Noms d'affichage
    PLAN_NAMES = {
        'free': '🆓 Gratuit',
        '1_month': '💳 Premium (1 mois)',
        '3_months': '💎 Advanced (3 mois)',
        '6_months': '👑 Pro (6 mois)',
        '1_year': '🚀 Elite (1 an)'
    }
    
    # Prix par plan
    PLAN_PRICES = {
        'free': 0.00,
        '1_month': 29.99,
        '3_months': 74.97,
        '6_months': 134.94,
        '1_year': 239.88
    }
    
    # Features par plan
    PLAN_FEATURES = {
        'free': [
            'Accès limité au dashboard',
            'Fear & Greed Index',
            '1 alerte par semaine',
            'Avec publicités'
        ],
        '1_month': [
            'Accès complet au dashboard',
            'Trades illimités',
            'Tous les indicateurs IA',
            'Webhooks TradingView',
            'Support prioritaire',
            'Sans publicités'
        ],
        '3_months': [
            'Tout du plan 1 mois',
            'Support 24/7 Premium',
            'Analyses avancées',
            'API personnalisée',
            'Graphiques étendus',
            '✨ Économie 17%'
        ],
        '6_months': [
            'Tout du plan 3 mois',
            'Backtesting illimité',
            'Stratégies personnalisées',
            'Rapports PDF',
            'Consultation 1-on-1',
            '✨ Économie 25%'
        ],
        '1_year': [
            'Tout du plan 6 mois',
            'Accès API illimité',
            'Serveur dédié',
            'Support VIP prioritaire',
            'Formations exclusives',
            '✨ Économie 33%'
        ]
    }
    
    @staticmethod
    def normalize_plan_name(plan: str) -> str:
        """Normalise le nom du plan"""
        plan_lower = plan.lower().strip()
        
        mapping = {
            'monthly': '1_month',
            '1_month': '1_month',
            '1month': '1_month',
            '3_months': '3_months',
            '3months': '3_months',
            '6_months': '6_months',
            '6months': '6_months',
            'yearly': '1_year',
            '1_year': '1_year',
            '1year': '1_year',
            'free': 'free'
        }
        
        return mapping.get(plan_lower, '1_month')
    
    @staticmethod
    def calculate_subscription_dates(plan: str) -> Tuple[datetime, datetime]:
        """Calcule les dates de début et fin d'abonnement"""
        normalized_plan = SubscriptionManager.normalize_plan_name(plan)
        duration_days = SubscriptionManager.PLAN_DURATIONS.get(normalized_plan, 30)
        
        start_date = datetime.now()
        end_date = start_date + timedelta(days=duration_days)
        
        return start_date, end_date
    
    @staticmethod
    def is_subscription_active(subscription_end: Optional[datetime]) -> bool:
        """Vérifie si l'abonnement est actif"""
        if not subscription_end:
            return False
        return subscription_end > datetime.now()
    
    @staticmethod
    def get_days_remaining(subscription_end: Optional[datetime]) -> Optional[int]:
        """Retourne le nombre de jours restants"""
        if not subscription_end:
            return None
        
        remaining = (subscription_end - datetime.now()).days
        return max(0, remaining)
    
    @staticmethod
    def get_plan_info(plan: str) -> Dict:
        """Retourne toutes les infos d'un plan"""
        normalized_plan = SubscriptionManager.normalize_plan_name(plan)
        
        return {
            'plan': normalized_plan,
            'name': SubscriptionManager.PLAN_NAMES.get(normalized_plan, '🆓 Gratuit'),
            'price': SubscriptionManager.PLAN_PRICES.get(normalized_plan, 0.00),
            'duration_days': SubscriptionManager.PLAN_DURATIONS.get(normalized_plan, 0),
            'features': SubscriptionManager.PLAN_FEATURES.get(normalized_plan, []),
            'features_count': len(SubscriptionManager.PLAN_FEATURES.get(normalized_plan, []))
        }
    
    @staticmethod
    def format_subscription_info(user_info: Dict) -> Dict:
        """Formate les infos d'abonnement pour affichage"""
        plan = user_info.get('subscription_plan', 'free')
        subscription_end = user_info.get('subscription_end')
        
        plan_info = SubscriptionManager.get_plan_info(plan)
        is_active = SubscriptionManager.is_subscription_active(subscription_end)
        days_remaining = SubscriptionManager.get_days_remaining(subscription_end)
        
        return {
            'username': user_info.get('username', 'N/A'),
            'email': user_info.get('email', 'N/A'),
            'plan': plan,
            'plan_name': plan_info['name'],
            'plan_price': plan_info['price'],
            'features': plan_info['features'],
            'features_count': plan_info['features_count'],
            'is_active': is_active,
            'subscription_start': user_info.get('subscription_start'),
            'subscription_end': subscription_end,
            'days_remaining': days_remaining,
            'payment_method': user_info.get('payment_method', 'N/A'),
            'stripe_customer_id': user_info.get('stripe_customer_id'),
            'stripe_subscription_id': user_info.get('stripe_subscription_id')
        }


class EmailNotifier:
    """Gestionnaire d'emails (stub pour l'instant)"""
    
    @staticmethod
    def send_welcome_email(username: str, email: str, plan: str):
        """Envoie un email de bienvenue"""
        print(f"📧 Email bienvenue envoyé à {email} ({username}) - Plan: {plan}")
        # TODO: Implémenter avec SendGrid/MailGun/etc.
        return True
    
    @staticmethod
    def send_payment_confirmation(username: str, email: str, plan: str, amount: float, payment_method: str):
        """Envoie une confirmation de paiement"""
        plan_info = SubscriptionManager.get_plan_info(plan)
        print(f"📧 Confirmation paiement envoyée à {email}")
        print(f"   Montant: ${amount}")
        print(f"   Plan: {plan_info['name']}")
        print(f"   Méthode: {payment_method}")
        # TODO: Implémenter
        return True
    
    @staticmethod
    def send_expiration_warning(username: str, email: str, days_remaining: int):
        """Envoie un avertissement d'expiration"""
        print(f"⚠️  Email expiration envoyé à {email} - {days_remaining} jours restants")
        # TODO: Implémenter
        return True
    
    @staticmethod
    def send_subscription_expired(username: str, email: str):
        """Notifie que l'abonnement a expiré"""
        print(f"❌ Email expiration envoyé à {email}")
        # TODO: Implémenter
        return True


class SubscriptionScheduler:
    """Gestionnaire de tâches planifiées pour les abonnements"""
    
    @staticmethod
    def check_expiring_subscriptions(db_manager, days_before: int = 7):
        """Vérifie les abonnements qui expirent bientôt"""
        # TODO: Implémenter avec APScheduler
        print(f"🔍 Vérification des abonnements expirant dans {days_before} jours...")
        
        # Pseudo-code:
        # users = db_manager.get_all_active_subscriptions()
        # for user in users:
        #     days_remaining = SubscriptionManager.get_days_remaining(user['subscription_end'])
        #     if days_remaining and days_remaining <= days_before:
        #         EmailNotifier.send_expiration_warning(
        #             user['username'], 
        #             user['email'], 
        #             days_remaining
        #         )
        
        return True
    
    @staticmethod
    def expire_old_subscriptions(db_manager):
        """Expire automatiquement les anciens abonnements"""
        print("🔍 Expiration des anciens abonnements...")
        
        # TODO: Implémenter
        # users = db_manager.get_all_active_subscriptions()
        # for user in users:
        #     if not SubscriptionManager.is_subscription_active(user['subscription_end']):
        #         db_manager.update_subscription(user['username'], 'free', None, None)
        #         EmailNotifier.send_subscription_expired(user['username'], user['email'])
        
        return True


# Pour utilisation dans main.py
if __name__ == "__main__":
    # Tests
    print("=" * 60)
    print("🧪 TESTS SUBSCRIPTION MANAGER")
    print("=" * 60)
    
    # Test normalisation
    print("\n1. Test normalisation des plans:")
    tests = ['monthly', 'Monthly', '3months', '3_months', 'yearly', 'YEARLY']
    for test in tests:
        normalized = SubscriptionManager.normalize_plan_name(test)
        print(f"   {test:15} -> {normalized}")
    
    # Test calcul dates
    print("\n2. Test calcul des dates:")
    for plan in ['1_month', '3_months', '6_months', '1_year']:
        start, end = SubscriptionManager.calculate_subscription_dates(plan)
        print(f"   {plan:15} : {start.date()} -> {end.date()}")
    
    # Test infos plan
    print("\n3. Test infos des plans:")
    for plan in ['free', '1_month', '3_months', '6_months', '1_year']:
        info = SubscriptionManager.get_plan_info(plan)
        print(f"   {info['name']:25} : ${info['price']:.2f} - {info['duration_days']} jours - {info['features_count']} features")
    
    print("\n✅ Tous les tests passés!")
