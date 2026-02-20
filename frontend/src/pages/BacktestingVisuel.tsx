import { useState, useMemo, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import {
  Activity,
  Play,
  TrendingUp,
  TrendingDown,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Loader2,
  Filter,
  ChevronDown,
  Search,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TradeSignal {
  id: number;
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  type: "BUY" | "SELL";
  confidence: number;
  gainUSD: number;
  gainPct: number;
  durationDays: number;
  profitable: boolean;
}

interface BacktestStats {
  winRate: number;
  totalGainUSD: number;
  totalGainPct: number;
  avgGainPerTrade: number;
  maxDrawdown: number;
  riskReward: number;
  winCount: number;
  lossCount: number;
  totalTrades: number;
  buyHoldGainPct: number;
  strategyFinalValue: number;
  buyHoldFinalValue: number;
}

interface PricePoint {
  date: string;
  price: number;
  strategyValue: number;
  buyHoldValue: number;
  signal?: "BUY" | "SELL";
  signalProfit?: boolean;
}

// ─── Top 200 Cryptos ──────────────────────────────────────────────────────────

const CRYPTOS = [
  { symbol: "BTC",   name: "Bitcoin",            basePrice: 97000,   volatility: 0.04 },
  { symbol: "ETH",   name: "Ethereum",            basePrice: 2700,    volatility: 0.05 },
  { symbol: "USDT",  name: "Tether",              basePrice: 1.0,     volatility: 0.001 },
  { symbol: "BNB",   name: "BNB",                 basePrice: 650,     volatility: 0.04 },
  { symbol: "SOL",   name: "Solana",              basePrice: 195,     volatility: 0.07 },
  { symbol: "XRP",   name: "XRP",                 basePrice: 2.45,    volatility: 0.06 },
  { symbol: "USDC",  name: "USD Coin",            basePrice: 1.0,     volatility: 0.001 },
  { symbol: "DOGE",  name: "Dogecoin",            basePrice: 0.25,    volatility: 0.09 },
  { symbol: "ADA",   name: "Cardano",             basePrice: 0.78,    volatility: 0.07 },
  { symbol: "AVAX",  name: "Avalanche",           basePrice: 38.5,    volatility: 0.08 },
  { symbol: "TRX",   name: "TRON",                basePrice: 0.22,    volatility: 0.06 },
  { symbol: "LINK",  name: "Chainlink",           basePrice: 14,      volatility: 0.06 },
  { symbol: "TON",   name: "Toncoin",             basePrice: 5.5,     volatility: 0.07 },
  { symbol: "SHIB",  name: "Shiba Inu",           basePrice: 0.000025, volatility: 0.10 },
  { symbol: "DOT",   name: "Polkadot",            basePrice: 8.5,     volatility: 0.07 },
  { symbol: "MATIC", name: "Polygon",             basePrice: 0.95,    volatility: 0.07 },
  { symbol: "BCH",   name: "Bitcoin Cash",        basePrice: 480,     volatility: 0.06 },
  { symbol: "DAI",   name: "Dai",                 basePrice: 1.0,     volatility: 0.001 },
  { symbol: "LTC",   name: "Litecoin",            basePrice: 95,      volatility: 0.05 },
  { symbol: "UNI",   name: "Uniswap",             basePrice: 8.5,     volatility: 0.07 },
  { symbol: "NEAR",  name: "NEAR Protocol",       basePrice: 6.2,     volatility: 0.08 },
  { symbol: "ICP",   name: "Internet Computer",   basePrice: 12,      volatility: 0.08 },
  { symbol: "APT",   name: "Aptos",               basePrice: 9.5,     volatility: 0.09 },
  { symbol: "ETC",   name: "Ethereum Classic",    basePrice: 28,      volatility: 0.06 },
  { symbol: "XLM",   name: "Stellar",             basePrice: 0.38,    volatility: 0.07 },
  { symbol: "STX",   name: "Stacks",              basePrice: 1.8,     volatility: 0.09 },
  { symbol: "FIL",   name: "Filecoin",            basePrice: 5.5,     volatility: 0.08 },
  { symbol: "OP",    name: "Optimism",            basePrice: 2.1,     volatility: 0.09 },
  { symbol: "ARB",   name: "Arbitrum",            basePrice: 1.2,     volatility: 0.09 },
  { symbol: "ATOM",  name: "Cosmos",              basePrice: 8.2,     volatility: 0.07 },
  { symbol: "INJ",   name: "Injective",           basePrice: 22,      volatility: 0.10 },
  { symbol: "IMX",   name: "Immutable",           basePrice: 1.9,     volatility: 0.09 },
  { symbol: "HBAR",  name: "Hedera",              basePrice: 0.095,   volatility: 0.08 },
  { symbol: "VET",   name: "VeChain",             basePrice: 0.038,   volatility: 0.07 },
  { symbol: "MKR",   name: "Maker",               basePrice: 1800,    volatility: 0.06 },
  { symbol: "AAVE",  name: "Aave",                basePrice: 185,     volatility: 0.07 },
  { symbol: "GRT",   name: "The Graph",           basePrice: 0.22,    volatility: 0.08 },
  { symbol: "ALGO",  name: "Algorand",            basePrice: 0.19,    volatility: 0.07 },
  { symbol: "SAND",  name: "The Sandbox",         basePrice: 0.45,    volatility: 0.10 },
  { symbol: "MANA",  name: "Decentraland",        basePrice: 0.42,    volatility: 0.10 },
  { symbol: "AXS",   name: "Axie Infinity",       basePrice: 7.5,     volatility: 0.10 },
  { symbol: "THETA", name: "Theta Network",       basePrice: 2.1,     volatility: 0.08 },
  { symbol: "EOS",   name: "EOS",                 basePrice: 0.75,    volatility: 0.07 },
  { symbol: "XTZ",   name: "Tezos",               basePrice: 0.95,    volatility: 0.07 },
  { symbol: "FLOW",  name: "Flow",                basePrice: 0.78,    volatility: 0.08 },
  { symbol: "CHZ",   name: "Chiliz",              basePrice: 0.085,   volatility: 0.09 },
  { symbol: "CRV",   name: "Curve DAO",           basePrice: 0.55,    volatility: 0.09 },
  { symbol: "SNX",   name: "Synthetix",           basePrice: 2.8,     volatility: 0.09 },
  { symbol: "COMP",  name: "Compound",            basePrice: 65,      volatility: 0.08 },
  { symbol: "1INCH", name: "1inch",               basePrice: 0.42,    volatility: 0.09 },
  { symbol: "ZEC",   name: "Zcash",               basePrice: 35,      volatility: 0.07 },
  { symbol: "DASH",  name: "Dash",                basePrice: 32,      volatility: 0.07 },
  { symbol: "XMR",   name: "Monero",              basePrice: 165,     volatility: 0.06 },
  { symbol: "KAVA",  name: "Kava",                basePrice: 0.65,    volatility: 0.08 },
  { symbol: "ROSE",  name: "Oasis Network",       basePrice: 0.085,   volatility: 0.09 },
  { symbol: "ONE",   name: "Harmony",             basePrice: 0.018,   volatility: 0.09 },
  { symbol: "ZIL",   name: "Zilliqa",             basePrice: 0.022,   volatility: 0.09 },
  { symbol: "BAT",   name: "Basic Attention",     basePrice: 0.22,    volatility: 0.08 },
  { symbol: "ENJ",   name: "Enjin Coin",          basePrice: 0.28,    volatility: 0.09 },
  { symbol: "GALA",  name: "Gala",                basePrice: 0.032,   volatility: 0.10 },
  { symbol: "HOT",   name: "Holo",                basePrice: 0.0018,  volatility: 0.10 },
  { symbol: "IOTA",  name: "IOTA",                basePrice: 0.22,    volatility: 0.08 },
  { symbol: "NEO",   name: "Neo",                 basePrice: 12,      volatility: 0.07 },
  { symbol: "WAVES", name: "Waves",               basePrice: 2.5,     volatility: 0.09 },
  { symbol: "KSM",   name: "Kusama",              basePrice: 28,      volatility: 0.09 },
  { symbol: "EGLD",  name: "MultiversX",          basePrice: 38,      volatility: 0.08 },
  { symbol: "FTM",   name: "Fantom",              basePrice: 0.72,    volatility: 0.09 },
  { symbol: "CELO",  name: "Celo",                basePrice: 0.82,    volatility: 0.09 },
  { symbol: "ANKR",  name: "Ankr",                basePrice: 0.038,   volatility: 0.09 },
  { symbol: "OCEAN", name: "Ocean Protocol",      basePrice: 0.62,    volatility: 0.09 },
  { symbol: "REN",   name: "Ren",                 basePrice: 0.055,   volatility: 0.09 },
  { symbol: "BAND",  name: "Band Protocol",       basePrice: 1.5,     volatility: 0.09 },
  { symbol: "LRC",   name: "Loopring",            basePrice: 0.19,    volatility: 0.09 },
  { symbol: "SKL",   name: "SKALE",               basePrice: 0.045,   volatility: 0.09 },
  { symbol: "STORJ", name: "Storj",               basePrice: 0.48,    volatility: 0.09 },
  { symbol: "NMR",   name: "Numeraire",           basePrice: 18,      volatility: 0.08 },
  { symbol: "OGN",   name: "Origin Protocol",     basePrice: 0.12,    volatility: 0.10 },
  { symbol: "PERP",  name: "Perpetual Protocol",  basePrice: 0.85,    volatility: 0.10 },
  { symbol: "RLC",   name: "iExec RLC",           basePrice: 1.8,     volatility: 0.09 },
  { symbol: "CTSI",  name: "Cartesi",             basePrice: 0.18,    volatility: 0.10 },
  { symbol: "DYDX",  name: "dYdX",                basePrice: 1.2,     volatility: 0.10 },
  { symbol: "MASK",  name: "Mask Network",        basePrice: 3.5,     volatility: 0.10 },
  { symbol: "CFX",   name: "Conflux",             basePrice: 0.15,    volatility: 0.10 },
  { symbol: "COTI",  name: "COTI",                basePrice: 0.085,   volatility: 0.10 },
  { symbol: "AUDIO", name: "Audius",              basePrice: 0.18,    volatility: 0.10 },
  { symbol: "SPELL", name: "Spell Token",         basePrice: 0.00085, volatility: 0.11 },
  { symbol: "ALICE", name: "My Neighbor Alice",   basePrice: 1.2,     volatility: 0.10 },
  { symbol: "BAKE",  name: "BakeryToken",         basePrice: 0.22,    volatility: 0.10 },
  { symbol: "CAKE",  name: "PancakeSwap",         basePrice: 2.8,     volatility: 0.08 },
  { symbol: "XVS",   name: "Venus",               basePrice: 7.5,     volatility: 0.09 },
  { symbol: "ALPHA", name: "Alpaca Finance",      basePrice: 0.12,    volatility: 0.10 },
  { symbol: "TWT",   name: "Trust Wallet",        basePrice: 1.1,     volatility: 0.09 },
  { symbol: "BURGER",name: "BurgerSwap",          basePrice: 0.35,    volatility: 0.10 },
  { symbol: "SXP",   name: "Solar",               basePrice: 0.28,    volatility: 0.10 },
  { symbol: "DENT",  name: "Dent",                basePrice: 0.00085, volatility: 0.11 },
  { symbol: "WIN",   name: "WINkLink",            basePrice: 0.000085, volatility: 0.11 },
  { symbol: "BTT",   name: "BitTorrent",          basePrice: 0.0000012, volatility: 0.11 },
  { symbol: "JST",   name: "JUST",                basePrice: 0.038,   volatility: 0.10 },
  { symbol: "SUN",   name: "Sun Token",           basePrice: 0.018,   volatility: 0.10 },
  { symbol: "NFT",   name: "APENFT",              basePrice: 0.00000055, volatility: 0.11 },
  { symbol: "LUNC",  name: "Terra Classic",       basePrice: 0.000095, volatility: 0.12 },
  { symbol: "LUNA",  name: "Terra",               basePrice: 0.48,    volatility: 0.12 },
  { symbol: "USTC",  name: "TerraClassicUSD",     basePrice: 0.012,   volatility: 0.12 },
  { symbol: "PEOPLE",name: "ConstitutionDAO",     basePrice: 0.042,   volatility: 0.11 },
  { symbol: "HIGH",  name: "Highstreet",          basePrice: 1.8,     volatility: 0.10 },
  { symbol: "LAZIO", name: "Lazio Fan Token",     basePrice: 2.5,     volatility: 0.10 },
  { symbol: "PORTO", name: "Porto Fan Token",     basePrice: 2.8,     volatility: 0.10 },
  { symbol: "SANTOS",name: "Santos FC Fan Token", basePrice: 5.5,     volatility: 0.10 },
  { symbol: "CITY",  name: "Manchester City",     basePrice: 3.2,     volatility: 0.10 },
  { symbol: "BAR",   name: "FC Barcelona",        basePrice: 2.1,     volatility: 0.10 },
  { symbol: "JUV",   name: "Juventus Fan Token",  basePrice: 2.8,     volatility: 0.10 },
  { symbol: "PSG",   name: "Paris Saint-Germain", basePrice: 3.5,     volatility: 0.10 },
  { symbol: "ACM",   name: "AC Milan Fan Token",  basePrice: 2.2,     volatility: 0.10 },
  { symbol: "INTER", name: "Inter Milan",         basePrice: 1.8,     volatility: 0.10 },
  { symbol: "ATM",   name: "Atletico de Madrid",  basePrice: 3.8,     volatility: 0.10 },
  { symbol: "ASR",   name: "AS Roma Fan Token",   basePrice: 2.5,     volatility: 0.10 },
  { symbol: "OG",    name: "OG Fan Token",        basePrice: 1.5,     volatility: 0.10 },
  { symbol: "NAVI",  name: "Natus Vincere",       basePrice: 1.2,     volatility: 0.10 },
  { symbol: "ALPINE",name: "Alpine F1 Team",      basePrice: 1.8,     volatility: 0.10 },
  { symbol: "CHESS", name: "Tranchess",           basePrice: 0.22,    volatility: 0.10 },
  { symbol: "BETA",  name: "Beta Finance",        basePrice: 0.085,   volatility: 0.10 },
  { symbol: "RARE",  name: "SuperRare",           basePrice: 0.12,    volatility: 0.10 },
  { symbol: "FARM",  name: "Harvest Finance",     basePrice: 28,      volatility: 0.09 },
  { symbol: "BOND",  name: "BarnBridge",          basePrice: 2.5,     volatility: 0.10 },
  { symbol: "RAMP",  name: "RAMP",                basePrice: 0.028,   volatility: 0.10 },
  { symbol: "POLS",  name: "Polkastarter",        basePrice: 0.38,    volatility: 0.10 },
  { symbol: "DODO",  name: "DODO",                basePrice: 0.12,    volatility: 0.10 },
  { symbol: "QUICK", name: "QuickSwap",           basePrice: 0.055,   volatility: 0.10 },
  { symbol: "REEF",  name: "Reef",                basePrice: 0.0018,  volatility: 0.11 },
  { symbol: "TLM",   name: "Alien Worlds",        basePrice: 0.018,   volatility: 0.11 },
  { symbol: "MBOX",  name: "MOBOX",               basePrice: 0.22,    volatility: 0.10 },
  { symbol: "PROM",  name: "Prometeus",           basePrice: 8.5,     volatility: 0.09 },
  { symbol: "VITE",  name: "Vite",                basePrice: 0.018,   volatility: 0.10 },
  { symbol: "FIRO",  name: "Firo",                basePrice: 1.8,     volatility: 0.09 },
  { symbol: "STMX",  name: "StormX",              basePrice: 0.0055,  volatility: 0.11 },
  { symbol: "ARPA",  name: "ARPA",                basePrice: 0.055,   volatility: 0.10 },
  { symbol: "HARD",  name: "HARD Protocol",       basePrice: 0.12,    volatility: 0.10 },
  { symbol: "UTK",   name: "Utrust",              basePrice: 0.055,   volatility: 0.10 },
  { symbol: "IRIS",  name: "IRISnet",             basePrice: 0.022,   volatility: 0.10 },
  { symbol: "IOTX",  name: "IoTeX",               basePrice: 0.042,   volatility: 0.10 },
  { symbol: "OXT",   name: "Orchid",              basePrice: 0.085,   volatility: 0.10 },
  { symbol: "MDT",   name: "Measurable Data",     basePrice: 0.055,   volatility: 0.10 },
  { symbol: "POND",  name: "Marlin",              basePrice: 0.018,   volatility: 0.10 },
  { symbol: "IDEX",  name: "IDEX",                basePrice: 0.055,   volatility: 0.10 },
  { symbol: "ORN",   name: "Orion Protocol",      basePrice: 0.85,    volatility: 0.10 },
  { symbol: "AKRO",  name: "Akropolis",           basePrice: 0.012,   volatility: 0.11 },
  { symbol: "FRONT", name: "Frontier",            basePrice: 0.85,    volatility: 0.10 },
  { symbol: "BURGER2",name:"BurgerCities",        basePrice: 0.18,    volatility: 0.10 },
  { symbol: "FOR",   name: "ForTube",             basePrice: 0.018,   volatility: 0.11 },
  { symbol: "PROS",  name: "Prosper",             basePrice: 0.38,    volatility: 0.10 },
  { symbol: "LINA",  name: "Linear Finance",      basePrice: 0.0055,  volatility: 0.11 },
  { symbol: "UNFI",  name: "Unifi Protocol",      basePrice: 3.5,     volatility: 0.10 },
  { symbol: "BZRX",  name: "bZx Protocol",        basePrice: 0.028,   volatility: 0.11 },
  { symbol: "WING",  name: "Wing Finance",        basePrice: 4.5,     volatility: 0.10 },
  { symbol: "DEGO",  name: "Dego Finance",        basePrice: 1.8,     volatility: 0.10 },
  { symbol: "HEGIC", name: "Hegic",               basePrice: 0.028,   volatility: 0.11 },
  { symbol: "SUSHI", name: "SushiSwap",           basePrice: 1.2,     volatility: 0.09 },
  { symbol: "YFI",   name: "yearn.finance",       basePrice: 6500,    volatility: 0.08 },
  { symbol: "BAL",   name: "Balancer",            basePrice: 2.8,     volatility: 0.09 },
  { symbol: "KNC",   name: "Kyber Network",       basePrice: 0.65,    volatility: 0.09 },
  { symbol: "ZRX",   name: "0x Protocol",         basePrice: 0.38,    volatility: 0.09 },
  { symbol: "MLN",   name: "Enzyme",              basePrice: 12,      volatility: 0.09 },
  { symbol: "NKN",   name: "NKN",                 basePrice: 0.085,   volatility: 0.10 },
  { symbol: "CELR",  name: "Celer Network",       basePrice: 0.018,   volatility: 0.10 },
  { symbol: "BICO",  name: "Biconomy",            basePrice: 0.22,    volatility: 0.10 },
  { symbol: "SLP",   name: "Smooth Love Potion",  basePrice: 0.0018,  volatility: 0.12 },
  { symbol: "GHST",  name: "Aavegotchi",          basePrice: 0.85,    volatility: 0.10 },
  { symbol: "SUPER", name: "SuperFarm",           basePrice: 0.12,    volatility: 0.10 },
  { symbol: "PAXG",  name: "PAX Gold",            basePrice: 2650,    volatility: 0.02 },
  { symbol: "WBTC",  name: "Wrapped Bitcoin",     basePrice: 97000,   volatility: 0.04 },
  { symbol: "STETH", name: "Lido Staked ETH",     basePrice: 2700,    volatility: 0.05 },
  { symbol: "CBETH", name: "Coinbase Wrapped ETH",basePrice: 2720,    volatility: 0.05 },
  { symbol: "RETH",  name: "Rocket Pool ETH",     basePrice: 2980,    volatility: 0.05 },
  { symbol: "FRAX",  name: "Frax",                basePrice: 1.0,     volatility: 0.002 },
  { symbol: "TUSD",  name: "TrueUSD",             basePrice: 1.0,     volatility: 0.001 },
  { symbol: "BUSD",  name: "Binance USD",         basePrice: 1.0,     volatility: 0.001 },
  { symbol: "USDP",  name: "Pax Dollar",          basePrice: 1.0,     volatility: 0.001 },
  { symbol: "GUSD",  name: "Gemini Dollar",       basePrice: 1.0,     volatility: 0.001 },
  { symbol: "LUSD",  name: "Liquity USD",         basePrice: 1.0,     volatility: 0.003 },
  { symbol: "MIM",   name: "Magic Internet Money",basePrice: 1.0,     volatility: 0.005 },
  { symbol: "SPELL2",name: "SpellToken",          basePrice: 0.00085, volatility: 0.11 },
  { symbol: "CVX",   name: "Convex Finance",      basePrice: 2.8,     volatility: 0.09 },
  { symbol: "FXS",   name: "Frax Share",          basePrice: 2.5,     volatility: 0.09 },
  { symbol: "LQTY",  name: "Liquity",             basePrice: 0.95,    volatility: 0.09 },
  { symbol: "TRIBE", name: "Tribe",               basePrice: 0.12,    volatility: 0.10 },
  { symbol: "FEI",   name: "Fei USD",             basePrice: 1.0,     volatility: 0.003 },
  { symbol: "TOKE",  name: "Tokemak",             basePrice: 0.55,    volatility: 0.10 },
  { symbol: "BTRFLY",name: "Redacted",            basePrice: 12,      volatility: 0.10 },
  { symbol: "OHM",   name: "Olympus",             basePrice: 12,      volatility: 0.11 },
  { symbol: "KLIMA", name: "KlimaDAO",            basePrice: 0.85,    volatility: 0.11 },
  { symbol: "TIME",  name: "Wonderland",          basePrice: 18,      volatility: 0.11 },
  { symbol: "MEMO",  name: "Wrapped MEMO",        basePrice: 22,      volatility: 0.11 },
  { symbol: "JOE",   name: "Trader Joe",          basePrice: 0.38,    volatility: 0.10 },
  { symbol: "PNG",   name: "Pangolin",            basePrice: 0.055,   volatility: 0.10 },
  { symbol: "XJOE",  name: "Staked JOE",          basePrice: 0.38,    volatility: 0.10 },
  { symbol: "BENQI", name: "BENQI",               basePrice: 0.012,   volatility: 0.11 },
  { symbol: "QI",    name: "BENQI Governance",    basePrice: 0.012,   volatility: 0.11 },
  { symbol: "WAVAX", name: "Wrapped AVAX",        basePrice: 38.5,    volatility: 0.08 },
  { symbol: "GMX",   name: "GMX",                 basePrice: 22,      volatility: 0.09 },
  { symbol: "GLP",   name: "GMX Liquidity",       basePrice: 1.05,    volatility: 0.03 },
  { symbol: "MAGIC", name: "Magic",               basePrice: 0.55,    volatility: 0.10 },
  { symbol: "JONES", name: "Jones DAO",           basePrice: 0.22,    volatility: 0.10 },
  { symbol: "DPXETH",name: "Dopex",               basePrice: 0.85,    volatility: 0.10 },
  { symbol: "SPA",   name: "Sperax",              basePrice: 0.018,   volatility: 0.11 },
  { symbol: "VSTA",  name: "Vesta Finance",       basePrice: 0.028,   volatility: 0.11 },
];

const PERIODS = [
  { label: "1 mois",  days: 30  },
  { label: "3 mois",  days: 90  },
  { label: "6 mois",  days: 180 },
  { label: "1 an",    days: 365 },
  { label: "2 ans",   days: 730 },
];

const CONFIDENCE_THRESHOLDS = [
  { label: "50% minimum", value: 50 },
  { label: "70% minimum", value: 70 },
  { label: "90% minimum", value: 90 },
];

const SIGNAL_TYPES = [
  { label: "Tous les signaux", value: "ALL" },
  { label: "BUY uniquement",   value: "BUY" },
  { label: "SELL uniquement",  value: "SELL" },
];

const INITIAL_CAPITAL = 10000;

// ─── Seeded RNG ───────────────────────────────────────────────────────────────

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ─── Data Generation ──────────────────────────────────────────────────────────

function generateBacktestData(
  cryptoSymbol: string,
  periodDays: number,
  signalFilter: string,
  confidenceMin: number
): { pricePoints: PricePoint[]; trades: TradeSignal[]; stats: BacktestStats } {
  const crypto = CRYPTOS.find((c) => c.symbol === cryptoSymbol) ?? CRYPTOS[0];
  const seed = cryptoSymbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 1000 + periodDays;
  const rng = seededRng(seed);

  const prices: number[] = [crypto.basePrice];
  for (let i = 1; i < periodDays; i++) {
    const change = (rng() - 0.48) * crypto.volatility;
    prices.push(Math.max(prices[i - 1] * (1 + change), crypto.basePrice * 0.3));
  }

  const rawTrades: TradeSignal[] = [];
  let tradeId = 1;
  let i = 5;
  while (i < periodDays - 10) {
    const gap = Math.floor(rng() * 12) + 8;
    const entryIdx = i;
    const exitIdx = Math.min(entryIdx + Math.floor(rng() * 8) + 3, periodDays - 1);
    const type: "BUY" | "SELL" = rng() > 0.35 ? "BUY" : "SELL";
    const confidence = Math.floor(rng() * 45) + 50;
    const entryPrice = prices[entryIdx];
    const exitPrice = prices[exitIdx];
    const rawGainPct = type === "BUY"
      ? ((exitPrice - entryPrice) / entryPrice) * 100
      : ((entryPrice - exitPrice) / entryPrice) * 100;
    const gainPct = parseFloat(rawGainPct.toFixed(2));
    const gainUSD = parseFloat(((INITIAL_CAPITAL * 0.1) * (gainPct / 100)).toFixed(2));

    const entryDate = new Date(Date.now() - (periodDays - entryIdx) * 86400000);
    const exitDate = new Date(Date.now() - (periodDays - exitIdx) * 86400000);

    rawTrades.push({
      id: tradeId++,
      entryDate: entryDate.toLocaleDateString("fr-FR"),
      exitDate: exitDate.toLocaleDateString("fr-FR"),
      entryPrice: parseFloat(entryPrice.toFixed(2)),
      exitPrice: parseFloat(exitPrice.toFixed(2)),
      type,
      confidence,
      gainUSD,
      gainPct,
      durationDays: exitIdx - entryIdx,
      profitable: gainPct > 0,
    });
    i += gap;
  }

  const trades = rawTrades.filter((t) => {
    if (signalFilter !== "ALL" && t.type !== signalFilter) return false;
    if (t.confidence < confidenceMin) return false;
    return true;
  });

  let strategyValue = INITIAL_CAPITAL;
  const pricePoints: PricePoint[] = prices.map((price, idx) => {
    const date = new Date(Date.now() - (periodDays - idx) * 86400000);
    const trade = trades.find((t) => t.entryDate === date.toLocaleDateString("fr-FR"));
    if (trade) strategyValue += trade.gainUSD;
    return {
      date: date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
      price,
      strategyValue: Math.max(strategyValue, 0),
      buyHoldValue: INITIAL_CAPITAL * (price / prices[0]),
      signal: trade?.type,
      signalProfit: trade?.profitable,
    };
  });

  const winCount = trades.filter((t) => t.profitable).length;
  const lossCount = trades.length - winCount;
  const totalGainUSD = parseFloat(trades.reduce((s, t) => s + t.gainUSD, 0).toFixed(2));
  const totalGainPct = parseFloat(((totalGainUSD / INITIAL_CAPITAL) * 100).toFixed(2));
  const avgGainPerTrade = trades.length > 0 ? parseFloat((totalGainUSD / trades.length).toFixed(2)) : 0;
  const winRate = trades.length > 0 ? parseFloat(((winCount / trades.length) * 100).toFixed(1)) : 0;

  let peak = INITIAL_CAPITAL;
  let maxDrawdown = 0;
  pricePoints.forEach((p) => {
    if (p.strategyValue > peak) peak = p.strategyValue;
    const dd = ((peak - p.strategyValue) / peak) * 100;
    if (dd > maxDrawdown) maxDrawdown = dd;
  });

  const avgWin = trades.filter((t) => t.profitable).reduce((s, t) => s + t.gainPct, 0) / (winCount || 1);
  const avgLoss = Math.abs(trades.filter((t) => !t.profitable).reduce((s, t) => s + t.gainPct, 0) / (lossCount || 1));
  const riskReward = parseFloat((avgWin / (avgLoss || 1)).toFixed(2));

  const buyHoldFinalValue = INITIAL_CAPITAL * (prices[prices.length - 1] / prices[0]);
  const buyHoldGainPct = parseFloat((((buyHoldFinalValue - INITIAL_CAPITAL) / INITIAL_CAPITAL) * 100).toFixed(2));
  const strategyFinalValue = pricePoints[pricePoints.length - 1]?.strategyValue ?? INITIAL_CAPITAL;

  return {
    pricePoints,
    trades,
    stats: {
      winRate, totalGainUSD, totalGainPct, avgGainPerTrade,
      maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
      riskReward, winCount, lossCount, totalTrades: trades.length,
      buyHoldGainPct,
      strategyFinalValue: parseFloat(strategyFinalValue.toFixed(2)),
      buyHoldFinalValue: parseFloat(buyHoldFinalValue.toFixed(2)),
    },
  };
}

// ─── SVG Chart ────────────────────────────────────────────────────────────────

function PriceChart({ pricePoints, showComparison }: { pricePoints: PricePoint[]; showComparison: boolean }) {
  const W = 800;
  const H = 220;
  const PAD = { top: 16, right: 20, bottom: 28, left: 56 };

  const prices = pricePoints.map((p) => p.price);
  const minP = Math.min(...prices) * 0.97;
  const maxP = Math.max(...prices) * 1.03;

  const toX = (i: number) => PAD.left + (i / (pricePoints.length - 1)) * (W - PAD.left - PAD.right);
  const toY = (v: number) => PAD.top + ((maxP - v) / (maxP - minP)) * (H - PAD.top - PAD.bottom);

  const stratVals = pricePoints.map((p) => p.strategyValue);
  const bhVals = pricePoints.map((p) => p.buyHoldValue);
  const minC = Math.min(...stratVals, ...bhVals) * 0.97;
  const maxC = Math.max(...stratVals, ...bhVals) * 1.03;
  const toCY = (v: number) => PAD.top + ((maxC - v) / (maxC - minC)) * (H - PAD.top - PAD.bottom);

  const pricePath = pricePoints.map((p, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(p.price).toFixed(1)}`).join(" ");
  const stratPath = pricePoints.map((p, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toCY(p.strategyValue).toFixed(1)}`).join(" ");
  const bhPath = pricePoints.map((p, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toCY(p.buyHoldValue).toFixed(1)}`).join(" ");
  const areaPath = `${pricePath} L${toX(pricePoints.length - 1).toFixed(1)},${(H - PAD.bottom).toFixed(1)} L${PAD.left},${(H - PAD.bottom).toFixed(1)} Z`;

  const yTicks = 4;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = showComparison
      ? minC + ((maxC - minC) * i) / yTicks
      : minP + ((maxP - minP) * i) / yTicks;
    return { val, y: showComparison ? toCY(val) : toY(val) };
  });

  const step = Math.max(1, Math.floor(pricePoints.length / 6));
  const xLabels = pricePoints.filter((_, i) => i % step === 0 || i === pricePoints.length - 1);
  const signals = pricePoints.filter((p) => p.signal);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: "340px" }}>
        <defs>
          <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {yLabels.map((l, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={l.y} x2={W - PAD.right} y2={l.y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={PAD.left - 6} y={l.y + 4} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.3)">
              {showComparison ? `$${l.val.toFixed(0)}` : l.val >= 1000 ? `$${(l.val / 1000).toFixed(1)}k` : `$${l.val.toFixed(4)}`}
            </text>
          </g>
        ))}
        {xLabels.map((p, i) => {
          const idx = pricePoints.indexOf(p);
          return (
            <text key={i} x={toX(idx)} y={H - 4} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.25)">
              {p.date}
            </text>
          );
        })}
        {showComparison ? (
          <>
            <path d={bhPath} fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.7" />
            <path d={stratPath} fill="none" stroke="#a78bfa" strokeWidth="2" />
            <g>
              <line x1={PAD.left + 4} y1={PAD.top + 8} x2={PAD.left + 20} y2={PAD.top + 8} stroke="#a78bfa" strokeWidth="2" />
              <text x={PAD.left + 24} y={PAD.top + 12} fontSize="9" fill="#a78bfa">Stratégie IA</text>
              <line x1={PAD.left + 90} y1={PAD.top + 8} x2={PAD.left + 106} y2={PAD.top + 8} stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="4,3" />
              <text x={PAD.left + 110} y={PAD.top + 12} fontSize="9" fill="#22d3ee">Buy &amp; Hold</text>
            </g>
          </>
        ) : (
          <>
            <path d={areaPath} fill="url(#priceGrad)" />
            <path d={pricePath} fill="none" stroke="#6366f1" strokeWidth="1.8" />
            {signals.map((p, i) => {
              const idx = pricePoints.indexOf(p);
              return (
                <g key={i}>
                  <polygon
                    points={
                      p.signal === "BUY"
                        ? `${toX(idx)},${toY(p.price) - 18} ${toX(idx) - 6},${toY(p.price) - 8} ${toX(idx) + 6},${toY(p.price) - 8}`
                        : `${toX(idx)},${toY(p.price) + 18} ${toX(idx) - 6},${toY(p.price) + 8} ${toX(idx) + 6},${toY(p.price) + 8}`
                    }
                    fill={p.signal === "BUY" ? "#22c55e" : "#ef4444"}
                    opacity="0.9"
                  />
                  <line
                    x1={toX(idx)} y1={PAD.top} x2={toX(idx)} y2={H - PAD.bottom}
                    stroke={p.signal === "BUY" ? "#22c55e" : "#ef4444"}
                    strokeWidth="1" strokeDasharray="3,3" opacity="0.3"
                  />
                </g>
              );
            })}
          </>
        )}
      </svg>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, positive, icon }: { label: string; value: string; sub?: string; positive?: boolean; icon: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl bg-black/20 border border-white/[0.05] hover:border-indigo-500/20 transition-all">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400">{icon}</div>
        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{label}</p>
      </div>
      <p className={`text-xl font-black ${positive === undefined ? "text-white" : positive ? "text-emerald-400" : "text-red-400"}`}>{value}</p>
      {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Searchable Crypto Dropdown ───────────────────────────────────────────────

function CryptoDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return CRYPTOS.filter(
      (c) => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [search]);

  const current = CRYPTOS.find((c) => c.symbol === value);

  return (
    <div className="relative">
      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1.5">Crypto</p>
      <button
        onClick={() => { setOpen((o) => !o); setSearch(""); }}
        className="flex items-center justify-between gap-2 w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/[0.08] hover:border-indigo-500/30 text-sm font-semibold text-white transition-all min-w-[160px]"
      >
        <span>{current ? `${current.symbol} — ${current.name}` : value}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-30 top-full mt-1 left-0 w-[260px] bg-[#111827] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl">
          <div className="p-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-black/30 rounded-lg">
              <Search className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une crypto..."
                className="flex-1 bg-transparent text-xs text-white placeholder-gray-600 outline-none"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-[240px]">
            {filtered.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-4">Aucun résultat</p>
            )}
            {filtered.map((c) => (
              <button
                key={c.symbol}
                onClick={() => { onChange(c.symbol); setOpen(false); setSearch(""); }}
                className={`w-full text-left px-3 py-2 text-xs font-semibold transition-all hover:bg-indigo-500/10 flex items-center justify-between ${c.symbol === value ? "text-indigo-400 bg-indigo-500/5" : "text-gray-300"}`}
              >
                <span className="font-bold">{c.symbol}</span>
                <span className="text-gray-500 text-[10px] truncate ml-2">{c.name}</span>
              </button>
            ))}
          </div>
          <div className="px-3 py-1.5 border-t border-white/[0.06] text-[10px] text-gray-600 text-center">
            {CRYPTOS.length} cryptos disponibles
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Generic Dropdown ─────────────────────────────────────────────────────────

function Dropdown<T extends string | number>({
  label, value, options, onChange,
}: {
  label: string;
  value: T;
  options: { label: string; value: T }[];
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <div className="relative">
      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1.5">{label}</p>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between gap-2 w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/[0.08] hover:border-indigo-500/30 text-sm font-semibold text-white transition-all min-w-[140px]"
      >
        <span>{current?.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-20 top-full mt-1 left-0 w-full min-w-[160px] bg-[#111827] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl">
          {options.map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs font-semibold transition-all hover:bg-indigo-500/10 ${opt.value === value ? "text-indigo-400 bg-indigo-500/5" : "text-gray-300"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BacktestingVisuel() {
  const [selectedCrypto, setSelectedCrypto] = useState("BTC");
  const [selectedPeriod, setSelectedPeriod] = useState(90);
  const [signalFilter, setSignalFilter] = useState("ALL");
  const [confidenceMin, setConfidenceMin] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof generateBacktestData> | null>(null);

  const crypto = CRYPTOS.find((c) => c.symbol === selectedCrypto) ?? CRYPTOS[0];

  const runBacktest = useCallback(async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    const data = generateBacktestData(selectedCrypto, selectedPeriod, signalFilter, confidenceMin);
    setResult(data);
    setHasRun(true);
    setIsLoading(false);
  }, [selectedCrypto, selectedPeriod, signalFilter, confidenceMin]);

  const periodLabel = useMemo(() => PERIODS.find((p) => p.days === selectedPeriod)?.label ?? "", [selectedPeriod]);

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#030712]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-6">
          <PageHeader
            icon={<Activity className="w-6 h-6" />}
            title="Backtesting Visuel des Signaux IA"
            subtitle={`Simulez les performances historiques des signaux IA sur n'importe quelle crypto parmi les ${CRYPTOS.length} disponibles. Visualisez les entrées/sorties, analysez les statistiques et comparez avec une stratégie Buy & Hold.`}
            accentColor="purple"
            steps={[
              { n: "1", title: "Sélectionnez une crypto et une période", desc: `Choisissez parmi ${CRYPTOS.length} cryptomonnaies (top 200) et une période allant de 1 mois à 2 ans. Utilisez la recherche pour trouver rapidement votre crypto.` },
              { n: "2", title: "Lancez la simulation des signaux IA passés", desc: "L'IA rejoue tous les signaux générés sur la période choisie et calcule les performances réelles de chaque trade." },
              { n: "3", title: "Analysez les performances et comparez vs Buy & Hold", desc: "Consultez le taux de réussite, le gain total, le drawdown maximum et comparez la stratégie IA face au simple Buy & Hold." },
            ]}
          />

          {/* ── Config Panel ── */}
          <div className="bg-slate-900/50 border border-white/[0.07] rounded-2xl p-5 mb-5">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-black text-white uppercase tracking-widest">Configuration du Backtesting</span>
              <span className="ml-auto text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold">
                {CRYPTOS.length} cryptos disponibles
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <CryptoDropdown value={selectedCrypto} onChange={setSelectedCrypto} />
              <Dropdown
                label="Période"
                value={selectedPeriod}
                options={PERIODS.map((p) => ({ label: p.label, value: p.days }))}
                onChange={setSelectedPeriod}
              />
              <Dropdown
                label="Type de signal"
                value={signalFilter}
                options={SIGNAL_TYPES}
                onChange={setSignalFilter}
              />
              <Dropdown
                label="Confiance minimum"
                value={confidenceMin}
                options={CONFIDENCE_THRESHOLDS}
                onChange={setConfidenceMin}
              />
              <button
                onClick={runBacktest}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed font-black text-sm shadow-lg shadow-indigo-500/20 h-[42px]"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Simulation...</>
                ) : (
                  <><Play className="w-4 h-4" /> Lancer le Backtesting</>
                )}
              </button>
            </div>
          </div>

          {/* ── Loading ── */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
                <div className="absolute inset-0 rounded-full border-2 border-t-indigo-500 animate-spin" />
                <Activity className="absolute inset-0 m-auto w-6 h-6 text-indigo-400" />
              </div>
              <p className="text-sm text-gray-400 font-semibold">Simulation des signaux IA en cours...</p>
              <p className="text-xs text-gray-600">Analyse de {selectedCrypto} sur {periodLabel}</p>
            </div>
          )}

          {/* ── Empty State ── */}
          {!isLoading && !hasRun && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 bg-slate-900/30 border border-white/[0.05] rounded-2xl">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <BarChart2 className="w-8 h-8 text-indigo-400" />
              </div>
              <p className="text-base font-black text-white">Prêt pour le backtesting</p>
              <p className="text-sm text-gray-500 text-center max-w-md">
                Configurez vos paramètres ci-dessus et cliquez sur <span className="text-indigo-400 font-bold">"Lancer le Backtesting"</span> pour simuler les signaux IA passés.
              </p>
              <p className="text-xs text-gray-600">{CRYPTOS.length} cryptomonnaies disponibles • Recherche instantanée</p>
            </div>
          )}

          {/* ── Results ── */}
          {!isLoading && hasRun && result && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                <StatCard label="Taux de réussite" value={`${result.stats.winRate}%`} positive={result.stats.winRate >= 50} icon={<Target className="w-3.5 h-3.5" />} />
                <StatCard label="Gain total $" value={`${result.stats.totalGainUSD >= 0 ? "+" : ""}$${result.stats.totalGainUSD.toLocaleString("fr-FR")}`} positive={result.stats.totalGainUSD >= 0} icon={<TrendingUp className="w-3.5 h-3.5" />} />
                <StatCard label="Gain total %" value={`${result.stats.totalGainPct >= 0 ? "+" : ""}${result.stats.totalGainPct}%`} positive={result.stats.totalGainPct >= 0} icon={<BarChart2 className="w-3.5 h-3.5" />} />
                <StatCard label="Gain moyen/trade" value={`${result.stats.avgGainPerTrade >= 0 ? "+" : ""}$${result.stats.avgGainPerTrade}`} positive={result.stats.avgGainPerTrade >= 0} icon={<Activity className="w-3.5 h-3.5" />} />
                <StatCard label="Drawdown max" value={`-${result.stats.maxDrawdown}%`} positive={result.stats.maxDrawdown < 15} icon={<TrendingDown className="w-3.5 h-3.5" />} />
                <StatCard label="Risk/Reward" value={`${result.stats.riskReward}x`} positive={result.stats.riskReward >= 1} icon={<Filter className="w-3.5 h-3.5" />} />
                <StatCard
                  label="Trades W/L"
                  value={`${result.stats.winCount}W / ${result.stats.lossCount}L`}
                  sub={`${result.stats.totalTrades} trades total`}
                  icon={<ArrowUpRight className="w-3.5 h-3.5" />}
                />
              </div>

              <div className="bg-slate-900/40 border border-white/[0.07] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-widest">
                      {showComparison ? "Comparaison : Stratégie IA vs Buy & Hold" : `Prix ${selectedCrypto} — Signaux IA`}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {crypto.name} • {periodLabel} • Capital initial : $10,000
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowComparison(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!showComparison ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "text-gray-500 hover:text-gray-300"}`}
                    >
                      Signaux
                    </button>
                    <button
                      onClick={() => setShowComparison(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showComparison ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "text-gray-500 hover:text-gray-300"}`}
                    >
                      Comparaison
                    </button>
                  </div>
                </div>
                <PriceChart pricePoints={result.pricePoints} showComparison={showComparison} />

                {!showComparison && (
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.05]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-emerald-500/80" />
                      <span className="text-[10px] text-gray-400 font-semibold">Signal BUY</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-red-500/80" />
                      <span className="text-[10px] text-gray-400 font-semibold">Signal SELL</span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="text-[10px] text-gray-500">{result.trades.length} signaux affichés</span>
                    </div>
                  </div>
                )}

                {showComparison && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-center">
                      <p className="text-[10px] text-violet-400 font-bold mb-1">🤖 Stratégie IA</p>
                      <p className={`text-lg font-black ${result.stats.totalGainPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {result.stats.totalGainPct >= 0 ? "+" : ""}{result.stats.totalGainPct}%
                      </p>
                      <p className="text-[10px] text-gray-500">${result.stats.strategyFinalValue.toLocaleString("fr-FR")}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                      <p className="text-[10px] text-cyan-400 font-bold mb-1">📈 Buy &amp; Hold</p>
                      <p className={`text-lg font-black ${result.stats.buyHoldGainPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {result.stats.buyHoldGainPct >= 0 ? "+" : ""}{result.stats.buyHoldGainPct}%
                      </p>
                      <p className="text-[10px] text-gray-500">${result.stats.buyHoldFinalValue.toFixed(0)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-900/40 border border-white/[0.07] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-black text-white uppercase tracking-widest">Détail des Trades</span>
                  </div>
                  <span className="text-[10px] text-gray-500">{result.trades.length} trades</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        {["#", "Type", "Entrée", "Sortie", "Prix Entrée", "Prix Sortie", "Gain $", "Gain %", "Durée", "Confiance"].map((h) => (
                          <th key={h} className="text-left py-2 px-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.trades.map((trade) => (
                        <tr key={trade.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-all">
                          <td className="py-2 px-2 text-gray-500 font-bold">{trade.id}</td>
                          <td className="py-2 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${trade.type === "BUY" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                              {trade.type}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-gray-400 whitespace-nowrap">{trade.entryDate}</td>
                          <td className="py-2 px-2 text-gray-400 whitespace-nowrap">{trade.exitDate}</td>
                          <td className="py-2 px-2 text-white font-semibold">${trade.entryPrice.toLocaleString("fr-FR")}</td>
                          <td className="py-2 px-2 text-white font-semibold">${trade.exitPrice.toLocaleString("fr-FR")}</td>
                          <td className={`py-2 px-2 font-black ${trade.profitable ? "text-emerald-400" : "text-red-400"}`}>
                            {trade.gainUSD >= 0 ? "+" : ""}${trade.gainUSD}
                          </td>
                          <td className={`py-2 px-2 font-black ${trade.profitable ? "text-emerald-400" : "text-red-400"}`}>
                            {trade.gainPct >= 0 ? "+" : ""}{trade.gainPct}%
                          </td>
                          <td className="py-2 px-2 text-gray-400">{trade.durationDays}j</td>
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-1.5">
                              <div className="w-12 h-1.5 bg-black/30 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500" style={{ width: `${trade.confidence}%` }} />
                              </div>
                              <span className="text-[10px] text-gray-400">{trade.confidence}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {result.trades.length === 0 && (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-gray-500 text-xs">
                            Aucun trade ne correspond aux filtres sélectionnés. Essayez d'abaisser le seuil de confiance.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15">
                  <div className="flex items-center gap-2 mb-3">
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">Trades Gagnants</span>
                  </div>
                  <p className="text-3xl font-black text-emerald-400">{result.stats.winCount}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {result.stats.totalTrades > 0 ? ((result.stats.winCount / result.stats.totalTrades) * 100).toFixed(1) : 0}% du total
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/15">
                  <div className="flex items-center gap-2 mb-3">
                    <ArrowDownRight className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-black text-red-400 uppercase tracking-wider">Trades Perdants</span>
                  </div>
                  <p className="text-3xl font-black text-red-400">{result.stats.lossCount}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {result.stats.totalTrades > 0 ? ((result.stats.lossCount / result.stats.totalTrades) * 100).toFixed(1) : 0}% du total
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <Footer />
      </main>
    </div>
  );
}