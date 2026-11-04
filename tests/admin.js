// Pruebas de comportamiento del panel admin (Edge real).
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const B = 'http://localhost:8080';
const pausa = ms => new Promise(r => setTimeout(r, ms));
const ok = (c, t, x = '') => console.log(`${c ? '✅' : '❌'} ${t}${x ? '  → ' + x : ''}`);

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--no-sandbox'] });
  const errores = [];
  const nueva = async (w = 1440, h = 900) => {
    const p = await browser.newPage();
    await p.setViewport({ width: w, height: h, isMobile: w < 700, hasTouch: w < 700 });
    p.on('pageerror', e => errores.push(p.url().replace(B, '') + ' pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errores.push(p.url().replace(B, '') + ' console: ' + m.text()); });
    p.on('dialog', d => d.accept());
    return p;
  };
  const api = async (ruta, cookie, opts = {}) => (await fetch(B + ruta, { ...opts, headers: { cookie, ...(opts.headers || {}) } }));

  console.log('\n— 1. Inicio de sesión por la interfaz —');
  let p = await nueva();
  await p.goto(B + '/admin/index.html', { waitUntil: 'networkidle2' });
  ok(p.url().includes('/admin/login.html'), 'sin sesión redirige al login', p.url().replace(B, ''));
  await p.type('#username', 'admin'); await p.type('#password', 'clave-incorrecta');
  await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle2' }), p.click('button[type=submit]')]);
  await pausa(500);
  ok(p.url().includes('error=true'), 'contraseña incorrecta vuelve al login con error', p.url().replace(B, ''));
  ok(await p.$eval('#error-message', e => getComputedStyle(e).display !== 'none').catch(() => false), 'se muestra el mensaje de error');
  await p.$eval('#username', e => (e.value = '')); await p.type('#username', 'admin');
  await p.$eval('#password', e => (e.value = '')); await p.type('#password', process.env.ADMIN_PASSWORD || 'admin123');
  await p.click('#togglePassword'); await pausa(150);
  ok(await p.$eval('#password', e => e.type) === 'text' && await p.$eval('#eyeIcon', e => e.className.includes('eye-slash')), 'el ojo muestra la contraseña y cambia de ícono');
  await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle2' }), p.click('button[type=submit]')]);
  ok(p.url().includes('/admin/index.html'), 'credenciales correctas entran al dashboard');
  const cookies = await p.cookies();
  const cookie = cookies.map(c => `${c.name}=${c.value}`).join('; ');

  console.log('\n— 2. Íconos y estilos —');
  const ico = await p.$$eval('i.ph', els => els.filter(e => e.offsetParent !== null).map(e => ({ w: e.getBoundingClientRect().width, ff: getComputedStyle(e, '::before').fontFamily })));
  ok(ico.length > 15 && ico.every(i => i.w > 0 && /phosphor/i.test(i.ff)), 'todos los íconos visibles se dibujan con Phosphor', `${ico.length} íconos`);
  const claros = await p.evaluate(() => [...document.querySelectorAll('body *')].filter(e => {
    const bg = getComputedStyle(e).backgroundColor.match(/\d+/g); if (!bg || getComputedStyle(e).backgroundColor.includes('rgba(0, 0, 0, 0)')) return false;
    const [r, g, b, a = 1] = bg.map(Number); return a > 0.5 && (r + g + b) / 3 > 190 && e.getBoundingClientRect().width > 30;
  }).length);
  ok(claros === 0, 'sin fondos claros sueltos en el dashboard', `${claros}`);
  await p.close();

  console.log('\n— 3. Crear una propiedad desde el formulario —');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==', 'base64');
  fs.writeFileSync(__dirname + '/foto-prueba.png', png);
  p = await nueva();
  p.on('request', () => {});
  await p.setCookie(...cookies);
  await p.goto(B + '/admin/crear.html', { waitUntil: 'networkidle2' });
  await p.type('#titulo', 'Propiedad de prueba E2E'); await p.type('#descripcion', 'Creada por la prueba automática');
  await p.type('#precio', '450000000'); await p.type('#metrosCuadrados', '95');
  await p.type('#habitaciones', '3'); await p.type('#wc', '2'); await p.type('#estacionamiento', '1');
  await p.select('#ciudad', 'Cartagena'); await p.type('#barrio', 'Prueba'); await p.type('#direccion', 'Calle 1 # 2-3');
  await (await p.$('#imagen')).uploadFile(__dirname + '/foto-prueba.png');
  await pausa(400);
  await p.click('#formPropiedad button[type=submit]'); await pausa(2600);
  const respLista = await api('/api/propiedades', cookie);
  console.log('   (diagnóstico) GET /api/propiedades ->', respLista.status, '| url actual:', p.url().replace(B, ''));
  const lista = await respLista.json();
  const creada = lista.find(x => x.titulo === 'Propiedad de prueba E2E');
  ok(!!creada, 'la propiedad quedó guardada', creada ? creada.id : '');
  ok(creada && creada.imagenes && creada.imagenes[0].startsWith('/uploads/'), 'la imagen se subió con nombre seguro', creada?.imagenes?.[0]);
  ok(p.url().includes('/admin/propiedades.html'), 'redirige a la lista tras guardar');

  console.log('\n— 4. Lista: ocultar, buscar y eliminar —');
  const filas = await p.$$eval('#lista-propiedades tr', f => f.length);
  ok(filas >= 10, 'la lista incluye la nueva', `${filas} filas`);
  await p.type('#searchInput', 'prueba e2e'); await pausa(400);
  ok(await p.$$eval('#lista-propiedades tr', f => f.length) === 1, 'el buscador filtra a 1 resultado');
  await p.click('#lista-propiedades button[title="Ocultar"]'); await pausa(900);
  const oculta = (await (await api(`/api/propiedades/${creada.id}`, cookie)).json()).visible === false;
  ok(oculta, 'ocultar cambia la visibilidad en el servidor');
  const visitante = (await fetch(`${B}/api/propiedades/${creada.id}`)).status;
  ok(visitante === 404, 'un visitante ya no la ve', `HTTP ${visitante}`);
  await p.type('#searchInput', ''); await p.$eval('#searchInput', e => { e.value = 'prueba e2e'; e.dispatchEvent(new Event('input')); }); await pausa(300);
  await p.click('#lista-propiedades button[title="Eliminar"]'); await pausa(400);
  ok(await p.$eval('#modalEliminar', e => getComputedStyle(e).display !== 'none'), 'aparece el modal de confirmación');
  await p.click('#confirmarEliminar'); await pausa(1200);
  const despues = await (await api('/api/propiedades', cookie)).json();
  ok(!despues.some(x => x.id === creada.id), 'eliminar la borra del servidor');
  await p.close();

  console.log('\n— 5. Contactos —');
  p = await nueva(); await p.setCookie(...cookies);
  await p.goto(B + '/admin/contactos.html', { waitUntil: 'networkidle2' }); await pausa(800);
  const tarjetas = await p.$$eval('.contact-card', c => c.length);
  ok(tarjetas === 5, 'se listan los 5 mensajes', `${tarjetas}`);
  const pendAntes = await p.$eval('#numeroPendientes', e => e.textContent);
  await p.click('.contact-card button.btn-fill'); await pausa(1000);
  const pendDespues = await p.$eval('#numeroPendientes', e => e.textContent);
  ok(Number(pendDespues) === Number(pendAntes) - 1, 'marcar atendido baja los pendientes', `${pendAntes} → ${pendDespues}`);
  await p.click('.contact-card button.btn-outline'); await pausa(1000);
  ok(Number(await p.$eval('#numeroPendientes', e => e.textContent)) === Number(pendAntes), 'se puede volver a marcar pendiente (estado restaurado)');
  await p.type('#searchContacto', 'valentina'); await pausa(500);
  ok(await p.$$eval('.contact-card', c => c.length) === 1, 'el buscador filtra mensajes', await p.$eval('.contact-card-name', e => e.textContent));
  await p.close();

  console.log('\n— 6. Móvil (390 px): menú lateral y desbordes —');
  for (const r of ['/admin/index.html', '/admin/propiedades.html', '/admin/contactos.html', '/admin/crear.html', `/admin/actualizar.html?id=${despues[0].id}`]) {
    p = await nueva(390, 844); await p.setCookie(...cookies);
    await p.goto(B + r, { waitUntil: 'networkidle2' }); await pausa(900);
    const m = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
    ok(m.sw <= m.vw, `${r.split('?')[0].padEnd(28)} sin scroll horizontal`, `${m.sw}/${m.vw}`);
    if (r === '/admin/index.html') {
      const visibleAntes = await p.$eval('#sidebar', e => e.getBoundingClientRect().right > 0);
      await p.tap('#sidebarToggle'); await pausa(700);
      const visibleDespues = await p.$eval('#sidebar', e => e.getBoundingClientRect().right > 100);
      ok(!visibleAntes && visibleDespues, 'el menú lateral se abre con el botón');
    }
    await p.close();
  }
  await p.close?.().catch(() => {});

  console.log('\n— Errores de consola/JS —');
  console.log(errores.length ? [...new Set(errores)].join('\n') : '✅ ninguno');
  await browser.close();
})().catch(e => { console.error('FALLO DE LA PRUEBA', e); process.exit(1); });
