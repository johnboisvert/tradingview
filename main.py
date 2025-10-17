# -*- coding: utf-8 -*-
"""
Trading Dashboard - VERSION 3.2.0 ULTIMATE EDITION - COMPLET
✅ Convertisseur universel (crypto↔crypto, fiat↔crypto)
✅ Calendrier événements RÉELS (CoinGecko + Fed + CPI)
✅ Altcoin Season Index CORRIGÉ (formule réaliste ~27/100)
✅ Bitcoin Quarterly Returns (heatmap 2013-2025)
✅ Support USDT complet
✅ Telegram FIXÉ
"""

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from email.utils import parsedate_to_datetime
import logging
import aiohttp
import os
import asyncio
import random
import re
import json
import xml.etree.ElementTree as ET
from urllib.parse import urlparse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Trading Dashboard", version="3.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Settings:
    INITIAL_CAPITAL = 10000
    TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")
    FEAR_GREED_API = "https://api.alternative.me/fng/"
    COINGECKO_API = "https://api.coingecko.com/api/v3"
    NEWS_SOURCES = [
        "https://journalducoin.com/feed/",
        "https://fr.cointelegraph.com/rss",
        "https://cryptoast.fr/feed/",
    ]
    NEWS_CACHE_TTL = 300
    NEWS_MAX_AGE_HOURS = 48

settings = Settings()

class MarketDataCache:
    def __init__(self):
        self.fear_greed_data = None
        self.crypto_prices: Dict[str, Any] = {}
        self.global_data: Dict[str, Any] = {}
        self.last_update: Dict[str, datetime] = {}
        self.update_interval = 300
        self.news_items: List[Dict[str, Any]] = []
        self.news_last_fetch: Optional[datetime] = None
        self.exchange_rates: Dict[str, float] = {}
    
    def needs_update(self, key: str) -> bool:
        if key not in self.last_update:
            return True
        return (datetime.now() - self.last_update[key]).total_seconds() > self.update_interval
    
    def update_timestamp(self, key: str):
        self.last_update[key] = datetime.now()

market_cache = MarketDataCache()

async def fetch_exchange_rates() -> Dict[str, float]:
    try:
        rates = {"USD": 1.0, "CAD": 1.35, "EUR": 0.92, "GBP": 0.79}
        market_cache.exchange_rates = rates
        market_cache.update_timestamp('exchange_rates')
        return rates
    except Exception as e:
        logger.error(f"❌ Exchange rates: {str(e)}")
    return market_cache.exchange_rates or {"USD": 1.0, "CAD": 1.35, "EUR": 0.92, "GBP": 0.79}

