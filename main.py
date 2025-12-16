# middleware_tickets.py
# Middleware pour ajouter le compteur de tickets au contexte user

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from models.models_support import SupportTicket, TicketStatus
from database import SessionLocal

class TicketCountMiddleware(BaseHTTPMiddleware):
    """
    Middleware qui ajoute le nombre de tickets ouverts au contexte user
    pour afficher le badge de notification dans le menu
    """
    
    async def dispatch(self, request: Request, call_next):
        # Exécuter la requête
        response = await call_next(request)
        
        # Si user est connecté, ajouter le compteur de tickets
        if hasattr(request.state, "user") and request.state.user:
            user = request.state.user
            
            try:
                db = SessionLocal()
                
                # Compter les tickets ouverts et en attente de réponse du user
                open_tickets_count = db.query(SupportTicket).filter(
                    SupportTicket.user_id == user.get("id"),
                    SupportTicket.status.in_([
                        TicketStatus.OPEN, 
                        TicketStatus.WAITING_USER,
                        TicketStatus.IN_PROGRESS
                    ])
                ).count()
                
                # Ajouter au user pour utilisation dans les templates
                user["open_tickets_count"] = open_tickets_count
                
                # Si admin, compter les tickets en attente de traitement
                if user.get("is_admin", False):
                    admin_pending_tickets = db.query(SupportTicket).filter(
                        SupportTicket.status == TicketStatus.OPEN
                    ).count()
                    
                    user["admin_pending_tickets"] = admin_pending_tickets
                
                db.close()
                
            except Exception as e:
                print(f"Erreur middleware tickets: {e}")
                # En cas d'erreur, mettre à 0
                user["open_tickets_count"] = 0
                if user.get("is_admin"):
                    user["admin_pending_tickets"] = 0
        
        return response


# ========================================
# ALTERNATIVE : Fonction helper au lieu de middleware
# ========================================

def get_user_with_ticket_count(user: dict, db) -> dict:
    """
    Helper function pour ajouter le compteur de tickets à un objet user
    Utiliser dans chaque route si tu ne veux pas de middleware
    """
    if not user:
        return user
    
    try:
        # Compter les tickets ouverts
        open_tickets_count = db.query(SupportTicket).filter(
            SupportTicket.user_id == user.get("id"),
            SupportTicket.status.in_([
                TicketStatus.OPEN,
                TicketStatus.WAITING_USER,
                TicketStatus.IN_PROGRESS
            ])
        ).count()
        
        user["open_tickets_count"] = open_tickets_count
        
        # Si admin
        if user.get("is_admin", False):
            admin_pending_tickets = db.query(SupportTicket).filter(
                SupportTicket.status == TicketStatus.OPEN
            ).count()
            user["admin_pending_tickets"] = admin_pending_tickets
    
    except Exception as e:
        print(f"Erreur get_user_with_ticket_count: {e}")
        user["open_tickets_count"] = 0
        if user.get("is_admin"):
            user["admin_pending_tickets"] = 0
    
    return user


# ========================================
# INTÉGRATION DANS MAIN.PY
# ========================================

"""
# OPTION 1 : Avec Middleware (Recommandé)

from middleware_tickets import TicketCountMiddleware

app = FastAPI()

# Ajouter le middleware
app.add_middleware(TicketCountMiddleware)

# Maintenant, dans tous tes templates, tu peux utiliser :
# {{ user.open_tickets_count }}
# {{ user.admin_pending_tickets }} (si admin)
"""

"""
# OPTION 2 : Sans middleware, dans chaque route

from middleware_tickets import get_user_with_ticket_count

@app.get("/")
async def home(
    request: Request,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ajouter le compteur de tickets
    user = get_user_with_ticket_count(user, db)
    
    return templates.TemplateResponse("index.html", {
        "request": request,
        "user": user  # user.open_tickets_count est maintenant disponible
    })
"""


# ========================================
# TEMPLATE EXAMPLE - Utilisation dans Jinja2
# ========================================

"""
<!-- Dans ton menu navigation -->
<a href="/support">
    📋 Mes tickets
    {% if user.open_tickets_count > 0 %}
    <span class="badge">{{ user.open_tickets_count }}</span>
    {% endif %}
</a>

<!-- Pour les admins -->
{% if user.is_admin %}
<a href="/admin/tickets">
    🎫 Gestion Tickets
    {% if user.admin_pending_tickets > 0 %}
    <span class="badge urgent">{{ user.admin_pending_tickets }}</span>
    {% endif %}
</a>
{% endif %}
"""


# ========================================
# CACHE (Optionnel - pour optimisation)
# ========================================

from functools import lru_cache
from datetime import datetime, timedelta

# Cache simple en mémoire (expire après 60 secondes)
ticket_count_cache = {}

def get_cached_ticket_count(user_id: int, db) -> int:
    """
    Version avec cache pour éviter de requêter la DB trop souvent
    """
    cache_key = f"tickets_{user_id}"
    current_time = datetime.now()
    
    # Vérifier si en cache et pas expiré
    if cache_key in ticket_count_cache:
        cached_data, cached_time = ticket_count_cache[cache_key]
        if current_time - cached_time < timedelta(seconds=60):
            return cached_data
    
    # Sinon, requêter la DB
    count = db.query(SupportTicket).filter(
        SupportTicket.user_id == user_id,
        SupportTicket.status.in_([
            TicketStatus.OPEN,
            TicketStatus.WAITING_USER,
            TicketStatus.IN_PROGRESS
        ])
    ).count()
    
    # Mettre en cache
    ticket_count_cache[cache_key] = (count, current_time)
    
    return count


# ========================================
# INVALIDATION DU CACHE
# ========================================

def invalidate_ticket_cache(user_id: int):
    """
    Invalider le cache quand un ticket change
    À appeler après création/mise à jour d'un ticket
    """
    cache_key = f"tickets_{user_id}"
    if cache_key in ticket_count_cache:
        del ticket_count_cache[cache_key]


# Exemple d'utilisation dans routes_support.py :
"""
@router.post("/contact")
async def submit_contact(...):
    # ... créer le ticket ...
    
    # Invalider le cache pour ce user
    invalidate_ticket_cache(user["id"])
    
    return RedirectResponse(...)
"""
