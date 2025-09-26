# =========================
# main.py — SECTION 1/4
# Imports, config/env, logging, HTML templates (INDEX / TRADES / ADMIN / EVENTS)
# =========================

import os
import re
import json
import time
import sqlite3
import logging
import threading
from typing import Optional, Dict, Any, List, Tuple
from string import Template
from collections import defaultdict

from fastapi import FastAPI, Request, HTTPException, Query
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse, Response

# -------------------------
# Logging
# -------------------------
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
log = logging.getLogger("aitrader")

# -------------------------
# Config / ENV
# -------------------------
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
LLM_ENABLED = os.getenv("LLM_ENABLED", "0") in ("1", "true", "True")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")
FORCE_LLM = os.getenv("FORCE_LLM", "0") in ("1", "true", "True")
CONFIDENCE_MIN = float(os.getenv("CONFIDENCE_MIN", "0.0") or 0.0)

PORT = int(os.getenv("PORT", "8000"))

RISK_ACCOUNT_BAL = float(os.getenv("RISK_ACCOUNT_BAL", "0") or 0)
RISK_PCT = float(os.getenv("RISK_PCT", "1.0") or 1.0)

# DB path default = data/data.db; fallback auto to /tmp si read-only
DB_PATH = os.getenv("DB_PATH", "data/data.db")
DEBUG_MODE = os.getenv("DEBUG", "0") in ("1", "true", "True")

# -------------------------
# ALTSEASON thresholds
# -------------------------
ALT_BTC_DOM_THR = float(os.getenv("ALT_BTC_DOM_THR", "55.0"))
ALT_ETH_BTC_THR = float(os.getenv("ALT_ETH_BTC_THR", "0.045"))
ALT_ASI_THR = float(os.getenv("ALT_ASI_THR", "75.0"))
ALT_TOTAL2_THR_T = float(os.getenv("ALT_TOTAL2_THR_T", "1.78"))  # trillions
ALT_CACHE_TTL = int(os.getenv("ALT_CACHE_TTL", "120"))  # seconds
ALT_GREENS_REQUIRED = int(os.getenv("ALT_GREENS_REQUIRED", "3"))

TELEGRAM_PIN_ALTSEASON = os.getenv("TELEGRAM_PIN_ALTSEASON", "1") in ("1", "true", "True")
ALTSEASON_AUTONOTIFY = os.getenv("ALTSEASON_AUTONOTIFY", "1") in ("1", "true", "True")
ALTSEASON_POLL_SECONDS = int(os.getenv("ALTSEASON_POLL_SECONDS", "300"))
ALTSEASON_NOTIFY_MIN_GAP_MIN = int(os.getenv("ALTSEASON_NOTIFY_MIN_GAP_MIN", "60"))
ALTSEASON_STATE_FILE = os.getenv("ALTSEASON_STATE_FILE", "/tmp/altseason_state.json")

TELEGRAM_COOLDOWN_SECONDS = float(os.getenv("TELEGRAM_COOLDOWN_SECONDS", "1.5") or 1.5)
_last_tg = 0.0

# -------------------------
# OpenAI client (optional)
# -------------------------
_openai_client = None
_llm_reason_down = None
if LLM_ENABLED and OPENAI_API_KEY:
    try:
        from openai import OpenAI  # type: ignore
        _openai_client = OpenAI(api_key=OPENAI_API_KEY)
    except Exception as e:
        _llm_reason_down = f"OpenAI client init failed: {e}"
else:
    _llm_reason_down = "LLM disabled or OPENAI_API_KEY missing"

# -------------------------
# HTML templates
# -------------------------
INDEX_HTML_TPL = Template(r"""<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>AI Trader PRO - Status</title>
<style>
:root{
  --bg:#0b1020; --bg2:#0f172a; --panel:#0e1324; --card:#0e1628; --muted:#93a4bf; --text:#e7eefc;
  --b1:#1e293b; --acc:#7c3aed; --acc2:#22d3ee; --ok:#10b981; --warn:#fb923c; --err:#ef4444;
  --chip:#0c1222; --grad1:#1a103a; --grad2:#0a213a; --ring: rgba(124, 58, 237, .35);
}
*{box-sizing:border-box}
body{margin:0;padding:24px;background:radial-gradient(1200px 600px at 10% -10%, var(--grad1), transparent 60%),
linear-gradient(180deg,var(--bg),var(--bg2));color:var(--text);font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial}
h1{margin:0 0 16px 0;font-size:32px;font-weight:800;letter-spacing:.2px}
h3{margin:0 0 8px 0}
.card{background:linear-gradient(180deg,rgba(255,255,255,.015),rgba(255,255,255,.005));
  border:1px solid var(--b1);border-radius:16px;padding:16px;margin-bottom:16px;box-shadow:0 10px 30px rgba(0,0,0,.2)}
table{width:100%;border-collapse:collapse;font-size:14px}
th,td{padding:10px;border-bottom:1px solid var(--b1)}
th{color:var(--muted);font-weight:600;text-align:left}
.btn{display:inline-block;padding:10px 14px;border:1px solid var(--b1);color:var(--text);text-decoration:none;border-radius:10px;margin-right:8px;background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.01))}
.btn:hover{box-shadow:0 0 0 3px var(--ring) inset}
.chip{display:inline-flex;align-items:center;gap:8px;padding:4px 10px;border:1px solid var(--b1);border-radius:999px;margin-right:8px;background:var(--chip);font-size:12px}
.dot{display:inline-block;width:10px;height:10px;border-radius:10px;margin-left:8px}
.ok{background:var(--ok)}.warn{background:var(--warn)}.err{background:var(--err)}.muted{color:var(--muted)}
.kpi{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.kpi .tile{background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.01));border:1px solid var(--b1);border-radius:12px;padding:12px}
.kpi .tile .h{font-size:12px;color:var(--muted)}
.kpi .tile .v{font-size:20px;font-weight:700;margin-top:2px}
</style></head><body>
<h1>AI Trader PRO — Status</h1>

<div class="card">
  <h3 class="muted">Environment</h3>
  <div class="kpi" style="margin:8px 0 12px">
    <div class="tile"><div class="h">LLM Enabled</div><div class="v">$LLM_ENABLED</div></div>
    <div class="tile"><div class="h">Model</div><div class="v">$LLM_MODEL</div></div>
    <div class="tile"><div class="h">DB Path</div><div class="v">$DB_PATH</div></div>
    <div class="tile"><div class="h">Port</div><div class="v">$PORT</div></div>
  </div>
  <table><thead><tr><th>Key</th><th>Value</th></tr></thead><tbody>$rows_html</tbody></table>
  <div style="margin-top:12px">
    <a class="btn" href="/env-sanity">/env-sanity</a>
    <a class="btn" href="/tg-health">/tg-health</a>
    <a class="btn" href="/openai-health">/openai-health</a>
    <a class="btn" href="/trades">/trades</a>
    <a class="btn" href="/trades-admin">/trades-admin</a>
  </div>
</div>

<div class="card">
  <h3 class="muted">Webhook</h3>
  <div>POST <code>/tv-webhook</code> (JSON). Secret via query <code>?secret=...</code> ou champ JSON <code>"secret"</code>.</div>
  <div style="margin-top:8px"><span class="chip">ENTRY</span><span class="chip">TP1_HIT</span><span class="chip">TP2_HIT</span><span class="chip">TP3_HIT</span><span class="chip">SL_HIT</span><span class="chip">CLOSE</span></div>
</div>

<div class="card">
  <h3 class="muted">Altseason — État rapide</h3>
  <div id="alt-asof" class="muted">Loading…</div>
  <div>BTC Dominance: <span id="alt-btc">—</span> (thr &lt; $btc_thr) <span id="dot-btc" class="dot"></span></div>
  <div>ETH/BTC: <span id="alt-eth">—</span> (thr &gt; $eth_thr) <span id="dot-eth" class="dot"></span></div>
  <div>Altseason Index: <span id="alt-asi">N/A</span> (thr ≥ $asi_thr) <span id="dot-asi" class="dot"></span></div>
  <div>TOTAL2: <span id="alt-t2">—</span> (thr &gt; $t2_thr T$) <span id="dot-t2" class="dot"></span></div>
  <div style="margin-top:10px">
    <strong>Badges:</strong>
    <span id="alt3" class="chip">Prep 3/4: —</span>
    <span id="alt4" class="chip">Confirm 4/4: —</span>
  </div>
  <div class="muted" style="margin-top:6px">Séries (jours consécutifs): <span id="d3">0</span>d @3/4, <span id="d4">0</span>d @4/4</div>
</div>

<script>
(function(){
  function setText(id, txt){ const el = document.getElementById(id); if (el) el.textContent = txt; }
  function setDot(id, ok){ const el = document.getElementById(id); if (el) el.className = "dot " + (ok ? "ok" : "warn"); }
  function num(v){ return typeof v === "number" ? v : Number(v); }
  fetch("/altseason/check")
  .then(async r => { const t = await r.text(); if(!r.ok) throw new Error(t); return JSON.parse(t); })
  .then(s => {
    setText("alt-asof", "As of " + (s.asof || "now") + (s.stale ? " (cache)" : ""));
    const btc = num(s.btc_dominance), eth=num(s.eth_btc), t2=num(s.total2_usd), asi=s.altseason_index;
    setText("alt-btc", Number.isFinite(btc) ? btc.toFixed(2) + " %" : "—"); setDot("dot-btc", s.triggers && s.triggers.btc_dominance_ok);
    setText("alt-eth", Number.isFinite(eth) ? eth.toFixed(5) : "—"); setDot("dot-eth", s.triggers && s.triggers.eth_btc_ok);
    setText("alt-asi", (asi == null) ? "N/A" : String(asi)); setDot("dot-asi", s.triggers && s.triggers.altseason_index_ok);
    setText("alt-t2", Number.isFinite(t2) ? (t2/1e12).toFixed(2) + " T$" : "—"); setDot("dot-t2", s.triggers && s.triggers.total2_ok);
  })
  .catch(e => {
    setText("alt-asof", "Erreur: " + (e && e.message ? e.message : e));
    setDot("dot-btc", false); setDot("dot-eth", false); setDot("dot-asi", false); setDot("dot-t2", false);
  });
  fetch("/altseason/streaks")
    .then(r => r.json())
    .then(s => {
      const b3 = document.getElementById("alt3");
      const b4 = document.getElementById("alt4");
      if (b3) b3.textContent = (s.ALT3_ON ? "Prep 3/4: ON" : "Prep 3/4: OFF");
      if (b4) b4.textContent = (s.ALT4_ON ? "Confirm 4/4: ON" : "Confirm 4/4: OFF");
      const d3 = document.getElementById("d3");
      const d4 = document.getElementById("d4");
      if (d3) d3.textContent = String(s.consec_3of4_days || 0);
      if (d4) d4.textContent = String(s.consec_4of4_days || 0);
    })
    .catch(()=>{});
})();
</script>
</body></html>
""")

