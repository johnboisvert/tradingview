# routes_support.py
# Routes FastAPI pour le système de support (contact, tickets, admin)

from fastapi import APIRouter, Depends, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from datetime import datetime
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Imports de tes modèles
from models_support import SupportTicket, TicketMessage, TicketStatus, TicketPriority, TicketType
# from database import get_db
# from auth import get_current_user, get_current_user_optional

router = APIRouter()
templates = Jinja2Templates(directory="templates")

# Configuration email (à adapter selon tes paramètres)
EMAIL_HOST = "smtp.gmail.com"  # Ou ton serveur SMTP
EMAIL_PORT = 587
EMAIL_USER = "ton-email@gmail.com"  # À changer
EMAIL_PASSWORD = "ton-mot-de-passe"  # À changer
ADMIN_EMAIL = "ton-email@gmail.com"  # Email où tu reçois les notifications


def send_email(to: str, subject: str, body: str, html: str = None):
    """Envoyer un email"""
    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = EMAIL_USER
        msg['To'] = to
        msg['Subject'] = subject
        
        # Ajouter le texte brut
        msg.attach(MIMEText(body, 'plain'))
        
        # Ajouter le HTML si fourni
        if html:
            msg.attach(MIMEText(html, 'html'))
        
        # Connexion et envoi
        server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        return True
    except Exception as e:
        print(f"Erreur envoi email: {e}")
        return False


def generate_ticket_id():
    """Générer un ID de ticket unique"""
    date_str = datetime.now().strftime('%Y%m%d')
    random_num = random.randint(1000, 9999)
    return f"TKT-{date_str}-{random_num}"


def get_priority_by_plan(plan: str) -> TicketPriority:
    """Déterminer la priorité selon le forfait"""
    priority_map = {
        "Free": TicketPriority.LOW,
        "Premium": TicketPriority.NORMAL,
        "Advanced": TicketPriority.HIGH,
        "Pro": TicketPriority.URGENT,
        "Elite": TicketPriority.CRITICAL
    }
    return priority_map.get(plan, TicketPriority.NORMAL)


def get_response_time(plan: str) -> str:
    """Obtenir le temps de réponse selon le forfait"""
    times = {
        "Free": "Pas de support (upgrade requis)",
        "Premium": "48 heures ouvrables",
        "Advanced": "24 heures ouvrables",
        "Pro": "12 heures",
        "Elite": "2 heures (prioritaire 24/7)"
    }
    return times.get(plan, "48 heures ouvrables")


# ========================================
# PAGE CONTACT (/contact)
# ========================================

@router.get("/contact", response_class=HTMLResponse)
async def contact_page(
    request: Request,
    user: dict = Depends(get_current_user_optional)
):
    """Afficher la page de contact"""
    return templates.TemplateResponse("support/contact.html", {
        "request": request,
        "user": user
    })


