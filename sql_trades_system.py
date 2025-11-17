# -*- coding: utf-8 -*-
"""Support PostgreSQL + SQLite"""
import json, os
from datetime import datetime
from typing import List, Dict, Optional

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    POSTGRES_AVAILABLE = True
except:
    POSTGRES_AVAILABLE = False

import sqlite3

def get_db_config():
    database_url = os.getenv("DATABASE_URL")
    if database_url and POSTGRES_AVAILABLE:
        print("✅ PostgreSQL (Railway)")
        return {"type": "postgres", "url": database_url}
    print("⚠️ SQLite fallback")
    return {"type": "sqlite", "path": "/tmp/trades.db" if os.path.exists("/tmp") else "./trades.db"}

DB_CONFIG = get_db_config()

def get_connection():
    if DB_CONFIG["type"] == "postgres":
        return psycopg2.connect(DB_CONFIG["url"])
    return sqlite3.connect(DB_CONFIG["path"], timeout=30.0)

def init_trades_db():
    try:
        conn = get_connection()
        c = conn.cursor()
        if DB_CONFIG["type"] == "postgres":
            c.execute("""CREATE TABLE IF NOT EXISTS trades (
                id SERIAL PRIMARY KEY, symbol TEXT NOT NULL, side TEXT NOT NULL,
                entry REAL NOT NULL, current_price REAL, sl REAL, tp1 REAL, tp2 REAL, tp3 REAL,
                timestamp TEXT NOT NULL, status TEXT DEFAULT 'open', confidence REAL,
                leverage INTEGER, timeframe TEXT, tp1_hit BOOLEAN DEFAULT FALSE,
                tp2_hit BOOLEAN DEFAULT FALSE, tp3_hit BOOLEAN DEFAULT FALSE,
                sl_hit BOOLEAN DEFAULT FALSE, pnl REAL DEFAULT 0.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""")
        else:
            c.execute("""CREATE TABLE IF NOT EXISTS trades (
                id INTEGER PRIMARY KEY AUTOINCREMENT, symbol TEXT NOT NULL, side TEXT NOT NULL,
                entry REAL NOT NULL, current_price REAL, sl REAL, tp1 REAL, tp2 REAL, tp3 REAL,
                timestamp TEXT NOT NULL, status TEXT DEFAULT 'open', confidence REAL,
                leverage INTEGER, timeframe TEXT, tp1_hit INTEGER DEFAULT 0,
                tp2_hit INTEGER DEFAULT 0, tp3_hit INTEGER DEFAULT 0,
                sl_hit INTEGER DEFAULT 0, pnl REAL DEFAULT 0.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""")
        conn.commit()
        conn.close()
        print(f"✅ Table trades OK ({DB_CONFIG['type']})")
        return True
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

def create_trade(d):
    try:
        conn = get_connection()
        c = conn.cursor()
        if DB_CONFIG["type"] == "postgres":
            c.execute("""INSERT INTO trades (symbol,side,entry,current_price,sl,tp1,tp2,tp3,
                timestamp,status,confidence,leverage,timeframe,tp1_hit,tp2_hit,tp3_hit,sl_hit,pnl)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
                (d.get('symbol',''),d.get('side',''),d.get('entry',0),d.get('current_price'),
                d.get('sl'),d.get('tp1'),d.get('tp2'),d.get('tp3'),
                d.get('timestamp',datetime.now().isoformat()),d.get('status','open'),
                d.get('confidence'),d.get('leverage'),d.get('timeframe'),
                bool(d.get('tp1_hit')),bool(d.get('tp2_hit')),bool(d.get('tp3_hit')),
                bool(d.get('sl_hit')),d.get('pnl',0.0)))
            trade_id = c.fetchone()[0]
        else:
            c.execute("""INSERT INTO trades (symbol,side,entry,current_price,sl,tp1,tp2,tp3,
                timestamp,status,confidence,leverage,timeframe,tp1_hit,tp2_hit,tp3_hit,sl_hit,pnl)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (d.get('symbol',''),d.get('side',''),d.get('entry',0),d.get('current_price'),
                d.get('sl'),d.get('tp1'),d.get('tp2'),d.get('tp3'),
                d.get('timestamp',datetime.now().isoformat()),d.get('status','open'),
                d.get('confidence'),d.get('leverage'),d.get('timeframe'),
                1 if d.get('tp1_hit') else 0,1 if d.get('tp2_hit') else 0,
                1 if d.get('tp3_hit') else 0,1 if d.get('sl_hit') else 0,d.get('pnl',0.0)))
            trade_id = c.lastrowid
        conn.commit()
        conn.close()
        return trade_id
    except Exception as e:
        print(f"❌ create_trade: {e}")
        return None

