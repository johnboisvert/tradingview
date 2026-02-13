#!/usr/bin/env python3
"""
Script pour appliquer les pages AI révolutionnaires au main.py
Pages: AI Predictor, AI Token Scanner, AI Patterns, AI Sentiment, AI Sizer
"""

import re

def apply_revolutionary_pages():
    # Lire le fichier main.py
    with open('main.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Import du module revolutionary_ai_pages
    import_statement = """
# Import des pages AI révolutionnaires
from revolutionary_ai_pages import (
    get_ai_predictor_html,
    get_ai_token_scanner_html,
    get_ai_patterns_html,
    get_ai_sentiment_html,
    get_ai_sizer_html
)
"""
    
    # Ajouter l'import après les autres imports si pas déjà présent
    if 'from revolutionary_ai_pages import' not in content:
        # Trouver un bon endroit pour l'import (après les imports existants)
        import_pos = content.find('from fastapi import')
        if import_pos != -1:
            # Trouver la fin de la ligne
            end_line = content.find('\n', import_pos)
            content = content[:end_line+1] + import_statement + content[end_line+1:]
    
    # ============= REMPLACER AI PREDICTOR =============
    ai_predictor_new = '''@app.get("/ai-predictor", response_class=HTMLResponse)
async def ai_predictor():
    """Prédictions de prix révolutionnaires - TOP 50"""
    cryptos = await get_top_50_cryptos()
    html_content = get_ai_predictor_html(cryptos)
    return HTMLResponse(SIDEBAR + html_content)
'''
    
    # Pattern pour trouver l'ancienne fonction ai_predictor
    pattern_predictor = r'@app\.get\("/ai-predictor".*?\)[\s\S]*?async def ai_predictor\(\):[\s\S]*?(?=\n@app\.|\nclass |\ndef |\nasync def (?!ai_predictor)|\n# ===)'
    
    match = re.search(pattern_predictor, content)
    if match:
        content = content[:match.start()] + ai_predictor_new + '\n' + content[match.end():]
        print("✅ AI Predictor remplacé")
    else:
        print("⚠️ AI Predictor non trouvé, ajout à la fin")
    
    # ============= REMPLACER AI PATTERNS =============
    ai_patterns_new = '''@app.get("/ai-patterns", response_class=HTMLResponse)
async def ai_patterns():
    """Reconnaissance patterns révolutionnaire - TOP 50"""
    cryptos = await get_top_50_cryptos()
    html_content = get_ai_patterns_html(cryptos)
    return HTMLResponse(SIDEBAR + html_content)
'''
    
    pattern_patterns = r'@app\.get\("/ai-patterns".*?\)[\s\S]*?async def ai_patterns\(\):[\s\S]*?(?=\n@app\.|\nclass |\ndef |\nasync def (?!ai_patterns)|\n# ===)'
    
    match = re.search(pattern_patterns, content)
    if match:
        content = content[:match.start()] + ai_patterns_new + '\n' + content[match.end():]
        print("✅ AI Patterns remplacé")
    else:
        print("⚠️ AI Patterns non trouvé")
    
    # ============= REMPLACER AI SENTIMENT =============
    ai_sentiment_new = '''@app.get("/ai-sentiment", response_class=HTMLResponse)
async def ai_sentiment():
    """Analyse sentiment révolutionnaire - TOP 50"""
    cryptos = await get_top_50_cryptos()
    html_content = get_ai_sentiment_html(cryptos)
    return HTMLResponse(SIDEBAR + html_content)
'''
    
    pattern_sentiment = r'@app\.get\("/ai-sentiment".*?\)[\s\S]*?async def ai_sentiment\(\):[\s\S]*?(?=\n@app\.|\nclass |\ndef |\nasync def (?!ai_sentiment)|\n# ===)'
    
    match = re.search(pattern_sentiment, content)
    if match:
        content = content[:match.start()] + ai_sentiment_new + '\n' + content[match.end():]
        print("✅ AI Sentiment remplacé")
    else:
        print("⚠️ AI Sentiment non trouvé")
    
    # ============= REMPLACER AI TOKEN SCANNER =============
    ai_token_scanner_new = '''@app.get("/ai-token-scanner")
async def ai_token_scanner_page(request: Request, q: str = ""):
    """Scanner de tokens révolutionnaire"""
    q = (q or "").strip()
    
    if not q:
        html_content = get_ai_token_scanner_html(tokens=None, query="")
        return HTMLResponse(SIDEBAR + html_content)
    
    # Multi tokens support
    tokens = [t.strip() for t in re.split(r"[,\\s]+", q) if t.strip()]
    tokens = tokens[:5]
    
    ids = []
    resolved = []
    
    for t in tokens:
        if t.startswith("0x") and len(t) == 42:
            html_content = get_ai_token_scanner_html(
                tokens=None, 
                query=q, 
                info="Les adresses de contrat EVM ne sont pas encore supportées."
            )
            return HTMLResponse(SIDEBAR + html_content)
        
        search = await _coingecko_search(t)
        coins = (search or {}).get("coins") or []
        if not coins:
            continue
        
        best = None
        t_l = t.lower()
        for c in coins:
            if (c.get("symbol") or "").lower() == t_l:
                best = c
                break
        if not best:
            best = coins[0]
        cid = best.get("id")
        if cid:
            ids.append(cid)
            resolved.append(f"{(best.get('symbol') or '').upper()}→{best.get('name') or cid}")
    
    if not ids:
        html_content = get_ai_token_scanner_html(
            tokens=None,
            query=q,
            info="Aucun token trouvé sur CoinGecko pour cette requête."
        )
        return HTMLResponse(SIDEBAR + html_content)
    
    markets = await _coingecko_markets(ids)
    if not markets:
        html_content = get_ai_token_scanner_html(
            tokens=None,
            query=q,
            error="Impossible de récupérer les données CoinGecko (rate-limit ou erreur réseau)."
        )
        return HTMLResponse(SIDEBAR + html_content)
    
    scored = [_score_token(r) for r in markets]
    scored.sort(key=lambda x: x.get("score", 0), reverse=True)
    
    # Formater les données pour l'affichage
    formatted_tokens = []
    for s in scored:
        formatted_tokens.append({
            'symbol': s.get('symbol', ''),
            'name': s.get('name', ''),
            'price': s.get('current_price', 0),
            'change_24h': s.get('price_change_percentage_24h', 0),
            'market_cap': s.get('market_cap', 0),
            'volume': s.get('total_volume', 0),
            'score': s.get('score', 0)
        })
    
    html_content = get_ai_token_scanner_html(
        tokens=formatted_tokens,
        query=q,
        info=("Résolution: " + ", ".join(resolved)) if resolved else ""
    )
    return HTMLResponse(SIDEBAR + html_content)
'''
    
    pattern_token_scanner = r'@app\.get\("/ai-token-scanner"\)[\s\S]*?async def ai_token_scanner_page\([^)]*\):[\s\S]*?(?=\n# ===|\n@app\.get\("/ai-setup)'
    
    match = re.search(pattern_token_scanner, content)
    if match:
        content = content[:match.start()] + ai_token_scanner_new + '\n' + content[match.end():]
        print("✅ AI Token Scanner remplacé")
    else:
        print("⚠️ AI Token Scanner non trouvé")
    
    # ============= REMPLACER AI SIZER =============
    ai_sizer_new = '''@app.get("/ai-sizer", response_class=HTMLResponse)
async def ai_sizer_page(request: Request):
    """Calculateur de taille de position révolutionnaire (spot/futures)."""
    q = dict(request.query_params)
    account = q.get("account", "1000")
    risk = q.get("risk", "1")
    entry = q.get("entry", "")
    stop = q.get("stop", "")
    leverage = q.get("leverage", "1")
    direction = q.get("direction", "long")
    
    result = None
    error = ""
    
    try:
        if entry and stop:
            acc = float(account)
            r = float(risk) / 100.0
            e = float(entry)
            s = float(stop)
            lev = max(1.0, float(leverage))
            per_unit_risk = abs(e - s)
            
            if per_unit_risk <= 0:
                raise ValueError("Entry et Stop doivent être différents.")
            
            risk_amount = acc * r
            qty = risk_amount / per_unit_risk
            position_notional = qty * e
            margin = position_notional / lev
            
            result = {
                'risk_amount': risk_amount,
                'quantity': qty,
                'position_notional': position_notional,
                'margin': margin
            }
    except Exception as ex:
        error = str(ex)
    
    html_content = get_ai_sizer_html(
        account=account,
        risk=risk,
        entry=entry,
        stop=stop,
        leverage=leverage,
        direction=direction,
        result=result,
        error=error
    )
    return HTMLResponse(SIDEBAR + html_content)
'''
    
    pattern_sizer = r'@app\.get\("/ai-sizer".*?\)[\s\S]*?async def ai_sizer_page\([^)]*\):[\s\S]*?(?=\n@app\.get\("/ai-exit")'
    
    match = re.search(pattern_sizer, content)
    if match:
        content = content[:match.start()] + ai_sizer_new + '\n' + content[match.end():]
        print("✅ AI Sizer remplacé")
    else:
        print("⚠️ AI Sizer non trouvé")
    
    # Sauvegarder le fichier
    with open('main.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("\n✅ Toutes les pages AI révolutionnaires ont été appliquées!")
    print("📄 Pages modifiées:")
    print("   - /ai-predictor")
    print("   - /ai-token-scanner")
    print("   - /ai-patterns")
    print("   - /ai-sentiment")
    print("   - /ai-sizer")

if __name__ == "__main__":
    apply_revolutionary_pages()