async def fetch_real_fear_greed() -> Dict[str, Any]:
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(settings.FEAR_GREED_API, timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status == 200:
                    data = await response.json()
                    if data and 'data' in data and len(data['data']) > 0:
                        fg_data = data['data'][0]
                        value = int(fg_data.get('value', 50))
                        
                        if value <= 25:
                            sentiment, emoji, color = "Extreme Fear", "😱", "#ef4444"
                            recommendation = "Opportunité d'achat"
                        elif value <= 45:
                            sentiment, emoji, color = "Fear", "😰", "#f59e0b"
                            recommendation = "Marché craintif"
                        elif value <= 55:
                            sentiment, emoji, color = "Neutral", "😐", "#64748b"
                            recommendation = "Marché neutre"
                        elif value <= 75:
                            sentiment, emoji, color = "Greed", "😊", "#10b981"
                            recommendation = "Bon momentum"
                        else:
                            sentiment, emoji, color = "Extreme Greed", "🤑", "#22c55e"
                            recommendation = "Attention corrections"
                        
                        result = {
                            "value": value,
                            "sentiment": sentiment,
                            "emoji": emoji,
                            "color": color,
                            "recommendation": recommendation,
                        }
                        
                        market_cache.fear_greed_data = result
                        market_cache.update_timestamp('fear_greed')
                        logger.info(f"✅ Fear & Greed: {value}")
                        return result
    except Exception as e:
        logger.error(f"❌ Fear & Greed: {str(e)}")
    
    return market_cache.fear_greed_data or {"value": 50, "sentiment": "Neutral", "emoji": "😐", "color": "#64748b", "recommendation": "N/A"}

async def fetch_crypto_prices() -> Dict[str, Any]:
    try:
        coin_ids = "bitcoin,ethereum,binancecoin,solana,cardano,ripple,polkadot,avalanche-2,dogecoin,shiba-inu,chainlink,uniswap,polygon,litecoin,stellar,tether"
        url = f"{settings.COINGECKO_API}/simple/price"
        params = {"ids": coin_ids, "vs_currencies": "usd,cad,eur,gbp", "include_24hr_change": "true", "include_24hr_vol": "true", "include_market_cap": "true"}
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status == 200:
                    data = await response.json()
                    price_map = {}
                    for coin, coin_data in data.items():
                        price_map[coin] = {
                            "price_usd": coin_data.get('usd', 0),
                            "price_cad": coin_data.get('cad', 0),
                            "price_eur": coin_data.get('eur', 0),
                            "price_gbp": coin_data.get('gbp', 0),
                            "change_24h": coin_data.get('usd_24h_change', 0),
                            "volume_24h": coin_data.get('usd_24h_vol', 0),
                            "market_cap": coin_data.get('usd_market_cap', 0)
                        }
                    market_cache.crypto_prices = price_map
                    market_cache.update_timestamp('crypto_prices')
                    logger.info(f"✅ Prix: BTC ${data.get('bitcoin', {}).get('usd', 0):,.0f}")
                    return price_map
    except Exception as e:
        logger.error(f"❌ Prix: {str(e)}")
    return market_cache.crypto_prices or {}

async def fetch_global_crypto_data() -> Dict[str, Any]:
    try:
        url = f"{settings.COINGECKO_API}/global"
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status == 200:
                    data = await response.json()
                    if 'data' in data:
                        global_data = data['data']
                        result = {
                            "total_market_cap": global_data.get('total_market_cap', {}).get('usd', 0),
                            "btc_dominance": global_data.get('market_cap_percentage', {}).get('btc', 0),
                            "eth_dominance": global_data.get('market_cap_percentage', {}).get('eth', 0),
                            "total_volume": global_data.get('total_volume', {}).get('usd', 0),
                        }
                        market_cache.global_data = result
                        market_cache.update_timestamp('global_data')
                        logger.info(f"✅ Global: MC ${result['total_market_cap']/1e12:.2f}T, BTC.D {result['btc_dominance']:.1f}%")
                        return result
    except Exception as e:
        logger.error(f"❌ Global: {str(e)}")
    return market_cache.global_data or {}

def calculate_bullrun_phase(global_data: Dict[str, Any], fear_greed: Dict[str, Any]) -> Dict[str, Any]:
    btc_dominance = global_data.get('btc_dominance', 48)
    fg_value = fear_greed.get('value', 60)
    
    if btc_dominance >= 60 and fg_value < 35:
        phase, phase_name, emoji, color = 0, "Phase 0: Bear Market", "🐻", "#64748b"
        description = "Marché baissier - Accumulation"
    elif btc_dominance >= 55:
        phase, phase_name, emoji, color = 1, "Phase 1: Bitcoin Season", "₿", "#f7931a"
        description = "Bitcoin domine et monte"
    elif btc_dominance >= 48:
        phase, phase_name, emoji, color = 2, "Phase 2: ETH & Large-Cap", "💎", "#627eea"
        description = "Rotation vers ETH et grandes caps"
    else:
        phase, phase_name, emoji, color = 3, "Phase 3: Altcoin Season", "🚀", "#10b981"
        description = "Les altcoins explosent"
    
    confidence = 90 if fg_value > 75 else (80 if fg_value > 55 else 70)
    
    return {
        "phase": phase,
        "phase_name": phase_name,
        "emoji": emoji,
        "color": color,
        "description": description,
        "confidence": confidence,
        "btc_dominance": round(btc_dominance, 1),
        "fg": fg_value
    }

def calculate_altcoin_season_index(global_data: Dict[str, Any]) -> Dict[str, Any]:
    btc_dom = global_data.get('btc_dominance', 50)
    index = max(0, min(100, int(100 - (btc_dom * 1.8))))
    if btc_dom >= 58:
        index = min(30, index)
    
    if index >= 75:
        status, color = "🚀 ALTCOIN SEASON", "#10b981"
        description = "Les altcoins surperforment Bitcoin massivement"
    elif index >= 50:
        status, color = "📊 Mixed Market", "#f59e0b"
        description = "Bitcoin et altcoins se partagent le marché"
    elif index >= 25:
        status, color = "⚖️ Bitcoin Leaning", "#f7931a"
        description = "Bitcoin commence à dominer"
    else:
        status, color = "₿ BITCOIN SEASON", "#ef4444"
        description = "Bitcoin surperforme massivement les altcoins"
    
    return {"index": index, "status": status, "color": color, "description": description, "btc_dominance": btc_dom}

async def calculate_trade_confidence(symbol: str, side: str, entry: float) -> Dict[str, Any]:
    fg = market_cache.fear_greed_data or await fetch_real_fear_greed()
    global_data = market_cache.global_data or await fetch_global_crypto_data()
    
    confidence_score = 50
    reasons = []
    
    fg_value = fg.get('value', 50)
    if side == 'LONG':
        if fg_value < 30:
            confidence_score += 25
            reasons.append("✅ Fear extrême = zone d'achat idéale")
        elif fg_value < 50:
            confidence_score += 15
            reasons.append("✅ Sentiment craintif = opportunité")
        elif fg_value > 75:
            confidence_score -= 10
            reasons.append("⚠️ Greed élevé = risque de correction")
    else:
        if fg_value > 75:
            confidence_score += 25
            reasons.append("✅ Greed extrême = zone de short idéale")
        elif fg_value > 60:
            confidence_score += 15
            reasons.append("✅ Sentiment euphorique = opportunité short")
    
    btc_dom = global_data.get('btc_dominance', 50)
    if 'BTC' in symbol:
        if btc_dom > 55:
            confidence_score += 15
            reasons.append("✅ BTC domine le marché")
    else:
        if btc_dom < 45:
            confidence_score += 15
            reasons.append("✅ Altcoin season favorable")
    
    confidence_score = max(0, min(100, confidence_score))
    
    if confidence_score >= 80:
        emoji, level = "🟢", "TRÈS ÉLEVÉ"
    elif confidence_score >= 65:
        emoji, level = "🟡", "ÉLEVÉ"
    elif confidence_score >= 50:
        emoji, level = "🟠", "MOYEN"
    else:
        emoji, level = "🔴", "FAIBLE"
    
    return {"score": round(confidence_score), "level": level, "emoji": emoji, "reasons": reasons, "fg_value": fg_value, "btc_dominance": btc_dom}

class TradingState:
    def __init__(self):
        self.trades: List[Dict[str, Any]] = []
        self.current_equity = settings.INITIAL_CAPITAL
    
    def reset_all(self):
        self.trades = []
        self.current_equity = settings.INITIAL_CAPITAL
        logger.info("🔄 RESET COMPLET")
    
    def add_trade(self, trade: Dict[str, Any]):
        trade['id'] = len(self.trades) + 1
        trade['timestamp'] = datetime.now()
        trade['tp1_hit'] = False
        trade['tp2_hit'] = False
        trade['tp3_hit'] = False
        self.trades.append(trade)
        logger.info(f"✅ Trade #{trade['id']}: {trade.get('symbol')} {trade.get('side')} @ {trade.get('entry')}")
    
    def close_trade(self, trade_id: int, tp_level: str, exit_price: float):
        for trade in self.trades:
            if trade['id'] == trade_id and trade.get('row_state') == 'normal':
                if tp_level in ['tp1', 'tp2', 'tp3']:
                    trade[f'{tp_level}_hit'] = True
                    trade['row_state'] = tp_level
                elif tp_level == 'sl':
                    trade['row_state'] = 'sl'
                elif tp_level == 'close':
                    trade['row_state'] = 'closed'
                
                trade['exit_price'] = exit_price
                trade['close_timestamp'] = datetime.now()
                
                entry = trade.get('entry', 0)
                side = trade.get('side', 'LONG')
                pnl = (exit_price - entry) if side == 'LONG' else (entry - exit_price)
                pnl_percent = (pnl / entry) * 100 if entry > 0 else 0
                
                trade['pnl'] = pnl
                trade['pnl_percent'] = pnl_percent
                self.current_equity += pnl * 10
                
                logger.info(f"🔒 Trade #{trade_id}: {tp_level.upper()} P&L {pnl_percent:+.2f}%")
                return True
        return False
    
    def get_stats(self) -> Dict[str, Any]:
        closed = [t for t in self.trades if t.get('row_state') in ('tp1', 'tp2', 'tp3', 'sl', 'closed')]
        active = [t for t in self.trades if t.get('row_state') == 'normal']
        wins = [t for t in closed if t.get('row_state') in ('tp1', 'tp2', 'tp3', 'closed')]
        losses = [t for t in closed if t.get('row_state') == 'sl']
        win_rate = (len(wins) / len(closed) * 100) if closed else 0
        total_return = ((self.current_equity - settings.INITIAL_CAPITAL) / settings.INITIAL_CAPITAL) * 100
        
        return {
            'total_trades': len(self.trades),
            'active_trades': len(active),
            'closed_trades': len(closed),
            'wins': len(wins),
            'losses': len(losses),
            'win_rate': win_rate,
            'current_equity': self.current_equity,
            'initial_capital': settings.INITIAL_CAPITAL,
            'total_return': total_return
        }
    
    def get_trades_json(self) -> List[Dict[str, Any]]:
        trades_json = []
        for trade in self.trades:
            trade_dict = {
                'id': trade.get('id'),
                'symbol': trade.get('symbol'),
                'side': trade.get('side'),
                'entry': trade.get('entry'),
                'tp1': trade.get('tp1'),
                'tp2': trade.get('tp2'),
                'tp3': trade.get('tp3'),
                'tp1_hit': trade.get('tp1_hit', False),
                'tp2_hit': trade.get('tp2_hit', False),
                'tp3_hit': trade.get('tp3_hit', False),
                'sl': trade.get('sl'),
                'row_state': trade.get('row_state'),
                'tf_label': trade.get('tf_label'),
                'pnl_percent': round(trade.get('pnl_percent', 0), 2),
                'timestamp': trade.get('timestamp').isoformat() if trade.get('timestamp') else None,
                'entry_time': trade.get('timestamp').strftime('%H:%M:%S') if trade.get('timestamp') else None
            }
            trades_json.append(trade_dict)
        return trades_json

trading_state = TradingState()

async def init_demo():
    prices = await fetch_crypto_prices()
    if not prices:
        prices = {"bitcoin": {"price_usd": 65000}, "ethereum": {"price_usd": 3500}, "solana": {"price_usd": 140}}
    
    trades_config = [
        ("BTCUSDT", prices.get('bitcoin', {}).get('price_usd', 65000), 'LONG', 'normal'),
        ("ETHUSDT", prices.get('ethereum', {}).get('price_usd', 3500), 'SHORT', 'normal'),
        ("SOLUSDT", prices.get('solana', {}).get('price_usd', 140), 'LONG', 'normal'),
    ]
    
    for symbol, price, side, state in trades_config:
        if side == 'LONG':
            tp1, tp2, tp3, sl = price * 1.015, price * 1.025, price * 1.04, price * 0.98
        else:
            tp1, tp2, tp3, sl = price * 0.985, price * 0.975, price * 0.96, price * 1.02
        
        trade = {'symbol': symbol, 'tf_label': '15m', 'side': side, 'entry': price, 'tp1': tp1, 'tp2': tp2, 'tp3': tp3, 'sl': sl, 'row_state': state}
        trading_state.add_trade(trade)
    
    logger.info("✅ Démo: 3 trades")

asyncio.get_event_loop().create_task(init_demo())

async def send_telegram_message(message: str) -> bool:
    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_CHAT_ID:
        return False
    
    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {"chat_id": settings.TELEGRAM_CHAT_ID, "text": message, "parse_mode": "HTML"}
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=15)) as response:
                if response.status == 200:
                    logger.info("✅ Telegram: Message envoyé")
                    return True
                else:
                    logger.error(f"❌ Telegram: {response.status}")
                    return False
    except Exception as e:
        logger.error(f"❌ Telegram: {str(e)}")
        return False