# ---- “WOW” Trades page (public)
TRADES_PUBLIC_HTML_TPL = Template(r"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Trades (Public)</title>
<style>
:root{
  --bg:#070b16; --grad1:#0f1028; --grad2:#051a2b; --panel:#0c1324; --text:#f3f6ff; --muted:#94a3b8;
  --b1:#1f2a44; --ring:#7c3aed55; --acc:#8b5cf6; --acc2:#22d3ee; --ok:#10b981; --warn:#fb923c; --loss:#ef4444;
  --chip:#0a1222; --card:#0c1426;
}
*{box-sizing:border-box}
body{margin:0;padding:20px;background:radial-gradient(1200px 700px at 10% -10%, var(--grad1), transparent 55%),
      radial-gradient(800px 400px at 100% 0%, var(--grad2), transparent 45%), linear-gradient(180deg,#0a0f1f,#091427);
     color:var(--text);font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial}
a{text-decoration:none;color:inherit}
h1{margin:0 0 12px 0;font-size:28px;font-weight:800}
.muted{color:var(--muted)}

.container{max-width:1200px;margin:0 auto}
.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.badges{display:flex;gap:8px;flex-wrap:wrap}
.chip{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border:1px solid var(--b1);border-radius:999px;background:var(--chip);font-size:12px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border:1px solid var(--b1);border-radius:10px;background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02))}
.btn:hover{box-shadow:0 0 0 3px var(--ring) inset}

.grid{display:grid;grid-template-columns:1.2fr .8fr;gap:16px}
.card{background:linear-gradient(180deg,rgba(255,255,255,.02),rgba(255,255,255,.01));border:1px solid var(--b1);border-radius:16px;padding:14px;box-shadow:0 10px 30px rgba(0,0,0,.25)}
.card h3{margin:0 0 10px 0;font-size:16px;color:var(--muted);font-weight:700;letter-spacing:.3px}

form .row{display:flex;gap:10px;flex-wrap:wrap;margin-top:6px}
input{background:rgba(255,255,255,.03);color:var(--text);border:1px solid var(--b1);border-radius:10px;padding:10px;min-width:170px}
label{display:block;font-size:12px;color:var(--muted);margin:0 0 4px 2px}

.kpi{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}
.tile{background:linear-gradient(180deg,rgba(255,255,255,.02),rgba(255,255,255,.01));border:1px solid var(--b1);border-radius:12px;padding:10px}
.tile .h{font-size:12px;color:var(--muted)}
.tile .v{font-size:18px;font-weight:800;margin-top:2px}

.table{overflow:auto;border-radius:12px;border:1px solid var(--b1)}
table{width:100%;border-collapse:collapse;font-size:14px}
th,td{padding:10px;border-bottom:1px solid var(--b1);text-align:left;white-space:nowrap}
thead th{position:sticky;top:0;background:#0e1628}
.badge-win{background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.35)}
.badge-loss{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.35)}
.badge-none{background:rgba(148,163,184,.12);border:1px solid rgba(148,163,184,.35)}
.out{display:inline-block;padding:2px 8px;border-radius:999px}

