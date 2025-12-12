import sqlite3
from datetime import datetime, timedelta
import json
from academy_config import (
    BADGES_DATA, LEVELS_DATA, XP_SOURCES, ACHIEVEMENTS_DATA,
    get_level_from_xp, calculate_completion_percentage
)

# ============================================================================
# 🗄️ SYSTÈME DE BASE DE DONNÉES - CRYPTO ACADEMY
# ============================================================================

DB_PATH = "trading_data.db"

# ========== INITIALISATION DES TABLES ==========

def init_academy_tables():
    """Crée toutes les tables nécessaires pour l'Academy"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Table: Progression des leçons
    c.execute('''
        CREATE TABLE IF NOT EXISTS lesson_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            lesson_id INTEGER NOT NULL,
            completed BOOLEAN DEFAULT 0,
            completion_date TIMESTAMP,
            time_spent INTEGER DEFAULT 0,
            UNIQUE(username, lesson_id)
        )
    ''')
    
    # Table: Résultats des quiz
    c.execute('''
        CREATE TABLE IF NOT EXISTS quiz_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            lesson_id INTEGER NOT NULL,
            score INTEGER NOT NULL,
            total_questions INTEGER NOT NULL,
            answers_json TEXT,
            completion_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Table: Badges débloqués
    c.execute('''
        CREATE TABLE IF NOT EXISTS user_badges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            badge_id INTEGER NOT NULL,
            unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(username, badge_id)
        )
    ''')
    
    # Table: XP et statistiques utilisateur
    c.execute('''
        CREATE TABLE IF NOT EXISTS user_xp (
            username TEXT PRIMARY KEY,
            total_xp INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1,
            streak_days INTEGER DEFAULT 0,
            last_activity_date DATE,
            questions_asked INTEGER DEFAULT 0,
            lessons_completed INTEGER DEFAULT 0,
            quizzes_perfect INTEGER DEFAULT 0,
            total_time_spent INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Table: Historique chat AI
    c.execute('''
        CREATE TABLE IF NOT EXISTS ai_chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            message TEXT NOT NULL,
            response TEXT NOT NULL,
            lesson_context INTEGER,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Table: Achievements débloqués
    c.execute('''
        CREATE TABLE IF NOT EXISTS user_achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            achievement_id TEXT NOT NULL,
            unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(username, achievement_id)
        )
    ''')
    
    # Table: Leaderboard (pour optimisation)
    c.execute('''
        CREATE TABLE IF NOT EXISTS leaderboard_cache (
            username TEXT PRIMARY KEY,
            total_xp INTEGER,
            level INTEGER,
            lessons_completed INTEGER,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ Tables Academy créées avec succès !")

# ========== FONCTIONS XP ET NIVEAU ==========

def init_user_xp(username):
    """Initialise l'XP d'un nouvel utilisateur"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        INSERT OR IGNORE INTO user_xp (username, total_xp, level, last_activity_date)
        VALUES (?, 0, 1, ?)
    ''', (username, datetime.now().date()))
    conn.commit()
    conn.close()

def add_xp(username, xp_amount, source="manual"):
    """Ajoute de l'XP à un utilisateur et met à jour son niveau"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Initialiser si nécessaire
    init_user_xp(username)
    
    # Ajouter l'XP
    c.execute('''
        UPDATE user_xp 
        SET total_xp = total_xp + ?,
            last_activity_date = ?
        WHERE username = ?
    ''', (xp_amount, datetime.now().date(), username))
    
    # Récupérer le nouveau total XP
    c.execute('SELECT total_xp FROM user_xp WHERE username = ?', (username,))
    result = c.fetchone()
    if result:
        total_xp = result[0]
        new_level = get_level_from_xp(total_xp)
        
        # Mettre à jour le niveau
        c.execute('UPDATE user_xp SET level = ? WHERE username = ?', (new_level, username))
    
    conn.commit()
    conn.close()
    
    # Vérifier les badges après ajout XP
    check_and_unlock_badges(username)
    
    return True

def get_user_xp_data(username):
    """Récupère toutes les données XP d'un utilisateur"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT * FROM user_xp WHERE username = ?', (username,))
    result = c.fetchone()
    conn.close()
    
    if result:
        return {
            "username": result[0],
            "total_xp": result[1],
            "level": result[2],
            "streak_days": result[3],
            "last_activity_date": result[4],
            "questions_asked": result[5],
            "lessons_completed": result[6],
            "quizzes_perfect": result[7],
            "total_time_spent": result[8]
        }
    return None

# ========== FONCTIONS LEÇONS ==========

def mark_lesson_complete(username, lesson_id, time_spent=0):
    """Marque une leçon comme complétée et ajoute l'XP"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Vérifier si déjà complétée
    c.execute('''
        SELECT completed FROM lesson_progress 
        WHERE username = ? AND lesson_id = ?
    ''', (username, lesson_id))
    result = c.fetchone()
    
    if result and result[0]:
        conn.close()
        return False  # Déjà complétée
    
    # Marquer comme complétée
    c.execute('''
        INSERT OR REPLACE INTO lesson_progress 
        (username, lesson_id, completed, completion_date, time_spent)
        VALUES (?, ?, 1, ?, ?)
    ''', (username, lesson_id, datetime.now(), time_spent))
    
    # Mettre à jour le compteur de leçons
    c.execute('''
        UPDATE user_xp 
        SET lessons_completed = lessons_completed + 1,
            total_time_spent = total_time_spent + ?
        WHERE username = ?
    ''', (time_spent, username))
    
    conn.commit()
    conn.close()
    
    # Ajouter l'XP pour la leçon
    xp_reward = XP_SOURCES["lesson_completed"]
    
    # Bonus pour la première leçon
    xp_data = get_user_xp_data(username)
    if xp_data and xp_data["lessons_completed"] == 0:
        xp_reward += XP_SOURCES["first_lesson"]
    
    add_xp(username, xp_reward, "lesson_completed")
    
    # Vérifier les achievements
    check_achievements(username, "lesson_completed", lesson_id)
    
    return True

def get_lesson_status(username, lesson_id):
    """Vérifie si une leçon est complétée"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        SELECT completed, completion_date, time_spent 
        FROM lesson_progress 
        WHERE username = ? AND lesson_id = ?
    ''', (username, lesson_id))
    result = c.fetchone()
    conn.close()
    
    if result:
        return {
            "completed": bool(result[0]),
            "completion_date": result[1],
            "time_spent": result[2]
        }
    return {"completed": False, "completion_date": None, "time_spent": 0}

