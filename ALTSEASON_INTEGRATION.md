
# Intégration Altseason (APIRouter + Widget)
## 1) Fichiers
- `altseason_router.py` : routes `/altseason/check` et `/altseason/notify`
- `altseason_widget.html` : mini section UI, intégrable dans ton dashboard ou servie telle quelle

## 2) Dans ton `main.py` (FastAPI)
```python
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from altseason_router import router as altseason_router

app = FastAPI()

# ... tes routes existantes ...

# a) Inclure les endpoints JSON
app.include_router(altseason_router)  # expose /altseason/check et /altseason/notify

# b) Servir le widget (facultatif) depuis /ui/altseason
app.mount("/ui/altseason", StaticFiles(directory=".", html=True), name="altseason_ui")
# Place le fichier 'altseason_widget.html' à la racine du projet ou ajuste le chemin
# Ensuite: http://<host>:<port>/ui/altseason/altseason_widget.html
```

> Alternative: si tu as déjà un dossier `static/`, mets `altseason_widget.html` dedans et adapte `directory="static"`.

## 3) Variables d'environnement (.env)
```
ALT_BTC_DOM_THR=55
ALT_ETH_BTC_THR=0.045
ALT_ASI_THR=75
ALT_TOTAL2_THR_T=1.78

TELEGRAM_TOKEN=xxxx:yyyy
TELEGRAM_CHAT=123456789
```

## 4) Test rapide
- JSON: `GET /altseason/check`
- Telegram: `POST /altseason/notify`  body: `{ "force": true }`
- UI: ouvrir `/ui/altseason/altseason_widget.html`

## 5) Sécurité / quota
- Utilise un rate limit si l’endpoint est public (les données proviennent d’APIs publiques).
- Ajoute une clé simple ou protège l’accès si besoin.
