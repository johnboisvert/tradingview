# -*- coding: utf-8 -*-
"""
💾 SYSTÈME SQL POUR LES TRADES - AI Trader Pro
Migration de trades_db (liste JSON) vers une vraie base de données SQL
"""

import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Optional
import os

# ============================================================================
# 📁 CONFIGURATION
# ============================================================================

def get_db_path():
    """Détermine le chemin de la base de données"""
    # Utiliser le même système que DATA_DIR dans main.py
    if os.path.exists("/data"):
        return "/data/trades.db"
    elif os.path.exists("/tmp"):
        return "/tmp/trades.db"
    else:
        return "trades.db"

DB_PATH = get_db_path()
print(f"📁 Base de données SQL: {DB_PATH}")

# ============================================================================
# 🗄️ INITIALISATION DE LA BASE DE DONNÉES
# ============================================================================

def init_trades_db():
    """Crée la table trades si elle n'existe pas"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS trades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT NOT NULL,
            side TEXT NOT NULL,
            entry REAL NOT NULL,
            current_price REAL,
            sl REAL,
            tp1 REAL,
            tp2 REAL,
            tp3 REAL,
            timestamp TEXT NOT NULL,
            status TEXT DEFAULT 'open',
            confidence REAL,
            leverage INTEGER,
            timeframe TEXT,
            tp1_hit INTEGER DEFAULT 0,
            tp2_hit INTEGER DEFAULT 0,
            tp3_hit INTEGER DEFAULT 0,
            sl_hit INTEGER DEFAULT 0,
            pnl REAL DEFAULT 0.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Index pour améliorer les performances
    c.execute('CREATE INDEX IF NOT EXISTS idx_symbol ON trades(symbol)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_status ON trades(status)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_timestamp ON trades(timestamp DESC)')
    
    conn.commit()
    conn.close()
    print("✅ Table 'trades' initialisée avec succès")

# ============================================================================
# 📥 MIGRATION DEPUIS JSON (pour importer les anciens trades)
# ============================================================================

def migrate_from_json(json_file_path: str):
    """
    Migre les trades depuis un fichier JSON vers la base SQL
    À utiliser une seule fois pour importer les anciens trades
    """
    if not os.path.exists(json_file_path):
        print(f"⚠️  Fichier JSON introuvable: {json_file_path}")
        return 0
    
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            trades = json.load(f)
        
        if not trades:
            print("ℹ️  Aucun trade à migrer")
            return 0
        
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        migrated = 0
        for trade in trades:
            # Vérifier si le trade existe déjà (éviter les doublons)
            c.execute('''
                SELECT COUNT(*) FROM trades 
                WHERE symbol = ? AND timestamp = ? AND entry = ?
            ''', (trade['symbol'], trade['timestamp'], trade['entry']))
            
            if c.fetchone()[0] > 0:
                continue  # Trade déjà existant
            
            # Insérer le trade
            c.execute('''
                INSERT INTO trades (
                    symbol, side, entry, current_price, sl, tp1, tp2, tp3,
                    timestamp, status, confidence, leverage, timeframe,
                    tp1_hit, tp2_hit, tp3_hit, sl_hit, pnl
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                trade['symbol'],
                trade['side'],
                trade['entry'],
                trade.get('current_price'),
                trade.get('sl'),
                trade.get('tp1'),
                trade.get('tp2'),
                trade.get('tp3'),
                trade['timestamp'],
                trade.get('status', 'open'),
                trade.get('confidence'),
                trade.get('leverage'),
                trade.get('timeframe'),
                1 if trade.get('tp1_hit') else 0,
                1 if trade.get('tp2_hit') else 0,
                1 if trade.get('tp3_hit') else 0,
                1 if trade.get('sl_hit') else 0,
                trade.get('pnl', 0.0)
            ))
            migrated += 1
        
        conn.commit()
        conn.close()
        
        print(f"✅ Migration réussie: {migrated} trades importés depuis {json_file_path}")
        return migrated
        
    except Exception as e:
        print(f"❌ Erreur lors de la migration: {e}")
        return 0

# ============================================================================
# ➕ CRÉER UN TRADE
# ============================================================================

def create_trade(trade_data: Dict) -> int:
    """
    Crée un nouveau trade dans la base de données
    Retourne l'ID du trade créé
    """
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    c.execute('''
        INSERT INTO trades (
            symbol, side, entry, current_price, sl, tp1, tp2, tp3,
            timestamp, status, confidence, leverage, timeframe,
            tp1_hit, tp2_hit, tp3_hit, sl_hit, pnl
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        trade_data['symbol'],
        trade_data['side'],
        trade_data['entry'],
        trade_data.get('current_price'),
        trade_data.get('sl'),
        trade_data.get('tp1'),
        trade_data.get('tp2'),
        trade_data.get('tp3'),
        trade_data['timestamp'],
        trade_data.get('status', 'open'),
        trade_data.get('confidence'),
        trade_data.get('leverage'),
        trade_data.get('timeframe'),
        1 if trade_data.get('tp1_hit') else 0,
        1 if trade_data.get('tp2_hit') else 0,
        1 if trade_data.get('tp3_hit') else 0,
        1 if trade_data.get('sl_hit') else 0,
        trade_data.get('pnl', 0.0)
    ))
    
    trade_id = c.lastrowid
    conn.commit()
    conn.close()
    
    return trade_id

# ============================================================================
# 📖 LIRE LES TRADES
# ============================================================================

def get_all_trades(limit: Optional[int] = None, order_by: str = "timestamp DESC") -> List[Dict]:
    """Récupère tous les trades (ou limité à X trades)"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Pour avoir des dictionnaires
    c = conn.cursor()
    
    query = f"SELECT * FROM trades ORDER BY {order_by}"
    if limit:
        query += f" LIMIT {limit}"
    
    c.execute(query)
    rows = c.fetchall()
    conn.close()
    
    # Convertir en liste de dictionnaires avec conversion des booléens
    trades = []
    for row in rows:
        trade = dict(row)
        # Convertir les entiers en booléens pour tp1_hit, tp2_hit, etc.
        trade['tp1_hit'] = bool(trade['tp1_hit'])
        trade['tp2_hit'] = bool(trade['tp2_hit'])
        trade['tp3_hit'] = bool(trade['tp3_hit'])
        trade['sl_hit'] = bool(trade['sl_hit'])
        trades.append(trade)
    
    return trades

