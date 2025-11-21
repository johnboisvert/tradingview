# GUIDE D'INTÉGRATION - Système de Permissions
# Trading Dashboard Pro - Par John

"""
Ce guide explique comment intégrer le système de permissions dans ton main.py existant.

FICHIERS CRÉÉS:
1. permissions_system.py - Système de permissions et plans
2. protected_routes.py - Exemples de routes protégées
3. templates/dashboard_with_permissions.html - Dashboard avec UI de permissions

ÉTAPES D'INTÉGRATION:
"""

## ÉTAPE 1: Ajouter les imports dans main.py
# ===========================================================================

"""
Ajoute ces imports au début de ton main.py (après les imports existants):
"""

from permissions_system import (
    Feature, 
    PermissionManager, 
    require_feature, 
    check_feature_access,
    SubscriptionPlan,
    PLAN_FEATURES
)
from protected_routes import router as protected_router, register_template_functions

## ÉTAPE 2: Enregistrer le router des routes protégées
# ===========================================================================

"""
Dans ton main.py, après la création de l'app FastAPI, ajoute:
"""

# Enregistrer les routes protégées
app.include_router(protected_router)

# Enregistrer les fonctions helper pour les templates Jinja2
register_template_functions(templates)

## ÉTAPE 3: Modifier la structure User dans ta base de données
# ===========================================================================

"""
Si tu utilises SQLAlchemy, modifie ton modèle User pour inclure:
"""

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    
    # NOUVEAUX CHAMPS POUR PERMISSIONS
    subscription_plan = Column(String, default="free")  # free, 1_month, 3_months, 6_months, 1_year
    subscription_start = Column(DateTime, nullable=True)
    subscription_end = Column(DateTime, nullable=True)
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)

## ÉTAPE 4: Mettre à jour la session utilisateur
# ===========================================================================

"""
Quand un utilisateur se connecte, ajoute ces infos à la session:
"""

async def login_user(email: str, password: str, request: Request):
    user = get_user_from_db(email)  # Ta fonction existante
    
    # Mettre à jour la session avec les infos de permissions
    request.session["user"] = {
        "id": user.id,
        "email": user.email,
        "subscription_plan": user.subscription_plan or "free",
        "subscription_start": user.subscription_start,
        "subscription_end": user.subscription_end,
    }

## ÉTAPE 5: Protéger tes routes existantes
# ===========================================================================

"""
EXEMPLE 1: Route API protégée
"""

@app.post("/api/webhook/tradingview")
async def handle_tradingview_webhook(
    request: Request,
    user: dict = Depends(require_feature(Feature.TRADINGVIEW_WEBHOOKS))
):
    """
    Cette route nécessite un plan Premium (1 mois minimum)
    L'utilisateur est automatiquement dans 'user' si autorisé
    """
    data = await request.json()
    # Ton code existant...
    return {"success": True}

"""
EXEMPLE 2: Route HTML protégée
"""

@app.get("/predictions", response_class=HTMLResponse)
async def predictions_page(
    request: Request,
    user: dict = Depends(require_feature(Feature.AI_PREDICTIONS))
):
    """
    Cette page nécessite un plan Advanced (3 mois minimum)
    """
    # Ton code existant...
    return templates.TemplateResponse("predictions.html", {
        "request": request,
        "user": user
    })

"""
EXEMPLE 3: Vérification conditionnelle dans une route
"""

@app.get("/dashboard")
async def dashboard(request: Request):
    user = request.session.get("user")
    
    # Vérifier l'accès à chaque feature
    can_use_ai = PermissionManager.has_feature(
        user.get("subscription_plan", "free"),
        Feature.AI_PREDICTIONS
    )
    
    can_use_webhooks = PermissionManager.has_feature(
        user.get("subscription_plan", "free"),
        Feature.TRADINGVIEW_WEBHOOKS
    )
    
    return templates.TemplateResponse("dashboard.html", {
        "request": request,
        "user": user,
        "can_use_ai": can_use_ai,
        "can_use_webhooks": can_use_webhooks
    })

## ÉTAPE 6: Intégrer avec Stripe/Coinbase webhooks
# ===========================================================================

"""
Quand un paiement est confirmé via webhook Stripe/Coinbase:
"""

@app.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
        
        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            
            # Récupérer les infos du paiement
            customer_email = session["customer_email"]
            plan = session["metadata"]["plan"]  # "1_month", "3_months", etc.
            
            # Calculer la date d'expiration
            from datetime import datetime, timedelta
            start_date = datetime.now()
            
            duration_map = {
                "1_month": timedelta(days=30),
                "3_months": timedelta(days=90),
                "6_months": timedelta(days=180),
                "1_year": timedelta(days=365),
            }
            
            end_date = start_date + duration_map[plan]
            
            # Mettre à jour l'utilisateur dans la DB
            user = get_user_by_email(customer_email)
            user.subscription_plan = plan
            user.subscription_start = start_date
            user.subscription_end = end_date
            user.stripe_customer_id = session["customer"]
            user.stripe_subscription_id = session.get("subscription")
            db.commit()
            
            # Envoyer email de confirmation (optionnel)
            send_subscription_confirmation_email(user.email, plan, end_date)
        
        return {"success": True}
    
    except Exception as e:
        return {"error": str(e)}, 400

## ÉTAPE 7: Vérification dans les templates Jinja2
# ===========================================================================

"""
Dans tes templates HTML existants, tu peux utiliser:
"""