def get_all_lessons_progress(username):
    """Récupère la progression de toutes les leçons"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        SELECT lesson_id, completed, completion_date, time_spent
        FROM lesson_progress 
        WHERE username = ?
    ''', (username,))
    results = c.fetchall()
    conn.close()
    
    progress = {}
    for row in results:
        progress[row[0]] = {
            "completed": bool(row[1]),
            "completion_date": row[2],
            "time_spent": row[3]
        }
    return progress

# ========== FONCTIONS QUIZ ==========

def save_quiz_result(username, lesson_id, score, total_questions, answers_json):
    """Enregistre le résultat d'un quiz et ajoute l'XP"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    c.execute('''
        INSERT INTO quiz_results 
        (username, lesson_id, score, total_questions, answers_json)
        VALUES (?, ?, ?, ?, ?)
    ''', (username, lesson_id, score, total_questions, json.dumps(answers_json)))
    
    conn.commit()
    conn.close()
    
    # Calcul du pourcentage
    percentage = (score / total_questions) * 100
    
    # XP selon le score
    if percentage == 100:
        # Quiz parfait
        xp_reward = XP_SOURCES["quiz_perfect"]
        # Incrémenter le compteur de quiz parfaits
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''
            UPDATE user_xp 
            SET quizzes_perfect = quizzes_perfect + 1
            WHERE username = ?
        ''', (username,))
        conn.commit()
        conn.close()
        
    elif percentage >= 80:
        # Quiz réussi
        xp_reward = XP_SOURCES["quiz_passed"]
    else:
        # Quiz échoué, pas d'XP
        xp_reward = 0
    
    if xp_reward > 0:
        add_xp(username, xp_reward, "quiz_completed")
    
    # Vérifier les achievements
    check_achievements(username, "quiz_completed", {"score": percentage, "perfect": percentage == 100})
    
    return {
        "passed": percentage >= 80,
        "perfect": percentage == 100,
        "xp_earned": xp_reward
    }

