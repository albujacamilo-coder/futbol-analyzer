// ── SUPABASE CONFIG ───────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://rhmrmrmvqwthhgihzvog.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobXJtcm12cXd0aGhnaWh6dm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1OTM4MjYsImV4cCI6MjA5ODE2OTgyNn0.5VkR9LsNQ4eG81Im5deV567qEN1iFLVTzAg3S3_6UXs';

// ── MODO ADMIN ────────────────────────────────────────────────────────────────
const ADMIN_SECRET = 'futbol2026admin';
const IS_ADMIN = new URLSearchParams(window.location.search).get('admin') === ADMIN_SECRET;

// ── SISTEMA DE ACCESO PREMIUM ─────────────────────────────────────────────────
// IS_PREMIUM: true si admin, si tiene código válido guardado, o si es modo preview
let IS_PREMIUM = IS_ADMIN;

// Verificar código guardado en localStorage al cargar
const SAVED_CODE = localStorage.getItem('fsp_access_code');
const SAVED_CODE_TYPE = localStorage.getItem('fsp_access_type');
const SAVED_CODE_EXPIRY = localStorage.getItem('fsp_access_expiry');

if(SAVED_CODE && SAVED_CODE_EXPIRY){
  const expiry = new Date(SAVED_CODE_EXPIRY);
  if(expiry > new Date()){
    IS_PREMIUM = true;
  } else {
    // Código expirado — limpiar
    localStorage.removeItem('fsp_access_code');
    localStorage.removeItem('fsp_access_type');
    localStorage.removeItem('fsp_access_expiry');
  }
}

// ── HELPER: fecha de expiración dinámica (30 días desde hoy) ──────────────────
// Se usa solo para el TEXTO del modal (marketing). El expiry REAL de cada
// código se define al insertarlo en Supabase (columna caduca_en).
// IMPORTANTE: al generar cada código (manual o automatizado en Fase 2),
// usa esta misma lógica de +30 días desde la fecha de compra para que el
// mensaje del modal y el acceso real siempre coincidan.
function calcExpiryLabel(days = 30) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

