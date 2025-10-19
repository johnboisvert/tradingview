@app.get("/heatmap", response_class=HTMLResponse)
async def heatmap_page():
    page = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Crypto Heatmap</title>""" + CSS + """
<style>
.heatmap-treemap{
    display:flex;
    flex-wrap:wrap;
    gap:4px;
    background:#0a0e1a;
    padding:8px;
    border-radius:16px;
    min-height:850px;
    box-shadow:inset 0 2px 8px rgba(0,0,0,0.3)
}

.crypto-tile{
    position:relative;
    display:flex;
    flex-direction:column;
    justify-content:center;
    align-items:center;
    text-align:center;
    padding:20px 15px;
    border-radius:8px;
    transition:all .3s ease;
    cursor:pointer;
    overflow:hidden;
    min-width:120px;
    min-height:100px;
    border:2px solid rgba(255,255,255,0.1);
    box-shadow:0 4px 12px rgba(0,0,0,0.4)
}

.crypto-tile:hover{
    transform:scale(1.05) translateY(-4px);
    box-shadow:0 12px 32px rgba(0,0,0,0.6);
    z-index:100;
    border:3px solid rgba(255,255,255,0.5)
}

.crypto-tile::before{
    content:'';
    position:absolute;
    top:0;
    left:0;
    right:0;
    bottom:0;
    background:linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%);
    opacity:0;
    transition:opacity .3s
}

.crypto-tile:hover::before{
    opacity:1
}

.tile-content{
    position:relative;
    z-index:1;
    width:100%;
    height:100%;
    display:flex;
    flex-direction:column;
    justify-content:center;
    align-items:center
}

.crypto-symbol{
    font-size:clamp(18px,2.5vw,32px);
    font-weight:900;
    color:#fff;
    margin-bottom:8px;
    text-shadow:2px 2px 4px rgba(0,0,0,0.8);
    letter-spacing:1px
}

.crypto-name{
    font-size:clamp(10px,1.2vw,14px);
    color:rgba(255,255,255,0.8);
    margin-bottom:8px;
    font-weight:500;
    text-shadow:1px 1px 2px rgba(0,0,0,0.6)
}

.crypto-price{
    font-size:clamp(13px,1.6vw,20px);
    color:rgba(255,255,255,0.95);
    margin-bottom:6px;
    font-weight:700;
    text-shadow:1px 1px 3px rgba(0,0,0,0.7)
}

.crypto-change{
    font-size:clamp(16px,2vw,26px);
    font-weight:900;
    color:#fff;
    text-shadow:2px 2px 4px rgba(0,0,0,0.8);
    padding:4px 10px;
    border-radius:6px;
    background:rgba(0,0,0,0.3);
    margin-top:4px
}

.crypto-marketcap{
    font-size:clamp(9px,1.1vw,13px);
    color:rgba(255,255,255,0.7);
    margin-top:8px;
    font-weight:600;
    text-shadow:1px 1px 2px rgba(0,0,0,0.6)
}

.stats-bar{
    display:grid;
    grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
    gap:20px;
    margin-bottom:25px
}

.stat-box{
    background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);
    padding:25px;
    border-radius:12px;
    border-left:5px solid #60a5fa;
    box-shadow:0 4px 12px rgba(0,0,0,0.3)
}

.stat-box .label{
    color:#94a3b8;
    font-size:14px;
    margin-bottom:10px;
    font-weight:600;
    text-transform:uppercase;
    letter-spacing:0.5px
}

.stat-box .value{
    font-size:38px;
    font-weight:800;
    color:#e2e8f0
}

.controls{
    display:flex;
    gap:12px;
    margin-bottom:25px;
    flex-wrap:wrap;
    justify-content:center
}

.controls button{
    padding:14px 26px;
    background:#334155;
    color:#e2e8f0;
    border:2px solid #475569;
    border-radius:10px;
    cursor:pointer;
    transition:all .3s;
    font-size:15px;
    font-weight:700;
    box-shadow:0 2px 8px rgba(0,0,0,0.2)
}

.controls button:hover{
    background:#475569;
    transform:translateY(-3px);
    box-shadow:0 4px 16px rgba(96,165,250,0.3)
}