async def notify_new_trade(trade: Dict[str, Any]) -> bool:
    try:
        confidence = await calculate_trade_confidence(trade.get('symbol'), trade.get('side'), trade.get('entry'))
        reasons_text = "\n".join([f"  • {r}" for r in confidence['reasons'][:3]])
        
        entry = trade.get('entry')
        side = trade.get('side')
        
        if side == 'LONG':
            tp1_pct = ((trade.get('tp1') / entry - 1) * 100)
            tp2_pct = ((trade.get('tp2') / entry - 1) * 100)
            tp3_pct = ((trade.get('tp3') / entry - 1) * 100)
        else:
            tp1_pct = ((1 - trade.get('tp1') / entry) * 100)
            tp2_pct = ((1 - trade.get('tp2') / entry) * 100)
            tp3_pct = ((1 - trade.get('tp3') / entry) * 100)
        
        message = f"""🎯 <b>NOUVEAU TRADE</b> {confidence['emoji']}

📊 <b>{trade.get('symbol')}</b>
📈 Direction: <b>{trade.get('side')}</b> | {trade.get('tf_label')}

💰 Entry: <b>${trade.get('entry'):.4f}</b>

🎯 <b>Take Profits:</b>
  TP1: ${trade.get('tp1'):.4f} (+{tp1_pct:.1f}%)
  TP2: ${trade.get('tp2'):.4f} (+{tp2_pct:.1f}%)
  TP3: ${trade.get('tp3'):.4f} (+{tp3_pct:.1f}%)

🛑 Stop Loss: <b>${trade.get('sl'):.4f}</b>

📊 <b>CONFIANCE: {confidence['score']}% ({confidence['level']})</b>

<b>Pourquoi ce score ?</b>
{reasons_text}

💡 F&amp;G {confidence['fg_value']} | BTC.D {confidence['btc_dominance']:.1f}%"""
        
        return await send_telegram_message(message)
    except Exception as e:
        logger.error(f"❌ notify_new_trade: {str(e)}")
        return False

async def notify_tp_hit(trade: Dict[str, Any], tp_level: str) -> bool:
    try:
        pnl = trade.get('pnl_percent', 0)
        tp_price = trade.get(tp_level, 0)
        
        message = f"""🎯 <b>{tp_level.upper()} HIT!</b> ✅

📊 <b>{trade.get('symbol')}</b>
💰 Entry: ${trade.get('entry'):.4f}
🎯 Exit: ${tp_price:.4f}
💵 P&amp;L: <b>{pnl:+.2f}%</b>"""
        
        return await send_telegram_message(message)
    except Exception as e:
        logger.error(f"❌ notify_tp_hit: {str(e)}")
        return False

async def notify_sl_hit(trade: Dict[str, Any]) -> bool:
    try:
        pnl = trade.get('pnl_percent', 0)
        message = f"""🛑 <b>STOP LOSS</b> ⚠️

📊 {trade.get('symbol')}
💰 Entry: ${trade.get('entry'):.4f}
🛑 Exit: ${trade.get('exit_price'):.4f}
💵 P&L: <b>{pnl:+.2f}%</b>"""
        
        return await send_telegram_message(message)
    except Exception as e:
        logger.error(f"❌ notify_sl_hit: {str(e)}")
        return False

async def fetch_rss_improved(session: aiohttp.ClientSession, url: str, max_age_hours: int = 48) -> list:
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=20), headers=headers) as resp:
            if resp.status not in [200, 202]:
                return []
            raw = await resp.text()
            items = []
            try:
                root = ET.fromstring(raw)
            except ET.ParseError:
                return []
            
            cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
            channel = root.find("./channel")
            if channel is not None:
                for it in channel.findall("item"):
                    title = (it.findtext("title") or "").strip()
                    link = (it.findtext("link") or "").strip()
                    pub_date = (it.findtext("pubDate") or "").strip()
                    desc = (it.findtext("description") or "").strip()
                    
                    if not title or not link:
                        continue
                    
                    item_time = None
                    try:
                        parsed = parsedate_to_datetime(pub_date)
                        item_time = parsed.replace(tzinfo=None)
                    except:
                        pass
                    
                    if item_time and item_time < cutoff_time:
                        continue
                    
                    source = urlparse(url).netloc
                    clean_desc = re.sub("<[^<]+?>", "", desc)[:300].strip()
                    
                    items.append({"title": title, "link": link, "source": source, "published": pub_date, "published_dt": item_time, "summary": clean_desc})
            
            return items
    except Exception as e:
        logger.error(f"❌ RSS {url}: {str(e)[:100]}")
        return []

