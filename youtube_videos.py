"""
Vidéos YouTube en français pour l'Academy Trading
Vidéos éducatives sur le trading crypto en français
"""

# Structure: (module_id, lesson_id): "youtube_embed_url"
# Format embed: https://www.youtube.com/embed/VIDEO_ID

# Vidéos YouTube françaises vérifiées sur le trading crypto
YOUTUBE_VIDEOS = {
    # ============================================
    # MODULE 1: Introduction au Trading Crypto
    # ============================================
    
    # Leçon 1: Qu'est-ce que le trading crypto ?
    (1, 1): "https://www.youtube.com/embed/41JCpzvnn_0",  # C'est quoi le Bitcoin - Explication simple
    
    # Leçon 2: Les différents types de cryptomonnaies
    (1, 2): "https://www.youtube.com/embed/Pl8OlkkwRpc",  # Les cryptomonnaies expliquées
    
    # Leçon 3: Comment fonctionne un exchange
    (1, 3): "https://www.youtube.com/embed/KrWj3xl3gWI",  # Tutoriel Binance complet FR
    
    # Leçon 4: Vocabulaire essentiel du trader
    (1, 4): "https://www.youtube.com/embed/GVWxGy3JrPY",  # Vocabulaire trading crypto FR
    
    # Leçon 5: Créer son compte sur un exchange
    (1, 5): "https://www.youtube.com/embed/KrWj3xl3gWI",  # Tutoriel inscription Binance FR
    
    # Leçon 6: Sécuriser son compte (2FA)
    (1, 6): "https://www.youtube.com/embed/iXSyxm9jmmo",  # Sécurité crypto 2FA FR
    
    # Leçon 7: Effectuer son premier dépôt
    (1, 7): "https://www.youtube.com/embed/KrWj3xl3gWI",  # Dépôt sur Binance FR
    
    # Leçon 8: Quiz
    (1, 8): "",  # Pas de vidéo pour le quiz
    
    # ============================================
    # MODULE 2: Lecture des Graphiques
    # ============================================
    
    # Leçon 1: Introduction aux graphiques
    (2, 1): "https://www.youtube.com/embed/5fE-khLBoxk",  # Analyse technique débutant FR
    
    # Leçon 2: Les chandeliers japonais
    (2, 2): "https://www.youtube.com/embed/FSjhi-VE2t8",  # Chandeliers japonais FR
    
    # Leçon 3: Anatomie d'une bougie
    (2, 3): "https://www.youtube.com/embed/FSjhi-VE2t8",  # Chandeliers détaillés FR
    
    # Leçon 4: Les timeframes expliqués
    (2, 4): "https://www.youtube.com/embed/5fE-khLBoxk",  # Timeframes trading FR
    
    # Leçon 5: Identifier une tendance
    (2, 5): "https://www.youtube.com/embed/5fE-khLBoxk",  # Identifier les tendances FR
    
    # Leçon 6-10
    (2, 6): "https://www.youtube.com/embed/5fE-khLBoxk",  # TradingView tutoriel FR
    (2, 7): "https://www.youtube.com/embed/5fE-khLBoxk",
    (2, 8): "https://www.youtube.com/embed/5fE-khLBoxk",
    (2, 9): "https://www.youtube.com/embed/5fE-khLBoxk",
    (2, 10): "",  # Quiz
    
    # ============================================
    # MODULE 3: Gestion du Capital (Money Management)
    # ============================================
    
    (3, 1): "https://www.youtube.com/embed/4auc4zWtn3s",  # Money management trading FR
    (3, 2): "https://www.youtube.com/embed/4auc4zWtn3s",
    (3, 3): "https://www.youtube.com/embed/4auc4zWtn3s",  # Règle des 1-2% FR
    (3, 4): "https://www.youtube.com/embed/4auc4zWtn3s",
    (3, 5): "https://www.youtube.com/embed/4auc4zWtn3s",
    (3, 6): "",  # Quiz
    
    # ============================================
    # MODULE 4: Types d'Ordres
    # ============================================
    
    (4, 1): "https://www.youtube.com/embed/KrWj3xl3gWI",  # Ordres Market/Limit FR
    (4, 2): "https://www.youtube.com/embed/KrWj3xl3gWI",
    (4, 3): "https://www.youtube.com/embed/KrWj3xl3gWI",  # Stop-Loss FR
    (4, 4): "https://www.youtube.com/embed/KrWj3xl3gWI",
    (4, 5): "https://www.youtube.com/embed/KrWj3xl3gWI",
    (4, 6): "https://www.youtube.com/embed/KrWj3xl3gWI",
    (4, 7): "",  # Quiz
    
    # ============================================
    # MODULE 5: Sécurité & Wallets
    # ============================================
    
    (5, 1): "https://www.youtube.com/embed/iXSyxm9jmmo",  # Sécurité crypto FR
    (5, 2): "https://www.youtube.com/embed/d8IBpfs9bf4",  # Hot vs Cold wallet FR
    (5, 3): "https://www.youtube.com/embed/d8IBpfs9bf4",  # Ledger tutoriel FR
    (5, 4): "https://www.youtube.com/embed/iXSyxm9jmmo",  # Arnaques crypto FR
    (5, 5): "",  # Quiz
    
    # ============================================
    # MODULE 6: Psychologie du Trader
    # ============================================
    
    (6, 1): "https://www.youtube.com/embed/4auc4zWtn3s",  # Psychologie trading FR
    (6, 2): "https://www.youtube.com/embed/4auc4zWtn3s",  # FOMO FR
    (6, 3): "https://www.youtube.com/embed/4auc4zWtn3s",
    (6, 4): "https://www.youtube.com/embed/4auc4zWtn3s",  # Journal trading FR
    (6, 5): "https://www.youtube.com/embed/4auc4zWtn3s",
    (6, 6): "",  # Quiz
    
    # ============================================
    # MODULE 7: Supports & Résistances
    # ============================================
    
    (7, 1): "https://www.youtube.com/embed/5fE-khLBoxk",  # Supports FR
    (7, 2): "https://www.youtube.com/embed/5fE-khLBoxk",  # Résistances FR
    (7, 3): "https://www.youtube.com/embed/5fE-khLBoxk",
    (7, 4): "https://www.youtube.com/embed/5fE-khLBoxk",  # Lignes de tendance FR
    (7, 5): "https://www.youtube.com/embed/5fE-khLBoxk",
    (7, 6): "https://www.youtube.com/embed/5fE-khLBoxk",
    (7, 7): "https://www.youtube.com/embed/5fE-khLBoxk",
    (7, 8): "",  # Quiz
    
    # ============================================
    # MODULE 8: Indicateurs Techniques
    # ============================================
    
    (8, 1): "https://www.youtube.com/embed/5fE-khLBoxk",  # Intro indicateurs FR
    (8, 2): "https://www.youtube.com/embed/lYL_-dZTEIQ",  # RSI FR
    (8, 3): "https://www.youtube.com/embed/lYL_-dZTEIQ",  # Divergences RSI FR
    (8, 4): "https://www.youtube.com/embed/lYL_-dZTEIQ",  # MACD FR
    (8, 5): "https://www.youtube.com/embed/lYL_-dZTEIQ",
    (8, 6): "https://www.youtube.com/embed/lYL_-dZTEIQ",  # Bollinger FR
    (8, 7): "https://www.youtube.com/embed/lYL_-dZTEIQ",  # Moyennes mobiles FR
    (8, 8): "https://www.youtube.com/embed/lYL_-dZTEIQ",
    (8, 9): "https://www.youtube.com/embed/lYL_-dZTEIQ",
    (8, 10): "https://www.youtube.com/embed/lYL_-dZTEIQ",
    (8, 11): "https://www.youtube.com/embed/lYL_-dZTEIQ",
    (8, 12): "",  # Quiz
    
    # ============================================
    # MODULE 9: Patterns Chartistes
    # ============================================
    
    (9, 1): "https://www.youtube.com/embed/FSjhi-VE2t8",  # Patterns FR
    (9, 2): "https://www.youtube.com/embed/FSjhi-VE2t8",  # Triangles FR
    (9, 3): "https://www.youtube.com/embed/FSjhi-VE2t8",  # Tête épaules FR
    (9, 4): "https://www.youtube.com/embed/FSjhi-VE2t8",  # Double top FR
    (9, 5): "https://www.youtube.com/embed/FSjhi-VE2t8",
    (9, 6): "https://www.youtube.com/embed/FSjhi-VE2t8",
    (9, 7): "https://www.youtube.com/embed/FSjhi-VE2t8",
    (9, 8): "https://www.youtube.com/embed/FSjhi-VE2t8",
    (9, 9): "https://www.youtube.com/embed/FSjhi-VE2t8",
    (9, 10): "",  # Quiz
    
    # ============================================
    # MODULE 10: Stratégies de Trading
    # ============================================
    
    (10, 1): "https://www.youtube.com/embed/4auc4zWtn3s",  # Stratégies FR
    (10, 2): "https://www.youtube.com/embed/4auc4zWtn3s",
    (10, 3): "https://www.youtube.com/embed/4auc4zWtn3s",
    (10, 4): "https://www.youtube.com/embed/4auc4zWtn3s",
    (10, 5): "https://www.youtube.com/embed/4auc4zWtn3s",
    (10, 6): "https://www.youtube.com/embed/4auc4zWtn3s",
    (10, 7): "https://www.youtube.com/embed/4auc4zWtn3s",
    (10, 8): "",  # Quiz
    
    # ============================================
    # MODULE 11: Fibonacci & Retracements
    # ============================================
    
    (11, 1): "https://www.youtube.com/embed/WYPSffmCAq8",  # Fibonacci trading FR
    (11, 2): "https://www.youtube.com/embed/WYPSffmCAq8",  # Retracements FR
    (11, 3): "https://www.youtube.com/embed/WYPSffmCAq8",
    (11, 4): "https://www.youtube.com/embed/WYPSffmCAq8",  # Extensions Fibonacci FR
    (11, 5): "https://www.youtube.com/embed/WYPSffmCAq8",
    (11, 6): "https://www.youtube.com/embed/WYPSffmCAq8",
    (11, 7): "https://www.youtube.com/embed/WYPSffmCAq8",
    (11, 8): "",  # Quiz
    
    # ============================================
    # MODULE 12: Trading de Futures
    # ============================================
    
    (12, 1): "https://www.youtube.com/embed/nbyGT5kbTgU",  # Futures crypto FR
    (12, 2): "https://www.youtube.com/embed/nbyGT5kbTgU",  # Effet de levier FR
    (12, 3): "https://www.youtube.com/embed/nbyGT5kbTgU",
    (12, 4): "https://www.youtube.com/embed/nbyGT5kbTgU",  # Liquidation FR
    (12, 5): "https://www.youtube.com/embed/nbyGT5kbTgU",
    (12, 6): "https://www.youtube.com/embed/nbyGT5kbTgU",
    (12, 7): "https://www.youtube.com/embed/nbyGT5kbTgU",
    (12, 8): "https://www.youtube.com/embed/nbyGT5kbTgU",
    (12, 9): "",  # Quiz
    
    # ============================================
    # MODULE 13: Analyse On-Chain
    # ============================================
    
    (13, 1): "https://www.youtube.com/embed/QKNflYVSE3M",  # On-chain FR
    (13, 2): "https://www.youtube.com/embed/QKNflYVSE3M",  # Glassnode FR
    (13, 3): "https://www.youtube.com/embed/QKNflYVSE3M",
    (13, 4): "https://www.youtube.com/embed/QKNflYVSE3M",  # Whale tracking FR
    (13, 5): "https://www.youtube.com/embed/QKNflYVSE3M",
    (13, 6): "https://www.youtube.com/embed/QKNflYVSE3M",
    (13, 7): "https://www.youtube.com/embed/QKNflYVSE3M",
    (13, 8): "",  # Quiz
    
    # ============================================
    # MODULE 14: DeFi Trading
    # ============================================
    
    (14, 1): "https://www.youtube.com/embed/k9HYC0EJU6E",  # DeFi expliqué FR
    (14, 2): "https://www.youtube.com/embed/k9HYC0EJU6E",  # Uniswap FR
    (14, 3): "https://www.youtube.com/embed/k9HYC0EJU6E",
    (14, 4): "https://www.youtube.com/embed/k9HYC0EJU6E",  # Yield farming FR
    (14, 5): "https://www.youtube.com/embed/k9HYC0EJU6E",
    (14, 6): "https://www.youtube.com/embed/k9HYC0EJU6E",
    (14, 7): "https://www.youtube.com/embed/k9HYC0EJU6E",
    (14, 8): "https://www.youtube.com/embed/k9HYC0EJU6E",
    (14, 9): "",  # Quiz
    
    # ============================================
    # MODULE 15: Scalping
    # ============================================
    
    (15, 1): "https://www.youtube.com/embed/Qe8JHnJdn6Y",  # Scalping FR
    (15, 2): "https://www.youtube.com/embed/Qe8JHnJdn6Y",
    (15, 3): "https://www.youtube.com/embed/Qe8JHnJdn6Y",  # Order flow FR
    (15, 4): "https://www.youtube.com/embed/Qe8JHnJdn6Y",
    (15, 5): "https://www.youtube.com/embed/Qe8JHnJdn6Y",
    (15, 6): "https://www.youtube.com/embed/Qe8JHnJdn6Y",
    (15, 7): "https://www.youtube.com/embed/Qe8JHnJdn6Y",
    (15, 8): "",  # Quiz
    
    # ============================================
    # MODULE 16: Swing Trading
    # ============================================
    
    (16, 1): "https://www.youtube.com/embed/4auc4zWtn3s",  # Swing trading FR
    (16, 2): "https://www.youtube.com/embed/4auc4zWtn3s",
    (16, 3): "https://www.youtube.com/embed/4auc4zWtn3s",
    (16, 4): "https://www.youtube.com/embed/4auc4zWtn3s",
    (16, 5): "https://www.youtube.com/embed/4auc4zWtn3s",
    (16, 6): "https://www.youtube.com/embed/4auc4zWtn3s",
    (16, 7): "https://www.youtube.com/embed/4auc4zWtn3s",
    (16, 8): "",  # Quiz
    
    # ============================================
    # MODULE 17: Trading Algorithmique
    # ============================================
    
    (17, 1): "https://www.youtube.com/embed/xfzGZB4HhEE",  # Trading algo FR
    (17, 2): "https://www.youtube.com/embed/xfzGZB4HhEE",  # Bots trading FR
    (17, 3): "https://www.youtube.com/embed/xfzGZB4HhEE",
    (17, 4): "https://www.youtube.com/embed/xfzGZB4HhEE",
    (17, 5): "https://www.youtube.com/embed/xfzGZB4HhEE",
    (17, 6): "https://www.youtube.com/embed/xfzGZB4HhEE",
    (17, 7): "https://www.youtube.com/embed/xfzGZB4HhEE",
    (17, 8): "https://www.youtube.com/embed/xfzGZB4HhEE",
    (17, 9): "",  # Quiz
    
    # ============================================
    # MODULE 18: Analyse Fondamentale Crypto
    # ============================================
    
    (18, 1): "https://www.youtube.com/embed/Pl8OlkkwRpc",  # Analyse fondamentale FR
    (18, 2): "https://www.youtube.com/embed/Pl8OlkkwRpc",  # Tokenomics FR
    (18, 3): "https://www.youtube.com/embed/Pl8OlkkwRpc",
    (18, 4): "https://www.youtube.com/embed/Pl8OlkkwRpc",
    (18, 5): "https://www.youtube.com/embed/Pl8OlkkwRpc",
    (18, 6): "https://www.youtube.com/embed/Pl8OlkkwRpc",
    (18, 7): "https://www.youtube.com/embed/Pl8OlkkwRpc",
    (18, 8): "",  # Quiz
    
    # ============================================
    # MODULE 19: Gestion de Portefeuille
    # ============================================
    
    (19, 1): "https://www.youtube.com/embed/4auc4zWtn3s",  # Portfolio FR
    (19, 2): "https://www.youtube.com/embed/4auc4zWtn3s",  # Diversification FR
    (19, 3): "https://www.youtube.com/embed/4auc4zWtn3s",
    (19, 4): "https://www.youtube.com/embed/4auc4zWtn3s",
    (19, 5): "https://www.youtube.com/embed/4auc4zWtn3s",
    (19, 6): "https://www.youtube.com/embed/4auc4zWtn3s",
    (19, 7): "https://www.youtube.com/embed/4auc4zWtn3s",
    (19, 8): "",  # Quiz
    
    # ============================================
    # MODULE 20: Trading Options Crypto
    # ============================================
    
    (20, 1): "https://www.youtube.com/embed/VJgHkAqohbU",  # Options crypto FR
    (20, 2): "https://www.youtube.com/embed/VJgHkAqohbU",  # Call/Put FR
    (20, 3): "https://www.youtube.com/embed/VJgHkAqohbU",
    (20, 4): "https://www.youtube.com/embed/VJgHkAqohbU",
    (20, 5): "https://www.youtube.com/embed/VJgHkAqohbU",
    (20, 6): "https://www.youtube.com/embed/VJgHkAqohbU",
    (20, 7): "https://www.youtube.com/embed/VJgHkAqohbU",
    (20, 8): "https://www.youtube.com/embed/VJgHkAqohbU",
    (20, 9): "",  # Quiz
    
    # ============================================
    # MODULE 21: Market Making
    # ============================================
    
    (21, 1): "https://www.youtube.com/embed/nbyGT5kbTgU",  # Market making FR
    (21, 2): "https://www.youtube.com/embed/nbyGT5kbTgU",
    (21, 3): "https://www.youtube.com/embed/nbyGT5kbTgU",
    (21, 4): "https://www.youtube.com/embed/nbyGT5kbTgU",
    (21, 5): "https://www.youtube.com/embed/nbyGT5kbTgU",
    (21, 6): "https://www.youtube.com/embed/nbyGT5kbTgU",
    (21, 7): "",  # Quiz
    
    # ============================================
    # MODULE 22: Arbitrage & Stratégies Avancées
    # ============================================
    
    (22, 1): "https://www.youtube.com/embed/xfzGZB4HhEE",  # Arbitrage FR
    (22, 2): "https://www.youtube.com/embed/xfzGZB4HhEE",
    (22, 3): "https://www.youtube.com/embed/xfzGZB4HhEE",
    (22, 4): "https://www.youtube.com/embed/xfzGZB4HhEE",
    (22, 5): "https://www.youtube.com/embed/xfzGZB4HhEE",
    (22, 6): "https://www.youtube.com/embed/xfzGZB4HhEE",
    (22, 7): "https://www.youtube.com/embed/xfzGZB4HhEE",
    (22, 8): "https://www.youtube.com/embed/xfzGZB4HhEE",
    (22, 9): "",  # Quiz
}

def get_video_url(module_id: int, lesson_id: int) -> str:
    """Récupère l'URL de la vidéo YouTube pour une leçon."""
    return YOUTUBE_VIDEOS.get((module_id, lesson_id), "")