.controls button.active{
    background:linear-gradient(135deg,#3b82f6,#60a5fa);
    border-color:#60a5fa;
    color:#fff;
    box-shadow:0 4px 16px rgba(96,165,250,0.5)
}

.spinner{
    border:5px solid #334155;
    border-top:5px solid #60a5fa;
    border-radius:50%;
    width:60px;
    height:60px;
    animation:spin 1s linear infinite;
    margin:40px auto
}

@keyframes spin{
    0%{transform:rotate(0deg)}
    100%{transform:rotate(360deg)}
}

.card{
    background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);
    padding:30px;
    border-radius:16px;
    margin-bottom:20px;
    border:1px solid #334155;
    box-shadow:0 8px 24px rgba(0,0,0,0.3)
}

.card h2{
    color:#60a5fa;
    margin-bottom:25px;
    font-size:28px;
    border-bottom:3px solid #334155;
    padding-bottom:12px;
    font-weight:800
}
</style>
</head>
<body><div class="container">
<div class="header"><h1>🔥 Crypto Heatmap</h1><p>Visualisation en temps réel - Taille = Market Cap</p></div>
""" + NAV + """
<div class="stats-bar">
<div class="stat-box"><div class="label">Total Cryptos</div><div class="value" id="total">0</div></div>
<div class="stat-box" style="border-left-color:#22c55e"><div class="label">En hausse</div><div class="value" style="color:#22c55e" id="gainers">0</div></div>
<div class="stat-box" style="border-left-color:#ef4444"><div class="label">En baisse</div><div class="value" style="color:#ef4444" id="losers">0</div></div>
<div class="stat-box" style="border-left-color:#a78bfa"><div class="label">Variation moyenne</div><div class="value" id="avg">0%</div></div>
</div>
<div class="card">
<h2>🌐 Top 100 Cryptomonnaies</h2>
<div class="controls">
<button class="active" onclick="updateView('24h')">📊 24 Heures</button>
<button onclick="updateView('7d')">📅 7 Jours</button>
<button onclick="loadData()">🔄 Actualiser</button>
</div>
<div id="heatmap-container" class="heatmap-treemap"><div class="spinner"></div></div>
</div>
</div>
<script>
let cryptosData=[];
let currentView='24h';

function getColorForChange(change){
if(change>15)return'linear-gradient(135deg,rgb(0,120,50),rgb(0,160,70))';
if(change>10)return'linear-gradient(135deg,rgb(0,140,60),rgb(0,180,80))';
if(change>5)return'linear-gradient(135deg,rgb(5,150,60),rgb(16,185,90))';
if(change>2)return'linear-gradient(135deg,rgb(16,185,100),rgb(34,197,110))';
if(change>0.5)return'linear-gradient(135deg,rgb(34,197,94),rgb(74,222,128))';
if(change>0)return'linear-gradient(135deg,rgb(74,222,128),rgb(134,239,172))';
if(change===0)return'linear-gradient(135deg,rgb(100,116,139),rgb(148,163,184))';
if(change>-0.5)return'linear-gradient(135deg,rgb(254,202,202),rgb(252,165,165))';
if(change>-2)return'linear-gradient(135deg,rgb(252,165,165),rgb(248,113,113))';
if(change>-5)return'linear-gradient(135deg,rgb(248,113,113),rgb(239,68,68))';
if(change>-10)return'linear-gradient(135deg,rgb(239,68,68),rgb(220,38,38))';
if(change>-15)return'linear-gradient(135deg,rgb(220,38,38),rgb(185,28,28))';
return'linear-gradient(135deg,rgb(185,28,28),rgb(153,27,27))';
}

function formatPrice(p){
if(p>=1000)return'$'+p.toLocaleString('en-US',{maximumFractionDigits:0});
if(p>=1)return'$'+p.toFixed(2);
if(p>=0.01)return'$'+p.toFixed(3);
return'$'+p.toFixed(5);
}