// Verificar código contra Supabase
async function verifyCode(code){
  try{
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/codigos_acceso?codigo=eq.${encodeURIComponent(code.toUpperCase().trim())}&select=*`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    );
    const rows = res.ok ? await res.json() : [];
    if(!rows.length) return { valid: false, msg: 'Código no encontrado. Verifica que esté bien escrito.' };
    const r = rows[0];
    if(r.caduca_en && new Date(r.caduca_en) < new Date()) return { valid: false, msg: 'Este código ha expirado.' };
    return { valid: true, tipo: r.tipo, caduca_en: r.caduca_en };
  } catch(e){
    return { valid: false, msg: 'Error de conexión. Intenta de nuevo.' };
  }
}

// Mostrar modal de ingreso de código
function showPremiumModal(){
  const existing = document.getElementById('premium-modal');
  if(existing) existing.remove();

  const expiryLabel = calcExpiryLabel(30);

  const html = `<div class="modal-box" style="max-width:400px">
    <div class="modal-hdr">
      <div style="text-align:center;width:100%">
        <div style="font-size:36px;margin-bottom:8px">🔐</div>
        <div class="modal-title">FútbolStats Pro</div>
        <div class="modal-sub" style="margin-top:4px">Desbloquea el análisis completo</div>
      </div>
      <button class="modal-close" onclick="document.getElementById('premium-modal').remove()" style="position:absolute;top:12px;right:12px">&#x2715;</button>
    </div>

    <!-- Tabla de beneficios -->
    <div class="modal-section" style="padding-top:0">
      <div style="background:#f9f9f9;border-radius:10px;padding:14px;margin-bottom:14px">
        <div style="font-size:11px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">Incluye acceso a:</div>
        ${[
          ['⚽','xG exacto, Half Time y Top 5 resultados'],
          ['📊','Over/Under todas las líneas'],
          ['🎯','BTTS y probabilidad primer gol'],
          ['📐','Análisis completo de corners'],
          ['🟨','Análisis completo de tarjetas'],
          ['🚨','Detector de partidos sorpresa'],
          ['👤','Perfil detallado de selecciones'],
          ['⚡','Comparador de equipos'],
          ['🏆','Tracker de aciertos del modelo'],
        ].map(([icon,text])=>`<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12px;color:#333">
          <span>${icon}</span><span>${text}</span>
        </div>`).join('')}
      </div>

      <!-- Proceso claro: comprar → esperar código → activar -->
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:14px;margin-bottom:14px">
        <div style="font-size:12px;font-weight:700;color:#1a5e34;margin-bottom:10px">¿Cómo obtener acceso?</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;gap:8px;align-items:flex-start">
            <span style="background:#1a5e34;color:#fff;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0">1</span>
            <span style="font-size:12px;color:#333">Compra el acceso — pago único $4.99, válido 30 días (hasta el ${expiryLabel})</span>
          </div>
          <div style="display:flex;gap:8px;align-items:flex-start">
            <span style="background:#1a5e34;color:#fff;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0">2</span>
            <span style="font-size:12px;color:#333">Recibe tu código de acceso por email en menos de 24 horas</span>
          </div>
          <div style="display:flex;gap:8px;align-items:flex-start">
            <span style="background:#1a5e34;color:#fff;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0">3</span>
            <span style="font-size:12px;color:#333">Ingresa el código aquí abajo y desbloquea todo</span>
          </div>
        </div>
        <a href="https://go.hotmart.com/P106533865R" target="_blank"
          style="display:block;text-align:center;margin-top:12px;padding:11px;background:#4caf50;color:#fff;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none">
          ⚡ Comprar acceso — $4.99 →
        </a>
      </div>

      <div style="text-align:center;font-size:11px;color:#aaa;margin-bottom:10px">— ¿ya tienes tu código? —</div>

      <input id="premium-code-input" type="text" placeholder="Ingresa tu código de acceso"
        style="width:100%;padding:12px;border:1.5px solid #ddd;border-radius:8px;font-size:14px;font-family:inherit;outline:none;text-align:center;text-transform:uppercase;letter-spacing:2px;box-sizing:border-box;margin-bottom:8px"
        onfocus="this.style.borderColor='#4caf50'" onblur="this.style.borderColor='#ddd'"
        onkeydown="if(event.key==='Enter') activatePremiumCode()">
      <div id="premium-code-msg" style="font-size:12px;color:#c00;margin-bottom:10px;min-height:16px;text-align:center"></div>
      <button id="premium-code-btn" onclick="activatePremiumCode()"
        style="width:100%;padding:12px;background:#111;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit;font-weight:500;margin-bottom:6px">
        Activar código →
      </button>
      <div style="text-align:center;font-size:11px;color:#aaa">¿Dudas? Escríbenos a <strong>futbolstatspro@gmail.com</strong></div>
    </div>
  </div>`;

  const overlay = document.createElement('div');
  overlay.id = 'premium-modal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);
  setTimeout(() => document.getElementById('premium-code-input').focus(), 100);
}

// Activar código ingresado
async function activatePremiumCode(){
  const input = document.getElementById('premium-code-input');
  const btn = document.getElementById('premium-code-btn');
  const msg = document.getElementById('premium-code-msg');
  const code = (input.value || '').trim().toUpperCase();

  if(!code){ msg.textContent = 'Ingresa tu código de acceso.'; return; }

  btn.textContent = 'Verificando...';
  btn.disabled = true;
  msg.textContent = '';

  const result = await verifyCode(code);

  if(result.valid){
    // Guardar en localStorage
    localStorage.setItem('fsp_access_code', code);
    localStorage.setItem('fsp_access_type', result.tipo||'premium');
    localStorage.setItem('fsp_access_expiry', result.caduca_en || '2027-01-01');
    // Recargar la página para aplicar acceso premium
    document.getElementById('premium-modal').remove();
    location.reload();
  } else {
    msg.textContent = result.msg;
    btn.textContent = 'Activar acceso →';
    btn.disabled = false;
    input.focus();
  }
}

// Mostrar banner premium en features bloqueadas
function premiumBanner(feature){
  return `<div style="text-align:center;padding:24px 16px;background:#f9f9f9;border-radius:10px;border:1.5px dashed #ddd;margin:12px 0">
    <div style="font-size:28px;margin-bottom:8px">🔐</div>
    <div style="font-size:14px;font-weight:600;color:#111;margin-bottom:6px">${feature}</div>
    <div style="font-size:12px;color:#888;margin-bottom:14px">Esta función es exclusiva de FútbolStats Pro</div>
    <button onclick="showPremiumModal()" style="padding:10px 20px;background:#111;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;font-family:inherit;font-weight:500">
      🔓 Activar acceso premium
    </button>
  </div>`;
}

// Cliente Supabase simplificado (sin librería externa)
const sb = {
  async getAll() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/resultados?select=*`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    return res.ok ? await res.json() : [];
  },
  async upsert(clave, goles_local, goles_visita, tipo = 'grupo') {
    // Primero buscar si existe
    const check = await fetch(
      `${SUPABASE_URL}/rest/v1/resultados?clave=eq.${encodeURIComponent(clave)}&select=id`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    );
    if(!check.ok){ console.warn('Supabase check falló:', check.status, await check.text().catch(()=>'')); return false; }
    const existing = await check.json();

    if (existing.length > 0) {
      // Update
      const res = await fetch(`${SUPABASE_URL}/rest/v1/resultados?clave=eq.${encodeURIComponent(clave)}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ goles_local, goles_visita, tipo })
      });
      if(!res.ok){ console.warn('Supabase PATCH falló para', clave, ':', res.status, await res.text().catch(()=>'')); return false; }
      return true;
    } else {
      // Insert
      const res = await fetch(`${SUPABASE_URL}/rest/v1/resultados`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clave, goles_local, goles_visita, tipo })
      });
      if(!res.ok){ console.warn('Supabase INSERT falló para', clave, ':', res.status, await res.text().catch(()=>'')); return false; }
      return true;
    }
  },
  async deleteAll() {
    await fetch(`${SUPABASE_URL}/rest/v1/resultados?id=gt.0`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
  }
};

// ── CARGAR RESULTADOS DESDE SUPABASE ─────────────────────────────────────────
async function loadFromSupabase() {
  try {
    const rows = await sb.getAll();
    if (!rows.length) return false;
    rows.forEach(r => {
      if (r.tipo === 'ko') {
        if (!KO_RR[r.clave]) KO_RR[r.clave] = [undefined, undefined];
        KO_RR[r.clave] = [r.goles_local, r.goles_visita];
      } else {
        RR[r.clave] = [r.goles_local, r.goles_visita];
      }
    });
    return true;
  } catch(e) {
    console.warn('Error cargando Supabase:', e);
    return false;
  }
}

// ── GUARDAR EN SUPABASE ───────────────────────────────────────────────────────
async function saveToSupabase(clave, goles_local, goles_visita, tipo = 'grupo') {
  try {
    return await sb.upsert(clave, goles_local, goles_visita, tipo);
  } catch(e) {
    console.warn('Error guardando en Supabase:', clave, e);
    return false;
  }
}

const GRP={A:["México","Sudáfrica","Corea del Sur","Chequia"],B:["Canadá","Qatar","Suiza","Bosnia"],C:["Brasil","Marruecos","Haití","Escocia"],D:["EE.UU.","Paraguay","Australia","Turquía"],E:["Alemania","Curazao","Costa de Marfil","Ecuador"],F:["Países Bajos","Japón","Túnez","Suecia"],G:["Bélgica","Egipto","Irán","Nueva Zelanda"],H:["España","Cabo Verde","Arabia Saudita","Uruguay"],I:["Francia","Senegal","Noruega","Iraq"],J:["Argentina","Argelia","Austria","Jordania"],K:["Portugal","Colombia","Uzbekistán","DR Congo"],L:["Inglaterra","Croacia","Ghana","Panamá"]};

const TD={
  "Argentina":{conf:"CONMEBOL",elo:2078,fifa:1886,titles:3,apps:18,gf:2.1,ga:0.8,form:0.82},
  "Brasil":{conf:"CONMEBOL",elo:2052,fifa:1781,titles:5,apps:22,gf:2.0,ga:0.9,form:0.74},
  "Colombia":{conf:"CONMEBOL",elo:1881,fifa:1610,titles:0,apps:6,gf:1.6,ga:1.1,form:0.71},
  "Uruguay":{conf:"CONMEBOL",elo:1854,fifa:1575,titles:2,apps:14,gf:1.5,ga:1.0,form:0.65},
  "Ecuador":{conf:"CONMEBOL",elo:1710,fifa:1438,titles:0,apps:4,gf:1.3,ga:1.3,form:0.60},
  "Paraguay":{conf:"CONMEBOL",elo:1651,fifa:1376,titles:0,apps:8,gf:1.1,ga:1.2,form:0.55},
  "España":{conf:"UEFA",elo:2038,fifa:1834,titles:1,apps:16,gf:2.0,ga:0.7,form:0.83},
  "Francia":{conf:"UEFA",elo:2031,fifa:1823,titles:2,apps:16,gf:1.9,ga:0.8,form:0.80},
  "Inglaterra":{conf:"UEFA",elo:1989,fifa:1792,titles:1,apps:17,gf:1.8,ga:0.9,form:0.76},
  "Portugal":{conf:"UEFA",elo:1961,fifa:1764,titles:0,apps:8,gf:1.9,ga:1.0,form:0.75},
  "Alemania":{conf:"UEFA",elo:1953,fifa:1757,titles:4,apps:20,gf:1.8,ga:1.0,form:0.72},
  "Países Bajos":{conf:"UEFA",elo:1940,fifa:1745,titles:0,apps:11,gf:1.8,ga:0.9,form:0.74},
  "Noruega":{conf:"UEFA",elo:1912,fifa:1718,titles:0,apps:3,gf:1.8,ga:1.0,form:0.72},
  "Croacia":{conf:"UEFA",elo:1890,fifa:1698,titles:0,apps:6,gf:1.5,ga:0.9,form:0.70},
  "Bélgica":{conf:"UEFA",elo:1912,fifa:1718,titles:0,apps:14,gf:1.7,ga:1.0,form:0.67},
  "Suiza":{conf:"UEFA",elo:1851,fifa:1659,titles:0,apps:11,gf:1.4,ga:1.0,form:0.65},
  "Austria":{conf:"UEFA",elo:1862,fifa:1670,titles:0,apps:7,gf:1.5,ga:1.1,form:0.66},
  "Turquía":{conf:"UEFA",elo:1814,fifa:1622,titles:0,apps:2,gf:1.4,ga:1.2,form:0.62},
  "Chequia":{conf:"UEFA",elo:1774,fifa:1580,titles:0,apps:3,gf:1.3,ga:1.2,form:0.57},
  "Suecia":{conf:"UEFA",elo:1804,fifa:1612,titles:0,apps:12,gf:1.4,ga:1.1,form:0.62},
  "Bosnia":{conf:"UEFA",elo:1682,fifa:1488,titles:0,apps:1,gf:1.1,ga:1.3,form:0.50},
  "Escocia":{conf:"UEFA",elo:1759,fifa:1565,titles:0,apps:8,gf:1.2,ga:1.2,form:0.56},
  "México":{conf:"CONCACAF",elo:1843,fifa:1651,titles:0,apps:17,gf:1.5,ga:1.2,form:0.64},
  "EE.UU.":{conf:"CONCACAF",elo:1834,fifa:1642,titles:0,apps:11,gf:1.5,ga:1.1,form:0.68},
  "Canadá":{conf:"CONCACAF",elo:1812,fifa:1620,titles:0,apps:1,gf:1.4,ga:1.2,form:0.66},
  "Haití":{conf:"CONCACAF",elo:1514,fifa:1320,titles:0,apps:1,gf:0.9,ga:1.6,form:0.40},
  "Panamá":{conf:"CONCACAF",elo:1604,fifa:1410,titles:0,apps:1,gf:1.0,ga:1.4,form:0.48},
  "Curazao":{conf:"CONCACAF",elo:1492,fifa:1298,titles:0,apps:0,gf:0.8,ga:1.7,form:0.38},
  "Japón":{conf:"AFC",elo:1916,fifa:1724,titles:0,apps:7,gf:1.5,ga:1.0,form:0.74},
  "Corea del Sur":{conf:"AFC",elo:1848,fifa:1655,titles:0,apps:11,gf:1.3,ga:1.1,form:0.62},
  "Irán":{conf:"AFC",elo:1792,fifa:1598,titles:0,apps:6,gf:1.2,ga:1.2,form:0.58},
  "Arabia Saudita":{conf:"AFC",elo:1766,fifa:1572,titles:0,apps:6,gf:1.1,ga:1.3,form:0.56},
  "Australia":{conf:"AFC",elo:1752,fifa:1558,titles:0,apps:6,gf:1.1,ga:1.3,form:0.55},
  "Uzbekistán":{conf:"AFC",elo:1674,fifa:1480,titles:0,apps:0,gf:0.9,ga:1.4,form:0.48},
  "Qatar":{conf:"AFC",elo:1544,fifa:1350,titles:0,apps:1,gf:0.8,ga:1.6,form:0.42},
  "Iraq":{conf:"AFC",elo:1712,fifa:1518,titles:0,apps:1,gf:1.0,ga:1.4,form:0.51},
  "Jordania":{conf:"AFC",elo:1562,fifa:1368,titles:0,apps:0,gf:0.9,ga:1.5,form:0.44},
  "Marruecos":{conf:"CAF",elo:1902,fifa:1710,titles:0,apps:7,gf:1.4,ga:0.9,form:0.72},
  "Senegal":{conf:"CAF",elo:1851,fifa:1658,titles:0,apps:3,gf:1.3,ga:1.0,form:0.65},
  "Egipto":{conf:"CAF",elo:1791,fifa:1598,titles:0,apps:3,gf:1.2,ga:1.1,form:0.62},
  "Costa de Marfil":{conf:"CAF",elo:1754,fifa:1560,titles:0,apps:3,gf:1.2,ga:1.2,form:0.60},
  "Ghana":{conf:"CAF",elo:1692,fifa:1498,titles:0,apps:4,gf:1.0,ga:1.3,form:0.52},
  "Sudáfrica":{conf:"CAF",elo:1656,fifa:1462,titles:0,apps:3,gf:0.9,ga:1.4,form:0.48},
  "Túnez":{conf:"CAF",elo:1642,fifa:1448,titles:0,apps:6,gf:0.9,ga:1.3,form:0.47},
  "Argelia":{conf:"CAF",elo:1714,fifa:1520,titles:0,apps:4,gf:1.1,ga:1.2,form:0.55},
  "DR Congo":{conf:"CAF",elo:1584,fifa:1390,titles:0,apps:1,gf:0.9,ga:1.5,form:0.44},
  "Cabo Verde":{conf:"CAF",elo:1536,fifa:1342,titles:0,apps:0,gf:0.8,ga:1.6,form:0.42},
  "Nueva Zelanda":{conf:"OFC",elo:1552,fifa:1358,titles:0,apps:2,gf:0.9,ga:1.6,form:0.45}
};

const HOME={México:0.15,"EE.UU.":0.15,"Canadá":0.15};

// ── ÍNDICE DE CORNERS (1-10) ──────────────────────────────────────────────────
// Basado en estilo de juego histórico: posesión por bandas, presión alta,
// juego directo. Fuente: promedios mundiales y Euros históricos.
// Alto (7-10): equipos de posesión y ataque por bandas
// Medio (5-6): equilibrados
// Bajo (2-4): defensivos/reactivos o sin historia suficiente
const CORNER_IDX = {
  "Argentina":    8.2,  // posesión + presión alta, muchos corners históricos
  "Brasil":       8.5,  // ataque por bandas, posesión dominante
  "Colombia":     6.8,  // ofensivo pero menos sistemático
  "Uruguay":      5.8,  // defensivo-sólido, menos corners generados
  "Ecuador":      5.2,  // equilibrado, estilo directo
  "Paraguay":     5.0,  // defensivo, contra-ataque
  "España":       9.0,  // posesión extrema, muchos corners en cada torneo
  "Francia":      7.8,  // potencia ofensiva + presión alta
  "Inglaterra":   7.5,  // directo + set-pieces, muy orientado a corners
  "Portugal":     7.2,  // ofensivo, Ronaldo-era heredado
  "Alemania":     7.8,  // presión alta, ataque sistemático
  "Países Bajos": 8.0,  // posesión + ataque en banda
  "Noruega":      6.5,  // directo, físico
  "Croacia":      6.8,  // técnico, posesión media
  "Bélgica":      7.0,  // ofensivo, juego por bandas
  "Suiza":        6.2,  // organizado, no muy ofensivo
  "Austria":      6.5,  // presión media-alta
  "Turquía":      6.3,  // transiciones, no mucho de corners
  "Chequia":      6.0,  // equilibrado
  "Suecia":       6.8,  // físico, set-pieces fuertes
  "Bosnia":       5.5,  // directo, defensivo
  "Escocia":      6.5,  // físico, directo, histórico en corners
  "México":       6.5,  // técnico, moderado en corners
  "EE.UU.":       6.8,  // físico, presión alta
  "Canadá":       6.0,  // físico, directo
  "Haití":        4.0,  // defensivo, pocos recursos ofensivos
  "Panamá":       4.5,  // defensivo, bloque bajo
  "Curazao":      3.8,  // sin historial mundialista
  "Japón":        7.2,  // técnico, posesión, muchos corners históricos
  "Corea del Sur":6.5,  // presión alta, técnico
  "Irán":         5.2,  // defensivo, organizado
  "Arabia Saudita":4.8, // transiciones, no corners
  "Australia":    5.8,  // físico, directo
  "Uzbekistán":   5.0,  // sin historial
  "Qatar":        4.2,  // defensivo, poco ofensivo
  "Iraq":         4.8,  // defensivo, limitado
  "Jordania":     4.5,  // defensivo
  "Marruecos":    6.8,  // organizado, presión media, Qatar 2022 sorpresa
  "Senegal":      6.2,  // físico, técnico
  "Egipto":       5.5,  // defensivo, contra-ataque
  "Costa de Marfil":6.0,// físico, técnico
  "Ghana":        5.8,  // técnico, físico
  "Sudáfrica":    5.0,  // físico, directo
  "Túnez":        5.2,  // organizado, defensivo
  "Argelia":      5.5,  // técnico, moderado
  "DR Congo":     4.8,  // físico, limitado
  "Cabo Verde":   4.2,  // sin historial mundialista
  "Nueva Zelanda":4.5   // defensivo, sin mucha presión
};

// ── CÁLCULO xCorners (Poisson) ───────────────────────────────────────────────
// BASE_C: promedio de corners por equipo en mundiales históricos (~5 por equipo)
// El lambda de cada equipo = BASE_C * (idx_ataque / 5.5) * (idx_defensivo_rival / 5.5)
// idx_defensivo = 10 - CORNER_IDX[rival] (un equipo muy ofensivo concede más corners al rival)
const BASE_C = 5.0;

function cornerCalc(ta, tb) {
  const ia = CORNER_IDX[ta] || 5.5;
  const ib = CORNER_IDX[tb] || 5.5;
  // Corners generados por A dependen de su ataque y la defensiva de B
  // Equipo muy ofensivo (alto idx) defiende menos → concede más corners al rival
  const defA = (10 - ia) / 5.5; // qué tan bien defiende A (evita corners propios)
  const defB = (10 - ib) / 5.5;
  const la = Math.max(1.5, BASE_C * (ia / 5.5) * defB);
  const lb = Math.max(1.5, BASE_C * (ib / 5.5) * defA);
  return [+la.toFixed(2), +lb.toFixed(2)];
}

// Probabilidad acumulada Over X con Poisson
function poissonOver(lambda, line) {
  // P(X > line) = 1 - P(X <= floor(line))
  const k = Math.floor(line);
  let cumul = 0;
  for (let i = 0; i <= k; i++) cumul += pPmf(i, lambda);
  return Math.max(0, Math.min(1, 1 - cumul));
}

// Genera tabla de O/U para una línea dada
function cornerOUTable(lambda, lines) {
  return lines.map(line => {
    const pOver  = poissonOver(lambda, line);
    const pUnder = 1 - pOver;
    return { line, pOver: +pOver.toFixed(3), pUnder: +pUnder.toFixed(3) };
  });
}

// ── ÍNDICE DE AGRESIVIDAD (tarjetas) ─────────────────────────────────────────
// Escala 1-10 basada en historial de tarjetas en competiciones internacionales
// Alto (7-10): equipos físicos, presión alta, historial de muchas tarjetas
// Medio (4-6): equilibrados
// Bajo (1-3): disciplinados, técnicos
const CARD_IDX = {
  "Argentina":     7.8,  // historial muy agresivo, CONMEBOL
  "Brasil":        7.2,  // físico, presión alta
  "Colombia":      7.5,  // uno de los más agresivos de CONMEBOL
  "Uruguay":       8.0,  // históricamente muy agresivo
  "Ecuador":       6.5,  // moderado
  "Paraguay":      7.0,  // físico, directo
  "España":        6.0,  // técnico pero presión alta genera tarjetas
  "Francia":       6.2,  // físico y técnico
  "Inglaterra":    6.5,  // físico, Premier League style
  "Portugal":      6.0,  // técnico, moderado
  "Alemania":      5.5,  // organizado, pocas tarjetas innecesarias
  "Países Bajos":  6.2,  // físico, presión alta
  "Noruega":       6.0,  // físico, directo
  "Croacia":       6.5,  // duro, Champions League style
  "Bélgica":       6.0,  // técnico-físico
  "Suiza":         5.0,  // muy organizado, disciplinado
  "Austria":       5.8,  // moderado
  "Turquía":       7.0,  // históricamente agresivo
  "Chequia":       5.5,  // moderado
  "Suecia":        5.8,  // físico pero disciplinado
  "Bosnia":        6.5,  // físico, directo
  "Escocia":       6.8,  // físico, Premier style
  "México":        6.8,  // CONCACAF, físico
  "EE.UU.":        6.0,  // moderno, menos tarjetas
  "Canadá":        6.2,  // físico, en desarrollo
  "Haití":         6.5,  // físico, limitado técnicamente
  "Panamá":        7.0,  // físico, defensivo agresivo
  "Curazao":       6.0,  // sin historial suficiente
  "Japón":         4.0,  // uno de los más disciplinados del mundo
  "Corea del Sur": 5.5,  // moderno, menos tarjetas que antes
  "Irán":          6.8,  // físico, defensivo agresivo
  "Arabia Saudita":6.5,  // físico
  "Australia":     6.0,  // moderado
  "Uzbekistán":    6.2,  // sin historial suficiente
  "Qatar":         6.0,  // moderado
  "Iraq":          7.0,  // físico, agresivo
  "Jordania":      6.5,  // físico
  "Marruecos":     6.5,  // Qatar 2022 mostró ser físico
  "Senegal":       6.8,  // físico, CAF style
  "Egipto":        6.5,  // físico
  "Costa de Marfil":7.0, // físico, CAF
  "Ghana":         6.8,  // físico
  "Sudáfrica":     6.5,  // físico
  "Túnez":         6.2,  // moderado
  "Argelia":       6.5,  // físico
  "DR Congo":      7.0,  // físico, CAF
  "Cabo Verde":    6.0,  // sin historial
  "Nueva Zelanda": 5.0   // disciplinado, OFC
};

// BASE_T: promedio de tarjetas por equipo en mundiales (~2.2 por equipo por partido)
const BASE_T = 2.0;

function cardCalc(ta, tb){
  const ia = CARD_IDX[ta] || 6.0;
  const ib = CARD_IDX[tb] || 6.0;
  // Tarjetas generadas también dependen de la agresividad del rival
  // Partido entre dos equipos agresivos → más tarjetas totales
  const la = Math.max(0.5, BASE_T * (ia / 6.0) * (0.7 + 0.3 * ib / 6.0));
  const lb = Math.max(0.5, BASE_T * (ib / 6.0) * (0.7 + 0.3 * ia / 6.0));
  return [+la.toFixed(2), +lb.toFixed(2)];
}

// ── HTML SECCIÓN CORNERS EN MODAL ────────────────────────────────────────────
function cornersModalHtml(ta, tb) {
  const [la, lb] = cornerCalc(ta, tb);
  const total = +(la + lb).toFixed(2);

  const globalLines  = [5.5, 6.5, 7.5, 8.5, 9.5, 10.5];
  const teamLines    = [2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5];

  const globalOU = cornerOUTable(total, globalLines);
  const ouA      = cornerOUTable(la,    teamLines);
  const ouB      = cornerOUTable(lb,    teamLines);

  // Fila de tabla O/U
  function ouRow(r, isGlobal) {
    const hiOver  = r.pOver  >= (isGlobal ? 0.55 : 0.55);
    const hiUnder = r.pUnder >= (isGlobal ? 0.55 : 0.55);
    return '<tr>'
      + '<td><strong>' + r.line + '</strong></td>'
      + '<td class="' + (hiOver  ? 'td-hi-g' : '') + '"><strong>' + Math.round(r.pOver  * 100) + '%</strong></td>'
      + '<td class="' + (hiUnder ? 'td-hi-r' : '') + '"><strong>' + Math.round(r.pUnder * 100) + '%</strong></td>'
      + '</tr>';
  }

  function teamCornerBlock(name, lambda, ouRows) {
    return '<div class="ou-team-block">'
      + '<div class="ou-team-name">' + name.split(' ')[0] + ' <span style="font-size:10px;color:#888;font-weight:400">λ=' + lambda + '</span></div>'
      + '<table class="ou-team-table">'
      + '<thead><tr><th>Línea</th><th>Over</th><th>Under</th></tr></thead>'
      + '<tbody>' + ouRows.map(r => ouRow(r, false)).join('') + '</tbody>'
      + '</table></div>';
  }

  return [
    '<div class="modal-section">',
      '<div class="modal-sec-title">⚽ Análisis de Corners</div>',

      // Resumen xCorners
      '<div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;background:#f5f5f5;border-radius:8px;padding:10px 14px;margin-bottom:10px">',
        '<div style="text-align:right">',
          '<div style="font-size:16px;font-weight:700;color:#111">' + la + '</div>',
          '<div style="font-size:10px;color:#888">λ corners ' + ta.split(' ')[0] + '</div>',
        '</div>',
        '<div style="text-align:center">',
          '<div style="font-size:10px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.05em">Total esp.</div>',
          '<div style="font-size:20px;font-weight:700;color:#111">' + total + '</div>',
        '</div>',
        '<div style="text-align:left">',
          '<div style="font-size:16px;font-weight:700;color:#111">' + lb + '</div>',
          '<div style="font-size:10px;color:#888">λ corners ' + tb.split(' ')[0] + '</div>',
        '</div>',
      '</div>',

      // Global O/U
      '<div style="font-size:10px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px">Over / Under — Partido completo</div>',
      '<div class="ou-btts"><div class="ou-row" style="flex-wrap:wrap;gap:4px">',
        globalOU.map(r => {
          const hi = r.pOver >= 0.55;
          return '<div class="ou-item' + (hi ? ' ou-hi' : '') + '" style="min-width:60px">'
            + '<div class="ou-val">' + Math.round(r.pOver * 100) + '%</div>'
            + '<div class="ou-lbl">O' + r.line + '</div>'
            + '</div>';
        }).join(''),
      '</div></div>',
      '<div class="ou-btts" style="margin-top:5px"><div class="ou-row" style="flex-wrap:wrap;gap:4px">',
        globalOU.map(r => {
          const hi = r.pUnder >= 0.55;
          return '<div class="ou-item' + (hi ? ' ou-hi' : '') + '" style="min-width:60px">'
            + '<div class="ou-val">' + Math.round(r.pUnder * 100) + '%</div>'
            + '<div class="ou-lbl">U' + r.line + '</div>'
            + '</div>';
        }).join(''),
      '</div></div>',

      // Por equipo
      '<div style="font-size:10px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:.04em;margin:10px 0 6px">Over / Under — Por equipo</div>',
      '<div class="ou-teams-grid">',
        teamCornerBlock(ta, la, ouA),
        teamCornerBlock(tb, lb, ouB),
      '</div>',

      '<div style="font-size:10px;color:#aaa;margin-top:8px;font-style:italic">* λ = corners esperados calculados con Poisson según índice de estilo de juego histórico</div>',
    '</div>'
  ].join('');
}

const MATCH_DATES = {
  "México|Sudáfrica":"2026-06-11","Corea del Sur|Chequia":"2026-06-11",
  "Chequia|Sudáfrica":"2026-06-18","México|Corea del Sur":"2026-06-18",
  "Chequia|México":"2026-06-24","Sudáfrica|Corea del Sur":"2026-06-24",
  "Canadá|Bosnia":"2026-06-12","Qatar|Suiza":"2026-06-13",
  "Suiza|Bosnia":"2026-06-18","Canadá|Qatar":"2026-06-18",
  "Suiza|Canadá":"2026-06-24","Bosnia|Qatar":"2026-06-24",
  "Brasil|Marruecos":"2026-06-13","Haití|Escocia":"2026-06-13",
  "Escocia|Marruecos":"2026-06-19","Brasil|Haití":"2026-06-19",
  "Escocia|Brasil":"2026-06-24","Marruecos|Haití":"2026-06-24",
  "EE.UU.|Paraguay":"2026-06-12","Australia|Turquía":"2026-06-13",
  "EE.UU.|Australia":"2026-06-19","Turquía|Paraguay":"2026-06-19",
  "Turquía|EE.UU.":"2026-06-25","Paraguay|Australia":"2026-06-25",
  "Alemania|Curazao":"2026-06-14","Costa de Marfil|Ecuador":"2026-06-14",
  "Alemania|Costa de Marfil":"2026-06-20","Ecuador|Curazao":"2026-06-20",
  "Curazao|Costa de Marfil":"2026-06-25","Ecuador|Alemania":"2026-06-25",
  "Países Bajos|Japón":"2026-06-14","Suecia|Túnez":"2026-06-14",
  "Países Bajos|Suecia":"2026-06-20","Túnez|Japón":"2026-06-20",
  "Japón|Suecia":"2026-06-25","Túnez|Países Bajos":"2026-06-25",
  "Bélgica|Egipto":"2026-06-15","Irán|Nueva Zelanda":"2026-06-15",
  "Bélgica|Irán":"2026-06-21","Nueva Zelanda|Egipto":"2026-06-21",
  "Egipto|Irán":"2026-06-26","Nueva Zelanda|Bélgica":"2026-06-26",
  "España|Cabo Verde":"2026-06-15","Arabia Saudita|Uruguay":"2026-06-15",
  "España|Arabia Saudita":"2026-06-21","Uruguay|Cabo Verde":"2026-06-21",
  "Cabo Verde|Arabia Saudita":"2026-06-26","Uruguay|España":"2026-06-26",
  "Francia|Senegal":"2026-06-16","Iraq|Noruega":"2026-06-16",
  "Francia|Iraq":"2026-06-22","Noruega|Senegal":"2026-06-22",
  "Noruega|Francia":"2026-06-26","Senegal|Iraq":"2026-06-26",
  "Argentina|Argelia":"2026-06-16","Austria|Jordania":"2026-06-16",
  "Argentina|Austria":"2026-06-22","Jordania|Argelia":"2026-06-22",
  "Argelia|Austria":"2026-06-27","Jordania|Argentina":"2026-06-27",
  "Portugal|DR Congo":"2026-06-17","Uzbekistán|Colombia":"2026-06-17",
  "Portugal|Uzbekistán":"2026-06-23","Colombia|DR Congo":"2026-06-23",
  "Colombia|Portugal":"2026-06-27","DR Congo|Uzbekistán":"2026-06-27",
  "Inglaterra|Croacia":"2026-06-17","Ghana|Panamá":"2026-06-17",
  "Inglaterra|Ghana":"2026-06-23","Panamá|Croacia":"2026-06-23",
  // ── Ronda de 32 — Calendario oficial FIFA 2026 ──
  "M73":"2026-06-28",  // Sudáfrica vs Canadá ✅
  "M74":"2026-06-29",  // Alemania vs Paraguay
  "M75":"2026-06-29",  // Países Bajos vs Marruecos
  "M76":"2026-06-29",  // Brasil vs Japón
  "M77":"2026-06-30",  // Costa de Marfil vs Noruega
  "M78":"2026-06-30",  // Francia vs Suecia
  "M79":"2026-06-30",  // México vs Ecuador
  "M80":"2026-07-01",  // Inglaterra vs DR Congo
  "M81":"2026-07-01",  // Bélgica vs Senegal
  "M82":"2026-07-01",  // EE.UU. vs Bosnia
  "M83":"2026-07-02",  // España vs Austria
  "M84":"2026-07-02",  // Suiza vs Argelia
  "M85":"2026-07-02",  // Portugal vs Croacia
  "M86":"2026-07-03",  // Argentina vs Cabo Verde
  "M87":"2026-07-03",  // Colombia vs Ghana
  "M88":"2026-07-03",  // Australia vs Egipto
  // ── Octavos (M89-M96) ──
  "M89":"2026-07-04","M90":"2026-07-04",
  "M91":"2026-07-05","M92":"2026-07-05",
  "M93":"2026-07-06","M94":"2026-07-06",
  "M95":"2026-07-07","M96":"2026-07-07",
  // ── Cuartos (M97-M100) ──
  "M97":"2026-07-09","M98":"2026-07-09",
  "M99":"2026-07-10","M100":"2026-07-10",
  // ── Semis (M101-M102) ──
  "M101":"2026-07-14","M102":"2026-07-15",
  // ── Final (M104) ──
  "M104":"2026-07-19"
};

function getMatchDate(ta,tb){ return MATCH_DATES[ta+'|'+tb]||MATCH_DATES[tb+'|'+ta]||null; }
function getMatchDateById(id){ return MATCH_DATES[id]||null; }
function isMatchPast(ta,tb){
  const d=getMatchDate(ta,tb); if(!d) return false;
  const today=new Date(); today.setHours(23,59,59,0);
  return new Date(d+'T00:00:00')<=today;
}
function isMatchPastById(id){
  const d=getMatchDateById(id); if(!d) return false;
  const today=new Date(); today.setHours(23,59,59,0);
  return new Date(d+'T00:00:00')<=today;
}
function isSuspiciousScore(ga,gb){
  if(ga<0||gb<0) return '❌ Marcador negativo';
  if(ga>10||gb>10) return '⚠️ Marcador muy alto (>10)';
  if(ga+gb>14) return '⚠️ Demasiados goles en total';
  return null;
}

const BASE=1.45,KAP=0.4,RHO=0.13,SIGMA=0.05,NSIMS=5000;
let STR={},RR={},KO_RR={},MCP={},GS={},BD=null,PD=[],CRF='all';

function initStr(){
  for(const[n,d] of Object.entries(TD)){
    const en=(d.elo-1400)/(2100-1400),fn=(d.fifa-1200)/(1900-1200);
    const tb=Math.min(d.titles*0.04,0.15),ab=Math.min(d.apps*0.005,0.08);
    STR[n]=Math.max(0.05,Math.min(0.98,0.40*en+0.25*fn+0.20*d.form+0.10*tb+0.05*ab+(HOME[n]||0)));
  }
}

function bayesUpd(){
  const u={...STR},ts={};
  for(const[k,r] of Object.entries(RR)){
    if(r[0]===undefined||r[1]===undefined) continue;
    const[ta,tb]=k.split('|'); const ga=r[0],gb=r[1];
    [ta,tb].forEach((t,i)=>{
      if(!ts[t]) ts[t]={pts:0,gf:0,ga:0,played:0};
      const s=ts[t]; s.played++;
      s.gf+=i===0?ga:gb; s.ga+=i===0?gb:ga;
      if((i===0&&ga>gb)||(i===1&&gb>ga)) s.pts+=3;
      else if(ga===gb) s.pts+=1;
    });
  }
  for(const[n,s] of Object.entries(ts)){
    if(!s.played) continue;
    const perf=0.60*(s.pts/s.played/3)+0.40*Math.max(0,Math.min(1,((s.gf-s.ga)/s.played+3)/6));
    const w=Math.min(0.30*s.played,0.60);
    u[n]=Math.max(0.05,Math.min(0.98,(1-w)*STR[n]+w*perf));
  }
  return u;
}

function ap(sa,sb){ return 1+KAP*Math.pow(Math.abs(sa-sb),2); }
function dcF(i,j,la,lb){
  if(i===0&&j===0) return Math.max(1-la*lb*RHO,0.01);
  if(i===1&&j===0) return 1+lb*RHO;
  if(i===0&&j===1) return 1+la*RHO;
  if(i===1&&j===1) return Math.max(1-RHO,0.01);
  return 1;
}
function pPmf(k,l){ if(k<0||l<=0)return 0; let lp=-l+k*Math.log(l); for(let i=2;i<=k;i++)lp-=Math.log(i); return Math.exp(lp); }
function pRng(l){ const L=Math.exp(-l); let k=0,p=1; do{k++;p*=Math.random();}while(p>L); return k-1; }
function xgCalc(ta,tb,u){
  const sa=u[ta]||STR[ta],sb=u[tb]||STR[tb];
  const da=TD[ta],db=TD[tb],af=ap(sa,sb);
  const la=Math.max(BASE*(da.gf/1.5)*(db.ga/1.5)*(1+0.3*(sa-sb))*af,0.3);
  const lb=Math.max(BASE*(db.gf/1.5)*(da.ga/1.5)*(1+0.3*(sb-sa))*af,0.3);
  return[la,lb];
}
function xgR(v){ return v>=0.75?Math.round(v):0; }
function matchAnal(ta,tb,u){
  const[la,lb]=xgCalc(ta,tb,u);
  let wa=0,wd=0,wb=0;
  let p_over25=0,p_under25=0,p_btts=0,p_no_btts=0,p_over15=0,p_over35=0;
  const MAT_SIZE=10;
  const mat=[];
  for(let i=0;i<MAT_SIZE;i++){
    mat[i]=[];
    for(let j=0;j<MAT_SIZE;j++){
      const p=pPmf(i,la)*pPmf(j,lb)*dcF(i,j,la,lb);
      mat[i][j]=p;
      if(i>j)wa+=p; else if(i===j)wd+=p; else wb+=p;
      const total=i+j;
      if(total>2.5) p_over25+=p; else p_under25+=p;
      if(total>1.5) p_over15+=p;
      if(total>3.5) p_over35+=p;
      if(i>=1&&j>=1) p_btts+=p; else p_no_btts+=p;
    }
  }
  const tot=wa+wd+wb;
  const matSum=p_over25+p_under25;
  const bttsSum=p_btts+p_no_btts;
  const htA=+(la*0.45).toFixed(2),htB=+(lb*0.45).toFixed(2);
  return{
    la:+la.toFixed(2),lb:+lb.toFixed(2),
    pw_a:+(wa/tot).toFixed(3),pd:+(wd/tot).toFixed(3),pw_b:+(wb/tot).toFixed(3),
    xgRA:xgR(la),xgRB:xgR(lb),xgRStr:`${xgR(la)}-${xgR(lb)}`,
    htA,htB,htRA:xgR(htA),htRB:xgR(htB),
    winner:wa>=wb?ta:tb,
    p_over25:+(p_over25/matSum).toFixed(3),p_under25:+(p_under25/matSum).toFixed(3),
    p_over15:+(p_over15/matSum).toFixed(3),p_over35:+(p_over35/matSum).toFixed(3),
    p_btts:+(p_btts/bttsSum).toFixed(3),p_no_btts:+(p_no_btts/bttsSum).toFixed(3),
    xg_total:+(la+lb).toFixed(2)
  };
}
function simMatch(ta,tb,u,ko=false){
  const[la,lb]=xgCalc(ta,tb,u); let ga=0,gb=0;
  for(let t=0;t<25;t++){ ga=pRng(la); gb=pRng(lb); if(Math.random()*1.3<=dcF(ga,gb,la,lb)) break; }
  if(ko&&ga===gb){
    const sa=u[ta]||STR[ta],sb=u[tb]||STR[tb];
    return Math.random()<Math.max(0.3,Math.min(0.7,0.5+0.1*(sa-sb)))?ta:tb;
  }
  return ga>gb?ta:(gb>ga?tb:'draw');
}
function getResult(fx,ta,tb){
  const k1=ta+'|'+tb,k2=tb+'|'+ta;
  if(fx[k1]&&fx[k1][0]!==undefined&&fx[k1][1]!==undefined) return{ga:fx[k1][0],gb:fx[k1][1]};
  if(fx[k2]&&fx[k2][0]!==undefined&&fx[k2][1]!==undefined) return{ga:fx[k2][1],gb:fx[k2][0]};
  return null;
}
function simGrp(ms,u,fx){
  const s={}; ms.forEach(m=>{s[m]={pts:0,gf:0,ga:0};});
  for(let i=0;i<ms.length;i++) for(let j=i+1;j<ms.length;j++){
    const ta=ms[i],tb=ms[j];
    let ga,gb,w;
    const real=getResult(fx,ta,tb);
    if(real){ ga=real.ga; gb=real.gb; w=ga>gb?ta:(gb>ga?tb:'draw'); }
    else{
      const[la,lb]=xgCalc(ta,tb,u);
      for(let t=0;t<25;t++){ ga=pRng(la); gb=pRng(lb); if(Math.random()*1.3<=dcF(ga,gb,la,lb)) break; }
      w=ga>gb?ta:(gb>ga?tb:'draw');
    }
    s[ta].gf+=ga; s[ta].ga+=gb; s[tb].gf+=gb; s[tb].ga+=ga;
    if(w===ta)s[ta].pts+=3; else if(w===tb)s[tb].pts+=3; else{s[ta].pts+=1;s[tb].pts+=1;}
  }
  return Object.entries(s).sort((a,b)=>(b[1].pts-a[1].pts)||((b[1].gf-b[1].ga)-(a[1].gf-a[1].ga))||(b[1].gf-a[1].gf)).map(([n,d])=>({name:n,...d}));
}

// Mapeo directo: cada slot KO recibe el 3er lugar de un grupo específico
// según las reglas oficiales FIFA de combinaciones para R32 2026
const THIRD_SLOT_GROUPS={
  "M74":"D", // Alemania (E1) vs 3°D = Paraguay
  "M78":"F", // Francia (I1) vs 3°F = Suecia
  "M79":"E", // México (A1) vs 3°E = Ecuador
  "M80":"K", // Inglaterra (L1) vs 3°K = DR Congo
  "M81":"I", // Bélgica (G1) vs 3°I = Senegal
  "M82":"B", // EE.UU. (D1) vs 3°B = Bosnia
  "M84":"J", // Suiza (B1) vs 3°J = Argelia
  "M87":"L", // Colombia (K1) vs 3°L = Ghana
};
function assignThirds(gr){
  // Tercer lugar de cada grupo, ordenados de mejor a peor
  const thirds=[];
  for(const g of Object.keys(GRP)){
    const row=gr[g][2];
    thirds.push({name:row.name,group:g,pts:row.pts,gd:row.gf-row.ga,gf:row.gf});
  }
  thirds.sort((a,b)=>(b.pts-a.pts)||(b.gd-a.gd)||(b.gf-a.gf));
  const best8groups=new Set(thirds.slice(0,8).map(t=>t.group));

  const asgn={};
  // PASO 1: asignación directa — si el grupo deseado del slot calificó, se usa directo
  for(const mid of Object.keys(THIRD_SLOT_GROUPS)){
    const wantedGroup=THIRD_SLOT_GROUPS[mid];
    if(best8groups.has(wantedGroup)){
      const t=thirds.find(x=>x.group===wantedGroup);
      asgn[mid]=t.name;
    }
  }
  // PASO 2: para slots cuyo grupo NO calificó, usar el mejor tercero que SÍ calificó y aún no fue asignado
  const usedGroups=new Set(Object.values(asgn).map(name=>thirds.find(t=>t.name===name)?.group));
  const leftoverThirds=thirds.filter(t=>best8groups.has(t.group)&&!usedGroups.has(t.group));
  for(const mid of Object.keys(THIRD_SLOT_GROUPS)){
    if(!asgn[mid]&&leftoverThirds.length){
      const t=leftoverThirds.shift();
      asgn[mid]=t.name;
      usedGroups.add(t.group);
    }
  }
  const allThirdNames=thirds.filter(t=>best8groups.has(t.group)).map(t=>t.name);
  return{asgn,all:allThirdNames};
}

function simTournament(u,fx){
  const rnd={}; Object.keys(TD).forEach(t=>{rnd[t]=0;});
  const gr={};
  for(const[g,ms] of Object.entries(GRP)){ gr[g]=simGrp(ms,u,fx); gr[g].slice(0,2).forEach(t=>{rnd[t.name]=1;}); }
  const{asgn,all}=assignThirds(gr);
  all.forEach(n=>{rnd[n]=1;});
  const pos=(g,r)=>gr[g][r].name,g3=mid=>asgn[mid]||all[0];
  const r32=[[pos("A",1),pos("B",1)],[pos("E",0),g3("M74")],[pos("F",0),pos("C",1)],[pos("C",0),pos("F",1)],[pos("E",1),pos("I",1)],[pos("I",0),g3("M78")],[pos("A",0),g3("M79")],[pos("L",0),g3("M80")],[pos("G",0),g3("M81")],[pos("D",0),g3("M82")],[pos("H",0),pos("J",1)],[pos("B",0),g3("M84")],[pos("K",1),pos("L",1)],[pos("J",0),pos("H",1)],[pos("K",0),g3("M87")],[pos("D",1),pos("G",1)]];
  function pko(pairs,r){ return pairs.map(([a,b])=>{ const w=simMatch(a,b,u,true); rnd[w]=r; return w; }); }
  const w32=pko(r32,2);
  const r16=[[w32[1],w32[5]],[w32[0],w32[2]],[w32[3],w32[4]],[w32[6],w32[7]],[w32[10],w32[12]],[w32[8],w32[9]],[w32[13],w32[15]],[w32[11],w32[14]]];
  const w16=pko(r16,3);
  const qf=[[w16[0],w16[1]],[w16[4],w16[5]],[w16[2],w16[3]],[w16[6],w16[7]]];
  const wq=pko(qf,4);
  const wsf=pko([[wq[0],wq[1]],[wq[2],wq[3]]],5);
  pko([[wsf[0],wsf[1]]],6);
  return rnd;
}
function calcProbs(u,fx){
  const mc={}; Object.keys(TD).forEach(t=>{mc[t]=[0,0,0,0,0,0,0];});
  for(let s=0;s<NSIMS;s++){ const r=simTournament(u,fx); for(const[t,r2] of Object.entries(r)) mc[t][r2]++; }
  const p={};
  for(const[t,c] of Object.entries(mc)){
    const tot=c.reduce((a,b)=>a+b,0);
    p[t]={
      p_group:+(c.slice(1).reduce((a,b)=>a+b)/tot*100).toFixed(1),
      p_r32:+(c.slice(2).reduce((a,b)=>a+b)/tot*100).toFixed(1),
      p_r16:+(c.slice(3).reduce((a,b)=>a+b)/tot*100).toFixed(1),
      p_qf:+(c.slice(4).reduce((a,b)=>a+b)/tot*100).toFixed(1),
      p_sf:+(c.slice(5).reduce((a,b)=>a+b)/tot*100).toFixed(1),
      p_final:+(c.slice(6).reduce((a,b)=>a+b)/tot*100).toFixed(1),
      p_champ:+(c[6]/tot*100).toFixed(1)
    };
  }
  return p;
}
function calcGS(u,fx){ const gs={}; for(const[g,ms] of Object.entries(GRP)) gs[g]=simGrp(ms,u,fx); return gs; }
function calcBD(u){
  const gr=GS; const{asgn,all}=assignThirds(gr);
  const pos=(g,r)=>gr[g][r],g3=mid=>({name:asgn[mid]||all[0]||''});
  const kofx=getKOFx();
  function det(ta,tb,mid){
    const a=matchAnal(ta,tb,u);
    // Si el partido ya tiene resultado real, usar el ganador real (considerando penales)
    if(mid&&kofx[mid]){
      const r=kofx[mid];
      const realWinner=getKOWinner(mid,ta,tb,r[0],r[1]);
      if(realWinner) a.winner=realWinner;
    }
    return{ta,tb,...a};
  }
  const p=pos,g=g3;
  // R32 oficial FIFA 2026 — emparejamientos reales confirmados
  const r32=[
    {id:"M73",...det(p("A",1).name,p("B",1).name,"M73")},        // Sudáfrica (A2) vs Canadá (B2)
    {id:"M74",...det(p("E",0).name,g("M74").name,"M74")},          // Alemania (E1) vs Paraguay (3°D)
    {id:"M75",...det(p("F",0).name,p("C",1).name,"M75")},          // Países Bajos (F1) vs Marruecos (C2)
    {id:"M76",...det(p("C",0).name,p("F",1).name,"M76")},          // Brasil (C1) vs Japón (F2)
    {id:"M77",...det(p("E",1).name,p("I",1).name,"M77")},          // Costa de Marfil (E2) vs Noruega (I2)
    {id:"M78",...det(p("I",0).name,g("M78").name,"M78")},          // Francia (I1) vs Suecia (3°F)
    {id:"M79",...det(p("A",0).name,g("M79").name,"M79")},          // México (A1) vs Ecuador (3°E)
    {id:"M80",...det(p("L",0).name,g("M80").name,"M80")},          // Inglaterra (L1) vs DR Congo (3°K)
    {id:"M81",...det(p("G",0).name,g("M81").name,"M81")},          // Bélgica (G1) vs Senegal (3°I)
    {id:"M82",...det(p("D",0).name,g("M82").name,"M82")},          // EE.UU. (D1) vs Bosnia (3°B)
    {id:"M83",...det(p("H",0).name,p("J",1).name,"M83")},          // España (H1) vs Austria (J2)
    {id:"M84",...det(p("B",0).name,g("M84").name,"M84")},          // Suiza (B1) vs Argelia (3°J)
    {id:"M85",...det(p("K",1).name,p("L",1).name,"M85")},          // Portugal (K2) vs Croacia (L2)
    {id:"M86",...det(p("J",0).name,p("H",1).name,"M86")},          // Argentina (J1) vs Cabo Verde (H2)
    {id:"M87",...det(p("K",0).name,g("M87").name,"M87")},          // Colombia (K1) vs Ghana (3°L)
    {id:"M88",...det(p("D",1).name,p("G",1).name,"M88")},          // Australia (D2) vs Egipto (G2)
  ];
  const w32=r32.map(m=>m.winner);
  function mk(pairs,ids){ return pairs.map(([a,b],i)=>({id:ids[i],...det(a,b,ids[i])})); }
  const r16=mk([[w32[1],w32[5]],[w32[0],w32[2]],[w32[3],w32[4]],[w32[6],w32[7]],[w32[10],w32[12]],[w32[8],w32[9]],[w32[13],w32[15]],[w32[11],w32[14]]],["M89","M90","M91","M92","M93","M94","M95","M96"]);
  const w16=r16.map(m=>m.winner);
  const qf=mk([[w16[0],w16[1]],[w16[4],w16[5]],[w16[2],w16[3]],[w16[6],w16[7]]],["M97","M98","M99","M100"]);
  const wq=qf.map(m=>m.winner);
  const sf=mk([[wq[0],wq[1]],[wq[2],wq[3]]],["M101","M102"]);
  const ws=sf.map(m=>m.winner);
  return{r32,r16,qf,sf,fin:mk([[ws[0],ws[1]]],["M104"])[0]};
}
function buildPD(u,fx){
  const data=[];
  for(const[g,ms] of Object.entries(GRP)){
    for(let i=0;i<ms.length;i++) for(let j=i+1;j<ms.length;j++){
      const ta=ms[i],tb=ms[j];
      const a=matchAnal(ta,tb,u);
      const real=getResult(fx,ta,tb);
      const played=real!==null;
      const realArr=played?[real.ga,real.gb]:null;
      data.push({round:'grupos',rl:`Grupo ${g}`,ta,tb,...a,played,real:realArr});
    }
  }
  if(BD){
    const kofx=getKOFx();
    const rnds=[{k:'r32',l:'Ronda de 32'},{k:'r16',l:'Octavos de final'},{k:'qf',l:'Cuartos de final'},{k:'sf',l:'Semifinales'}];
    rnds.forEach(({k,l})=>{
      (BD[k]||[]).forEach(m=>{
        const a=matchAnal(m.ta,m.tb,u);
        const real=kofx[m.id];
        const played=!!real;
        data.push({round:k,rl:l,ta:m.ta,tb:m.tb,...a,played,real:played?[real[0],real[1]]:null,matchId:m.id});
      });
    });
    if(BD.fin){
      const m=BD.fin;
      const a=matchAnal(m.ta,m.tb,u);
      const real=kofx[m.id];
      const played=!!real;
      data.push({round:'final',rl:'Gran Final · 19 jul',ta:m.ta,tb:m.tb,...a,played,real:played?[real[0],real[1]]:null,matchId:m.id});
    }
  }
  return data;
}

// ── RENDER BRACKET ────────────────────────────────────────────────────────────
function renderBrMatch(m,isFinal=false){
  const wA=m.winner===m.ta,wB=m.winner===m.tb;
  const pA=(MCP[m.ta]?.p_champ||0).toFixed(1),pB=(MCP[m.tb]?.p_champ||0).toFixed(1);
  const maxP=Math.max(m.pw_a,m.pd,m.pw_b);
  const hiA=m.pw_a===maxP,hiD=m.pd===maxP&&!hiA,hiB=m.pw_b===maxP&&!hiA&&!hiD;
  if(isFinal){
    return`<div class="br-final">
      <div class="br-final-hdr">
        <span class="br-final-title">🏆 ${m.id} — Gran Final · 19 jul · MetLife Stadium</span>
        <span style="font-size:11px;color:#888">Nueva Jersey, EE.UU.</span>
      </div>
      <div class="br-final-body">
        <div class="br-final-teams">
          <div class="br-final-a">
            <div class="br-final-name${wA?' fw':''}">${m.ta}</div>
            <div class="br-final-pch${wA?' fw':''}">${pA}% campeón</div>
          </div>
          <div class="br-final-score">
            <div class="br-final-score-big">${m.xgRStr}</div>
            <div class="br-final-score-lbl">xG redondeado</div>
          </div>
          <div class="br-final-b">
            <div class="br-final-name${wB?' fw':''}">${m.tb}</div>
            <div class="br-final-pch${wB?' fw':''}">${pB}% campeón</div>
          </div>
        </div>
        <div class="br-final-xg">
          <div class="br-final-xg-a"><div class="br-final-xg-row">
            <div class="br-final-xg-val">${m.la} <span style="font-size:11px;color:#888">xG exacto</span></div>
            <div class="br-final-xg-sub">${m.htA} HT exacto · <strong>${m.htRA}</strong> HT rond.</div>
          </div></div>
          <div class="br-final-xg-mid"><div class="br-final-xg-mid-lbl">vs</div></div>
          <div class="br-final-xg-b"><div class="br-final-xg-row">
            <div class="br-final-xg-val"><span style="font-size:11px;color:#888">xG exacto</span> ${m.lb}</div>
            <div class="br-final-xg-sub">${m.htRB} HT rond. · ${m.htB} HT exacto</div>
          </div></div>
        </div>
        <div class="br-final-probs">
          <div class="br-final-prob${hiA?' fhi':''}"><div class="fpv">${(m.pw_a*100).toFixed(0)}%</div><div class="fpl">Gana ${m.ta.split(' ')[0]}</div></div>
          <div class="br-final-prob${hiD?' fhi':''}"><div class="fpv">${(m.pd*100).toFixed(0)}%</div><div class="fpl">Empate</div></div>
          <div class="br-final-prob${hiB?' fhi':''}"><div class="fpv">${(m.pw_b*100).toFixed(0)}%</div><div class="fpl">Gana ${m.tb.split(' ')[0]}</div></div>
        </div>
      </div>
    </div>`;
  }
  return`<div class="br-match">
    <div class="br-match-top">
      <span class="br-match-id">${m.id}</span>
      <span style="display:flex;gap:5px;align-items:center">
        <span class="br-badge ${m.p_over25>=0.5?'br-badge-hi':'br-badge-lo'}">O2.5 ${(m.p_over25*100).toFixed(0)}%</span>
        <span class="br-badge ${m.p_btts>=0.5?'br-badge-btts':'br-badge-lo'}">BTTS ${(m.p_btts*100).toFixed(0)}%</span>
      </span>
    </div>
    <div class="br-match-body">
      <div class="br-teams">
        <div class="br-team-a">
          <div class="br-team-name${wA?' br-winner':''}">${m.ta}</div>
          <div class="br-team-prob${wA?' br-winner-prob':''}">${pA}% cam.</div>
        </div>
        <div class="br-score-center">
          <div class="br-score-main">${m.xgRStr}</div>
          <div class="br-score-label">xG rond.</div>
        </div>
        <div class="br-team-b">
          <div class="br-team-name${wB?' br-winner':''}">${m.tb}</div>
          <div class="br-team-prob${wB?' br-winner-prob':''}">${pB}% cam.</div>
        </div>
      </div>
      <div class="br-probs">
        <div class="br-prob${hiA?' br-prob-hi':''}"><div class="bpv">${(m.pw_a*100).toFixed(0)}%</div><div class="bpl">Gana</div></div>
        <div class="br-prob${hiD?' br-prob-hi':''}"><div class="bpv">${(m.pd*100).toFixed(0)}%</div><div class="bpl">Empate</div></div>
        <div class="br-prob${hiB?' br-prob-hi':''}"><div class="bpv">${(m.pw_b*100).toFixed(0)}%</div><div class="bpl">Gana</div></div>
      </div>
      <div class="br-xg-strip">
        <div class="br-xg-a"><div class="br-xg-col">
          <div class="br-xg-val">${m.la} <span style="font-size:9px;color:#aaa">xG</span></div>
          <div class="br-xg-ht">${m.htRA} <span style="opacity:.6">(${m.htA})</span> HT</div>
        </div></div>
        <div class="br-xg-sep"><div class="br-xg-sep-lbl">xG · HT</div></div>
        <div class="br-xg-b"><div class="br-xg-col" style="align-items:flex-start">
          <div class="br-xg-val"><span style="font-size:9px;color:#aaa">xG</span> ${m.lb}</div>
          <div class="br-xg-ht">HT ${m.htRB} <span style="opacity:.6">(${m.htB})</span></div>
        </div></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
        <span class="br-badge ${m.p_over25>=0.5?'br-badge-hi':'br-badge-lo'}" style="font-size:12px;padding:4px 10px">Over 2.5: ${(m.p_over25*100).toFixed(0)}%</span>
        <span class="br-badge ${m.p_under25>0.5?'br-badge-lo':'br-badge-hi'}" style="font-size:12px;padding:4px 10px">Under 2.5: ${(m.p_under25*100).toFixed(0)}%</span>
        <span class="br-badge ${m.p_btts>=0.5?'br-badge-btts':'br-badge-lo'}" style="font-size:12px;padding:4px 10px">BTTS: ${(m.p_btts*100).toFixed(0)}%</span>
        <span class="br-badge br-badge-lo" style="font-size:12px;padding:4px 10px">No BTTS: ${(m.p_no_btts*100).toFixed(0)}%</span>
        <span class="br-badge br-badge-lo" style="font-size:12px;padding:4px 10px">Over 1.5: ${(m.p_over15*100).toFixed(0)}%</span>
        <span class="br-badge br-badge-lo" style="font-size:12px;padding:4px 10px">Over 3.5: ${(m.p_over35*100).toFixed(0)}%</span>
      </div>
    </div>
  </div>`;
}
function renderBracket(){
  const cont=document.getElementById('brcont');
  if(!BD){ cont.innerHTML='<div class="infobox">Actualiza el modelo para ver el bracket.</div>'; return; }

  const ko=getKOFx();
  let activePhase='r32';

  function getWinner(m){
    if(!m||!m.ta) return null;
    const r=ko[m.id];
    if(r&&r[0]!==undefined){
      const realW=getKOWinner(m.id,m.ta,m.tb,r[0],r[1]);
      return realW||m.winner;
    }
    return m.winner;
  }

  function matchCard(m){
    if(!m||!m.ta) return'';
    const r=ko[m.id];
    const hasResult=r&&r[0]!==undefined;
    const winner=getWinner(m);
    const wA=winner===m.ta, wB=winner===m.tb;
    const pA=(m.pw_a*100).toFixed(0), pB=(m.pw_b*100).toFixed(0);
    const pChampA=(MCP[m.ta]?.p_champ||0).toFixed(1);
    const pChampB=(MCP[m.tb]?.p_champ||0).toFixed(1);

    return`<div style="background:#fff;border:1px solid #e8e8e8;border-radius:10px;overflow:hidden;margin-bottom:8px">
      <div style="padding:6px 12px;background:#f9f9f9;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:10px;color:#aaa;font-weight:500">${m.id}</span>
        <span style="font-size:10px;color:${hasResult?'#1a5e34':'#aaa'};font-weight:${hasResult?'600':'400'}">${hasResult?'✅ Jugado':'⏳ Pendiente'}</span>
      </div>

      <!-- Equipo A -->
      <div style="display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #f5f5f5;background:${wA?'#f0fdf4':'#fff'}">
        <div>
          <div style="font-size:13px;font-weight:${wA?'700':'400'};color:${wA?'#1a5e34':'#333'}">${m.ta}</div>
          <div style="font-size:10px;color:#aaa;margin-top:1px">${pChampA}% campeón</div>
        </div>
        <div style="font-size:11px;color:#888;text-align:right">${hasResult?'':pA+'% ganar'}</div>
        <div style="font-size:18px;font-weight:700;color:${wA?'#1a5e34':'#ccc'};min-width:20px;text-align:center">${hasResult?r[0]:'—'}</div>
      </div>

      <!-- Equipo B -->
      <div style="display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:8px;padding:10px 12px;background:${wB?'#f0fdf4':'#fff'}">
        <div>
          <div style="font-size:13px;font-weight:${wB?'700':'400'};color:${wB?'#1a5e34':'#333'}">${m.tb}</div>
          <div style="font-size:10px;color:#aaa;margin-top:1px">${pChampB}% campeón</div>
        </div>
        <div style="font-size:11px;color:#888;text-align:right">${hasResult?'':pB+'% ganar'}</div>
        <div style="font-size:18px;font-weight:700;color:${wB?'#1a5e34':'#ccc'};min-width:20px;text-align:center">${hasResult?r[1]:'—'}</div>
      </div>
    </div>`;
  }

  const phases=[
    {id:'r32', label:'R32', matches:BD.r32, date:'28 jun – 3 jul'},
    {id:'r16', label:'Octavos', matches:BD.r16, date:'4 – 7 jul'},
    {id:'qf',  label:'Cuartos', matches:BD.qf,  date:'9 – 11 jul'},
    {id:'sf',  label:'Semis',   matches:BD.sf,   date:'14 – 15 jul'},
    {id:'fin', label:'🏆 Final', matches:[BD.fin], date:'19 jul'},
  ];

  function renderPhase(phaseId){
    const phase=phases.find(p=>p.id===phaseId);
    if(!phase) return;

    // Actualizar tabs
    phases.forEach(p=>{
      const btn=document.getElementById('br-tab-'+p.id);
      if(!btn) return;
      const active=p.id===phaseId;
      btn.style.borderBottom=active?'2px solid #111':'2px solid transparent';
      btn.style.color=active?'#111':'#888';
      btn.style.fontWeight=active?'600':'400';
      btn.style.background=active?'#fff':'transparent';
    });

    // Render partidos
    const grid=document.getElementById('br-grid');
    if(!grid) return;

    // Final especial
    if(phaseId==='fin'){
      const m=BD.fin;
      const r=ko[m.id];
      const hasResult=r&&r[0]!==undefined;
      const winner=getWinner(m);
      grid.innerHTML=`
        <div style="max-width:400px;margin:0 auto">
          <div style="text-align:center;padding:16px 0 8px;font-size:12px;color:#888">19 jul · MetLife Stadium · Nueva Jersey</div>
          ${matchCard(m)}
          ${winner?`<div style="text-align:center;margin-top:12px">
            <div style="display:inline-flex;align-items:center;gap:8px;background:#1a5e34;color:#fff;padding:10px 20px;border-radius:10px;font-size:14px;font-weight:700">
              🏆 Campeón: ${winner}
            </div>
            <div style="font-size:11px;color:#aaa;margin-top:6px">${(MCP[winner]?.p_champ||0).toFixed(1)}% de probabilidad según el modelo</div>
          </div>`:''}
        </div>`;
      return;
    }

    const cols = phaseId==='r32' ? 2 : phaseId==='r16' ? 2 : 1;
    const matches=phase.matches;

    if(cols===2){
      const half=Math.ceil(matches.length/2);
      const left=matches.slice(0,half);
      const right=matches.slice(half);
      grid.innerHTML=`
        <div style="font-size:11px;color:#888;margin-bottom:8px;text-align:center">${phase.date} · ${matches.length} partidos</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>${left.map(matchCard).join('')}</div>
          <div>${right.map(matchCard).join('')}</div>
        </div>`;
    } else {
      grid.innerHTML=`
        <div style="font-size:11px;color:#888;margin-bottom:8px;text-align:center">${phase.date} · ${matches.length} partidos</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${matches.map(matchCard).join('')}
        </div>`;
    }
  }

  // Tabs
  const tabsHtml=`<div style="display:flex;border-bottom:1px solid #e0e0e0;background:#fafafa;margin-bottom:12px;overflow-x:auto">
    ${phases.map(p=>`<button id="br-tab-${p.id}" onclick="window._brPhase('${p.id}')"
      style="flex:1;padding:10px 8px;font-size:12px;font-weight:400;border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent;color:#888;font-family:inherit;white-space:nowrap;min-width:60px">
      ${p.label}
    </button>`).join('')}
  </div>
  <div id="br-grid"></div>`;

  cont.innerHTML=tabsHtml;

  // Función global para cambiar fase
  window._brPhase=function(id){
    activePhase=id;
    renderPhase(id);
  };

  // Mostrar R32 por defecto o la fase más avanzada con partidos
  const hasR16=BD.r16.some(m=>ko[m.id]);
  const hasQF=BD.qf.some(m=>ko[m.id]);
  const hasSF=BD.sf.some(m=>ko[m.id]);
  const hasFin=ko[BD.fin.id];
  const defaultPhase=hasFin?'fin':hasSF?'sf':hasQF?'qf':hasR16?'r16':'r32';
  renderPhase(defaultPhase);
}

// ── RENDER PARTIDOS ───────────────────────────────────────────────────────────
function renderPCard(m){
  const maxP=Math.max(m.pw_a,m.pd,m.pw_b);
  const hiA=m.pw_a===maxP,hiD=m.pd===maxP&&!hiA,hiB=m.pw_b===maxP&&!hiA&&!hiD;
  const wA=m.winner===m.ta,wB=m.winner===m.tb;
  const pCa=(MCP[m.ta]?.p_champ||0).toFixed(1);
  const pCb=(MCP[m.tb]?.p_champ||0).toFixed(1);
  const scoreMain=m.real?`<span style="color:#1a5e34">${m.real[0]}-${m.real[1]}</span>`:m.xgRStr;
  const scoreLbl=m.real?'real':'xG rond.';
  const modalKey=(m.ta+'|'+m.tb).replace(/['"]/g,'');

  // ── UPSET DETECTOR ──
  // Hay upset potencial si el underdog (equipo con menos probabilidad de ganar)
  // tiene ≥30% de chance de ganar — señal de partido parejo o sorpresa posible
  const favWinP = Math.max(m.pw_a, m.pw_b);
  const undWinP = Math.min(m.pw_a, m.pw_b);
  const underdogTeam = m.pw_b > m.pw_a ? m.tb : m.ta;
  const isUpset = !m.played && undWinP >= 0.30 && favWinP < 0.60;
  const upsetBadge = isUpset
    ? `<span style="font-size:10px;font-weight:600;background:#fef3c7;color:#92400e;border:1px solid #fcd34d;border-radius:5px;padding:2px 7px;white-space:nowrap">🚨 Posible sorpresa</span>`
    : '';

  return`<div class="pcard${m.played?' played-card':''}">
    <div class="pcard-hdr">
      <span>${m.rl}</span>
      <span style="display:flex;align-items:center;gap:5px">${upsetBadge}${m.played?'✅ Jugado':'⏳ Pendiente'}</span>
    </div>
    <div class="pcard-body">
      <div class="teams-row">
        <div class="team-a-n${wA?' fav':''}" onclick="openTeamProfile('${m.ta}')" style="cursor:pointer">${m.ta}<br><span class="team-sub">${pCa}% cam.</span></div>
        <div class="sbox${wA||wB?' fs':''}">${scoreMain}<span class="slbl">${scoreLbl}</span></div>
        <div class="team-b-n${wB?' fav':''}" onclick="openTeamProfile('${m.tb}')" style="cursor:pointer">${m.tb}<br><span class="team-sub">${pCb}% cam.</span></div>
      </div>
      <div class="probs-row">
        <div class="pbox${hiA?' hi':''}"><div class="pv">${(m.pw_a*100).toFixed(0)}%</div><div class="pl">Gana ${m.ta.split(' ')[0]}</div></div>
        <div class="pbox${hiD?' hi':''}"><div class="pv">${(m.pd*100).toFixed(0)}%</div><div class="pl">Empate</div></div>
        <div class="pbox${hiB?' hi':''}"><div class="pv">${(m.pw_b*100).toFixed(0)}%</div><div class="pl">Gana ${m.tb.split(' ')[0]}</div></div>
      </div>
      ${IS_PREMIUM ? `<div class="quick-strip">
        <div class="qs-xg-pill">
          <div class="qs-xg-team">
            <span class="qs-xg-name">${m.ta.split(' ')[0]}</span>
            <span class="qs-xg-num">${m.la}</span>
          </div>
          <div class="qs-xg-mid">
            <span class="qs-xg-label">xG</span>
            <span class="qs-xg-total-val">Total ${m.xg_total}</span>
          </div>
          <div class="qs-xg-team qs-xg-team-r">
            <span class="qs-xg-name">${m.tb.split(' ')[0]}</span>
            <span class="qs-xg-num">${m.lb}</span>
          </div>
        </div>
        <div class="qs-pills-row">
          <div class="qs-pill ${m.p_over25>=0.5?'qs-pill-blue':'qs-pill-gray'}">
            <span class="qs-pill-lbl">O2.5</span>
            <span class="qs-pill-val">${(m.p_over25*100).toFixed(0)}%</span>
          </div>
          <div class="qs-pill qs-pill-gray">
            <span class="qs-pill-lbl">U2.5</span>
            <span class="qs-pill-val">${(m.p_under25*100).toFixed(0)}%</span>
          </div>
          <div class="qs-pill ${m.p_btts>=0.5?'qs-pill-green':'qs-pill-gray'}">
            <span class="qs-pill-lbl">BTTS</span>
            <span class="qs-pill-val">${(m.p_btts*100).toFixed(0)}%</span>
          </div>
          <div class="qs-pill ${m.p_over15>=0.7?'qs-pill-blue':'qs-pill-gray'}">
            <span class="qs-pill-lbl">O1.5</span>
            <span class="qs-pill-val">${(m.p_over15*100).toFixed(0)}%</span>
          </div>
        </div>
      </div>` : `<div style="margin:8px 0;padding:10px 12px;background:#f9f9f9;border-radius:8px;border:1px dashed #ddd;display:flex;align-items:center;justify-content:space-between;gap:8px">
        <div style="font-size:11px;color:#888">
          🔐 <strong style="color:#111">xG · O/U · BTTS · Corners · Tarjetas</strong> disponibles en Premium
        </div>
        <button onclick="showPremiumModal()" style="padding:5px 10px;background:#111;color:#fff;border:none;border-radius:6px;font-size:11px;cursor:pointer;font-family:inherit;white-space:nowrap;font-weight:500">Ver más →</button>
      </div>`}
      <button class="expand-btn" onclick="${IS_PREMIUM ? `openMatchModal('${modalKey}')` : 'showPremiumModal()'}">
        <span class="expand-label">${IS_PREMIUM ? 'Ver análisis completo' : '🔐 Desbloquear análisis completo'}</span>
        <span class="expand-icon">↗</span>
      </button>
    </div>
  </div>`;
}

// ── FIX: _PCARDS ahora es un objeto indexado por clave "ta|tb" ──
function renderPartidos(){
  const cont=document.getElementById('pcont');
  const today=new Date();
  today.setHours(0,0,0,0);
  const tomorrow=new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
  const todayStr=today.toISOString().split('T')[0];
  const tomorrowStr=tomorrow.toISOString().split('T')[0];

  // Partidos de hoy
  const todayMatches=PD.filter(m=>{
    const d=getMatchDate(m.ta,m.tb);
    return d===todayStr;
  });

  // Si no hay hoy, partidos de mañana
  const nextMatches=PD.filter(m=>{
    const d=getMatchDate(m.ta,m.tb);
    return d===tomorrowStr;
  });

  // Ordenar por interés: sorpresas primero, luego más parejos
  function interestScore(m){
    const undP=Math.min(m.pw_a,m.pw_b);
    const isUpset=undP>=0.30&&Math.max(m.pw_a,m.pw_b)<0.60;
    return isUpset?1:undP; // sorpresas arriba, luego más parejos
  }
  const todaySorted=[...todayMatches].sort((a,b)=>interestScore(b)-interestScore(a));
  const nextSorted=[...nextMatches].sort((a,b)=>interestScore(b)-interestScore(a));

  // Búsqueda: filtrar por equipo o por partido (ej: "brasil marruecos" o "brasil vs marruecos")
  const sq=SEARCH_Q.toLowerCase().trim().replace(/\bvs\b/g,'').trim();
  const sqParts=sq.split(/\s+/).filter(Boolean);

  function matchesSearch(m){
    if(!sq) return true;
    const ta=m.ta.toLowerCase(), tb=m.tb.toLowerCase();
    // Si hay dos términos, ambos deben estar en el partido (en cualquier orden)
    if(sqParts.length>=2){
      return sqParts.every(p=>ta.includes(p)||tb.includes(p));
    }
    // Un solo término: busca en cualquier equipo
    return ta.includes(sq)||tb.includes(sq);
  }

  // Partidos filtrados por fase y búsqueda
  const fd=(CRF==='all'?PD:PD.filter(m=>m.round===CRF)).filter(matchesSearch);

  if(!PD.length){ cont.innerHTML='<div class="infobox">No hay partidos todavía. Actualiza el modelo primero.</div>'; return; }

  window._PCARDS={};
  PD.forEach(m=>{ window._PCARDS[m.ta+'|'+m.tb]=m; });

  let html='';

  function todayMatchRow(m){
    const isUpset=Math.min(m.pw_a,m.pw_b)>=0.30&&Math.max(m.pw_a,m.pw_b)<0.60;
    return`<div style="display:grid;grid-template-columns:1fr auto 1fr auto;align-items:center;gap:6px;background:#fff;border-radius:8px;padding:8px 10px">
      <span style="font-size:12px;font-weight:500;text-align:right">${m.ta}</span>
      <span style="font-size:11px;font-weight:600;color:#aaa">vs</span>
      <span style="font-size:12px;font-weight:500;text-align:left">${m.tb}</span>
      <span style="min-width:20px;text-align:right">${isUpset?'<span style="font-size:10px;background:#fef3c7;color:#92400e;border:1px solid #fcd34d;border-radius:4px;padding:1px 4px">🚨</span>':''}</span>
    </div>`;
  }

  // ── Sección HOY ──
  if(todaySorted.length){
    const dateLabel=today.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'});
    html+=`<div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;padding:10px 14px;margin-bottom:1rem">
      <div style="font-size:11px;font-weight:600;color:#1a5e34;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">
        🗓️ Hoy · ${dateLabel}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px">
        ${todaySorted.map(todayMatchRow).join('')}
      </div>
      <div style="font-size:10px;color:#1a5e34;margin-top:8px;text-align:center">Para ver el análisis, busca el equipo en el buscador de abajo ↓</div>
    </div>`;
  } else if(nextSorted.length){
    const dateLabel=tomorrow.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'});
    html+=`<div style="background:#f5f5f5;border:1px solid #e0e0e0;border-radius:10px;padding:10px 14px;margin-bottom:1rem">
      <div style="font-size:11px;font-weight:600;color:#666;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">
        📅 Hoy no hay partidos · Mañana · ${dateLabel}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px">
        ${nextSorted.map(todayMatchRow).join('')}
      </div>
      <div style="font-size:10px;color:#888;margin-top:8px;text-align:center">Para ver el análisis, busca el equipo en el buscador de abajo ↓</div>
    </div>`;
  }

  // ── Lista completa con buscador ──
  html+=`<div style="margin-bottom:.8rem">
    <input id="match-search-input" type="text" placeholder="🔍 Buscar equipo o partido (ej: Brasil · Brasil Marruecos)" value="${SEARCH_Q}"
      oninput="filterMatches(this.value)"
      style="width:100%;padding:9px 12px;border:1px solid #ddd;border-radius:8px;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box"
      onfocus="this.style.borderColor='#111'" onblur="this.style.borderColor='#ddd'">
  </div>`;

  if(!fd.length){
    html+=`<div class="infobox">No se encontraron partidos para <strong>"${SEARCH_Q}"</strong>.<br><span style="font-size:11px;color:#aaa">Prueba con un equipo ("Brasil") o dos equipos ("Brasil Marruecos")</span></div>`;
    cont.innerHTML=html; return;
  }

  let lbl='';
  fd.forEach(m=>{
    if(m.rl!==lbl){ if(lbl)html+='</div>'; lbl=m.rl; html+=`<p class="slabel">${lbl}</p><div class="pmgrid">`; }
    html+=renderPCard(m);
  });
  if(lbl) html+='</div>';
  cont.innerHTML=html;
}

let SEARCH_Q='';

function filterMatches(val){
  SEARCH_Q=val||'';
  renderPartidos();
  // Restaurar foco y cursor al final
  setTimeout(()=>{
    const inp=document.getElementById('match-search-input');
    if(inp){ inp.focus(); inp.setSelectionRange(SEARCH_Q.length,SEARCH_Q.length); }
  },10);
}

// ── FIX: openMatchModal ahora recibe clave "ta|tb" y busca en objeto ──
function openMatchModal(key){
  if(!window._PCARDS) return;
  const m=window._PCARDS[key];
  if(!m) return;

  const existing=document.getElementById('match-modal');
  if(existing) existing.remove();

  const p_score_a=+(1-Math.exp(-m.la)).toFixed(3);
  const p_score_b=+(1-Math.exp(-m.lb)).toFixed(3);
  const p_15_a=+(1-Math.exp(-m.la)*(1+m.la)).toFixed(3);
  const p_15_b=+(1-Math.exp(-m.lb)*(1+m.lb)).toFixed(3);
  const p_25_a=+(1-Math.exp(-m.la)*(1+m.la+m.la*m.la/2)).toFixed(3);
  const p_25_b=+(1-Math.exp(-m.lb)*(1+m.lb+m.lb*m.lb/2)).toFixed(3);

  const scores=[];
  for(let i=0;i<8;i++) for(let j=0;j<8;j++){
    scores.push({s:i+"-"+j,p:pPmf(i,m.la)*pPmf(j,m.lb)*dcF(i,j,m.la,m.lb)});
  }
  scores.sort((a,b)=>b.p-a.p);
  const top5=scores.slice(0,5);
  const top5sum=top5.reduce((s,x)=>s+x.p,0);

  function teamStats(name){
    const s={played:0,gf:0,ga:0,wins:0,draws:0,losses:0,over15:0,over25:0,btts:0};
    for(const[k,r] of Object.entries(RR)){
      if(!r||r[0]===undefined||r[1]===undefined) continue;
      const[ta2,tb2]=k.split('|');
      const isHome=ta2===name,isAway=tb2===name;
      if(!isHome&&!isAway) continue;
      s.played++;
      const gf=isHome?r[0]:r[1],ga=isHome?r[1]:r[0];
      s.gf+=gf; s.ga+=ga;
      if(gf>ga)s.wins++; else if(gf===ga)s.draws++; else s.losses++;
      if(r[0]+r[1]>1.5)s.over15++;
      if(r[0]+r[1]>2.5)s.over25++;
      if(r[0]>=1&&r[1]>=1)s.btts++;
    }
    return s;
  }
  const sA=teamStats(m.ta),sB=teamStats(m.tb);
  const pCa=(MCP[m.ta]?.p_champ||0).toFixed(1);
  const pCb=(MCP[m.tb]?.p_champ||0).toFixed(1);
  const maxP=Math.max(m.pw_a,m.pd,m.pw_b);

  // ── Corners data ──
  const [cla, clb] = cornerCalc(m.ta, m.tb);
  const cTotal = +(cla + clb).toFixed(2);
  const globalLines  = [5.5, 6.5, 7.5, 8.5, 9.5, 10.5];
  const teamLines    = [2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5];
  const globalOU = cornerOUTable(cTotal, globalLines);
  const ouCA     = cornerOUTable(cla, teamLines);
  const ouCB     = cornerOUTable(clb, teamLines);

  // Sistema de colores corners: verde ≥65%, amarillo 50-64%, gris <50%
  function cPillStyle(p) {
    if (p >= 0.65) return 'background:#d4edda;color:#1a5e34;border:1px solid #86efac';
    if (p >= 0.50) return 'background:#fff3cd;color:#856404;border:1px solid #fcd34d';
    return 'background:#f0f0f0;color:#888;border:1px solid transparent';
  }
  function cOuRow(r) {
    const stO = cPillStyle(r.pOver), stU = cPillStyle(r.pUnder);
    return '<tr>'
      +'<td><strong>'+r.line+'</strong></td>'
      +'<td><span style="display:inline-block;padding:2px 8px;border-radius:5px;font-weight:600;font-size:12px;'+stO+'">'+Math.round(r.pOver*100)+'%</span></td>'
      +'<td><span style="display:inline-block;padding:2px 8px;border-radius:5px;font-weight:600;font-size:12px;'+stU+'">'+Math.round(r.pUnder*100)+'%</span></td>'
      +'</tr>';
  }
  function cTeamBlock(name, lambda, rows) {
    return '<div class="ou-team-block">'
      +'<div class="ou-team-name">'+name.split(' ')[0]+'</div>'
      +'<table class="ou-team-table"><thead><tr><th>Línea</th><th>Over</th><th>Under</th></tr></thead>'
      +'<tbody>'+rows.map(cOuRow).join('')+'</tbody></table></div>';
  }

  // ── Cálculo primer gol ──
  const totalLambda = m.la + m.lb;
  const p_no_goal   = +Math.exp(-totalLambda).toFixed(3);
  const p_a_first   = +(m.la / totalLambda * (1 - p_no_goal)).toFixed(3);
  const p_b_first   = +(m.lb / totalLambda * (1 - p_no_goal)).toFixed(3);
  const maxFirst     = Math.max(p_a_first, p_b_first);

  function firstGoalPill(pct, label, isMax){
    const bg  = isMax ? '#d4edda' : '#f0f0f0';
    const col = isMax ? '#1a5e34' : '#888';
    const bdr = isMax ? '1px solid #86efac' : '1px solid transparent';
    return `<div style="flex:1;text-align:center;padding:10px 6px;border-radius:10px;background:${bg};border:${bdr}">
      <div style="font-size:22px;font-weight:700;color:${col}">${Math.round(pct*100)}%</div>
      <div style="font-size:10px;color:${col};margin-top:3px;font-weight:500">${label}</div>
    </div>`;
  }

  // ── Sección Goles (tab content) ──
  const golesHtml = [
    '<div class="modal-section">',
      '<div class="modal-sec-title">Expected Goals (xG)</div>',
      '<div class="xgs">',
        '<div class="xgrow"><div class="xgra">'+m.xgRA+'</div><div class="xglbl">xG redondeado</div><div class="xgrb">'+m.xgRB+'</div></div>',
        '<hr class="xgdiv">',
        '<div class="xgrow"><div class="xgva">'+m.la+'</div><div class="xglbl">xG exacto &middot; total '+m.xg_total+'</div><div class="xgvb">'+m.lb+'</div></div>',
        '<hr class="xgdiv">',
        '<div class="xgrow"><div class="xghta">'+m.htRA+' <span style="opacity:.6">('+m.htA+')</span></div><div class="xglbl">xG half time</div><div class="xghtb"><span style="opacity:.6">('+m.htB+')</span> '+m.htRB+'</div></div>',
      '</div>',
    '</div>',

    // ── Primer gol ──
    '<div class="modal-section">',
      '<div class="modal-sec-title">🥅 ¿Quién marca primero?</div>',
      '<div style="display:flex;gap:8px;align-items:stretch">',
        firstGoalPill(p_a_first,'Marca primero<br>'+m.ta.split(' ')[0],p_a_first===maxFirst),
        firstGoalPill(p_b_first,'Marca primero<br>'+m.tb.split(' ')[0],p_b_first===maxFirst),
        '<div style="flex:1;text-align:center;padding:10px 6px;border-radius:10px;background:#f0f0f0;border:1px solid transparent">'
          +'<div style="font-size:22px;font-weight:700;color:#888">'+Math.round(p_no_goal*100)+'%</div>'
          +'<div style="font-size:10px;color:#888;margin-top:3px;font-weight:500">Sin goles<br>(0-0)</div>'
        +'</div>',
      '</div>',
    '</div>',
    '<div class="modal-section">',
      '<div class="modal-sec-title">Top 5 resultados m&aacute;s probables</div>',
      '<div class="top5-grid">',
        top5.map(function(s,i){
          return '<div class="top5-item'+(i===0?' top5-first':'')+'">'
            +'<div class="top5-score">'+s.s+'</div>'
            +'<div class="top5-bar-wrap"><div class="top5-bar" style="width:'+Math.round(s.p/top5[0].p*100)+'%"></div></div>'
            +'<div class="top5-pct">'+(s.p*100).toFixed(1)+'%</div>'
            +'</div>';
        }).join(''),
        '<div class="top5-note">Otros resultados: '+((1-top5sum)*100).toFixed(0)+'% de probabilidad combinada</div>',
      '</div>',
    '</div>',
    '<div class="modal-section">',
      '<div class="modal-sec-title">Over / Under &mdash; Partido completo</div>',
      '<div class="ou-btts"><div class="ou-row">',
        '<div class="ou-item'+(m.p_over15>=0.7?' ou-hi':'')+'"><div class="ou-val">'+Math.round(m.p_over15*100)+'%</div><div class="ou-lbl">Over 1.5</div></div>',
        '<div class="ou-item'+(m.p_over25>=0.5?' ou-hi':'')+'"><div class="ou-val">'+Math.round(m.p_over25*100)+'%</div><div class="ou-lbl">Over 2.5</div></div>',
        '<div class="ou-item'+(m.p_over35>=0.4?' ou-hi':'')+'"><div class="ou-val">'+Math.round(m.p_over35*100)+'%</div><div class="ou-lbl">Over 3.5</div></div>',
        '<div class="ou-item'+(m.p_under25>0.5?' ou-hi':'')+'"><div class="ou-val">'+Math.round(m.p_under25*100)+'%</div><div class="ou-lbl">Under 2.5</div></div>',
      '</div></div>',
    '</div>',
    '<div class="modal-section">',
      '<div class="modal-sec-title">BTTS &mdash; Ambos equipos marcan</div>',
      '<div class="ou-btts"><div class="ou-row">',
        '<div class="ou-item'+(m.p_btts>=0.5?' btts-hi':'')+'"><div class="ou-val">'+Math.round(m.p_btts*100)+'%</div><div class="ou-lbl">BTTS &#x2705;</div></div>',
        '<div class="ou-item'+(m.p_no_btts>0.5?' btts-no-hi':'')+'"><div class="ou-val">'+Math.round(m.p_no_btts*100)+'%</div><div class="ou-lbl">No BTTS &#x274C;</div></div>',
      '</div></div>',
    '</div>',
    '<div class="modal-section">',
      '<div class="modal-sec-title">Over / Under &mdash; Por equipo</div>',
      '<div class="ou-teams-grid">',
        ouTeamHtml(m.ta,p_score_a,p_15_a,p_25_a),
        ouTeamHtml(m.tb,p_score_b,p_15_b,p_25_b),
      '</div>',
    '</div>',
    '<div class="modal-section">',
      '<div class="modal-sec-title">Historial en el torneo</div>',
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">',
        tournHtml(m.ta,sA),
        tournHtml(m.tb,sB),
      '</div>',
    '</div>',
  ].join('');

  // ── Sección Corners (tab content) ──
  const cornersHtml = [
    // Resumen visual corners
    '<div class="modal-section">',
      '<div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;background:#f5f5f5;border-radius:10px;padding:14px 16px">',
        // Equipo A
        '<div style="text-align:right">',
          '<div style="font-size:11px;font-weight:600;color:#555;margin-bottom:4px">'+m.ta+'</div>',
          '<div style="font-size:28px;font-weight:700;color:#111;line-height:1">'+cla+'</div>',
          '<div style="font-size:10px;color:#aaa;margin-top:2px">corners esp.</div>',
        '</div>',
        // Centro
        '<div style="text-align:center;padding:0 8px">',
          '<div style="font-size:9px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px">Total</div>',
          '<div style="font-size:32px;font-weight:700;color:#111;line-height:1">'+cTotal+'</div>',
          '<div style="font-size:9px;color:#aaa;margin-top:2px">esperados</div>',
        '</div>',
        // Equipo B
        '<div style="text-align:left">',
          '<div style="font-size:11px;font-weight:600;color:#555;margin-bottom:4px">'+m.tb+'</div>',
          '<div style="font-size:28px;font-weight:700;color:#111;line-height:1">'+clb+'</div>',
          '<div style="font-size:10px;color:#aaa;margin-top:2px">corners esp.</div>',
        '</div>',
      '</div>',
    '</div>',
    // O/U partido completo con sistema de colores
    '<div class="modal-section">',
      '<div class="modal-sec-title">Over / Under &mdash; Partido completo</div>',
      '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:5px;margin-bottom:5px">',
        globalOU.map(function(r){
          const st = cPillStyle(r.pOver);
          return '<div style="text-align:center;padding:7px 4px;border-radius:8px;'+st+'">'
            +'<div style="font-size:13px;font-weight:700">'+Math.round(r.pOver*100)+'%</div>'
            +'<div style="font-size:9px;font-weight:500;margin-top:2px">O'+r.line+'</div>'
            +'</div>';
        }).join(''),
      '</div>',
      '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:5px">',
        globalOU.map(function(r){
          const st = cPillStyle(r.pUnder);
          return '<div style="text-align:center;padding:7px 4px;border-radius:8px;'+st+'">'
            +'<div style="font-size:13px;font-weight:700">'+Math.round(r.pUnder*100)+'%</div>'
            +'<div style="font-size:9px;font-weight:500;margin-top:2px">U'+r.line+'</div>'
            +'</div>';
        }).join(''),
      '</div>',
    '</div>',
    '<div class="modal-section">',
      '<div class="modal-sec-title">Over / Under &mdash; Por equipo</div>',
      '<div class="ou-teams-grid">',
        cTeamBlock(m.ta, cla, ouCA),
        cTeamBlock(m.tb, clb, ouCB),
      '</div>',
    '</div>',
  ].join('');

  // ── UPSET DATA ──
  const favTeam  = m.pw_a >= m.pw_b ? m.ta : m.tb;
  const undTeam  = m.pw_a >= m.pw_b ? m.tb : m.ta;
  const favP     = Math.max(m.pw_a, m.pw_b);
  const undP     = Math.min(m.pw_a, m.pw_b);
  const isUpset  = !m.played && undP >= 0.30 && favP < 0.60;

  // Razones de sorpresa en lenguaje simple
  function upsetReasons(ta, tb, u_pw_a, u_pw_b, u_pd) {
    const reasons = [];
    const strA = STR[ta]||0.5, strB = STR[tb]||0.5;
    const diff = Math.abs(strA - strB);

    // Equipos muy parejos en fuerza
    if(diff < 0.08) reasons.push({ icon:'⚖️', txt: 'Los dos equipos tienen una fuerza muy similar según el modelo — ninguno domina claramente al otro.' });

    // El underdog tiene buena forma
    const undStr = STR[undTeam]||0.5;
    if(undStr > 0.55) reasons.push({ icon:'🔥', txt: undTeam+' llega en buen momento: su ranking y rendimiento reciente lo posicionan como un equipo peligroso, no un rival fácil.' });

    // Partido muy abierto (empate alto)
    if(u_pd >= 0.22) reasons.push({ icon:'🤝', txt: 'Hay una probabilidad alta de empate ('+Math.round(u_pd*100)+'%), lo que significa que el partido puede decidirse por pequeños detalles o en la prórroga.' });

    // xG cercanos
    if(Math.abs(m.la - m.lb) < 0.5) reasons.push({ icon:'📊', txt: 'Las oportunidades de gol esperadas son casi iguales ('+m.la+' vs '+m.lb+') — cualquiera puede marcar primero.' });

    // Ventaja de ser underdog en torneos
    if(!reasons.length) reasons.push({ icon:'💡', txt: 'El modelo detecta que '+undTeam+' tiene una probabilidad real de ganar este partido, más de lo que sugiere ser el equipo menos favorito.' });

    return reasons;
  }
  const reasons = isUpset ? upsetReasons(m.ta, m.tb, m.pw_a, m.pw_b, m.pd) : [];

  // ── HTML TAB SORPRESA ──
  const upsetHtml = isUpset ? [
    // Banner de alerta
    '<div class="modal-section">',
      '<div style="background:#fef3c7;border:1.5px solid #fcd34d;border-radius:10px;padding:12px 14px;margin-bottom:4px">',
        '<div style="font-size:13px;font-weight:700;color:#92400e;margin-bottom:4px">🚨 El modelo detecta una posible sorpresa</div>',
        '<div style="font-size:12px;color:#78350f;line-height:1.5">',
          '<strong>'+undTeam+'</strong> tiene un <strong>'+Math.round(undP*100)+'%</strong> de probabilidad de ganar, ',
          'siendo considerado el equipo menos favorito frente a <strong>'+favTeam+'</strong> ('+Math.round(favP*100)+'%). ',
          'Eso es más de lo normal — aquí te explicamos por qué.',
        '</div>',
      '</div>',
    '</div>',
    // Razones
    '<div class="modal-section">',
      '<div class="modal-sec-title">¿Por qué puede pasar la sorpresa?</div>',
      '<div style="display:flex;flex-direction:column;gap:8px">',
        reasons.map(function(r){
          return '<div style="display:flex;gap:10px;align-items:flex-start;background:#f9f9f9;border-radius:8px;padding:10px">'
            +'<span style="font-size:18px;flex-shrink:0">'+r.icon+'</span>'
            +'<span style="font-size:12px;color:#444;line-height:1.5">'+r.txt+'</span>'
            +'</div>';
        }).join(''),
      '</div>',
    '</div>',
    // Probabilidades clave
    '<div class="modal-section">',
      '<div class="modal-sec-title">Probabilidades clave del partido</div>',
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">',
        // Gana el underdog
        '<div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:10px;padding:12px;text-align:center">',
          '<div style="font-size:24px;font-weight:700;color:#92400e">'+Math.round(undP*100)+'%</div>',
          '<div style="font-size:11px;color:#78350f;margin-top:2px">Gana <strong>'+undTeam.split(' ')[0]+'</strong></div>',
          '<div style="font-size:10px;color:#a16207;margin-top:2px">(la sorpresa)</div>',
        '</div>',
        // Gana el favorito
        '<div style="background:#f0f0f0;border-radius:10px;padding:12px;text-align:center">',
          '<div style="font-size:24px;font-weight:700;color:#333">'+Math.round(favP*100)+'%</div>',
          '<div style="font-size:11px;color:#555;margin-top:2px">Gana <strong>'+favTeam.split(' ')[0]+'</strong></div>',
          '<div style="font-size:10px;color:#888;margin-top:2px">(el favorito)</div>',
        '</div>',
        // Empate
        '<div style="background:#f0f0f0;border-radius:10px;padding:12px;text-align:center;grid-column:1/-1">',
          '<div style="font-size:20px;font-weight:700;color:#333">'+Math.round(m.pd*100)+'%</div>',
          '<div style="font-size:11px;color:#555;margin-top:2px">Empate — el partido se va a prórroga o penales</div>',
        '</div>',
      '</div>',
    '</div>',
    // BTTS y O/U como contexto adicional
    '<div class="modal-section">',
      '<div class="modal-sec-title">Contexto adicional</div>',
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">',
        '<div style="background:'+(m.p_btts>=0.5?'#d4edda':'#f0f0f0')+';border-radius:8px;padding:10px;text-align:center">',
          '<div style="font-size:18px;font-weight:700;color:'+(m.p_btts>=0.5?'#1a5e34':'#555')+'">'+Math.round(m.p_btts*100)+'%</div>',
          '<div style="font-size:10px;color:'+(m.p_btts>=0.5?'#1a5e34':'#888')+';margin-top:2px">Ambos equipos marcan (BTTS)</div>',
        '</div>',
        '<div style="background:'+(m.p_over25>=0.5?'#dbeafe':'#f0f0f0')+';border-radius:8px;padding:10px;text-align:center">',
          '<div style="font-size:18px;font-weight:700;color:'+(m.p_over25>=0.5?'#1d4ed8':'#555')+'">'+Math.round(m.p_over25*100)+'%</div>',
          '<div style="font-size:10px;color:'+(m.p_over25>=0.5?'#1d4ed8':'#888')+';margin-top:2px">Más de 2.5 goles en el partido</div>',
        '</div>',
      '</div>',
    '</div>',
  ].join('') : '';

  // ── Tarjetas data ──
  const [tla, tlb] = cardCalc(m.ta, m.tb);
  const tTotal = +(tla + tlb).toFixed(2);
  const cardGlobalLines = [2.5, 3.5, 4.5];
  const cardTeamLines   = [0.5, 1.5, 2.5];
  const cardGlobalOU = cornerOUTable(tTotal, cardGlobalLines);
  const cardTeamOUA  = cornerOUTable(tla,    cardTeamLines);
  const cardTeamOUB  = cornerOUTable(tlb,    cardTeamLines);

  // Reutilizamos cPillStyle y cOuRow de corners
  function cardTeamBlock(name, lambda, rows){
    return '<div class="ou-team-block">'
      +'<div class="ou-team-name">'+name.split(' ')[0]+'</div>'
      +'<table class="ou-team-table"><thead><tr><th>Línea</th><th>Over</th><th>Under</th></tr></thead>'
      +'<tbody>'+rows.map(function(r){
        const stO=cPillStyle(r.pOver), stU=cPillStyle(r.pUnder);
        return '<tr>'
          +'<td><strong>'+r.line+'</strong></td>'
          +'<td><span style="display:inline-block;padding:2px 8px;border-radius:5px;font-weight:600;font-size:12px;'+stO+'">'+Math.round(r.pOver*100)+'%</span></td>'
          +'<td><span style="display:inline-block;padding:2px 8px;border-radius:5px;font-weight:600;font-size:12px;'+stU+'">'+Math.round(r.pUnder*100)+'%</span></td>'
          +'</tr>';
      }).join('')+'</tbody></table></div>';
  }

  const tarjetasHtml = [
    // Disclaimer amigable
    '<div class="modal-section">',
      '<div style="background:#fef9e7;border:1px solid #fcd34d;border-radius:8px;padding:10px 12px;margin-bottom:4px;font-size:11px;color:#78350f;line-height:1.5">',
        '🟨 <strong>Basado en el índice histórico de agresividad</strong> de cada selección. ',
        'El árbitro designado puede influir en el total real — úsalo como referencia de tendencia.',
      '</div>',
    '</div>',

    // Resumen visual
    '<div class="modal-section">',
      '<div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;background:#f5f5f5;border-radius:10px;padding:14px 16px">',
        '<div style="text-align:right">',
          '<div style="font-size:11px;font-weight:600;color:#555;margin-bottom:4px">'+m.ta+'</div>',
          '<div style="font-size:28px;font-weight:700;color:#111;line-height:1">'+tla+'</div>',
          '<div style="font-size:10px;color:#aaa;margin-top:2px">tarjetas esp.</div>',
        '</div>',
        '<div style="text-align:center;padding:0 8px">',
          '<div style="font-size:9px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px">Total</div>',
          '<div style="font-size:32px;font-weight:700;color:#111;line-height:1">'+tTotal+'</div>',
          '<div style="font-size:9px;color:#aaa;margin-top:2px">esperadas</div>',
        '</div>',
        '<div style="text-align:left">',
          '<div style="font-size:11px;font-weight:600;color:#555;margin-bottom:4px">'+m.tb+'</div>',
          '<div style="font-size:28px;font-weight:700;color:#111;line-height:1">'+tlb+'</div>',
          '<div style="font-size:10px;color:#aaa;margin-top:2px">tarjetas esp.</div>',
        '</div>',
      '</div>',
    '</div>',

    // O/U partido completo
    '<div class="modal-section">',
      '<div class="modal-sec-title">Over / Under &mdash; Partido completo</div>',
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-bottom:5px">',
        cardGlobalOU.map(function(r){
          const st=cPillStyle(r.pOver);
          return '<div style="text-align:center;padding:7px 4px;border-radius:8px;'+st+'">'
            +'<div style="font-size:13px;font-weight:700">'+Math.round(r.pOver*100)+'%</div>'
            +'<div style="font-size:9px;font-weight:500;margin-top:2px">O'+r.line+'</div>'
            +'</div>';
        }).join(''),
      '</div>',
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px">',
        cardGlobalOU.map(function(r){
          const st=cPillStyle(r.pUnder);
          return '<div style="text-align:center;padding:7px 4px;border-radius:8px;'+st+'">'
            +'<div style="font-size:13px;font-weight:700">'+Math.round(r.pUnder*100)+'%</div>'
            +'<div style="font-size:9px;font-weight:500;margin-top:2px">U'+r.line+'</div>'
            +'</div>';
        }).join(''),
      '</div>',
    '</div>',

    // O/U por equipo
    '<div class="modal-section">',
      '<div class="modal-sec-title">Over / Under &mdash; Por equipo</div>',
      '<div class="ou-teams-grid">',
        cardTeamBlock(m.ta, tla, cardTeamOUA),
        cardTeamBlock(m.tb, tlb, cardTeamOUB),
      '</div>',
    '</div>',
  ].join('');

  const html=[
    '<div class="modal-box">',

    // ── Header siempre visible ──
    '<div class="modal-hdr">',
      '<div>',
        '<div class="modal-title">'+m.ta+' vs '+m.tb+'</div>',
        '<div class="modal-sub">'+m.rl+' &middot; '+(m.played?'Jugado':'Pendiente')+'</div>',
      '</div>',
      '<button class="modal-close" onclick="closeMatchModal()">&#x2715;</button>',
    '</div>',

    // ── Probabilidades de victoria siempre visibles ──
    '<div class="modal-section" style="border-bottom:1px solid #f0f0f0">',
      '<div class="modal-sec-title">Probabilidades de victoria</div>',
      '<div class="probs-row">',
        '<div class="pbox'+(m.pw_a===maxP?' hi':'')+'"><div class="pv">'+Math.round(m.pw_a*100)+'%</div><div class="pl">Gana '+m.ta.split(' ')[0]+'</div></div>',
        '<div class="pbox'+(m.pd===maxP&&m.pw_a!==maxP?' hi':'')+'"><div class="pv">'+Math.round(m.pd*100)+'%</div><div class="pl">Empate</div></div>',
        '<div class="pbox'+(m.pw_b===maxP&&m.pw_a!==maxP&&m.pd!==maxP?' hi':'')+'"><div class="pv">'+Math.round(m.pw_b*100)+'%</div><div class="pl">Gana '+m.tb.split(' ')[0]+'</div></div>',
      '</div>',
    '</div>',

    // ── Tabs: Goles / Corners / Tarjetas / Sorpresa (solo si aplica) ──
    '<div style="display:flex;border-bottom:1px solid #e0e0e0;background:#fafafa">',
      '<button id="mtab-goles" onclick="switchModalTab(\'goles\')" style="flex:1;padding:10px;font-size:12px;font-weight:500;border:none;background:none;cursor:pointer;border-bottom:2px solid #111;color:#111;font-family:inherit">⚽ Goles</button>',
      IS_PREMIUM ? '<button id="mtab-corners" onclick="switchModalTab(\'corners\')" style="flex:1;padding:10px;font-size:12px;font-weight:500;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;color:#888;font-family:inherit">📐 Corners</button>' : '<button onclick="showPremiumModal()" style="flex:1;padding:10px;font-size:12px;font-weight:500;border:none;background:none;cursor:pointer;color:#ccc;font-family:inherit">📐 🔐</button>',
      IS_PREMIUM ? '<button id="mtab-tarjetas" onclick="switchModalTab(\'tarjetas\')" style="flex:1;padding:10px;font-size:12px;font-weight:500;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;color:#888;font-family:inherit">🟨 Tarjetas</button>' : '<button onclick="showPremiumModal()" style="flex:1;padding:10px;font-size:12px;font-weight:500;border:none;background:none;cursor:pointer;color:#ccc;font-family:inherit">🟨 🔐</button>',
      isUpset ? (IS_PREMIUM ? '<button id="mtab-upset" onclick="switchModalTab(\'upset\')" style="flex:1;padding:10px;font-size:12px;font-weight:600;border:none;background:#fef9e7;cursor:pointer;border-bottom:2px solid transparent;color:#92400e;font-family:inherit">🚨 Sorpresa</button>' : '<button onclick="showPremiumModal()" style="flex:1;padding:10px;font-size:12px;font-weight:600;border:none;background:#fef9e7;cursor:pointer;color:#ccc;font-family:inherit">🚨 🔐</button>') : '',
    '</div>',

    // ── Tab Goles ──
    '<div id="mtab-content-goles">',
      IS_PREMIUM ? golesHtml : golesHtml + premiumBanner('xG detallado, Half Time, Top 5 resultados y más'),
    '</div>',

    // ── Tab Corners ──
    IS_PREMIUM ? '<div id="mtab-content-corners" style="display:none">'+cornersHtml+'</div>' : '',

    // ── Tab Tarjetas ──
    IS_PREMIUM ? '<div id="mtab-content-tarjetas" style="display:none">'+tarjetasHtml+'</div>' : '',

    // ── Tab Sorpresa (solo si aplica) ──
    isUpset && IS_PREMIUM ? '<div id="mtab-content-upset" style="display:none">'+upsetHtml+'</div>' : '',

    '</div>'
  ].join('');

  const overlay=document.createElement('div');
  overlay.id='match-modal';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999;display:flex;align-items:center;justify-content:center;padding:1rem;overflow-y:auto';
  overlay.onclick=function(e){ if(e.target===overlay) closeMatchModal(); };
  overlay.innerHTML=html;
  document.body.appendChild(overlay);
}

function ouTeamHtml(name,pScore,p15,p25){
  return '<div class="ou-team-block">'
    +'<div class="ou-team-name">'+name.split(' ')[0]+'</div>'
    +'<table class="ou-team-table">'
    +'<thead><tr><th>L&iacute;nea</th><th>Over</th><th>Under</th></tr></thead>'
    +'<tbody>'
    +'<tr class="'+(pScore>=0.5?'ou-tr-hi':'')+'">'
      +'<td><strong>0.5</strong></td>'
      +'<td class="'+(pScore>=0.5?'td-hi-g':'')+'"><strong>'+Math.round(pScore*100)+'%</strong></td>'
      +'<td class="'+((1-pScore)>=0.5?'td-hi-r':'')+'"><strong>'+Math.round((1-pScore)*100)+'%</strong></td>'
    +'</tr>'
    +'<tr class="'+(p15>=0.5?'ou-tr-hi':'')+'">'
      +'<td><strong>1.5</strong></td>'
      +'<td class="'+(p15>=0.5?'td-hi-g':'')+'"><strong>'+Math.round(p15*100)+'%</strong></td>'
      +'<td class="'+((1-p15)>=0.5?'td-hi-r':'')+'"><strong>'+Math.round((1-p15)*100)+'%</strong></td>'
    +'</tr>'
    +'<tr class="'+(p25>=0.4?'ou-tr-hi':'')+'">'
      +'<td><strong>2.5</strong></td>'
      +'<td class="'+(p25>=0.4?'td-hi-g':'')+'"><strong>'+Math.round(p25*100)+'%</strong></td>'
      +'<td class="'+((1-p25)>=0.6?'td-hi-r':'')+'"><strong>'+Math.round((1-p25)*100)+'%</strong></td>'
    +'</tr>'
    +'</tbody></table></div>';
}

function tournHtml(name,s){
  if(s.played===0) return '<div class="tourn-card"><div class="tourn-name">'+name+'</div><div style="font-size:11px;color:#aaa;text-align:center;padding:10px 0">Sin partidos jugados</div></div>';
  return '<div class="tourn-card">'
    +'<div class="tourn-name">'+name+'</div>'
    +'<div class="tourn-row"><span>R&eacute;cord</span><span>'+s.wins+'V '+s.draws+'E '+s.losses+'D</span></div>'
    +'<div class="tourn-row"><span>Goles</span><span>'+s.gf+' GF &middot; '+s.ga+' GA</span></div>'
    +'<div class="tourn-row'+(s.played&&s.over15/s.played>=0.5?' tourn-hi':'')+'"><span>Over 1.5</span><span>'+s.over15+'/'+s.played+' ('+Math.round(s.over15/s.played*100)+'%)</span></div>'
    +'<div class="tourn-row'+(s.played&&s.over25/s.played>=0.5?' tourn-hi':'')+'"><span>Over 2.5</span><span>'+s.over25+'/'+s.played+' ('+Math.round(s.over25/s.played*100)+'%)</span></div>'
    +'<div class="tourn-row'+(s.played&&s.btts/s.played>=0.5?' tourn-hi':'')+'"><span>BTTS</span><span>'+s.btts+'/'+s.played+' ('+Math.round(s.btts/s.played*100)+'%)</span></div>'
    +'</div>';
}

function closeMatchModal(){
  const modal=document.getElementById('match-modal');
  if(modal) modal.remove();
}

function switchModalTab(tab){
  const tabs=['goles','corners','tarjetas','upset'];
  tabs.forEach(function(t){
    const btn=document.getElementById('mtab-'+t);
    const content=document.getElementById('mtab-content-'+t);
    if(!btn||!content) return;
    const active=t===tab;
    btn.style.borderBottom=active?'2px solid #111':'2px solid transparent';
    btn.style.color=active?'#111':'#888';
    btn.style.fontWeight=active?'600':'400';
    content.style.display=active?'block':'none';
  });
}

function toggleCard(id){}

// ── RENDER GROUPS ─────────────────────────────────────────────────────────────
function realGroupStandings(g,fx){
  const ms=GRP[g];
  const s={}; ms.forEach(m=>{s[m]={pts:0,gf:0,ga:0,pj:0};});
  for(let i=0;i<ms.length;i++) for(let j=i+1;j<ms.length;j++){
    const ta=ms[i],tb=ms[j];
    const real=getResult(fx,ta,tb);
    if(!real) continue;
    const ga=real.ga,gb=real.gb;
    s[ta].pj++; s[tb].pj++;
    s[ta].gf+=ga; s[ta].ga+=gb;
    s[tb].gf+=gb; s[tb].ga+=ga;
    if(ga>gb) s[ta].pts+=3;
    else if(gb>ga) s[tb].pts+=3;
    else{ s[ta].pts+=1; s[tb].pts+=1; }
  }
  return Object.entries(s)
    .sort((a,b)=>(b[1].pts-a[1].pts)||((b[1].gf-b[1].ga)-(a[1].gf-a[1].ga))||(b[1].gf-a[1].gf))
    .map(([n,d])=>({name:n,...d}));
}

function renderGroups(){
  const fx=getFx();
  let html='<div class="group-grid">';

  for(const g of Object.keys(GRP)){
    const ms=GRP[g];
    const totalMatches=6;
    const played=Object.keys(fx).filter(k=>{
      const[ta,tb]=k.split('|');
      return ms.includes(ta)&&ms.includes(tb);
    }).length;
    const pct=Math.round(played/totalMatches*100);
    const realRows=realGroupStandings(g,fx);
    const projRows=GS[g]||realRows;

    function getForm(name){
      const res=[];
      for(const[k,r] of Object.entries(fx)){
        const[ta,tb]=k.split('|');
        if(!ms.includes(ta)||!ms.includes(tb)) continue;
        if(ta!==name&&tb!==name) continue;
        const isHome=ta===name;
        const myG=isHome?r[0]:r[1], oppG=isHome?r[1]:r[0];
        if(myG>oppG) res.push('W');
        else if(myG===oppG) res.push('D');
        else res.push('L');
      }
      return res;
    }

    function maxPossiblePts(name, rows){
      const row=rows.find(r=>r.name===name);
      if(!row) return 0;
      return row.pts+(3-row.pj)*3;
    }

    function classStatus(rows,idx){
      const team=rows[idx];
      if(!team) return 'pending';
      if(idx<2){
        const third=rows[2];
        if(third&&maxPossiblePts(third.name,rows)<team.pts) return 'safe';
        if(team.pj===3) return 'safe';
        return 'alive';
      }
      if(idx===2){
        if(team.pj===3) return 'third';
        return 'alive';
      }
      const second=rows[1];
      if(second&&team.pts>maxPossiblePts(second.name,rows)) return 'out';
      if(team.pj===3) return 'out';
      return 'alive';
    }

    function statusBadge(status,pj){
      if(pj===0) return '<span style="font-size:9px;color:#ccc">—</span>';
      if(status==='safe')  return '<span style="font-size:9px;background:#d4edda;color:#1a5e34;border-radius:3px;padding:1px 5px;font-weight:600;white-space:nowrap">✓ Clasif.</span>';
      if(status==='third') return '<span style="font-size:9px;background:#fff3cd;color:#856404;border-radius:3px;padding:1px 5px;font-weight:600;white-space:nowrap">3° cand.</span>';
      if(status==='out')   return '<span style="font-size:9px;background:#fde8e8;color:#c00;border-radius:3px;padding:1px 5px;font-weight:600;white-space:nowrap">✗ Elim.</span>';
      return '<span style="font-size:9px;color:#888;white-space:nowrap">En carrera</span>';
    }

    function formDots(name){
      const res=getForm(name);
      if(!res.length) return '<span style="font-size:10px;color:#ccc">—</span>';
      return res.map(r=>{
        const bg=r==='W'?'#d4edda':r==='D'?'#e8e8e8':'#fde8e8';
        const col=r==='W'?'#1a5e34':r==='D'?'#666':'#c00';
        return `<span style="display:inline-flex;align-items:center;justify-content:center;width:17px;height:17px;border-radius:50%;background:${bg};color:${col};font-size:8px;font-weight:700">${r}</span>`;
      }).join(' ');
    }

    // ── Card resumida ──
    html+=`<div class="gcard">
      <div class="ghdr">
        <span style="font-weight:600">Grupo ${g}</span>
        <span style="display:flex;align-items:center;gap:6px;font-size:10px;color:#888">
          <span>${played}/${totalMatches} jugados</span>
          <span style="display:inline-block;width:50px;height:4px;background:#e0e0e0;border-radius:3px;overflow:hidden">
            <span style="display:block;height:100%;width:${pct}%;background:${pct===100?'#1a5e34':'#1565c0'};border-radius:3px"></span>
          </span>
        </span>
      </div>
      <table class="gtbl">
        <thead><tr>
          <th style="width:20px">#</th>
          <th>Equipo</th>
          <th class="r">Pts</th>
          <th>Forma</th>
          <th>Estado</th>
        </tr></thead>
        <tbody>`;

    realRows.forEach((r,i)=>{
      const cls=i===0?'q1':i===1?'q2':'';
      const status=classStatus(realRows,i);
      html+=`<tr>
        <td class="${cls}" style="font-weight:600">${i+1}</td>
        <td style="font-size:12px;font-weight:500;max-width:90px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;text-decoration:underline dotted #ccc" onclick="openTeamProfile('${r.name}')">${r.name}</td>
        <td class="r"><strong>${r.pts}</strong></td>
        <td style="white-space:nowrap">${formDots(r.name)}</td>
        <td>${statusBadge(status,r.pj)}</td>
      </tr>`;
    });

    html+=`</tbody></table>
      <button onclick="openGroupModal('${g}')" style="width:100%;padding:7px;background:none;border:none;border-top:1px solid #f0f0f0;cursor:pointer;font-size:11px;color:#1565c0;font-family:inherit;font-weight:500;display:flex;align-items:center;justify-content:center;gap:4px">
        Ver tabla completa ↗
      </button>
    </div>`;
  }

  html+=`</div><p style="font-size:11px;color:#999;margin-top:8px">
    Forma = últimos partidos en el grupo · Estado se actualiza con cada resultado · Haz click en "Ver tabla completa" para más detalles
  </p>`;
  document.getElementById('gcont').innerHTML=html;
}

// ── MODAL TABLA COMPLETA DE GRUPO ─────────────────────────────────────────────
function openGroupModal(g){
  const existing=document.getElementById('group-modal');
  if(existing) existing.remove();

  const ms=GRP[g];
  const fx=getFx();
  const realRows=realGroupStandings(g,fx);
  const projRows=GS[g]||realRows;
  const played=Object.keys(fx).filter(k=>{
    const[ta,tb]=k.split('|');
    return ms.includes(ta)&&ms.includes(tb);
  }).length;

  function getForm(name){
    const res=[];
    for(const[k,r] of Object.entries(fx)){
      const[ta,tb]=k.split('|');
      if(!ms.includes(ta)||!ms.includes(tb)) continue;
      if(ta!==name&&tb!==name) continue;
      const isHome=ta===name;
      const myG=isHome?r[0]:r[1], oppG=isHome?r[1]:r[0];
      if(myG>oppG) res.push('W');
      else if(myG===oppG) res.push('D');
      else res.push('L');
    }
    return res;
  }

  function formDots(name){
    const res=getForm(name);
    if(!res.length) return '<span style="color:#ccc;font-size:11px">Sin partidos</span>';
    return res.map(r=>{
      const bg=r==='W'?'#d4edda':r==='D'?'#e8e8e8':'#fde8e8';
      const col=r==='W'?'#1a5e34':r==='D'?'#666':'#c00';
      return `<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:${bg};color:${col};font-size:9px;font-weight:700">${r}</span>`;
    }).join(' ');
  }

  function maxPossiblePts(name,rows){
    const row=rows.find(r=>r.name===name);
    if(!row) return 0;
    return row.pts+(3-row.pj)*3;
  }
  function classStatus(rows,idx){
    const team=rows[idx]; if(!team) return 'pending';
    if(idx<2){
      const third=rows[2];
      if(third&&maxPossiblePts(third.name,rows)<team.pts) return 'safe';
      if(team.pj===3) return 'safe';
      return 'alive';
    }
    if(idx===2){ if(team.pj===3) return 'third'; return 'alive'; }
    const second=rows[1];
    if(second&&team.pts>maxPossiblePts(second.name,rows)) return 'out';
    if(team.pj===3) return 'out';
    return 'alive';
  }
  function statusLabel(status,pj){
    if(pj===0) return '—';
    if(status==='safe')  return '<span style="background:#d4edda;color:#1a5e34;border-radius:4px;padding:2px 7px;font-size:10px;font-weight:600">✓ Clasificado</span>';
    if(status==='third') return '<span style="background:#fff3cd;color:#856404;border-radius:4px;padding:2px 7px;font-size:10px;font-weight:600">3° candidato</span>';
    if(status==='out')   return '<span style="background:#fde8e8;color:#c00;border-radius:4px;padding:2px 7px;font-size:10px;font-weight:600">✗ Eliminado</span>';
    return '<span style="color:#888;font-size:10px">En carrera</span>';
  }

  function projPts(name){
    const p=projRows.find(r=>r.name===name);
    return p?p.pts:'—';
  }

  // Partidos pendientes del grupo
  const pending=[];
  for(let i=0;i<ms.length;i++) for(let j=i+1;j<ms.length;j++){
    const ta=ms[i],tb=ms[j];
    if(!getResult(fx,ta,tb)) pending.push({ta,tb});
  }

  // Partidos jugados
  const results=[];
  for(let i=0;i<ms.length;i++) for(let j=i+1;j<ms.length;j++){
    const ta=ms[i],tb=ms[j];
    const r=getResult(fx,ta,tb);
    if(r) results.push({ta,tb,ga:r.ga,gb:r.gb});
  }

  const html=`<div class="modal-box" style="max-width:560px">
    <div class="modal-hdr">
      <div>
        <div class="modal-title">Grupo ${g}</div>
        <div class="modal-sub">${played}/6 partidos jugados</div>
      </div>
      <button class="modal-close" onclick="closeGroupModal()">&#x2715;</button>
    </div>

    <!-- Tabla completa -->
    <div class="modal-section">
      <div class="modal-sec-title">Tabla de posiciones</div>
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead>
          <tr style="border-bottom:1px solid #e0e0e0">
            <th style="padding:5px 6px;text-align:left;color:#888;font-weight:400">#</th>
            <th style="padding:5px 6px;text-align:left;color:#888;font-weight:400">Equipo</th>
            <th style="padding:5px 6px;text-align:center;color:#888;font-weight:400">Pts</th>
            <th style="padding:5px 6px;text-align:center;color:#888;font-weight:400">PJ</th>
            <th style="padding:5px 6px;text-align:center;color:#888;font-weight:400">GF</th>
            <th style="padding:5px 6px;text-align:center;color:#888;font-weight:400">GA</th>
            <th style="padding:5px 6px;text-align:center;color:#888;font-weight:400">DG</th>
            <th style="padding:5px 6px;text-align:center;color:#1565c0;font-weight:500">Proy.</th>
            <th style="padding:5px 6px;text-align:left;color:#888;font-weight:400">Forma</th>
            <th style="padding:5px 6px;text-align:left;color:#888;font-weight:400">Estado</th>
          </tr>
        </thead>
        <tbody>
          ${realRows.map((r,i)=>{
            const dg=r.gf-r.ga;
            const cls=i===0?'#b87333':i===1?'#777':'#111';
            const status=classStatus(realRows,i);
            const bg=i<2?'#fafff8':'#fff';
            return `<tr style="border-bottom:1px solid #f5f5f5;background:${bg}">
              <td style="padding:7px 6px;font-weight:700;color:${cls}">${i+1}</td>
              <td style="padding:7px 6px;font-weight:500">${r.name}</td>
              <td style="padding:7px 6px;text-align:center"><strong>${r.pts}</strong></td>
              <td style="padding:7px 6px;text-align:center;color:#888">${r.pj}</td>
              <td style="padding:7px 6px;text-align:center">${r.gf}</td>
              <td style="padding:7px 6px;text-align:center">${r.ga}</td>
              <td style="padding:7px 6px;text-align:center">${dg>0?'+':''}${dg}</td>
              <td style="padding:7px 6px;text-align:center;color:#1565c0;font-weight:600">${projPts(r.name)}</td>
              <td style="padding:7px 6px;white-space:nowrap">${formDots(r.name)}</td>
              <td style="padding:7px 6px">${statusLabel(status,r.pj)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      <p style="font-size:10px;color:#aaa;margin-top:6px"><strong style="color:#1565c0">Proy.</strong> = puntos proyectados al final del grupo según el modelo</p>
    </div>

    <!-- Resultados jugados -->
    ${results.length?`<div class="modal-section">
      <div class="modal-sec-title">Resultados</div>
      <div style="display:flex;flex-direction:column;gap:5px">
        ${results.map(r=>`
          <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;background:#f9f9f9;border-radius:7px;padding:7px 10px">
            <span style="font-size:12px;text-align:right;font-weight:${r.ga>r.gb?'600':'400'};color:${r.ga>r.gb?'#1a5e34':'#555'}">${r.ta}</span>
            <span style="font-size:15px;font-weight:700;background:#d4edda;color:#1a5e34;padding:3px 10px;border-radius:6px">${r.ga} - ${r.gb}</span>
            <span style="font-size:12px;text-align:left;font-weight:${r.gb>r.ga?'600':'400'};color:${r.gb>r.ga?'#1a5e34':'#555'}">${r.tb}</span>
          </div>`).join('')}
      </div>
    </div>`:''}

    <!-- Partidos pendientes -->
    ${pending.length?`<div class="modal-section">
      <div class="modal-sec-title">Partidos pendientes</div>
      <div style="display:flex;flex-direction:column;gap:5px">
        ${pending.map(p=>{
          const a=matchAnal(p.ta,p.tb,STR);
          const favA=a.pw_a>a.pw_b;
          return `<div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;background:#f9f9f9;border-radius:7px;padding:7px 10px">
            <span style="font-size:12px;text-align:right;font-weight:${favA?'600':'400'};color:${favA?'#111':'#555'}">${p.ta}</span>
            <div style="text-align:center">
              <div style="font-size:11px;font-weight:600;color:#888">vs</div>
              <div style="font-size:9px;color:#aaa">${Math.round(a.pw_a*100)}% · ${Math.round(a.pd*100)}% · ${Math.round(a.pw_b*100)}%</div>
            </div>
            <span style="font-size:12px;text-align:left;font-weight:${!favA?'600':'400'};color:${!favA?'#111':'#555'}">${p.tb}</span>
          </div>`;
        }).join('')}
      </div>
      <p style="font-size:10px;color:#aaa;margin-top:5px">% = probabilidad Gana A · Empate · Gana B</p>
    </div>`:''}
  </div>`;

  const overlay=document.createElement('div');
  overlay.id='group-modal';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999;display:flex;align-items:center;justify-content:center;padding:1rem;overflow-y:auto';
  overlay.onclick=function(e){ if(e.target===overlay) closeGroupModal(); };
  overlay.innerHTML=html;
  document.body.appendChild(overlay);
}

function closeGroupModal(){
  const m=document.getElementById('group-modal');
  if(m) m.remove();
}

// ── PERFIL DE SELECCIÓN ───────────────────────────────────────────────────────
function openTeamProfile(name){
  if(!IS_PREMIUM){
    showPremiumModal();
    return;
  }
  const existing=document.getElementById('team-modal');
  if(existing) existing.remove();

  const fx=getFx();
  const td=TD[name]||{};
  const mcp=MCP[name]||{};
  const str=+(STR[name]||0).toFixed(3);

  // Encontrar grupo del equipo
  let teamGroup=null, groupPos=null, groupRows=null;
  for(const[g,ms] of Object.entries(GRP)){
    if(ms.includes(name)){
      teamGroup=g;
      groupRows=realGroupStandings(g,fx);
      groupPos=groupRows.findIndex(r=>r.name===name);
      break;
    }
  }
  const gRow=groupRows?groupRows[groupPos]:null;

  // Historial en el torneo — grupos + eliminatorias
  const stats={played:0,wins:0,draws:0,losses:0,gf:0,ga:0,form:[]};
  const groupTeams = teamGroup ? GRP[teamGroup] : [];

  // Partidos de grupos — usar solo partidos donde el equipo aparece en su grupo
  // y verificar ambas direcciones de la clave para evitar duplicados
  const countedKeys=new Set();
  for(const[k,r] of Object.entries(fx)){
    const[ta,tb]=k.split('|');
    if(ta!==name&&tb!==name) continue;
    const opp=ta===name?tb:ta;
    if(teamGroup&&!groupTeams.includes(opp)) continue;
    // Evitar contar el mismo partido dos veces (ta|tb y tb|ta)
    const canonical=[name,opp].sort().join('|');
    if(countedKeys.has(canonical)) continue;
    countedKeys.add(canonical);
    const isHome=ta===name;
    const myG=isHome?r[0]:r[1], oppG=isHome?r[1]:r[0];
    stats.played++; stats.gf+=myG; stats.ga+=oppG;
    if(myG>oppG){stats.wins++;stats.form.push('W');}
    else if(myG===oppG){stats.draws++;stats.form.push('D');}
    else{stats.losses++;stats.form.push('L');}
  }

  // Partidos de eliminatorias (KO_RR)
  const kofx=getKOFx();
  if(BD){
    const allKO=[...BD.r32,...BD.r16,...BD.qf,...BD.sf,...(BD.fin?[BD.fin]:[])];
    allKO.forEach(m=>{
      if(m.ta!==name&&m.tb!==name) return;
      const mid=m.id;
      if(!kofx[mid]) return;
      const r=kofx[mid];
      const isHome=m.ta===name;
      const myG=isHome?r[0]:r[1], oppG=isHome?r[1]:r[0];
      stats.played++; stats.gf+=myG; stats.ga+=oppG;
      if(myG>oppG){stats.wins++;stats.form.push('W');}
      else if(myG===oppG){stats.draws++;stats.form.push('D');}
      else{stats.losses++;stats.form.push('L');}
    });
  }

  // xG promedio del modelo
  const u=bayesUpd();
  let xgFor=0, xgAg=0, xgCount=0;
  if(teamGroup){
    const ms=GRP[teamGroup];
    ms.forEach(opp=>{
      if(opp===name) return;
      const a=matchAnal(name,opp,u);
      xgFor+=a.la; xgAg+=a.lb; xgCount++;
    });
  }
  const avgXgFor=xgCount?+(xgFor/xgCount).toFixed(2):0;
  const avgXgAg=xgCount?+(xgAg/xgCount).toFixed(2):0;
  const cIdx=CORNER_IDX[name]||5.5;

  // Próximo partido pendiente
  let nextMatch=null;
  if(teamGroup){
    const ms=GRP[teamGroup];
    for(let i=0;i<ms.length;i++) for(let j=i+1;j<ms.length;j++){
      const ta=ms[i],tb=ms[j];
      if(ta!==name&&tb!==name) continue;
      if(getResult(fx,ta,tb)) continue;
      const opp=ta===name?tb:ta;
      const a=matchAnal(ta,tb,u);
      const myWinP=ta===name?a.pw_a:a.pw_b;
      nextMatch={opp, myWinP:+(myWinP*100).toFixed(0), group:teamGroup};
      break;
    }
  }
  // Si no hay en grupos buscar en bracket
  if(!nextMatch&&BD){
    const allKO=[...BD.r32,...BD.r16,...BD.qf,...BD.sf,...(BD.fin?[BD.fin]:[])];
    for(const m of allKO){
      if(m.ta!==name&&m.tb!==name) continue;
      const opp=m.ta===name?m.tb:m.ta;
      const myWinP=m.ta===name?m.pw_a:m.pw_b;
      nextMatch={opp, myWinP:+(myWinP*100).toFixed(0), ko:true};
      break;
    }
  }

  // Forma dots
  function formDot(r){
    const bg=r==='W'?'#d4edda':r==='D'?'#e8e8e8':'#fde8e8';
    const col=r==='W'?'#1a5e34':r==='D'?'#555':'#c00';
    return`<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:${bg};color:${col};font-size:10px;font-weight:700">${r}</span>`;
  }

  // Barra de probabilidad
  function probBar(pct, color='#111'){
    return`<div style="display:flex;align-items:center;gap:8px">
      <div style="flex:1;height:6px;background:#e8e8e8;border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${color};border-radius:3px"></div>
      </div>
      <span style="font-size:12px;font-weight:600;color:${color};min-width:36px;text-align:right">${pct}%</span>
    </div>`;
  }

  const posLabel=groupPos===0?'1°':groupPos===1?'2°':groupPos===2?'3°':'4°';
  const isHost=!!HOME[name];
  const safeId=name.replace(/[\s\.]/g,'_');

  const html=`<div class="modal-box" style="max-width:480px">
    <div class="modal-hdr">
      <div>
        <div class="modal-title">${name} ${isHost?'🏠':''}</div>
        <div class="modal-sub">${td.conf||''} · ${isHost?'País sede · ':''}Fuerza del modelo: ${str}</div>
      </div>
      <button class="modal-close" onclick="closeTeamProfile()">&#x2715;</button>
    </div>

    <!-- Tabs -->
    <div style="display:flex;border-bottom:1px solid #e0e0e0;background:#fafafa">
      <button id="tptab-perfil" onclick="switchTeamTab('perfil','${safeId}')"
        style="flex:1;padding:10px;font-size:12px;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:2px solid #111;color:#111;font-family:inherit">
        📊 Perfil
      </button>
      <button id="tptab-comparar" onclick="switchTeamTab('comparar','${safeId}')"
        style="flex:1;padding:10px;font-size:12px;font-weight:500;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;color:#888;font-family:inherit">
        ⚡ Comparar
      </button>
    </div>

    <!-- Tab Perfil -->
    <div id="tptab-content-perfil-${safeId}">

    <!-- Posición en el grupo -->
    ${teamGroup?`<div class="modal-section">
      <div class="modal-sec-title">Posición en el torneo</div>
      <div style="display:flex;align-items:center;gap:12px;background:#f5f5f5;border-radius:10px;padding:12px 14px">
        <div style="font-size:32px;font-weight:700;color:${groupPos<2?'#1a5e34':'#555'}">${posLabel}</div>
        <div>
          <div style="font-size:13px;font-weight:500">Grupo ${teamGroup}</div>
          <div style="font-size:11px;color:#888;margin-top:2px">
            ${gRow?`${gRow.pts} pts · ${gRow.pj} PJ · ${gRow.gf} GF · ${gRow.ga} GA · DG ${gRow.gf-gRow.ga>0?'+':''}${gRow.gf-gRow.ga}`:'Sin partidos jugados'}
          </div>
        </div>
        ${groupPos<2?'<span style="margin-left:auto;font-size:11px;background:#d4edda;color:#1a5e34;border-radius:5px;padding:3px 8px;font-weight:600">En zona de clasificación</span>':''}
      </div>
    </div>`:''}

    <!-- Rendimiento en el torneo -->
    ${stats.played>0?`<div class="modal-section">
      <div class="modal-sec-title">Rendimiento en el torneo</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px">
        <div style="text-align:center;background:#f5f5f5;border-radius:8px;padding:8px">
          <div style="font-size:20px;font-weight:700">${stats.played}</div>
          <div style="font-size:9px;color:#888">Jugados</div>
        </div>
        <div style="text-align:center;background:#d4edda;border-radius:8px;padding:8px">
          <div style="font-size:20px;font-weight:700;color:#1a5e34">${stats.wins}</div>
          <div style="font-size:9px;color:#1a5e34">Victorias</div>
        </div>
        <div style="text-align:center;background:#f0f0f0;border-radius:8px;padding:8px">
          <div style="font-size:20px;font-weight:700;color:#555">${stats.draws}</div>
          <div style="font-size:9px;color:#555">Empates</div>
        </div>
        <div style="text-align:center;background:#fde8e8;border-radius:8px;padding:8px">
          <div style="font-size:20px;font-weight:700;color:#c00">${stats.losses}</div>
          <div style="font-size:9px;color:#c00">Derrotas</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:11px;color:#888">Forma:</span>
        ${stats.form.map(formDot).join(' ')}
        <span style="font-size:11px;color:#888;margin-left:4px">${stats.gf} GF · ${stats.ga} GA</span>
      </div>
    </div>`:`<div class="modal-section">
      <div class="modal-sec-title">Rendimiento en el torneo</div>
      <div style="font-size:12px;color:#aaa;text-align:center;padding:10px 0">Sin partidos jugados aún</div>
    </div>`}

    <!-- Probabilidades del modelo -->
    <div class="modal-section">
      <div class="modal-sec-title">Probabilidades del modelo</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div><div style="font-size:11px;color:#555;margin-bottom:3px">Superar fase de grupos</div>${probBar(mcp.p_group||0,'#1565c0')}</div>
        <div><div style="font-size:11px;color:#555;margin-bottom:3px">Llegar a Octavos de final</div>${probBar(mcp.p_r16||0,'#1565c0')}</div>
        <div><div style="font-size:11px;color:#555;margin-bottom:3px">Llegar a Cuartos de final</div>${probBar(mcp.p_qf||0,'#7c3aed')}</div>
        <div><div style="font-size:11px;color:#555;margin-bottom:3px">Llegar a la Final</div>${probBar(mcp.p_final||0,'#b45309')}</div>
        <div style="background:#f9f9f9;border-radius:8px;padding:10px">
          <div style="font-size:11px;color:#555;margin-bottom:3px">🏆 Ganar el Mundial</div>
          ${probBar(mcp.p_champ||0,'#1a5e34')}
        </div>
      </div>
    </div>

    <!-- Análisis del modelo -->
    <div class="modal-section">
      <div class="modal-sec-title">Análisis del modelo</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
        <div style="text-align:center;background:#f5f5f5;border-radius:8px;padding:10px">
          <div style="font-size:18px;font-weight:700">${avgXgFor}</div>
          <div style="font-size:9px;color:#888;margin-top:2px">xG generado</div>
        </div>
        <div style="text-align:center;background:#f5f5f5;border-radius:8px;padding:10px">
          <div style="font-size:18px;font-weight:700">${avgXgAg}</div>
          <div style="font-size:9px;color:#888;margin-top:2px">xG concedido</div>
        </div>
        <div style="text-align:center;background:#f5f5f5;border-radius:8px;padding:10px">
          <div style="font-size:18px;font-weight:700">${cIdx}</div>
          <div style="font-size:9px;color:#888;margin-top:2px">Índice corners</div>
        </div>
      </div>
    </div>

    <!-- Próximo partido -->
    ${nextMatch?`<div class="modal-section">
      <div class="modal-sec-title">Próximo partido</div>
      <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;background:#f9f9f9;border-radius:10px;padding:12px 14px">
        <div style="text-align:right">
          <div style="font-size:13px;font-weight:600">${name}</div>
          <div style="font-size:11px;color:#1a5e34;font-weight:600;margin-top:2px">${nextMatch.myWinP}% de ganar</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:12px;font-weight:700;color:#888">vs</div>
          ${nextMatch.ko?'<div style="font-size:9px;color:#aaa;margin-top:2px">Eliminatoria</div>':''}
        </div>
        <div style="text-align:left">
          <div style="font-size:13px;font-weight:600;cursor:pointer;text-decoration:underline dotted #ccc" onclick="closeTeamProfile();setTimeout(()=>openTeamProfile('${nextMatch.opp}'),100)">${nextMatch.opp}</div>
          <div style="font-size:9px;color:#aaa;margin-top:2px">Click para ver su perfil</div>
        </div>
      </div>
    </div>`:''}

    </div><!-- fin tab perfil -->

    <!-- Tab Comparar -->
    <div id="tptab-content-comparar-${safeId}" style="display:none">
      <div class="modal-section">
        <div class="modal-sec-title">⚡ Comparar ${name} con...</div>
        <datalist id="team-list-compare-${safeId}">
          ${Object.keys(TD).map(t=>`<option value="${t}">`).join('')}
        </datalist>
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
          <input id="compare-input-${safeId}" type="text"
            list="team-list-compare-${safeId}"
            placeholder="Escribe un equipo..."
            style="flex:1;padding:9px 12px;border:1px solid #ddd;border-radius:8px;font-size:13px;font-family:inherit;outline:none"
            onfocus="this.style.borderColor='#111'" onblur="this.style.borderColor='#ddd'"
            onkeydown="if(event.key==='Enter') openComparator('${name}', this.value)">
          <button onclick="openComparator('${name}', document.getElementById('compare-input-${safeId}').value)"
            style="padding:9px 16px;background:#111;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;font-family:inherit;font-weight:500;white-space:nowrap">
            Comparar →
          </button>
        </div>
        <p style="font-size:11px;color:#aaa">Puedes escribir cualquiera de los 48 equipos del torneo</p>
      </div>
    </div>

  </div>`;

  const overlay=document.createElement('div');
  overlay.id='team-modal';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999;display:flex;align-items:center;justify-content:center;padding:1rem;overflow-y:auto';
  overlay.onclick=function(e){ if(e.target===overlay) closeTeamProfile(); };
  overlay.innerHTML=html;
  document.body.appendChild(overlay);
}

