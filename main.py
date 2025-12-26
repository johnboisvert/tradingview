//@version=6
indicator("Magic Mike Pro V3.1 - AVEC CONFIANCE (0-100%) (META)", overlay=true, max_labels_count=500, max_lines_count=200, max_boxes_count=80)

// =============== MODE SÉLECTION ===============
grpPreset = "🎯 MODE"
presetMode = input.string("Pro V3 SMRT Mode", "Trading Mode",
     options=["Magic Mike Original", "Pro V3 SMRT Mode"],
     group=grpPreset,
     tooltip="Pro V3 SMRT Mode = Configuration complète avec tous les indicateurs")

isProV3Mode = presetMode == "Pro V3 SMRT Mode"

// =============== TIMEFRAME ===============
grpTF = "⏱️ TIMEFRAME"
tfPreset = input.string("15M", "Timeframe", options=["1H", "15M", "4H"], group=grpTF)
var string tfLabel = tfPreset == "15M" ? "15M" : tfPreset == "4H" ? "4H" : "1H"

// =============== SIGNAUX ===============
grpSignals = "🎯 SIGNAUX"
enableEarlyEntry = input.bool(true, "🟡 Early Entry Alert", group=grpSignals, tooltip="Affiche des alertes précoces (60-69% confiance) avant le signal confirmé")
manualSensitivity = input.float(5.0, "Signal Sensitivity (1-15)", minval=1.0, maxval=15.0, step=0.1, group=grpSignals, tooltip="Plus élevé = plus de signaux (moins strict). Recommandé 15M: 5-8")
useNoiseFilter = input.bool(true, "Noise Filter", group=grpSignals)
noiseFilter = input.float(15.0, "Noise (ADX min)", minval=0, maxval=50, step=0.5, group=grpSignals, tooltip="15M recommandé: 15-20")
useFakeoutFilter = input.bool(true, "Fakeout Filter", group=grpSignals)
fakeoutFilter = input.float(0.3, "Fakeout %", minval=0, maxval=5, step=0.1, group=grpSignals)
useRangeFilter = input.bool(true, "Range Filter", group=grpSignals)
rangeFilter = input.float(0.3, "Range %", minval=0, maxval=2, step=0.1, group=grpSignals)
useMACDFilter = input.bool(false, "MACD Filter (Strict)", group=grpSignals, tooltip="Si désactivé, plus de signaux mais potentiellement moins précis")

// =============== EMAs - BALANCED ENTRY (MACD Standard) ===============
grpTrend = "📈 EMAs"
lenE1 = input.int(12,  "EMA Fast (12)", group=grpTrend, minval=1, tooltip="EMA12 - Standard MACD, bon équilibre")
lenE2 = input.int(26,  "EMA Slow (26)", group=grpTrend, minval=1, tooltip="EMA26 - Standard MACD, bon équilibre")
lenE3 = input.int(200, "EMA 200 (Contexte)", group=grpTrend, minval=1, tooltip="EMA200 pour filtre tendance optionnel")
colE1 = input.color(color.white, "EMA12 Color", group=grpTrend)
colE2 = input.color(color.new(color.lime, 0), "EMA26 Color", group=grpTrend)
colE3 = input.color(color.new(color.red, 0), "EMA200 Color", group=grpTrend)