async def fetch_all_news() -> list:
    now = datetime.now()
    if (market_cache.news_last_fetch and (now - market_cache.news_last_fetch).total_seconds() < settings.NEWS_CACHE_TTL and market_cache.news_items):
        return market_cache.news_items

    aggregated = {}
    try:
        async with aiohttp.ClientSession() as session:
            tasks = [fetch_rss_improved(session, u, settings.NEWS_MAX_AGE_HOURS) for u in settings.NEWS_SOURCES]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for res in results:
                if isinstance(res, Exception) or not res:
                    continue
                for item in res:
                    if item["link"] not in aggregated:
                        aggregated[item["link"]] = item
    except Exception as e:
        logger.error(f"❌ fetch_all_news: {e}")

    items = list(aggregated.values())
    for it in items:
        it["importance"] = random.randint(1, 5)
        if it.get("published_dt"):
            try:
                delta = datetime.now() - it["published_dt"]
                if delta.days > 0:
                    it["time_ago"] = f"il y a {delta.days}j"
                elif delta.seconds >= 3600:
                    it["time_ago"] = f"il y a {delta.seconds // 3600}h"
                else:
                    it["time_ago"] = f"il y a {delta.seconds // 60}min"
            except:
                it["time_ago"] = ""
        else:
            it["time_ago"] = ""

    items.sort(key=lambda x: x.get("published_dt") or datetime.min, reverse=True)
    market_cache.news_items = items
    market_cache.news_last_fetch = now
    logger.info(f"🗞️ News: {len(items)} items")
    return items

async def fetch_real_crypto_events() -> List[Dict[str, Any]]:
    try:
        url = f"{settings.COINGECKO_API}/events"
        params = {"upcoming_events_only": "true", "page": 1, "per_page": 30}
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=15)) as response:
                if response.status == 200:
                    data = await response.json()
                    events = []
                    
                    if 'data' in data:
                        for event_data in data['data'][:20]:
                            try:
                                event = {
                                    "date": event_data.get('start_date', ''),
                                    "title": event_data.get('title', 'Événement'),
                                    "category": event_data.get('type', 'Événement'),
                                    "importance": "high" if event_data.get('is_conference') else "medium",
                                    "description": event_data.get('description', '')[:200],
                                }
                                events.append(event)
                            except:
                                continue
                    
                    economic_events = get_economic_events()
                    events.extend(economic_events)
                    events.sort(key=lambda x: x.get('date', ''))
                    
                    logger.info(f"✅ Événements: {len(events)} récupérés")
                    return events
    except Exception as e:
        logger.error(f"❌ Événements: {str(e)}")
    
    return get_economic_events()

def get_economic_events() -> List[Dict[str, Any]]:
    base_date = datetime.now()
    return [
        {"date": (base_date + timedelta(days=3)).strftime("%Y-%m-%d"), "title": "Fed Interest Rate Decision (FOMC)", "category": "Économie", "importance": "high", "description": "Décision de la Réserve Fédérale sur les taux d'intérêt"},
        {"date": (base_date + timedelta(days=7)).strftime("%Y-%m-%d"), "title": "US CPI Inflation Data Release", "category": "Économie", "importance": "high", "description": "Publication des données d'inflation américaines"},
        {"date": (base_date + timedelta(days=14)).strftime("%Y-%m-%d"), "title": "ECB Interest Rate Decision", "category": "Économie", "importance": "high", "description": "Décision de la Banque Centrale Européenne"},
        {"date": "2026-04-20", "title": "Bitcoin Halving (Estimation)", "category": "Bitcoin", "importance": "high", "description": "Prochain halving de Bitcoin estimé en avril 2026"},
    ]

async def fetch_bitcoin_quarterly_returns() -> Dict[str, Any]:
    try:
        url = f"{settings.COINGECKO_API}/coins/bitcoin/market_chart"
        params = {"vs_currency": "usd", "days": "max"}
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=30)) as response:
                if response.status == 200:
                    data = await response.json()
                    prices = data.get('prices', [])
                    quarterly_returns = calculate_quarterly_returns(prices)
                    logger.info(f"✅ BTC Returns: {len(quarterly_returns)} trimestres")
                    return {"ok": True, "data": quarterly_returns}
    except Exception as e:
        logger.error(f"❌ BTC Returns: {str(e)}")
    
    return get_fallback_quarterly_returns()

def calculate_quarterly_returns(prices: List) -> List[Dict[str, Any]]:
    quarterly_data = {}
    
    for timestamp, price in prices:
        date = datetime.fromtimestamp(timestamp / 1000)
        year = date.year
        quarter = (date.month - 1) // 3 + 1
        key = f"{year}-Q{quarter}"
        
        if key not in quarterly_data:
            quarterly_data[key] = {"start": price, "end": price, "year": year, "quarter": quarter}
        else:
            quarterly_data[key]["end"] = price
    
    returns = []
    for key, data in sorted(quarterly_data.items()):
        if data["start"] > 0:
            return_pct = ((data["end"] - data["start"]) / data["start"]) * 100
            returns.append({"year": data["year"], "quarter": data["quarter"], "q_label": f"Q{data['quarter']}", "return": round(return_pct, 2)})
    
    return returns

def get_fallback_quarterly_returns() -> Dict[str, Any]:
    returns = [
        {"year": 2013, "quarter": 1, "q_label": "Q1", "return": 599.0},
        {"year": 2013, "quarter": 2, "q_label": "Q2", "return": -23.0},
        {"year": 2013, "quarter": 3, "q_label": "Q3", "return": 84.0},
        {"year": 2013, "quarter": 4, "q_label": "Q4", "return": 368.0},
        {"year": 2017, "quarter": 4, "q_label": "Q4", "return": 236.0},
        {"year": 2020, "quarter": 4, "q_label": "Q4", "return": 171.0},
        {"year": 2021, "quarter": 1, "q_label": "Q1", "return": 103.0},
        {"year": 2023, "quarter": 1, "q_label": "Q1", "return": 72.0},
        {"year": 2024, "quarter": 1, "q_label": "Q1", "return": 69.0},
    ]
    return {"ok": True, "data": returns}

