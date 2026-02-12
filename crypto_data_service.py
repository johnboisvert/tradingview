# -*- coding: utf-8 -*-
"""
📊 SERVICE DE DONNÉES CRYPTO EN TEMPS RÉEL
Intégration avec CoinGecko, Binance, Alternative.me et autres APIs
"""

import asyncio
import httpx
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
import json

# Import configuration
try:
    from config import (
        COINGECKO_API_URL, BINANCE_API_URL, FEAR_GREED_API_URL,
        MEMPOOL_API_URL, BLOCKCHAIN_INFO_URL,
        CACHE_TTL_PRICES, CACHE_TTL_MARKET_DATA, CACHE_TTL_FEAR_GREED,
        get_api_headers
    )
except ImportError:
    # Fallback si config.py n'est pas disponible
    COINGECKO_API_URL = "https://api.coingecko.com/api/v3"
    BINANCE_API_URL = "https://api.binance.com/api/v3"
    FEAR_GREED_API_URL = "https://api.alternative.me/fng/"
    MEMPOOL_API_URL = "https://mempool.space/api"
    BLOCKCHAIN_INFO_URL = "https://blockchain.info"
    CACHE_TTL_PRICES = 60
    CACHE_TTL_MARKET_DATA = 300
    CACHE_TTL_FEAR_GREED = 3600
    
    def get_api_headers(service="default"):
        return {"User-Agent": "CryptoIA/2.0", "Accept": "application/json"}


@dataclass
class CacheEntry:
    """Entrée de cache avec TTL"""
    data: Any
    timestamp: datetime
    ttl: int  # secondes
    
    def is_valid(self) -> bool:
        return datetime.now() - self.timestamp < timedelta(seconds=self.ttl)