def get_trade_by_id(trade_id: int) -> Optional[Dict]:
    """Récupère un trade par son ID"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute("SELECT * FROM trades WHERE id = ?", (trade_id,))
    row = c.fetchone()
    conn.close()
    
    if row:
        trade = dict(row)
        trade['tp1_hit'] = bool(trade['tp1_hit'])
        trade['tp2_hit'] = bool(trade['tp2_hit'])
        trade['tp3_hit'] = bool(trade['tp3_hit'])
        trade['sl_hit'] = bool(trade['sl_hit'])
        return trade
    return None

def get_open_trades() -> List[Dict]:
    """Récupère uniquement les trades ouverts"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute("SELECT * FROM trades WHERE status = 'open' ORDER BY timestamp DESC")
    rows = c.fetchall()
    conn.close()
    
    trades = []
    for row in rows:
        trade = dict(row)
        trade['tp1_hit'] = bool(trade['tp1_hit'])
        trade['tp2_hit'] = bool(trade['tp2_hit'])
        trade['tp3_hit'] = bool(trade['tp3_hit'])
        trade['sl_hit'] = bool(trade['sl_hit'])
        trades.append(trade)
    
    return trades

def get_trades_by_symbol(symbol: str) -> List[Dict]:
    """Récupère tous les trades d'un symbole spécifique"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute("SELECT * FROM trades WHERE symbol = ? ORDER BY timestamp DESC", (symbol,))
    rows = c.fetchall()
    conn.close()
    
    trades = []
    for row in rows:
        trade = dict(row)
        trade['tp1_hit'] = bool(trade['tp1_hit'])
        trade['tp2_hit'] = bool(trade['tp2_hit'])
        trade['tp3_hit'] = bool(trade['tp3_hit'])
        trade['sl_hit'] = bool(trade['sl_hit'])
        trades.append(trade)
    
    return trades

# ============================================================================
# ✏️ METTRE À JOUR UN TRADE
# ============================================================================

def update_trade(trade_id: int, updates: Dict):
    """Met à jour un trade existant"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Construire la requête UPDATE dynamiquement
    set_clause = []
    values = []
    
    for key, value in updates.items():
        if key in ['tp1_hit', 'tp2_hit', 'tp3_hit', 'sl_hit']:
            # Convertir les booléens en entiers
            value = 1 if value else 0
        set_clause.append(f"{key} = ?")
        values.append(value)
    
    # Ajouter updated_at automatiquement
    set_clause.append("updated_at = CURRENT_TIMESTAMP")
    
    values.append(trade_id)
    
    query = f"UPDATE trades SET {', '.join(set_clause)} WHERE id = ?"
    c.execute(query, values)
    
    conn.commit()
    conn.close()