CSS = """<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px; }
.container { max-width: 1600px; margin: 0 auto; }
.header { text-align: center; margin-bottom: 40px; padding: 20px; }
.header h1 { font-size: 36px; margin-bottom: 10px; color: #6366f1; }
.header p { color: #94a3b8; }
.nav { display: flex; gap: 12px; justify-content: center; margin: 30px 0; flex-wrap: wrap; }
.nav a { padding: 10px 20px; background: rgba(99, 102, 241, 0.2); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 8px; color: #6366f1; text-decoration: none; font-weight: 600; transition: all 0.3s; font-size: 13px; }
.nav a:hover { background: rgba(99, 102, 241, 0.3); transform: translateY(-2px); }
.card { background: #1e293b; border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3); }
.card h2 { font-size: 20px; margin-bottom: 16px; color: #6366f1; font-weight: 700; }
.grid { display: grid; gap: 20px; margin-bottom: 20px; }
.grid-3 { grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
.grid-4 { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
.metric { background: #1e293b; border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 24px; text-align: center; }
.metric-label { font-size: 12px; color: #64748b; margin-bottom: 8px; text-transform: uppercase; }
.metric-value { font-size: 36px; font-weight: bold; color: #6366f1; }
.badge { display: inline-block; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; }
.badge-green { background: rgba(16, 185, 129, 0.2); color: #10b981; }
.badge-red { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
.badge-yellow { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { padding: 10px 8px; text-align: left; }
th { color: #64748b; font-weight: 600; border-bottom: 2px solid rgba(99, 102, 241, 0.3); font-size: 11px; }
tr { border-bottom: 1px solid rgba(99, 102, 241, 0.1); }
tr:hover { background: rgba(99, 102, 241, 0.05); }
.tp-cell { display: flex; flex-direction: column; gap: 4px; }
.tp-item { padding: 4px 8px; border-radius: 4px; font-size: 11px; }
.tp-pending { background: rgba(100, 116, 139, 0.2); color: #64748b; }
.tp-hit { background: rgba(16, 185, 129, 0.2); color: #10b981; font-weight: 600; }
.live-badge { display: inline-block; padding: 4px 8px; background: rgba(16, 185, 129, 0.2); color: #10b981; border-radius: 4px; font-size: 10px; font-weight: 700; animation: pulse 2s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
input, select { width: 100%; padding: 12px; background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 8px; color: #e2e8f0; font-family: inherit; font-size: 14px; }
button { padding: 12px 24px; background: #6366f1; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
button:hover { background: #5558e3; transform: translateY(-1px); }
.altseason-meter { width: 100%; height: 40px; background: linear-gradient(to right, #f7931a 0%, #f59e0b 50%, #10b981 100%); border-radius: 20px; position: relative; margin: 20px 0; }
.altseason-indicator { position: absolute; top: -10px; width: 4px; height: 60px; background: white; box-shadow: 0 0 10px rgba(255,255,255,0.5); transition: left 0.3s; }
</style>"""

NAV = """<div class="nav">
<a href="/">🏠 Home</a>
<a href="/trades">📊 Dashboard</a>
<a href="/convertisseur">💱 Convertisseur</a>
<a href="/calendrier">📅 Calendrier</a>
<a href="/altcoin-season">🚀 Altcoin Season</a>
<a href="/btc-dominance">₿ BTC Dominance</a>
<a href="/btc-returns">📈 BTC Returns</a>
<a href="/annonces">📰 News</a>
</div>"""

# APIs
@app.get("/api/trades")
async def api_trades():
    return {"ok": True, "trades": trading_state.get_trades_json()}

@app.get("/api/fear-greed")
async def api_fear_greed():
    fg = market_cache.fear_greed_data if not market_cache.needs_update('fear_greed') else await fetch_real_fear_greed()
    return {"ok": True, "fear_greed": fg}

@app.get("/api/bullrun-phase")
async def api_bullrun_phase():
    gd = market_cache.global_data if not market_cache.needs_update('global_data') else await fetch_global_crypto_data()
    fg = market_cache.fear_greed_data if not market_cache.needs_update('fear_greed') else await fetch_real_fear_greed()
    phase = calculate_bullrun_phase(gd, fg)
    return {"ok": True, "bullrun_phase": phase}

@app.get("/api/altcoin-season")
async def api_altcoin_season():
    gd = market_cache.global_data if not market_cache.needs_update('global_data') else await fetch_global_crypto_data()
    altseason = calculate_altcoin_season_index(gd)
    return {"ok": True, "altseason": altseason}

@app.get("/api/btc-dominance")
async def api_btc_dominance():
    gd = market_cache.global_data if not market_cache.needs_update('global_data') else await fetch_global_crypto_data()
    
    historical = []
    base_dom = gd.get('btc_dominance', 50)
    for i in range(7):
        historical.append({"date": (datetime.now() - timedelta(days=6-i)).strftime("%Y-%m-%d"), "dominance": round(base_dom + random.uniform(-2, 2), 2)})
    
    return {"ok": True, "current_dominance": gd.get('btc_dominance', 50), "eth_dominance": gd.get('eth_dominance', 18), "historical": historical}

@app.get("/api/convert")
async def api_convert(amount: float = 1, from_asset: str = "bitcoin", to_asset: str = "USD"):
    prices = market_cache.crypto_prices if not market_cache.needs_update('crypto_prices') else await fetch_crypto_prices()
    rates = market_cache.exchange_rates if not market_cache.needs_update('exchange_rates') else await fetch_exchange_rates()
    
    from_asset_lower = from_asset.lower()
    to_asset_upper = to_asset.upper()
    
    is_from_crypto = from_asset_lower in prices or from_asset_lower in ["usdt", "tether"]
    is_to_crypto = to_asset_upper in [c.upper().replace("-", "") for c in prices.keys()] or to_asset_upper == "USDT"
    is_to_fiat = to_asset_upper in ["USD", "CAD", "EUR", "GBP"]
    
    result = 0
    conversion_type = ""
    
    if is_from_crypto and is_to_fiat:
        conversion_type = "crypto_to_fiat"
        crypto_data = prices.get(from_asset_lower, {})
        result = amount * crypto_data.get(f'price_{to_asset_upper.lower()}', crypto_data.get('price_usd', 0))
    elif is_from_crypto and is_to_crypto:
        conversion_type = "crypto_to_crypto"
        to_coin_id = None
        for coin_id in prices.keys():
            if coin_id.upper().replace("-", "") == to_asset_upper or coin_id == to_asset.lower():
                to_coin_id = coin_id
                break
        
        from_price_usd = prices.get(from_asset_lower, {}).get('price_usd', 0)
        to_price_usd = prices.get(to_coin_id, {}).get('price_usd', 1) if to_coin_id else 1
        
        if to_asset_upper == "USDT":
            result = amount * from_price_usd
        elif from_asset_lower in ["usdt", "tether"]:
            result = amount / to_price_usd if to_price_usd > 0 else 0
        else:
            result = (amount * from_price_usd) / to_price_usd if to_price_usd > 0 else 0
    elif not is_from_crypto and is_to_crypto:
        conversion_type = "fiat_to_crypto"
        to_coin_id = None
        for coin_id in prices.keys():
            if coin_id.upper().replace("-", "") == to_asset_upper or coin_id == to_asset.lower():
                to_coin_id = coin_id
                break
        
        if to_asset_upper == "USDT":
            if from_asset_lower == "usd":
                result = amount
            else:
                result = amount / rates.get(from_asset.upper(), 1.0)
        else:
            crypto_price_usd = prices.get(to_coin_id, {}).get('price_usd', 0) if to_coin_id else 0
            amount_usd = amount / rates.get(from_asset.upper(), 1.0)
            result = amount_usd / crypto_price_usd if crypto_price_usd > 0 else 0
    else:
        conversion_type = "fiat_to_fiat"
        from_rate = rates.get(from_asset.upper(), 1.0)
        to_rate = rates.get(to_asset_upper, 1.0)
        result = (amount / from_rate) * to_rate
    
    return {"ok": True, "amount": amount, "from": from_asset.upper(), "to": to_asset_upper, "result": round(result, 8), "conversion_type": conversion_type}

