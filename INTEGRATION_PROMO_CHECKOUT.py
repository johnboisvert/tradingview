# ==============================================================================
# MODIFICATIONS COMPLÈTES: Admin + Checkout avec Codes Promo
# ==============================================================================

# ============================================================================
# PARTIE 1: AJOUTER UN BOUTON DANS VOTRE PAGE ADMIN
# ============================================================================

# Dans votre fonction admin_dashboard (ligne ~19286), JUSTE APRÈS:
#     <div class="header">
#         <h1>👨‍💼 Admin Dashboard</h1>
#         <p class="subtitle">Gestion des utilisateurs et abonnements</p>
#     </div>

# AJOUTEZ CE HTML:

"""
            <div style="margin-bottom: 20px;">
                <a href="/admin/list-promos" class="btn btn-primary" style="background: #f59e0b; padding: 12px 24px; font-size: 16px;">
                    💰 Gérer les Codes Promo
                </a>
                <a href="/admin/pricing" class="btn btn-primary" style="padding: 12px 24px; font-size: 16px;">
                    💳 Gérer les Prix
                </a>
            </div>
"""


# ============================================================================
# PARTIE 2: MODIFIER LA PAGE /pricing-complete POUR AJOUTER CHAMP PROMO
# ============================================================================

# Cherchez la route @app.get("/pricing-complete") (environ ligne 18000)
# Je vous donne le code HTML complet à remplacer dans cette section:

# NOUVEAU HTML POUR /pricing-complete (avec champ promo):

