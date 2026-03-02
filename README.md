# CryptoIA Trading Platform

## 📁 Structure du projet

```
CryptoIA-Platform/
├── backend/          ← API FastAPI (Python)
│   ├── main.py       ← Point d'entrée du serveur
│   ├── routers/      ← Routes API
│   ├── services/     ← Logique métier
│   ├── models/       ← Modèles de données
│   ├── schemas/      ← Schémas Pydantic
│   └── core/         ← Configuration & base de données
└── frontend/         ← Application React (TypeScript)
    ├── src/pages/    ← Pages de l'application
    ├── src/components/ ← Composants UI
    └── package.json  ← Dépendances Node.js
```

## 🚀 Installation

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📋 Pages disponibles
- **Dashboard** - Vue d'ensemble avec données crypto en temps réel
- **Token Scanner** - Scanner IA pour analyser les tokens
- **Whale Watcher** - Surveillance des grosses transactions
- **Technical Analysis** - Outils d'analyse technique
- **Position Sizer** - Calculateur de taille de position
- **Gem Hunter** - Découverte de tokens prometteurs