function formatMarketCap(mc){
if(mc>=1e12)return'$'+(mc/1e12).toFixed(2)+'T';
if(mc>=1e9)return'$'+(mc/1e9).toFixed(1)+'B';
if(mc>=1e6)return'$'+(mc/1e6).toFixed(0)+'M';
return'$'+mc.toLocaleString();
}

function calculateTileSize(marketCap,totalMarketCap,containerWidth){
const ratio=marketCap/totalMarketCap;
const baseSize=containerWidth*0.20;
const size=Math.sqrt(ratio)*containerWidth*1.1;
return Math.max(size,baseSize*0.4);
}

function renderTreemap(){
const container=document.getElementById('heatmap-container');
const containerWidth=container.offsetWidth||1200;
const totalMarketCap=cryptosData.reduce((sum,c)=>sum+c.market_cap,0);
let html='';

cryptosData.forEach(crypto=>{
const size=calculateTileSize(crypto.market_cap,totalMarketCap,containerWidth);
const color=getColorForChange(crypto.change_24h);
const changeSymbol=crypto.change_24h>=0?'▲':'▼';
const changeClass=crypto.change_24h>=0?'positive':'negative';

html+=`<div class="crypto-tile ${changeClass}" style="width:${size}px;height:${size*0.65}px;background:${color};flex-grow:${crypto.market_cap}">
<div class="tile-content">
<div class="crypto-symbol">${crypto.symbol}</div>
<div class="crypto-name">${crypto.name}</div>
<div class="crypto-price">${formatPrice(crypto.price)}</div>
<div class="crypto-change">${changeSymbol} ${Math.abs(crypto.change_24h).toFixed(2)}%</div>
<div class="crypto-marketcap">Cap: ${formatMarketCap(crypto.market_cap)}</div>
</div>
</div>`;
});

container.innerHTML=html;
updateStats();
}

function updateStats(){
const total=cryptosData.length;
const gainers=cryptosData.filter(c=>c.change_24h>0).length;
const losers=cryptosData.filter(c=>c.change_24h<0).length;
const avg=(cryptosData.reduce((s,c)=>s+c.change_24h,0)/total).toFixed(2);

document.getElementById('total').textContent=total;
document.getElementById('gainers').textContent=gainers;
document.getElementById('losers').textContent=losers;

const avgEl=document.getElementById('avg');
avgEl.textContent=(avg>0?'+':'')+avg+'%';
avgEl.style.color=avg>0?'#22c55e':avg<0?'#ef4444':'#94a3b8';
}

function updateView(view){
currentView=view;
document.querySelectorAll('.controls button').forEach(btn=>btn.classList.remove('active'));
event.target.classList.add('active');
}

async function loadData(){
try{
const response=await fetch('/api/heatmap');
if(!response.ok)throw new Error('Erreur API');
const data=await response.json();

if(data.cryptos&&data.cryptos.length>0){
cryptosData=data.cryptos.sort((a,b)=>b.market_cap-a.market_cap);
renderTreemap();
console.log('✅ Heatmap chargée:',cryptosData.length,'cryptos');
}else{
throw new Error('Aucune donnée');
}
}catch(error){
console.error('❌ Erreur:',error);
document.getElementById('heatmap-container').innerHTML=`
<div style="text-align:center;padding:50px;width:100%;color:#94a3b8">
<h3 style="color:#ef4444;margin-bottom:20px;font-size:24px">❌ Erreur de chargement</h3>
<p style="font-size:16px;margin-bottom:25px">Impossible de charger les données. ${error.message}</p>
<button onclick="loadData()" style="margin-top:20px;padding:15px 30px;background:linear-gradient(135deg,#3b82f6,#60a5fa);color:white;border:none;border-radius:10px;cursor:pointer;font-size:16px;font-weight:700;box-shadow:0 4px 16px rgba(96,165,250,0.4)">
🔄 Réessayer
</button>
</div>`;
}
}

let resizeTimeout;
window.addEventListener('resize',()=>{
clearTimeout(resizeTimeout);
resizeTimeout=setTimeout(()=>{
if(cryptosData.length>0)renderTreemap();
},250);
});

loadData();
setInterval(loadData,30000);
console.log('🚀 Heatmap initialisée');
</script>
</body></html>"""
    return HTMLResponse(page)
