# models_support.py
# Modèles de base de données pour le système de support

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

# Supposons que tu as déjà une Base définie quelque part
# from database import Base

class TicketStatus(enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    WAITING_USER = "waiting_user"
    RESOLVED = "resolved"
    CLOSED = "closed"

class TicketPriority(enum.Enum):
    LOW = "low"          # Free
    NORMAL = "normal"    # Premium
    HIGH = "high"        # Advanced
    URGENT = "urgent"    # Pro
    CRITICAL = "critical"  # Elite

class TicketType(enum.Enum):
    SUPPORT = "support"
    BUG = "bug"
    FEATURE = "feature"
    BILLING = "billing"
    OTHER = "other"

class SupportTicket(Base):
    __tablename__ = "support_tickets"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(String(50), unique=True, index=True)  # TKT-20241216-1234
    
    # User info
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Nullable si user pas connecté
    user_email = Column(String(255), nullable=False)
    user_name = Column(String(255), nullable=False)
    user_plan = Column(String(50), default="Free")
    
    # Ticket info
    subject = Column(String(500), nullable=False)
    type = Column(Enum(TicketType), default=TicketType.SUPPORT)
    status = Column(Enum(TicketStatus), default=TicketStatus.OPEN)
    priority = Column(Enum(TicketPriority), default=TicketPriority.NORMAL)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    
    # Assigned to (admin user)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relations
    messages = relationship("TicketMessage", back_populates="ticket", cascade="all, delete-orphan")
    user = relationship("User", foreign_keys=[user_id], backref="tickets")
    assigned_admin = relationship("User", foreign_keys=[assigned_to])


class TicketMessage(Base):
    __tablename__ = "ticket_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("support_tickets.id"), nullable=False)
    
    # Message info
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    sender_name = Column(String(255), nullable=False)
    sender_email = Column(String(255), nullable=False)
    is_admin = Column(Integer, default=0)  # 0 = user, 1 = admin
    
    message = Column(Text, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relations
    ticket = relationship("SupportTicket", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])


# Table de configuration pour les temps de réponse
class SupportConfig(Base):
    __tablename__ = "support_config"
    
    id = Column(Integer, primary_key=True)
    plan = Column(String(50), unique=True)
    response_time_hours = Column(Integer)  # En heures
    has_email = Column(Integer, default=1)
    has_chat = Column(Integer, default=0)
    has_phone = Column(Integer, default=0)
    priority = Column(String(20))
    
    # Exemples d'insertion :
    # Free: 0 heures (pas de support), Low
    # Premium: 48 heures, Normal
    # Advanced: 24 heures, High
    # Pro: 12 heures, Urgent
    # Elite: 2 heures, Critical
