from fastapi import FastAPI
from fastapi.responses import HTMLResponse

app = FastAPI()

@app.get("/", response_class=HTMLResponse)
async def home():
    return HTMLResponse("""
    <!DOCTYPE html>
    <html>
    <head><title>Test Simple</title></head>
    <body style="background: #667eea; color: white; text-align: center; padding: 50px; font-family: Arial;">
        <h1>✅ SI VOUS VOYEZ CETTE PAGE, L'UPLOAD FONCTIONNE!</h1>
        <p style="font-size: 20px; margin: 30px;">Railway et GitHub sont OK!</p>
        
        <div style="background: #1e293b; padding: 20px; border-radius: 10px; margin: 30px auto; max-width: 600px;">
            <h2>Menu de Navigation</h2>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 20px;">
                <a href="/backtesting" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">🔬 Backtesting</a>
                <a href="/dashboard" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">🏠 Dashboard</a>
                <a href="/test" style="background: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">🧪 Test</a>
            </div>
        </div>
        
        <p style="margin-top: 40px; opacity: 0.8;">Ce fichier fait seulement 1 KB - facile à uploader!</p>
    </body>
    </html>
    """)

@app.get("/backtesting", response_class=HTMLResponse)
async def backtesting():
    return HTMLResponse("""
    <!DOCTYPE html>
    <html>
    <head><title>Backtesting Test</title></head>
    <body style="background: #764ba2; color: white; padding: 50px; font-family: Arial; text-align: center;">
        <h1>🔬 Page Backtesting Fonctionne!</h1>
        <p style="font-size: 18px; margin: 20px;">Si vous voyez cette page, le lien Backtesting marche!</p>
        <a href="/" style="color: white; background: #3b82f6; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">← Retour Accueil</a>
    </body>
    </html>
    """)

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard():
    return HTMLResponse("""
    <!DOCTYPE html>
    <html>
    <head><title>Dashboard Test</title></head>
    <body style="background: #10b981; color: white; padding: 50px; font-family: Arial; text-align: center;">
        <h1>🏠 Dashboard Fonctionne!</h1>
        <p style="font-size: 18px; margin: 20px;">La navigation marche parfaitement!</p>
        <a href="/" style="color: white; background: #3b82f6; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">← Retour Accueil</a>
    </body>
    </html>
    """)

@app.get("/test", response_class=HTMLResponse)
async def test():
    return HTMLResponse("""
    <!DOCTYPE html>
    <html>
    <head><title>Test Page</title></head>
    <body style="background: #f59e0b; color: white; padding: 50px; font-family: Arial; text-align: center;">
        <h1>🧪 Page Test OK!</h1>
        <p style="font-size: 18px; margin: 20px;">Tout fonctionne correctement!</p>
        <a href="/" style="color: white; background: #3b82f6; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">← Retour Accueil</a>
    </body>
    </html>
    """)
