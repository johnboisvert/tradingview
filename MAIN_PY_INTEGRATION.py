# EXEMPLE D'INTÉGRATION COMPLÈTE
# Comment modifier ton main.py existant pour intégrer le système de permissions

"""
Ce fichier montre EXACTEMENT comment modifier ton main.py pour intégrer
le système de permissions. Copie-colle les sections nécessaires.
"""

# ===========================================================================
# SECTION 1: IMPORTS (ajoute au début de main.py)
# ===========================================================================

# Imports existants...
from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware
# ... autres imports

# NOUVEAUX IMPORTS POUR PERMISSIONS
from permissions_system import (
    Feature, 
    PermissionManager, 
    require_feature, 
    check_feature_access,
    SubscriptionPlan,
    PLAN_FEATURES
)
from protected_routes import router as protected_router, register_template_functions

# ===========================================================================
# SECTION 2: CONFIGURATION APP (après création de l'app)
# ===========================================================================

app = FastAPI(title="Trading Dashboard Pro")
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY"))

# NOUVEAU: Enregistrer le router des routes protégées
app.include_router(protected_router)

# Templates Jinja2
templates = Jinja2Templates(directory="templates")

# NOUVEAU: Enregistrer les fonctions helper pour templates
register_template_functions(templates)

# ===========================================================================
# SECTION 3: MODIFIER TA ROUTE DE LOGIN
# ===========================================================================

# VERSION ORIGINALE (à modifier)
@app.post("/login")
async def login(request: Request):
    form = await request.form()
    email = form.get("email")
    password = form.get("password")
    
    # Ton code de vérification...
    user = authenticate_user(email, password)
    
    if user:
        # ANCIENNE VERSION
        request.session["user"] = {
            "id": user.id,
            "email": user.email
        }
        
        return RedirectResponse("/dashboard", status_code=303)

# NOUVELLE VERSION (avec permissions)
@app.post("/login")
async def login(request: Request):
    form = await request.form()
    email = form.get("email")
    password = form.get("password")
    
    user = authenticate_user(email, password)
    
    if user:
        # NOUVELLE VERSION: Inclure les infos d'abonnement
        request.session["user"] = {
            "id": user.id,
            "email": user.email,
            # AJOUT DES CHAMPS DE PERMISSIONS
            "subscription_plan": user.subscription_plan or "free",
            "subscription_start": user.subscription_start,
            "subscription_end": user.subscription_end,
            "stripe_customer_id": user.stripe_customer_id,
        }
        
        return RedirectResponse("/dashboard", status_code=303)

# ===========================================================================
# SECTION 4: PROTÉGER TES ROUTES EXISTANTES
# ===========================================================================

# EXEMPLE 1: Route webhook TradingView (AVANT)
@app.post("/api/webhook/tradingview")
async def tradingview_webhook(request: Request):
    # Pas de protection, tout le monde peut accéder
    data = await request.json()
    process_alert(data)
    return {"success": True}

# EXEMPLE 1: Route webhook TradingView (APRÈS)
@app.post("/api/webhook/tradingview")
async def tradingview_webhook(
    request: Request,
    user: dict = Depends(require_feature(Feature.TRADINGVIEW_WEBHOOKS))  # PROTECTION
):
    """Nécessite plan Premium (1 mois minimum)"""
    data = await request.json()
    process_alert(data)
    return {"success": True}

# --------------------------------------------------------------------------

# EXEMPLE 2: Route prédictions AI (AVANT)
@app.get("/api/predictions")
async def get_predictions(request: Request):
    # Pas de protection
    predictions = run_ml_model()
    return predictions

# EXEMPLE 2: Route prédictions AI (APRÈS)
@app.get("/api/predictions")
async def get_predictions(
    request: Request,
    user: dict = Depends(require_feature(Feature.AI_PREDICTIONS))  # PROTECTION
):
    """Nécessite plan Advanced (3 mois minimum)"""
    predictions = run_ml_model()
    return predictions

# --------------------------------------------------------------------------

# EXEMPLE 3: Dashboard avec vérifications conditionnelles (AVANT)
@app.get("/dashboard")
async def dashboard(request: Request):
    user = request.session.get("user")
    
    # Afficher tout sans restrictions
    return templates.TemplateResponse("dashboard.html", {
        "request": request,
        "user": user,
        "fear_greed": get_fear_greed_index(),
        "trades": get_trades(),
    })

