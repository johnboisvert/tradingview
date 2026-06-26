// Shared Challenge feature types. Centralized here so the parent page and all
// extracted subcomponents (OrderTicket, PositionsTable, EquityCurve, …) agree
// on the wire format coming from /api/v1/challenge/*.

export interface Position {
  id: string;
  symbol: string;
  side: "long" | "short";
  qty: number;
  avg_price: number;
  mark?: number;
  value?: number;
  pnl?: number;
  pnl_pct?: number;
  sl?: number;
  tp?: number;
  opened_at?: string;
  collateral?: number;
  leverage?: number;
  liquidation_price?: number | null;
}

export interface Trade {
  ts: string;
  action?: "open" | "close";
  side: "buy" | "sell" | "long" | "short";
  symbol: string;
  qty: number;
  price: number;
  value: number;
  pnl?: number;
  trigger?: string;
  leverage?: number;
}

export interface Coin {
  symbol: string;
  name: string;
  image: string | null;
  price: number;
  change_24h: number;
  rank: number;
  market_cap?: number;
}

export interface Achievement { key: string; unlocked_at: string }
export interface AchievementMeta { key: string; emoji: string; name: string; desc: string }

export interface Stats {
  wins?: number;
  losses?: number;
  best_pnl?: number;
  worst_pnl?: number;
  largest_trade_value?: number;
  liquidations?: number;
}

export interface EquitySnapshot { ts: string; equity: number }

export interface Me {
  username: string;
  balance: number;
  positions: Record<string, Position>;
  equity: number;
  roi_pct: number;
  trades: Trade[];
  prices?: Record<string, number>;
  pnl_realized?: number;
  achievements?: Achievement[];
  equity_history?: EquitySnapshot[];
  win_streak?: number;
  stats?: Stats;
}

export interface LeaderRow {
  username: string;
  equity: number;
  roi_pct: number;
  trade_count: number;
}

export interface LeaderboardResp {
  ok: boolean;
  period: string;
  starting_balance: number;
  total_participants: number;
  leaderboard: LeaderRow[];
  last_winner: { period: string; username: string; equity: number } | null;
  prize: string;
}