function closeTeamProfile(){
  const m=document.getElementById('team-modal');
  if(m) m.remove();
}

function switchTeamTab(tab, safeId){
  ['perfil','comparar'].forEach(function(t){
    const btn=document.getElementById('tptab-'+t);
    const content=document.getElementById('tptab-content-'+t+'-'+safeId);
    if(!btn||!content) return;
    const active=t===tab;
    btn.style.borderBottom=active?'2px solid #111':'2px solid transparent';
    btn.style.color=active?'#111':'#888';
    btn.style.fontWeight=active?'600':'400';
    content.style.display=active?'block':'none';
  });
}

// ── COMPARADOR DE EQUIPOS ─────────────────────────────────────────────────────
function openComparator(nameA, nameB){
  if(!IS_PREMIUM){ showPremiumModal(); return; }
  // Limpiar y validar
  nameB=(nameB||'').trim();
  if(!nameB){ alert('Escribe el nombre de un equipo para comparar'); return; }
  // Buscar coincidencia exacta o parcial
  const match=Object.keys(TD).find(t=>t.toLowerCase()===nameB.toLowerCase())
    || Object.keys(TD).find(t=>t.toLowerCase().includes(nameB.toLowerCase()));
  if(!match){ alert('No encontré ese equipo. Verifica el nombre.'); return; }
  nameB=match;
  if(nameA===nameB){ alert('Selecciona un equipo diferente para comparar'); return; }

  // Cerrar modal anterior
  const existing=document.getElementById('comparator-modal');
  if(existing) existing.remove();
  const teamModal=document.getElementById('team-modal');
  if(teamModal) teamModal.remove();

  const u=bayesUpd();
  const fx=getFx();

  // Datos de cada equipo
  function getTeamData(name){
    const td=TD[name]||{};
    const mcp=MCP[name]||{};
    const str=+(STR[name]||0).toFixed(3);
    const cIdx=CORNER_IDX[name]||5.5;
    const cardIdx=CARD_IDX[name]||6.0;

    // Stats reales en torneo
    const stats={played:0,wins:0,draws:0,losses:0,gf:0,ga:0,form:[]};
    let teamGroup=null;
    for(const[g,ms] of Object.entries(GRP)){
      if(ms.includes(name)){ teamGroup=g; break; }
    }
    const groupTeams=teamGroup?GRP[teamGroup]:[];
    const countedKeys2=new Set();
    for(const[k,r] of Object.entries(fx)){
      const[ta,tb]=k.split('|');
      if(ta!==name&&tb!==name) continue;
      const opp=ta===name?tb:ta;
      if(teamGroup&&!groupTeams.includes(opp)) continue;
      const canonical=[name,opp].sort().join('|');
      if(countedKeys2.has(canonical)) continue;
      countedKeys2.add(canonical);
      const isHome=ta===name;
      const myG=isHome?r[0]:r[1], oppG=isHome?r[1]:r[0];
      stats.played++; stats.gf+=myG; stats.ga+=oppG;
      if(myG>oppG){stats.wins++;stats.form.push('W');}
      else if(myG===oppG){stats.draws++;stats.form.push('D');}
      else{stats.losses++;stats.form.push('L');}
    }
    // Partidos de eliminatorias
    const kofx2=getKOFx();
    if(BD){
      const allKO=[...BD.r32,...BD.r16,...BD.qf,...BD.sf,...(BD.fin?[BD.fin]:[])];
      allKO.forEach(m=>{
        if(m.ta!==name&&m.tb!==name) return;
        if(!kofx2[m.id]) return;
        const r=kofx2[m.id];
        const isHome=m.ta===name;
        const myG=isHome?r[0]:r[1], oppG=isHome?r[1]:r[0];
        stats.played++; stats.gf+=myG; stats.ga+=oppG;
        if(myG>oppG){stats.wins++;stats.form.push('W');}
        else if(myG===oppG){stats.draws++;stats.form.push('D');}
        else{stats.losses++;stats.form.push('L');}
      });
    }
    if(teamGroup){
      let xgFor=0,xgAg=0,xgCount=0;
      GRP[teamGroup].forEach(opp=>{
        if(opp===name) return;
        const a=matchAnal(name,opp,u);
        xgFor+=a.la; xgAg+=a.lb; xgCount++;
      });
      return{
        name, td, mcp, str, cIdx, cardIdx, stats,
        xgFor: xgCount?+(xgFor/xgCount).toFixed(2):0,
        xgAg:  xgCount?+(xgAg/xgCount).toFixed(2):0,
        isHost: !!HOME[name]
      };
    }

    return{
      name, td, mcp, str, cIdx, cardIdx, stats,
      xgFor:0, xgAg:0, isHost:!!HOME[name]
    };
  }

  const dA=getTeamData(nameA);
  const dB=getTeamData(nameB);

  // Partido hipotético entre los dos
  const hyp=matchAnal(nameA,nameB,u);
  const maxP=Math.max(hyp.pw_a,hyp.pd,hyp.pw_b);
  const [hcA,hcB]=cornerCalc(nameA,nameB);
  const [htA,htB]=cardCalc(nameA,nameB);

  // Fila comparativa — barra doble enfrentada
  function compRow(label, valA, valB, higherIsBetter=true){
    const numA=parseFloat(valA)||0, numB=parseFloat(valB)||0;
    const max=Math.max(numA,numB,0.01);
    const wA=Math.round(numA/max*100), wB=Math.round(numB/max*100);
    const betterA=higherIsBetter?(numA>=numB):(numA<=numB);
    const betterB=higherIsBetter?(numB>numA):(numB<numA);
    const colA=betterA?'#1a5e34':'#555', colB=betterB?'#1a5e34':'#555';
    const bgA=betterA?'#1a5e34':'#ccc', bgB=betterB?'#1a5e34':'#ccc';
    return`<div style="display:grid;grid-template-columns:1fr 80px 1fr;align-items:center;gap:6px;padding:6px 0;border-bottom:1px solid #f5f5f5">
      <div style="display:flex;align-items:center;justify-content:flex-end;gap:6px">
        <span style="font-size:12px;font-weight:600;color:${colA}">${valA}</span>
        <div style="width:60px;height:5px;background:#e8e8e8;border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${wA}%;background:${bgA};border-radius:3px;float:right"></div>
        </div>
      </div>
      <div style="text-align:center;font-size:10px;color:#888;font-weight:500">${label}</div>
      <div style="display:flex;align-items:center;gap:6px">
        <div style="width:60px;height:5px;background:#e8e8e8;border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${wB}%;background:${bgB};border-radius:3px"></div>
        </div>
        <span style="font-size:12px;font-weight:600;color:${colB}">${valB}</span>
      </div>
    </div>`;
  }

  function formDots(form){
    if(!form.length) return '<span style="font-size:10px;color:#ccc">—</span>';
    return form.map(r=>{
      const bg=r==='W'?'#d4edda':r==='D'?'#e8e8e8':'#fde8e8';
      const col=r==='W'?'#1a5e34':r==='D'?'#555':'#c00';
      return`<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:${bg};color:${col};font-size:8px;font-weight:700">${r}</span>`;
    }).join(' ');
  }

  const html=`<div class="modal-box" style="max-width:560px">
    <div class="modal-hdr">
      <div>
        <div class="modal-title">${nameA} vs ${nameB}</div>
        <div class="modal-sub">Comparador de selecciones</div>
      </div>
      <button class="modal-close" onclick="closeComparator()">&#x2715;</button>
    </div>

    <!-- Header equipos -->
    <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;padding:12px 16px;background:#f9f9f9;border-bottom:1px solid #f0f0f0">
      <div style="text-align:center">
        <div style="font-size:14px;font-weight:600">${nameA}${dA.isHost?' 🏠':''}</div>
        <div style="font-size:10px;color:#888;margin-top:2px">${dA.td.conf||''}</div>
        <div style="margin-top:5px">${formDots(dA.stats.form)}</div>
      </div>
      <div style="text-align:center;font-size:11px;font-weight:700;color:#aaa">VS</div>
      <div style="text-align:center">
        <div style="font-size:14px;font-weight:600">${nameB}${dB.isHost?' 🏠':''}</div>
        <div style="font-size:10px;color:#888;margin-top:2px">${dB.td.conf||''}</div>
        <div style="margin-top:5px">${formDots(dB.stats.form)}</div>
      </div>
    </div>

    <!-- Tabla comparativa -->
    <div class="modal-section">
      <div class="modal-sec-title">Comparación de métricas</div>
      <div style="padding:0 4px">
        ${compRow('Fuerza modelo', dA.str, dB.str)}
        ${compRow('% Campeón', (dA.mcp.p_champ||0)+'%', (dB.mcp.p_champ||0)+'%')}
        ${compRow('% Llegar Final', (dA.mcp.p_final||0)+'%', (dB.mcp.p_final||0)+'%')}
        ${compRow('xG generado', dA.xgFor, dB.xgFor)}
        ${compRow('xG concedido', dA.xgAg, dB.xgAg, false)}
        ${compRow('Goles en torneo', dA.stats.gf, dB.stats.gf)}
        ${compRow('Goles concedidos', dA.stats.ga, dB.stats.ga, false)}
        ${compRow('Índice corners', dA.cIdx, dB.cIdx)}
        ${compRow('Índice agresividad', dA.cardIdx, dB.cardIdx, false)}
      </div>
    </div>

    <!-- Partido hipotético -->
    <div class="modal-section">
      <div class="modal-sec-title">⚡ Si se enfrentaran hoy</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px">
        <div style="text-align:center;background:${hyp.pw_a===maxP?'#d4edda':'#f0f0f0'};border-radius:10px;padding:12px 6px">
          <div style="font-size:22px;font-weight:700;color:${hyp.pw_a===maxP?'#1a5e34':'#555'}">${Math.round(hyp.pw_a*100)}%</div>
          <div style="font-size:10px;color:${hyp.pw_a===maxP?'#1a5e34':'#888'};margin-top:2px">Gana ${nameA.split(' ')[0]}</div>
        </div>
        <div style="text-align:center;background:${hyp.pd===maxP?'#d4edda':'#f0f0f0'};border-radius:10px;padding:12px 6px">
          <div style="font-size:22px;font-weight:700;color:${hyp.pd===maxP?'#1a5e34':'#555'}">${Math.round(hyp.pd*100)}%</div>
          <div style="font-size:10px;color:${hyp.pd===maxP?'#1a5e34':'#888'};margin-top:2px">Empate</div>
        </div>
        <div style="text-align:center;background:${hyp.pw_b===maxP?'#d4edda':'#f0f0f0'};border-radius:10px;padding:12px 6px">
          <div style="font-size:22px;font-weight:700;color:${hyp.pw_b===maxP?'#1a5e34':'#555'}">${Math.round(hyp.pw_b*100)}%</div>
          <div style="font-size:10px;color:${hyp.pw_b===maxP?'#1a5e34':'#888'};margin-top:2px">Gana ${nameB.split(' ')[0]}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;background:#f5f5f5;border-radius:8px;padding:10px 14px">
        <div style="text-align:right">
          <div style="font-size:18px;font-weight:700">${hyp.la}</div>
          <div style="font-size:9px;color:#888">xG ${nameA.split(' ')[0]}</div>
        </div>
        <div style="text-align:center;font-size:10px;color:#aaa;font-weight:600">xG esperado</div>
        <div style="text-align:left">
          <div style="font-size:18px;font-weight:700">${hyp.lb}</div>
          <div style="font-size:9px;color:#888">xG ${nameB.split(' ')[0]}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px">
        <div style="text-align:center;background:#f0f0f0;border-radius:8px;padding:8px">
          <div style="font-size:13px;font-weight:600">${+(hcA+hcB).toFixed(2)} corners</div>
          <div style="font-size:9px;color:#888;margin-top:1px">esperados (${hcA} · ${hcB})</div>
        </div>
        <div style="text-align:center;background:#fef9e7;border-radius:8px;padding:8px">
          <div style="font-size:13px;font-weight:600">${+(htA+htB).toFixed(1)} tarjetas</div>
          <div style="font-size:9px;color:#856404;margin-top:1px">esperadas (${htA} · ${htB})</div>
        </div>
      </div>
    </div>

    <!-- Volver -->
    <div style="padding:10px 16px;border-top:1px solid #f0f0f0;display:flex;gap:8px">
      <button onclick="closeComparator();openTeamProfile('${nameA}')"
        style="flex:1;padding:8px;background:#f5f5f5;border:1px solid #e0e0e0;border-radius:8px;font-size:12px;cursor:pointer;font-family:inherit">
        ← Volver a ${nameA}
      </button>
      <button onclick="closeComparator();openTeamProfile('${nameB}')"
        style="flex:1;padding:8px;background:#f5f5f5;border:1px solid #e0e0e0;border-radius:8px;font-size:12px;cursor:pointer;font-family:inherit">
        Ver perfil ${nameB} →
      </button>
    </div>
  </div>`;

  const overlay=document.createElement('div');
  overlay.id='comparator-modal';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999;display:flex;align-items:center;justify-content:center;padding:1rem;overflow-y:auto';
  overlay.onclick=function(e){ if(e.target===overlay) closeComparator(); };
  overlay.innerHTML=html;
  document.body.appendChild(overlay);
}