PRICING_COMPLETE_HTML = """
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Plans & Tarifs - Trading Dashboard Pro</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container { max-width: 1400px; margin: 0 auto; }
        .header {
            text-align: center;
            color: white;
            margin-bottom: 50px;
        }
        .header h1 {
            font-size: 48px;
            margin-bottom: 15px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .header p {
            font-size: 20px;
            opacity: 0.9;
        }
        .pricing-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 30px;
            margin-bottom: 50px;
        }
        .pricing-card {
            background: white;
            border-radius: 20px;
            padding: 40px 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            transition: transform 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        .pricing-card:hover {
            transform: translateY(-10px);
        }
        .pricing-card.featured {
            border: 3px solid #f59e0b;
            transform: scale(1.05);
        }
        .pricing-card.featured::before {
            content: "⭐ POPULAIRE";
            position: absolute;
            top: 20px;
            right: -35px;
            background: #f59e0b;
            color: white;
            padding: 5px 40px;
            transform: rotate(45deg);
            font-weight: bold;
            font-size: 12px;
        }
        .plan-name {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        .plan-price {
            font-size: 48px;
            font-weight: bold;
            color: #667eea;
            margin: 20px 0;
        }
        .plan-price .currency { font-size: 24px; }
        .plan-price .period { font-size: 16px; color: #666; }
        .discount-badge {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .features {
            list-style: none;
            margin: 30px 0;
            text-align: left;
        }
        .features li {
            padding: 12px 0;
            color: #555;
            border-bottom: 1px solid #eee;
        }
        .features li:before {
            content: "✓ ";
            color: #10b981;
            font-weight: bold;
            margin-right: 10px;
        }
        
        /* Promo Code Section */
        .promo-section {
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin: 30px 0;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        .promo-section h3 {
            color: #333;
            margin-bottom: 20px;
            font-size: 22px;
        }
        .promo-input-group {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
        }
        .promo-input {
            flex: 1;
            padding: 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 16px;
            text-transform: uppercase;
            font-weight: 600;
        }
        .promo-input:focus {
            outline: none;
            border-color: #667eea;
        }
        .promo-btn {
            padding: 15px 30px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        }
        .promo-btn:hover {
            background: #5568d3;
            transform: scale(1.05);
        }
        .promo-message {
            padding: 15px;
            border-radius: 10px;
            font-weight: 600;
            text-align: center;
            display: none;
        }
        .promo-message.success {
            background: #d1fae5;
            color: #065f46;
            border: 2px solid #10b981;
            display: block;
        }
        .promo-message.error {
            background: #fee2e2;
            color: #991b1b;
            border: 2px solid #ef4444;
            display: block;
        }
        
        .btn-payment {
            display: block;
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 10px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 10px;
        }
        .btn-stripe {
            background: #635bff;
            color: white;
        }
        .btn-stripe:hover {
            background: #4f46e5;
            transform: scale(1.02);
        }
        .btn-coinbase {
            background: #0052ff;
            color: white;
        }
        .btn-coinbase:hover {
            background: #0041cc;
            transform: scale(1.02);
        }
        .back-link {
            display: inline-block;
            margin-top: 30px;
            color: white;
            text-decoration: none;
            font-weight: 600;
            padding: 12px 24px;
            background: rgba(255,255,255,0.2);
            border-radius: 8px;
            transition: all 0.3s;
        }
        .back-link:hover {
            background: rgba(255,255,255,0.3);
        }
        .original-price {
            text-decoration: line-through;
            color: #999;
            font-size: 24px;
            margin-right: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💎 Plans & Tarifs</h1>
            <p>Choisissez le plan qui vous convient</p>
        </div>
        
        <!-- Section Code Promo -->
        <div class="promo-section">
            <h3>🎁 Vous avez un code promo?</h3>
            <div class="promo-input-group">
                <input type="text" 
                       id="promoCode" 
                       class="promo-input" 
                       placeholder="Entrez votre code promo"
                       onkeyup="this.value = this.value.toUpperCase()">
                <button onclick="applyPromo()" class="promo-btn">Appliquer</button>
            </div>
            <div id="promoMessage" class="promo-message"></div>
        </div>
        
        <div class="pricing-grid">
            <!-- Plan 1 Month -->
            <div class="pricing-card">
                <div class="plan-name">💳 Premium</div>
                <div class="discount-badge">1 mois</div>
                <div class="plan-price" id="price-1-month">
                    <span class="currency">$</span><span id="amount-1-month">29.99</span>
                </div>
                <ul class="features">
                    <li>Tous les indicateurs IA</li>
                    <li>Dashboard en temps réel</li>
                    <li>Signaux de trading</li>
                    <li>Support prioritaire</li>
                </ul>
                <button class="btn-payment btn-stripe" onclick="checkout('1_month', 'stripe', 29.99)">
                    💳 Payer par Carte
                </button>
                <button class="btn-payment btn-coinbase" onclick="checkout('1_month', 'coinbase', 29.99)">
                    ₿ Payer en Crypto
                </button>
            </div>
            
            <!-- Plan 3 Months -->
            <div class="pricing-card featured">
                <div class="plan-name">💎 Advanced</div>
                <div class="discount-badge">3 mois - Économisez 17%</div>
                <div class="plan-price" id="price-3-months">
                    <span class="currency">$</span><span id="amount-3-months">74.97</span>
                    <span class="period">/3 mois</span>
                </div>
                <ul class="features">
                    <li>Tous les avantages Premium</li>
                    <li>Webhooks TradingView</li>
                    <li>Alertes Telegram</li>
                    <li>Support 24/7</li>
                </ul>
                <button class="btn-payment btn-stripe" onclick="checkout('3_months', 'stripe', 74.97)">
                    💳 Payer par Carte
                </button>
                <button class="btn-payment btn-coinbase" onclick="checkout('3_months', 'coinbase', 74.97)">
                    ₿ Payer en Crypto
                </button>
            </div>
            
            <!-- Plan 6 Months -->
            <div class="pricing-card">
                <div class="plan-name">👑 Pro</div>
                <div class="discount-badge">6 mois - Économisez 25%</div>
                <div class="plan-price" id="price-6-months">
                    <span class="currency">$</span><span id="amount-6-months">134.94</span>
                    <span class="period">/6 mois</span>
                </div>
                <ul class="features">
                    <li>Tous les avantages Advanced</li>
                    <li>API accès complet</li>
                    <li>Backtesting illimité</li>
                    <li>Support VIP</li>
                </ul>
                <button class="btn-payment btn-stripe" onclick="checkout('6_months', 'stripe', 134.94)">
                    💳 Payer par Carte
                </button>
                <button class="btn-payment btn-coinbase" onclick="checkout('6_months', 'coinbase', 134.94)">
                    ₿ Payer en Crypto
                </button>
            </div>
            
            <!-- Plan 1 Year -->
            <div class="pricing-card">
                <div class="plan-name">🚀 Elite</div>
                <div class="discount-badge">1 an - Économisez 33%</div>
                <div class="plan-price" id="price-1-year">
                    <span class="currency">$</span><span id="amount-1-year">239.88</span>
                    <span class="period">/an</span>
                </div>
                <ul class="features">
                    <li>Tous les avantages Pro</li>
                    <li>Rapports PDF hebdomadaires</li>
                    <li>Formation exclusive</li>
                    <li>Support dédié</li>
                </ul>
                <button class="btn-payment btn-stripe" onclick="checkout('1_year', 'stripe', 239.88)">
                    💳 Payer par Carte
                </button>
                <button class="btn-payment btn-coinbase" onclick="checkout('1_year', 'coinbase', 239.88)">
                    ₿ Payer en Crypto
                </button>
            </div>
        </div>
        
        <center>
            <a href="/dashboard" class="back-link">← Retour au Dashboard</a>
        </center>
    </div>
    
    <script>
        // État global pour le code promo
        let appliedPromo = {
            code: null,
            discount: 0,
            originalPrices: {
                '1_month': 29.99,
                '3_months': 74.97,
                '6_months': 134.94,
                '1_year': 239.88
            },
            discountedPrices: {}
        };
        
        // Appliquer le code promo
        async function applyPromo() {
            const codeInput = document.getElementById('promoCode');
            const code = codeInput.value.trim().toUpperCase();
            const messageDiv = document.getElementById('promoMessage');
            
            if (!code) {
                showMessage('Veuillez entrer un code promo', 'error');
                return;
            }
            
            // Tester le code pour chaque plan
            messageDiv.innerHTML = '🔄 Validation en cours...';
            messageDiv.className = 'promo-message';
            messageDiv.style.display = 'block';
            
            try {
                // Valider pour le plan 1_month comme référence
                const response = await fetch(`/admin/test-promo?code=${code}&plan=1_month&amount=29.99`);
                const data = await response.json();
                
                if (data.valid) {
                    // Appliquer à tous les plans
                    appliedPromo.code = code;
                    
                    for (const [plan, originalPrice] of Object.entries(appliedPromo.originalPrices)) {
                        const testResponse = await fetch(`/admin/test-promo?code=${code}&plan=${plan}&amount=${originalPrice}`);
                        const testData = await testResponse.json();
                        
                        if (testData.valid && testData.discount) {
                            appliedPromo.discountedPrices[plan] = testData.final_amount;
                            updatePriceDisplay(plan, originalPrice, testData.final_amount);
                        }
                    }
                    
                    showMessage(`✅ Code ${code} appliqué! ${data.savings} de réduction`, 'success');
                } else {
                    showMessage(data.message, 'error');
                    resetPrices();
                }
            } catch (error) {
                showMessage('❌ Erreur lors de la validation', 'error');
                console.error(error);
            }
        }
        
        // Afficher un message
        function showMessage(message, type) {
            const messageDiv = document.getElementById('promoMessage');
            messageDiv.innerHTML = message;
            messageDiv.className = `promo-message ${type}`;
            messageDiv.style.display = 'block';
        }
        
        // Mettre à jour l'affichage du prix
        function updatePriceDisplay(plan, originalPrice, newPrice) {
            const priceElement = document.getElementById(`price-${plan}`);
            const amountSpan = document.getElementById(`amount-${plan}`);
            
            // Afficher prix barré + nouveau prix
            amountSpan.innerHTML = `
                <span class="original-price">$${originalPrice.toFixed(2)}</span>
                ${newPrice.toFixed(2)}
            `;
        }
        
        // Réinitialiser les prix
        function resetPrices() {
            appliedPromo.code = null;
            appliedPromo.discountedPrices = {};
            
            for (const [plan, originalPrice] of Object.entries(appliedPromo.originalPrices)) {
                const amountSpan = document.getElementById(`amount-${plan}`);
                amountSpan.textContent = originalPrice.toFixed(2);
            }
        }
        
        // Fonction de checkout avec code promo
        async function checkout(plan, method, baseAmount) {
            // Utiliser le prix avec réduction si disponible
            const finalAmount = appliedPromo.discountedPrices[plan] || baseAmount;
            
            if (method === 'stripe') {
                // Stripe checkout
                const response = await fetch('/api/stripe-checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        plan: plan,
                        amount: finalAmount,
                        promo_code: appliedPromo.code
                    })
                });
                
                const data = await response.json();
                if (data.url) {
                    window.location.href = data.url;
                } else {
                    alert('Erreur: ' + (data.error || 'Impossible de créer la session'));
                }
            } else {
                // Coinbase checkout
                const response = await fetch('/api/coinbase-checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        plan: plan,
                        amount: finalAmount,
                        promo_code: appliedPromo.code
                    })
                });
                
                const data = await response.json();
                if (data.url) {
                    window.location.href = data.url;
                } else {
                    alert('Erreur: ' + (data.error || 'Impossible de créer le paiement'));
                }
            }
        }
    </script>
</body>
</html>
"""


