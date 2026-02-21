/**
 * Backtesting Engine — Uses REAL Binance klines data
 * NO Math.random() — All trades are deterministic from real price history
 */

export interface Candle {
  time: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BacktestTrade {
  id: number;
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  type: "LONG" | "SHORT";
  pnl: number;
  pnlPct: number;
  profitable: boolean;
  reason: string;
}

export interface BacktestResult {
  trades: BacktestTrade[];
  totalReturn: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  totalTrades: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  equityCurve: { date: string; equity: number; buyHold: number; price: number }[];
  candles: Candle[];
}

// ─── Fetch real Binance klines ─────────────────────────────────────────────

export async function fetchBinanceKlines(
  symbol: string,
  interval: string,
  limit: number = 500
): Promise<Candle[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance API error: ${res.status}`);
  const data = await res.json();

  return data.map((k: any[]) => ({
    time: k[0],
    date: new Date(k[0]).toLocaleDateString("fr-FR"),
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}

// ─── Technical Indicators ──────────────────────────────────────────────────

export function sma(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) sum += data[j];
      result.push(sum / period);
    }
  }
  return result;
}

export function ema(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const k = 2 / (period + 1);
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      let sum = 0;
      for (let j = 0; j < period; j++) sum += data[j];
      result.push(sum / period);
    } else {
      const prev = result[i - 1];
      if (prev !== null) {
        result.push(data[i] * k + prev * (1 - k));
      } else {
        result.push(null);
      }
    }
  }
  return result;
}

export function rsi(closes: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      result.push(null);
      continue;
    }
    const change = closes[i] - closes[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);

    if (i < period) {
      result.push(null);
    } else if (i === period) {
      const avgGain = gains.slice(0, period).reduce((s, v) => s + v, 0) / period;
      const avgLoss = losses.slice(0, period).reduce((s, v) => s + v, 0) / period;
      if (avgLoss === 0) {
        result.push(100);
      } else {
        result.push(100 - 100 / (1 + avgGain / avgLoss));
      }
    } else {
      // Use smoothed averages
      const prevRsi = result[i - 1];
      if (prevRsi === null) {
        result.push(null);
        continue;
      }
      const prevAvgGain = gains.slice(i - period, i).reduce((s, v) => s + v, 0) / period;
      const prevAvgLoss = losses.slice(i - period, i).reduce((s, v) => s + v, 0) / period;
      if (prevAvgLoss === 0) {
        result.push(100);
      } else {
        result.push(100 - 100 / (1 + prevAvgGain / prevAvgLoss));
      }
    }
  }
  return result;
}

export function macd(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macdLine: (number | null)[]; signalLine: (number | null)[]; histogram: (number | null)[] } {
  const fastEma = ema(closes, fastPeriod);
  const slowEma = ema(closes, slowPeriod);

  const macdLine: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (fastEma[i] !== null && slowEma[i] !== null) {
      macdLine.push(fastEma[i]! - slowEma[i]!);
    } else {
      macdLine.push(null);
    }
  }

  const macdValues = macdLine.filter((v) => v !== null) as number[];
  const signalEma = ema(macdValues, signalPeriod);

  const signalLine: (number | null)[] = [];
  const histogram: (number | null)[] = [];
  let macdIdx = 0;
  for (let i = 0; i < closes.length; i++) {
    if (macdLine[i] !== null) {
      const sig = signalEma[macdIdx] ?? null;
      signalLine.push(sig);
      histogram.push(sig !== null ? macdLine[i]! - sig : null);
      macdIdx++;
    } else {
      signalLine.push(null);
      histogram.push(null);
    }
  }

  return { macdLine, signalLine, histogram };
}

export function bollingerBands(
  closes: number[],
  period: number = 20,
  stdDev: number = 2
): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
  const middle = sma(closes, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (middle[i] === null) {
      upper.push(null);
      lower.push(null);
    } else {
      let sumSq = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sumSq += (closes[j] - middle[i]!) ** 2;
      }
      const sd = Math.sqrt(sumSq / period);
      upper.push(middle[i]! + stdDev * sd);
      lower.push(middle[i]! - stdDev * sd);
    }
  }

  return { upper, middle, lower };
}

// ─── Strategy Implementations ──────────────────────────────────────────────

type StrategyFn = (candles: Candle[], capital: number) => BacktestTrade[];

function maCrossoverStrategy(candles: Candle[], capital: number): BacktestTrade[] {
  const closes = candles.map((c) => c.close);
  const ma20 = sma(closes, 20);
  const ma50 = sma(closes, 50);
  const trades: BacktestTrade[] = [];
  let inPosition = false;
  let entryIdx = 0;
  let tradeId = 1;
  const positionSize = capital * 0.1; // 10% per trade

  for (let i = 51; i < candles.length; i++) {
    const prev20 = ma20[i - 1];
    const prev50 = ma50[i - 1];
    const curr20 = ma20[i];
    const curr50 = ma50[i];
    if (!prev20 || !prev50 || !curr20 || !curr50) continue;

    // Golden cross: MA20 crosses above MA50
    if (!inPosition && prev20 <= prev50 && curr20 > curr50) {
      inPosition = true;
      entryIdx = i;
    }
    // Death cross: MA20 crosses below MA50 — exit
    else if (inPosition && prev20 >= prev50 && curr20 < curr50) {
      const entryPrice = candles[entryIdx].close;
      const exitPrice = candles[i].close;
      const pnlPct = ((exitPrice - entryPrice) / entryPrice) * 100;
      const pnl = positionSize * (pnlPct / 100);
      trades.push({
        id: tradeId++,
        entryDate: candles[entryIdx].date,
        exitDate: candles[i].date,
        entryPrice,
        exitPrice,
        type: "LONG",
        pnl: Math.round(pnl * 100) / 100,
        pnlPct: Math.round(pnlPct * 100) / 100,
        profitable: pnl > 0,
        reason: `MA20/MA50 crossover — Entrée: golden cross, Sortie: death cross`,
      });
      inPosition = false;
    }
  }

  // Close open position at end
  if (inPosition) {
    const entryPrice = candles[entryIdx].close;
    const exitPrice = candles[candles.length - 1].close;
    const pnlPct = ((exitPrice - entryPrice) / entryPrice) * 100;
    const pnl = positionSize * (pnlPct / 100);
    trades.push({
      id: tradeId++,
      entryDate: candles[entryIdx].date,
      exitDate: candles[candles.length - 1].date,
      entryPrice,
      exitPrice,
      type: "LONG",
      pnl: Math.round(pnl * 100) / 100,
      pnlPct: Math.round(pnlPct * 100) / 100,
      profitable: pnl > 0,
      reason: `MA20/MA50 crossover — Position ouverte clôturée en fin de période`,
    });
  }

  return trades;
}

function rsiStrategy(candles: Candle[], capital: number): BacktestTrade[] {
  const closes = candles.map((c) => c.close);
  const rsiValues = rsi(closes, 14);
  const trades: BacktestTrade[] = [];
  let inPosition = false;
  let entryIdx = 0;
  let tradeId = 1;
  const positionSize = capital * 0.1;

  for (let i = 15; i < candles.length; i++) {
    const r = rsiValues[i];
    const prevR = rsiValues[i - 1];
    if (r === null || prevR === null) continue;

    // Buy when RSI crosses above 30 (oversold recovery)
    if (!inPosition && prevR <= 30 && r > 30) {
      inPosition = true;
      entryIdx = i;
    }
    // Sell when RSI crosses above 70 (overbought)
    else if (inPosition && r >= 70) {
      const entryPrice = candles[entryIdx].close;
      const exitPrice = candles[i].close;
      const pnlPct = ((exitPrice - entryPrice) / entryPrice) * 100;
      const pnl = positionSize * (pnlPct / 100);
      trades.push({
        id: tradeId++,
        entryDate: candles[entryIdx].date,
        exitDate: candles[i].date,
        entryPrice,
        exitPrice,
        type: "LONG",
        pnl: Math.round(pnl * 100) / 100,
        pnlPct: Math.round(pnlPct * 100) / 100,
        profitable: pnl > 0,
        reason: `RSI 14 — Entrée: RSI < 30 (survente), Sortie: RSI > 70 (surachat)`,
      });
      inPosition = false;
    }
    // Stop loss: -5% from entry
    else if (inPosition) {
      const entryPrice = candles[entryIdx].close;
      const currentPnlPct = ((candles[i].close - entryPrice) / entryPrice) * 100;
      if (currentPnlPct <= -5) {
        const exitPrice = candles[i].close;
        const pnl = positionSize * (currentPnlPct / 100);
        trades.push({
          id: tradeId++,
          entryDate: candles[entryIdx].date,
          exitDate: candles[i].date,
          entryPrice,
          exitPrice,
          type: "LONG",
          pnl: Math.round(pnl * 100) / 100,
          pnlPct: Math.round(currentPnlPct * 100) / 100,
          profitable: false,
          reason: `RSI 14 — Stop loss déclenché à -5%`,
        });
        inPosition = false;
      }
    }
  }

  if (inPosition) {
    const entryPrice = candles[entryIdx].close;
    const exitPrice = candles[candles.length - 1].close;
    const pnlPct = ((exitPrice - entryPrice) / entryPrice) * 100;
    const pnl = positionSize * (pnlPct / 100);
    trades.push({
      id: tradeId++,
      entryDate: candles[entryIdx].date,
      exitDate: candles[candles.length - 1].date,
      entryPrice,
      exitPrice,
      type: "LONG",
      pnl: Math.round(pnl * 100) / 100,
      pnlPct: Math.round(pnlPct * 100) / 100,
      profitable: pnl > 0,
      reason: `RSI 14 — Position ouverte clôturée en fin de période`,
    });
  }

  return trades;
}

function macdStrategy(candles: Candle[], capital: number): BacktestTrade[] {
  const closes = candles.map((c) => c.close);
  const { macdLine, signalLine } = macd(closes);
  const trades: BacktestTrade[] = [];
  let inPosition = false;
  let entryIdx = 0;
  let tradeId = 1;
  const positionSize = capital * 0.1;

  for (let i = 1; i < candles.length; i++) {
    const m = macdLine[i];
    const s = signalLine[i];
    const pm = macdLine[i - 1];
    const ps = signalLine[i - 1];
    if (m === null || s === null || pm === null || ps === null) continue;

    // MACD crosses above signal — bullish
    if (!inPosition && pm <= ps && m > s) {
      inPosition = true;
      entryIdx = i;
    }
    // MACD crosses below signal — bearish exit
    else if (inPosition && pm >= ps && m < s) {
      const entryPrice = candles[entryIdx].close;
      const exitPrice = candles[i].close;
      const pnlPct = ((exitPrice - entryPrice) / entryPrice) * 100;
      const pnl = positionSize * (pnlPct / 100);
      trades.push({
        id: tradeId++,
        entryDate: candles[entryIdx].date,
        exitDate: candles[i].date,
        entryPrice,
        exitPrice,
        type: "LONG",
        pnl: Math.round(pnl * 100) / 100,
        pnlPct: Math.round(pnlPct * 100) / 100,
        profitable: pnl > 0,
        reason: `MACD — Entrée: MACD > Signal, Sortie: MACD < Signal`,
      });
      inPosition = false;
    }
  }

  if (inPosition) {
    const entryPrice = candles[entryIdx].close;
    const exitPrice = candles[candles.length - 1].close;
    const pnlPct = ((exitPrice - entryPrice) / entryPrice) * 100;
    const pnl = positionSize * (pnlPct / 100);
    trades.push({
      id: tradeId++,
      entryDate: candles[entryIdx].date,
      exitDate: candles[candles.length - 1].date,
      entryPrice,
      exitPrice,
      type: "LONG",
      pnl: Math.round(pnl * 100) / 100,
      pnlPct: Math.round(pnlPct * 100) / 100,
      profitable: pnl > 0,
      reason: `MACD — Position ouverte clôturée en fin de période`,
    });
  }

  return trades;
}

function bollingerStrategy(candles: Candle[], capital: number): BacktestTrade[] {
  const closes = candles.map((c) => c.close);
  const { upper, lower } = bollingerBands(closes, 20, 2);
  const trades: BacktestTrade[] = [];
  let inPosition = false;
  let entryIdx = 0;
  let tradeId = 1;
  const positionSize = capital * 0.1;

  for (let i = 21; i < candles.length; i++) {
    const u = upper[i];
    const l = lower[i];
    if (u === null || l === null) continue;

    // Buy when price touches lower band
    if (!inPosition && candles[i].close <= l) {
      inPosition = true;
      entryIdx = i;
    }
    // Sell when price touches upper band
    else if (inPosition && candles[i].close >= u) {
      const entryPrice = candles[entryIdx].close;
      const exitPrice = candles[i].close;
      const pnlPct = ((exitPrice - entryPrice) / entryPrice) * 100;
      const pnl = positionSize * (pnlPct / 100);
      trades.push({
        id: tradeId++,
        entryDate: candles[entryIdx].date,
        exitDate: candles[i].date,
        entryPrice,
        exitPrice,
        type: "LONG",
        pnl: Math.round(pnl * 100) / 100,
        pnlPct: Math.round(pnlPct * 100) / 100,
        profitable: pnl > 0,
        reason: `Bollinger Bands — Entrée: prix ≤ bande basse, Sortie: prix ≥ bande haute`,
      });
      inPosition = false;
    }
    // Stop loss: -7%
    else if (inPosition) {
      const entryPrice = candles[entryIdx].close;
      const currentPnlPct = ((candles[i].close - entryPrice) / entryPrice) * 100;
      if (currentPnlPct <= -7) {
        const pnl = positionSize * (currentPnlPct / 100);
        trades.push({
          id: tradeId++,
          entryDate: candles[entryIdx].date,
          exitDate: candles[i].date,
          entryPrice,
          exitPrice: candles[i].close,
          type: "LONG",
          pnl: Math.round(pnl * 100) / 100,
          pnlPct: Math.round(currentPnlPct * 100) / 100,
          profitable: false,
          reason: `Bollinger Bands — Stop loss déclenché à -7%`,
        });
        inPosition = false;
      }
    }
  }

  if (inPosition) {
    const entryPrice = candles[entryIdx].close;
    const exitPrice = candles[candles.length - 1].close;
    const pnlPct = ((exitPrice - entryPrice) / entryPrice) * 100;
    const pnl = positionSize * (pnlPct / 100);
    trades.push({
      id: tradeId++,
      entryDate: candles[entryIdx].date,
      exitDate: candles[candles.length - 1].date,
      entryPrice,
      exitPrice,
      type: "LONG",
      pnl: Math.round(pnl * 100) / 100,
      pnlPct: Math.round(pnlPct * 100) / 100,
      profitable: pnl > 0,
      reason: `Bollinger Bands — Position ouverte clôturée en fin de période`,
    });
  }

  return trades;
}

function breakoutStrategy(candles: Candle[], capital: number): BacktestTrade[] {
  const trades: BacktestTrade[] = [];
  let inPosition = false;
  let entryIdx = 0;
  let tradeId = 1;
  const positionSize = capital * 0.1;
  const lookback = 20;

  for (let i = lookback; i < candles.length; i++) {
    // Find highest high and lowest low of last 20 candles
    let highestHigh = -Infinity;
    for (let j = i - lookback; j < i; j++) {
      if (candles[j].high > highestHigh) highestHigh = candles[j].high;
    }

    // Breakout above resistance
    if (!inPosition && candles[i].close > highestHigh) {
      inPosition = true;
      entryIdx = i;
    }
    // Exit: price drops below 20-period low OR -5% stop
    else if (inPosition) {
      let lowestLow = Infinity;
      for (let j = i - lookback; j < i; j++) {
        if (candles[j].low < lowestLow) lowestLow = candles[j].low;
      }

      const entryPrice = candles[entryIdx].close;
      const currentPnlPct = ((candles[i].close - entryPrice) / entryPrice) * 100;

      if (candles[i].close < lowestLow || currentPnlPct <= -5) {
        const pnl = positionSize * (currentPnlPct / 100);
        trades.push({
          id: tradeId++,
          entryDate: candles[entryIdx].date,
          exitDate: candles[i].date,
          entryPrice,
          exitPrice: candles[i].close,
          type: "LONG",
          pnl: Math.round(pnl * 100) / 100,
          pnlPct: Math.round(currentPnlPct * 100) / 100,
          profitable: pnl > 0,
          reason: currentPnlPct <= -5
            ? `Breakout 20 — Stop loss déclenché à -5%`
            : `Breakout 20 — Sortie: prix < plus bas 20 périodes`,
        });
        inPosition = false;
      }
    }
  }

  if (inPosition) {
    const entryPrice = candles[entryIdx].close;
    const exitPrice = candles[candles.length - 1].close;
    const pnlPct = ((exitPrice - entryPrice) / entryPrice) * 100;
    const pnl = positionSize * (pnlPct / 100);
    trades.push({
      id: tradeId++,
      entryDate: candles[entryIdx].date,
      exitDate: candles[candles.length - 1].date,
      entryPrice,
      exitPrice,
      type: "LONG",
      pnl: Math.round(pnl * 100) / 100,
      pnlPct: Math.round(pnlPct * 100) / 100,
      profitable: pnl > 0,
      reason: `Breakout 20 — Position ouverte clôturée en fin de période`,
    });
  }

  return trades;
}

// ─── Strategy Map ──────────────────────────────────────────────────────────

export const STRATEGY_MAP: Record<string, { name: string; desc: string; fn: StrategyFn }> = {
  ma_cross: { name: "Moving Average Crossover", desc: "Croisement MA 20/50 — Golden/Death Cross", fn: maCrossoverStrategy },
  rsi_ob: { name: "RSI Overbought/Oversold", desc: "RSI 14 — Achat < 30, Vente > 70, SL -5%", fn: rsiStrategy },
  macd: { name: "MACD Signal", desc: "Croisement MACD/Signal Line (12, 26, 9)", fn: macdStrategy },
  bollinger: { name: "Bollinger Bands", desc: "Rebond bande basse → vente bande haute, SL -7%", fn: bollingerStrategy },
  breakout: { name: "Breakout Strategy", desc: "Cassure du plus haut 20 périodes, SL -5%", fn: breakoutStrategy },
};

// ─── Run Backtest ──────────────────────────────────────────────────────────

export function runBacktest(
  candles: Candle[],
  strategyId: string,
  capital: number
): BacktestResult {
  const strategy = STRATEGY_MAP[strategyId];
  if (!strategy) throw new Error(`Unknown strategy: ${strategyId}`);

  const trades = strategy.fn(candles, capital);

  // Calculate equity curve
  const equityCurve: BacktestResult["equityCurve"] = [];
  let equity = capital;
  const startPrice = candles[0].close;

  // Build a map of trade exits by date for equity tracking
  const tradeExitMap = new Map<string, number>();
  for (const t of trades) {
    const existing = tradeExitMap.get(t.exitDate) || 0;
    tradeExitMap.set(t.exitDate, existing + t.pnl);
  }

  for (const candle of candles) {
    const pnlOnDate = tradeExitMap.get(candle.date) || 0;
    equity += pnlOnDate;
    equityCurve.push({
      date: candle.date,
      equity: Math.round(equity * 100) / 100,
      buyHold: Math.round((capital * (candle.close / startPrice)) * 100) / 100,
      price: candle.close,
    });
  }

  // Stats
  const wins = trades.filter((t) => t.profitable);
  const losses = trades.filter((t) => !t.profitable);
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const totalReturn = capital > 0 ? (totalPnl / capital) * 100 : 0;

  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 0;
  const profitFactor = avgLoss > 0 ? (wins.reduce((s, t) => s + t.pnl, 0)) / Math.abs(losses.reduce((s, t) => s + t.pnl, 0) || 1) : wins.length > 0 ? 999 : 0;

  // Max drawdown
  let peak = capital;
  let maxDrawdown = 0;
  for (const point of equityCurve) {
    if (point.equity > peak) peak = point.equity;
    const dd = ((peak - point.equity) / peak) * 100;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  // Sharpe ratio (simplified: annualized return / annualized std dev of returns)
  const dailyReturns: number[] = [];
  for (let i = 1; i < equityCurve.length; i++) {
    const ret = (equityCurve[i].equity - equityCurve[i - 1].equity) / equityCurve[i - 1].equity;
    dailyReturns.push(ret);
  }
  const avgReturn = dailyReturns.length > 0 ? dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length : 0;
  const stdDev = dailyReturns.length > 1
    ? Math.sqrt(dailyReturns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / (dailyReturns.length - 1))
    : 0;
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

  return {
    trades,
    totalReturn: Math.round(totalReturn * 100) / 100,
    winRate: Math.round(winRate * 10) / 10,
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    totalTrades: trades.length,
    profitFactor: Math.round(profitFactor * 100) / 100,
    avgWin: Math.round(avgWin * 100) / 100,
    avgLoss: Math.round(avgLoss * 100) / 100,
    equityCurve,
    candles,
  };
}

// ─── Available Binance Symbols ─────────────────────────────────────────────

export const BINANCE_SYMBOLS = [
  "BTCUSDT", "ETHUSDT", "BNBUSDT", "XRPUSDT", "SOLUSDT", "ADAUSDT", "DOGEUSDT",
  "TRXUSDT", "AVAXUSDT", "LINKUSDT", "DOTUSDT", "SHIBUSDT", "TONUSDT",
  "BCHUSDT", "LTCUSDT", "UNIUSDT", "ATOMUSDT", "XLMUSDT", "NEARUSDT", "APTUSDT",
  "FILUSDT", "ARBUSDT", "OPUSDT", "VETUSDT", "HBARUSDT", "MKRUSDT", "GRTUSDT",
  "INJUSDT", "FTMUSDT", "THETAUSDT", "AAVEUSDT", "ALGOUSDT", "FLOWUSDT", "AXSUSDT",
  "SANDUSDT", "MANAUSDT", "XTZUSDT", "EOSUSDT", "SNXUSDT", "CRVUSDT",
  "RUNEUSDT", "DYDXUSDT", "SUIUSDT", "SEIUSDT", "TIAUSDT", "JUPUSDT",
];

export const TIMEFRAMES = [
  { label: "15 minutes", value: "15m", limit: 500 },
  { label: "1 heure", value: "1h", limit: 500 },
  { label: "4 heures", value: "4h", limit: 500 },
  { label: "1 jour", value: "1d", limit: 365 },
];