.alt-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.dot{display:inline-block;width:10px;height:10px;border-radius:10px;margin-left:8px}
.ok{background:var(--ok)}.warn{background:var(--warn)}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>Trades (Public)</h1>
    <div class="badges">
      <a class="btn" href="/">Home</a>
      <a class="btn" href="/trades.csv?symbol=$symbol&tf=$tf&start=$start&end=$end&limit=$limit">Export CSV</a>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <h3>Filtre</h3>
      <form method="get">
        <div class="row">
          <div><label>Symbol</label><input name="symbol" value="$symbol"></div>
          <div><label>TF</label><input name="tf" value="$tf"></div>
          <div><label>Start (YYYY-MM-DD)</label><input name="start" value="$start"></div>
          <div><label>End (YYYY-MM-DD)</label><input name="end" value="$end"></div>
          <div><label>Limit</label><input name="limit" value="$limit" type="number" min="1" max="10000"></div>
        </div>
        <div style="margin-top:10px;display:flex;gap:8px">
          <button class="btn" type="submit">Apply</button>
          <a class="btn" href="/trades">Reset</a>
        </div>
      </form>
    </div>

    <div class="card">
      <h3>Altseason — État rapide</h3>
      <div class="alt-grid">
        <div>
          <div id="alt-asof" class="muted">Loading…</div>
          <div>BTC Dominance: <span id="alt-btc">—</span> (thr &lt; $btc_thr) <span id="dot-btc" class="dot"></span></div>
          <div>ETH/BTC: <span id="alt-eth">—</span> (thr &gt; $eth_thr) <span id="dot-eth" class="dot"></span></div>
        </div>
        <div>
          <div>Altseason Index: <span id="alt-asi">N/A</span> (thr ≥ $asi_thr) <span id="dot-asi" class="dot"></span></div>
          <div>TOTAL2: <span id="alt-t2">—</span> (thr &gt; $t2_thr T$) <span id="dot-t2" class="dot"></span></div>
          <div class="muted" style="margin-top:6px">Séries: <span id="d3">0</span>d @3/4, <span id="d4">0</span>d @4/4</div>
        </div>
      </div>
      <div style="margin-top:8px">
        <span id="alt3" class="chip">Prep 3/4: —</span>
        <span id="alt4" class="chip">Confirm 4/4: —</span>
      </div>
    </div>
  </div>

  <div class="card">
    <h3>Statistiques</h3>
    <div class="kpi">
      <div class="tile"><div class="h">Total trades</div><div class="v">$total_trades</div></div>
      <div class="tile"><div class="h">Winrate</div><div class="v">$winrate_pct%</div></div>
      <div class="tile"><div class="h">W / L</div><div class="v">$wins / $losses</div></div>
      <div class="tile"><div class="h">TP1/2/3</div><div class="v">$tp1_hits / $tp2_hits / $tp3_hits</div></div>
      <div class="tile"><div class="h">Avg time (s)</div><div class="v">$avg_time_to_outcome_sec</div></div>
      <div class="tile"><div class="h">Best/Worst streak</div><div class="v">$best_win_streak / $worst_loss_streak</div></div>
    </div>
  </div>

  <div class="card table">
    <table>
      <thead>
        <tr><th>ID</th><th>Symbol</th><th>TF</th><th>Side</th><th>Entry</th><th>SL</th><th>TP1</th><th>TP2</th><th>TP3</th><th>Outcome</th><th>Duration (s)</th></tr>
      </thead>
      <tbody>
        $rows_html
      </tbody>
    </table>
  </div>
</div>

<script>
(function(){
  function setText(id, txt){ const el = document.getElementById(id); if (el) el.textContent = txt; }
  function setDot(id, ok){ const el = document.getElementById(id); if (el) el.className = "dot " + (ok ? "ok" : "warn"); }
  function num(v){ return typeof v === "number" ? v : Number(v); }
  fetch("/altseason/check")
  .then(async r => { const t = await r.text(); if(!r.ok) throw new Error(t); return JSON.parse(t); })
  .then(s => {
    setText("alt-asof", "As of " + (s.asof || "now") + (s.stale ? " (cache)" : ""));
    const btc = num(s.btc_dominance), eth=num(s.eth_btc), t2=num(s.total2_usd), asi=s.altseason_index;
    setText("alt-btc", Number.isFinite(btc) ? btc.toFixed(2) + " %" : "—"); setDot("dot-btc", s.triggers && s.triggers.btc_dominance_ok);
    setText("alt-eth", Number.isFinite(eth) ? eth.toFixed(5) : "—"); setDot("dot-eth", s.triggers && s.triggers.eth_btc_ok);
    setText("alt-asi", (asi == null) ? "N/A" : String(asi)); setDot("dot-asi", s.triggers && s.triggers.altseason_index_ok);
    setText("alt-t2", Number.isFinite(t2) ? (t2/1e12).toFixed(2) + " T$" : "—"); setDot("dot-t2", s.triggers && s.triggers.total2_ok);
  })
  .catch(e => {
    setText("alt-asof", "Erreur: " + (e && e.message ? e.message : e));
    setDot("dot-btc", false); setDot("dot-eth", false); setDot("dot-asi", false); setDot("dot-t2", false);
  });
  fetch("/altseason/streaks")
    .then(r => r.json())
    .then(s => {
      const b3 = document.getElementById("alt3");
      const b4 = document.getElementById("alt4");
      if (b3) b3.textContent = (s.ALT3_ON ? "Prep 3/4: ON" : "Prep 3/4: OFF");
      if (b4) b4.textContent = (s.ALT4_ON ? "Confirm 4/4: ON" : "Confirm 4/4: OFF");
      const d3 = document.getElementById("d3");
      const d4 = document.getElementById("d4");
      if (d3) d3.textContent = String(s.consec_3of4_days || 0);
      if (d4) d4.textContent = String(s.consec_4of4_days || 0);
    })
    .catch(()=>{});
})();
</script>
</body></html>
""")

# ---- Admin Trades
TRADES_ADMIN_HTML_TPL = Template(r"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Trades (Admin)</title>
<style>
body{margin:0;padding:24px;background:#0b1020;color:#e5e7eb;font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial}
.muted{color:#94a3b8} h1{margin:0 0 16px 0}
.card{background:linear-gradient(180deg,rgba(255,255,255,.02),rgba(255,255,255,.01));border:1px solid #1f2937;border-radius:16px;padding:16px;margin-bottom:16px}
.btn{display:inline-block;padding:10px 14px;border:1px solid #1f2937;border-radius:10px;color:#e5e7eb;text-decoration:none}
form .row{display:flex;gap:10px;flex-wrap:wrap;margin-top:6px}
input{background:rgba(255,255,255,.03);color:#e5e7eb;border:1px solid #1f2937;border-radius:10px;padding:10px;min-width:170px}
table{width:100%;border-collapse:collapse;font-size:14px}
th,td{padding:10px;border-bottom:1px solid #1f2937;text-align:left;white-space:nowrap}
.badge-win{background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.35);border-radius:999px;padding:2px 8px}
.badge-loss{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.35);border-radius:999px;padding:2px 8px}
</style></head><body>
<h1>Trades (Admin)</h1>
<div class="card">
  <form method="get">
    <input type="hidden" name="secret" value="$secret">
    <div class="row">
      <div><label>Symbol</label><input name="symbol" value="$symbol"></div>
      <div><label>TF</label><input name="tf" value="$tf"></div>
      <div><label>Start</label><input name="start" value="$start"></div>
      <div><label>End</label><input name="end" value="$end"></div>
      <div><label>Limit</label><input name="limit" value="$limit" type="number" min="1" max="10000"></div>
    </div>
    <div style="margin-top:8px; display:flex; gap:8px">
      <button class="btn" type="submit">Apply</button>
      <a class="btn" href="/">Home</a>
      <a class="btn" href="/events?secret=$secret">Events</a>
      <a class="btn" href="/reset?secret=$secret&confirm=yes">Reset DB</a>
    </div>
  </form>
</div>

<div class="card">
  <div style="display:flex;gap:14px;flex-wrap:wrap">
    <div>Total trades: <strong>$total_trades</strong></div>
    <div>Winrate: <strong>$winrate_pct%</strong></div>
    <div>W/L: <strong>$wins</strong>/<strong>$losses</strong></div>
    <div>TP1/2/3: <strong>$tp1_hits</strong>/<strong>$tp2_hits</strong>/<strong>$tp3_hits</strong></div>
    <div>Avg time (s): <strong>$avg_time_to_outcome_sec</strong></div>
    <div>Best/Worst streak: <strong>$best_win_streak</strong>/<strong>$worst_loss_streak</strong></div>
  </div>
</div>

<div class="card">
  <table><thead>
    <tr><th>ID</th><th>Symbol</th><th>TF</th><th>Side</th><th>Entry</th><th>SL</th><th>TP1</th><th>TP2</th><th>TP3</th><th>Outcome</th><th>Duration (s)</th></tr>
  </thead><tbody>
    $rows_html
  </tbody></table>
</div>
</body></html>
""")