def get_quiz_results(username, lesson_id):
    """Récupère tous les résultats de quiz pour une leçon"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        SELECT score, total_questions, answers_json, completion_date
        FROM quiz_results 
        WHERE username = ? AND lesson_id = ?
        ORDER BY completion_date DESC
    ''', (username, lesson_id))
    results = c.fetchall()
    conn.close()
    
    quiz_history = []
    for row in results:
        quiz_history.append({
            "score": row[0],
            "total_questions": row[1],
            "percentage": (row[0] / row[1]) * 100,
            "answers": json.loads(row[2]),
            "date": row[3]
        })
    return quiz_history

# ========== FONCTIONS BADGES ==========

def check_and_unlock_badges(username):
    """Vérifie et débloque automatiquement les badges"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Récupérer les stats utilisateur
    xp_data = get_user_xp_data(username)
    if not xp_data:
        conn.close()
        return []
    
    newly_unlocked = []
    
    for badge_id, badge_data in BADGES_DATA.items():
        # Vérifier si déjà débloqué
        c.execute('''
            SELECT 1 FROM user_badges 
            WHERE username = ? AND badge_id = ?
        ''', (username, badge_id))
        
        if c.fetchone():
            continue  # Déjà débloqué
        
        # Vérifier la condition
        unlocked = False
        
        if "lessons_completed" in badge_data["condition"]:
            required = int(badge_data["condition"].split(">=")[1].strip())
            if xp_data["lessons_completed"] >= required:
                unlocked = True
        
        elif "quizzes_perfect" in badge_data["condition"]:
            required = int(badge_data["condition"].split(">=")[1].strip())
            if xp_data["quizzes_perfect"] >= required:
                unlocked = True
        
        elif "questions_asked" in badge_data["condition"]:
            required = int(badge_data["condition"].split(">=")[1].strip())
            if xp_data["questions_asked"] >= required:
                unlocked = True
        
        elif "streak_days" in badge_data["condition"]:
            required = int(badge_data["condition"].split(">=")[1].strip())
            if xp_data["streak_days"] >= required:
                unlocked = True
        
        if unlocked:
            c.execute('''
                INSERT INTO user_badges (username, badge_id)
                VALUES (?, ?)
            ''', (username, badge_id))
            newly_unlocked.append(badge_data)
    
    conn.commit()
    conn.close()
    
    return newly_unlocked

def get_user_badges(username):
    """Récupère tous les badges d'un utilisateur"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        SELECT badge_id, unlocked_at 
        FROM user_badges 
        WHERE username = ?
        ORDER BY unlocked_at DESC
    ''', (username,))
    results = c.fetchall()
    conn.close()
    
    badges = []
    for row in results:
        badge_data = BADGES_DATA.get(row[0])
        if badge_data:
            badges.append({
                **badge_data,
                "unlocked_at": row[1]
            })
    return badges

# ========== FONCTIONS ACHIEVEMENTS ==========

def check_achievements(username, event_type, data=None):
    """Vérifie et débloque les achievements selon l'événement"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    newly_unlocked = []
    
    if event_type == "lesson_completed":
        # Speed Reader: 5 leçons en 24h
        c.execute('''
            SELECT COUNT(*) FROM lesson_progress
            WHERE username = ? 
            AND completion_date >= datetime('now', '-1 day')
        ''', (username,))
        count = c.fetchone()[0]
        
        if count >= 5:
            achievement_id = "speed_reader"
            c.execute('''
                SELECT 1 FROM user_achievements
                WHERE username = ? AND achievement_id = ?
            ''', (username, achievement_id))
            
            if not c.fetchone():
                c.execute('''
                    INSERT INTO user_achievements (username, achievement_id)
                    VALUES (?, ?)
                ''', (username, achievement_id))
                newly_unlocked.append(ACHIEVEMENTS_DATA[achievement_id])
                add_xp(username, ACHIEVEMENTS_DATA[achievement_id]["xp_reward"], "achievement")
    
    conn.commit()
    conn.close()
    
    return newly_unlocked

# ========== FONCTIONS STREAK ==========

