"""
Email System - Trading Dashboard Pro
Utilise SendGrid pour envoyer des emails automatiques
"""

import os
from datetime import datetime
from typing import Optional

# Essayer d'importer SendGrid
try:
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail, Email, To, Content
    SENDGRID_AVAILABLE = True
except ImportError:
    SENDGRID_AVAILABLE = False
    print("⚠️  SendGrid non installé: pip install sendgrid")


class EmailService:
    """Service d'envoi d'emails avec SendGrid"""
    
    def __init__(self):
        self.api_key = os.getenv("SENDGRID_API_KEY", "")
        self.from_email = os.getenv("FROM_EMAIL", "noreply@tradingdashboard.pro")
        self.from_name = os.getenv("FROM_NAME", "Trading Dashboard Pro")
        self.enabled = SENDGRID_AVAILABLE and bool(self.api_key)
        
        if self.enabled:
            self.client = SendGridAPIClient(self.api_key)
            print(f"✅ EmailService initialisé - From: {self.from_email}")
        else:
            print("⚠️  EmailService désactivé (pas de clé SendGrid)")
    
    def send_email(self, to_email: str, subject: str, html_content: str, text_content: Optional[str] = None) -> bool:
        """Envoie un email via SendGrid"""
        if not self.enabled:
            print(f"📧 [SIMULATION] Email à {to_email}: {subject}")
            return False
        
        try:
            message = Mail(
                from_email=Email(self.from_email, self.from_name),
                to_emails=To(to_email),
                subject=subject,
                html_content=Content("text/html", html_content)
            )
            
            if text_content:
                message.add_content(Content("text/plain", text_content))
            
            response = self.client.send(message)
            
            if response.status_code in [200, 201, 202]:
                print(f"✅ Email envoyé à {to_email}: {subject}")
                return True
            else:
                print(f"⚠️  Email erreur {response.status_code} à {to_email}")
                return False
                
        except Exception as e:
            print(f"❌ Erreur envoi email à {to_email}: {e}")
            return False
    
    def send_welcome_email(self, username: str, email: str) -> bool:
        """Email de bienvenue après inscription"""
        subject = "🎉 Bienvenue sur Trading Dashboard Pro!"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Bienvenue {username}!</h1>
                </div>
                <div class="content">
                    <p>Merci de vous être inscrit sur <strong>Trading Dashboard Pro</strong>!</p>
                    
                    <p>Vous avez maintenant accès à:</p>
                    <ul>
                        <li>📊 Dashboard de trading en temps réel</li>
                        <li>😱 Fear & Greed Index</li>
                        <li>👑 BTC Dominance</li>
                        <li>🔥 Heatmap des cryptos</li>
                        <li>📈 Analyses de marché</li>
                    </ul>
                    
                    <p><strong>Prêt à upgrader?</strong></p>
                    <p>Découvrez nos plans Premium pour débloquer:</p>
                    <ul>
                        <li>✨ Tous les indicateurs IA</li>
                        <li>🤖 Signaux de trading automatiques</li>
                        <li>📱 Alertes Telegram personnalisées</li>
                        <li>💎 Support prioritaire 24/7</li>
                    </ul>
                    
                    <center>
                        <a href="https://tradingview-production-5763.up.railway.app/pricing-complete" class="button">
                            🚀 Voir les Plans Premium
                        </a>
                    </center>
                    
                    <p style="margin-top: 30px;">À bientôt sur le dashboard!</p>
                    <p><strong>L'équipe Trading Dashboard Pro</strong></p>
                </div>
                <div class="footer">
                    <p>Trading Dashboard Pro - Votre partenaire crypto de confiance</p>
                    <p>Vous recevez cet email car vous vous êtes inscrit sur notre plateforme.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Bienvenue {username}!
        
        Merci de vous être inscrit sur Trading Dashboard Pro!
        
        Vous avez maintenant accès au dashboard de trading en temps réel avec Fear & Greed Index, BTC Dominance, et plus encore.
        
        Découvrez nos plans Premium: https://tradingview-production-5763.up.railway.app/pricing-complete
        
        L'équipe Trading Dashboard Pro
        """
        
        return self.send_email(email, subject, html_content, text_content)
    
    def send_payment_confirmation(self, username: str, email: str, plan: str, amount: float, payment_method: str, subscription_end: datetime) -> bool:
        """Email de confirmation après paiement"""
        
        plan_names = {
            'free': '🆓 Gratuit',
            '1_month': '💳 Premium (1 mois)',
            '3_months': '💎 Advanced (3 mois)',
            '6_months': '👑 Pro (6 mois)',
            '1_year': '🚀 Elite (1 an)'
        }
        
        plan_name = plan_names.get(plan, plan)
        method_icon = "💳" if payment_method == "stripe" else "₿"
        method_name = "Carte bancaire (Stripe)" if payment_method == "stripe" else "Crypto (Coinbase Commerce)"
        
        subject = f"✅ Paiement confirmé - {plan_name}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; }}
                .receipt {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }}
                .receipt-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }}
                .button {{ display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Paiement Confirmé!</h1>
                    <p style="font-size: 18px; margin-top: 10px;">Merci {username}!</p>
                </div>
                <div class="content">
                    <p>Votre paiement a été <strong>confirmé avec succès</strong>! 🎉</p>
                    
                    <div class="receipt">
                        <h3 style="margin-top: 0; color: #10b981;">📄 Détails du paiement</h3>
                        <div class="receipt-row">
                            <span><strong>Plan:</strong></span>
                            <span>{plan_name}</span>
                        </div>
                        <div class="receipt-row">
                            <span><strong>Montant:</strong></span>
                            <span>${amount:.2f} USD</span>
                        </div>
                        <div class="receipt-row">
                            <span><strong>Méthode:</strong></span>
                            <span>{method_icon} {method_name}</span>
                        </div>
                        <div class="receipt-row">
                            <span><strong>Date:</strong></span>
                            <span>{datetime.now().strftime("%d/%m/%Y %H:%M")}</span>
                        </div>
                        <div class="receipt-row" style="border-bottom: none;">
                            <span><strong>Expire le:</strong></span>
                            <span>{subscription_end.strftime("%d/%m/%Y")}</span>
                        </div>
                    </div>
                    
                    <p><strong>✨ Votre abonnement est maintenant actif!</strong></p>
                    
                    <p>Vous avez maintenant accès à:</p>
                    <ul>
                        <li>🤖 Tous les indicateurs IA</li>
                        <li>📊 Trades illimités</li>
                        <li>📱 Webhooks TradingView</li>
                        <li>💎 Support prioritaire</li>
                        <li>✨ Sans publicités</li>
                    </ul>
                    
                    <center>
                        <a href="https://tradingview-production-5763.up.railway.app/mon-compte" class="button">
                            👤 Voir Mon Compte
                        </a>
                    </center>
                    
                    <p style="margin-top: 30px;">Bon trading! 🚀</p>
                    <p><strong>L'équipe Trading Dashboard Pro</strong></p>
                </div>
                <div class="footer">
                    <p>Questions? Contactez-nous: support@tradingdashboard.pro</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Paiement Confirmé!
        
        Merci {username}!
        
        Détails du paiement:
        - Plan: {plan_name}
        - Montant: ${amount:.2f} USD
        - Méthode: {method_name}
        - Expire le: {subscription_end.strftime("%d/%m/%Y")}
        
        Votre abonnement est maintenant actif!
        
        Voir votre compte: https://tradingview-production-5763.up.railway.app/mon-compte
        
        L'équipe Trading Dashboard Pro
        """
        
        return self.send_email(email, subject, html_content, text_content)
    
    def send_expiration_warning(self, username: str, email: str, plan: str, days_remaining: int) -> bool:
        """Email d'avertissement expiration (7 jours avant)"""
        
        plan_names = {
            '1_month': '💳 Premium',
            '3_months': '💎 Advanced',
            '6_months': '👑 Pro',
            '1_year': '🚀 Elite'
        }
        
        plan_name = plan_names.get(plan, plan)
        
        subject = f"⏰ Votre abonnement {plan_name} expire dans {days_remaining} jours"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .warning-box {{ background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }}
                .button {{ display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⏰ Rappel d'Expiration</h1>
                </div>
                <div class="content">
                    <p>Bonjour {username},</p>
                    
                    <div class="warning-box">
                        <strong>⚠️ Votre abonnement {plan_name} expire dans {days_remaining} jours</strong>
                    </div>
                    
                    <p>Pour continuer à profiter de:</p>
                    <ul>
                        <li>🤖 Tous les indicateurs IA</li>
                        <li>📊 Trades illimités</li>
                        <li>📱 Webhooks TradingView</li>
                        <li>💎 Support prioritaire</li>
                    </ul>
                    
                    <p><strong>Renouvelez dès maintenant!</strong></p>
                    
                    <center>
                        <a href="https://tradingview-production-5763.up.railway.app/pricing-complete" class="button">
                            🔄 Renouveler Mon Abonnement
                        </a>
                    </center>
                    
                    <p style="margin-top: 30px; font-size: 14px; color: #666;">
                        Si vous ne renouvelez pas, votre compte repassera automatiquement au plan Gratuit après expiration.
                    </p>
                    
                    <p>Merci de votre confiance!</p>
                    <p><strong>L'équipe Trading Dashboard Pro</strong></p>
                </div>
                <div class="footer">
                    <p>Questions? Contactez-nous: support@tradingdashboard.pro</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Rappel d'Expiration
        
        Bonjour {username},
        
        Votre abonnement {plan_name} expire dans {days_remaining} jours.
        
        Pour continuer à profiter de tous les indicateurs IA, trades illimités, et support prioritaire, renouvelez dès maintenant!
        
        Renouveler: https://tradingview-production-5763.up.railway.app/pricing-complete
        
        L'équipe Trading Dashboard Pro
        """
        
        return self.send_email(email, subject, html_content, text_content)
    
    def send_subscription_expired(self, username: str, email: str, old_plan: str) -> bool:
        """Email notification expiration"""
        
        plan_names = {
            '1_month': '💳 Premium',
            '3_months': '💎 Advanced',
            '6_months': '👑 Pro',
            '1_year': '🚀 Elite'
        }
        
        plan_name = plan_names.get(old_plan, old_plan)
        
        subject = f"❌ Votre abonnement {plan_name} a expiré"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .info-box {{ background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 5px; }}
                .button {{ display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>❌ Abonnement Expiré</h1>
                </div>
                <div class="content">
                    <p>Bonjour {username},</p>
                    
                    <div class="info-box">
                        <strong>Votre abonnement {plan_name} a expiré.</strong>
                    </div>
                    
                    <p>Votre compte est maintenant repassé au <strong>plan Gratuit</strong>.</p>
                    
                    <p><strong>Vous continuez à avoir accès à:</strong></p>
                    <ul>
                        <li>📊 Dashboard de base</li>
                        <li>😱 Fear & Greed Index</li>
                        <li>📈 Graphiques limités</li>
                    </ul>
                    
                    <p><strong>Pour retrouver l'accès complet:</strong></p>
                    <ul>
                        <li>🤖 Tous les indicateurs IA</li>
                        <li>📊 Trades illimités</li>
                        <li>📱 Webhooks TradingView</li>
                        <li>💎 Support prioritaire</li>
                    </ul>
                    
                    <center>
                        <a href="https://tradingview-production-5763.up.railway.app/pricing-complete" class="button">
                            🚀 Réabonner Maintenant
                        </a>
                    </center>
                    
                    <p style="margin-top: 30px;">On espère vous revoir bientôt!</p>
                    <p><strong>L'équipe Trading Dashboard Pro</strong></p>
                </div>
                <div class="footer">
                    <p>Questions? Contactez-nous: support@tradingdashboard.pro</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Abonnement Expiré
        
        Bonjour {username},
        
        Votre abonnement {plan_name} a expiré.
        
        Votre compte est maintenant repassé au plan Gratuit.
        
        Pour retrouver l'accès complet à tous les indicateurs IA, trades illimités, et support prioritaire:
        
        Réabonner: https://tradingview-production-5763.up.railway.app/pricing-complete
        
        L'équipe Trading Dashboard Pro
        """
        
        return self.send_email(email, subject, html_content, text_content)


# Instance globale
email_service = EmailService()


# Pour tester
if __name__ == "__main__":
    print("=" * 60)
    print("🧪 TEST EMAIL SERVICE")
    print("=" * 60)
    
    # Test email bienvenue
    print("\n1. Test email bienvenue:")
    email_service.send_welcome_email("TestUser", "test@example.com")
    
    # Test confirmation paiement
    print("\n2. Test confirmation paiement:")
    email_service.send_payment_confirmation(
        "TestUser", 
        "test@example.com", 
        "1_month", 
        29.99, 
        "stripe",
        datetime.now()
    )
    
    # Test avertissement expiration
    print("\n3. Test avertissement expiration:")
    email_service.send_expiration_warning("TestUser", "test@example.com", "1_month", 7)
    
    # Test notification expiration
    print("\n4. Test notification expiration:")
    email_service.send_subscription_expired("TestUser", "test@example.com", "1_month")
    
    print("\n✅ Tests terminés!")