// =============== VECTOR CANDLES PVSRA ===============
grpVector = "🎨 VECTOR CANDLES PVSRA"
showVectorCandles = input.bool(true, "Activer", group=grpVector, tooltip="Colorie selon le volume (PVSRA)")
vectorClimaxUpColor = input.color(color.new(#00FF00, 0), "Climax Up (Lime - vif)", group=grpVector)
vectorClimaxDownColor = input.color(color.new(#FF0000, 0), "Climax Down (Red - vif)", group=grpVector)
vectorAboveAvgUpColor = input.color(color.new(#0000FF, 0), "Above Avg Up (Blue)", group=grpVector)
vectorAboveAvgDownColor = input.color(color.new(#FF00FF, 0), "Above Avg Down (Fuchsia)", group=grpVector)
vectorNormalUpColor = input.color(color.new(#00BB00, 0), "Normal Up (Green - foncé)", group=grpVector)
vectorNormalDownColor = input.color(color.new(#BB0000, 0), "Normal Down (Red - foncé)", group=grpVector)
volumeLookback = input.int(10, "Volume Lookback", minval=5, maxval=50, group=grpVector)

// =============== TP/SL ===============
grpTPSL = "🎯 TP/SL"
tpslTypeInput = input.string("Hybrid", "Type", options=["ATR Based", "Hybrid", "Fixed %"], group=grpTPSL)
tpslMultInput = input.int(2, "Multiplier", minval=1, maxval=10, group=grpTPSL, tooltip="15M recommandé: 2-3")
tpslLenInput = input.int(14, "Length", minval=5, maxval=50, group=grpTPSL)
showTPSL = input.bool(true, "Afficher TP/SL", group=grpTPSL)
tpR1 = input.float(2.0, "TP1 (R)", step=0.1, minval=0.1, group=grpTPSL, tooltip="15M recommandé: 2.0")
tpR2 = input.float(4.0, "TP2 (R)", step=0.1, minval=0.1, group=grpTPSL, tooltip="15M recommandé: 4.0")
tpR3 = input.float(6.0, "TP3 (R)", step=0.1, minval=0.1, group=grpTPSL, tooltip="15M recommandé: 6.0")

// =============== INDICATEURS ===============
grpIndicators = "📊 INDICATEURS"
showDashboard = input.bool(true, "Dashboard", group=grpIndicators)
showSupplyDemandInput = input.bool(true, "Supply/Demand", group=grpIndicators)
showCHOCHBOSInput = input.bool(true, "CHOCH/BOS", group=grpIndicators)
showMarketStructInput = input.bool(true, "Market Structure", group=grpIndicators)
showSRInput = input.bool(false, "S/R Levels", group=grpIndicators)

grpSupplyDemand = "📦 SUPPLY/DEMAND"
swingHighLowLength = input.int(15, "Swing Length", minval=2, maxval=50, group=grpSupplyDemand, tooltip="15M recommandé: 15-20")
sdBoxWidth = input.int(5, "Box Width %", minval=1, maxval=20, group=grpSupplyDemand)

grpMarketStruct = "🏗️ MARKET STRUCTURE"
marketSwingLength = input.int(20, "Swing Length", minval=10, maxval=100, group=grpMarketStruct, tooltip="15M recommandé: 20-30")
chochLength = input.int(8, "CHOCH/BOS Length", minval=2, maxval=30, group=grpMarketStruct, tooltip="15M recommandé: 8-12")

grpSRSettings = "📍 S/R"
srStrength = input.int(5, "Strength", minval=1, maxval=20, group=grpSRSettings)
srLineWidth = input.int(2, "Line Width", minval=1, maxval=5, group=grpSRSettings)
zonesOnOff = input.bool(true, "Zones", group=grpSRSettings)
zoneWidthPct = input.int(2, "Zone Width %", minval=1, maxval=10, group=grpSRSettings)

// =============== RSI/MACD/ADX ===============
grpMom = "📉 RSI/MACD/ADX"
rsiLen = input.int(14, "RSI Length", group=grpMom, minval=2)
rsiEmaLen = input.int(14, "RSI EMA", group=grpMom, minval=1)
fastLen = input.int(12, "MACD Fast", group=grpMom)
slowLen = input.int(26, "MACD Slow", group=grpMom)
signalLen = input.int(9, "MACD Signal", group=grpMom)
adxLen = input.int(14, "ADX Length", group=grpMom, minval=5, maxval=50)
adxMinTrend = input.int(18, "ADX Min (Balanced)", group=grpMom, minval=5, maxval=50, tooltip="15M recommandé: 18-22")

// =============== HTF CONFLUENCE ===============
grpHTF = "🚀 HTF CONFLUENCE"
useHTFConfluence = input.bool(true, "Activer", group=grpHTF)

// =============== TELEGRAM ===============
grpTG = "📱 TELEGRAM"
tg_enable = input.bool(true, "Webhook", group=grpTG)

// =============== CALCULS ===============
ema1 = ta.ema(close, lenE1)
ema2 = ta.ema(close, lenE2)
ema3 = ta.ema(close, lenE3)
plot(ema1, "EMA12", color=colE1, linewidth=2)
plot(ema2, "EMA26", color=colE2, linewidth=2)
plot(ema3, "EMA200", color=colE3, linewidth=2)

rsi = ta.rsi(close, rsiLen)
rsiEMA = ta.ema(rsi, rsiEmaLen)
macd = ta.ema(close, fastLen) - ta.ema(close, slowLen)
signal = ta.ema(macd, signalLen)
hist = macd - signal

f_adx(_len) =>
    up = ta.change(high)
    dn = -ta.change(low)
    plusDM = (up > dn and up > 0) ? up : 0.0
    minusDM = (dn > up and dn > 0) ? dn : 0.0
    atrLen = ta.atr(_len)
    plusDI = 100.0 * ta.rma(plusDM, _len) / atrLen
    minusDI = 100.0 * ta.rma(minusDM, _len) / atrLen
    dx = 100.0 * math.abs(plusDI - minusDI) / math.max(plusDI + minusDI, 1e-10)
    adxVal = ta.rma(dx, _len)
    adxVal

adx = f_adx(adxLen)
atrTrade = ta.atr(tpslLenInput)

// =============== VECTOR CANDLES (SIMPLES) ===============
avgVolume = ta.sma(volume, volumeLookback)
isBullishCandle = close >= open
isBearishCandle = close < open
volumeRatio = volume / avgVolume
isClimaxVolume = volumeRatio >= 2.0
isAboveAvgVolume = volumeRatio >= 1.5 and volumeRatio < 2.0
pvsraColor = showVectorCandles ? (isBullishCandle and isClimaxVolume ? vectorClimaxUpColor : isBearishCandle and isClimaxVolume ? vectorClimaxDownColor : isBullishCandle and isAboveAvgVolume ? vectorAboveAvgUpColor : isBearishCandle and isAboveAvgVolume ? vectorAboveAvgDownColor : isBullishCandle ? vectorNormalUpColor : vectorNormalDownColor) : na
barcolor(pvsraColor, title="Vector Candles PVSRA")

// =============== SUPPLY/DEMAND ===============
var box[] supplyBoxes = array.new_box(0)
var box[] demandBoxes = array.new_box(0)

if showSupplyDemandInput
    ph = ta.pivothigh(high, swingHighLowLength, swingHighLowLength)
    pl = ta.pivotlow(low, swingHighLowLength, swingHighLowLength)

    if not na(ph)
        supplyTop = high[swingHighLowLength]
        supplyBottom = supplyTop - (supplyTop * sdBoxWidth / 100)
        if close < supplyBottom
            newBox = box.new(bar_index - swingHighLowLength - sdBoxWidth, supplyTop, bar_index + 50, supplyBottom, border_color=color.new(color.red, 70), bgcolor=color.new(color.red, 90), extend=extend.right)
            array.push(supplyBoxes, newBox)
            if array.size(supplyBoxes) > 5
                box.delete(array.shift(supplyBoxes))

    if not na(pl)
        demandBottom = low[swingHighLowLength]
        demandTop = demandBottom + (demandBottom * sdBoxWidth / 100)
        if close > demandTop
            newBox = box.new(bar_index - swingHighLowLength - sdBoxWidth, demandTop, bar_index + 50, demandBottom, border_color=color.new(color.green, 70), bgcolor=color.new(color.green, 90), extend=extend.right)
            array.push(demandBoxes, newBox)
            if array.size(demandBoxes) > 5
                box.delete(array.shift(demandBoxes))

// =============== MARKET STRUCTURE ===============
if showMarketStructInput
    phStruct = ta.pivothigh(high, marketSwingLength, marketSwingLength)
    plStruct = ta.pivotlow(low, marketSwingLength, marketSwingLength)

    var float lastPH = na
    var float lastPL = na

    if not na(phStruct)
        currentPH = phStruct
        if not na(lastPH)
            if currentPH > lastPH
                label.new(bar_index - marketSwingLength, currentPH, "HH", style=label.style_label_down, color=color.new(color.lime, 20), textcolor=color.white, size=size.small)
            else
                label.new(bar_index - marketSwingLength, currentPH, "LH", style=label.style_label_down, color=color.new(color.red, 20), textcolor=color.white, size=size.small)
        lastPH := currentPH

    if not na(plStruct)
        currentPL = plStruct
        if not na(lastPL)
            if currentPL > lastPL
                label.new(bar_index - marketSwingLength, currentPL, "HL", style=label.style_label_up, color=color.new(color.lime, 20), textcolor=color.white, size=size.small)
            else
                label.new(bar_index - marketSwingLength, currentPL, "LL", style=label.style_label_up, color=color.new(color.red, 20), textcolor=color.white, size=size.small)
        lastPL := currentPL

// =============== CHOCH/BOS ===============
if showCHOCHBOSInput
    var float lastSwingHigh = na
    var float lastSwingLow = na

    swingH = ta.pivothigh(high, chochLength, chochLength)
    swingL = ta.pivotlow(low, chochLength, chochLength)

    if not na(swingH)
        lastSwingHigh := swingH
    if not na(swingL)
        lastSwingLow := swingL

    if not na(lastSwingHigh) and close > lastSwingHigh and close[1] <= lastSwingHigh
        label.new(bar_index, high, "BOS↑", style=label.style_label_up, color=color.new(color.aqua, 30), textcolor=color.white, size=size.tiny)

    if not na(lastSwingLow) and close < lastSwingLow and close[1] >= lastSwingLow
        label.new(bar_index, low, "BOS↓", style=label.style_label_down, color=color.new(color.fuchsia, 30), textcolor=color.white, size=size.tiny)

// =============== S/R ===============
ph_sr = ta.pivothigh(high, srStrength, srStrength)
pl_sr = ta.pivotlow(low, srStrength, srStrength)

if showSRInput and barstate.islast
    var float[] srLevels = array.new_float(0)

    for i = 1 to 50
        if not na(ph_sr[i]) and array.size(srLevels) < 6
            array.push(srLevels, ph_sr[i])
        if not na(pl_sr[i]) and array.size(srLevels) < 6
            array.push(srLevels, pl_sr[i])

    for i = 0 to array.size(srLevels) - 1
        level = array.get(srLevels, i)
        isResistance = level > close
        lineColor = isResistance ? color.new(color.red, 30) : color.new(color.green, 30)
        line.new(bar_index - 100, level, bar_index + 20, level, color=lineColor, width=srLineWidth, extend=extend.right)
        if zonesOnOff
            zoneTop = level + (level * zoneWidthPct / 100)
            zoneBottom = level - (level * zoneWidthPct / 100)
            box.new(bar_index - 50, zoneTop, bar_index + 10, zoneBottom, border_color=color.new(lineColor, 70), bgcolor=color.new(lineColor, 95))

// =============== SIGNALS AVEC SENSITIVITY ===============
float sensitivityFactor = manualSensitivity / 5.0
float adjustedADXThreshold = noiseFilter / math.max(sensitivityFactor, 0.2)

// Gates de base
rsiGateUp = rsiEMA >= 50
rsiGateDown = rsiEMA <= 50
macdRegimeUp = macd > 0 and macd > signal
macdRegimeDown = macd < 0 and macd < signal

// ADX avec seuil ajusté par sensitivity
adxOK = adx >= math.min(adjustedADXThreshold, 50)

// Crossovers EMA
crossUp = ta.crossover(ema1, ema2)
crossDn = ta.crossunder(ema1, ema2)

// Filtres optionnels
noiseOK = not useNoiseFilter or adxOK
fakeoutOK = not useFakeoutFilter or (math.abs(close - ema1) / ema1 * 100 >= fakeoutFilter)
rangeOK = not useRangeFilter or (math.abs(high - low) / close * 100 >= rangeFilter)
macdOK_buy = not useMACDFilter or macdRegimeUp
macdOK_sell = not useMACDFilter or macdRegimeDown

// HTF Confluence
f_higherTFTrend(_tf, _direction) =>
    _ema1 = request.security(syminfo.tickerid, _tf, ta.ema(close, lenE1), lookahead=barmerge.lookahead_off)
    _ema2 = request.security(syminfo.tickerid, _tf, ta.ema(close, lenE2), lookahead=barmerge.lookahead_off)
    _close = request.security(syminfo.tickerid, _tf, close, lookahead=barmerge.lookahead_off)
    if _direction == "UP"
        _close > _ema1 and _ema1 > _ema2
    else
        _close < _ema1 and _ema1 < _ema2

tf1 = tfPreset == "15M" ? "60" : tfPreset == "4H" ? "D" : "240"
tf2 = tfPreset == "15M" ? "240" : tfPreset == "4H" ? "W" : "D"

tfHTF1_buy = f_higherTFTrend(tf1, "UP")
tfHTF2_buy = f_higherTFTrend(tf2, "UP")
tfHTF1_sell = f_higherTFTrend(tf1, "DOWN")
tfHTF2_sell = f_higherTFTrend(tf2, "DOWN")

htfConfluenceBuy = useHTFConfluence ? (tfHTF1_buy and tfHTF2_buy) : true
htfConfluenceSell = useHTFConfluence ? (tfHTF1_sell and tfHTF2_sell) : true

// Variables pour tracker le dernier signal
var string currentSignal = na
var string currentEarlySignal = na

// =============== EARLY ENTRY ALERT (CRITÈRES RELAXÉS) ===============
bool earlyLongSetup = ema1 > ema2 and rsiGateUp and adx >= (adjustedADXThreshold * 0.6)
bool earlyShortSetup = ema1 < ema2 and rsiGateDown and adx >= (adjustedADXThreshold * 0.6)

// =============== CONFIRMED ENTRY (TOUS LES CRITÈRES) ===============
bool shouldBeLong = ema1 > ema2 and rsiGateUp and adxOK and noiseOK and fakeoutOK and rangeOK and macdOK_buy and htfConfluenceBuy
bool shouldBeShort = ema1 < ema2 and rsiGateDown and adxOK and noiseOK and fakeoutOK and rangeOK and macdOK_sell and htfConfluenceSell

// =============== CALCUL NIVEAU DE CONFIANCE (0-100%) ===============
calcConfidence() =>
    float score = 0.0
    if rsi <= 30 or rsi >= 70
        score := score + 25.0
    else if rsi <= 35 or rsi >= 65
        score := score + 20.0
    else if rsi <= 40 or rsi >= 60
        score := score + 15.0
    else if rsi <= 45 or rsi >= 55
        score := score + 10.0
    else
        score := score + 5.0

    if adx >= 50
        score := score + 25.0
    else if adx >= 40
        score := score + 20.0
    else if adx >= 30
        score := score + 15.0
    else if adx >= 25
        score := score + 10.0
    else
        score := score + 5.0

    emaDistance = math.abs(ema1 - ema2)
    emaPct = (emaDistance / ema2) * 100
    if emaPct >= 1.0
        score := score + 20.0
    else if emaPct >= 0.5
        score := score + 15.0
    else if emaPct >= 0.25
        score := score + 10.0
    else
        score := score + 5.0

    if (shouldBeLong and macdRegimeUp) or (shouldBeShort and macdRegimeDown)
        score := score + 15.0
    else if not macdRegimeUp and not macdRegimeDown
        score := score + 7.0
    else
        score := score + 0.0

    avgVol = ta.sma(volume, 20)
    if volume >= avgVol * 1.5
        score := score + 10.0
    else if volume >= avgVol * 1.2
        score := score + 7.0
    else if volume >= avgVol
        score := score + 5.0
    else
        score := score + 2.0

    if (shouldBeLong and close > ema3) or (shouldBeShort and close < ema3)
        score := score + 5.0
    else
        score := score + 0.0

    score

float confidenceLevel = calcConfidence()
int confidencePct = math.round(confidenceLevel)

// =============== EARLY ENTRY ALERTS (60-69% CONFIANCE) ===============
earlyBuyAlert = enableEarlyEntry and earlyLongSetup and confidencePct >= 60 and confidencePct < 70 and currentEarlySignal != "EARLY_LONG" and currentSignal != "LONG"
earlySellAlert = enableEarlyEntry and earlyShortSetup and confidencePct >= 60 and confidencePct < 70 and currentEarlySignal != "EARLY_SHORT" and currentSignal != "SHORT"

// =============== CONFIRMED ENTRY (70%+ CONFIANCE) ===============
buyTrig = shouldBeLong and confidencePct >= 70 and currentSignal != "LONG"
sellTrig = shouldBeShort and confidencePct >= 70 and currentSignal != "SHORT"

if earlyBuyAlert
    currentEarlySignal := "EARLY_LONG"
if earlySellAlert
    currentEarlySignal := "EARLY_SHORT"

if buyTrig
    currentSignal := "LONG"
    currentEarlySignal := na
if sellTrig
    currentSignal := "SHORT"
    currentEarlySignal := na

// =============== AFFICHAGE DES SIGNAUX ===============
if earlyBuyAlert
    label.new(bar_index, low, "🟡 SETUP LONG\n" + str.tostring(confidencePct) + "%", style=label.style_label_up, color=color.new(color.yellow, 20), textcolor=color.black, size=size.small)

if earlySellAlert
    label.new(bar_index, high, "🟡 SETUP SHORT\n" + str.tostring(confidencePct) + "%", style=label.style_label_down, color=color.new(color.yellow, 20), textcolor=color.black, size=size.small)

if buyTrig
    label.new(bar_index, low, "🟢 LONG\n" + str.tostring(confidencePct) + "%", style=label.style_label_up, color=color.new(color.lime, 10), textcolor=color.black, size=size.normal)

if sellTrig
    label.new(bar_index, high, "🔴 SHORT\n" + str.tostring(confidencePct) + "%", style=label.style_label_down, color=color.new(color.red, 10), textcolor=color.white, size=size.normal)

plotshape(earlyBuyAlert, "EARLY LONG", shape.circle, location.belowbar, color.new(color.yellow, 0), size=size.tiny)
plotshape(earlySellAlert, "EARLY SHORT", shape.circle, location.abovebar, color.new(color.yellow, 0), size=size.tiny)
plotshape(buyTrig, "LONG", shape.triangleup, location.belowbar, color.new(color.lime, 0), size=size.small)
plotshape(sellTrig, "SHORT", shape.triangledown, location.abovebar, color.new(color.red, 0), size=size.small)

// =============== TP/SL ===============
var string lastSide = na
var float lastEntry = na
var float lastSL = na
var float lastTP1 = na
var float lastTP2 = na
var float lastTP3 = na
var line lineEntry = na
var line lineSL = na
var line lineTP1 = na
var line lineTP2 = na
var line lineTP3 = na

// ✅ Labels uniques (évite le mismatch / doublons)
var label lblEntry = na
var label lblSL = na
var label lblTP1 = na
var label lblTP2 = na
var label lblTP3 = na


f_txt(_name, _price) =>
    _name + " (" + (na(_price) ? "N/A" : str.tostring(_price, format.mintick)) + ")"

if buyTrig
    lastSide := "LONG"
    lastEntry := close
    if tpslTypeInput == "Hybrid"
        lastSL := lastEntry - (atrTrade * tpslMultInput)
        risk = lastEntry - lastSL
        lastTP1 := lastEntry + (risk * tpR1)
        lastTP2 := lastEntry + (risk * tpR2)
        lastTP3 := lastEntry + (risk * tpR3)
    else
        lastSL := lastEntry - (atrTrade * 2.0)
        risk = lastEntry - lastSL
        lastTP1 := lastEntry + (risk * tpR1)
        lastTP2 := lastEntry + (risk * tpR2)
        lastTP3 := lastEntry + (risk * tpR3)

if sellTrig
    lastSide := "SHORT"
    lastEntry := close
    if tpslTypeInput == "Hybrid"
        lastSL := lastEntry + (atrTrade * tpslMultInput)
        risk = lastSL - lastEntry
        lastTP1 := lastEntry - (risk * tpR1)
        lastTP2 := lastEntry - (risk * tpR2)
        lastTP3 := lastEntry - (risk * tpR3)
    else
        lastSL := lastEntry + (atrTrade * 2.0)
        risk = lastSL - lastEntry
        lastTP1 := lastEntry - (risk * tpR1)
        lastTP2 := lastEntry - (risk * tpR2)
        lastTP3 := lastEntry - (risk * tpR3)

if buyTrig or sellTrig
    if not na(lineEntry)
        line.delete(lineEntry)
    if not na(lineSL)
        line.delete(lineSL)
    if not na(lineTP1)
        line.delete(lineTP1)
    if not na(lineTP2)
        line.delete(lineTP2)
    if not na(lineTP3)
        line.delete(lineTP3)

    // ✅ supprimer les anciens labels pour ne garder que le dernier trade
    if not na(lblEntry)
        label.delete(lblEntry)
    if not na(lblSL)
        label.delete(lblSL)
    if not na(lblTP1)
        label.delete(lblTP1)
    if not na(lblTP2)
        label.delete(lblTP2)
    if not na(lblTP3)
        label.delete(lblTP3)
    lblEntry := na
    lblSL := na
    lblTP1 := na
    lblTP2 := na
    lblTP3 := na

    if showTPSL and not na(lastEntry)
        lineEntry := line.new(bar_index, lastEntry, bar_index + 1, lastEntry, color=color.new(color.gray, 0), width=2, style=line.style_dashed, extend=extend.right)
        lineSL := line.new(bar_index, lastSL, bar_index + 1, lastSL, color=color.new(color.red, 0), width=3, style=line.style_solid, extend=extend.right)
        lineTP1 := line.new(bar_index, lastTP1, bar_index + 1, lastTP1, color=color.new(color.green, 0), width=2, style=line.style_dashed, extend=extend.right)
        lineTP2 := line.new(bar_index, lastTP2, bar_index + 1, lastTP2, color=color.new(color.green, 0), width=2, style=line.style_dashed, extend=extend.right)
        lineTP3 := line.new(bar_index, lastTP3, bar_index + 1, lastTP3, color=color.new(color.green, 0), width=2, style=line.style_dashed, extend=extend.right)

// ✅ Mettre à jour (ou créer) UN SEUL set de labels sur la dernière bougie
if barstate.islast
    if showTPSL and not na(lastEntry)
        // ENTRY
        if na(lblEntry)
            lblEntry := label.new(bar_index, lastEntry, f_txt("Entry", lastEntry), style=label.style_label_left, color=color.new(color.gray, 30), textcolor=color.white, size=size.normal)
        else
            label.set_x(lblEntry, bar_index)
            label.set_y(lblEntry, lastEntry)
            label.set_text(lblEntry, f_txt("Entry", lastEntry))

        // SL
        if na(lblSL)
            lblSL := label.new(bar_index, lastSL, f_txt("SL", lastSL), style=label.style_label_left, color=color.new(color.red, 20), textcolor=color.white, size=size.normal)
        else
            label.set_x(lblSL, bar_index)
            label.set_y(lblSL, lastSL)
            label.set_text(lblSL, f_txt("SL", lastSL))

        // TP1
        if na(lblTP1)
            lblTP1 := label.new(bar_index, lastTP1, f_txt("TP1", lastTP1), style=label.style_label_left, color=color.new(color.green, 20), textcolor=color.white, size=size.small)
        else
            label.set_x(lblTP1, bar_index)
            label.set_y(lblTP1, lastTP1)
            label.set_text(lblTP1, f_txt("TP1", lastTP1))

        // TP2
        if na(lblTP2)
            lblTP2 := label.new(bar_index, lastTP2, f_txt("TP2", lastTP2), style=label.style_label_left, color=color.new(color.green, 20), textcolor=color.white, size=size.small)
        else
            label.set_x(lblTP2, bar_index)
            label.set_y(lblTP2, lastTP2)
            label.set_text(lblTP2, f_txt("TP2", lastTP2))

        // TP3
        if na(lblTP3)
            lblTP3 := label.new(bar_index, lastTP3, f_txt("TP3", lastTP3), style=label.style_label_left, color=color.new(color.green, 20), textcolor=color.white, size=size.small)
        else
            label.set_x(lblTP3, bar_index)
            label.set_y(lblTP3, lastTP3)
            label.set_text(lblTP3, f_txt("TP3", lastTP3))
    else
        if not na(lblEntry)
            label.delete(lblEntry)
        if not na(lblSL)
            label.delete(lblSL)
        if not na(lblTP1)
            label.delete(lblTP1)
        if not na(lblTP2)
            label.delete(lblTP2)
        if not na(lblTP3)
            label.delete(lblTP3)
        lblEntry := na
        lblSL := na
        lblTP1 := na
        lblTP2 := na
        lblTP3 := na


// =============== TELEGRAM - AVEC NIVEAU DE CONFIANCE ===============
if tg_enable and earlyBuyAlert
    cleanSymbol = str.replace(syminfo.ticker, ".P", "")
    meta = ",\"exchange\":\"" + syminfo.prefix + "\",\"ticker\":\"" + syminfo.ticker + "\",\"tickerid\":\"" + syminfo.tickerid + "\",\"is_perp\":" + (str.contains(syminfo.ticker, ".P") ? "true" : "false") + ",\"mintick\":" + str.tostring(syminfo.mintick) + ",\"t\":" + str.tostring(timenow)
    payload = "{\"type\":\"EARLY_ALERT\",\"symbol\":\"" + cleanSymbol + "\"" + meta + ",\"side\":\"LONG\",\"current_price\":" + str.tostring(close, format.mintick) + ",\"tf\":\"" + timeframe.period + "\",\"confidence\":" + str.tostring(confidencePct) + ",\"message\":\"Setup en formation - Préparez-vous\"}"
    alert(payload, alert.freq_once_per_bar_close)

if tg_enable and earlySellAlert
    cleanSymbol = str.replace(syminfo.ticker, ".P", "")
    meta = ",\"exchange\":\"" + syminfo.prefix + "\",\"ticker\":\"" + syminfo.ticker + "\",\"tickerid\":\"" + syminfo.tickerid + "\",\"is_perp\":" + (str.contains(syminfo.ticker, ".P") ? "true" : "false") + ",\"mintick\":" + str.tostring(syminfo.mintick) + ",\"t\":" + str.tostring(timenow)
    payload = "{\"type\":\"EARLY_ALERT\",\"symbol\":\"" + cleanSymbol + "\"" + meta + ",\"side\":\"SHORT\",\"current_price\":" + str.tostring(close, format.mintick) + ",\"tf\":\"" + timeframe.period + "\",\"confidence\":" + str.tostring(confidencePct) + ",\"message\":\"Setup en formation - Préparez-vous\"}"
    alert(payload, alert.freq_once_per_bar_close)

if tg_enable and buyTrig
    cleanSymbol = str.replace(syminfo.ticker, ".P", "")
    meta = ",\"exchange\":\"" + syminfo.prefix + "\",\"ticker\":\"" + syminfo.ticker + "\",\"tickerid\":\"" + syminfo.tickerid + "\",\"is_perp\":" + (str.contains(syminfo.ticker, ".P") ? "true" : "false") + ",\"mintick\":" + str.tostring(syminfo.mintick) + ",\"t\":" + str.tostring(timenow)
    payload = "{\"type\":\"ENTRY\",\"symbol\":\"" + cleanSymbol + "\"" + meta + ",\"side\":\"LONG\",\"entry\":" + str.tostring(lastEntry, format.mintick) + ",\"current_price\":" + str.tostring(close, format.mintick) + ",\"sl\":" + str.tostring(lastSL, format.mintick) + ",\"tp1\":" + str.tostring(lastTP1, format.mintick) + ",\"tp2\":" + str.tostring(lastTP2, format.mintick) + ",\"tp3\":" + str.tostring(lastTP3, format.mintick) + ",\"tf\":\"" + timeframe.period + "\",\"confidence\":" + str.tostring(confidencePct) + "}"
    alert(payload, alert.freq_once_per_bar_close)

if tg_enable and sellTrig
    cleanSymbol = str.replace(syminfo.ticker, ".P", "")
    meta = ",\"exchange\":\"" + syminfo.prefix + "\",\"ticker\":\"" + syminfo.ticker + "\",\"tickerid\":\"" + syminfo.tickerid + "\",\"is_perp\":" + (str.contains(syminfo.ticker, ".P") ? "true" : "false") + ",\"mintick\":" + str.tostring(syminfo.mintick) + ",\"t\":" + str.tostring(timenow)
    payload = "{\"type\":\"ENTRY\",\"symbol\":\"" + cleanSymbol + "\"" + meta + ",\"side\":\"SHORT\",\"entry\":" + str.tostring(lastEntry, format.mintick) + ",\"current_price\":" + str.tostring(close, format.mintick) + ",\"sl\":" + str.tostring(lastSL, format.mintick) + ",\"tp1\":" + str.tostring(lastTP1, format.mintick) + ",\"tp2\":" + str.tostring(lastTP2, format.mintick) + ",\"tp3\":" + str.tostring(lastTP3, format.mintick) + ",\"tf\":\"" + timeframe.period + "\",\"confidence\":" + str.tostring(confidencePct) + "}"
    alert(payload, alert.freq_once_per_bar_close)

// =============== DASHBOARD ===============
if showDashboard and barstate.islast
    var table dashboard = table.new(position.top_right, 2, 11, bgcolor=color.new(#1E222D, 10), frame_color=color.new(#2A2E39, 0), frame_width=2, border_width=1, border_color=color.new(#363A45, 0))

    modeColor = isProV3Mode ? color.new(color.aqua, 30) : color.new(color.orange, 30)
    modeText = isProV3Mode ? "Pro V3 SMRT" : "Magic Mike"

    table.cell(dashboard, 0, 0, "🎯 " + modeText, text_color=color.white, bgcolor=modeColor, text_size=size.normal, text_halign=text.align_center)
    table.merge_cells(dashboard, 0, 0, 1, 0)

    posColor = lastSide == "LONG" ? color.new(color.lime, 30) : lastSide == "SHORT" ? color.new(color.red, 30) : color.new(color.gray, 50)
    table.cell(dashboard, 0, 1, "Position", text_color=color.white, bgcolor=color.new(#2A2E39, 30), text_size=size.small)
    table.cell(dashboard, 1, 1, na(lastSide) ? "None" : lastSide, text_color=color.white, bgcolor=posColor, text_size=size.small)

    earlyAlertStatus = enableEarlyEntry ? (currentEarlySignal == "EARLY_LONG" ? "🟡 LONG" : currentEarlySignal == "EARLY_SHORT" ? "🟡 SHORT" : "OFF") : "OFF"
    earlyAlertColor = currentEarlySignal == "EARLY_LONG" ? color.new(color.yellow, 30) : currentEarlySignal == "EARLY_SHORT" ? color.new(color.yellow, 30) : color.new(color.gray, 50)
    table.cell(dashboard, 0, 2, "Early Alert", text_color=color.white, bgcolor=color.new(#2A2E39, 30), text_size=size.small)
    table.cell(dashboard, 1, 2, earlyAlertStatus, text_color=color.black, bgcolor=earlyAlertColor, text_size=size.small)

    currentTrend = ema1 > ema2 ? "Bullish" : ema1 < ema2 ? "Bearish" : "Neutral"
    trendColor = ema1 > ema2 ? color.new(color.lime, 30) : ema1 < ema2 ? color.new(color.red, 30) : color.new(color.gray, 50)
    table.cell(dashboard, 0, 3, tfLabel + " Trend", text_color=color.white, bgcolor=color.new(#2A2E39, 30), text_size=size.small)
    table.cell(dashboard, 1, 3, currentTrend, text_color=color.white, bgcolor=trendColor, text_size=size.small)

    htfStatus = useHTFConfluence ? (htfConfluenceBuy ? "✅ BUY" : htfConfluenceSell ? "✅ SELL" : "⛔ WAIT") : "OFF"
    htfColor = htfConfluenceBuy ? color.new(color.lime, 30) : htfConfluenceSell ? color.new(color.red, 30) : color.new(color.gray, 50)
    table.cell(dashboard, 0, 4, "HTF Align", text_color=color.white, bgcolor=color.new(#2A2E39, 30), text_size=size.small)
    table.cell(dashboard, 1, 4, htfStatus, text_color=color.white, bgcolor=htfColor, text_size=size.small)

    table.cell(dashboard, 0, 5, "RSI", text_color=color.white, bgcolor=color.new(#2A2E39, 30), text_size=size.tiny)
    table.cell(dashboard, 1, 5, str.tostring(math.round(rsi, 1)), text_color=color.white, bgcolor=color.new(#2A2E39, 50), text_size=size.tiny)

    table.cell(dashboard, 0, 6, "ADX", text_color=color.white, bgcolor=color.new(#2A2E39, 30), text_size=size.tiny)
    adxColor = adxOK ? color.new(color.lime, 50) : color.new(color.red, 50)
    table.cell(dashboard, 1, 6, str.tostring(math.round(adx, 1)), text_color=color.white, bgcolor=adxColor, text_size=size.tiny)

    table.cell(dashboard, 0, 7, "MACD", text_color=color.white, bgcolor=color.new(#2A2E39, 30), text_size=size.tiny)
    macdStatus = macdRegimeUp ? "BULL" : macdRegimeDown ? "BEAR" : "NEUT"
    macdColor = macdRegimeUp ? color.new(color.lime, 50) : macdRegimeDown ? color.new(color.red, 50) : color.new(color.gray, 50)
    table.cell(dashboard, 1, 7, macdStatus, text_color=color.white, bgcolor=macdColor, text_size=size.tiny)

    table.cell(dashboard, 0, 8, "Sensitivity", text_color=color.white, bgcolor=color.new(#2A2E39, 30), text_size=size.tiny)
    sensColor = manualSensitivity >= 10 ? color.new(color.lime, 50) : manualSensitivity >= 5 ? color.new(color.orange, 50) : color.new(color.red, 50)
    table.cell(dashboard, 1, 8, str.tostring(manualSensitivity, "#.#"), text_color=color.white, bgcolor=sensColor, text_size=size.tiny)

    filtersActive = 0
    if useNoiseFilter
        filtersActive += 1
    if useFakeoutFilter
        filtersActive += 1
    if useRangeFilter
        filtersActive += 1
    if useMACDFilter
        filtersActive += 1

    table.cell(dashboard, 0, 9, "Filters", text_color=color.white, bgcolor=color.new(#2A2E39, 30), text_size=size.tiny)
    table.cell(dashboard, 1, 9, str.tostring(filtersActive) + "/4", text_color=color.white, bgcolor=color.new(#2A2E39, 50), text_size=size.tiny)

    confColor = confidencePct >= 70 ? color.new(color.lime, 30) : confidencePct >= 50 ? color.new(color.orange, 30) : color.new(color.red, 30)
    confEmoji = confidencePct >= 70 ? "🟢" : confidencePct >= 50 ? "🟡" : "🔴"
    table.cell(dashboard, 0, 10, "Confiance", text_color=color.white, bgcolor=color.new(#2A2E39, 30), text_size=size.tiny)
    table.cell(dashboard, 1, 10, confEmoji + " " + str.tostring(confidencePct) + "%", text_color=color.white, bgcolor=confColor, text_size=size.tiny)

alertcondition(earlyBuyAlert, "🟡 EARLY LONG ALERT", "Setup LONG en formation")
alertcondition(earlySellAlert, "🟡 EARLY SHORT ALERT", "Setup SHORT en formation")
alertcondition(buyTrig, "🚀 BUY CONFIRMED", "Entry LONG confirmée")
alertcondition(sellTrig, "🔻 SELL CONFIRMED", "Entry SHORT confirmée")