function closeComparator(){
  const m=document.getElementById('comparator-modal');
  if(m) m.remove();
}

// Comparador directo desde Probabilidades
function openComparatorDirect(){
  if(!IS_PREMIUM){ showPremiumModal(); return; }
  const existing=document.getElementById('comparator-direct-modal');
  if(existing) existing.remove();

  const teamOptions=Object.keys(TD).map(t=>`<option value="${t}">`).join('');
  const html=`<div class="modal-box" style="max-width:360px">
    <div class="modal-hdr">
      <div><div class="modal-title">⚡ Comparar equipos</div></div>
      <button class="modal-close" onclick="document.getElementById('comparator-direct-modal').remove()">&#x2715;</button>
    </div>
    <div class="modal-section">
      <datalist id="team-list-direct">${teamOptions}</datalist>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div>
          <div style="font-size:11px;color:#888;margin-bottom:4px">Equipo A</div>
          <input id="comp-direct-a" type="text" list="team-list-direct" placeholder="Escribe un equipo..."
            style="width:100%;padding:9px 12px;border:1px solid #ddd;border-radius:8px;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box"
            onfocus="this.style.borderColor='#111'" onblur="this.style.borderColor='#ddd'">
        </div>
        <div>
          <div style="font-size:11px;color:#888;margin-bottom:4px">Equipo B</div>
          <input id="comp-direct-b" type="text" list="team-list-direct" placeholder="Escribe un equipo..."
            style="width:100%;padding:9px 12px;border:1px solid #ddd;border-radius:8px;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box"
            onfocus="this.style.borderColor='#111'" onblur="this.style.borderColor='#ddd'">
        </div>
        <button onclick="
          document.getElementById('comparator-direct-modal').remove();
          openComparator(document.getElementById('comp-direct-a').value, document.getElementById('comp-direct-b').value)"
          style="padding:10px;background:#111;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;font-family:inherit;font-weight:500">
          Ver comparación →
        </button>
      </div>
    </div>
  </div>`;

  const overlay=document.createElement('div');
  overlay.id='comparator-direct-modal';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999;display:flex;align-items:center;justify-content:center;padding:1rem';
  overlay.onclick=function(e){ if(e.target===overlay) overlay.remove(); };
  overlay.innerHTML=html;
  document.body.appendChild(overlay);
}