def update_streak(username):
    """Met à jour la streak de l'utilisateur"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    c.execute('SELECT last_activity_date, streak_days FROM user_xp WHERE username = ?', (username,))
    result = c.fetchone()
    
    if not result:
        conn.close()
        return 0
    
    last_date = datetime.strptime(result[0], "%Y-%m-%d").date() if result[0] else None
    current_streak = result[1]
    today = datetime.now().date()
    
    if last_date:
        days_diff = (today - last_date).days
        
        if days_diff == 1:
            # Streak continue
            new_streak = current_streak + 1
        elif days_diff == 0:
            # Même jour
            new_streak = current_streak
        else:
            # Streak cassée
            new_streak = 1
    else:
        new_streak = 1
    
    c.execute('''
        UPDATE user_xp 
        SET streak_days = ?, last_activity_date = ?
        WHERE username = ?
    ''', (new_streak, today, username))
    
    # Bonus XP pour streaks
    if new_streak == 7:
        add_xp(username, XP_SOURCES["streak_bonus_7"], "streak_bonus")
    elif new_streak == 30:
        add_xp(username, XP_SOURCES["streak_bonus_30"], "streak_bonus")
    
    conn.commit()
    conn.close()
    
    return new_streak

# ========== FONCTIONS CHAT AI ==========

def save_ai_chat(username, message, response, lesson_context=None):
    """Enregistre une interaction avec l'AI Coach"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    c.execute('''
        INSERT INTO ai_chat_history (username, message, response, lesson_context)
        VALUES (?, ?, ?, ?)
    ''', (username, message, response, lesson_context))
    
    # Incrémenter le compteur de questions
    c.execute('''
        UPDATE user_xp 
        SET questions_asked = questions_asked + 1
        WHERE username = ?
    ''', (username,))
    
    conn.commit()
    conn.close()
    
    # Ajouter XP pour question
    add_xp(username, XP_SOURCES["question_asked"], "question_asked")

def get_ai_chat_history(username, limit=20):
    """Récupère l'historique des chats AI"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        SELECT message, response, lesson_context, timestamp
        FROM ai_chat_history
        WHERE username = ?
        ORDER BY timestamp DESC
        LIMIT ?
    ''', (username, limit))
    results = c.fetchall()
    conn.close()
    
    history = []
    for row in results:
        history.append({
            "message": row[0],
            "response": row[1],
            "lesson_context": row[2],
            "timestamp": row[3]
        })
    return history

# ========== FONCTION PROGRESSION GLOBALE ==========

def get_user_progress(username):
    """Retourne TOUTE la progression d'un utilisateur"""
    # Initialiser l'utilisateur si nécessaire
    init_user_xp(username)
    update_streak(username)
    
    # XP et niveau
    xp_data = get_user_xp_data(username)
    
    # Leçons
    lessons = get_all_lessons_progress(username)
    
    # Badges
    badges = get_user_badges(username)
    
    # Calculs
    completion_pct = calculate_completion_percentage(xp_data["lessons_completed"])
    
    return {
        "xp": xp_data,
        "lessons": lessons,
        "badges": badges,
        "completion_percentage": completion_pct,
        "total_badges": len(badges),
        "total_badges_available": len(BADGES_DATA)
    }

# ========== LEADERBOARD ==========

def get_leaderboard(limit=10, sort_by="xp"):
    """Récupère le classement des utilisateurs"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    if sort_by == "xp":
        order = "total_xp DESC"
    elif sort_by == "lessons":
        order = "lessons_completed DESC"
    elif sort_by == "level":
        order = "level DESC, total_xp DESC"
    else:
        order = "total_xp DESC"
    
    c.execute(f'''
        SELECT username, total_xp, level, lessons_completed, quizzes_perfect
        FROM user_xp
        ORDER BY {order}
        LIMIT ?
    ''', (limit,))
    
    results = c.fetchall()
    conn.close()
    
    leaderboard = []
    for idx, row in enumerate(results, 1):
        leaderboard.append({
            "rank": idx,
            "username": row[0],
            "total_xp": row[1],
            "level": row[2],
            "lessons_completed": row[3],
            "quizzes_perfect": row[4]
        })
    
    return leaderboard

# ========== INITIALISATION ==========
if __name__ == "__main__":
    init_academy_tables()
    print("✅ Base de données Academy initialisée !")