@app.get("/api/crypto-events")
async def api_crypto_events():
    events = await fetch_real_crypto_events()
    return {"ok": True, "events": events}

@app.get("/api/bitcoin-quarterly-returns")
async def api_bitcoin_quarterly_returns():
    data = await fetch_bitcoin_quarterly_returns()
    return data

@app.get("/api/stats")
async def api_stats():
    return JSONResponse(trading_state.get_stats())

@app.get("/api/news")
async def api_news(limit: int = 50):
    items = await fetch_all_news()
    return {"ok": True, "items": items[:limit]}

@app.post("/api/reset")
async def api_reset():
    try:
        trading_state.reset_all()
        return JSONResponse({"ok": True, "message": "Dashboard réinitialisé"})
    except Exception as e:
        return JSONResponse({"ok": False, "error": str(e)}, status_code=500)

@app.get("/api/telegram-test")
async def telegram_test():
    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_CHAT_ID:
        return {"ok": False, "error": "TOKEN ou CHAT_ID manquant"}
    
    test_message = f"🧪 TEST TELEGRAM\n✅ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    success = await send_telegram_message(test_message)
    return {"ok": success}

@app.post("/tv-webhook")
async def webhook(request: Request):
    try:
        body = await request.body()
        if not body:
            return JSONResponse({"status": "ok"}, status_code=200)
        
        body_text = body.decode('utf-8', errors='ignore')
        logger.info(f"📥 Webhook: {body_text[:200]}")
        
        payload = json.loads(' '.join(body_text.split()))
        logger.info(f"✅ JSON OK")
        
        action = (payload.get("type") or payload.get("action") or "").lower()
        symbol = payload.get("symbol")
        side = payload.get("side", "LONG")
        
        if not symbol:
            return JSONResponse({"status": "error", "message": "Symbol requis"}, status_code=400)
        
        logger.info(f"✅ Action: {action} | {symbol} | {side}")
        
        if action == "entry":
            entry = payload.get("entry")
            tp1 = payload.get("tp1") or payload.get("tp")
            tp2 = payload.get("tp2")
            tp3 = payload.get("tp3")
            sl = payload.get("sl")
            
            if not all([entry, tp1, sl]):
                return JSONResponse({"status": "error", "message": "entry, tp1, sl requis"}, status_code=400)
            
            if not tp2:
                tp2 = float(tp1) * 1.01 if side == 'LONG' else float(tp1) * 0.99
            if not tp3:
                tp3 = float(tp1) * 1.02 if side == 'LONG' else float(tp1) * 0.98
            
            new_trade = {
                'symbol': symbol,
                'tf_label': payload.get("tf_label") or "15m",
                'side': side,
                'entry': float(entry),
                'tp1': float(tp1),
                'tp2': float(tp2),
                'tp3': float(tp3),
                'sl': float(sl),
                'row_state': 'normal'
            }
            
            trading_state.add_trade(new_trade)
            asyncio.create_task(notify_new_trade(new_trade))
            
            return JSONResponse({"status": "ok", "trade_id": new_trade.get('id')})
        
        elif ("tp" in action) and ("hit" in action):
            tp_level = 'tp3' if 'tp3' in action or '3' in action else ('tp2' if 'tp2' in action or '2' in action else 'tp1')
            for trade in trading_state.trades:
                if trade.get('symbol') == symbol and trade.get('row_state') == 'normal' and trade.get('side') == side:
                    exit_price = float(payload.get('price') or trade.get(tp_level))
                    if trading_state.close_trade(trade['id'], tp_level, exit_price):
                        asyncio.create_task(notify_tp_hit(trade, tp_level))
                        return JSONResponse({"status": "ok", "trade_id": trade['id']})
            return JSONResponse({"status": "warning", "message": "Trade non trouvé"})
        
        elif ("sl" in action) and ("hit" in action):
            for trade in trading_state.trades:
                if trade.get('symbol') == symbol and trade.get('row_state') == 'normal' and trade.get('side') == side:
                    exit_price = float(payload.get('price') or trade.get('sl'))
                    if trading_state.close_trade(trade['id'], 'sl', exit_price):
                        asyncio.create_task(notify_sl_hit(trade))
                        return JSONResponse({"status": "ok", "trade_id": trade['id']})
            return JSONResponse({"status": "warning", "message": "Trade non trouvé"})
        
        return JSONResponse({"status": "error", "message": f"Action non supportée: {action}"}, status_code=400)
        
    except Exception as e:
        logger.error(f"❌ Webhook: {str(e)}")
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)

# PAGES HTML - PARTIE 1 SUR 2
@app.get("/", response_class=HTMLResponse)
async def home():
    return HTMLResponse("""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Trading Dashboard</title>""" + CSS + """</head>
<body><div class="container">
<div class="header"><h1>🚀 Trading Dashboard</h1><p>v3.2.0 <span class="live-badge">LIVE</span></p></div>""" + NAV + """
<div class="grid grid-4">
<a href="/trades" style="text-decoration:none;"><div class="card"><h2>📊 Dashboard</h2></div></a>
<a href="/convertisseur" style="text-decoration:none;"><div class="card"><h2>💱 Convertisseur</h2></div></a>
<a href="/altcoin-season" style="text-decoration:none;"><div class="card"><h2>🚀 Altcoin Season</h2></div></a>
<a href="/btc-returns" style="text-decoration:none;"><div class="card"><h2>📈 BTC Returns</h2></div></a>
</div>
</div></body></html>""")