# ============================================================================
# PARTIE 3: MODIFIER LES ROUTES STRIPE ET COINBASE POUR ACCEPTER PROMO_CODE
# ============================================================================

# NOUVEAU CODE POUR /api/stripe-checkout (remplacez la fonction existante):

@app.post("/api/stripe-checkout")
async def stripe_checkout(request: Request):
    """Crée une session Stripe Checkout avec support des codes promo"""
    try:
        data = await request.json()
        plan = data.get('plan', '1_month')
        amount = data.get('amount', 29.99)
        promo_code = data.get('promo_code', None)
        
        # Récupérer l'email de l'utilisateur connecté
        session_token = request.cookies.get("session_token")
        user = get_user_from_token(session_token)
        email = user.get('username', 'user@example.com') if user else 'user@example.com'
        
        # Valider et appliquer le code promo
        final_amount = amount
        discount_applied = 0
        
        if promo_code and PROMO_CODES_AVAILABLE:
            conn = get_db_connection()
            valid, msg, discount = PromoCodeManager.validate_promo_code(
                conn, promo_code, plan, amount
            )
            
            if valid and discount:
                discount_applied = discount
                final_amount = amount - discount
                print(f"✅ Code promo {promo_code} appliqué: -${discount:.2f}")
                
                # Incrémenter l'utilisation du code
                PromoCodeManager.use_promo_code(conn, promo_code, email)
            else:
                print(f"⚠️  Code promo invalide: {msg}")
            
            conn.close()
        
        # Créer la session Stripe avec le montant final
        session, error = create_stripe_checkout_session(
            plan,
            email,
            f"{request.base_url}api/payment-success?plan={plan}",
            f"{request.base_url}api/payment-cancel",
            final_amount  # Montant avec réduction appliquée
        )
        
        if error:
            return JSONResponse({"error": error}, status_code=400)
        
        # Stocker les infos du code promo dans les metadata si utilisé
        if promo_code and discount_applied > 0:
            # Note: vous pouvez stocker ça dans votre DB si nécessaire
            pass
        
        return JSONResponse({"url": session.url})
        
    except Exception as e:
        print(f"❌ Erreur stripe checkout: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)


# NOUVEAU CODE POUR /api/coinbase-checkout (même principe):

@app.post("/api/coinbase-checkout")
async def coinbase_checkout(request: Request):
    """Crée un paiement Coinbase Commerce avec support des codes promo"""
    try:
        data = await request.json()
        plan = data.get('plan', '1_month')
        amount = data.get('amount', 29.99)
        promo_code = data.get('promo_code', None)
        
        session_token = request.cookies.get("session_token")
        user = get_user_from_token(session_token)
        email = user.get('username', 'user@example.com') if user else 'user@example.com'
        
        # Valider et appliquer le code promo
        final_amount = amount
        discount_applied = 0
        
        if promo_code and PROMO_CODES_AVAILABLE:
            conn = get_db_connection()
            valid, msg, discount = PromoCodeManager.validate_promo_code(
                conn, promo_code, plan, amount
            )
            
            if valid and discount:
                discount_applied = discount
                final_amount = amount - discount
                print(f"✅ Code promo {promo_code} appliqué: -${discount:.2f}")
                
                # Incrémenter l'utilisation du code
                PromoCodeManager.use_promo_code(conn, promo_code, email)
            else:
                print(f"⚠️  Code promo invalide: {msg}")
            
            conn.close()
        
        # Créer le paiement Coinbase avec le montant final
        charge_data = create_coinbase_charge(
            plan,
            email,
            final_amount  # Montant avec réduction appliquée
        )
        
        if not charge_data or 'hosted_url' not in charge_data:
            return JSONResponse({"error": "Erreur création paiement Coinbase"}, status_code=400)
        
        return JSONResponse({"url": charge_data['hosted_url']})
        
    except Exception as e:
        print(f"❌ Erreur coinbase checkout: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)
