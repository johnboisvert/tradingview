# ============================================================================
# 🎮 SYSTÈME DE GAMIFICATION - PARCOURS, BADGES, ACHIEVEMENTS
# ============================================================================

# ========== PARCOURS ==========
PARCOURS_DATA = {
    "bases": {
        "id": "bases",
        "title": "Les Bases du Crypto",
        "description": "Comprendre les fondamentaux : blockchain, Bitcoin, Ethereum, wallets, et l'économie crypto",
        "icon": "🎓",
        "color": "#6366f1",
        "lessons": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
        "total_lessons": 18,
        "estimated_hours": 4
    },
    "trading": {
        "id": "trading",
        "title": "Trading 101",
        "description": "Maîtriser l'analyse technique, les stratégies de trading, et devenir un trader profitable",
        "icon": "📈",
        "color": "#10b981",
        "lessons": [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
        "total_lessons": 18,
        "estimated_hours": 5
    },
    "securite": {
        "id": "securite",
        "title": "Sécurité Crypto",
        "description": "Protéger tes cryptos comme un pro : wallets hardware, DeFi risks, et best practices",
        "icon": "🔐",
        "color": "#f59e0b",
        "lessons": [37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54],
        "total_lessons": 18,
        "estimated_hours": 4
    }
}

# ========== MODULES ==========
MODULES_DATA = {
    1: {"id": 1, "title": "Introduction", "parcours": "bases", "lessons": [1, 2, 3, 4, 5, 6]},
    2: {"id": 2, "title": "Acheter et Stocker", "parcours": "bases", "lessons": [7, 8, 9, 10, 11, 12]},
    3: {"id": 3, "title": "Économie Crypto", "parcours": "bases", "lessons": [13, 14, 15, 16, 17, 18]},
    4: {"id": 4, "title": "Bases du Trading", "parcours": "trading", "lessons": [19, 20, 21, 22, 23, 24]},
    5: {"id": 5, "title": "Analyse Technique", "parcours": "trading", "lessons": [25, 26, 27, 28, 29, 30]},
    6: {"id": 6, "title": "Stratégies Avancées", "parcours": "trading", "lessons": [31, 32, 33, 34, 35, 36]},
    7: {"id": 7, "title": "Sécurité de Base", "parcours": "securite", "lessons": [37, 38, 39, 40, 41, 42]},
    8: {"id": 8, "title": "Wallets Avancés", "parcours": "securite", "lessons": [43, 44, 45, 46, 47, 48]},
    9: {"id": 9, "title": "DeFi et Risques", "parcours": "securite", "lessons": [49, 50, 51, 52, 53, 54]}
}

# ========== BADGES ==========
BADGES_DATA = {
    1: {
        "id": 1,
        "name": "🔓 Première Leçon",
        "description": "Complète ta première leçon",
        "icon": "🔓",
        "condition": "lessons_completed >= 1",
        "rarity": "common"
    },
    2: {
        "id": 2,
        "name": "📚 Débutant",
        "description": "Complète 5 leçons",
        "icon": "📚",
        "condition": "lessons_completed >= 5",
        "rarity": "common"
    },
    3: {
        "id": 3,
        "name": "📊 Intermédiaire",
        "description": "Complète 18 leçons (1 parcours complet)",
        "icon": "📊",
        "condition": "lessons_completed >= 18",
        "rarity": "rare"
    },
    4: {
        "id": 4,
        "name": "🎓 Expert",
        "description": "Complète les 54 leçons",
        "icon": "🎓",
        "condition": "lessons_completed >= 54",
        "rarity": "legendary"
    },
    5: {
        "id": 5,
        "name": "✅ Quiz Master",
        "description": "Obtiens 10 quiz parfaits (100%)",
        "icon": "✅",
        "condition": "quizzes_perfect >= 10",
        "rarity": "rare"
    },
    6: {
        "id": 6,
        "name": "🔍 Curieux",
        "description": "Pose 50 questions à l'AI Coach",
        "icon": "🔍",
        "condition": "questions_asked >= 50",
        "rarity": "common"
    },
    7: {
        "id": 7,
        "name": "🔥 Dédié",
        "description": "Maintiens une streak de 7 jours",
        "icon": "🔥",
        "condition": "streak_days >= 7",
        "rarity": "rare"
    },
    8: {
        "id": 8,
        "name": "🔐 Sécurité Pro",
        "description": "Complète le parcours Sécurité",
        "icon": "🔐",
        "condition": "parcours_completed >= 'securite'",
        "rarity": "epic"
    },
    9: {
        "id": 9,
        "name": "💎 DeFi Expert",
        "description": "Complète toutes les leçons DeFi",
        "icon": "💎",
        "condition": "defi_lessons_completed >= 6",
        "rarity": "epic"
    }
}

# ========== ACHIEVEMENTS ==========
ACHIEVEMENTS_DATA = {
    "speed_reader": {
        "id": "speed_reader",
        "name": "⚡ Speed Reader",
        "description": "Complète 5 leçons en moins de 24h",
        "icon": "⚡",
        "xp_reward": 200
    },
    "night_owl": {
        "id": "night_owl",
        "name": "🦉 Night Owl",
        "description": "Complète une leçon entre minuit et 6h",
        "icon": "🦉",
        "xp_reward": 100
    },
    "early_bird": {
        "id": "early_bird",
        "name": "🌅 Early Bird",
        "description": "Complète une leçon avant 7h du matin",
        "icon": "🌅",
        "xp_reward": 100
    },
    "perfectionist": {
        "id": "perfectionist",
        "name": "💯 Perfectionist",
        "description": "Obtiens 5 quiz parfaits d'affilée",
        "icon": "💯",
        "xp_reward": 300
    },
    "scholar": {
        "id": "scholar",
        "name": "🧠 Scholar",
        "description": "Passe 10 heures sur la plateforme",
        "icon": "🧠",
        "xp_reward": 500
    },
    "trader_path": {
        "id": "trader_path",
        "name": "📈 Trader Path",
        "description": "Complète le parcours Trading",
        "icon": "📈",
        "xp_reward": 1000
    },
    "security_first": {
        "id": "security_first",
        "name": "🛡️ Security First",
        "description": "Complète le module Sécurité en premier",
        "icon": "🛡️",
        "xp_reward": 500
    }
}

# ========== NIVEAUX XP ==========
LEVELS_DATA = {
    1: {"level": 1, "name": "🌱 Novice", "xp_required": 0, "color": "#94a3b8"},
    2: {"level": 2, "name": "📖 Apprenti", "xp_required": 500, "color": "#60a5fa"},
    3: {"level": 3, "name": "💡 Éclairé", "xp_required": 1500, "color": "#3b82f6"},
    4: {"level": 4, "name": "⚡ Compétent", "xp_required": 3000, "color": "#2563eb"},
    5: {"level": 5, "name": "🎯 Expert", "xp_required": 5000, "color": "#8b5cf6"},
    6: {"level": 6, "name": "🏆 Maître", "xp_required": 8000, "color": "#7c3aed"},
    7: {"level": 7, "name": "👑 Légende", "xp_required": 12000, "color": "#f59e0b"},
    8: {"level": 8, "name": "💎 Diamant", "xp_required": 18000, "color": "#06b6d4"},
    9: {"level": 9, "name": "🌟 Champion", "xp_required": 25000, "color": "#10b981"},
    10: {"level": 10, "name": "⚡ Crypto God", "xp_required": 35000, "color": "#ef4444"}
}

# ========== SOURCES XP ==========
XP_SOURCES = {
    "lesson_completed": 100,
    "quiz_passed": 50,  # Score > 80%
    "quiz_perfect": 100,  # Score = 100%
    "question_asked": 5,
    "streak_bonus_7": 500,
    "streak_bonus_30": 2000,
    "parcours_completed": 1000,
    "first_lesson": 50
}

# ========== FONCTIONS UTILITAIRES ==========

def get_level_from_xp(total_xp):
    """Calcule le niveau actuel basé sur l'XP total"""
    current_level = 1
    for level in range(10, 0, -1):
        if total_xp >= LEVELS_DATA[level]["xp_required"]:
            current_level = level
            break
    return current_level

def get_xp_for_next_level(total_xp):
    """Retourne l'XP nécessaire pour le prochain niveau"""
    current_level = get_level_from_xp(total_xp)
    if current_level >= 10:
        return 0  # Max level
    return LEVELS_DATA[current_level + 1]["xp_required"] - total_xp

def get_level_progress(total_xp):
    """Retourne le pourcentage de progression vers le prochain niveau"""
    current_level = get_level_from_xp(total_xp)
    if current_level >= 10:
        return 100
    
    current_level_xp = LEVELS_DATA[current_level]["xp_required"]
    next_level_xp = LEVELS_DATA[current_level + 1]["xp_required"]
    xp_in_level = total_xp - current_level_xp
    xp_needed_for_level = next_level_xp - current_level_xp
    
    return int((xp_in_level / xp_needed_for_level) * 100)

def calculate_completion_percentage(lessons_completed):
    """Calcule le pourcentage de complétion global"""
    return int((lessons_completed / 54) * 100)

def get_badge_rarity_color(rarity):
    """Retourne la couleur selon la rareté du badge"""
    colors = {
        "common": "#94a3b8",
        "rare": "#3b82f6",
        "epic": "#8b5cf6",
        "legendary": "#f59e0b"
    }
    return colors.get(rarity, "#94a3b8")