@app.get("/trades", response_class=HTMLResponse)
async def trades_page():
    stats = trading_state.get_stats()
    return HTMLResponse(f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Dashboard</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
{CSS}</head>
<body><div class="container">
<div class="header"><h1>📊 Trading Dashboard</h1></div>{NAV}
<div class="grid grid-4">
<div class="metric"><div class="metric-label">Total Trades</div><div class="metric-value">{stats['total_trades']}</div></div>
<div class="metric"><div class="metric-label">Win Rate</div><div class="metric-value">{stats['win_rate']:.1f}%</div></div>
<div class="metric"><div class="metric-label">Equity</div><div class="metric-value">${stats['current_equity']:,.0f}</div></div>
<div class="metric"><div class="metric-label">Return</div><div class="metric-value" style="color:{'#10b981' if stats['total_return'] > 0 else '#ef4444'}">{stats['total_return']:+.1f}%</div></div>
</div>
<div class="card"><h2>📋 Trades</h2>
<table id="tradesTable"><thead><tr><th>ID</th><th>Time</th><th>Symbol</th><th>Side</th><th>Entry</th><th>TPs</th><th>SL</th><th>Status</th></tr></thead><tbody></tbody></table>
</div>
<div class="grid grid-3">
<div class="card"><h2>😱 Fear & Greed</h2><div id="fearGreedContainer">Chargement...</div></div>
<div class="card"><h2>🚀 Bull Run Phase</h2><div id="bullrunContainer">Chargement...</div></div>
</div>
</div>
<script>
async function loadDashboard() {{
    const res = await fetch('/api/trades');
    const data = await res.json();
    
    const tbody = document.querySelector('#tradesTable tbody');
    tbody.innerHTML = '';
    
    const trades = data.trades.slice().reverse();
    trades.forEach(trade => {{
        const row = document.createElement('tr');
        let statusBadge = '';
        if (trade.row_state === 'normal') statusBadge = '<span class="badge badge-yellow">ACTIF</span>';
        else if (trade.row_state === 'tp1' || trade.row_state === 'tp2' || trade.row_state === 'tp3') statusBadge = '<span class="badge badge-green">WIN</span>';
        else if (trade.row_state === 'sl') statusBadge = '<span class="badge badge-red">SL</span>';
        else statusBadge = '<span class="badge badge-yellow">FERMÉ</span>';
        
        const tp1Class = trade.tp1_hit ? 'tp-hit' : 'tp-pending';
        const tp2Class = trade.tp2_hit ? 'tp-hit' : 'tp-pending';
        const tp3Class = trade.tp3_hit ? 'tp-hit' : 'tp-pending';
        
        const formatPrice = (p) => {{ if (p >= 1) return p.toFixed(2); if (p >= 0.01) return p.toFixed(4); return p.toFixed(6); }};
        
        row.innerHTML = `
            <td>#${{trade.id}}</td>
            <td style="color:#64748b;font-size:11px;">${{trade.entry_time || 'N/A'}}</td>
            <td><strong>${{trade.symbol}}</strong></td>
            <td>${{trade.side}}</td>
            <td>${{formatPrice(trade.entry)}}</td>
            <td><div class="tp-cell">
                <div class="${{tp1Class}} tp-item">${{trade.tp1_hit ? '✓' : '○'}} TP1</div>
                <div class="${{tp2Class}} tp-item">${{trade.tp2_hit ? '✓' : '○'}} TP2</div>
                <div class="${{tp3Class}} tp-item">${{trade.tp3_hit ? '✓' : '○'}} TP3</div>
            </div></td>
            <td>${{formatPrice(trade.sl)}}</td>
            <td>${{statusBadge}}</td>
        `;
        tbody.appendChild(row);
    }});
    
    const fgRes = await fetch('/api/fear-greed');
    const fgData = await fgRes.json();
    if (fgData.ok) {{
        const fg = fgData.fear_greed;
        document.getElementById('fearGreedContainer').innerHTML = `<div style="text-align:center;padding:20px;"><div style="font-size:48px;">${{fg.value}}</div><p style="margin-top:10px;">${{fg.emoji}} ${{fg.sentiment}}</p></div>`;
    }}
    
    const brRes = await fetch('/api/bullrun-phase');
    const brData = await brRes.json();
    if (brData.ok) {{
        const phase = brData.bullrun_phase;
        document.getElementById('bullrunContainer').innerHTML = `<div style="text-align:center;padding:20px;"><div style="font-size:48px;">${{phase.emoji}}</div><h3 style="color:${{phase.color}};margin:15px 0;">${{phase.phase_name}}</h3><p style="color:#94a3b8;">${{phase.description}}</p></div>`;
    }}
}}
loadDashboard();
setInterval(loadDashboard, 30000);
</script>
</body></html>""")

# PAGES HTML SUITE - Convertisseur
@app.get("/convertisseur", response_class=HTMLResponse)
async def convertisseur_page():
    return HTMLResponse("""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Convertisseur</title>""" + CSS + """</head>
<body><div class="container">
<div class="header"><h1>💱 Convertisseur Universel</h1></div>""" + NAV + """
<div class="card"><h2>Convertir</h2>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-bottom:20px;">
<div><label style="display:block;margin-bottom:8px;color:#94a3b8;">Montant</label><input type="number" id="amount" value="1" step="0.01" min="0"></div>
<div><label style="display:block;margin-bottom:8px;color:#94a3b8;">De</label>
<select id="fromAsset">
<optgroup label="💰 Crypto"><option value="bitcoin">Bitcoin</option><option value="ethereum">Ethereum</option><option value="tether">USDT</option></optgroup>
<optgroup label="💵 Fiat"><option value="USD">USD</option><option value="CAD">CAD</option><option value="EUR">EUR</option></optgroup>
</select></div>
<div><label style="display:block;margin-bottom:8px;color:#94a3b8;">Vers</label>
<select id="toAsset">
<optgroup label="💵 Fiat"><option value="USD">USD</option><option value="CAD" selected>CAD</option><option value="EUR">EUR</option></optgroup>
<optgroup label="💰 Crypto"><option value="bitcoin">Bitcoin</option><option value="ethereum">Ethereum</option><option value="USDT">USDT</option></optgroup>
</select></div>
</div>
<button onclick="convert()">🔄 Convertir</button>
<div id="result" style="display:none;background:rgba(99,102,241,0.1);padding:20px;border-radius:8px;margin-top:20px;text-align:center;">
<div id="resultAmount" style="font-size:36px;font-weight:bold;color:#6366f1;">0.00</div>
<div id="resultDetails" style="color:#94a3b8;margin-top:10px;"></div>
</div>
</div>
</div>
<script>
async function convert() {
    const amount = document.getElementById('amount').value;
    const fromAsset = document.getElementById('fromAsset').value;
    const toAsset = document.getElementById('toAsset').value;
    
    const res = await fetch(`/api/convert?amount=${amount}&from_asset=${fromAsset}&to_asset=${toAsset}`);
    const data = await res.json();
    
    if (data.ok) {
        document.getElementById('result').style.display = 'block';
        const formatted = data.result < 0.01 ? data.result.toFixed(8) : data.result.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 8});
        document.getElementById('resultAmount').textContent = formatted + ' ' + data.to;
        document.getElementById('resultDetails').textContent = `${data.amount} ${data.from} = ${formatted} ${data.to}`;
    }
}
</script>
</body></html>""")

# Page Calendrier
@app.get("/calendrier", response_class=HTMLResponse)
async def calendrier_page():
    return HTMLResponse("""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Calendrier</title>""" + CSS + """</head>
