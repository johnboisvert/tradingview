#!/usr/bin/env python3
"""
site_audit.py — Audit automatique des routes FastAPI.

Objectif:
- "Faire le tour du site" et vérifier que toutes les routes répondent.
- Génère un rapport JSON + Markdown.

Modes:
1) In-process (par défaut) :
   - Import le module FastAPI (ex: main.py) et utilise TestClient.
   - Idéal pour tester exactement le code qui tourne sur Railway.

2) Live (option --live + --base-url) :
   - Frappe un site déjà déployé via HTTP.

Usage (local / Railway):
  python site_audit.py --module main

Usage (live):
  python site_audit.py --live --base-url https://ton-site.up.railway.app

Options env utiles:
  ADMIN_USER=admin
  ADMIN_PASS=xxxxx
  ADMIN_BYPASS=1   (si tu veux bypass admin total côté serveur)
"""
from __future__ import annotations

import argparse
import importlib
import json
import os
import re
import sys
import time
from dataclasses import dataclass, asdict
from typing import Any, Dict, List, Optional, Tuple

def _now_iso() -> str:
    import datetime as _dt
    return _dt.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"

def _safe_snippet(text: str, n: int = 500) -> str:
    text = text or ""
    text = re.sub(r"\s+", " ", text).strip()
    return text[:n]

def _default_value_for_param(name: str) -> str:
    n = (name or "").lower()
    if "symbol" in n:
        return "BTCUSDT"
    if "ticker" in n:
        return "BTC"
    if "timeframe" in n or "tf" == n:
        return "1h"
    if "exchange" in n:
        return "binance"
    if "limit" in n or "count" in n:
        return "5"
    if "page" in n:
        return "1"
    if "q" == n or "query" in n or "search" in n:
        return "test"
    return "test"

@dataclass
class RouteResult:
    path: str
    method: str
    status: int
    ok: bool
    elapsed_ms: int
    category: str
    detail: str = ""
    final_url: str = ""

def _categorize(status: int) -> str:
    if 200 <= status < 300:
        return "OK"
    if status in (301,302,303,307,308):
        return "REDIRECT"
    if status in (401,403):
        return "AUTH"
    if status in (404,405):
        return "MISSING"
    if status in (422,400):
        return "BAD_REQUEST"
    if 500 <= status < 600:
        return "SERVER_ERROR"
    return "OTHER"