// ── RENDER RANKING ────────────────────────────────────────────────────────────
// Detecta equipos eliminados basándose en resultados reales del bracket
function getEliminatedTeams(){
  const eliminated=new Set();
  if(!BD) return eliminated;
  const kofx=getKOFx();
  const allKO=[...BD.r32,...BD.r16,...BD.qf,...BD.sf,...(BD.fin?[BD.fin]:[])];
  allKO.forEach(m=>{
    if(!m||!m.ta||!m.tb) return;
    const r=kofx[m.id];
    if(!r) return;
    const winner=getKOWinner(m.id,m.ta,m.tb,r[0],r[1]);
    if(!winner) return; // empate sin penales definidos aún
    const loser=winner===m.ta?m.tb:m.ta;
    eliminated.add(loser);
  });
  // También eliminados de fase de grupos (4° y a veces 3° lugar)
  const fx=getFx();
  for(const g of Object.keys(GRP)){
    const rows=realGroupStandings(g,fx);
    if(rows.every(r=>r.pj===3)){
      // Grupo completo: eliminados son 4° siempre, y 3° si no está en mejores 8
      eliminated.add(rows[3].name);
    }
  }
  return eliminated;
}

function renderRanking(){
  const sorted=Object.entries(MCP).sort((a,b)=>b[1].p_champ-a[1].p_champ);
  const maxP=sorted[0]?sorted[0][1].p_champ:1;
  const eliminated=getEliminatedTeams();

  if(!IS_PREMIUM){
    document.getElementById('rbody').innerHTML='';
    document.getElementById('scards').innerHTML=`
      <div style="grid-column:1/-1;padding:20px;text-align:center;background:#f9f9f9;border-radius:10px;border:1.5px dashed #ddd">
        <div style="font-size:28px;margin-bottom:8px">🔐</div>
        <div style="font-size:14px;font-weight:600;color:#111;margin-bottom:6px">Ranking de probabilidades</div>
        <div style="font-size:12px;color:#888;margin-bottom:14px">Ve qué equipo tiene más chances de ganar el Mundial según el modelo</div>
        <button onclick="showPremiumModal()" style="padding:10px 20px;background:#111;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;font-family:inherit;font-weight:500">🔓 Activar acceso premium</button>
      </div>`;
    return;
  }

  document.getElementById('rbody').innerHTML=sorted.map(([n,p],i)=>{
    const isElim=eliminated.has(n);
    const med=i===0?`<span class="m1">1</span>`:i===1?`<span class="m2">2</span>`:i===2?`<span class="m3">3</span>`:i+1;
    const home=HOME[n]?`<span class="chip">sede</span>`:'';
    const elimChip=isElim?`<span style="font-size:9px;background:#fde8e8;color:#c00;border-radius:4px;padding:1px 6px;font-weight:600;margin-left:5px;white-space:nowrap">✗ Eliminado</span>`:'';
    const rowStyle=isElim?'opacity:.45;background:#fafafa':'';
    const champPct=isElim?0:p.p_champ;
    return`<tr style="${rowStyle}"><td>${med}</td><td><strong style="cursor:pointer;color:#111;text-decoration:underline dotted #ccc" onclick="openTeamProfile('${n}')">${n}</strong>${home}${elimChip}</td><td style="font-size:10px;color:#888">${TD[n]?.conf||''}</td><td class="r">${(STR[n]||0).toFixed(3)}</td><td class="r">${p.p_group}%</td><td class="r">${isElim?'0%':p.p_r16+'%'}</td><td class="r">${isElim?'0%':p.p_qf+'%'}</td><td class="r">${isElim?'0%':p.p_final+'%'}</td><td class="r"><strong>${isElim?'0%':p.p_champ+'%'}</strong></td>
    <td><div class="bwrap"><div class="bbar" style="width:${isElim?0:Math.round(p.p_champ/maxP*90)}px;background:${isElim?'#ccc':'#111'}"></div><span style="font-size:11px">${champPct}%</span></div></td></tr>`;
  }).join('');
  const fx=getFx();
  const activeTeams=sorted.filter(([n])=>!eliminated.has(n));
  document.getElementById('scards').innerHTML=`
    <div class="sc"><div class="sv">${Object.keys(fx).length}/72</div><div class="sl">Partidos jugados</div></div>
    <div class="sc"><div class="sv">${activeTeams[0]?activeTeams[0][0]:'-'}</div><div class="sl">Favorito actual</div></div>
    <div class="sc"><div class="sv">${activeTeams[0]?activeTeams[0][1].p_champ+'%':'-'}</div><div class="sl">% máx. campeón</div></div>
    <div class="sc"><div class="sv">${eliminated.size}</div><div class="sl">Equipos eliminados</div></div>
    <div class="sc" style="cursor:pointer;background:#111;color:#fff" onclick="openComparatorDirect()">
      <div class="sv" style="font-size:14px">⚡</div>
      <div class="sl" style="color:#aaa">Comparar equipos</div>
    </div>`;
}

// ── TRACKER DE ACIERTOS ───────────────────────────────────────────────────────
function calcTracker(){
  const fx=getFx();
  // Fases y sus partidos
  const phases=[
    {key:'grupos', label:'Fase de grupos', matches:[]},
    {key:'r32',    label:'Ronda de 32',    matches:[]},
    {key:'r16',    label:'Octavos de final',matches:[]},
    {key:'qf',     label:'Cuartos de final',matches:[]},
    {key:'sf',     label:'Semifinales',    matches:[]},
    {key:'final',  label:'Gran Final',     matches:[]},
  ];

  // Recopilar partidos de grupos con resultado real
  for(const[g,ms] of Object.entries(GRP)){
    for(let i=0;i<ms.length;i++) for(let j=i+1;j<ms.length;j++){
      const ta=ms[i],tb=ms[j],k=ta+'|'+tb;
      if(fx[k]!==undefined) phases[0].matches.push({ta,tb,real:fx[k],phase:'grupos'});
    }
  }

  // Recopilar partidos KO con resultado real (cuando existan)
  const kofx=getKOFx();
  if(BD){
    const koMap={r32:BD.r32,r16:BD.r16,qf:BD.qf,sf:BD.sf,final:BD.fin?[BD.fin]:[]};
    const koPhases=['r32','r16','qf','sf','final'];
    koPhases.forEach((pk,pi)=>{
      (koMap[pk]||[]).forEach(m=>{
        if(kofx[m.id]) phases[pi+1].matches.push({ta:m.ta,tb:m.tb,real:kofx[m.id],phase:pk,predicted:m});
      });
    });
  }

  // Para cada partido con resultado calcular si el modelo acertó
  // Acierto = el equipo que el modelo predijo como favorito (mayor pw) ganó
  // También calculamos acierto de Over/Under 2.5
  function evalMatch(ta,tb,real){
    const u=bayesUpd();
    const a=matchAnal(ta,tb,u);
    const realGA=real[0], realGB=real[1];
    const realWinner = realGA>realGB?'A':(realGB>realGA?'B':'D');
    const predWinner = a.pw_a>a.pw_b?'A':(a.pw_b>a.pw_a?'B':'D');

    // Acierto resultado: el favorito ganó
    const hitResult = realWinner===predWinner;

    // Acierto Over/Under 2.5
    const totalGoals=realGA+realGB;
    const predOver=(a.p_over25>=0.5);
    const realOver=(totalGoals>2.5);
    const hitOU = predOver===realOver;

    // Acierto BTTS
    const predBTTS=(a.p_btts>=0.5);
    const realBTTS=(realGA>=1&&realGB>=1);
    const hitBTTS = predBTTS===realBTTS;

    return{hitResult,hitOU,hitBTTS,predWinner,realWinner,a,realGA,realGB};
  }

  // Calcular stats por fase
  const results=phases.map(ph=>{
    if(!ph.matches.length) return{...ph,total:0,hitR:0,hitOU:0,hitBTTS:0,details:[]};
    const details=ph.matches.map(m=>{
      const ev=evalMatch(m.ta,m.tb,m.real);
      return{...m,...ev};
    });
    const total=details.length;
    const hitR=details.filter(d=>d.hitResult).length;
    const hitOU=details.filter(d=>d.hitOU).length;
    const hitBTTS=details.filter(d=>d.hitBTTS).length;
    return{...ph,total,hitR,hitOU,hitBTTS,details};
  }).filter(ph=>ph.total>0);

  return results;
}