def update_trade_status(trade_id: int, new_status: str):
    """Met à jour le statut d'un trade (open, closed, cancelled)"""
    update_trade(trade_id, {"status": new_status})

def mark_tp_hit(trade_id: int, tp_level: int):
    """Marque un TP comme atteint (1, 2, ou 3)"""
    field = f"tp{tp_level}_hit"
    update_trade(trade_id, {field: True})

def mark_sl_hit(trade_id: int):
    """Marque le SL comme atteint"""
    update_trade(trade_id, {"sl_hit": True, "status": "closed"})

# ============================================================================
# 🗑️ SUPPRIMER DES TRADES
# ============================================================================

def delete_trade(trade_id: int):
    """Supprime un trade par son ID"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("DELETE FROM trades WHERE id = ?", (trade_id,))
    conn.commit()
    conn.close()

def delete_all_trades():
    """Supprime TOUS les trades (à utiliser avec précaution!)"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("DELETE FROM trades")
    count = c.rowcount
    conn.commit()
    conn.close()
    return count

# ============================================================================
# 📊 STATISTIQUES
# ============================================================================

def get_trade_stats() -> Dict:
    """Calcule les statistiques globales des trades"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Total trades
    c.execute("SELECT COUNT(*) FROM trades")
    total = c.fetchone()[0]
    
    # Trades ouverts
    c.execute("SELECT COUNT(*) FROM trades WHERE status = 'open'")
    open_trades = c.fetchone()[0]
    
    # Wins (au moins un TP atteint)
    c.execute("SELECT COUNT(*) FROM trades WHERE tp1_hit = 1 OR tp2_hit = 1 OR tp3_hit = 1")
    wins = c.fetchone()[0]
    
    # Losses (SL atteint sans aucun TP)
    c.execute("""
        SELECT COUNT(*) FROM trades 
        WHERE sl_hit = 1 AND tp1_hit = 0 AND tp2_hit = 0 AND tp3_hit = 0
    """)
    losses = c.fetchone()[0]
    
    # PnL total
    c.execute("SELECT SUM(pnl) FROM trades")
    total_pnl = c.fetchone()[0] or 0.0
    
    conn.close()
    
    # Calculer le win rate
    closed_trades = wins + losses
    win_rate = (wins / closed_trades * 100) if closed_trades > 0 else 0
    
    return {
        "total": total,
        "open": open_trades,
        "closed": closed_trades,
        "wins": wins,
        "losses": losses,
        "win_rate": round(win_rate, 2),
        "total_pnl": round(total_pnl, 2)
    }

# ============================================================================
# 🔄 COMPATIBILITÉ AVEC L'ANCIEN SYSTÈME (trades_db)
# ============================================================================

def load_trades_to_memory() -> List[Dict]:
    """
    Charge tous les trades en mémoire (pour compatibilité avec l'ancien code)
    UTILISE get_all_trades() à la place dans le nouveau code
    """
    return get_all_trades()

# ============================================================================
# 🚀 INITIALISATION AU DÉMARRAGE
# ============================================================================

# Créer la table au chargement du module
init_trades_db()

print("✅ Système SQL pour les trades initialisé!")
print(f"📊 Statistiques: {get_trade_stats()}")