def get_all_trades(limit=None, order_by="timestamp DESC"):
    try:
        conn = get_connection()
        if DB_CONFIG["type"] == "postgres":
            c = conn.cursor(cursor_factory=RealDictCursor)
        else:
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
        q = f"SELECT * FROM trades ORDER BY {order_by}"
        if limit: q += f" LIMIT {limit}"
        c.execute(q)
        rows = c.fetchall()
        conn.close()
        trades = []
        for row in rows:
            t = dict(row)
            if DB_CONFIG["type"] == "sqlite":
                t['tp1_hit']=bool(t['tp1_hit'])
                t['tp2_hit']=bool(t['tp2_hit'])
                t['tp3_hit']=bool(t['tp3_hit'])
                t['sl_hit']=bool(t['sl_hit'])
            trades.append(t)
        return trades
    except Exception as e:
        print(f"❌ get_all: {e}")
        return []

def get_open_trades():
    try:
        conn = get_connection()
        if DB_CONFIG["type"] == "postgres":
            c = conn.cursor(cursor_factory=RealDictCursor)
        else:
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
        c.execute("SELECT * FROM trades WHERE status='open' ORDER BY timestamp DESC")
        rows = c.fetchall()
        conn.close()
        trades = []
        for row in rows:
            t = dict(row)
            if DB_CONFIG["type"] == "sqlite":
                t['tp1_hit']=bool(t['tp1_hit'])
                t['tp2_hit']=bool(t['tp2_hit'])
                t['tp3_hit']=bool(t['tp3_hit'])
                t['sl_hit']=bool(t['sl_hit'])
            trades.append(t)
        return trades
    except Exception as e:
        print(f"❌ get_open: {e}")
        return []

def update_trade(tid, updates):
    try:
        conn = get_connection()
        c = conn.cursor()
        set_c, vals = [], []
        for k, v in updates.items():
            if DB_CONFIG["type"] == "sqlite" and k in ['tp1_hit','tp2_hit','tp3_hit','sl_hit']:
                v = 1 if v else 0
            set_c.append(f"{k}={'%s' if DB_CONFIG['type']=='postgres' else '?'}")
            vals.append(v)
        set_c.append("updated_at=CURRENT_TIMESTAMP")
        vals.append(tid)
        q = f"UPDATE trades SET {','.join(set_c)} WHERE id={'%s' if DB_CONFIG['type']=='postgres' else '?'}"
        c.execute(q, vals)
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ update: {e}")
        return False

def mark_tp_hit(tid, lvl):
    return update_trade(tid, {f"tp{lvl}_hit": True})

def mark_sl_hit(tid):
    return update_trade(tid, {"sl_hit": True, "status": "closed"})