function renderTracker(){
  const cont=document.getElementById('tracker-cont');
  if(!cont) return;

  if(!IS_PREMIUM){
    cont.innerHTML=premiumBanner('Tracker de Aciertos — ve qué tan bien predice el modelo');
    return;
  }

  const phases=calcTracker();
  const totalMatches=phases.reduce((s,p)=>s+p.total,0);
  const totalHitR=phases.reduce((s,p)=>s+p.hitR,0);
  const totalHitOU=phases.reduce((s,p)=>s+p.hitOU,0);
  const totalHitBTTS=phases.reduce((s,p)=>s+p.hitBTTS,0);
  const pctR=totalMatches?Math.round(totalHitR/totalMatches*100):0;
  const pctOU=totalMatches?Math.round(totalHitOU/totalMatches*100):0;
  const pctBTTS=totalMatches?Math.round(totalHitBTTS/totalMatches*100):0;

  if(!totalMatches){
    cont.innerHTML=`<div class="infobox">Aún no hay partidos jugados para evaluar. Sincroniza resultados y actualiza el modelo.</div>`;
    return;
  }

  // Color según precisión
  function pctColor(p){
    if(p>=65) return{bg:'#d4edda',col:'#1a5e34',label:'Muy bueno'};
    if(p>=50) return{bg:'#fff3cd',col:'#856404',label:'Bueno'};
    return{bg:'#fde8e8',col:'#c00',label:'Mejorando'};
  }
  const cR=pctColor(pctR), cOU=pctColor(pctOU), cBTTS=pctColor(pctBTTS);

  // Barra de precisión
  function pctBar(pct,color){
    return`<div style="height:6px;background:#e8e8e8;border-radius:3px;overflow:hidden;margin-top:5px">
      <div style="height:100%;width:${pct}%;background:${color};border-radius:3px;transition:width .4s"></div>
    </div>`;
  }

  let html=`
  <!-- Disclaimer educativo -->
  <div style="background:#e8f4fd;border:1px solid #93c5fd;border-radius:10px;padding:12px 14px;margin-bottom:1.2rem;display:flex;gap:10px;align-items:flex-start">
    <span style="font-size:20px;flex-shrink:0">📊</span>
    <div style="font-size:12px;color:#1e40af;line-height:1.5">
      <strong>¿Qué mide este tracker?</strong><br>
      El modelo predice el resultado más probable — no garantiza el 100% de aciertos. En fútbol, ni las casas de apuestas más grandes del mundo aciertan siempre.
      Un modelo con <strong>60-70% de precisión en resultado</strong> es considerado excelente en la industria.
      Este tracker te muestra cómo va el modelo en tiempo real, con honestidad total.
    </div>
  </div>

  <!-- Métricas globales -->
  <p class="slabel">Precisión global — Mundial 2026 · ${totalMatches} partidos evaluados</p>
  <div class="scards" style="margin-bottom:1.2rem">
    <div class="sc" style="background:${cR.bg}">
      <div class="sv" style="color:${cR.col}">${pctR}%</div>
      <div class="sl" style="color:${cR.col}">Resultado (${totalHitR}/${totalMatches})</div>
      ${pctBar(pctR,cR.col)}
    </div>
    <div class="sc" style="background:${cOU.bg}">
      <div class="sv" style="color:${cOU.col}">${pctOU}%</div>
      <div class="sl" style="color:${cOU.col}">Over/Under 2.5 (${totalHitOU}/${totalMatches})</div>
      ${pctBar(pctOU,cOU.col)}
    </div>
    <div class="sc" style="background:${cBTTS.bg}">
      <div class="sv" style="color:${cBTTS.col}">${pctBTTS}%</div>
      <div class="sl" style="color:${cBTTS.col}">BTTS (${totalHitBTTS}/${totalMatches})</div>
      ${pctBar(pctBTTS,cBTTS.col)}
    </div>
  </div>

  <!-- Por fase -->
  <p class="slabel">Desglose por fase</p>`;

  phases.forEach(ph=>{
    const pR=Math.round(ph.hitR/ph.total*100);
    const pOU=Math.round(ph.hitOU/ph.total*100);
    const pBTTS=Math.round(ph.hitBTTS/ph.total*100);
    const c=pctColor(pR);

    html+=`<div style="background:#fff;border:1px solid #e0e0e0;border-radius:10px;overflow:hidden;margin-bottom:10px">
      <div style="padding:8px 14px;background:#f9f9f9;border-bottom:1px solid #e0e0e0;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:12px;font-weight:500">${ph.label}</span>
        <span style="font-size:11px;color:#888">${ph.total} partido${ph.total>1?'s':''} evaluado${ph.total>1?'s':''}</span>
      </div>
      <div style="padding:10px 14px">
        <!-- Mini métricas -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">
          <div style="text-align:center;background:${pctColor(pR).bg};border-radius:8px;padding:8px">
            <div style="font-size:18px;font-weight:700;color:${pctColor(pR).col}">${pR}%</div>
            <div style="font-size:9px;color:${pctColor(pR).col};margin-top:1px">Resultado</div>
          </div>
          <div style="text-align:center;background:${pctColor(pOU).bg};border-radius:8px;padding:8px">
            <div style="font-size:18px;font-weight:700;color:${pctColor(pOU).col}">${pOU}%</div>
            <div style="font-size:9px;color:${pctColor(pOU).col};margin-top:1px">O/U 2.5</div>
          </div>
          <div style="text-align:center;background:${pctColor(pBTTS).bg};border-radius:8px;padding:8px">
            <div style="font-size:18px;font-weight:700;color:${pctColor(pBTTS).col}">${pBTTS}%</div>
            <div style="font-size:9px;color:${pctColor(pBTTS).col};margin-top:1px">BTTS</div>
          </div>
        </div>
        <!-- Detalle partidos -->
        <div style="display:flex;flex-direction:column;gap:4px">
          ${ph.details.map(d=>{
            const icon=d.hitResult?'✅':'❌';
            const iconOU=d.hitOU?'✅':'❌';
            const iconBTTS=d.hitBTTS?'✅':'❌';
            const predLabel=d.predWinner==='A'?d.ta:d.predWinner==='B'?d.tb:'Empate';
            const realLabel=d.realWinner==='A'?d.ta:d.realWinner==='B'?d.tb:'Empate';
            return`<div style="display:grid;grid-template-columns:1fr auto auto auto;align-items:center;gap:6px;background:#f9f9f9;border-radius:7px;padding:6px 10px;font-size:11px">
              <div>
                <span style="font-weight:500">${d.ta} ${d.realGA} - ${d.realGB} ${d.tb}</span>
                <span style="color:#888;margin-left:4px">· pred: ${predLabel}</span>
              </div>
              <span title="Resultado">${icon}</span>
              <span title="O/U 2.5">${iconOU} <span style="color:#888;font-size:10px">O/U</span></span>
              <span title="BTTS">${iconBTTS} <span style="color:#888;font-size:10px">BTTS</span></span>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  });

  html+=`<p style="font-size:11px;color:#999;margin-top:6px">
    ✅ = modelo acertó · ❌ = modelo falló · Se actualiza automáticamente al presionar "Actualizar modelo"
  </p>`;

  cont.innerHTML=html;
}

// ── KNOCKOUT ──────────────────────────────────────────────────────────────────
const KO_ROUNDS=[
  {key:'r32',label:'Ronda de 32',date:'2026-06-28',matches:['M73','M74','M75','M76','M77','M78','M79','M80','M81','M82','M83','M84','M85','M86','M87','M88']},
  {key:'r16',label:'Octavos de final',date:'2026-07-04',matches:['M89','M90','M91','M92','M93','M94','M95','M96']},
  {key:'qf',label:'Cuartos de final',date:'2026-07-09',matches:['M97','M98','M99','M100']},
  {key:'sf',label:'Semifinales',date:'2026-07-14',matches:['M101','M102']},
  {key:'final',label:'Gran Final',date:'2026-07-19',matches:['M104']}
];

function setKO(matchId,idx,val){
  const v=parseInt(val);
  if(isNaN(v)||val===''){ if(KO_RR[matchId]) KO_RR[matchId][idx]=undefined; saveToStorage(); return; }
  if(!KO_RR[matchId]) KO_RR[matchId]=[undefined,undefined];
  KO_RR[matchId][idx]=v;
  saveToStorage();
  // Guardar en Supabase si ambos goles están completos
  if(KO_RR[matchId][0]!==undefined&&KO_RR[matchId][1]!==undefined){
    saveToSupabase(matchId, KO_RR[matchId][0], KO_RR[matchId][1], 'ko');
  }
  // Re-renderizar para mostrar/ocultar el selector de penales si es empate
  const koSection=document.getElementById('ko-section');
  if(koSection) koSection.innerHTML=renderKnockoutInputs();
}

// Ganador en penales — se guarda separado para no afectar el marcador real
let KO_PEN={};
function setKOPenalty(matchId,winnerTeam){
  KO_PEN[matchId]=winnerTeam;
  try{
    localStorage.setItem('wc2026_penalties', JSON.stringify(KO_PEN));
  }catch(e){}
  saveToSupabase('PEN_'+matchId, winnerTeam==='A'?1:0, winnerTeam==='B'?1:0, 'penal');
}
function loadPenalties(){
  try{
    const raw=localStorage.getItem('wc2026_penalties');
    if(raw) KO_PEN=JSON.parse(raw);
  }catch(e){}
}
function getKOWinner(matchId,ta,tb,ga,gb){
  if(ga>gb) return ta;
  if(gb>ga) return tb;
  // Empate — usar definición de penales si existe
  if(KO_PEN[matchId]==='A') return ta;
  if(KO_PEN[matchId]==='B') return tb;
  return null; // empate sin definir penales aún
}
function getKOFx(){ const fx={}; for(const[k,r] of Object.entries(KO_RR)) if(r&&r[0]!==undefined&&r[1]!==undefined) fx[k]=r; return fx; }

function renderKnockoutInputs(){
  if(!BD) return '';
  let html='';
  const roundData={r32:BD.r32,r16:BD.r16,qf:BD.qf,sf:BD.sf,final:BD.fin?[BD.fin]:[]};
  KO_ROUNDS.forEach(function(round){
    const matches=roundData[round.key]||[];
    if(!matches.length) return;
    const today=new Date(); today.setHours(0,0,0,0);
    const roundDate=new Date(round.date+'T00:00:00');
    const isActive=roundDate<=today;
    html+=`<p class="slabel" style="margin-top:1.2rem">${round.label}${isActive?'':'<span style="font-size:10px;color:#aaa;font-weight:400;text-transform:none;letter-spacing:0"> · desde '+round.date+'</span>'}</p><div class="rgrid">`;
    matches.forEach(function(m){
      const mid=m.id||m;
      const matchData=typeof m==='object'?m:null;
      const ta=matchData?matchData.ta:'?';
      const tb=matchData?matchData.tb:'?';
      const res=KO_RR[mid];
      const pl=res&&res[0]!==undefined&&res[1]!==undefined;
      const suspicious=pl?isSuspiciousScore(res[0],res[1]):null;
      const isPast=isMatchPastById(mid);
      const needsResult=isPast&&!pl&&!ta.startsWith('?');
      const isDraw=pl&&res[0]===res[1];
      const needsPenalty=isDraw&&!KO_PEN[mid];
      const rowClass=suspicious?' suspicious':(pl?' played':(needsResult?' needs-result':(!isActive?' ko-pending':'')));
      const warningTag=suspicious?`<span class="score-warning" title="${suspicious}">⚠️</span>`:(needsResult?'<button class="ingresar-btn" style="font-size:9px;background:#f5c518;border:none;border-radius:3px;padding:1px 5px;cursor:pointer;font-family:inherit;color:#856404;font-weight:600">⚠️ Ingresar</button>':'');
      const penaltySelector=isDraw?`<div style="grid-column:1/-1;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:6px;padding:6px;background:${needsPenalty?'#fff3cd':'#f0fdf4'};border-radius:6px">
        <span style="font-size:10px;color:${needsPenalty?'#856404':'#1a5e34'};font-weight:600">${needsPenalty?'⚠️ Empate — ¿quién avanzó en penales?':'✅ Avanzó en penales:'}</span>
        <select onchange="setKOPenalty('${mid}',this.value)" style="font-size:11px;padding:3px 6px;border-radius:4px;border:1px solid #ccc;font-family:inherit">
          <option value="">Seleccionar...</option>
          <option value="A" ${KO_PEN[mid]==='A'?'selected':''}>${ta}</option>
          <option value="B" ${KO_PEN[mid]==='B'?'selected':''}>${tb}</option>
        </select>
      </div>`:'';
      html+=`<div class="mrow${rowClass}" id="ko-mr-${mid}" style="${needsResult?'background:#fff9e6;border-color:#f5c518;border-width:1.5px;':''}">
        <span class="ta${pl&&res[0]>res[1]?' wt':''}" style="font-size:11px">${ta}</span>
        <input class="sinp" type="number" min="0" max="20" value="${pl?res[0]:''}" placeholder="-" ${!isActive?'disabled title="Aún no empieza esta ronda"':''} onchange="setKO('${mid}',0,this.value)">
        <span class="sep">:</span>
        <input class="sinp" type="number" min="0" max="20" value="${pl?res[1]:''}" placeholder="-" ${!isActive?'disabled title="Aún no empieza esta ronda"':''} onchange="setKO('${mid}',1,this.value)">
        <span class="tb${pl&&res[1]>res[0]?' wt':''}" style="font-size:11px">${tb}</span>
        ${warningTag}
        <span style="font-size:9px;color:#999;grid-column:1/-1;text-align:center;margin-top:-2px">${mid}</span>
        ${penaltySelector}
      </div>`;
    });
    html+='</div>';
  });
  return html;
}

function buildMatchList(){
  let html='';

  // ── DISCLAIMER FRIENDLY ──
  html+=`<div style="background:#fffbea;border:1.5px solid #f5c518;border-radius:10px;padding:10px 14px;margin-bottom:1rem;font-size:12px;color:#856404;display:flex;gap:10px;align-items:flex-start">
    <span style="font-size:18px;flex-shrink:0">💡</span>
    <div>
      <strong>¿Cómo mantener el modelo actualizado?</strong><br>
      <span style="font-weight:400">
        1. Presiona <strong>🔄 Sincronizar resultados</strong> para cargar automáticamente los últimos marcadores.<br>
        2. Los partidos <span style="background:#fff3cd;border:1px solid #f5c518;border-radius:3px;padding:1px 5px;font-weight:600">marcados en amarillo</span> ya se jugaron pero no tienen resultado — ingrésalo manualmente.<br>
        3. Cuando todo esté listo, presiona <strong>▶ Actualizar modelo</strong> para recalcular las probabilidades.
      </span>
    </div>
  </div>`;
  for(const[g,ms] of Object.entries(GRP)){
    html+=`<p class="slabel">Grupo ${g}</p><div class="rgrid">`;
    for(let i=0;i<ms.length;i++) for(let j=i+1;j<ms.length;j++){
      const ta=ms[i],tb=ms[j],k=ta+'|'+tb;
      const r=RR[k]; const pl=r&&r[0]!==undefined&&r[1]!==undefined;
      const past=!pl&&isMatchPast(ta,tb);
      const suspicious=pl?isSuspiciousScore(r[0],r[1]):null;
      const rowClass=suspicious?' suspicious':(past?' needs-result':(pl?' played':''));
      const warningTag=suspicious?`<span class="score-warning" title="${suspicious}">⚠️</span>`:(past?'<span class="needs-tag">⚠️ Ingresar</span>':'');
      html+=`<div class="mrow${rowClass}" id="mr-${k.replace(/[^a-zA-Z0-9]/g,'_')}">
        <span class="ta${pl&&r[0]>r[1]?' wt':''}">${ta}</span>
        <input class="sinp" type="number" min="0" max="20" value="${pl?r[0]:''}" placeholder="-" onchange="setR('${k}',0,this.value)">
        <span class="sep">:</span>
        <input class="sinp" type="number" min="0" max="20" value="${pl?r[1]:''}" placeholder="-" onchange="setR('${k}',1,this.value)">
        <span class="tb${pl&&r[1]>r[0]?' wt':''}">${tb}</span>
        ${warningTag}
      </div>`;
    }
    html+='</div>';
  }
  html+='<div id="ko-section">'+renderKnockoutInputs()+'</div>';
  document.getElementById('mcont').innerHTML=html;
}