# ---- Events
EVENTS_HTML_TPL = Template(r"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Events</title>
<style>
body{margin:0;padding:24px;background:#0b1020;color:#e5e7eb;font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial}
h1{margin:0 0 16px 0}.muted{color:#94a3b8}
.card{background:linear-gradient(180deg,rgba(255,255,255,.02),rgba(255,255,255,.01));border:1px solid #1f2937;border-radius:16px;padding:16px;margin-bottom:16px}
.btn{display:inline-block;padding:10px 14px;border:1px solid #1f2937;border-radius:10px;color:#e5e7eb;text-decoration:none}
table{width:100%;border-collapse:collapse;font-size:14px}
th,td{padding:10px;border-bottom:1px solid #1f2937;text-align:left;vertical-align:top}
pre{white-space:pre-wrap;margin:0}
</style></head><body>
<h1>Events</h1>
<div class="card">
  <a class="btn" href="/">Home</a>
  <a class="btn" href="/trades-admin?secret=$secret">Trades Admin</a>
</div>
<div class="card">
  <table><thead>
    <tr><th>Time</th><th>Type</th><th>Symbol</th><th>TF</th><th>Side</th><th>Trade ID</th><th>Raw</th></tr>
  </thead><tbody>
    $rows_html
  </tbody></table>
</div>
</body></html>
""")
# =========================
# main.py — SECTION 2/4
# DB utils, helpers, LLM confidence, Telegram (avec bouton), save/load, trades builder
# =========================

# ------- DB (persistent) -------
def resolve_db_path() -> None:
    """Try to create directory for DB_PATH; if permission denied, fallback to /tmp/ai_trader/data.db."""
    global DB_PATH
    d = os.path.dirname(DB_PATH) or "."
    try:
        os.makedirs(d, exist_ok=True)
        probe = os.path.join(d, ".write_test")
        with open(probe, "w", encoding="utf-8") as f:
            f.write("ok")
        os.remove(probe)
        log.info("DB dir OK: %s (using %s)", d, DB_PATH)
    except Exception as e:
        fallback_dir = "/tmp/ai_trader"
        os.makedirs(fallback_dir, exist_ok=True)
        DB_PATH = os.path.join(fallback_dir, "data.db")
        log.warning("DB dir '%s' not writable (%s). Falling back to %s", d, e, DB_PATH)
        resolve_db_path()

def db_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.execute("PRAGMA foreign_keys=ON;")
    except Exception:
        pass
    return conn

def db_init() -> None:
    with db_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                received_at INTEGER NOT NULL,
                type TEXT,
                symbol TEXT,
                tf TEXT,
                side TEXT,
                entry REAL,
                sl REAL,
                tp1 REAL,
                tp2 REAL,
                tp3 REAL,
                trade_id TEXT,
                raw_json TEXT
            )
            """
        )
        cur.execute("CREATE INDEX IF NOT EXISTS idx_events_trade ON events(trade_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_events_time ON events(received_at)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_events_symbol ON events(symbol)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_events_tf ON events(tf)")
        conn.commit()
    log.info("DB initialized at %s", DB_PATH)

resolve_db_path()
db_init()

# ------- Helpers -------
def _to_float(v):
    try:
        return float(v) if v is not None else None
    except Exception:
        return None

def escape_html(s: str) -> str:
    return (
        s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        .replace('"', "&quot;").replace("'", "&#39;")
    )

def fmt_num(v) -> str:
    try:
        if v is None:
            return ""
        s = f"{float(v):,.6f}".rstrip("0").rstrip(".")
        return s
    except Exception:
        return str(v or "")

def tf_label_of(payload: Dict[str, Any]) -> str:
    label = str(payload.get("tf_label") or payload.get("tf") or "?")
    try:
        if label.isdigit():
            n = int(label)
            if n < 60:
                return f"{n}m"
            if n % 60 == 0 and n < 1440:
                return f"{n//60}h"
            if n == 1440:
                return "1D"
    except Exception:
        pass
    return label

def pct(a: Optional[float], b: Optional[float]) -> Optional[float]:
    try:
        if a is None or b is None or b == 0:
            return None
        return (a - b) / b * 100.0
    except Exception:
        return None

def parse_leverage_x(leverage: Optional[str]) -> Optional[float]:
    if not leverage:
        return None
    try:
        s = leverage.lower().replace("x", " ").split()
        for token in s:
            if token.replace(".", "", 1).isdigit():
                return float(token)
    except Exception:
        return None
    return None

# ------- Save incoming event -------
def save_event(payload: Dict[str, Any]) -> None:
    row = {
        "received_at": int(time.time()),
        "type": payload.get("type"),
        "symbol": payload.get("symbol"),
        "tf": str(payload.get("tf")) if payload.get("tf") is not None else None,
        "side": payload.get("side"),
        "entry": _to_float(payload.get("entry")),
        "sl": _to_float(payload.get("sl")),
        "tp1": _to_float(payload.get("tp1")),
        "tp2": _to_float(payload.get("tp2")),
        "tp3": _to_float(payload.get("tp3")),
        "trade_id": payload.get("trade_id"),
        "raw_json": json.dumps(payload, ensure_ascii=False),
    }
    with db_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO events (received_at, type, symbol, tf, side, entry, sl, tp1, tp2, tp3, trade_id, raw_json)
            VALUES (:received_at, :type, :symbol, :tf, :side, :entry, :sl, :tp1, :tp2, :tp3, :trade_id, :raw_json)
            """,
            row,
        )
        conn.commit()
    log.info("Saved event: type=%s symbol=%s tf=%s trade_id=%s", row["type"], row["symbol"], row["tf"], row["trade_id"])

# ------- LLM confidence (facultatif) -------
def llm_confidence_for_entry(payload: Dict[str, Any]) -> Optional[Tuple[float, str]]:
    """Retourne (confidence_pct, rationale) ou None si LLM inactif/indispo."""
    if not (LLM_ENABLED and _openai_client):
        return None
    try:
        sym = str(payload.get("symbol") or "?")
        side = str(payload.get("side") or "?").upper()
        tf   = tf_label_of(payload)
        entry = _to_float(payload.get("entry"))
        sl    = _to_float(payload.get("sl"))
        tp1   = _to_float(payload.get("tp1"))
        tp2   = _to_float(payload.get("tp2"))
        tp3   = _to_float(payload.get("tp3"))

        sys_prompt = (
            "Tu es un assistant de trading. Donne une estimation de confiance entre 0 et 100 pour la probabilité "
            "que le trade atteigne au moins TP1 avant SL, basée uniquement sur les niveaux fournis (aucune donnée externe). "
            "Réponds STRICTEMENT en JSON: {\"confidence_pct\": <0-100>, \"rationale\": \"<raison courte>\"}."
        )
        user_prompt = (
            f"Trade: {sym} | TF={tf} | Side={side}\n"
            f"Entry={entry} | SL={sl} | TP1={tp1} | TP2={tp2} | TP3={tp3}\n"
            "Contraintes: pas d'accès marché. Utilise des heuristiques simples (distance SL/TP1, R:R, etc.)."
        )

        resp = _openai_client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=120,
            temperature=0.2,
        )
        content = (resp.choices[0].message.content or "").strip()

        import re as _re, json as _json
        m = _re.search(r"\{.*\}", content, _re.DOTALL)
        obj = _json.loads(m.group(0)) if m else _json.loads(content)

        conf = float(obj.get("confidence_pct"))
        rat  = str(obj.get("rationale") or "").strip()
        conf = max(0.0, min(100.0, conf))
        if len(rat) > 140:
            rat = rat[:137] + "..."
        return conf, rat
    except Exception as e:
        log.warning("LLM confidence failed: %s", e)
        return None

# ------- Telegram helpers (avec bouton inline vers /trades) -------
PUBLIC_TRADES_URL = os.getenv("PUBLIC_TRADES_URL", "https://tradingview-gd03.onrender.com/trades")

def _tg_inline_markup(url: str) -> str:
    """Retourne JSON (string) pour reply_markup inline keyboard avec un bouton 'Voir les trades'."""
    kb = {
        "inline_keyboard": [[{"text": "📊 Voir les trades", "url": url}]]
    }
    return json.dumps(kb, ensure_ascii=False)

def send_telegram(text: str, inline_url: Optional[str] = None) -> bool:
    """Envoie un message simple (option: bouton). Renvoie True si envoyé."""
    global _last_tg
    if not (TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID):
        return False
    try:
        now = time.time()
        if now - _last_tg < TELEGRAM_COOLDOWN_SECONDS:
            return False
        _last_tg = now
        import urllib.request, urllib.parse
        api_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        data = {
            "chat_id": TELEGRAM_CHAT_ID,
            "text": text
        }
        if inline_url:
            data["reply_markup"] = _tg_inline_markup(inline_url)
        elif PUBLIC_TRADES_URL:
            data["reply_markup"] = _tg_inline_markup(PUBLIC_TRADES_URL)
        payload = urllib.parse.urlencode(data).encode()
        req = urllib.request.Request(api_url, data=payload)
        with urllib.request.urlopen(req, timeout=10) as resp:
            _ = resp.read()
        return True
    except Exception as e:
        log.warning("Telegram send failed: %s", e)
        return False

def send_telegram_ex(text: str, pin: bool = False, inline_url: Optional[str] = None) -> Dict[str, Any]:
    """
    Envoie un message Telegram + option pin. Ajoute par défaut un bouton inline 'Voir les trades'.
    Retour: {"ok": bool, "message_id": int|None, "pinned": bool, "error": str|None}
    """
    result = {"ok": False, "message_id": None, "pinned": False, "error": None}
    if not (TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID):
        result["error"] = "Missing TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID"
        return result
    try:
        import urllib.request, urllib.parse, json as _json, time as _time
        global _last_tg
        now = _time.time()
        if now - _last_tg < TELEGRAM_COOLDOWN_SECONDS:
            result["ok"] = True
            result["error"] = "rate-limited (cooldown)"
            return result
        _last_tg = now

        api_base = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"

        # sendMessage
        send_url = f"{api_base}/sendMessage"
        data = {
            "chat_id": TELEGRAM_CHAT_ID,
            "text": text,
            "reply_markup": _tg_inline_markup(inline_url or PUBLIC_TRADES_URL)
        }
        payload = urllib.parse.urlencode(data).encode()
        req = urllib.request.Request(send_url, data=payload)
        with urllib.request.urlopen(req, timeout=10) as resp:
            raw = resp.read().decode("utf-8", "ignore")
            payload = _json.loads(raw)
            if not payload.get("ok"):
                result["error"] = f"sendMessage failed: {raw[:200]}"
                log.warning("Telegram sendMessage error: %s", result["error"])
                return result
            msg = payload.get("result") or {}
            mid = msg.get("message_id")
            result["ok"] = True
            result["message_id"] = mid

        # pinChatMessage
        if pin and result["message_id"] is not None:
            pin_url = f"{api_base}/pinChatMessage"
            pin_data = urllib.parse.urlencode({
                "chat_id": TELEGRAM_CHAT_ID,
                "message_id": result["message_id"],
            }).encode()
            preq = urllib.request.Request(pin_url, data=pin_data)
            try:
                with urllib.request.urlopen(preq, timeout=10) as presp:
                    praw = presp.read().decode("utf-8", "ignore")
                    pp = _json.loads(praw)
                    if pp.get("ok"):
                        result["pinned"] = True
                    else:
                        result["error"] = f"pinChatMessage failed: {praw[:200]}"
                        log.warning("Telegram pinChatMessage error: %s", result["error"])
            except Exception as e:
                result["error"] = f"pinChatMessage exception: {e}"
                log.warning("Telegram pin exception: %s", e)
        return result
    except Exception as e:
        result["error"] = f"send_telegram_ex exception: {e}"
        log.warning("Telegram send_telegram_ex exception: %s", e)
        return result

def telegram_rich_message(payload: Dict[str, Any]) -> Optional[str]:
    """
    Construit un message Telegram lisible pour les événements TradingView.
    Retourne None pour ignorer certains types (ex: AOE_*).
    """
    t = str(payload.get("type") or "EVENT").upper()
    if t in {"AOE_PREMIUM", "AOE_DISCOUNT"}:
        return None

    sym = str(payload.get("symbol") or "?")
    tf_lbl = tf_label_of(payload)
    side = str(payload.get("side") or "")
    entry = _to_float(payload.get("entry"))
    sl = _to_float(payload.get("sl"))
    tp = _to_float(payload.get("tp"))  # pour TP/SL hits 'tp' = niveau exécuté
    tp1 = _to_float(payload.get("tp1"))
    tp2 = _to_float(payload.get("tp2"))
    tp3 = _to_float(payload.get("tp3"))
    leverage = payload.get("leverage") or payload.get("lev") or payload.get("lev_reco")
    lev_x = parse_leverage_x(str(leverage) if leverage is not None else None)

    def num(v): return fmt_num(v) if v is not None else "—"

    if t == "ENTRY":
        lines = []
        lines.append(f"📩 {sym} {tf_lbl}")
        if side:
            lines.append(("📈 Long Entry:" if side.upper()=="LONG" else "📉 Short Entry:") + f" {num(entry)}")
        if leverage:
            lines.append(f"💡Leverage: {leverage}")
        if tp1: lines.append(f"🎯 TP1: {num(tp1)}")
        if tp2: lines.append(f"🎯 TP2: {num(tp2)}")
        if tp3: lines.append(f"🎯 TP3: {num(tp3)}")
        if sl:  lines.append(f"❌ SL: {num(sl)}")

        # 🔎 Confiance LLM (si activé et dispo)
        try:
            if LLM_ENABLED and _openai_client and (FORCE_LLM or True):
                res = llm_confidence_for_entry(payload)
                if res:
                    conf_pct, rationale = res
                    if conf_pct >= CONFIDENCE_MIN:
                        lines.append(f"🧠 Confiance LLM: {conf_pct:.0f}% — {rationale or 'estimation heuristique'}")
                    else:
                        lines.append(f"🧠 Confiance LLM: {conf_pct:.0f}%")
        except Exception as e:
            log.warning("LLM confidence render failed: %s", e)

        lines.append("🤖 Astuce: après TP1, placez SL au BE.")
        return "\n".join(lines)

    if t in {"TP1_HIT","TP2_HIT","TP3_HIT"}:
        label = {"TP1_HIT":"Target #1","TP2_HIT":"Target #2","TP3_HIT":"Target #3"}[t]
        spot_pct = pct(tp, entry) if (side and tp is not None and entry is not None) else None
        lev_pct = (spot_pct * lev_x) if (spot_pct is not None and lev_x) else None
        lines = []
        lines.append(f"✅ {label} — {sym} {tf_lbl}")
        if tp is not None:
            lines.append(f"Mark price : {num(tp)}")
        if spot_pct is not None:
            base = f"Profit (spot) : {spot_pct:.2f}%"
            if lev_pct is not None:
                base += f" | avec {int(lev_x)}x : {lev_pct:.2f}%"
            lines.append(base)
        return "\n".join(lines)

    if t == "SL_HIT":
        lines = [f"🟥 Stop-Loss — {sym} {tf_lbl}"]
        if tp is not None:
            lines.append(f"Exécuté : {num(tp)}")
        return "\n".join(lines)

    if t == "CLOSE":
        reason = payload.get("reason")
        lines = [f"🔔 Close — {sym} {tf_lbl}"]
        if reason:
            lines.append(f"Raison: {reason}")
        return "\n".join(lines)

    return f"[TV] {t} | {sym} | TF {tf_lbl}"

# ------- Build trades & stats -------
class TradeOutcome:
    NONE = "NONE"
    TP1 = "TP1_HIT"
    TP2 = "TP2_HIT"
    TP3 = "TP3_HIT"
    SL = "SL_HIT"
    CLOSE = "CLOSE"

def parse_date_to_epoch(date_str: Optional[str]) -> Optional[int]:
    if not date_str:
        return None
    try:
        import datetime as dt
        y, m, d = map(int, date_str.split("-"))
        dtobj = dt.datetime(y, m, d, 0, 0, 0)
        return int(dtobj.timestamp())
    except Exception:
        return None

def parse_date_end_to_epoch(date_str: Optional[str]) -> Optional[int]:
    if not date_str:
        return None
    try:
        import datetime as dt
        y, m, d = map(int, date_str.split("-"))
        dtobj = dt.datetime(y, m, d, 23, 59, 59)
        return int(dtobj.timestamp())
    except Exception:
        return None

def fetch_events_filtered(
    symbol: Optional[str],
    tf: Optional[str],
    start_ep: Optional[int],
    end_ep: Optional[int],
    limit: int = 10000
) -> List[sqlite3.Row]:
    sql = "SELECT * FROM events WHERE 1=1"
    args: List[Any] = []
    if symbol:
        sql += " AND symbol = ?"; args.append(symbol)
    if tf:
        sql += " AND tf = ?"; args.append(tf)
    if start_ep is not None:
        sql += " AND received_at >= ?"; args.append(start_ep)
    if end_ep is not None:
        sql += " AND received_at <= ?"; args.append(end_ep)
    sql += " ORDER BY received_at ASC"
    if limit:
        sql += " LIMIT ?"; args.append(limit)
    with db_conn() as conn:
        cur = conn.cursor()
        cur.execute(sql, tuple(args))
        return cur.fetchall()

def build_trades_filtered(
    symbol: Optional[str],
    tf: Optional[str],
    start_ep: Optional[int],
    end_ep: Optional[int],
    max_rows: int = 20000
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    rows = fetch_events_filtered(symbol, tf, start_ep, end_ep, max_rows)

    by_tid: Dict[str, List[sqlite3.Row]] = defaultdict(list)
    for r in rows:
        tid = r["trade_id"] or f"noid:{r['symbol']}:{r['received_at']}"
        by_tid[tid].append(r)

    trades: List[Dict[str, Any]] = []
    total = wins = losses = 0
    hit_tp1 = hit_tp2 = hit_tp3 = 0
    times_to_outcome: List[int] = []
    win_streak = loss_streak = 0
    best_win_streak = 0
    worst_loss_streak = 0

    for tid, items in by_tid.items():
        entry = None
        outcome_type = TradeOutcome.NONE
        outcome_time = None
        side = None
        vsymbol = None
        vtf = None
        e_entry = e_sl = e_tp1 = e_tp2 = e_tp3 = None
        entry_time = None

        for ev in items:
            etype = ev["type"]
            if etype == "ENTRY" and entry is None:
                entry = ev
                vsymbol = ev["symbol"]; vtf = ev["tf"]; side = ev["side"]
                e_entry = ev["entry"]; e_sl = ev["sl"]; e_tp1 = ev["tp1"]; e_tp2 = ev["tp2"]; e_tp3 = ev["tp3"]
                entry_time = ev["received_at"]
            elif entry is not None:
                if etype in ("TP3_HIT","TP2_HIT","TP1_HIT","SL_HIT","CLOSE") and outcome_type == TradeOutcome.NONE:
                    outcome_type = etype; outcome_time = ev["received_at"]

        if entry is not None:
            total += 1
            if outcome_time and entry_time:
                times_to_outcome.append(int(outcome_time - entry_time))
            is_win = outcome_type in (TradeOutcome.TP1, TradeOutcome.TP2, TradeOutcome.TP3)
            if is_win:
                wins += 1; win_streak += 1; best_win_streak = max(best_win_streak, win_streak); loss_streak = 0
                if outcome_type == TradeOutcome.TP1: hit_tp1 += 1
                elif outcome_type == TradeOutcome.TP2: hit_tp2 += 1
                elif outcome_type == TradeOutcome.TP3: hit_tp3 += 1
            elif outcome_type == TradeOutcome.SL:
                losses += 1; loss_streak += 1; worst_loss_streak = max(worst_loss_streak, loss_streak); win_streak = 0

            trades.append({
                "trade_id": tid,
                "symbol": vsymbol,
                "tf": vtf,
                "side": side,
                "entry": e_entry,
                "sl": e_sl,
                "tp1": e_tp1,
                "tp2": e_tp2,
                "tp3": e_tp3,
                "entry_time": entry_time,
                "outcome": outcome_type,
                "outcome_time": outcome_time,
                "duration_sec": (outcome_time - entry_time) if (outcome_time and entry_time) else None,
            })

    winrate = (wins / total * 100.0) if total else 0.0
    avg_sec = int(sum(times_to_outcome) / len(times_to_outcome)) if times_to_outcome else 0

    summary = {
        "total_trades": total,
        "wins": wins,
        "losses": losses,
        "winrate_pct": round(winrate, 2),
        "tp1_hits": hit_tp1,
        "tp2_hits": hit_tp2,
        "tp3_hits": hit_tp3,
        "avg_time_to_outcome_sec": avg_sec,
        "best_win_streak": best_win_streak,
        "worst_loss_streak": worst_loss_streak,
    }
    return trades, summary
# =========================
# main.py — SECTION 3/4
# Endpoints: events, trades public (HTML), trades JSON
# =========================

# ------- Templates pour /trades public -------
TRADES_PUBLIC_HTML_TPL = Template(r"""<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>📊 Trades Dashboard</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; background: #0d1117; color: #e6edf3; }
    h1 { background: #161b22; padding: 20px; margin: 0; color: #58a6ff; text-align:center; }
    .summary { background:#161b22; padding: 10px; margin:0; display:flex; flex-wrap:wrap; justify-content:center; }
    .summary div { margin:8px; padding:12px; border-radius:8px; background:#21262d; box-shadow:0 2px 4px rgba(0,0,0,0.4); }
    table { width: 100%; border-collapse: collapse; margin-top:20px; }
    th, td { padding: 8px 12px; border-bottom: 1px solid #30363d; text-align:center; }
    th { background:#161b22; }
    tr:nth-child(even) { background:#21262d; }
    .win { color:#3fb950; font-weight:bold; }
    .loss { color:#f85149; font-weight:bold; }
    .neutral { color:#8b949e; }
    .footer { margin-top:20px; padding:15px; text-align:center; font-size:0.85em; color:#8b949e; }
  </style>
</head>
<body>
  <h1>📊 Trades Dashboard</h1>
  <div class="summary">
    <div><b>Total trades:</b> $total_trades</div>
    <div><b>Winrate:</b> $winrate_pct%</div>
    <div><b>Wins:</b> $wins</div>
    <div><b>Losses:</b> $losses</div>
    <div><b>TP1 hits:</b> $tp1_hits</div>
    <div><b>TP2 hits:</b> $tp2_hits</div>
    <div><b>TP3 hits:</b> $tp3_hits</div>
    <div><b>Best streak:</b> $best_win_streak</div>
    <div><b>Worst streak:</b> $worst_loss_streak</div>
    <div><b>Avg. duration:</b> $avg_time_to_outcome_sec sec</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Trade ID</th>
        <th>Symbol</th>
        <th>TF</th>
        <th>Side</th>
        <th>Entry</th>
        <th>SL</th>
        <th>TP1</th>
        <th>TP2</th>
        <th>TP3</th>
        <th>Outcome</th>
        <th>Durée (s)</th>
      </tr>
    </thead>
    <tbody>
      $rows
    </tbody>
  </table>
  <div class="footer">⚡ Powered by JohnB AI Trader Pro</div>
</body>
</html>
""")

# ------- Endpoint: events JSON -------
@app.get("/events", response_class=JSONResponse)
def events_api(limit: int = Query(200, ge=1, le=10000)):
    with db_conn() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM events ORDER BY received_at DESC LIMIT ?", (limit,))
        rows = [dict(r) for r in cur.fetchall()]
    return rows

# ------- Endpoint: trades public HTML -------
@app.get("/trades", response_class=HTMLResponse)
def trades_public(
    symbol: Optional[str] = Query(None),
    tf: Optional[str] = Query(None),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    limit: int = Query(2000, ge=1, le=20000)
):
    start_ep = parse_date_to_epoch(start)
    end_ep = parse_date_end_to_epoch(end)
    trades, summary = build_trades_filtered(symbol, tf, start_ep, end_ep, max_rows=limit)

    def render_row(t):
        outcome = t["outcome"]
        cls = "neutral"
        if outcome in ("TP1_HIT","TP2_HIT","TP3_HIT"): cls="win"
        elif outcome=="SL_HIT": cls="loss"
        return (
            f"<tr>"
            f"<td>{escape_html(str(t['trade_id']))}</td>"
            f"<td>{escape_html(str(t['symbol']))}</td>"
            f"<td>{escape_html(str(t['tf']))}</td>"
            f"<td>{escape_html(str(t['side']))}</td>"
            f"<td>{fmt_num(t['entry'])}</td>"
            f"<td>{fmt_num(t['sl'])}</td>"
            f"<td>{fmt_num(t['tp1'])}</td>"
            f"<td>{fmt_num(t['tp2'])}</td>"
            f"<td>{fmt_num(t['tp3'])}</td>"
            f"<td class='{cls}'>{escape_html(str(outcome))}</td>"
            f"<td>{t['duration_sec'] or ''}</td>"
            f"</tr>"
        )

    rows_html = "\n".join(render_row(t) for t in trades[-500:][::-1])  # max 500 lignes
    html = TRADES_PUBLIC_HTML_TPL.safe_substitute(rows=rows_html, **summary)
    return HTMLResponse(content=html)

# ------- Endpoint: trades JSON (API) -------
@app.get("/trades.json", response_class=JSONResponse)
def trades_json(
    symbol: Optional[str] = Query(None),
    tf: Optional[str] = Query(None),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    limit: int = Query(2000, ge=1, le=20000)
):
    start_ep = parse_date_to_epoch(start)
    end_ep = parse_date_end_to_epoch(end)
    trades, summary = build_trades_filtered(symbol, tf, start_ep, end_ep, max_rows=limit)
    return {"summary": summary, "trades": trades}
# =========================
# main.py — SECTION 4/4
# Altseason endpoints, TV webhook (avec bouton Telegram vers /trades), daemon, main
# =========================

# --- Const pour le bouton Telegram vers /trades ---
TRADES_PUBLIC_URL = "https://tradingview-gd03.onrender.com/trades"

# --- Fallback: si telegram_rich_message n'a pas été défini dans les sections précédentes ---
if "telegram_rich_message" not in globals():
    def telegram_rich_message(payload: Dict[str, Any]) -> Optional[str]:
        t = str(payload.get("type") or "EVENT").upper()
        if t in {"AOE_PREMIUM", "AOE_DISCOUNT"}:
            return None
        sym = str(payload.get("symbol") or "?")
        tf_lbl = tf_label_of(payload)
        side = str(payload.get("side") or "")
        entry = _to_float(payload.get("entry"))
        sl = _to_float(payload.get("sl"))
        tp = _to_float(payload.get("tp"))
        tp1 = _to_float(payload.get("tp1")); tp2 = _to_float(payload.get("tp2")); tp3 = _to_float(payload.get("tp3"))
        def num(v): return fmt_num(v) if v is not None else "—"
        if t == "ENTRY":
            lines = [f"📩 {sym} {tf_lbl}",
                     ("📈 Long Entry:" if side.upper()=="LONG" else "📉 Short Entry:") + f" {num(entry)}" if side else None,
                     f"🎯 TP1: {num(tp1)}" if tp1 else None,
                     f"🎯 TP2: {num(tp2)}" if tp2 else None,
                     f"🎯 TP3: {num(tp3)}" if tp3 else None,
                     f"❌ SL: {num(sl)}"  if sl  else None,
                     "🤖 Astuce: après TP1, placez SL au BE."]
            return "\n".join([ln for ln in lines if ln])
        if t in {"TP1_HIT","TP2_HIT","TP3_HIT"}:
            label = {"TP1_HIT":"Target #1","TP2_HIT":"Target #2","TP3_HIT":"Target #3"}[t]
            lines = [f"✅ {label} — {sym} {tf_lbl}", f"Mark price : {num(tp)}" if tp is not None else None]
            return "\n".join([ln for ln in lines if ln])
        if t == "SL_HIT":
            return f"🟥 Stop-Loss — {sym} {tf_lbl}\n" + (f"Exécuté : {num(tp)}" if tp is not None else "")
        if t == "CLOSE":
            reason = payload.get("reason")
            return f"🔔 Close — {sym} {tf_lbl}" + (f"\nRaison: {reason}" if reason else "")
        return f"[TV] {t} | {sym} | TF {tf_lbl}"

# --- Helper: envoi Telegram avec bouton inline vers /trades ---
def send_telegram_with_button(text: str, url: str, label: str = "📊 Voir les trades") -> bool:
    global _last_tg
    if not (TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID):
        return False
    try:
        now = time.time()
        if now - _last_tg < TELEGRAM_COOLDOWN_SECONDS:
            return False
        _last_tg = now

        import urllib.request, urllib.parse, json as _json
        api_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"

        payload = {
            "chat_id": TELEGRAM_CHAT_ID,
            "text": text,
            "reply_markup": _json.dumps({
                "inline_keyboard": [[{"text": label, "url": url}]]
            })
        }
        data = urllib.parse.urlencode(payload).encode()
        req = urllib.request.Request(api_url, data=data)
        with urllib.request.urlopen(req, timeout=10) as resp:
            raw = resp.read().decode("utf-8", "ignore")
            js = _json.loads(raw)
            return bool(js.get("ok"))
    except Exception as e:
        log.warning("send_telegram_with_button failed: %s", e)
        return False

# -------------------------
# ALTSEASON endpoints (reposent sur les helpers définis plus haut)
# -------------------------
@app.get("/altseason/check")
def altseason_check_public():
    snap = _altseason_snapshot(force=False)
    return _altseason_summary(snap)

@app.api_route("/altseason/notify", methods=["GET", "POST"])
async def altseason_notify(
    request: Request,
    secret: Optional[str] = Query(None),
    force: Optional[bool] = Query(False),
    message: Optional[str] = Query(None),
    pin: Optional[bool] = Query(False)
):
    body = {}
    if request.method == "POST":
        try:
            body = await request.json()
        except Exception:
            body = {}
    body_secret = body.get("secret") if isinstance(body, dict) else None
    if WEBHOOK_SECRET and (secret != WEBHOOK_SECRET and body_secret != WEBHOOK_SECRET):
        raise HTTPException(status_code=401, detail="Invalid secret")

    if request.method == "POST":
        force = bool(body.get("force", force))
        message = body.get("message", message)
        pin = bool(body.get("pin", pin))
    pin = bool(pin or TELEGRAM_PIN_ALTSEASON)

    s = _altseason_summary(_altseason_snapshot(force=bool(force)))
    sent = None
    pin_res = None
    if s["ALTSEASON_ON"] or force:
        if message:
            msg = message
        else:
            if s["ALTSEASON_ON"]:
                msg = f"[ALERTE ALTSEASON] {s['asof']} — Greens={s['greens']} — ALTSEASON DÉBUTÉ !"
            else:
                msg = f"[ALERTE ALTSEASON] {s['asof']} — Greens={s['greens']} — EN VEILLE (conditions insuffisantes)"
        # On envoie **sans** bouton (alertes altseason)
        res = send_telegram_ex(msg, pin=pin)
        sent = res.get("ok")
        pin_res = {"pinned": res.get("pinned"), "message_id": res.get("message_id"), "error": res.get("error")}
        log.info("Altseason notify: sent=%s pinned=%s err=%s", sent, pin_res.get("pinned"), pin_res.get("error"))
    return {"summary": s, "telegram_sent": sent, "pin_result": pin_res}

@app.get("/altseason/streaks")
def altseason_streaks():
    st = _load_state()
    s = _altseason_summary(_altseason_snapshot(force=False))
    _update_daily_streaks(st, s)
    _save_state(st)
    return {
        "asof": s.get("asof"),
        "greens": s.get("greens"),
        "ALT3_ON": bool(int(s.get("greens") or 0) >= 3),
        "ALT4_ON": bool(int(s.get("greens") or 0) >= 4),
        "consec_3of4_days": int(st.get("consec_3of4_days") or 0),
        "consec_4of4_days": int(st.get("consec_4of4_days") or 0),
    }

@app.get("/altseason/daemon-status")
def altseason_daemon_status():
    st = _load_state()
    return {
        "autonotify_enabled": ALTSEASON_AUTONOTIFY,
        "poll_seconds": ALTSEASON_POLL_SECONDS,
        "notify_min_gap_min": ALTSEASON_NOTIFY_MIN_GAP_MIN,
        "greens_required": ALT_GREENS_REQUIRED,
        "state": st
    }

# -------------------------
# Webhook TradingView (PROTÉGÉ) — avec bouton vers /trades
# -------------------------
@app.post("/tv-webhook")
async def tv_webhook(request: Request, secret: Optional[str] = Query(None)):
    try:
        payload = await request.json()
        if not isinstance(payload, dict):
            raise ValueError("JSON must be an object")
    except Exception as e:
        log.error("Invalid JSON: %s", e)
        raise HTTPException(status_code=400, detail="Invalid JSON")

    body_secret = payload.get("secret")
    if WEBHOOK_SECRET and (secret != WEBHOOK_SECRET and body_secret != WEBHOOK_SECRET):
        raise HTTPException(status_code=401, detail="Invalid secret")

    log.info("Webhook payload: %s", json.dumps(payload)[:300])
    save_event(payload)

    # Message enrichi + bouton
    try:
        msg = telegram_rich_message(payload)
        if msg:
            # ajoute un CTA discret vers /trades
            sent = send_telegram_with_button(msg, TRADES_PUBLIC_URL, label="📊 Ouvrir le dashboard")
            if not sent:
                # fallback simple sans bouton
                res = send_telegram_ex(msg, pin=False)
                log.info("TV webhook -> telegram (fallback) sent=%s pinned=%s err=%s",
                         res.get("ok"), res.get("pinned"), res.get("error"))
    except Exception as e:
        log.warning("TV webhook telegram send error: %s", e)

    return {"ok": True}

# -------------------------
# Altseason Daemon (auto-notify)
# -------------------------
_daemon_stop = threading.Event()
_daemon_thread: Optional[threading.Thread] = None

@app.on_event("startup")
def _start_daemon():
    global _daemon_thread
    if ALTSEASON_AUTONOTIFY and _daemon_thread is None:
        _daemon_stop.clear()
        _daemon_thread = threading.Thread(target=_daemon_loop, daemon=True)
        _daemon_thread.start()

@app.on_event("shutdown")
def _stop_daemon():
    if _daemon_thread is not None:
        _daemon_stop.set()

def _daemon_loop():
    state = _load_state()
    log.info(
        "Altseason daemon started (autonotify=%s, poll=%ss, min_gap=%smin, greens_required=%s)",
        ALTSEASON_AUTONOTIFY, ALTSEASON_POLL_SECONDS, ALTSEASON_NOTIFY_MIN_GAP_MIN, ALT_GREENS_REQUIRED
    )
    while not _daemon_stop.wait(ALTSEASON_POLL_SECONDS):
        try:
            state["last_tick_ts"] = int(time.time())
            s = _altseason_summary(_altseason_snapshot(force=False))
            now = time.time()
            need_send = False

            _update_daily_streaks(state, s)

            if s["ALTSEASON_ON"] and not state.get("last_on", False):  # OFF -> ON
                need_send = True
            elif s["ALTSEASON_ON"]:
                min_gap = ALTSEASON_NOTIFY_MIN_GAP_MIN * 60
                if now - state.get("last_sent_ts", 0) >= min_gap:
                    need_send = True

            if need_send:
                msg = f"[ALERTE ALTSEASON] {s['asof']} — Greens={s['greens']} — ALTSEASON DÉBUTÉ !"
                res = send_telegram_ex(msg, pin=TELEGRAM_PIN_ALTSEASON)
                log.info("Altseason auto-notify: sent=%s pinned=%s err=%s", res.get("ok"), res.get("pinned"), res.get("error"))
                if res.get("ok"):
                    state["last_sent_ts"] = int(now)

            state["last_on"] = bool(s["ALTSEASON_ON"])
            _save_state(state)
        except Exception as e:
            log.warning("Altseason daemon tick error: %s", e)

# -------------------------
# Run local
# -------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