# EXEMPLE 3: Dashboard avec vérifications conditionnelles (APRÈS)
@app.get("/dashboard")
async def dashboard(request: Request):
    user = request.session.get("user")
    
    if not user:
        return RedirectResponse("/login")
    
    # NOUVEAU: Vérifier l'accès à chaque section
    user_plan = user.get("subscription_plan", "free")
    
    # Récupérer les données selon les permissions
    fear_greed_current = get_fear_greed_index()
    
    # Historique Fear & Greed selon le plan
    fear_greed_history_6m = None
    fear_greed_history_12m = None
    
    if PermissionManager.has_feature(user_plan, Feature.FEAR_GREED_HISTORY_6M):
        fear_greed_history_6m = get_fear_greed_history(months=6)
    
    if PermissionManager.has_feature(user_plan, Feature.FEAR_GREED_HISTORY_12M):
        fear_greed_history_12m = get_fear_greed_history(months=12)
    
    # Vérifier accès à chaque feature pour l'UI
    features_access = {
        "ai_predictions": check_feature_access(user, Feature.AI_PREDICTIONS),
        "whale_alerts": check_feature_access(user, Feature.WHALE_ALERTS),
        "webhooks": check_feature_access(user, Feature.TRADINGVIEW_WEBHOOKS),
        "advanced_analytics": check_feature_access(user, Feature.ADVANCED_ANALYTICS),
    }
    
    return templates.TemplateResponse("dashboard.html", {
        "request": request,
        "user": user,
        "fear_greed_current": fear_greed_current,
        "fear_greed_history_6m": fear_greed_history_6m,
        "fear_greed_history_12m": fear_greed_history_12m,
        "features": features_access,
        "subscription": {
            "plan": user_plan,
            "plan_name": PermissionManager.get_plan_name(user_plan),
            "is_active": PermissionManager.is_subscription_active(user.get("subscription_end"))
        }
    })

# ===========================================================================
# SECTION 5: WEBHOOKS STRIPE (NOUVEAU)
# ===========================================================================

import stripe
from datetime import datetime, timedelta

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

@app.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Webhook Stripe pour confirmer les paiements"""
    
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        # Vérifier la signature
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        print(f"❌ Erreur webhook signature: {e}")
        return JSONResponse({"error": str(e)}, status_code=400)
    
    # Gérer l'événement
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        
        # Récupérer les infos
        customer_email = session["customer_email"]
        plan = session["metadata"]["plan"]  # "1_month", "3_months", etc.
        
        # Calculer les dates
        start_date = datetime.now()
        duration_days = {
            "1_month": 30,
            "3_months": 90,
            "6_months": 180,
            "1_year": 365,
        }
        end_date = start_date + timedelta(days=duration_days[plan])
        
        # Mettre à jour la base de données
        user = db.query(User).filter(User.email == customer_email).first()
        if user:
            user.subscription_plan = plan
            user.subscription_start = start_date
            user.subscription_end = end_date
            user.stripe_customer_id = session["customer"]
            user.stripe_subscription_id = session.get("subscription")
            user.payment_method = "stripe"
            user.last_payment_date = start_date
            user.total_spent += PermissionManager.get_plan_price(plan)
            db.commit()
            
            print(f"✅ Abonnement activé: {customer_email} → {plan}")
            
            # Envoyer email de confirmation (optionnel)
            # send_subscription_email(user.email, plan, end_date)
    
    elif event["type"] == "customer.subscription.deleted":
        # Abonnement annulé
        subscription = event["data"]["object"]
        customer_id = subscription["customer"]
        
        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
        if user:
            user.subscription_plan = "free"
            user.subscription_end = datetime.now()
            db.commit()
            
            print(f"⚠️  Abonnement annulé: {user.email}")
    
    return JSONResponse({"success": True})

# ===========================================================================
# SECTION 6: WEBHOOKS COINBASE (NOUVEAU)
# ===========================================================================

@app.post("/webhook/coinbase")
async def coinbase_webhook(request: Request):
    """Webhook Coinbase Commerce pour confirmer les paiements crypto"""
    
    payload = await request.json()
    
    # Vérifier la signature Coinbase
    signature = request.headers.get("X-CC-Webhook-Signature")
    # ... validation de signature
    
    event_type = payload.get("event", {}).get("type")
    
    if event_type == "charge:confirmed":
        charge = payload["event"]["data"]
        
        # Récupérer les métadonnées
        metadata = charge.get("metadata", {})
        customer_email = metadata.get("email")
        plan = metadata.get("plan")
        
        if customer_email and plan:
            # Même logique que Stripe
            start_date = datetime.now()
            duration_days = {
                "1_month": 30,
                "3_months": 90,
                "6_months": 180,
                "1_year": 365,
            }
            end_date = start_date + timedelta(days=duration_days[plan])
            
            user = db.query(User).filter(User.email == customer_email).first()
            if user:
                user.subscription_plan = plan
                user.subscription_start = start_date
                user.subscription_end = end_date
                user.coinbase_customer_id = charge["id"]
                user.payment_method = "coinbase"
                user.last_payment_date = start_date
                user.total_spent += PermissionManager.get_plan_price(plan)
                db.commit()
                
                print(f"✅ Abonnement crypto activé: {customer_email} → {plan}")
    
    return JSONResponse({"success": True})

# ===========================================================================
# SECTION 7: TÂCHE PÉRIODIQUE - VÉRIFICATION EXPIRATIONS
# ===========================================================================

from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('cron', hour=0, minute=0)  # Tous les jours à minuit
def check_expired_subscriptions():
    """Désactive les abonnements expirés et rétrograde vers FREE"""
    
    print("🔍 Vérification des abonnements expirés...")
    
    expired_users = db.query(User).filter(
        User.subscription_end < datetime.now(),
        User.subscription_plan != "free"
    ).all()
    
    for user in expired_users:
        old_plan = user.subscription_plan
        user.subscription_plan = "free"
        
        print(f"⚠️  Expiration: {user.email} ({old_plan} → free)")
        
        # Envoyer email d'expiration
        # send_expiration_email(user.email, old_plan, user.subscription_end)
    
    db.commit()
    print(f"✅ {len(expired_users)} abonnements expirés traités")

# Démarrer le scheduler au lancement de l'app
@app.on_event("startup")
async def startup_event():
    scheduler.start()
    print("✅ Scheduler de vérification d'expiration démarré")

# ===========================================================================
# SECTION 8: ROUTE DE GESTION DU COMPTE UTILISATEUR (NOUVEAU)
# ===========================================================================

@app.get("/mon-compte", response_class=HTMLResponse)
async def mon_compte(request: Request):
    """Page de gestion du compte utilisateur"""
    
    user = request.session.get("user")
    if not user:
        return RedirectResponse("/login")
    
    # Récupérer l'utilisateur complet de la DB
    user_db = db.query(User).filter(User.id == user["id"]).first()
    
    subscription_info = {
        "plan": user_db.subscription_plan,
        "plan_name": PermissionManager.get_plan_name(user_db.subscription_plan),
        "is_active": PermissionManager.is_subscription_active(user_db.subscription_end),
        "start_date": user_db.subscription_start,
        "end_date": user_db.subscription_end,
        "payment_method": user_db.payment_method,
        "last_payment": user_db.last_payment_date,
        "total_spent": user_db.total_spent,
        "features_count": len(PermissionManager.get_user_features(user_db.subscription_plan)),
        "days_remaining": (user_db.subscription_end - datetime.now()).days if user_db.subscription_end else None
    }
    
    # Liste de toutes les features disponibles
    all_features = PermissionManager.get_user_features(user_db.subscription_plan)
    
    return templates.TemplateResponse("mon_compte.html", {
        "request": request,
        "user": user,
        "subscription": subscription_info,
        "features": all_features
    })

# ===========================================================================
# SECTION 9: HANDLER D'ERREURS 403 (NOUVEAU)
# ===========================================================================

@app.exception_handler(403)
async def permission_denied_handler(request: Request, exc: HTTPException):
    """Gère les erreurs de permissions"""
    
    # Pour les routes API, retourner JSON
    if request.url.path.startswith("/api/"):
        return JSONResponse(
            status_code=403,
            content={
                "error": "permission_denied",
                "message": "Vous n'avez pas accès à cette fonctionnalité",
                "details": exc.detail if hasattr(exc, 'detail') else None
            }
        )
    
    # Pour les routes HTML, rediriger vers pricing
    return RedirectResponse("/pricing-complete?upgrade=required", status_code=303)

# ===========================================================================
# SECTION 10: RÉSUMÉ DES MODIFICATIONS
# ===========================================================================

"""
CHECKLIST D'INTÉGRATION:

