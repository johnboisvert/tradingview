# altseason_router.py
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, Optional
import os, datetime as dt

import requests
from bs4 import BeautifulSoup

router = APIRouter(prefix="/altseason", tags=["altseason"])

# --------- Config via ENV ---------
BTC_THR  = float(os.getenv("ALT_BTC_DOM_THR", "55.0"))
ETH_THR  = float(os.getenv("ALT_ETH_BTC_THR", "0.045"))
ASI_THR  = float(os.getenv("ALT_ASI_THR", "75.0"))
T2_THR_T = float(os.getenv("ALT_TOTAL2_THR_T", "1.78"))  # trillions

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN", "")
TELEGRAM_CHAT  = os.getenv("TELEGRAM_CHAT", "")

# --------- Core helpers ---------
def _status(val: float, thr: float, direction: str) -> bool:
    if direction == "below":
        return val < thr
    return val > thr

def fetch_live() -> Dict[str, Any]:
    out = {"asof": dt.datetime.utcnow().isoformat() + "Z"}

    g = requests.get("https://api.coingecko.com/api/v3/global", timeout=15).json()
    mcap = g["data"]["total_market_cap"]["usd"]
    btc_pct = g["data"]["market_cap_percentage"]["btc"]
    out["btc_dominance"] = float(btc_pct)
    out["total_mcap_usd"] = float(mcap)
    out["total2_usd"] = float(mcap * (1 - btc_pct/100.0))

    sp = requests.get("https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin&vs_currencies=btc,usd", timeout=15).json()
    out["eth_btc"] = float(sp["ethereum"]["btc"])

    # Altseason Index (best-effort)
    out["altseason_index"] = None
    try:
        html = requests.get("https://www.blockchaincenter.net/altcoin-season-index/", timeout=15).text
        soup = BeautifulSoup(html, "html.parser")
        txt = soup.get_text(" ", strip=True)
        import re
        m = re.search(r"Altcoin Season Index[^0-9]*([0-9]{2,3})", txt)
        if m:
            v = int(m.group(1))
            if 0 <= v <= 100:
                out["altseason_index"] = v
    except Exception:
        pass
    return out

def summarize(snap: Dict[str, Any]) -> Dict[str, Any]:
    btc_ok  = _status(float(snap["btc_dominance"]), BTC_THR, "below")
    eth_ok  = _status(float(snap["eth_btc"]),       ETH_THR, "above")
    t2_ok   = _status(float(snap["total2_usd"]),    T2_THR_T*1e12, "above")
    asi     = snap.get("altseason_index")
    asi_ok  = (asi is not None) and _status(float(asi), ASI_THR, "above")
    greens  = sum([btc_ok, eth_ok, t2_ok, asi_ok])
    on      = greens >= 2
    return {
        "asof": snap.get("asof"),
        "btc_dominance": float(snap["btc_dominance"]),
        "eth_btc": float(snap["eth_btc"]),
        "total2_usd": float(snap["total2_usd"]),
        "altseason_index": (None if asi is None else int(asi)),
        "thresholds": {
            "btc": BTC_THR, "eth_btc": ETH_THR, "asi": ASI_THR, "total2_trillions": T2_THR_T
        },
        "triggers": {
            "btc_dominance_ok": btc_ok,
            "eth_btc_ok": eth_ok,
            "total2_ok": t2_ok,
            "altseason_index_ok": asi_ok
        },
        "greens": greens,
        "ALTSEASON_ON": on
    }

def telegram_send(text: str) -> Optional[bool]:
    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT:
        return None
    try:
        r = requests.post(f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage",
                          data={"chat_id": TELEGRAM_CHAT, "text": text}, timeout=10)
        return r.ok
    except Exception:
        return False

class NotifyBody(BaseModel):
    force: bool = False
    message: str | None = None

@router.get("/check")
def altseason_check():
    snap = fetch_live()
    snap.setdefault("asof", dt.datetime.utcnow().isoformat() + "Z")
    return summarize(snap)

@router.post("/notify")
def altseason_notify(body: NotifyBody):
    snap = fetch_live()
    snap.setdefault("asof", dt.datetime.utcnow().isoformat() + "Z")
    s = summarize(snap)
    sent = None
    if s["ALTSEASON_ON"] or body.force:
        msg = body.message or f"[Altseason] {s['asof']} — Greens={s['greens']} — ALTSEASON_ON={'YES' if s['ALTSEASON_ON'] else 'NO'}"
        sent = telegram_send(msg)
    return {"summary": s, "telegram_sent": sent}
