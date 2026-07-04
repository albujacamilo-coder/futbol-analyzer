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
    const existing = check.ok ? await check.json() : [];

    if (existing.length > 0) {
      // Update
      await fetch(`${SUPABASE_URL}/rest/v1/resultados?clave=eq.${encodeURIComponent(clave)}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ goles_local, goles_visita, tipo })
      });
    } else {
      // Insert
      await fetch(`${SUPABASE_URL}/rest/v1/resultados`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clave, goles_local, goles_visita, tipo })
      });
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
    await sb.upsert(clave, goles_local, goles_visita, tipo);
  } catch(e) {
    console.warn('Error guardando en Supabase:', e);
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
  const r16=[[w32[1],w32[5]],[w32[0],w32[2]],[w32[3],w32[4]],[w32[6],w32[7]],[w32[10],w32[11]],[w32[8],w32[9]],[w32[13],w32[15]],[w32[12],w32[14]]];
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
  const r16=mk([[w32[1],w32[5]],[w32[0],w32[2]],[w32[3],w32[4]],[w32[6],w32[7]],[w32[10],w32[11]],[w32[8],w32[9]],[w32[13],w32[15]],[w32[12],w32[14]]],["M89","M90","M91","M92","M93","M94","M95","M96"]);
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
      if(status==='third') retu