def get_trade_stats():
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT COUNT(*) FROM trades")
        total = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM trades WHERE status='open'")
        open_t = c.fetchone()[0]
        if DB_CONFIG["type"] == "postgres":
            c.execute("SELECT COUNT(*) FROM trades WHERE tp1_hit=TRUE OR tp2_hit=TRUE OR tp3_hit=TRUE")
            wins = c.fetchone()[0]
            c.execute("SELECT COUNT(*) FROM trades WHERE sl_hit=TRUE AND tp1_hit=FALSE AND tp2_hit=FALSE AND tp3_hit=FALSE")
            losses = c.fetchone()[0]
        else:
            c.execute("SELECT COUNT(*) FROM trades WHERE tp1_hit=1 OR tp2_hit=1 OR tp3_hit=1")
            wins = c.fetchone()[0]
            c.execute("SELECT COUNT(*) FROM trades WHERE sl_hit=1 AND tp1_hit=0 AND tp2_hit=0 AND tp3_hit=0")
            losses = c.fetchone()[0]
        c.execute("SELECT SUM(pnl) FROM trades")
        pnl = c.fetchone()[0] or 0.0
        conn.close()
        closed = wins + losses
        wr = (wins / closed * 100) if closed > 0 else 0
        return {"total":total,"open":open_t,"closed":closed,"wins":wins,"losses":losses,"win_rate":round(wr,2),"total_pnl":round(pnl,2)}
    except Exception as e:
        print(f"❌ stats: {e}")
        return {"total":0,"open":0,"closed":0,"wins":0,"losses":0,"win_rate":0,"total_pnl":0}

def migrate_from_json(path):
    if not os.path.exists(path): return 0
    try:
        with open(path,'r') as f: trades = json.load(f)
        if not trades: return 0
        conn = get_connection()
        c = conn.cursor()
        m = 0
        for t in trades:
            try:
                if DB_CONFIG["type"]=="postgres":
                    c.execute("SELECT COUNT(*) FROM trades WHERE symbol=%s AND timestamp=%s AND entry=%s",(t.get('symbol'),t.get('timestamp'),t.get('entry')))
                else:
                    c.execute("SELECT COUNT(*) FROM trades WHERE symbol=? AND timestamp=? AND entry=?",(t.get('symbol'),t.get('timestamp'),t.get('entry')))
                if c.fetchone()[0]>0: continue
                if DB_CONFIG["type"]=="postgres":
                    c.execute("INSERT INTO trades (symbol,side,entry,current_price,sl,tp1,tp2,tp3,timestamp,status,confidence,leverage,timeframe,tp1_hit,tp2_hit,tp3_hit,sl_hit,pnl) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                        (t.get('symbol',''),t.get('side',''),t.get('entry',0),t.get('current_price'),t.get('sl'),t.get('tp1'),t.get('tp2'),t.get('tp3'),t.get('timestamp',datetime.now().isoformat()),
                        t.get('status','open'),t.get('confidence'),t.get('leverage'),t.get('timeframe'),bool(t.get('tp1_hit')),bool(t.get('tp2_hit')),bool(t.get('tp3_hit')),bool(t.get('sl_hit')),t.get('pnl',0.0)))
                else:
                    c.execute("INSERT INTO trades (symbol,side,entry,current_price,sl,tp1,tp2,tp3,timestamp,status,confidence,leverage,timeframe,tp1_hit,tp2_hit,tp3_hit,sl_hit,pnl) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                        (t.get('symbol',''),t.get('side',''),t.get('entry',0),t.get('current_price'),t.get('sl'),t.get('tp1'),t.get('tp2'),t.get('tp3'),t.get('timestamp',datetime.now().isoformat()),
                        t.get('status','open'),t.get('confidence'),t.get('leverage'),t.get('timeframe'),1 if t.get('tp1_hit') else 0,1 if t.get('tp2_hit') else 0,1 if t.get('tp3_hit') else 0,1 if t.get('sl_hit') else 0,t.get('pnl',0.0)))
                m+=1
            except: continue
        conn.commit()
        conn.close()
        print(f"✅ Migration: {m} trades")
        return m
    except Exception as e:
        print(f"❌ migration: {e}")
        return 0

try:
    init_trades_db()
    stats = get_trade_stats()
    print(f"✅ SQL OK! Trades: {stats['total']}")
except Exception as e:
    print(f"❌ Init: {e}")