function setR(k,idx,val){
  const v=parseInt(val);
  if(isNaN(v)||val===''){
    if(RR[k])RR[k][idx]=undefined;
    saveToStorage(); return;
  }
  if(!RR[k])RR[k]=[undefined,undefined];
  RR[k][idx]=v;
  saveToStorage();
  // Guardar en Supabase si ambos goles están completos
  if(RR[k][0]!==undefined&&RR[k][1]!==undefined){
    saveToSupabase(k, RR[k][0], RR[k][1], 'grupo');
  }
}
function getFx(){
  const fx={};
  const seen=new Set();
  for(const[k,r] of Object.entries(RR)){
    if(r&&r[0]!==undefined&&r[1]!==undefined){
      const[ta,tb]=k.split('|');
      const canonical=ta+'|'+tb;
      const inverse=tb+'|'+ta;
      // Solo agregar si no hemos visto este partido aún
      if(!seen.has(canonical)&&!seen.has(inverse)){
        fx[canonical]=r;
        seen.add(canonical);
      }
    }
  }
  return fx;
}
function setP(pct,msg){ document.getElementById('pfill').style.width=pct+'%'; if(msg)document.getElementById('lmsg').textContent=msg; }
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
function filt(r,btn){ CRF=r; SEARCH_Q=''; document.querySelectorAll('.rfbtn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); renderPartidos(); }
function showTab(id,btn){
  // Bloquear pestaña de Resultados si no es admin
  if(id==='res'&&!IS_ADMIN){
    alert('Esta sección es solo para administradores.');
    return;
  }
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('panel-'+id).classList.add('active');
  btn.classList.add('active');
}

// ── RUN MODEL ─────────────────────────────────────────────────────────────────
// Versión silenciosa del modelo — corre en background sin UI de loading
async function runModelSilent(){
  const myEpoch = COMP_EPOCH;
  if(CURRENT_COMPETITION!=='mundial2026') return;
  try{
    const fx=getFx(); const u=bayesUpd();
    GS=calcGS(u,fx);
    BD=calcBD(u);
    MCP=calcProbs(u,fx);
    PD=buildPD(u,fx);
    if(COMP_EPOCH!==myEpoch) return; // el usuario cambió de competición mientras esto calculaba
    renderGroups(); renderBracket(); renderRanking(); renderPartidos(); renderTracker();
    const koSection=document.getElementById('ko-section');
    if(koSection) koSection.innerHTML=renderKnockoutInputs();
    document.getElementById('ubadge').style.display='inline-flex';
  } catch(e){ console.warn('Error en runModelSilent:', e); }
}

async function runModel(){
  const btn=document.getElementById('btnrun'),st=document.getElementById('run-st');
  btn.disabled=true; btn.textContent='⏳ Calculando...';
  st.style.display='block';
  setP(5,'Actualizando fuerzas bayesianas...','Analizando resultados reales'); await sleep(40);
  const fx=getFx(); const kofx=getKOFx(); const u=bayesUpd();
  window._KOFX=kofx;
  setP(15,'Calculando tablas de grupo...',''); await sleep(30);
  GS=calcGS(u,fx);
  setP(28,'Calculando bracket más probable...',''); await sleep(20);
  BD=calcBD(u);
  setP(38,`Corriendo ${NSIMS.toLocaleString()} simulaciones Monte Carlo...`,`~${Math.round(NSIMS/1000*1.5)} segundos`); await sleep(40);
  MCP=calcProbs(u,fx);
  setP(88,'Generando análisis de partidos con xG...',''); await sleep(20);
  PD=buildPD(u,fx);
  setP(96,'Renderizando resultados...',''); await sleep(20);
  renderGroups(); renderBracket(); renderRanking(); renderPartidos(); renderTracker();
  const koSection=document.getElementById('ko-section');
  if(koSection) koSection.innerHTML=renderKnockoutInputs();
  setP(100,'Listo',''); await sleep(500);
  st.style.display='none';
  btn.disabled=false; btn.textContent='▶ Actualizar modelo';
  document.getElementById('ubadge').style.display='inline-flex';
  // Hora de última actualización
  const now=new Date();
  const hora=now.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
  document.getElementById('hdr-sub').innerHTML=`Última actualización hoy a las <strong>${hora}</strong> · ${Object.keys(fx).length} resultado(s) cargados`;
}

// ── LOCALSTORAGE — GUARDADO AUTOMÁTICO ───────────────────────────────────────
const LS_KEY = 'wc2026_results';

function saveToStorage(){
  try{
    const data={ RR, KO_RR, savedAt: new Date().toISOString() };
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    // Mostrar indicador visual brevemente
    let el=document.getElementById('save-indicator');
    if(!el){
      el=document.createElement('span');
      el.id='save-indicator';
      el.style.cssText='font-size:11px;color:#1a5e34;margin-left:8px;transition:opacity .3s';
      document.querySelector('.bbar2').appendChild(el);
    }
    el.textContent='💾 Guardado';
    el.style.opacity='1';
    setTimeout(()=>{ el.style.opacity='0'; }, 2000);
  } catch(e){ console.warn('No se pudo guardar:', e); }
}

function loadFromStorage(){
  try{
    const raw=localStorage.getItem(LS_KEY);
    if(!raw) return false;
    const data=JSON.parse(raw);
    if(data.RR)    RR=data.RR;
    if(data.KO_RR) KO_RR=data.KO_RR;
    return true;
  } catch(e){ return false; }
}

// Exportar resultados como JSON descargable
function exportData(){
  const data={ RR, KO_RR, exportedAt: new Date().toISOString(), version:'wc2026' };
  const blob=new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download='mundial2026_resultados.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Importar resultados desde JSON
function importData(){
  const input=document.createElement('input');
  input.type='file';
  input.accept='.json';
  input.onchange=function(e){
    const file=e.target.files[0];
    if(!file) return;
    const reader=new FileReader();
    reader.onload=function(ev){
      try{
        const data=JSON.parse(ev.target.result);
        if(data.version!=='wc2026'){ alert('Archivo no compatible'); return; }
        if(data.RR)    RR=data.RR;
        if(data.KO_RR) KO_RR=data.KO_RR;
        saveToStorage();
        buildMatchList();
        showApiStatus('✅ Datos importados correctamente — presiona Actualizar modelo','ok');
      } catch(err){
        alert('Error al leer el archivo. Verifica que sea un JSON válido.');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function clearAll(){
  if(!confirm('¿Seguro que quieres borrar todos los resultados? Esta acción no se puede deshacer.')) return;
  RR={}; KO_RR={};
  localStorage.removeItem(LS_KEY);
  buildMatchList();
  document.getElementById('ubadge').style.display='none';
}

// ── API SYNC ──────────────────────────────────────────────────────────────────
const API_TEAM_MAP={
  "Mexico":"México","South Korea":"Corea del Sur","Czech Republic":"Chequia","Czechia":"Chequia",
  "Canada":"Canadá","Switzerland":"Suiza","Brazil":"Brasil","Morocco":"Marruecos","Scotland":"Escocia",
  "United States":"EE.UU.","USA":"EE.UU.","Paraguay":"Paraguay","Turkey":"Turquía","Türkiye":"Turquía",
  "Germany":"Alemania","Netherlands":"Países Bajos","Japan":"Japón","Tunisia":"Túnez","Sweden":"Suecia",
  "Belgium":"Bélgica","Egypt":"Egipto","Iran":"Irán","New Zealand":"Nueva Zelanda","Spain":"España",
  "Cape Verde":"Cabo Verde","Saudi Arabia":"Arabia Saudita","Uruguay":"Uruguay","France":"Francia",
  "Senegal":"Senegal","Norway":"Noruega","Iraq":"Iraq","Argentina":"Argentina","Algeria":"Argelia",
  "Austria":"Austria","Jordan":"Jordania","Portugal":"Portugal","Colombia":"Colombia",
  "Uzbekistan":"Uzbekistán","DR Congo":"DR Congo","England":"Inglaterra","Croatia":"Croacia",
  "Ghana":"Ghana","Panama":"Panamá","Ecuador":"Ecuador","Curaçao":"Curazao","Curacao":"Curazao",
  "Ivory Coast":"Costa de Marfil","Côte d'Ivoire":"Costa de Marfil","South Africa":"Sudáfrica",
  "Haiti":"Haití","Bosnia and Herzegovina":"Bosnia","Bosnia":"Bosnia","Qatar":"Qatar","Australia":"Australia"
};
function mapTeam(name){ return API_TEAM_MAP[name]||name; }

function showApiModal(){ syncResults(); }
function confirmApiKey(){ syncResults(); }

async function syncResults(){
  const btn=document.getElementById('btn-sync');
  const orig=btn.textContent;
  btn.textContent='⏳ Sincronizando...';
  btn.disabled=true;
  try{
    const res=await fetch('https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json');
    if(!res.ok){ showApiStatus('❌ No se pudo conectar. Verifica tu internet e intenta de nuevo.','error'); btn.textContent=orig; btn.disabled=false; return; }
    const data=await res.json();
    const matches=data.matches||[];
    const allTeams=Object.values(GRP).flat();
    let synced=0;
    matches.forEach(function(m){
      if(!m.score||!m.score.ft) return;
      const homeGoals=m.score.ft[0],awayGoals=m.score.ft[1];
      if(homeGoals===null||homeGoals===undefined) return;
      if(awayGoals===null||awayGoals===undefined) return;
      const home=mapTeam(m.team1||''),away=mapTeam(m.team2||'');
      if(!home||!away) return;
      if(!allTeams.includes(home)||!allTeams.includes(away)) return;
      const key=home+'|'+away;
      RR[key]=[parseInt(homeGoals),parseInt(awayGoals)];
      synced++;
    });
    if(synced>0){
      buildMatchList();
      saveToStorage();
      // Guardar todos los resultados en Supabase
      for(const[k,r] of Object.entries(RR)){
        if(r&&r[0]!==undefined&&r[1]!==undefined){
          saveToSupabase(k, r[0], r[1], 'grupo');
        }
      }
      const needManual=countNeedManual();
      const msg=needManual>0
        ?'✅ '+synced+' sincronizado(s) · ⚠️ Hay partidos en amarillo que necesitan resultado manual — revísalos abajo'
        :'✅ '+synced+' resultado(s) sincronizado(s) · Todo al día 🎉';
      showApiStatus(msg,needManual>0?'warn':'ok',needManual>0);
    } else {
      showApiStatus('ℹ️ No hay nuevos resultados disponibles aún.','info');
    }
  } catch(err){
    console.error('Sync error:',err);
    showApiStatus('❌ Error de conexión: '+err.message,'error');
  } finally {
    btn.textContent=orig; btn.disabled=false;
  }
}

// Helper para contar partidos pasados sin resultado
function countNeedManual(){
  const fx=getFx();
  const kofx=getKOFx();
  // Partidos de grupos pendientes
  const groupMatches=Object.values(GRP).flatMap(ms=>{
    const pairs=[];
    for(let i=0;i<ms.length;i++) for(let j=i+1;j<ms.length;j++) pairs.push([ms[i],ms[j]]);
    return pairs;
  });
  const needGroup=groupMatches.filter(([ta,tb])=>isMatchPast(ta,tb)&&!getResult(fx,ta,tb)).length;

  // Partidos KO pendientes — solo si tienen equipos reales asignados
  let needKO=0;
  if(BD){
    const allKO=[...BD.r32,...BD.r16,...BD.qf,...BD.sf,...(BD.fin?[BD.fin]:[])];
    allKO.forEach(m=>{
      if(!m||!m.ta||!m.tb) return;
      // Solo contar si los equipos son reales (no placeholders)
      if(m.ta.startsWith('G')||m.tb.startsWith('G')) return;
      if(isMatchPastById(m.id)&&!kofx[m.id]) needKO++;
    });
  }
  return needGroup+needKO;
}

function showApiStatus(msg,type,persistent=false){
  let el=document.getElementById('api-status');
  if(!el){ el=document.createElement('p'); el.id='api-status'; el.style.cssText='font-size:11px;padding:6px 10px;border-radius:6px;margin-bottom:.8rem'; const bar=document.querySelector('.bbar2'); bar.parentNode.insertBefore(el,bar.nextSibling); }
  const styles={ok:'background:#d4edda;color:#1a5e34',error:'background:#fde8e8;color:#c00',warn:'background:#fff3cd;color:#856404',info:'background:#e8f4fd;color:#1565c0'};
  el.style.cssText=`font-size:11px;padding:6px 10px;border-radius:6px;margin-bottom:.8rem;${styles[type]||styles.info}`;
  el.textContent=msg;
  if(!persistent) setTimeout(()=>{ if(el.parentNode) el.remove(); },8000);
}

// ── NAVEGACIÓN ENTRE COMPETICIONES ───────────────────────────────────────────
let CURRENT_COMPETITION = 'mundial2026';
let COMP_EPOCH = 0; // se incrementa cada vez que se cambia de competición — cualquier
                     // proceso en curso que termine después de un cambio se auto-cancela

const COMPETITION_NAMES = {
  'mundial2026': '🌍 Mundial FIFA 2026',
  'ligapro':     '🇪🇨 LigaPro Ecuador',
  'premier':     '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League',
  'laliga':      '🇪🇸 La Liga',
  'bundesliga':  '🇩🇪 Bundesliga',
  'seriea':      '🇮🇹 Serie A',
  'ligue1':      '🇫🇷 Ligue 1'
};

const COMING_SOON = ['premier','laliga','bundesliga','seriea','ligue1'];

function enterCompetition(id){
  // Ligas aún no disponibles
  if(COMING_SOON.includes(id)){
    const name=COMPETITION_NAMES[id]||id;
    showComingSoonModal(name);
    return;
  }
  COMP_EPOCH++; // invalida cualquier proceso en curso de la competición anterior
  CURRENT_COMPETITION=id;
  document.getElementById('home-screen').style.display='none';
  document.getElementById('main-app').style.display='block';
  const titleEl=document.getElementById('app-title');
  if(titleEl) titleEl.innerHTML=(COMPETITION_NAMES[id]||id)+' <span id="ubadge" style="display:none" class="ubadge">✓ Actualizado</span>';

  // Mundial y LigaPro tienen contenedores 100% separados — nunca pueden pisarse,
  // aunque algún proceso en segundo plano tarde en resolver.
  const mundialIds=['pcont','gcont','mcont'];
  const ligaIds=['pcont-liga','gcont-liga','mcont-liga'];
  if(id==='ligapro'){
    mundialIds.forEach(cid=>{ const el=document.getElementById(cid); if(el) el.style.display='none'; });
    ligaIds.forEach(cid=>{ const el=document.getElementById(cid); if(el){ el.style.display=''; el.innerHTML='<div class="infobox">Cargando...</div>'; } });
  } else {
    ligaIds.forEach(cid=>{ const el=document.getElementById(cid); if(el) el.style.display='none'; });
    mundialIds.forEach(cid=>{ const el=document.getElementById(cid); if(el){ el.style.display=''; el.innerHTML='<div class="infobox">Cargando...</div>'; } });
  }

  // Inicializar la app para esta competición
  if(id==='ligapro'){ ligaInitApp(); return; }
  initApp();
}

function goHome(){
  document.getElementById('main-app').style.display='none';
  document.getElementById('home-screen').style.display='block';
}

function showComingSoonModal(name){
  const existing=document.getElementById('coming-soon-modal');
  if(existing) existing.remove();
  const html=`<div class="modal-box" style="max-width:360px;text-align:center">
    <div class="modal-hdr" style="justify-content:center">
      <div>
        <div class="modal-title">${name}</div>
        <div class="modal-sub">Próximamente disponible</div>
      </div>
    </div>
    <div class="modal-section">
      <div style="font-size:40px;margin-bottom:12px">⏳</div>
      <div style="font-size:13px;color:#555;line-height:1.6;margin-bottom:16px">
        Esta liga estará disponible próximamente.<br>
        Estamos calibrando el modelo estadístico para darte el mejor análisis posible.
      </div>
      <button onclick="document.getElementById('coming-soon-modal').remove()"
        style="padding:10px 24px;background:#111;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;font-family:inherit;font-weight:500">
        Entendido
      </button>
    </div>
  </div>`;
  const overlay=document.createElement('div');
  overlay.id='coming-soon-modal';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999;display:flex;align-items:center;justify-content:center;padding:1rem';
  overlay.onclick=function(e){ if(e.target===overlay) overlay.remove(); };
  overlay.innerHTML=html;
  document.body.appendChild(overlay);
}

function initApp(){
  // Restaurar tabs por si el usuario viene de LigaPro (donde se ocultan/renombran)
  const tabBtns=document.querySelectorAll('.tab');
  tabBtns.forEach(t=>{ t.style.display=''; });
  const originalLabels=['✏️ Resultados','📊 Partidos','🏟️ Grupos','🏆 Bracket','📈 Probabilidades','🎯 Aciertos'];
  tabBtns.forEach((t,i)=>{ if(originalLabels[i]) t.innerHTML=originalLabels[i]; });

  // Restaurar el botón "Actualizar modelo" por si LigaPro lo reprogramó
  const btnrunReset=document.getElementById('btnrun');
  if(btnrunReset){ btnrunReset.onclick=runModel; btnrunReset.textContent='▶ Actualizar modelo'; }

  // Restaurar el filtro de fases (LigaPro lo oculta)
  const rfiltReset = document.getElementById('mundial-rfilt');
  if(rfiltReset) rfiltReset.style.display = '';

  // Restaurar el botón de sincronización (LigaPro lo oculta)
  const btnSyncReset = document.getElementById('btn-sync');
  if(btnSyncReset) btnSyncReset.style.display = '';

  // Ocultar elementos admin si no es admin
  if(!IS_ADMIN){
    document.querySelectorAll('.tab').forEach(function(t){
      if(t.textContent.includes('Resultados')) t.style.display='none';
    });
    const btnrun=document.getElementById('btnrun');
    if(btnrun) btnrun.style.display='none';
    const runSt=document.getElementById('run-st');
    if(runSt) runSt.style.display='none';
  }

  // Mostrar botón Premium para usuarios free
  if(!IS_PREMIUM){
    const hdr=document.querySelector('.hdr');
    if(hdr){
      const btnPrem=document.createElement('button');
      btnPrem.innerHTML='⚡ Hazte Premium';
      btnPrem.style.cssText='padding:8px 16px;background:#4caf50;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;font-family:inherit;font-weight:600;white-space:nowrap;margin-top:8px';
      btnPrem.onclick=showPremiumModal;
      hdr.querySelector('div').appendChild(btnPrem);
    }
  }
  initStr();
  const _fx={};
  GS=calcGS(STR,_fx);
  BD=calcBD(STR);
  MCP={};
  Object.keys(TD).forEach(t=>{
    const s=STR[t]||0.3;
    MCP[t]={
      p_group:+(Math.min(s*140,98)).toFixed(1),
      p_r32:+(Math.min(s*100,85)).toFixed(1),
      p_r16:+(Math.min(s*70,70)).toFixed(1),
      p_qf:+(Math.min(s*45,55)).toFixed(1),
      p_sf:+(Math.min(s*28,40)).toFixed(1),
      p_final:+(Math.min(s*16,28)).toFixed(1),
      p_champ:+(Math.min(s*9,18)).toFixed(1),
    };
  });
  const hadSaved=loadFromStorage();
  loadPenalties();
  let loadedCloud=false;
  PD=buildPD(STR,_fx);
  buildMatchList();
  renderGroups();
  renderBracket();
  renderRanking();
  renderPartidos();
  renderTracker();

  // Orden correcto: 1) Supabase → 2) Auto-sync openfootball → 3) Correr modelo
  document.getElementById('hdr-sub').innerHTML=IS_ADMIN
    ?'☁️ Cargando resultados...'
    :'☁️ Cargando análisis...';

  (async function initData(){
    const myEpoch = COMP_EPOCH;
    // 1. Cargar desde Supabase
    const loaded = await loadFromSupabase();
    if(COMP_EPOCH!==myEpoch) return; // el usuario ya cambió de competición
    if(loaded) buildMatchList();

    // 2. Auto-sync desde openfootball
    try{
      const res=await fetch('https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json');
      if(COMP_EPOCH!==myEpoch) return;
      if(res.ok){
        const data=await res.json();
        const matches=data.matches||[];
        const allTeams=Object.values(GRP).flat();
        let synced=0;
        matches.forEach(function(m){
          if(!m.score||!m.score.ft) return;
          const homeGoals=m.score.ft[0],awayGoals=m.score.ft[1];
          if(homeGoals===null||homeGoals===undefined) return;
          if(awayGoals===null||awayGoals===undefined) return;
          const home=mapTeam(m.team1||''),away=mapTeam(m.team2||'');
          if(!home||!away) return;
          if(!allTeams.includes(home)||!allTeams.includes(away)) return;
          RR[home+'|'+away]=[parseInt(homeGoals),parseInt(awayGoals)];
          synced++;
        });
        if(synced>0){
          buildMatchList();
          saveToStorage();
          for(const[k,r] of Object.entries(RR)){
            if(r&&r[0]!==undefined&&r[1]!==undefined) saveToSupabase(k,r[0],r[1],'grupo');
          }
          if(IS_ADMIN){
            const needManual=countNeedManual();
            const msg=needManual>0
              ?`✅ ${synced} sincronizado(s) · ⚠️ Hay partidos en amarillo que necesitan resultado manual`
              :`✅ ${synced} sincronizado(s) · ¡Todo al día!`;
            showApiStatus(msg,needManual>0?'warn':'ok',needManual>0);
          }
        }
      }
    } catch(e){ /* silencioso */ }

    // 3. Correr modelo con todos los datos cargados
    if(COMP_EPOCH!==myEpoch) return;
    document.getElementById('hdr-sub').innerHTML=IS_ADMIN
      ?'⚙️ Calculando probabilidades...'
      :'☁️ Calculando probabilidades...';
    await runModelSilent();
    if(COMP_EPOCH!==myEpoch) return;
    document.getElementById('hdr-sub').innerHTML=IS_ADMIN
      ?'✅ Modelo actualizado · '+Object.keys(getFx()).length+' resultados cargados'
      :'☁️ Análisis listo · Explora los pronósticos del Mundial FIFA 2026';
  })();
}
// La app se inicializa cuando el usuario selecciona una competición
// Ver función enterCompetition() arriba



// ═══════════════════════════════════════════════════════════════════════════
// ── LIGAPRO ECUADOR — MÓDULO (no modifica nada del Mundial) ─────────────────
// ═══════════════════════════════════════════════════════════════════════════
// Formato real de LigaPro 2026 (para referencia futura):
//   Fase Regular: 16 equipos, todos contra todos ida y vuelta, 30 fechas.
//   Fase Final (arranca cuando termine la fecha 30, los puntos NO se reinician):
//     - Hexagonal por el título: puestos 1-6, 10 fechas → campeón + cupos Libertadores
//     - Cuadrangular internacional: puestos 7-10, 6 fechas → cupo Sudamericana
//     - Hexagonal por el descenso: puestos 11-16, 10 fechas → 2 descienden
//   Por ahora solo está activa la Fase Regular.
//
// Calendario: LigaPro solo publica 2 fechas por adelantado. LIGA_FIXTURES se
// actualiza a mano cada semana con lo que la liga vaya confirmando.

const LIGA_TEAMS = [
  "Independiente del Valle","Deportivo Cuenca","U. Católica","Barcelona SC",
  "Aucas","LDU Quito","Orense SC","Emelec","Técnico Universitario","Macará",
  "Guayaquil City","Mushuc Runa","Leones FC","Libertad","Delfín","Manta FC"
];

const LIGA_TD = {
  "Independiente del Valle": {pj:16, pts:37, gf:32, ga:18, titles:3},
  "Deportivo Cuenca":        {pj:16, pts:27, gf:18, ga:17, titles:2},
  "U. Católica":             {pj:16, pts:26, gf:26, ga:14, titles:0},
  "Barcelona SC":            {pj:16, pts:26, gf:18, ga:13, titles:16},
  "Aucas":                   {pj:16, pts:26, gf:19, ga:16, titles:0},
  "LDU Quito":               {pj:15, pts:24, gf:16, ga:13, titles:5},
  "Orense SC":               {pj:15, pts:22, gf:21, ga:19, titles:0},
  "Emelec":                  {pj:16, pts:22, gf:13, ga:16, titles:14},
  "Técnico Universitario":   {pj:16, pts:20, gf:17, ga:16, titles:0},
  "Macará":                  {pj:16, pts:20, gf:15, ga:18, titles:0},
  "Guayaquil City":          {pj:16, pts:19, gf:14, ga:19, titles:0},
  "Mushuc Runa":             {pj:16, pts:18, gf:19, ga:21, titles:0},
  "Leones FC":               {pj:16, pts:17, gf:15, ga:18, titles:0},
  "Libertad":                {pj:16, pts:17, gf:16, ga:22, titles:0},
  "Delfín":                  {pj:16, pts:16, gf:8,  ga:15, titles:1},
  "Manta FC":                {pj:16, pts:12, gf:7,  ga:19, titles:0}
};

const LIGA_CORNER_IDX = {
  "Independiente del Valle":7.5, "Barcelona SC":6.5, "Emelec":6.0, "LDU Quito":6.8,
  "Deportivo Cuenca":5.5, "U. Católica":6.2, "Aucas":5.5, "Orense SC":6.5,
  "Técnico Universitario":5.5, "Macará":5.0, "Guayaquil City":5.2, "Mushuc Runa":5.0,
  "Leones FC":5.0, "Libertad":4.8, "Delfín":5.0, "Manta FC":4.5
};
const LIGA_CARD_IDX = {
  "Independiente del Valle":5.5, "Barcelona SC":6.5, "Emelec":6.5, "LDU Quito":5.5,
  "Deportivo Cuenca":6.0, "U. Católica":5.5, "Aucas":6.5, "Orense SC":6.0,
  "Técnico Universitario":6.0, "Macará":6.0, "Guayaquil City":6.2, "Mushuc Runa":6.8,
  "Leones FC":6.0, "Libertad":6.5, "Delfín":5.8, "Manta FC":6.0
};

const LIGA_FIXTURES = {
  "Fecha 17": [
    {ta:"Independiente del Valle", tb:"Manta FC",             date:"2026-07-03"},
    {ta:"Libertad",                tb:"Leones FC",             date:"2026-07-04"},
    {ta:"Barcelona SC",            tb:"Deportivo Cuenca",      date:"2026-07-04"},
    {ta:"Macará",                  tb:"LDU Quito",             date:"2026-07-05"},
    {ta:"Delfín",                  tb:"Emelec",                date:"2026-07-05"},
    {ta:"U. Católica",             tb:"Mushuc Runa",           date:"2026-07-06"},
    {ta:"Orense SC",               tb:"Técnico Universitario", date:"2026-07-06"},
    {ta:"Aucas",                   tb:"Guayaquil City",        date:"2026-07-07"}
  ],
  "Fecha 18": [
    {ta:"Leones FC",       tb:"U. Católica",             date:"2026-07-10"},
    {ta:"Técnico Universitario", tb:"Macará",             date:"2026-07-10"},
    {ta:"Manta FC",        tb:"Orense SC",                date:"2026-07-11"},
    {ta:"Mushuc Runa",     tb:"Independiente del Valle",  date:"2026-07-11"},
    {ta:"Guayaquil City",  tb:"Delfín",                   date:"2026-07-11"},
    {ta:"LDU Quito",       tb:"Libertad",                 date:"2026-07-12"},
    {ta:"Deportivo Cuenca",tb:"Aucas",                    date:"2026-07-12"},
    {ta:"Emelec",          tb:"Barcelona SC",             date:"2026-07-12"}
  ]
};

let LIGA_STR = {};
let LIGA_RR = {};
let LIGA_PD = [];

function ligaNorm(v, lo, hi){ return Math.max(0, Math.min(1, (v-lo)/(hi-lo))); }

function ligaInitStr(){
  for(const[n,d] of Object.entries(LIGA_TD)){
    const ppg = d.pts/d.pj;
    const gdpg = (d.gf-d.ga)/d.pj;
    const prestige = Math.min(d.titles*0.01, 0.15);
    LIGA_STR[n] = Math.max(0.05, Math.min(0.98,
      0.50*ligaNorm(ppg,0,3) + 0.30*ligaNorm(gdpg,-2,2) + 0.20*(prestige/0.15)*0.20
    ));
  }
}

function ligaBayesUpd(){
  const u={...LIGA_STR}, ts={};
  for(const[k,r] of Object.entries(LIGA_RR)){
    if(r[0]===undefined||r[1]===undefined) continue;
    const[ta,tb]=k.split('|'); const ga=r[0], gb=r[1];
    [ta,tb].forEach((t,i)=>{
      if(!ts[t]) ts[t]={pts:0,gf:0,ga:0,played:0};
      const s=ts[t]; s.played++;
      s.gf += i===0?ga:gb; s.ga += i===0?gb:ga;
      if((i===0&&ga>gb)||(i===1&&gb>ga)) s.pts+=3;
      else if(ga===gb) s.pts+=1;
    });
  }
  for(const[n,s] of Object.entries(ts)){
    if(!s.played) continue;
    const perf = 0.60*(s.pts/s.played/3) + 0.40*Math.max(0,Math.min(1,((s.gf-s.ga)/s.played+3)/6));
    const w = Math.min(0.20*s.played, 0.50);
    u[n] = Math.max(0.05, Math.min(0.98, (1-w)*LIGA_STR[n] + w*perf));
  }
  return u;
}

function ligaXgCalc(ta, tb, u){
  const sa = u[ta] ?? LIGA_STR[ta], sb = u[tb] ?? LIGA_STR[tb];
  const da = LIGA_TD[ta], db = LIGA_TD[tb], af = ap(sa, sb);
  const gfA = da.gf/da.pj, gaA = da.ga/da.pj, gfB = db.gf/db.pj, gaB = db.ga/db.pj;
  const la = Math.max(BASE*(gfA/1.3)*(gaB/1.3)*(1+0.3*(sa-sb))*af, 0.3);
  const lb = Math.max(BASE*(gfB/1.3)*(gaA/1.3)*(1+0.3*(sb-sa))*af, 0.3);
  return [la, lb];
}

function ligaMatchAnal(ta, tb, u){
  const [la, lb] = ligaXgCalc(ta, tb, u);
  let wa=0, wd=0, wb=0, p_over25=0, p_under25=0, p_btts=0, p_no_btts=0, p_over15=0, p_over35=0;
  for(let i=0;i<10;i++) for(let j=0;j<10;j++){
    const p = pPmf(i,la)*pPmf(j,lb)*dcF(i,j,la,lb);
    if(i>j) wa+=p; else if(i===j) wd+=p; else wb+=p;
    const total=i+j;
    if(total>2.5) p_over25+=p; else p_under25+=p;
    if(total>1.5) p_over15+=p;
    if(total>3.5) p_over35+=p;
    if(i>=1&&j>=1) p_btts+=p; else p_no_btts+=p;
  }
  const tot=wa+wd+wb, matSum=p_over25+p_under25, bttsSum=p_btts+p_no_btts;
  const totalLambda=la+lb, p_no_goal=Math.exp(-totalLambda);
  const htA=+(la*0.45).toFixed(2), htB=+(lb*0.45).toFixed(2);
  return {
    la:+la.toFixed(2), lb:+lb.toFixed(2), xg_total:+(la+lb).toFixed(2),
    xgRA: la>=0.75?Math.round(la):0, xgRB: lb>=0.75?Math.round(lb):0,
    xgRStr: `${la>=0.75?Math.round(la):0}-${lb>=0.75?Math.round(lb):0}`,
    htA, htB, htRA: htA>=0.75?Math.round(htA):0, htRB: htB>=0.75?Math.round(htB):0,
    pw_a:+(wa/tot).toFixed(3), pd:+(wd/tot).toFixed(3), pw_b:+(wb/tot).toFixed(3),
    p_over25:+(p_over25/matSum).toFixed(3), p_under25:+(p_under25/matSum).toFixed(3),
    p_over15:+(p_over15/matSum).toFixed(3), p_over35:+(p_over35/matSum).toFixed(3),
    p_btts:+(p_btts/bttsSum).toFixed(3), p_no_btts:+(p_no_btts/bttsSum).toFixed(3),
    p_a_first:+(la/totalLambda*(1-p_no_goal)).toFixed(3),
    p_b_first:+(lb/totalLambda*(1-p_no_goal)).toFixed(3),
    p_no_goal:+p_no_goal.toFixed(3),
    winner: wa>=wb?ta:tb
  };
}

function ligaCornerCalc(ta, tb){
  const ia=LIGA_CORNER_IDX[ta]||5.5, ib=LIGA_CORNER_IDX[tb]||5.5;
  const defA=(10-ia)/5.5, defB=(10-ib)/5.5;
  const la=Math.max(1.5, BASE_C*(ia/5.5)*defB);
  const lb=Math.max(1.5, BASE_C*(ib/5.5)*defA);
  return [+la.toFixed(2), +lb.toFixed(2)];
}
function ligaCardCalc(ta, tb){
  const ia=LIGA_CARD_IDX[ta]||6.0, ib=LIGA_CARD_IDX[tb]||6.0;
  const la=Math.max(0.5, BASE_T*(ia/6.0)*(0.7+0.3*ib/6.0));
  const lb=Math.max(0.5, BASE_T*(ib/6.0)*(0.7+0.3*ia/6.0));
  return [+la.toFixed(2), +lb.toFixed(2)];
}

function ligaGetResult(ta, tb){
  const k1=ta+'|'+tb, k2=tb+'|'+ta;
  if(LIGA_RR[k1]&&LIGA_RR[k1][0]!==undefined) return {ga:LIGA_RR[k1][0], gb:LIGA_RR[k1][1]};
  if(LIGA_RR[k2]&&LIGA_RR[k2][0]!==undefined) return {ga:LIGA_RR[k2][1], gb:LIGA_RR[k2][0]};
  return null;
}

// Últimos resultados jugados de un equipo (según fixtures cargados hasta ahora)
function ligaTeamForm(name){
  const played = [];
  for(const[fecha, matches] of Object.entries(LIGA_FIXTURES)){
    matches.forEach(m=>{
      if(m.ta!==name && m.tb!==name) return;
      const real = ligaGetResult(m.ta, m.tb);
      if(!real) return;
      const isHome = m.ta===name;
      const myG = isHome?real.ga:real.gb, oppG = isHome?real.gb:real.ga;
      const opp = isHome?m.tb:m.ta;
      const result = myG>oppG?'W':(myG===oppG?'D':'L');
      played.push({date:m.date, opp, myG, oppG, result});
    });
  }
  played.sort((a,b)=>a.date.localeCompare(b.date));
  return played.slice(-3);
}

// ── TABLA DE POSICIONES ─────────────────────────────────────────────────────
function ligaCalcStandings(){
  const rows = LIGA_TEAMS.map(n=>{
    const base = LIGA_TD[n];
    return {name:n, pj:base.pj, pts:base.pts, gf:base.gf, ga:base.ga};
  });
  const byName = Object.fromEntries(rows.map(r=>[r.name,r]));
  const seen = new Set();
  for(const[k,r] of Object.entries(LIGA_RR)){
    if(r[0]===undefined||r[1]===undefined) continue;
    if(seen.has(k)) continue; seen.add(k);
    const[ta,tb]=k.split('|'); const ga=r[0], gb=r[1];
    if(!byName[ta]||!byName[tb]) continue;
    byName[ta].pj++; byName[tb].pj++;
    byName[ta].gf+=ga; byName[ta].ga+=gb;
    byName[tb].gf+=gb; byName[tb].ga+=ga;
    if(ga>gb) byName[ta].pts+=3;
    else if(gb>ga) byName[tb].pts+=3;
    else { byName[ta].pts+=1; byName[tb].pts+=1; }
  }
  return rows.sort((a,b)=>(b.pts-a.pts)||((b.gf-b.ga)-(a.gf-a.ga))||(b.gf-a.gf));
}

function ligaRenderStandings(){
  const cont = document.getElementById('gcont-liga');
  if(!cont) return;
  const rows = ligaCalcStandings();
  let html = `<div style="background:#e8f4fd;border:1px solid #93c5fd;border-radius:10px;padding:12px 14px;margin-bottom:1rem;font-size:12px;color:#1565c0">
    📊 Tabla de posiciones — LigaPro Serie A 2026 (Fase Regular)
  </div>`;
  html += `<table class="gtbl" style="width:100%"><thead><tr>
    <th style="width:20px">#</th><th>Equipo</th><th class="r">PJ</th><th class="r">Pts</th>
    <th class="r">GF</th><th class="r">GA</th><th class="r">DG</th></tr></thead><tbody>`;
  rows.forEach((r,i)=>{
    const dg = r.gf-r.ga;
    let badge = '';
    if(i<6) badge = '<span style="font-size:9px;background:#d4edda;color:#1a5e34;border-radius:3px;padding:1px 5px;margin-left:5px">Hexagonal título</span>';
    else if(i<10) badge = '<span style="font-size:9px;background:#e8f4fd;color:#1565c0;border-radius:3px;padding:1px 5px;margin-left:5px">Cuadrangular</span>';
    else badge = '<span style="font-size:9px;background:#fde8e8;color:#c00;border-radius:3px;padding:1px 5px;margin-left:5px">Hexagonal descenso</span>';
    html += `<tr>
      <td style="font-weight:600;color:${i<6?'#1a5e34':(i>=10?'#c00':'#1565c0')}">${i+1}</td>
      <td style="font-weight:500;cursor:pointer" onclick="ligaOpenTeamProfile('${r.name}')">${r.name}${badge}</td>
      <td class="r">${r.pj}</td><td class="r"><strong>${r.pts}</strong></td>
      <td class="r">${r.gf}</td><td class="r">${r.ga}</td>
      <td class="r">${dg>0?'+':''}${dg}</td>
    </tr>`;
  });
  html += `</tbody></table>
  <p style="font-size:11px;color:#999;margin-top:8px">🟢 Hexagonal por el título (1-6) · 🔵 Cuadrangular internacional (7-10) · 🔴 Hexagonal por el descenso (11-16)<br>
  Los puntos de esta fase se mantienen íntegros al pasar a la Fase Final.</p>`;
  cont.innerHTML = html;
}

function ligaOpenTeamProfile(name){
  alert(name + '\n\nPerfil detallado — próximamente en una siguiente iteración.');
}

// ── CONSTRUIR LISTA DE PARTIDOS CON ANÁLISIS ────────────────────────────────
function ligaBuildPD(){
  const u = ligaBayesUpd();
  const data = [];
  for(const[fecha, matches] of Object.entries(LIGA_FIXTURES)){
    matches.forEach(m=>{
      const a = ligaMatchAnal(m.ta, m.tb, u);
      const real = ligaGetResult(m.ta, m.tb);
      data.push({
        fecha, date:m.date, ta:m.ta, tb:m.tb, ...a,
        played: !!real, real: real?[real.ga,real.gb]:null
      });
    });
  }
  LIGA_PD = data;
  return data;
}

// ── TARJETA DE PARTIDO ──────────────────────────────────────────────────────
function ligaRenderPCard(m){
  const maxP = Math.max(m.pw_a, m.pd, m.pw_b);
  const hiA = m.pw_a===maxP, hiD = m.pd===maxP&&!hiA, hiB = m.pw_b===maxP&&!hiA&&!hiD;
  const wA = m.played && m.real[0]>m.real[1];
  const wB = m.played && m.real[1]>m.real[0];
  const scoreMain = m.played ? `<span style="color:#1a5e34">${m.real[0]}-${m.real[1]}</span>` : m.xgRStr;
  const scoreLbl = m.played ? 'real' : 'xG rond.';
  const modalKey = (m.ta+'|'+m.tb).replace(/['"]/g,'');
  const dateLabel = new Date(m.date+'T00:00:00').toLocaleDateString('es-ES',{weekday:'short',day:'numeric',month:'short'});

  // ── Detector de sorpresas (misma lógica que el Mundial) ──
  const favWinP = Math.max(m.pw_a, m.pw_b);
  const undWinP = Math.min(m.pw_a, m.pw_b);
  const isUpset = !m.played && undWinP >= 0.30 && favWinP < 0.60;
  const upsetBadge = isUpset
    ? `<span style="font-size:10px;font-weight:600;background:#fef3c7;color:#92400e;border:1px solid #fcd34d;border-radius:5px;padding:2px 7px;white-space:nowrap">🚨 Posible sorpresa</span>`
    : '';

  return `<div class="pcard${m.played?' played-card':''}">
    <div class="pcard-hdr">
      <span>${m.fecha} · ${dateLabel}</span>
      <span style="display:flex;align-items:center;gap:5px">${upsetBadge}${m.played?'✅ Jugado':'⏳ Pendiente'}</span>
    </div>
    <div class="pcard-body">
      <div class="teams-row">
        <div class="team-a-n${wA?' fav':''}" style="cursor:pointer" onclick="ligaOpenTeamProfile('${m.ta}')">${m.ta}</div>
        <div class="sbox${wA||wB?' fs':''}">${scoreMain}<span class="slbl">${scoreLbl}</span></div>
        <div class="team-b-n${wB?' fav':''}" style="cursor:pointer" onclick="ligaOpenTeamProfile('${m.tb}')">${m.tb}</div>
      </div>
      <div class="probs-row">
        <div class="pbox${hiA?' hi':''}"><div class="pv">${(m.pw_a*100).toFixed(0)}%</div><div class="pl">Gana ${m.ta.split(' ')[0]}</div></div>
        <div class="pbox${hiD?' hi':''}"><div class="pv">${(m.pd*100).toFixed(0)}%</div><div class="pl">Empate</div></div>
        <div class="pbox${hiB?' hi':''}"><div class="pv">${(m.pw_b*100).toFixed(0)}%</div><div class="pl">Gana ${m.tb.split(' ')[0]}</div></div>
      </div>
      ${IS_PREMIUM ? `<div class="quick-strip">
        <div class="qs-xg-pill">
          <div class="qs-xg-team"><span class="qs-xg-name">${m.ta.split(' ')[0]}</span><span class="qs-xg-num">${m.la}</span></div>
          <div class="qs-xg-mid"><span class="qs-xg-label">xG</span><span class="qs-xg-total-val">Total ${m.xg_total}</span></div>
          <div class="qs-xg-team qs-xg-team-r"><span class="qs-xg-name">${m.tb.split(' ')[0]}</span><span class="qs-xg-num">${m.lb}</span></div>
        </div>
        <div class="qs-pills-row">
          <div class="qs-pill ${m.p_over25>=0.5?'qs-pill-blue':'qs-pill-gray'}"><span class="qs-pill-lbl">O2.5</span><span class="qs-pill-val">${(m.p_over25*100).toFixed(0)}%</span></div>
          <div class="qs-pill qs-pill-gray"><span class="qs-pill-lbl">U2.5</span><span class="qs-pill-val">${(m.p_under25*100).toFixed(0)}%</span></div>
          <div class="qs-pill ${m.p_btts>=0.5?'qs-pill-green':'qs-pill-gray'}"><span class="qs-pill-lbl">BTTS</span><span class="qs-pill-val">${(m.p_btts*100).toFixed(0)}%</span></div>
          <div class="qs-pill ${m.p_over15>=0.7?'qs-pill-blue':'qs-pill-gray'}"><span class="qs-pill-lbl">O1.5</span><span class="qs-pill-val">${(m.p_over15*100).toFixed(0)}%</span></div>
        </div>
      </div>` : `<div style="margin:8px 0;padding:10px 12px;background:#f9f9f9;border-radius:8px;border:1px dashed #ddd;display:flex;align-items:center;justify-content:space-between;gap:8px">
        <div style="font-size:11px;color:#888">🔐 <strong style="color:#111">xG · O/U · BTTS · Corners · Tarjetas</strong> disponibles en Premium</div>
        <button onclick="showPremiumModal()" style="padding:5px 10px;background:#111;color:#fff;border:none;border-radius:6px;font-size:11px;cursor:pointer;font-family:inherit;white-space:nowrap;font-weight:500">Ver más →</button>
      </div>`}
      <button class="expand-btn" onclick="${IS_PREMIUM ? `ligaOpenMatchModal('${modalKey}')` : 'showPremiumModal()'}">
        <span class="expand-label">${IS_PREMIUM ? 'Ver análisis completo' : '🔐 Desbloquear análisis completo'}</span>
        <span class="expand-icon">↗</span>
      </button>
    </div>
  </div>`;
}

let LIGA_SEARCH_Q = '';
let LIGA_FECHA_FILTER = 'all';

function ligaFilterMatches(val){
  LIGA_SEARCH_Q = val || '';
  ligaRenderPartidos();
  setTimeout(()=>{
    const inp = document.getElementById('liga-search-input');
    if(inp){ inp.focus(); inp.setSelectionRange(LIGA_SEARCH_Q.length, LIGA_SEARCH_Q.length); }
  }, 10);
}

function ligaFiltFecha(fecha, btn){
  LIGA_FECHA_FILTER = fecha;
  ligaRenderPartidos();
}

function ligaRenderPartidos(){
  const cont = document.getElementById('pcont-liga');
  if(!cont) return;
  ligaBuildPD();
  window._LIGA_PCARDS = {};
  LIGA_PD.forEach(m=>{ window._LIGA_PCARDS[m.ta+'|'+m.tb] = m; });

  const sq = LIGA_SEARCH_Q.toLowerCase().trim().replace(/\bvs\b/g,'').trim();
  const sqParts = sq.split(/\s+/).filter(Boolean);
  function matchesSearch(m){
    if(!sq) return true;
    const ta=m.ta.toLowerCase(), tb=m.tb.toLowerCase();
    if(sqParts.length>=2) return sqParts.every(p=>ta.includes(p)||tb.includes(p));
    return ta.includes(sq)||tb.includes(sq);
  }

  // Filtro de fecha — igual de importante que el buscador cuando hay muchas fechas cargadas
  const fechaKeys = Object.keys(LIGA_FIXTURES);
  let html = `<div class="rfilt" style="margin-bottom:.8rem">
    <button class="rfbtn${LIGA_FECHA_FILTER==='all'?' active':''}" onclick="ligaFiltFecha('all',this)">Todas</button>
    ${fechaKeys.map(fk=>`<button class="rfbtn${LIGA_FECHA_FILTER===fk?' active':''}" onclick="ligaFiltFecha('${fk}',this)">${fk}</button>`).join('')}
  </div>`;

  html += `<div style="margin-bottom:.8rem">
    <input id="liga-search-input" type="text" placeholder="🔍 Buscar equipo o partido (ej: Barcelona · Barcelona Emelec)" value="${LIGA_SEARCH_Q}"
      oninput="ligaFilterMatches(this.value)"
      style="width:100%;padding:9px 12px;border:1px solid #ddd;border-radius:8px;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box"
      onfocus="this.style.borderColor='#111'" onblur="this.style.borderColor='#ddd'">
  </div>`;

  const filtered = LIGA_PD.filter(m => (LIGA_FECHA_FILTER==='all' || m.fecha===LIGA_FECHA_FILTER) && matchesSearch(m));
  if(!filtered.length){
    html += `<div class="infobox">No se encontraron partidos${LIGA_SEARCH_Q?` para <strong>"${LIGA_SEARCH_Q}"</strong>`:' en esta fecha'}.<br><span style="font-size:11px;color:#aaa">Prueba con un equipo ("Barcelona") o dos equipos ("Barcelona Emelec")</span></div>`;
    cont.innerHTML = html;
    return;
  }

  let lastFecha = '';
  filtered.forEach(m=>{
    if(m.fecha !== lastFecha){
      if(lastFecha) html += '</div>';
      lastFecha = m.fecha;
      html += `<p class="slabel">${m.fecha}</p><div class="pmgrid">`;
    }
    html += ligaRenderPCard(m);
  });
  if(lastFecha) html += '</div>';
  html += `<p style="font-size:11px;color:#999;margin-top:1rem">Calendario cargado: ${Object.keys(LIGA_FIXTURES).join(', ')} · se amplía cada semana</p>`;
  cont.innerHTML = html;
}

// ── MODAL DE ANÁLISIS COMPLETO — con tabs Goles / Corners / Tarjetas ───────
function ligaOuTeamHtml(name, pScore, p15, p25){
  return '<div class="ou-team-block">'
    +'<div class="ou-team-name">'+name.split(' ')[0]+'</div>'
    +'<table class="ou-team-table"><thead><tr><th>Línea</th><th>Over</th><th>Under</th></tr></thead><tbody>'
    +'<tr class="'+(pScore>=0.5?'ou-tr-hi':'')+'"><td><strong>0.5</strong></td><td class="'+(pScore>=0.5?'td-hi-g':'')+'"><strong>'+Math.round(pScore*100)+'%</strong></td><td class="'+((1-pScore)>=0.5?'td-hi-r':'')+'"><strong>'+Math.round((1-pScore)*100)+'%</strong></td></tr>'
    +'<tr class="'+(p15>=0.5?'ou-tr-hi':'')+'"><td><strong>1.5</strong></td><td class="'+(p15>=0.5?'td-hi-g':'')+'"><strong>'+Math.round(p15*100)+'%</strong></td><td class="'+((1-p15)>=0.5?'td-hi-r':'')+'"><strong>'+Math.round((1-p15)*100)+'%</strong></td></tr>'
    +'<tr class="'+(p25>=0.4?'ou-tr-hi':'')+'"><td><strong>2.5</strong></td><td class="'+(p25>=0.4?'td-hi-g':'')+'"><strong>'+Math.round(p25*100)+'%</strong></td><td class="'+((1-p25)>=0.6?'td-hi-r':'')+'"><strong>'+Math.round((1-p25)*100)+'%</strong></td></tr>'
    +'</tbody></table></div>';
}

function ligaFormDots(form){
  if(!form.length) return '<span style="font-size:11px;color:#aaa">Sin partidos registrados aún</span>';
  return form.map(r=>{
    const bg = r.result==='W'?'#d4edda':r.result==='D'?'#e8e8e8':'#fde8e8';
    const col = r.result==='W'?'#1a5e34':r.result==='D'?'#666':'#c00';
    return `<span title="vs ${r.opp}: ${r.myG}-${r.oppG}" style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:${bg};color:${col};font-size:10px;font-weight:700">${r.result}</span>`;
  }).join(' ');
}

function ligaOpenMatchModal(key){
  const m = window._LIGA_PCARDS[key];
  if(!m) return;
  const existing = document.getElementById('liga-match-modal');
  if(existing) existing.remove();

  const p_score_a=+(1-Math.exp(-m.la)).toFixed(3), p_score_b=+(1-Math.exp(-m.lb)).toFixed(3);
  const p_15_a=+(1-Math.exp(-m.la)*(1+m.la)).toFixed(3), p_15_b=+(1-Math.exp(-m.lb)*(1+m.lb)).toFixed(3);
  const p_25_a=+(1-Math.exp(-m.la)*(1+m.la+m.la*m.la/2)).toFixed(3), p_25_b=+(1-Math.exp(-m.lb)*(1+m.lb+m.lb*m.lb/2)).toFixed(3);

  const [ca, cb] = ligaCornerCalc(m.ta, m.tb);
  const cTotal = +(ca+cb).toFixed(2);
  const cLines = [2.5,3.5,4.5,5.5,6.5,7.5,8.5];
  const cGlobalLines = [5.5,6.5,7.5,8.5,9.5,10.5];
  const cGlobalOU = cornerOUTable(cTotal, cGlobalLines);
  const cOUa = cornerOUTable(ca, cLines), cOUb = cornerOUTable(cb, cLines);

  const [tla, tlb] = ligaCardCalc(m.ta, m.tb);
  const tTotal = +(tla+tlb).toFixed(2);
  const tLines = [0.5,1.5,2.5];
  const tGlobalLines = [2.5,3.5,4.5];
  const tGlobalOU = cornerOUTable(tTotal, tGlobalLines);
  const tOUa = cornerOUTable(tla, tLines), tOUb = cornerOUTable(tlb, tLines);

  function pillStyle(p){
    if(p>=0.65) return 'background:#d4edda;color:#1a5e34;border:1px solid #86efac';
    if(p>=0.50) return 'background:#fff3cd;color:#856404;border:1px solid #fcd34d';
    return 'background:#f0f0f0;color:#888;border:1px solid transparent';
  }
  function ouRow(r){
    return '<tr><td><strong>'+r.line+'</strong></td>'
      +'<td><span style="display:inline-block;padding:2px 8px;border-radius:5px;font-weight:600;font-size:12px;'+pillStyle(r.pOver)+'">'+Math.round(r.pOver*100)+'%</span></td>'
      +'<td><span style="display:inline-block;padding:2px 8px;border-radius:5px;font-weight:600;font-size:12px;'+pillStyle(r.pUnder)+'">'+Math.round(r.pUnder*100)+'%</span></td></tr>';
  }
  function teamBlock(name, lambda, rows){
    return '<div class="ou-team-block"><div class="ou-team-name">'+name.split(' ')[0]+' <span style="font-size:10px;color:#888;font-weight:400">λ='+lambda+'</span></div>'
      +'<table class="ou-team-table"><thead><tr><th>Línea</th><th>Over</th><th>Under</th></tr></thead><tbody>'+rows.map(ouRow).join('')+'</tbody></table></div>';
  }

  const scores=[];
  for(let i=0;i<8;i++) for(let j=0;j<8;j++) scores.push({s:i+'-'+j, p:pPmf(i,m.la)*pPmf(j,m.lb)*dcF(i,j,m.la,m.lb)});
  scores.sort((a,b)=>b.p-a.p);
  const top5 = scores.slice(0,5);
  const top5sum = top5.reduce((s,x)=>s+x.p,0);

  const formA = ligaTeamForm(m.ta), formB = ligaTeamForm(m.tb);
  const maxP = Math.max(m.pw_a, m.pd, m.pw_b);
  const maxFirst = Math.max(m.p_a_first, m.p_b_first);

  // ── Sorpresa: mismo umbral que el Mundial ──
  const favTeam = m.pw_a>=m.pw_b ? m.ta : m.tb;
  const undTeam = m.pw_a>=m.pw_b ? m.tb : m.ta;
  const favP = Math.max(m.pw_a, m.pw_b), undP = Math.min(m.pw_a, m.pw_b);
  const isUpset = !m.played && undP>=0.30 && favP<0.60;

  function ligaUpsetReasons(){
    const reasons = [];
    const strA = LIGA_STR[m.ta]||0.5, strB = LIGA_STR[m.tb]||0.5;
    if(Math.abs(strA-strB) < 0.08) reasons.push({icon:'⚖️', txt:'Los dos equipos tienen un nivel muy similar según su rendimiento en la temporada — ninguno domina claramente al otro.'});
    const undStr = LIGA_STR[undTeam]||0.5;
    if(undStr > 0.45) reasons.push({icon:'🔥', txt: undTeam+' viene con buena forma esta temporada — no es un rival tan fácil como sugiere ser el menos favorito.'});
    if(m.pd >= 0.27) reasons.push({icon:'🤝', txt:'Hay una probabilidad alta de empate ('+Math.round(m.pd*100)+'%) — el partido puede decidirse por detalles.'});
    if(Math.abs(m.la-m.lb) < 0.4) reasons.push({icon:'📊', txt:'Las oportunidades de gol esperadas son casi iguales ('+m.la+' vs '+m.lb+').'});
    if(!reasons.length) reasons.push({icon:'💡', txt:'El modelo detecta que '+undTeam+' tiene una probabilidad real de ganar, más de lo que sugiere ser el equipo menos favorito.'});
    return reasons;
  }
  const reasons = isUpset ? ligaUpsetReasons() : [];
  const upsetHtml = isUpset ? `
    <div class="modal-section">
      <div style="background:#fef3c7;border:1.5px solid #fcd34d;border-radius:10px;padding:12px 14px">
        <div style="font-size:13px;font-weight:700;color:#92400e;margin-bottom:4px">🚨 El modelo detecta una posible sorpresa</div>
        <div style="font-size:12px;color:#78350f;line-height:1.5"><strong>${undTeam}</strong> tiene un <strong>${Math.round(undP*100)}%</strong> de probabilidad de ganar, frente a <strong>${favTeam}</strong> (${Math.round(favP*100)}%).</div>
      </div>
    </div>
    <div class="modal-section">
      <div class="modal-sec-title">¿Por qué puede pasar la sorpresa?</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${reasons.map(r=>`<div style="display:flex;gap:10px;align-items:flex-start;background:#f9f9f9;border-radius:8px;padding:10px">
          <span style="font-size:18px;flex-shrink:0">${r.icon}</span><span style="font-size:12px;color:#444;line-height:1.5">${r.txt}</span>
        </div>`).join('')}
      </div>
    </div>` : '';

  function firstGoalPill(pct, label, isMax){
    const bg = isMax?'#d4edda':'#f0f0f0', col = isMax?'#1a5e34':'#888', bdr = isMax?'1px solid #86efac':'1px solid transparent';
    return `<div style="flex:1;text-align:center;padding:10px 6px;border-radius:10px;background:${bg};border:${bdr}">
      <div style="font-size:22px;font-weight:700;color:${col}">${Math.round(pct*100)}%</div>
      <div style="font-size:10px;color:${col};margin-top:3px;font-weight:500">${label}</div>
    </div>`;
  }

  const golesHtml = `
    <div class="modal-section">
      <div class="modal-sec-title">Expected Goals (xG)</div>
      <div class="xgs">
        <div class="xgrow"><div class="xgra">${m.xgRA}</div><div class="xglbl">xG redondeado</div><div class="xgrb">${m.xgRB}</div></div>
        <hr class="xgdiv">
        <div class="xgrow"><div class="xgva">${m.la}</div><div class="xglbl">xG exacto · total ${m.xg_total}</div><div class="xgvb">${m.lb}</div></div>
        <hr class="xgdiv">
        <div class="xgrow"><div class="xghta">${m.htRA} <span style="opacity:.6">(${m.htA})</span></div><div class="xglbl">xG medio tiempo</div><div class="xghtb"><span style="opacity:.6">(${m.htB})</span> ${m.htRB}</div></div>
      </div>
    </div>
    <div class="modal-section">
      <div class="modal-sec-title">🥅 ¿Quién marca primero?</div>
      <div style="display:flex;gap:8px;align-items:stretch">
        ${firstGoalPill(m.p_a_first, 'Marca primero<br>'+m.ta.split(' ')[0], m.p_a_first===maxFirst)}
        ${firstGoalPill(m.p_b_first, 'Marca primero<br>'+m.tb.split(' ')[0], m.p_b_first===maxFirst)}
        <div style="flex:1;text-align:center;padding:10px 6px;border-radius:10px;background:#f0f0f0;border:1px solid transparent">
          <div style="font-size:22px;font-weight:700;color:#888">${Math.round(m.p_no_goal*100)}%</div>
          <div style="font-size:10px;color:#888;margin-top:3px;font-weight:500">Sin goles<br>(0-0)</div>
        </div>
      </div>
    </div>
    <div class="modal-section">
      <div class="modal-sec-title">Top 5 resultados más probables</div>
      <div class="top5-grid">
        ${top5.map((s,i)=>`<div class="top5-item${i===0?' top5-first':''}">
          <div class="top5-score">${s.s}</div>
          <div class="top5-bar-wrap"><div class="top5-bar" style="width:${Math.round(s.p/top5[0].p*100)}%"></div></div>
          <div class="top5-pct">${(s.p*100).toFixed(1)}%</div>
        </div>`).join('')}
        <div class="top5-note">Otros resultados: ${((1-top5sum)*100).toFixed(0)}% de probabilidad combinada</div>
      </div>
    </div>
    <div class="modal-section">
      <div class="modal-sec-title">Over / Under — Partido completo</div>
      <div class="ou-btts"><div class="ou-row">
        <div class="ou-item${m.p_over15>=0.7?' ou-hi':''}"><div class="ou-val">${Math.round(m.p_over15*100)}%</div><div class="ou-lbl">Over 1.5</div></div>
        <div class="ou-item${m.p_over25>=0.5?' ou-hi':''}"><div class="ou-val">${Math.round(m.p_over25*100)}%</div><div class="ou-lbl">Over 2.5</div></div>
        <div class="ou-item${m.p_over35>=0.4?' ou-hi':''}"><div class="ou-val">${Math.round(m.p_over35*100)}%</div><div class="ou-lbl">Over 3.5</div></div>
        <div class="ou-item${m.p_under25>0.5?' ou-hi':''}"><div class="ou-val">${Math.round(m.p_under25*100)}%</div><div class="ou-lbl">Under 2.5</div></div>
      </div></div>
    </div>
    <div class="modal-section">
      <div class="modal-sec-title">BTTS — Ambos equipos marcan</div>
      <div class="ou-btts"><div class="ou-row">
        <div class="ou-item${m.p_btts>=0.5?' btts-hi':''}"><div class="ou-val">${Math.round(m.p_btts*100)}%</div><div class="ou-lbl">BTTS ✅</div></div>
        <div class="ou-item${m.p_no_btts>0.5?' btts-no-hi':''}"><div class="ou-val">${Math.round(m.p_no_btts*100)}%</div><div class="ou-lbl">No BTTS ❌</div></div>
      </div></div>
    </div>
    <div class="modal-section">
      <div class="modal-sec-title">Over / Under — Por equipo</div>
      <div class="ou-teams-grid">
        ${ligaOuTeamHtml(m.ta, p_score_a, p_15_a, p_25_a)}
        ${ligaOuTeamHtml(m.tb, p_score_b, p_15_b, p_25_b)}
      </div>
    </div>
    <div class="modal-section">
      <div class="modal-sec-title">Forma reciente (últimos partidos registrados)</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div style="text-align:center"><div style="font-size:11px;color:#888;margin-bottom:6px">${m.ta}</div>${ligaFormDots(formA)}</div>
        <div style="text-align:center"><div style="font-size:11px;color:#888;margin-bottom:6px">${m.tb}</div>${ligaFormDots(formB)}</div>
      </div>
      <p style="font-size:10px;color:#aaa;margin-top:8px">Solo refleja partidos ingresados desde que empezamos a trackear (Fecha 17 en adelante) — se irá completando con cada fecha nueva.</p>
    </div>`;

  const cornersHtml = `
    <div class="modal-section">
      <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;background:#f5f5f5;border-radius:10px;padding:14px 16px">
        <div style="text-align:right"><div style="font-size:11px;font-weight:600;color:#555;margin-bottom:4px">${m.ta}</div><div style="font-size:28px;font-weight:700">${ca}</div><div style="font-size:10px;color:#aaa;margin-top:2px">corners esp.</div></div>
        <div style="text-align:center"><div style="font-size:9px;font-weight:700;color:#aaa;text-transform:uppercase">Total esp.</div><div style="font-size:32px;font-weight:700">${cTotal}</div></div>
        <div style="text-align:left"><div style="font-size:11px;font-weight:600;color:#555;margin-bottom:4px">${m.tb}</div><div style="font-size:28px;font-weight:700">${cb}</div><div style="font-size:10px;color:#aaa;margin-top:2px">corners esp.</div></div>
      </div>
    </div>
    <div class="modal-section">
      <div class="modal-sec-title">Over / Under — Partido completo</div>
      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:5px;margin-bottom:5px">
        ${cGlobalOU.map(r=>`<div style="text-align:center;padding:7px 4px;border-radius:8px;${pillStyle(r.pOver)}"><div style="font-size:13px;font-weight:700">${Math.round(r.pOver*100)}%</div><div style="font-size:9px;font-weight:500;margin-top:2px">O${r.line}</div></div>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:5px">
        ${cGlobalOU.map(r=>`<div style="text-align:center;padding:7px 4px;border-radius:8px;${pillStyle(r.pUnder)}"><div style="font-size:13px;font-weight:700">${Math.round(r.pUnder*100)}%</div><div style="font-size:9px;font-weight:500;margin-top:2px">U${r.line}</div></div>`).join('')}
      </div>
    </div>
    <div class="modal-section">
      <div class="modal-sec-title">Over / Under — Por equipo</div>
      <div class="ou-teams-grid">${teamBlock(m.ta, ca, cOUa)}${teamBlock(m.tb, cb, cOUb)}</div>
    </div>
    <div class="modal-section">
      <p style="font-size:11px;color:#888;line-height:1.5">Se calcula con distribución de Poisson (igual que los goles). El promedio esperado de corners parte de un índice de estilo de juego estimado por nosotros — no existe data pública de corners históricos por equipo en LigaPro.</p>
    </div>`;

  const tarjetasHtml = `
    <div class="modal-section">
      <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;background:#f5f5f5;border-radius:10px;padding:14px 16px">
        <div style="text-align:right"><div style="font-size:11px;font-weight:600;color:#555;margin-bottom:4px">${m.ta}</div><div style="font-size:28px;font-weight:700">${tla}</div><div style="font-size:10px;color:#aaa;margin-top:2px">tarjetas esp.</div></div>
        <div style="text-align:center"><div style="font-size:9px;font-weight:700;color:#aaa;text-transform:uppercase">Total esp.</div><div style="font-size:32px;font-weight:700">${tTotal}</div></div>
        <div style="text-align:left"><div style="font-size:11px;font-weight:600;color:#555;margin-bottom:4px">${m.tb}</div><div style="font-size:28px;font-weight:700">${tlb}</div><div style="font-size:10px;color:#aaa;margin-top:2px">tarjetas esp.</div></div>
      </div>
    </div>
    <div class="modal-section">
      <div class="modal-sec-title">Over / Under — Partido completo</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-bottom:5px">
        ${tGlobalOU.map(r=>`<div style="text-align:center;padding:7px 4px;border-radius:8px;${pillStyle(r.pOver)}"><div style="font-size:13px;font-weight:700">${Math.round(r.pOver*100)}%</div><div style="font-size:9px;font-weight:500;margin-top:2px">O${r.line}</div></div>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px">
        ${tGlobalOU.map(r=>`<div style="text-align:center;padding:7px 4px;border-radius:8px;${pillStyle(r.pUnder)}"><div style="font-size:13px;font-weight:700">${Math.round(r.pUnder*100)}%</div><div style="font-size:9px;font-weight:500;margin-top:2px">U${r.line}</div></div>`).join('')}
      </div>
    </div>
    <div class="modal-section">
      <div class="modal-sec-title">Over / Under — Por equipo</div>
      <div class="ou-teams-grid">${teamBlock(m.ta, tla, tOUa)}${teamBlock(m.tb, tlb, tOUb)}</div>
    </div>
    <div class="modal-section">
      <p style="font-size:11px;color:#888;line-height:1.5">Basado en el índice histórico de agresividad estimado por estilo de juego. El árbitro designado puede influir en el total real — úsalo como referencia de tendencia.</p>
    </div>`;

  const html = `<div class="modal-box">
    <div class="modal-hdr">
      <div><div class="modal-title">${m.ta} vs ${m.tb}</div><div class="modal-sub">${m.fecha} · ${m.played?'Jugado':'Pendiente'}</div></div>
      <button class="modal-close" onclick="document.getElementById('liga-match-modal').remove()">&#x2715;</button>
    </div>
    <div class="modal-section" style="border-bottom:1px solid #f0f0f0">
      <div class="modal-sec-title">Probabilidades de victoria</div>
      <div class="probs-row">
        <div class="pbox${m.pw_a===maxP?' hi':''}"><div class="pv">${Math.round(m.pw_a*100)}%</div><div class="pl">Gana ${m.ta.split(' ')[0]}</div></div>
        <div class="pbox${m.pd===maxP&&m.pw_a!==maxP?' hi':''}"><div class="pv">${Math.round(m.pd*100)}%</div><div class="pl">Empate</div></div>
        <div class="pbox${m.pw_b===maxP&&m.pw_a!==maxP&&m.pd!==maxP?' hi':''}"><div class="pv">${Math.round(m.pw_b*100)}%</div><div class="pl">Gana ${m.tb.split(' ')[0]}</div></div>
      </div>
    </div>
    <div style="display:flex;border-bottom:1px solid #e0e0e0;background:#fafafa">
      <button id="liga-mtab-goles" onclick="ligaSwitchModalTab('goles')" style="flex:1;padding:10px;font-size:12px;font-weight:500;border:none;background:none;cursor:pointer;border-bottom:2px solid #111;color:#111;font-family:inherit">⚽ Goles</button>
      <button id="liga-mtab-corners" onclick="ligaSwitchModalTab('corners')" style="flex:1;padding:10px;font-size:12px;font-weight:500;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;color:#888;font-family:inherit">📐 Corners</button>
      <button id="liga-mtab-tarjetas" onclick="ligaSwitchModalTab('tarjetas')" style="flex:1;padding:10px;font-size:12px;font-weight:500;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;color:#888;font-family:inherit">🟨 Tarjetas</button>
      ${isUpset ? `<button id="liga-mtab-upset" onclick="ligaSwitchModalTab('upset')" style="flex:1;padding:10px;font-size:12px;font-weight:600;border:none;background:#fef9e7;cursor:pointer;border-bottom:2px solid transparent;color:#92400e;font-family:inherit">🚨 Sorpresa</button>` : ''}
    </div>
    <div id="liga-mtab-content-goles">${golesHtml}</div>
    <div id="liga-mtab-content-corners" style="display:none">${cornersHtml}</div>
    <div id="liga-mtab-content-tarjetas" style="display:none">${tarjetasHtml}</div>
    ${isUpset ? `<div id="liga-mtab-content-upset" style="display:none">${upsetHtml}</div>` : ''}
  </div>`;

  const overlay = document.createElement('div');
  overlay.id = 'liga-match-modal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999;display:flex;align-items:center;justify-content:center;padding:1rem;overflow-y:auto';
  overlay.onclick = function(e){ if(e.target===overlay) overlay.remove(); };
  overlay.innerHTML = html;
  document.body.appendChild(overlay);
}

function ligaSwitchModalTab(tab){
  ['goles','corners','tarjetas','upset'].forEach(t=>{
    const btn = document.getElementById('liga-mtab-'+t);
    const content = document.getElementById('liga-mtab-content-'+t);
    if(!btn||!content) return;
    const active = t===tab;
    btn.style.borderBottom = active?'2px solid #111':'2px solid transparent';
    btn.style.color = active?'#111':'#888';
    btn.style.fontWeight = active?'600':'400';
    content.style.display = active?'block':'none';
  });
}

// ── ENTRADA MANUAL DE RESULTADOS — organizada por fecha ────────────────────
// ── RESPALDO LOCAL (localStorage) — igual que el Mundial ───────────────────
const LIGA_LS_KEY = 'ligapro_results';

function ligaSaveToStorage(){
  try{
    localStorage.setItem(LIGA_LS_KEY, JSON.stringify({ LIGA_RR, savedAt: new Date().toISOString() }));
    let el = document.getElementById('liga-save-indicator');
    if(!el){
      el = document.createElement('span');
      el.id = 'liga-save-indicator';
      el.style.cssText = 'font-size:11px;color:#1a5e34;margin-left:8px;transition:opacity .3s';
      const anchor = document.querySelector('.slabel');
      if(anchor && anchor.parentNode) anchor.parentNode.insertBefore(el, anchor);
    }
    if(el){
      el.textContent = '💾 Guardado';
      el.style.opacity = '1';
      setTimeout(()=>{ el.style.opacity = '0'; }, 2000);
    }
  } catch(e){ console.warn('LigaPro: no se pudo guardar en localStorage:', e); }
}

function ligaLoadFromStorage(){
  try{
    const raw = localStorage.getItem(LIGA_LS_KEY);
    if(!raw) return false;
    const data = JSON.parse(raw);
    if(data.LIGA_RR) LIGA_RR = data.LIGA_RR;
    return true;
  } catch(e){ return false; }
}

function ligaSetResult(ta, tb, idx, val){
  const key = ta+'|'+tb;
  const v = parseInt(val);
  if(!LIGA_RR[key]) LIGA_RR[key] = [undefined, undefined];
  if(isNaN(v)||val===''){ LIGA_RR[key][idx] = undefined; ligaSaveToStorage(); return; }
  LIGA_RR[key][idx] = v;
  ligaSaveToStorage();  // ← respaldo inmediato, no depende de que Supabase funcione
  if(LIGA_RR[key][0]!==undefined && LIGA_RR[key][1]!==undefined){
    saveToSupabase('LIGA_'+key, LIGA_RR[key][0], LIGA_RR[key][1], 'ligapro').then(ok=>{
      if(!ok) alert('⚠️ No se pudo guardar '+ta+' vs '+tb+' en la nube (sí quedó guardado en este dispositivo). Revisa la consola (F12) para más detalle.');
    });
    ligaRenderAdminInput();
    ligaRenderStandings();
    ligaRenderPartidos();
  }
}

function ligaIsMatchPast(dateStr){
  const d = new Date(dateStr+'T00:00:00');
  const today = new Date(); today.setHours(23,59,59,0);
  return d <= today;
}

let LIGA_FECHA_FILTER_ADMIN = 'all';

function ligaFiltFechaAdmin(fecha, btn){
  LIGA_FECHA_FILTER_ADMIN = fecha;
  ligaRenderAdminInput();
}

function ligaRenderAdminInput(){
  const cont = document.getElementById('mcont-liga');
  if(!cont) return;
  const fechaKeys = Object.keys(LIGA_FIXTURES);
  let html = `<div style="background:#fffbea;border:1.5px solid #f5c518;border-radius:10px;padding:10px 14px;margin-bottom:1rem;font-size:12px;color:#856404">
    💡 LigaPro no tiene sincronización automática — el calendario se actualiza a mano cada semana, e ingresa cada resultado apenas se juegue.
  </div>
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:1rem;flex-wrap:wrap">
    <button onclick="ligaSaveAll()" id="liga-save-all-btn" style="padding:9px 18px;background:#111;color:#fff;border:none;border-radius:8px;cursor:pointer;font-family:inherit;font-weight:500;font-size:13px">💾 Guardar todos los resultados</button>
    <span id="liga-save-all-status" style="font-size:12px;color:#1a5e34"></span>
  </div>
  <div class="rfilt" style="margin-bottom:1rem">
    <button class="rfbtn${LIGA_FECHA_FILTER_ADMIN==='all'?' active':''}" onclick="ligaFiltFechaAdmin('all',this)">Todas</button>
    ${fechaKeys.map(fk=>`<button class="rfbtn${LIGA_FECHA_FILTER_ADMIN===fk?' active':''}" onclick="ligaFiltFechaAdmin('${fk}',this)">${fk}</button>`).join('')}
  </div>`;

  const fechasToShow = LIGA_FECHA_FILTER_ADMIN==='all' ? fechaKeys : [LIGA_FECHA_FILTER_ADMIN];
  fechasToShow.forEach(fecha=>{
    const matches = LIGA_FIXTURES[fecha];
    const playedCount = matches.filter(m=>ligaGetResult(m.ta,m.tb)).length;
    const pendingPast = matches.filter(m=>!ligaGetResult(m.ta,m.tb) && ligaIsMatchPast(m.date)).length;
    html += `<p class="slabel">${fecha} <span style="font-size:10px;color:#aaa;font-weight:400;text-transform:none">· ${playedCount}/${matches.length} jugados${pendingPast>0?` · <span style="color:#856404">⚠️ ${pendingPast} por ingresar</span>`:''}</span></p><div class="rgrid">`;
    matches.forEach(m=>{
      const real = ligaGetResult(m.ta, m.tb);
      const pl = !!real;
      const past = !pl && ligaIsMatchPast(m.date);
      const dateLabel = new Date(m.date+'T00:00:00').toLocaleDateString('es-ES',{weekday:'short',day:'numeric',month:'short'});
      const rowClass = pl ? ' played' : (past ? ' needs-result' : '');
      const warningTag = past ? '<span class="needs-tag">⚠️ Ingresar</span>' : '';
      html += `<div class="mrow${rowClass}">
        <span class="ta${pl&&real.ga>real.gb?' wt':''}" style="font-size:12px">${m.ta}</span>
        <input class="sinp" type="number" min="0" max="15" value="${pl?real.ga:''}" placeholder="-" onchange="ligaSetResult('${m.ta}','${m.tb}',0,this.value)">
        <span class="sep">:</span>
        <input class="sinp" type="number" min="0" max="15" value="${pl?real.gb:''}" placeholder="-" onchange="ligaSetResult('${m.ta}','${m.tb}',1,this.value)">
        <span class="tb${pl&&real.gb>real.ga?' wt':''}" style="font-size:12px">${m.tb}</span>
        ${warningTag}
        <span style="font-size:9px;color:#999;grid-column:1/-1;text-align:center;margin-top:-2px">${dateLabel}</span>
      </div>`;
    });
    html += '</div>';
  });
  cont.innerHTML = html;
}

// Guarda TODO lo que haya en LIGA_RR de una vez — localStorage + reenvío a Supabase.
// Sirve de red de seguridad manual, además del guardado automático al escribir cada marcador.
async function ligaSaveAll(){
  const btn = document.getElementById('liga-save-all-btn');
  const status = document.getElementById('liga-save-all-status');
  if(btn){ btn.disabled = true; btn.textContent = '⏳ Guardando...'; }
  ligaSaveToStorage();
  let okCount = 0;
  let failed = [];
  for(const [key, r] of Object.entries(LIGA_RR)){
    if(r && r[0]!==undefined && r[1]!==undefined){
      try{
        const ok = await saveToSupabase('LIGA_'+key, r[0], r[1], 'ligapro');
        if(ok) okCount++; else failed.push(key);
      } catch(e){
        console.warn('Fallo guardando', key, e);
        failed.push(key);
      }
    }
  }
  if(btn){ btn.disabled = false; btn.textContent = '💾 Guardar todos los resultados'; }
  if(status){
    if(failed.length===0){
      status.textContent = `✅ ${okCount} resultado(s) guardados en la nube (confirmado)`;
      status.style.color = '#1a5e34';
    } else {
      status.textContent = `⚠️ ${okCount} guardados, ${failed.length} FALLARON: ${failed.join(', ')} — revisa la consola (F12)`;
      status.style.color = '#c00';
    }
  }
}

async function ligaLoadFromSupabase(){
  try{
    const rows = await sb.getAll();
    rows.forEach(r=>{
      if(r.tipo==='ligapro'){
        const clave = r.clave.replace('LIGA_','');
        LIGA_RR[clave] = [r.goles_local, r.goles_visita];
      }
    });
  } catch(e){ console.warn('Error cargando LigaPro desde Supabase:', e); }
}

// ── ACTUALIZAR (liviano, solo recalcula — no toca nada del Mundial) ────────
function ligaRefreshModel(){
  const myEpoch = COMP_EPOCH;
  const btn = document.getElementById('btnrun');
  if(btn){ btn.disabled = true; btn.textContent = '⏳ Actualizando...'; }
  setTimeout(()=>{
    if(COMP_EPOCH!==myEpoch){ if(btn){ btn.disabled=false; } return; } // ya no estamos en LigaPro
    ligaRenderStandings();
    ligaRenderPartidos();
    if(IS_ADMIN) ligaRenderAdminInput();
    if(btn){ btn.disabled = false; btn.textContent = '🔄 Actualizar'; }
    const hdrSub = document.getElementById('hdr-sub');
    if(hdrSub){
      const now = new Date();
      hdrSub.innerHTML = '✅ Actualizado a las ' + now.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
    }
  }, 200);
}

// ── INIT ─────────────────────────────────────────────────────────────────
async function ligaInitApp(){
  const myEpoch = COMP_EPOCH;
  ligaInitStr();
  ligaLoadFromStorage();       // ← respaldo local primero (siempre disponible)
  await ligaLoadFromSupabase(); // luego intenta la nube (si Supabase falla, ya tienes el local)
  if(COMP_EPOCH!==myEpoch) return; // el usuario ya cambió de competición mientras cargaba
  ligaRenderStandings();
  ligaRenderPartidos();
  if(IS_ADMIN) ligaRenderAdminInput();

  document.querySelectorAll('.tab').forEach(t=>{
    t.style.display=''; // reset por si viene con estado previo
    if(t.textContent.includes('Bracket')) t.style.display='none';
    if(t.textContent.includes('Resultados') && !IS_ADMIN) t.style.display='none';
    if(t.textContent.includes('Grupos')) t.innerHTML='📊 Tabla';
    if(t.textContent.includes('Partidos')) t.innerHTML='📅 Partidos';
  });

  // Ocultar el filtro de fases del Mundial (Grupos/R32/Octavos...) — no aplica a LigaPro
  const rfilt = document.getElementById('mundial-rfilt');
  if(rfilt) rfilt.style.display = 'none';

  // El botón "Actualizar modelo" pasa a ser liviano y propio de LigaPro,
  // en vez de correr el Monte Carlo pesado del Mundial
  const btn = document.getElementById('btnrun');
  if(btn){
    btn.onclick = ligaRefreshModel;
    btn.textContent = '🔄 Actualizar';
  }

  // El botón "Sincronizar resultados" no aplica — LigaPro no tiene fuente automática
  const btnSync = document.getElementById('btn-sync');
  if(btnSync) btnSync.style.display = 'none';

  // IMPORTANTE: no reemplazar el innerHTML de los paneles completos — eso destruye
  // elementos internos (#rbody, #scards, #tracker-cont) que el Mundial necesita
  // que sigan existiendo para poder renderizar ahí cuando el usuario regrese.
  // En su lugar, solo vaciamos/mensajeamos esos elementos puntuales sin borrarlos.
  const scardsEl = document.getElementById('scards');
  const rbodyEl = document.getElementById('rbody');
  const trackerContEl = document.getElementById('tracker-cont');
  if(scardsEl) scardsEl.innerHTML = '<div class="infobox" style="grid-column:1/-1">Probabilidades de título, Libertadores, Sudamericana y descenso — disponible cuando se acerque la Fase Final (fecha 30).</div>';
  if(rbodyEl) rbodyEl.innerHTML = '';
  if(trackerContEl) trackerContEl.innerHTML = '<div class="infobox">Tracker de aciertos — disponible después de que se jueguen las primeras fechas con resultados ingresados.</div>';

  document.getElementById('hdr-sub').innerHTML = '✅ Datos cargados · Fase Regular · Calendario: ' + Object.keys(LIGA_FIXTURES).join(', ');
}
