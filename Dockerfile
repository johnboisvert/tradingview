FROM python:3.11-slim
# Crée un venv system-wide propre
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
WORKDIR /app
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ===== CORRECTION: Copier TOUS les fichiers Python =====
COPY *.py /app/
# =======================================================

# User non-root
RUN useradd -m appuser
USER appuser
# Render/Heroku-style PORT
ENV PORT=8000
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 🚀 **À FAIRE SUR GITHUB:**

1. Cliquez sur `Dockerfile`
2. Cliquez ✏️ Edit
3. Changez la ligne `COPY main.py /app/` par `COPY *.py /app/`
4. **Commit changes**
5. Attendez le redéploiement (2-3 minutes)

---

## 🔍 **APRÈS LE DÉPLOIEMENT:**

### **Dans les logs Railway, vous devriez voir:**
```
📂 Fichiers dans /app:
  - main.py
  - subscription_system.py      ← Maintenant présent!
  - admin_pricing.py            ← Maintenant présent!
  - sql_trades_system.py
  - altseason_router.py
  - strategie.py
  - requirements.txt
```

**Et ensuite:**
```
✅ Modules d'abonnement chargés
✅ Routes d'abonnement activées
🔧 Initialisation du système d'abonnement...
✅ Tables subscription OK (postgres)
✅ Système d'abonnement initialisé
```

---

## 🎯 **PUIS TESTEZ:**
```
✅ https://tradingview-production-5763.up.railway.app/pricing
✅ https://tradingview-production-5763.up.railway.app/admin/pricing