class CryptoDataService:
    """
    Service centralisé pour récupérer les données crypto en temps réel
    avec cache intelligent et fallback automatique
    """
    
    def __init__(self):
        self._cache: Dict[str, CacheEntry] = {}
        self._client: Optional[httpx.AsyncClient] = None
    
    async def _get_client(self) -> httpx.AsyncClient:
        """Retourne un client HTTP réutilisable"""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=15.0,
                headers=get_api_headers()
            )
        return self._client
    
    async def close(self):
        """Ferme le client HTTP"""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
    
    def _get_cache(self, key: str) -> Optional[Any]:
        """Récupère une valeur du cache si valide"""
        if key in self._cache and self._cache[key].is_valid():
            return self._cache[key].data
        return None
    
    def _set_cache(self, key: str, data: Any, ttl: int):
        """Stocke une valeur dans le cache"""
        self._cache[key] = CacheEntry(data=data, timestamp=datetime.now(), ttl=ttl)
    
    # ========================================================================
    # 💰 PRIX ET MARKET DATA
    # ========================================================================
    
    async def get_crypto_prices(self, symbols: List[str] = None) -> Dict:
        """
        Récupère les prix actuels des cryptos principales
        Source: CoinGecko API (gratuit, fiable)
        """
        if symbols is None:
            symbols = ["bitcoin", "ethereum", "binancecoin", "solana", "cardano", "ripple", "dogecoin"]
        
        cache_key = f"prices_{','.join(sorted(symbols))}"
        cached = self._get_cache(cache_key)
        if cached:
            return cached
        
        try:
            client = await self._get_client()
            
            # CoinGecko simple price endpoint
            url = f"{COINGECKO_API_URL}/simple/price"
            params = {
                "ids": ",".join(symbols),
                "vs_currencies": "usd,eur,cad",
                "include_24hr_change": "true",
                "include_24hr_vol": "true",
                "include_market_cap": "true",
                "include_last_updated_at": "true"
            }
            
            response = await client.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                self._set_cache(cache_key, data, CACHE_TTL_PRICES)
                print(f"✅ Prix récupérés pour {len(data)} cryptos")
                return data
            else:
                print(f"⚠️ CoinGecko API erreur: {response.status_code}")
                return await self._get_prices_fallback_binance(symbols)
                
        except Exception as e:
            print(f"❌ Erreur récupération prix: {e}")
            return await self._get_prices_fallback_binance(symbols)
    
    async def _get_prices_fallback_binance(self, symbols: List[str]) -> Dict:
        """Fallback Binance pour les prix"""
        try:
            client = await self._get_client()
            
            # Mapping CoinGecko ID -> Binance symbol
            symbol_map = {
                "bitcoin": "BTCUSDT",
                "ethereum": "ETHUSDT",
                "binancecoin": "BNBUSDT",
                "solana": "SOLUSDT",
                "cardano": "ADAUSDT",
                "ripple": "XRPUSDT",
                "dogecoin": "DOGEUSDT"
            }
            
            url = f"{BINANCE_API_URL}/ticker/24hr"
            response = await client.get(url)
            
            if response.status_code == 200:
                tickers = response.json()
                ticker_dict = {t["symbol"]: t for t in tickers}
                
                result = {}
                for coin_id in symbols:
                    binance_symbol = symbol_map.get(coin_id)
                    if binance_symbol and binance_symbol in ticker_dict:
                        t = ticker_dict[binance_symbol]
                        result[coin_id] = {
                            "usd": float(t["lastPrice"]),
                            "usd_24h_change": float(t["priceChangePercent"]),
                            "usd_24h_vol": float(t["volume"]) * float(t["lastPrice"])
                        }
                
                return result
        except Exception as e:
            print(f"❌ Fallback Binance échoué: {e}")
        
        return {}
    
    async def get_market_overview(self) -> Dict:
        """
        Récupère une vue d'ensemble du marché crypto
        Inclut: market cap total, volume 24h, dominance BTC, etc.
        """
        cache_key = "market_overview"
        cached = self._get_cache(cache_key)
        if cached:
            return cached
        
        try:
            client = await self._get_client()
            url = f"{COINGECKO_API_URL}/global"
            
            response = await client.get(url)
            
            if response.status_code == 200:
                data = response.json().get("data", {})
                
                result = {
                    "total_market_cap_usd": data.get("total_market_cap", {}).get("usd", 0),
                    "total_volume_24h_usd": data.get("total_volume", {}).get("usd", 0),
                    "btc_dominance": round(data.get("market_cap_percentage", {}).get("btc", 0), 2),
                    "eth_dominance": round(data.get("market_cap_percentage", {}).get("eth", 0), 2),
                    "active_cryptocurrencies": data.get("active_cryptocurrencies", 0),
                    "markets": data.get("markets", 0),
                    "market_cap_change_24h": round(data.get("market_cap_change_percentage_24h_usd", 0), 2),
                    "updated_at": datetime.now().isoformat()
                }
                
                self._set_cache(cache_key, result, CACHE_TTL_MARKET_DATA)
                print("✅ Market overview récupéré")
                return result
                
        except Exception as e:
            print(f"❌ Erreur market overview: {e}")
        
        return {
            "total_market_cap_usd": 0,
            "btc_dominance": 0,
            "error": "Données non disponibles"
        }
    
    async def get_top_coins(self, limit: int = 20) -> List[Dict]:
        """
        Récupère le top N des cryptos par market cap
        """
        cache_key = f"top_coins_{limit}"
        cached = self._get_cache(cache_key)
        if cached:
            return cached
        
        try:
            client = await self._get_client()
            url = f"{COINGECKO_API_URL}/coins/markets"
            params = {
                "vs_currency": "usd",
                "order": "market_cap_desc",
                "per_page": str(limit),
                "page": "1",
                "sparkline": "false",
                "price_change_percentage": "1h,24h,7d"
            }
            
            response = await client.get(url, params=params)
            
            if response.status_code == 200:
                coins = response.json()
                
                result = []
                for coin in coins:
                    result.append({
                        "id": coin.get("id"),
                        "symbol": coin.get("symbol", "").upper(),
                        "name": coin.get("name"),
                        "image": coin.get("image"),
                        "current_price": coin.get("current_price", 0),
                        "market_cap": coin.get("market_cap", 0),
                        "market_cap_rank": coin.get("market_cap_rank", 0),
                        "total_volume": coin.get("total_volume", 0),
                        "price_change_1h": round(coin.get("price_change_percentage_1h_in_currency", 0) or 0, 2),
                        "price_change_24h": round(coin.get("price_change_percentage_24h", 0) or 0, 2),
                        "price_change_7d": round(coin.get("price_change_percentage_7d_in_currency", 0) or 0, 2),
                        "circulating_supply": coin.get("circulating_supply", 0),
                        "ath": coin.get("ath", 0),
                        "ath_change_percentage": round(coin.get("ath_change_percentage", 0) or 0, 2)
                    })
                
                self._set_cache(cache_key, result, CACHE_TTL_MARKET_DATA)
                print(f"✅ Top {limit} coins récupérés")
                return result
                
        except Exception as e:
            print(f"❌ Erreur top coins: {e}")
        
        return []
    
    # ========================================================================
    # 😱 FEAR & GREED INDEX
    # ========================================================================
    
    async def get_fear_greed_index(self, limit: int = 1) -> Dict:
        """
        Récupère le Fear & Greed Index actuel
        Source: Alternative.me API (gratuit)
        """
        cache_key = f"fear_greed_{limit}"
        cached = self._get_cache(cache_key)
        if cached:
            return cached
        
        try:
            client = await self._get_client()
            url = f"{FEAR_GREED_API_URL}?limit={limit}"
            
            response = await client.get(url)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("data"):
                    current = data["data"][0]
                    
                    result = {
                        "value": int(current.get("value", 0)),
                        "classification": current.get("value_classification", "Unknown"),
                        "timestamp": current.get("timestamp"),
                        "time_until_update": current.get("time_until_update"),
                        "history": data["data"] if limit > 1 else None,
                        "interpretation": self._interpret_fear_greed(int(current.get("value", 0)))
                    }
                    
                    self._set_cache(cache_key, result, CACHE_TTL_FEAR_GREED)
                    print(f"✅ Fear & Greed Index: {result['value']} ({result['classification']})")
                    return result
                    
        except Exception as e:
            print(f"❌ Erreur Fear & Greed: {e}")
        
        return {
            "value": 50,
            "classification": "Neutral",
            "error": "Données non disponibles"
        }
    
    def _interpret_fear_greed(self, value: int) -> Dict:
        """Interprète le Fear & Greed Index"""
        if value <= 25:
            return {
                "emoji": "😱",
                "sentiment": "Extreme Fear",
                "action": "Opportunité d'achat potentielle",
                "color": "#ef4444"
            }
        elif value <= 45:
            return {
                "emoji": "😰",
                "sentiment": "Fear",
                "action": "Marché craintif - prudence",
                "color": "#f97316"
            }
        elif value <= 55:
            return {
                "emoji": "😐",
                "sentiment": "Neutral",
                "action": "Marché indécis",
                "color": "#eab308"
            }
        elif value <= 75:
            return {
                "emoji": "😊",
                "sentiment": "Greed",
                "action": "Marché optimiste - attention",
                "color": "#22c55e"
            }
        else:
            return {
                "emoji": "🤑",
                "sentiment": "Extreme Greed",
                "action": "Risque de correction",
                "color": "#10b981"
            }
    
    # ========================================================================
    # 🐋 WHALE TRANSACTIONS
    # ========================================================================
    
    async def get_whale_transactions(self, min_btc: float = 100.0, limit: int = 20) -> List[Dict]:
        """
        Récupère les transactions whale BTC récentes
        Source: Blockchain.info (gratuit)
        """
        cache_key = f"whale_tx_{min_btc}_{limit}"
        cached = self._get_cache(cache_key)
        if cached:
            return cached
        
        try:
            client = await self._get_client()
            url = f"{BLOCKCHAIN_INFO_URL}/unconfirmed-transactions?format=json"
            
            response = await client.get(url)
            
            if response.status_code == 200:
                data = response.json()
                txs = data.get("txs", [])
                
                whale_txs = []
                for tx in txs:
                    try:
                        # Calculer le montant total
                        outputs = tx.get("out", [])
                        total_sats = sum(int(o.get("value", 0)) for o in outputs)
                        amount_btc = total_sats / 1e8
                        
                        if amount_btc < min_btc:
                            continue
                        
                        # Extraire les adresses
                        inputs = tx.get("inputs", [])
                        from_addr = "Unknown"
                        if inputs:
                            prev_out = inputs[0].get("prev_out", {})
                            from_addr = prev_out.get("addr", "Unknown")
                        
                        to_addr = "Unknown"
                        if outputs:
                            to_addr = outputs[0].get("addr", "Unknown")
                        
                        # Timestamp
                        ts = tx.get("time", 0)
                        time_str = datetime.fromtimestamp(ts).strftime("%H:%M") if ts else "—"
                        
                        whale_txs.append({
                            "time": time_str,
                            "asset": "BTC",
                            "amount": round(amount_btc, 2),
                            "amount_usd": round(amount_btc * 97000, 0),  # Prix approximatif
                            "from": self._shorten_address(from_addr),
                            "to": self._shorten_address(to_addr),
                            "txid": tx.get("hash", "")[:16],
                            "type": self._classify_whale_tx(from_addr, to_addr)
                        })
                        
                        if len(whale_txs) >= limit:
                            break
                            
                    except Exception:
                        continue
                
                if whale_txs:
                    self._set_cache(cache_key, whale_txs, 120)  # Cache 2 minutes
                    print(f"✅ {len(whale_txs)} transactions whale récupérées")
                    return whale_txs
                    
        except Exception as e:
            print(f"❌ Erreur whale transactions: {e}")
        
        return []
    
    def _shorten_address(self, addr: str) -> str:
        """Raccourcit une adresse crypto"""
        if not addr or addr == "Unknown":
            return "—"
        return f"{addr[:6]}...{addr[-6:]}" if len(addr) > 14 else addr
    
    def _classify_whale_tx(self, from_addr: str, to_addr: str) -> str:
        """Classifie le type de transaction whale"""
        exchanges = ["binance", "coinbase", "kraken", "bitfinex", "huobi", "okex"]
        
        from_lower = from_addr.lower() if from_addr else ""
        to_lower = to_addr.lower() if to_addr else ""
        
        # Détection simplifiée (en production, utiliser une base de données d'adresses)
        is_from_exchange = any(ex in from_lower for ex in exchanges)
        is_to_exchange = any(ex in to_lower for ex in exchanges)
        
        if is_from_exchange and not is_to_exchange:
            return "withdrawal"  # Retrait d'exchange = bullish
        elif not is_from_exchange and is_to_exchange:
            return "deposit"  # Dépôt sur exchange = bearish
        else:
            return "transfer"  # Transfert entre wallets
    
    # ========================================================================
    # 📈 DONNÉES HISTORIQUES
    # ========================================================================
    
    async def get_price_history(self, coin_id: str = "bitcoin", days: int = 30) -> Dict:
        """
        Récupère l'historique des prix pour un coin
        """
        cache_key = f"history_{coin_id}_{days}"
        cached = self._get_cache(cache_key)
        if cached:
            return cached
        
        try:
            client = await self._get_client()
            url = f"{COINGECKO_API_URL}/coins/{coin_id}/market_chart"
            params = {
                "vs_currency": "usd",
                "days": str(days),
                "interval": "daily" if days > 1 else "hourly"
            }
            
            response = await client.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                
                result = {
                    "coin_id": coin_id,
                    "days": days,
                    "prices": data.get("prices", []),
                    "market_caps": data.get("market_caps", []),
                    "volumes": data.get("total_volumes", []),
                    "updated_at": datetime.now().isoformat()
                }
                
                self._set_cache(cache_key, result, CACHE_TTL_MARKET_DATA)
                return result
                
        except Exception as e:
            print(f"❌ Erreur historique prix: {e}")
        
        return {"error": "Données non disponibles"}
    
    # ========================================================================
    # 🔍 RECHERCHE
    # ========================================================================
    
    async def search_coins(self, query: str) -> List[Dict]:
        """
        Recherche des cryptos par nom ou symbole
        """
        try:
            client = await self._get_client()
            url = f"{COINGECKO_API_URL}/search"
            params = {"query": query}
            
            response = await client.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                coins = data.get("coins", [])[:10]
                
                return [
                    {
                        "id": c.get("id"),
                        "symbol": c.get("symbol", "").upper(),
                        "name": c.get("name"),
                        "thumb": c.get("thumb"),
                        "market_cap_rank": c.get("market_cap_rank")
                    }
                    for c in coins
                ]
                
        except Exception as e:
            print(f"❌ Erreur recherche: {e}")
        
        return []
    
    # ========================================================================
    # 📊 TRENDING & NEWS
    # ========================================================================
    
    async def get_trending_coins(self) -> List[Dict]:
        """
        Récupère les cryptos trending sur CoinGecko
        """
        cache_key = "trending_coins"
        cached = self._get_cache(cache_key)
        if cached:
            return cached
        
        try:
            client = await self._get_client()
            url = f"{COINGECKO_API_URL}/search/trending"
            
            response = await client.get(url)
            
            if response.status_code == 200:
                data = response.json()
                coins = data.get("coins", [])
                
                result = [
                    {
                        "id": c.get("item", {}).get("id"),
                        "symbol": c.get("item", {}).get("symbol", "").upper(),
                        "name": c.get("item", {}).get("name"),
                        "thumb": c.get("item", {}).get("thumb"),
                        "market_cap_rank": c.get("item", {}).get("market_cap_rank"),
                        "score": c.get("item", {}).get("score", 0)
                    }
                    for c in coins[:10]
                ]
                
                self._set_cache(cache_key, result, CACHE_TTL_MARKET_DATA)
                return result
                
        except Exception as e:
            print(f"❌ Erreur trending: {e}")
        
        return []


