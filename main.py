# ============================================================================
# 🎯 TECHNICAL ANALYSIS PRO ROUTE - VERSION ULTRA-SIMPLE
# ============================================================================
@app.get("/ai-technical-analysis", response_class=HTMLResponse)
async def ai_technical_analysis_page(request: Request):
    """Technical Analysis Pro - Version ultra-simple sans format()"""
    
    try:
        # Fetch Bitcoin data
        symbol = "bitcoin"
        df = await analyzer.get_ohlcv_data(symbol, days=60)
        
        if df is None or len(df) == 0:
            return HTMLResponse(SIDEBAR + """
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Erreur</title>
            """ + CSS + """
            </head>
            <body>
                <div class="main-content">
                    <div style="padding:50px;text-align:center;">
                        <h1 style="font-size:3em;">⚠️ Données indisponibles</h1>
                        <p style="font-size:1.3em;">Impossible de charger les données de marché.</p>
                    </div>
                </div>
            </body>
            </html>
            """)
        
        # Calculate all indicators
        indicators = analyzer.calculate_indicators(df)
        patterns = analyzer.detect_patterns(df)
        sr_levels = analyzer.find_support_resistance(df)
        reversal_signals = analyzer.analyze_reversal_points(df, indicators)
        
        current_price = df['close'].iloc[-1]
        change_24h = ((df['close'].iloc[-1] - df['close'].iloc[-24]) / df['close'].iloc[-24]) * 100 if len(df) >= 24 else 0
        
        # Build indicators HTML
        rsi_class = 'oversold' if indicators['rsi'] < 30 else ('overbought' if indicators['rsi'] > 70 else 'neutral')
        macd_class = 'bullish' if indicators['macd_diff'] > 0 else 'bearish'
        ema200_line = '<div>EMA200: $' + "{:,.0f}".format(indicators['ema200']) + '</div>' if indicators['ema200'] else ''
        
        indicators_html = '<div class="indicators-grid">'
        indicators_html += '<div class="indicator-card">'
        indicators_html += '<div class="indicator-header"><span style="font-size:2em;">📊</span><span style="font-weight:bold;">RSI (14)</span></div>'
        indicators_html += '<div style="font-size:2.5em;font-weight:900;color:#667eea;margin:15px 0;">' + "{:.2f}".format(indicators['rsi']) + '</div>'
        indicators_html += '<div class="indicator-signal ' + rsi_class + '">' + indicators['rsi_signal'] + '</div>'
        indicators_html += '</div>'
        
        indicators_html += '<div class="indicator-card">'
        indicators_html += '<div class="indicator-header"><span style="font-size:2em;">📈</span><span style="font-weight:bold;">MACD</span></div>'
        indicators_html += '<div style="font-size:2.5em;font-weight:900;color:#667eea;margin:15px 0;">' + "{:.2f}".format(indicators['macd']) + '</div>'
        indicators_html += '<div class="indicator-signal ' + macd_class + '">' + indicators['macd_trend'] + '</div>'
        indicators_html += '</div>'
        
        indicators_html += '<div class="indicator-card">'
        indicators_html += '<div class="indicator-header"><span style="font-size:2em;">📉</span><span style="font-weight:bold;">Bollinger</span></div>'
        indicators_html += '<div style="font-size:2.5em;font-weight:900;color:#667eea;margin:15px 0;">$' + "{:,.2f}".format(current_price) + '</div>'
        indicators_html += '<div class="indicator-signal">' + indicators['bb_position'] + '</div>'
        indicators_html += '</div>'
        
        indicators_html += '<div class="indicator-card">'
        indicators_html += '<div class="indicator-header"><span style="font-size:2em;">⚡</span><span style="font-weight:bold;">Stochastique</span></div>'
        indicators_html += '<div style="font-size:1.8em;font-weight:700;color:#667eea;">%K: ' + "{:.1f}".format(indicators['stoch_k']) + '</div>'
        indicators_html += '<div style="font-size:1.8em;font-weight:700;color:#667eea;">%D: ' + "{:.1f}".format(indicators['stoch_d']) + '</div>'
        indicators_html += '<div class="indicator-signal">' + indicators['stoch_signal'] + '</div>'
        indicators_html += '</div>'
        
        indicators_html += '<div class="indicator-card">'
        indicators_html += '<div class="indicator-header"><span style="font-size:2em;">💪</span><span style="font-weight:bold;">ADX</span></div>'
        indicators_html += '<div style="font-size:2.5em;font-weight:900;color:#667eea;margin:15px 0;">' + "{:.2f}".format(indicators['adx']) + '</div>'
        indicators_html += '<div class="indicator-signal">' + indicators['adx_strength'] + '</div>'
        indicators_html += '</div>'
        
        indicators_html += '<div class="indicator-card">'
        indicators_html += '<div class="indicator-header"><span style="font-size:2em;">📐</span><span style="font-weight:bold;">EMAs</span></div>'
        indicators_html += '<div style="margin:15px 0;">'
        indicators_html += '<div>EMA20: $' + "{:,.0f}".format(indicators['ema20']) + '</div>'
        indicators_html += '<div>EMA50: $' + "{:,.0f}".format(indicators['ema50']) + '</div>'
        indicators_html += ema200_line
        indicators_html += '</div>'
        indicators_html += '<div class="indicator-signal">' + indicators['ema_alignment'] + '</div>'
        indicators_html += '</div>'
        indicators_html += '</div>'
        
        # Build patterns HTML
        patterns_html = ""
        if patterns:
            for p in patterns:
                pclass = "bullish-pattern" if p['type']=='BULLISH' else "bearish-pattern"
                patterns_html += '<div class="pattern-card ' + pclass + '">'
                patterns_html += '<h3>' + p['name'] + '</h3>'
                patterns_html += '<div><strong>Confiance: ' + str(p['confidence']) + '%</strong></div>'
                patterns_html += '<p>' + p['description'] + '</p>'
                patterns_html += '<div><strong>🎯 Target: $' + "{:,.2f}".format(p['target']) + '</strong></div>'
                patterns_html += '</div>'
        else:
            patterns_html = "<p style='text-align:center;opacity:0.7;'>Aucun pattern détecté actuellement</p>"
        
        # Build S/R HTML
        resistances_html = ""
        if sr_levels['resistances']:
            for r in sr_levels['resistances'][:3]:
                resistances_html += "<div style='padding:10px;background:#f3f4f6;border-radius:8px;margin:8px 0;'>$" + "{:,.2f}".format(r) + "</div>"
        else:
            resistances_html = "<p style='opacity:0.6;'>Aucune</p>"
        
        supports_html = ""
        if sr_levels['supports']:
            for s in sr_levels['supports'][:3]:
                supports_html += "<div style='padding:10px;background:#f3f4f6;border-radius:8px;margin:8px 0;'>$" + "{:,.2f}".format(s) + "</div>"
        else:
            supports_html = "<p style='opacity:0.6;'>Aucun</p>"
        
        # Build reversal signals HTML
        reversal_html = ""
        if reversal_signals:
            for sig in reversal_signals[:5]:
                sclass = "bullish-signal" if 'BULLISH' in sig['type'] else "bearish-signal"
                rr = abs(sig['target']-sig['entry'])/abs(sig['entry']-sig['stop_loss']) if sig['entry']!=sig['stop_loss'] else 0
                reversal_html += '<div class="reversal-card ' + sclass + '">'
                reversal_html += '<div><strong>' + sig['type'] + '</strong> - ' + str(sig['confidence']) + '%</div>'
                reversal_html += '<p>' + sig['reason'] + '</p>'
                reversal_html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">'
                reversal_html += '<div><div>Entry</div><strong>$' + "{:,.2f}".format(sig['entry']) + '</strong></div>'
                reversal_html += '<div><div>Target</div><strong>$' + "{:,.2f}".format(sig['target']) + '</strong></div>'
                reversal_html += '<div><div>Stop</div><strong>$' + "{:,.2f}".format(sig['stop_loss']) + '</strong></div>'
                reversal_html += '<div><div>R/R</div><strong>' + "{:.1f}".format(rr) + '</strong></div>'
                reversal_html += '</div></div>'
        else:
            reversal_html = "<p style='text-align:center;opacity:0.7;'>Aucun signal de retournement détecté</p>"
        
        # Build complete page
        page = SIDEBAR
        page += '<!DOCTYPE html>'
        page += '<html lang="fr">'
        page += '<head>'
        page += '<meta charset="UTF-8">'
        page += '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
        page += '<title>🎯 AI Technical Analysis Pro</title>'
        page += CSS
        page += '<style>'
        page += '.tech-header{text-align:center;padding:30px;background:rgba(0,0,0,0.3);border-radius:20px;margin-bottom:30px;backdrop-filter:blur(10px);}'
        page += '.tech-header h1{font-size:2.5em;margin:0 0 10px 0;color:white;}'
        page += '.section-title{font-size:1.8em;padding:15px 20px;background:rgba(255,255,255,0.1);border-radius:12px;border-left:5px solid #fbbf24;margin:30px 0 20px;backdrop-filter:blur(10px);color:white;}'
        page += '.indicators-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;margin-bottom:30px;}'
        page += '.indicator-card{background:white;color:#333;padding:20px;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.2);transition:transform 0.2s;}'
        page += '.indicator-card:hover{transform:translateY(-3px);box-shadow:0 6px 20px rgba(0,0,0,0.3);}'
        page += '.indicator-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;}'
        page += '.indicator-signal{padding:8px;border-radius:6px;font-weight:600;text-align:center;margin-top:10px;font-size:0.9em;}'
        page += '.indicator-signal.oversold{background:#dcfce7;color:#166534;}'
        page += '.indicator-signal.overbought{background:#fee2e2;color:#991b1b;}'
        page += '.indicator-signal.bullish{background:#d1fae5;color:#065f46;}'
        page += '.indicator-signal.bearish{background:#fecaca;color:#991b1b;}'
        page += '.indicator-signal.neutral{background:#f3f4f6;color:#4b5563;}'
        page += '.pattern-card,.reversal-card{background:white;color:#333;padding:20px;border-radius:12px;border-left:5px solid;margin-bottom:15px;transition:transform 0.2s;}'
        page += '.pattern-card:hover,.reversal-card:hover{transform:translateX(3px);}'
        page += '.bullish-pattern,.bullish-signal{border-left-color:#10b981;}'
        page += '.bearish-pattern,.bearish-signal{border-left-color:#ef4444;}'
        page += '.sr-box{background:white;color:#333;padding:30px;border-radius:15px;box-shadow:0 10px 30px rgba(0,0,0,0.3);display:grid;grid-template-columns:1fr auto 1fr;gap:30px;margin-bottom:30px;}'
        page += '.price-center{text-align:center;padding:25px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border-radius:12px;box-shadow:0 5px 15px rgba(0,0,0,0.2);}'
        page += '@media (max-width:768px){.sr-box{grid-template-columns:1fr;gap:20px;}.indicators-grid{grid-template-columns:1fr;}}'
        page += '</style>'
        page += '</head>'
        page += '<body>'
        page += '<div class="main-content">'
        page += '<div class="tech-header">'
        page += '<h1>🎯 AI Technical Analysis Pro</h1>'
        page += '<p style="font-size:1.2em;opacity:0.9;margin:0;">Analyse technique professionnelle en temps réel</p>'
        page += '</div>'
        page += '<div class="section-title">📊 INDICATEURS TECHNIQUES</div>'
        page += indicators_html
        page += '<div class="section-title">🎯 PATTERNS CHARTISTES DÉTECTÉS</div>'
        page += patterns_html
        page += '<div class="section-title">📍 SUPPORT & RÉSISTANCE</div>'
        page += '<div class="sr-box">'
        page += '<div>'
        page += '<h3 style="color:#ef4444;margin-bottom:12px;">🔴 Résistances</h3>'
        page += resistances_html
        page += '</div>'
        page += '<div class="price-center">'
        page += '<div style="font-size:1em;opacity:0.9;">Prix BTC</div>'
        page += '<div style="font-size:2.2em;font-weight:900;margin:8px 0;">$' + "{:,.2f}".format(current_price) + '</div>'
        page += '<div style="font-size:1.2em;font-weight:600;">' + "{:+.2f}".format(change_24h) + '%</div>'
        page += '</div>'
        page += '<div>'
        page += '<h3 style="color:#10b981;margin-bottom:12px;">🟢 Supports</h3>'
        page += supports_html
        page += '</div>'
        page += '</div>'
        page += '<div class="section-title">🔄 POINTS DE RETOURNEMENT POTENTIELS</div>'
        page += reversal_html
        page += '</div>'
        page += '<script>setTimeout(function(){window.location.reload();},300000);</script>'
        page += '</body>'
        page += '</html>'
        
        return HTMLResponse(page)
        
    except Exception as e:
        error_page = SIDEBAR
        error_page += '<!DOCTYPE html>'
        error_page += '<html lang="fr">'
        error_page += '<head>'
        error_page += '<meta charset="UTF-8">'
        error_page += '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
        error_page += '<title>Erreur</title>'
        error_page += CSS
        error_page += '</head>'
        error_page += '<body>'
        error_page += '<div class="main-content">'
        error_page += '<div style="padding:50px;text-align:center;">'
        error_page += '<h1 style="font-size:3em;color:white;">❌ Erreur technique</h1>'
        error_page += '<p style="font-size:1.3em;color:white;">Une erreur est survenue: ' + str(e) + '</p>'
        error_page += '</div>'
        error_page += '</div>'
        error_page += '</body>'
        error_page += '</html>'
        return HTMLResponse(error_page)