# Template: dashboard.html
"""
{% if has_feature(user, 'ai_predictions') %}
    <!-- Afficher le contenu AI -->
    <div class="ai-predictions">
        <h3>Prédictions IA</h3>
        <!-- ... -->
    </div>
{% else %}
    <!-- Afficher le lock avec upgrade prompt -->
    <div class="locked-feature">
        <i class="fas fa-lock"></i>
        <p>Cette feature nécessite un plan Advanced</p>
        <a href="/pricing-complete">Upgrade maintenant</a>
    </div>
{% endif %}
"""

## ÉTAPE 8: JavaScript pour vérifications dynamiques
# ===========================================================================

"""
Dans ton JavaScript frontend:
"""

# script.js
"""
// Vérifier l'accès à une feature
async function checkFeature(featureName) {
    const response = await fetch(`/api/check-feature/${featureName}`);
    const data = await response.json();
    
    if (!data.has_access) {
        // Afficher modal d'upgrade
        showUpgradeModal(data.upgrade_info);
    } else {
        // Activer la feature
        enableFeature(featureName);
    }
}

// Exemple d'utilisation
document.getElementById('ai-prediction-btn').addEventListener('click', async () => {
    const access = await checkFeature('ai_predictions');
    if (access.has_access) {
        // Lancer la prédiction
        loadAIPredictions();
    }
});
"""

## ÉTAPE 9: Gestion des expirations d'abonnement
# ===========================================================================

"""
Créer une tâche périodique pour vérifier les expirations:
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('cron', hour=0, minute=0)  # Chaque jour à minuit
def check_expired_subscriptions():
    """Vérifier et désactiver les abonnements expirés"""
    from datetime import datetime
    
    expired_users = db.query(User).filter(
        User.subscription_end < datetime.now(),
        User.subscription_plan != "free"
    ).all()
    
    for user in expired_users:
        # Rétrograder vers FREE
        user.subscription_plan = "free"
        
        # Envoyer email d'expiration
        send_expiration_email(user.email, user.subscription_end)
    
    db.commit()
    print(f"Désactivé {len(expired_users)} abonnements expirés")

# Démarrer le scheduler
scheduler.start()

## ÉTAPE 10: Tester le système
# ===========================================================================

"""
TESTS À FAIRE:

1. Créer un compte FREE:
   - Vérifier accès uniquement aux features de base
   - Tenter d'accéder à une feature premium → 403 error

2. Upgrade vers 1 MOIS:
   - Payer avec Stripe/Coinbase
   - Webhook reçu et DB mise à jour
   - Features Premium débloquées
   - Features Advanced toujours lockées

3. Upgrade vers 3 MOIS:
   - Features Advanced débloquées
   - Features Pro toujours lockées

4. Tester expiration:
   - Modifier subscription_end dans le passé
   - Vérifier rétrograder automatique vers FREE

5. Tester UI:
   - Dashboard affiche correctement les locks
   - Boutons "Upgrade" fonctionnels
   - Messages d'upgrade clairs
"""

## RÉSUMÉ DES FEATURES PAR PLAN
# ===========================================================================

"""
FREE (Gratuit):
- Dashboard basique
- Fear & Greed Index actuel
- Historique de trades limité

PREMIUM (1 mois - 29.99$):
+ TradingView Webhooks
+ Alertes Telegram
+ Monitoring TP/SL
+ Historique 30 jours

ADVANCED (3 mois - 74.97$):
+ Prédictions AI
+ Analyse de marché
+ Fear & Greed 6 mois
+ Historique 90 jours
+ Alertes Whale

PRO (6 mois - 134.94$):
+ Multi-exchange
+ Analytics avancées
+ Fear & Greed 12 mois
+ Historique illimité
+ Indicateurs custom
+ Support prioritaire

ELITE (1 an - 239.88$):
+ Accès API complet
+ Backtesting
+ Suivi de portfolio
+ Rapports fiscaux
+ White label
+ Support dédié
"""

## PROCHAINES ÉTAPES RECOMMANDÉES
# ===========================================================================

"""
1. ✅ Système de permissions (FAIT)
2. 🔄 Webhooks Stripe/Coinbase (À FAIRE)
3. 🔄 Dashboard utilisateur avec gestion abonnement (À FAIRE)
4. 🔄 Graphiques Fear & Greed historiques (À FAIRE)
5. 🔄 Système d'emails automatiques (À FAIRE)

ORDRE DE PRIORITÉ:
1. Intégrer ce système dans main.py
2. Tester avec un compte test
3. Implémenter webhooks pour automatisation
4. Ajouter dashboard utilisateur
5. Créer système d'emails
"""

print("""
╔═══════════════════════════════════════════════════════════════╗
║  SYSTÈME DE PERMISSIONS - TRADING DASHBOARD PRO               ║
║  Créé par Claude pour John                                    ║
║                                                               ║
║  📁 Fichiers créés:                                           ║
║    - permissions_system.py                                    ║
║    - protected_routes.py                                      ║
║    - templates/dashboard_with_permissions.html                ║
║    - INTEGRATION_GUIDE.py (ce fichier)                       ║
║                                                               ║
║  🚀 Prêt pour intégration dans main.py                       ║
║  💰 5 plans avec déblocage progressif des features           ║
║  🔒 Protection automatique des routes                         ║
║  ✨ UI avec upgrade prompts professionnels                   ║
╚═══════════════════════════════════════════════════════════════╝
""")