def _write_reports(results: List[RouteResult], out_prefix: str = "audit_report") -> Tuple[str,str]:
    jpath = f"{out_prefix}.json"
    mpath = f"{out_prefix}.md"
    payload = {
        "generated_at": _now_iso(),
        "total": len(results),
        "summary": {},
        "results": [asdict(r) for r in results],
    }
    # summary
    summary: Dict[str,int] = {}
    for r in results:
        summary[r.category] = summary.get(r.category, 0) + 1
    payload["summary"] = summary

    with open(jpath, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    # markdown
    lines = []
    lines.append(f"# Audit routes — {payload['generated_at']}")
    lines.append("")
    lines.append("## Résumé")
    for k in sorted(summary.keys()):
        lines.append(f"- **{k}**: {summary[k]}")
    lines.append("")
    lines.append("## Détails (top erreurs)")
    # show worst first
    worst = [r for r in results if not r.ok]
    worst.sort(key=lambda r: (r.category, -r.status, r.path))
    for r in worst[:80]:
        lines.append(f"- `{r.method} {r.path}` → **{r.status}** ({r.category}) — {r.detail}")
    lines.append("")
    lines.append("## Toutes les routes")
    lines.append("| Méthode | Route | Status | Catégorie | ms | Détail |")
    lines.append("|---|---|---:|---|---:|---|")
    for r in sorted(results, key=lambda x: (x.category, x.path, x.method)):
        detail = (r.detail or "").replace("|", "\\|")
        lines.append(f"| {r.method} | `{r.path}` | {r.status} | {r.category} | {r.elapsed_ms} | {detail} |")

    with open(mpath, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    return jpath, mpath

def _login_live(session, base_url: str) -> None:
    # Essaye de se loguer si creds fournis
    user = os.getenv("ADMIN_USER", "").strip()
    pw = os.getenv("ADMIN_PASS", "").strip()
    if not user or not pw:
        return
    try:
        # On tente POST /login (form)
        resp = session.post(f"{base_url}/login", data={"username": user, "password": pw}, allow_redirects=True, timeout=30)
        # Si redirection ou 200, on considère ok.
        _ = resp.status_code
    except Exception:
        pass

def audit_live(base_url: str) -> List[RouteResult]:
    import requests
    session = requests.Session()
    base_url = base_url.rstrip("/")
    _login_live(session, base_url)

    # Récupère l'OpenAPI si dispo
    routes: List[Tuple[str,str,Dict[str,str]]] = []
    try:
        spec = session.get(f"{base_url}/openapi.json", timeout=30).json()
        for path, methods in spec.get("paths", {}).items():
            for method, meta in methods.items():
                if method.lower() != "get":
                    continue
                # skip templated paths
                if "{" in path and "}" in path:
                    continue
                params = {}
                for p in meta.get("parameters", []) or []:
                    if p.get("in") == "query" and p.get("required"):
                        params[p.get("name","")] = _default_value_for_param(p.get("name",""))
                routes.append((path, method.upper(), params))
    except Exception:
        # fallback minimal (page list)
        fallback = [
            "/", "/admin-dashboard", "/ai-market-regime", "/ai-whale-watcher", "/ai-token-scanner",
            "/ai-sizer", "/ai-exit", "/ai-timeframe", "/ai-liquidity", "/ai-setup-builder",
            "/ai-gem-hunter", "/ai-technical-analysis", "/narrative-radar", "/ai-crypto-coach",
            "/ai-swarm-agents",
        ]
        routes = [(p, "GET", {}) for p in fallback]

    results: List[RouteResult] = []
    for path, method, params in routes:
        url = f"{base_url}{path}"
        t0 = time.time()
        try:
            resp = session.get(url, params=params, allow_redirects=True, timeout=45)
            elapsed = int((time.time()-t0)*1000)
            cat = _categorize(resp.status_code)
            ok = (200 <= resp.status_code < 300) or (cat == "REDIRECT")
            detail = ""
            if not ok:
                detail = _safe_snippet(resp.text)
            results.append(RouteResult(path=path, method=method, status=resp.status_code, ok=ok, elapsed_ms=elapsed, category=cat, detail=detail, final_url=str(resp.url)))
        except Exception as e:
            elapsed = int((time.time()-t0)*1000)
            results.append(RouteResult(path=path, method=method, status=0, ok=False, elapsed_ms=elapsed, category="EXCEPTION", detail=str(e), final_url=url))
    return results

def audit_inprocess(module_name: str) -> List[RouteResult]:
    # Import du module; doit exposer `app`
    mod = importlib.import_module(module_name)
    app = getattr(mod, "app", None)
    if app is None:
        raise SystemExit(f"Module '{module_name}' ne contient pas 'app' (FastAPI).")

    from fastapi.testclient import TestClient

    # construit OpenAPI pour avoir paramètres requis
    spec = app.openapi()
    routes: List[Tuple[str,str,Dict[str,str]]] = []
    for path, methods in spec.get("paths", {}).items():
        for method, meta in methods.items():
            if method.lower() != "get":
                continue
            if "{" in path and "}" in path:
                continue
            params = {}
            for p in meta.get("parameters", []) or []:
                if p.get("in") == "query" and p.get("required"):
                    params[p.get("name","")] = _default_value_for_param(p.get("name",""))
            routes.append((path, method.upper(), params))

    # Tri stable
    routes.sort(key=lambda x: x[0])

    client = TestClient(app, raise_server_exceptions=False)

    # tentative login (si route existe)
    user = os.getenv("ADMIN_USER", "admin").strip()
    pw = os.getenv("ADMIN_PASS", "").strip()
    if pw:
        try:
            client.post("/login", data={"username": user, "password": pw}, follow_redirects=True)
        except Exception:
            pass

    results: List[RouteResult] = []
    for path, method, params in routes:
        t0 = time.time()
        try:
            resp = client.get(path, params=params, follow_redirects=True)
            elapsed = int((time.time()-t0)*1000)
            cat = _categorize(resp.status_code)
            ok = (200 <= resp.status_code < 300) or (cat == "REDIRECT")
            detail = ""
            if not ok:
                # include a tiny snippet; in-process, some errors may be blank
                detail = _safe_snippet(getattr(resp, "text", "") or "")
            results.append(RouteResult(path=path, method=method, status=resp.status_code, ok=ok, elapsed_ms=elapsed, category=cat, detail=detail))
        except Exception as e:
            elapsed = int((time.time()-t0)*1000)
            results.append(RouteResult(path=path, method=method, status=0, ok=False, elapsed_ms=elapsed, category="EXCEPTION", detail=str(e)))
    return results

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--module", default="main", help="Nom du module Python (sans .py), ex: main")
    ap.add_argument("--live", action="store_true", help="Audit via HTTP sur un site déployé")
    ap.add_argument("--base-url", default="", help="Base URL si --live (ex: https://xxx.up.railway.app)")
    ap.add_argument("--out", default="audit_report", help="Préfixe de sortie des rapports")
    args = ap.parse_args()

    if args.live:
        if not args.base_url:
            raise SystemExit("--base-url est requis en mode --live")
        results = audit_live(args.base_url)
    else:
        results = audit_inprocess(args.module)

    jpath, mpath = _write_reports(results, out_prefix=args.out)

    # Console summary
    summary = {}
    for r in results:
        summary[r.category] = summary.get(r.category, 0) + 1
    print("=== AUDIT SUMMARY ===")
    for k in sorted(summary.keys()):
        print(f"{k}: {summary[k]}")
    print("")
    print(f"JSON: {os.path.abspath(jpath)}")
    print(f"MD  : {os.path.abspath(mpath)}")

    # exit code: fail if server errors exist
    if summary.get("SERVER_ERROR", 0) or summary.get("EXCEPTION", 0):
        sys.exit(2)
    sys.exit(0)

if __name__ == "__main__":
    main()