@router.post("/contact")
async def submit_contact(
    request: Request,
    name: str = Form(...),
    email: str = Form(...),
    subject: str = Form(...),
    type: str = Form("support"),
    message: str = Form(...),
    user: dict = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Soumettre un formulaire de contact"""
    
    # Déterminer le plan
    plan = "Free"
    user_id = None
    if user:
        plan = user.get("subscription_tier", "Free")
        user_id = user.get("id")
        # Override name/email si connecté
        name = user.get("name", name)
        email = user.get("email", email)
    
    # Vérifier si Free (pas de support)
    if plan == "Free":
        return templates.TemplateResponse("support/no_support.html", {
            "request": request,
            "user": user,
            "message": "Le support n'est pas disponible pour les comptes gratuits. Veuillez upgrader votre forfait."
        })
    
    # Générer ticket ID
    ticket_id = generate_ticket_id()
    
    # Créer le ticket
    ticket = SupportTicket(
        ticket_id=ticket_id,
        user_id=user_id,
        user_email=email,
        user_name=name,
        user_plan=plan,
        subject=subject,
        type=TicketType[type.upper()],
        status=TicketStatus.OPEN,
        priority=get_priority_by_plan(plan)
    )
    db.add(ticket)
    db.flush()  # Pour obtenir l'ID
    
    # Créer le premier message
    first_message = TicketMessage(
        ticket_id=ticket.id,
        sender_name=name,
        sender_email=email,
        sender_id=user_id,
        is_admin=0,
        message=message
    )
    db.add(first_message)
    db.commit()
    
    # Envoyer email à l'admin
    admin_email_body = f"""
NOUVEAU TICKET DE SUPPORT

Ticket ID: {ticket_id}
Forfait: {plan}
Priorité: {ticket.priority.value}

De: {name} ({email})
Sujet: {subject}
Type: {type}

Message:
{message}

---
Voir le ticket: https://ton-site.com/admin/tickets/{ticket.id}
Répondre à: {email}
    """
    
    send_email(
        to=ADMIN_EMAIL,
        subject=f"[Support {plan}] {subject}",
        body=admin_email_body
    )
    
    # Envoyer email de confirmation au user
    response_time = get_response_time(plan)
    
    user_email_body = f"""
Bonjour {name},

Nous avons bien reçu votre demande de support !

Numéro de ticket: {ticket_id}
Sujet: {subject}
Type: {type}

Temps de réponse estimé pour votre forfait {plan}: {response_time}

Vous pouvez suivre votre ticket à cette adresse:
https://ton-site.com/support

Nous vous répondrons dans les meilleurs délais.

Cordialement,
L'équipe Trading Dashboard Pro
    """
    
    send_email(
        to=email,
        subject=f"Ticket {ticket_id} - Message reçu",
        body=user_email_body
    )
    
    # Rediriger vers la page de succès
    return RedirectResponse(
        url=f"/contact/success?ticket_id={ticket_id}",
        status_code=303
    )


@router.get("/contact/success", response_class=HTMLResponse)
async def contact_success(
    request: Request,
    ticket_id: str,
    user: dict = Depends(get_current_user_optional)
):
    """Page de confirmation après soumission"""
    return templates.TemplateResponse("support/contact_success.html", {
        "request": request,
        "user": user,
        "ticket_id": ticket_id
    })


# ========================================
# PAGE SUPPORT (/support - Liste des tickets)
# ========================================

@router.get("/support", response_class=HTMLResponse)
async def support_page(
    request: Request,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Afficher la liste des tickets du user"""
    
    # Récupérer tous les tickets du user
    tickets = db.query(SupportTicket).filter(
        SupportTicket.user_id == user["id"]
    ).order_by(SupportTicket.created_at.desc()).all()
    
    return templates.TemplateResponse("support/support_list.html", {
        "request": request,
        "user": user,
        "tickets": tickets
    })


@router.get("/support/ticket/{ticket_id}", response_class=HTMLResponse)
async def view_ticket(
    request: Request,
    ticket_id: int,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Voir les détails d'un ticket"""
    
    # Récupérer le ticket
    ticket = db.query(SupportTicket).filter(
        SupportTicket.id == ticket_id,
        SupportTicket.user_id == user["id"]
    ).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket non trouvé")
    
    return templates.TemplateResponse("support/ticket_detail.html", {
        "request": request,
        "user": user,
        "ticket": ticket
    })


@router.post("/support/ticket/{ticket_id}/reply")
async def reply_to_ticket(
    request: Request,
    ticket_id: int,
    message: str = Form(...),
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Répondre à un ticket"""
    
    # Vérifier que le ticket appartient au user
    ticket = db.query(SupportTicket).filter(
        SupportTicket.id == ticket_id,
        SupportTicket.user_id == user["id"]
    ).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket non trouvé")
    
    # Créer le message
    new_message = TicketMessage(
        ticket_id=ticket.id,
        sender_id=user["id"],
        sender_name=user["name"],
        sender_email=user["email"],
        is_admin=0,
        message=message
    )
    db.add(new_message)
    
    # Mettre à jour le ticket
    ticket.status = TicketStatus.WAITING_USER
    ticket.updated_at = datetime.utcnow()
    
    db.commit()
    
    # Envoyer notification à l'admin
    admin_notification = f"""
NOUVELLE RÉPONSE AU TICKET {ticket.ticket_id}

De: {user['name']} ({user['email']})
Sujet: {ticket.subject}

Message:
{message}

---
Voir le ticket: https://ton-site.com/admin/tickets/{ticket.id}
    """
    
    send_email(
        to=ADMIN_EMAIL,
        subject=f"[Réponse] {ticket.ticket_id} - {ticket.subject}",
        body=admin_notification
    )
    
    return RedirectResponse(
        url=f"/support/ticket/{ticket_id}",
        status_code=303
    )


# ========================================
# ADMIN - GESTION DES TICKETS
# ========================================

@router.get("/admin/tickets", response_class=HTMLResponse)
async def admin_tickets_list(
    request: Request,
    status: str = None,
    priority: str = None,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste de tous les tickets (admin)"""
    
    # Vérifier si admin
    if not user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    # Query de base
    query = db.query(SupportTicket)
    
    # Filtrer par status si fourni
    if status:
        query = query.filter(SupportTicket.status == TicketStatus[status.upper()])
    
    # Filtrer par priorité si fourni
    if priority:
        query = query.filter(SupportTicket.priority == TicketPriority[priority.upper()])
    
    # Récupérer les tickets
    tickets = query.order_by(
        SupportTicket.priority.desc(),
        SupportTicket.created_at.desc()
    ).all()
    
    # Statistiques
    total_tickets = db.query(SupportTicket).count()
    open_tickets = db.query(SupportTicket).filter(
        SupportTicket.status == TicketStatus.OPEN
    ).count()
    in_progress = db.query(SupportTicket).filter(
        SupportTicket.status == TicketStatus.IN_PROGRESS
    ).count()
    
    return templates.TemplateResponse("admin/tickets_list.html", {
        "request": request,
        "user": user,
        "tickets": tickets,
        "total_tickets": total_tickets,
        "open_tickets": open_tickets,
        "in_progress": in_progress,
        "current_status": status,
        "current_priority": priority
    })


@router.get("/admin/tickets/{ticket_id}", response_class=HTMLResponse)
async def admin_view_ticket(
    request: Request,
    ticket_id: int,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Voir un ticket (admin)"""
    
    # Vérifier si admin
    if not user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    # Récupérer le ticket
    ticket = db.query(SupportTicket).filter(
        SupportTicket.id == ticket_id
    ).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket non trouvé")
    
    return templates.TemplateResponse("admin/ticket_detail.html", {
        "request": request,
        "user": user,
        "ticket": ticket
    })


@router.post("/admin/tickets/{ticket_id}/reply")
async def admin_reply_to_ticket(
    request: Request,
    ticket_id: int,
    message: str = Form(...),
    status: str = Form(None),
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Répondre à un ticket (admin)"""
    
    # Vérifier si admin
    if not user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    # Récupérer le ticket
    ticket = db.query(SupportTicket).filter(
        SupportTicket.id == ticket_id
    ).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket non trouvé")
    
    # Créer le message
    new_message = TicketMessage(
        ticket_id=ticket.id,
        sender_id=user["id"],
        sender_name=user["name"],
        sender_email=user["email"],
        is_admin=1,
        message=message
    )
    db.add(new_message)
    
    # Mettre à jour le status si fourni
    if status:
        ticket.status = TicketStatus[status.upper()]
        
        # Si résolu, mettre la date
        if ticket.status == TicketStatus.RESOLVED:
            ticket.resolved_at = datetime.utcnow()
        
        # Si fermé, mettre la date
        if ticket.status == TicketStatus.CLOSED:
            ticket.closed_at = datetime.utcnow()
    
    ticket.updated_at = datetime.utcnow()
    
    # Assigner à soi-même si pas déjà assigné
    if not ticket.assigned_to:
        ticket.assigned_to = user["id"]
    
    db.commit()
    
    # Envoyer notification au user
    user_notification = f"""
Bonjour {ticket.user_name},

Vous avez reçu une réponse à votre ticket de support !

Ticket ID: {ticket.ticket_id}
Sujet: {ticket.subject}

Réponse de notre équipe:
{message}

Vous pouvez consulter votre ticket et répondre ici:
https://ton-site.com/support/ticket/{ticket.id}

Cordialement,
L'équipe Trading Dashboard Pro
    """
    
    send_email(
        to=ticket.user_email,
        subject=f"Réponse à votre ticket {ticket.ticket_id}",
        body=user_notification
    )
    
    return RedirectResponse(
        url=f"/admin/tickets/{ticket_id}",
        status_code=303
    )


@router.post("/admin/tickets/{ticket_id}/update-status")
async def admin_update_ticket_status(
    request: Request,
    ticket_id: int,
    status: str = Form(...),
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour le status d'un ticket (admin)"""
    
    # Vérifier si admin
    if not user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    # Récupérer le ticket
    ticket = db.query(SupportTicket).filter(
        SupportTicket.id == ticket_id
    ).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket non trouvé")
    
    # Mettre à jour le status
    ticket.status = TicketStatus[status.upper()]
    ticket.updated_at = datetime.utcnow()
    
    # Dates spéciales
    if ticket.status == TicketStatus.RESOLVED and not ticket.resolved_at:
        ticket.resolved_at = datetime.utcnow()
    
    if ticket.status == TicketStatus.CLOSED and not ticket.closed_at:
        ticket.closed_at = datetime.utcnow()
    
    db.commit()
    
    return RedirectResponse(
        url=f"/admin/tickets/{ticket_id}",
        status_code=303
    )


# ========================================
# API ENDPOINTS (optionnels)
# ========================================

@router.get("/api/tickets")
async def api_get_tickets(
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """API: Récupérer les tickets du user"""
    
    tickets = db.query(SupportTicket).filter(
        SupportTicket.user_id == user["id"]
    ).all()
    
    return {
        "tickets": [
            {
                "id": t.id,
                "ticket_id": t.ticket_id,
                "subject": t.subject,
                "status": t.status.value,
                "priority": t.priority.value,
                "created_at": t.created_at.isoformat(),
                "updated_at": t.updated_at.isoformat()
            }
            for t in tickets
        ]
    }
