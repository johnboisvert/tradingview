# -*- coding: utf-8 -*-
"""
🎛️ ADMIN PRICING MANAGER
Module pour gérer les prix des abonnements dans le panel admin
"""

from fastapi import APIRouter, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from subscription_system import (
    get_all_pricing_plans, 
    update_pricing_plan,
    get_subscription_db_connection,
    SUB_DB_CONFIG
)
import json

admin_pricing_router = APIRouter()

# ============================================================================
# 📄 PAGE ADMIN: GESTION DES PRIX
# ============================================================================

@admin_pricing_router.get("/admin/pricing", response_class=HTMLResponse)
async def admin_pricing_page(request: Request):
    """Page admin pour gérer les prix"""
    
    # TODO: Ajouter vérification admin (intégrer avec votre système auth)
    # user = get_current_user(request)
    # if not user or not user.is_admin: raise HTTPException(403)
    
    plans = get_all_pricing_plans()
    
    plans_rows = ""
    for plan in plans:
        features_text = "<br>".join(plan.get('features', []))
        
        active_badge = '<span style="color: #10b981;">✅ Actif</span>' if plan.get('is_active') else '<span style="color: #ef4444;">❌ Inactif</span>'
        
        plans_rows += f"""
        <tr>
            <td><strong>{plan['display_name']}</strong><br><small>{plan['plan_name']}</small></td>
            <td>${plan['price_monthly']:.2f}</td>
            <td>${plan.get('price_yearly', 0):.2f}</td>
            <td>{plan.get('max_alerts', 0)}</td>
            <td>{plan.get('api_calls_per_day', 0)}</td>
            <td>{active_badge}</td>
            <td>
                <button class="btn-edit" onclick="editPlan({plan['id']})">✏️ Modifier</button>
                <button class="btn-toggle" onclick="togglePlan({plan['id']}, {1 if plan.get('is_active') else 0})">
                    {'🔴 Désactiver' if plan.get('is_active') else '🟢 Activer'}
                </button>
            </td>
        </tr>
        """
    
    return HTMLResponse(f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>💰 Gestion des Prix - Admin</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #0f172a;
            color: white;
            padding: 40px;
        }}
        
        .container {{
            max-width: 1400px;
            margin: 0 auto;
        }}
        
        h1 {{
            font-size: 42px;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }}
        
        .subtitle {{
            color: #94a3b8;
            margin-bottom: 40px;
            font-size: 18px;
        }}
        
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }}
        
        .stat-card {{
            background: #1e293b;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #334155;
        }}
        
        .stat-card h3 {{
            color: #94a3b8;
            font-size: 14px;
            margin-bottom: 10px;
        }}
        
        .stat-card .value {{
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
        }}
        
        .plans-table {{
            background: #1e293b;
            border-radius: 12px;
            padding: 30px;
            border: 1px solid #334155;
            overflow-x: auto;
        }}
        
        table {{
            width: 100%;
            border-collapse: collapse;
        }}
        
        th {{
            background: #334155;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #475569;
        }}
        
        td {{
            padding: 15px;
            border-bottom: 1px solid #334155;
        }}
        
        tr:hover {{
            background: #293548;
        }}
        
        .btn-edit {{
            background: #3b82f6;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            margin-right: 10px;
            transition: all 0.3s;
        }}
        
        .btn-edit:hover {{
            background: #2563eb;
            transform: scale(1.05);
        }}
        
        .btn-toggle {{
            background: #ef4444;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s;
        }}
        
        .btn-toggle:hover {{
            opacity: 0.8;
            transform: scale(1.05);
        }}
        
        .back-link {{
            margin-top: 30px;
        }}
        
        .back-link a {{
            color: #667eea;
            text-decoration: none;
            font-size: 16px;
            transition: all 0.3s;
        }}
        
        .back-link a:hover {{
            color: #764ba2;
        }}
        
        /* Modal styles */
        .modal {{
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }}
        
        .modal.active {{
            display: flex;
        }}
        
        .modal-content {{
            background: #1e293b;
            padding: 40px;
            border-radius: 12px;
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
        }}
        
        .modal-content h2 {{
            margin-bottom: 30px;
            color: #667eea;
        }}
        
        .form-group {{
            margin-bottom: 20px;
        }}
        
        .form-group label {{
            display: block;
            margin-bottom: 8px;
            color: #94a3b8;
        }}
        
        .form-group input {{
            width: 100%;
            padding: 12px;
            background: #0f172a;
            border: 1px solid #334155;
            border-radius: 6px;
            color: white;
            font-size: 16px;
        }}
        
        .form-group input:focus {{
            outline: none;
            border-color: #667eea;
        }}
        
        .form-actions {{
            display: flex;
            gap: 10px;
            margin-top: 30px;
        }}
        
        .btn-save {{
            flex: 1;
            padding: 12px;
            background: #10b981;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
        }}
        
        .btn-save:hover {{
            background: #059669;
        }}
        
        .btn-cancel {{
            flex: 1;
            padding: 12px;
            background: #ef4444;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
        }}
        
        .btn-cancel:hover {{
            background: #dc2626;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>💰 Gestion des Prix</h1>
        <p class="subtitle">Modifiez les prix et caractéristiques de vos plans d'abonnement</p>
        
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Plans Actifs</h3>
                <div class="value">{len([p for p in plans if p.get('is_active')])}</div>
            </div>
            <div class="stat-card">
                <h3>Plans Total</h3>
                <div class="value">{len(plans)}</div>
            </div>
            <div class="stat-card">
                <h3>Prix Minimum</h3>
                <div class="value">${min([p['price_monthly'] for p in plans if p['price_monthly'] > 0], default=0):.2f}</div>
            </div>
            <div class="stat-card">
                <h3>Prix Maximum</h3>
                <div class="value">${max([p['price_monthly'] for p in plans]):.2f}</div>
            </div>
        </div>
        
        <div class="plans-table">
            <h2 style="margin-bottom: 20px;">📋 Liste des Plans</h2>
            <table>
                <thead>
                    <tr>
                        <th>Plan</th>
                        <th>Prix Mensuel</th>
                        <th>Prix Annuel</th>
                        <th>Max Alertes</th>
                        <th>API Calls/Jour</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {plans_rows}
                </tbody>
            </table>
        </div>
        
        <div class="back-link">
            <a href="/admin">← Retour au panel admin</a>
        </div>
    </div>
    
    <!-- Modal de modification -->
    <div id="editModal" class="modal">
        <div class="modal-content">
            <h2>✏️ Modifier le Plan</h2>
            <form id="editForm">
                <input type="hidden" id="planId">
                
                <div class="form-group">
                    <label>Nom d'affichage</label>
                    <input type="text" id="displayName" required>
                </div>
                
                <div class="form-group">
                    <label>Prix Mensuel (CAD)</label>
                    <input type="number" id="priceMonthly" step="0.01" min="0" required>
                </div>
                
                <div class="form-group">
                    <label>Prix Annuel (CAD) - Optionnel</label>
                    <input type="number" id="priceYearly" step="0.01" min="0">
                </div>
                
                <div class="form-group">
                    <label>Maximum d'alertes</label>
                    <input type="number" id="maxAlerts" min="0" required>
                </div>
                
                <div class="form-group">
                    <label>API Calls par jour</label>
                    <input type="number" id="apiCalls" min="0" required>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn-save">💾 Sauvegarder</button>
                    <button type="button" class="btn-cancel" onclick="closeModal()">❌ Annuler</button>
                </div>
            </form>
        </div>
    </div>
    
    <script>
        const plans = {json.dumps(plans)};
        
        function editPlan(planId) {{
            const plan = plans.find(p => p.id === planId);
            if (!plan) return;
            
            document.getElementById('planId').value = plan.id;
            document.getElementById('displayName').value = plan.display_name;
            document.getElementById('priceMonthly').value = plan.price_monthly;
            document.getElementById('priceYearly').value = plan.price_yearly || '';
            document.getElementById('maxAlerts').value = plan.max_alerts;
            document.getElementById('apiCalls').value = plan.api_calls_per_day;
            
            document.getElementById('editModal').classList.add('active');
        }}
        
        function closeModal() {{
            document.getElementById('editModal').classList.remove('active');
        }}
        
        async function togglePlan(planId, isActive) {{
            const newStatus = !isActive;
            const action = newStatus ? 'activer' : 'désactiver';
            
            if (!confirm(`Voulez-vous vraiment ${{action}} ce plan?`)) return;
            
            try {{
                const response = await fetch('/api/admin/pricing/toggle', {{
                    method: 'POST',
                    headers: {{ 'Content-Type': 'application/json' }},
                    body: JSON.stringify({{ plan_id: planId, is_active: newStatus }})
                }});
                
                if (response.ok) {{
                    alert('Plan mis à jour!');
                    location.reload();
                }} else {{
                    alert('Erreur lors de la mise à jour');
                }}
            }} catch (error) {{
                alert('Erreur: ' + error.message);
            }}
        }}
        
        document.getElementById('editForm').addEventListener('submit', async (e) => {{
            e.preventDefault();
            
            const planId = document.getElementById('planId').value;
            const updates = {{
                display_name: document.getElementById('displayName').value,
                price_monthly: parseFloat(document.getElementById('priceMonthly').value),
                price_yearly: parseFloat(document.getElementById('priceYearly').value) || null,
                max_alerts: parseInt(document.getElementById('maxAlerts').value),
                api_calls_per_day: parseInt(document.getElementById('apiCalls').value)
            }};
            
            try {{
                const response = await fetch('/api/admin/pricing/update', {{
                    method: 'POST',
                    headers: {{ 'Content-Type': 'application/json' }},
                    body: JSON.stringify({{ plan_id: planId, updates }})
                }});
                
                if (response.ok) {{
                    alert('Plan mis à jour avec succès!');
                    location.reload();
                }} else {{
                    alert('Erreur lors de la mise à jour');
                }}
            }} catch (error) {{
                alert('Erreur: ' + error.message);
            }}
        }});
        
        // Fermer le modal en cliquant à l'extérieur
        document.getElementById('editModal').addEventListener('click', (e) => {{
            if (e.target.id === 'editModal') {{
                closeModal();
            }}
        }});
    </script>
</body>
</html>""")

# ============================================================================
# 🔌 API ENDPOINTS
# ============================================================================

@admin_pricing_router.post("/api/admin/pricing/update")
async def api_update_pricing(request: Request):
    """API pour mettre à jour un plan"""
    try:
        data = await request.json()
        plan_id = data.get('plan_id')
        updates = data.get('updates')
        
        if not plan_id or not updates:
            raise HTTPException(400, "Missing plan_id or updates")
        
        success = update_pricing_plan(plan_id, updates)
        
        if success:
            return JSONResponse({"success": True, "message": "Plan mis à jour"})
        else:
            raise HTTPException(500, "Erreur lors de la mise à jour")
    except Exception as e:
        raise HTTPException(500, str(e))

@admin_pricing_router.post("/api/admin/pricing/toggle")
async def api_toggle_pricing(request: Request):
    """API pour activer/désactiver un plan"""
    try:
        data = await request.json()
        plan_id = data.get('plan_id')
        is_active = data.get('is_active')
        
        if plan_id is None or is_active is None:
            raise HTTPException(400, "Missing plan_id or is_active")
        
        success = update_pricing_plan(plan_id, {'is_active': is_active})
        
        if success:
            return JSONResponse({"success": True, "message": "Statut mis à jour"})
        else:
            raise HTTPException(500, "Erreur lors de la mise à jour")
    except Exception as e:
        raise HTTPException(500, str(e))

print("✅ Module admin_pricing chargé")