# Instance globale du service
crypto_service = CryptoDataService()


# ============================================================================
# 🧪 TESTS
# ============================================================================

async def test_crypto_service():
    """Test du service de données crypto"""
    print("\n🧪 Test du CryptoDataService...\n")
    
    service = CryptoDataService()
    
    # Test 1: Prix
    print("1. Test des prix...")
    prices = await service.get_crypto_prices(["bitcoin", "ethereum"])
    print(f"   BTC: ${prices.get('bitcoin', {}).get('usd', 'N/A')}")
    print(f"   ETH: ${prices.get('ethereum', {}).get('usd', 'N/A')}")
    
    # Test 2: Market Overview
    print("\n2. Test market overview...")
    overview = await service.get_market_overview()
    print(f"   Total Market Cap: ${overview.get('total_market_cap_usd', 0):,.0f}")
    print(f"   BTC Dominance: {overview.get('btc_dominance', 0)}%")
    
    # Test 3: Fear & Greed
    print("\n3. Test Fear & Greed Index...")
    fg = await service.get_fear_greed_index()
    print(f"   Value: {fg.get('value')} ({fg.get('classification')})")
    
    # Test 4: Top Coins
    print("\n4. Test top coins...")
    top = await service.get_top_coins(5)
    for coin in top:
        print(f"   {coin['market_cap_rank']}. {coin['symbol']}: ${coin['current_price']:,.2f} ({coin['price_change_24h']:+.2f}%)")
    
    # Test 5: Whale Transactions
    print("\n5. Test whale transactions...")
    whales = await service.get_whale_transactions(min_btc=50, limit=3)
    for tx in whales:
        print(f"   {tx['time']} - {tx['amount']} BTC ({tx['type']})")
    
    await service.close()
    print("\n✅ Tests terminés!")


if __name__ == "__main__":
    asyncio.run(test_crypto_service())