□ 1. Ajouter les imports (Section 1)
□ 2. Enregistrer le router et template functions (Section 2)
□ 3. Modifier la route de login (Section 3)
□ 4. Protéger les routes sensibles (Section 4)
□ 5. Ajouter webhooks Stripe (Section 5)
□ 6. Ajouter webhooks Coinbase (Section 6)
□ 7. Configurer le scheduler d'expiration (Section 7)
□ 8. Ajouter la page "Mon Compte" (Section 8)
□ 9. Configurer le handler d'erreurs 403 (Section 9)
□ 10. Exécuter migrate_permissions.py pour la DB
□ 11. Tester avec des comptes test
□ 12. Déployer sur Railway

COMMANDES À EXÉCUTER:

1. Migration de la DB:
   python migrate_permissions.py

2. Créer utilisateurs de test:
   python migrate_permissions.py
   # Choisir option 3

3. Redémarrer l'app:
   # Sur Railway, git push déclenchera le redéploiement

4. Tester:
   - Login avec free@test.com
   - Tenter d'accéder à une feature premium → doit être bloqué
   - Upgrade vers Premium
   - Vérifier déblocage des features
"""

print("""
╔═══════════════════════════════════════════════════════════════╗
║           GUIDE D'INTÉGRATION - MAIN.PY COMPLET               ║
╚═══════════════════════════════════════════════════════════════╝

✅ Ce fichier contient TOUS les changements à apporter à main.py

📝 PROCHAINES ÉTAPES:

1. Copie les sections nécessaires dans ton main.py
2. Exécute migrate_permissions.py pour la DB
3. Redémarre l'app sur Railway
4. Teste avec les comptes de test
5. Configure les webhooks Stripe/Coinbase

💰 SYSTEM DE PERMISSIONS PRÊT!
""")