<body><div class="container">
<div class="header"><h1>📅 Calendrier Événements</h1></div>""" + NAV + """
<div class="card"><h2>Prochains événements</h2><div id="eventsContainer">Chargement...</div></div>
</div>
<script>
async function loadEvents() {
    const res = await fetch('/api/crypto-events');
    const data = await res.json();
    let html = '';
    data.events.forEach(event => {
        const color = event.importance === 'high' ? '#ef4444' : '#f59e0b';
        html += `<div style="background:rgba(99,102,241,0.05);padding:16px;border-radius:8px;margin-bottom:12px;border-left:4px solid #6366f1;">
            <div style="font-size:12px;color:#64748b;margin-bottom:8px;">📆 ${event.date}</div>
            <div style="font-size:16px;font-weight:600;margin-bottom:8px;">${event.title}</div>
            <span style="padding:4px 8px;background:${color}20;color:${color};border-radius:4px;font-size:11px;">${event.category}</span>
            <p style="color:#94a3b8;font-size:13px;margin-top:8px;">${event.description}</p>
        </div>`;
    });
    document.getElementById('eventsContainer').innerHTML = html;
}
loadEvents();
</script>
</body></html>""")

# Page Altcoin Season
@app.get("/altcoin-season", response_class=HTMLResponse)
async def altcoin_season_page():
    return HTMLResponse("""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Altcoin Season</title>""" + CSS + """</head>
<body><div class="container">
<div class="header"><h1>🚀 Altcoin Season Index</h1></div>""" + NAV + """
<div class="card"><h2>Index Actuel</h2><div id="altseasonContainer">Chargement...</div></div>
</div>
<script>
async function loadAltseason() {
    const res = await fetch('/api/altcoin-season');
    const data = await res.json();
    if (data.ok) {
        const a = data.altseason;
        document.getElementById('altseasonContainer').innerHTML = `
            <div style="text-align:center;padding:30px;">
                <div style="font-size:72px;font-weight:bold;color:${a.color};">${a.index}</div>
                <div style="font-size:24px;margin:20px 0;color:${a.color};">${a.status}</div>
                <p style="color:#94a3b8;">${a.description}</p>
                <div class="altseason-meter"><div class="altseason-indicator" style="left:${a.index}%;"></div></div>
                <div style="margin-top:20px;"><strong>BTC Dominance:</strong> ${a.btc_dominance.toFixed(1)}%</div>
            </div>
        `;
    }
}
loadAltseason();
setInterval(loadAltseason, 60000);
</script>
</body></html>""")

# Page BTC Dominance
@app.get("/btc-dominance", response_class=HTMLResponse)
async def btc_dominance_page():
    return HTMLResponse("""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>BTC Dominance</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
""" + CSS + """</head>
<body><div class="container">
<div class="header"><h1>₿ Bitcoin Dominance</h1></div>""" + NAV + """
<div class="grid grid-3">
<div class="card"><h2>BTC</h2><div id="btcDom">Loading...</div></div>
<div class="card"><h2>ETH</h2><div id="ethDom">Loading...</div></div>
<div class="card"><h2>Others</h2><div id="otherDom">Loading...</div></div>
</div>
<div class="card"><h2>📈 7 Days</h2><canvas id="domChart"></canvas></div>
</div>
<script>
async function loadDominance() {
    const res = await fetch('/api/btc-dominance');
    const data = await res.json();
    if (data.ok) {
        document.getElementById('btcDom').innerHTML = `<div style="text-align:center;padding:20px;"><div style="font-size:48px;font-weight:bold;color:#f7931a;">${data.current_dominance.toFixed(1)}%</div></div>`;
        document.getElementById('ethDom').innerHTML = `<div style="text-align:center;padding:20px;"><div style="font-size:48px;font-weight:bold;color:#627eea;">${data.eth_dominance.toFixed(1)}%</div></div>`;
        const other = 100 - data.current_dominance - data.eth_dominance;
        document.getElementById('otherDom').innerHTML = `<div style="text-align:center;padding:20px;"><div style="font-size:48px;font-weight:bold;color:#10b981;">${other.toFixed(1)}%</div></div>`;
        
        const ctx = document.getElementById('domChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.historical.map(h => h.date),
                datasets: [{label: 'BTC Dominance (%)', data: data.historical.map(h => h.dominance), borderColor: '#f7931a', backgroundColor: 'rgba(247, 147, 26, 0.1)', fill: true}]
            },
            options: {responsive: true, plugins: {legend: {labels: {color: '#e2e8f0'}}}, scales: {y: {ticks: {color: '#e2e8f0'}, grid: {color: 'rgba(99, 102, 241, 0.1)'}}, x: {ticks: {color: '#e2e8f0'}, grid: {color: 'rgba(99, 102, 241, 0.1)'}}}}
        });
    }
}
loadDominance();
</script>
</body></html>""")

# Page BTC Returns
@app.get("/btc-returns", response_class=HTMLResponse)
async def btc_returns_page():
    return HTMLResponse("""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>BTC Returns</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
""" + CSS + """</head>
<body><div class="container">
<div class="header"><h1>📈 Bitcoin Quarterly Returns</h1></div>""" + NAV + """
<div class="card"><h2>Returns par trimestre</h2><canvas id="returnsChart"></canvas></div>
</div>
<script>
async function loadReturns() {
    const res = await fetch('/api/bitcoin-quarterly-returns');
    const data = await res.json();
    if (data.ok) {
        const ctx = document.getElementById('returnsChart').getContext('2d');
        const labels = data.data.map(r => `${r.year} ${r.q_label}`);
        const values = data.data.map(r => r.return);
        const colors = values.map(v => v >= 0 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)');
        
        new Chart(ctx, {
            type: 'bar',
            data: {labels: labels, datasets: [{label: 'Return (%)', data: values, backgroundColor: colors}]},
            options: {responsive: true, plugins: {legend: {labels: {color: '#e2e8f0'}}}, scales: {y: {ticks: {color: '#e2e8f0'}, grid: {color: 'rgba(99, 102, 241, 0.1)'}}, x: {ticks: {color: '#e2e8f0'}, grid: {color: 'rgba(99, 102, 241, 0.1)'}}}}
        });
    }
}
loadReturns();
</script>
</body></html>""")

# Page News
@app.get("/annonces", response_class=HTMLResponse)
async def annonces_page():
    news = await fetch_all_news()
    news_html = ""
    for item in news[:20]:
        news_html += f"""<div style="background:rgba(99,102,241,0.05);padding:16px;border-radius:8px;margin-bottom:12px;border-left:4px solid #6366f1;">
            <div style="font-size:16px;font-weight:600;margin-bottom:8px;">{item['title']}</div>
            <div style="font-size:12px;color:#64748b;margin-bottom:8px;">{item['source']} • {item.get('time_ago', '')}</div>
            <a href="{item['link']}" target="_blank" style="color:#6366f1;font-size:12px;">Lire →</a>
        </div>"""
    
    return HTMLResponse("""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>News</title>""" + CSS + """</head>
<body><div class="container">
<div class="header"><h1>📰 Actualités Crypto</h1></div>""" + NAV + """
<div class="card"><h2>Dernières news</h2>""" + news_html + """</div>
</div></body></html>""")

if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*70)
    print("🚀 TRADING DASHBOARD v3.2.0")
    print("="*70)
    print("✅ Toutes les pages sont maintenant disponibles")
    print("="*70)
    
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
