// Pruebas de comportamiento en Edge real.
const puppeteer = require('puppeteer-core');
const EDGE = process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const B = 'http://localhost:8080';
const pausa = ms => new Promise(r => setTimeout(r, ms));
const ok = (cond, texto, extra = '') => console.log(`${cond ? '✅' : '❌'} ${texto}${extra ? '  → ' + extra : ''}`);

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--no-sandbox'] });
  const errores = [];
  const nueva = async (opts = {}) => {
    const p = await browser.newPage();
    await p.setViewport({ width: opts.w || 1440, height: opts.h || 900, isMobile: (opts.w || 1440) < 700, hasTouch: (opts.w || 1440) < 700 });
    if (opts.reduce) await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    p.on('pageerror', e => errores.push(p.url().replace(B, '') + ' pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errores.push(p.url().replace(B, '') + ' console: ' + m.text()); });
    return p;
  };
  const titulos = p => p.$$eval('#lista-anuncios .prop-title a', els => els.map(e => e.textContent.trim()));

  console.log('\n— 1. Búsqueda desde el inicio llega al catálogo con filtros —');
  let p = await nueva();
  await p.goto(B + '/', { waitUntil: 'networkidle2' });
  await p.select('#searchCiudad', 'Cartagena');
  await p.select('#searchHabitaciones', '4');
  await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle2' }), p.click('.search button[type=submit]')]);
  await pausa(800);
  let t = await titulos(p);
  ok(p.url().includes('ciudad=Cartagena') && p.url().includes('habitaciones=4'), 'URL con parámetros', p.url().replace(B, ''));
  ok(t.length > 0 && t.length < 9, 'catálogo filtrado', `${t.length} resultados: ${t.join(' | ').slice(0, 110)}`);
  ok(await p.$eval('#fCiudad', e => e.value) === 'Cartagena', 'select de ciudad precargado');
  const chips = await p.$$eval('.chip', els => els.map(e => e.textContent.trim()));
  ok(chips.length === 2, 'chips activos', chips.join(' | '));

  console.log('\n— 2. Quitar un chip, limpiar y paginar —');
  await p.click('.chip button'); await pausa(500);
  ok((await p.$$('.chip')).length === 1, 'quitar un chip elimina solo ese filtro');
  await p.click('#btnLimpiar'); await pausa(500);
  t = await titulos(p);
  ok(t.length === 6, 'limpiar vuelve a 6 por página', `${t.length}`);
  await p.click('#paginacion button[aria-label="Página 2"]'); await pausa(1200);
  t = await titulos(p);
  ok(t.length === 3, 'página 2 muestra las 3 restantes', `${t.length}`);
  ok(await p.$eval('#paginacion [aria-current="page"]', e => e.textContent) === '2', 'página activa marcada con aria-current');
  await p.type('#fBusqueda', 'zzzzzz'); await p.keyboard.press('Enter'); await pausa(500);
  ok((await p.$eval('.state-box h3', e => e.textContent).catch(() => '')) === 'Sin resultados', 'estado vacío diseñado', await p.$eval('#resultados-texto', e => e.textContent));
  await p.close();

  console.log('\n— 3. Formulario de contacto —');
  const lista = await (await fetch(B + '/api/propiedades/visibles')).json();
  const pid = lista[2].id;
  p = await nueva();
  await p.goto(`${B}/contacto.html?propiedad=${pid}`, { waitUntil: 'networkidle2' });
  await pausa(500);
  ok(await p.$eval('#propiedad', e => e.value) === pid, 'propiedad preseleccionada desde la URL', lista[2].titulo);
  await p.click('button[type=submit]'); await pausa(300);
  const msgVacio = await p.$eval('#mensajeContacto', e => ({ clase: e.className, texto: e.textContent }));
  ok(msgVacio.clase.includes('is-error'), 'envío vacío muestra error específico', msgVacio.texto);
  ok(await p.evaluate(() => document.activeElement.id) === 'nombre', 'el foco va al primer campo inválido');
  await p.type('#nombre', 'Prueba Automática'); await p.type('#email', 'correo-malo'); await p.type('#mensaje', 'Mensaje de prueba E2E');
  await p.click('button[type=submit]'); await pausa(300);
  ok((await p.$eval('#mensajeContacto', e => e.textContent)).toLowerCase().includes('formato'), 'correo inválido detectado', await p.$eval('#mensajeContacto', e => e.textContent));
  await p.$eval('#email', e => (e.value = '')); await p.type('#email', 'prueba.e2e@test.com');
  await p.click('button[type=submit]'); await pausa(300);
  const msgSinConsent = await p.$eval('#mensajeContacto', e => ({ clase: e.className, texto: e.textContent }));
  ok(msgSinConsent.clase.includes('is-error') && msgSinConsent.texto.includes('política de privacidad'), 'sin aceptar la política no se envía', msgSinConsent.texto);
  const antes = (await (await fetch(B + '/api/contacto', { headers: { cookie: await (async () => { const l = await fetch(B + '/login', { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `username=admin&password=${process.env.ADMIN_PASSWORD || 'admin123'}` }); return l.headers.getSetCookie().map(c => c.split(';')[0]).join('; '); })() } })).json()).filter(c => c.correo === 'prueba.e2e@test.com').length;
  ok(antes === 0, 'y no llegó nada al servidor', `${antes} mensajes`);
  await p.click('#acepto');
  await p.click('button[type=submit]'); await pausa(1200);
  const msgOk = await p.$eval('#mensajeContacto', e => ({ clase: e.className, texto: e.textContent }));
  ok(msgOk.clase.includes('is-ok'), 'envío válido confirma', msgOk.texto);
  ok(await p.$eval('#nombre', e => e.value) === '', 'formulario se reinicia');
  await p.close();

  console.log('\n— 4. Seguridad: título malicioso no inyecta HTML —');
  const login = await fetch(B + '/login', { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `username=admin&password=${process.env.ADMIN_PASSWORD || 'admin123'}` });
  const cookie = login.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
  const malicioso = '<img src=x onerror=window.__XSS__=1> Casa "trampa"';
  const form = new FormData();
  form.append('propiedad', new Blob([JSON.stringify({ titulo: malicioso, descripcion: '<script>window.__XSS__=1</script>', precio: 500000000, habitaciones: 2, wc: 1, estacionamiento: 1, metrosCuadrados: 80, ciudad: 'Cartagena', visible: true })], { type: 'application/json' }));
  const creada = await (await fetch(B + '/api/propiedades', { method: 'POST', headers: { cookie }, body: form })).json();
  p = await nueva();
  await p.goto(B + '/anuncio.html?q=trampa', { waitUntil: 'networkidle2' }); await pausa(800);
  const imgsCat = await p.$$eval('#lista-anuncios .prop-title img, #lista-anuncios .prop-desc img, #lista-anuncios script', e => e.length);
  const tituloVisible = await p.$eval('.prop-title a', e => e.textContent).catch(() => '(no encontrado)');
  ok(imgsCat === 0, 'catálogo: 0 etiquetas inyectadas', tituloVisible.slice(0, 50));
  await p.goto(`${B}/propiedad.html?id=${creada.id}`, { waitUntil: 'networkidle2' }); await pausa(1200);
  const inyectadas = await p.$$eval('.info-card h1 img, .panel p img, .panel script, .crumbs img', e => e.length);
  ok(inyectadas === 0, 'detalle: 0 etiquetas inyectadas', (await p.$eval('.info-card h1', e => e.textContent)).slice(0, 50));
  ok(!(await p.evaluate(() => window.__XSS__)), 'ningún script del atacante se ejecutó');
  await p.close();
  await fetch(`${B}/api/propiedades/${creada.id}`, { method: 'DELETE', headers: { cookie } });
  const cs = await (await fetch(B + '/api/contacto', { headers: { cookie } })).json();
  for (const c of cs.filter(c => c.correo === 'prueba.e2e@test.com')) await fetch(`${B}/api/contacto/${c.id}`, { method: 'DELETE', headers: { cookie } });

  console.log('\n— 5. Movimiento reducido —');
  p = await nueva({ reduce: true });
  await p.goto(B + '/', { waitUntil: 'networkidle2' }); await pausa(600);
  const vis = await p.$$eval('[data-reveal]', els => els.filter(e => getComputedStyle(e).opacity !== '1').length);
  ok(vis === 0, 'todo el contenido visible sin animar', `${vis} elementos ocultos`);
  const apagadas = await p.$$eval('.tagline-text .word', ws => ws.filter(w => !w.classList.contains('on')).length);
  ok(apagadas === 0, 'frase completa encendida desde el inicio', `${apagadas} palabras apagadas`);
  const lenis = await p.evaluate(() => document.documentElement.classList.contains('lenis'));
  ok(!lenis, 'scroll suave desactivado');
  await p.close();

  console.log('\n— 6. Scroll con animaciones normales —');
  p = await nueva();
  await p.goto(B + '/', { waitUntil: 'networkidle2' }); await pausa(500);
  ok(await p.evaluate(() => document.documentElement.classList.contains('lenis')), 'scroll suave (Lenis) activo');
  const palabrasAntes = await p.$$eval('.tagline-text .word.on', w => w.length);
  await p.evaluate(() => document.querySelector('.tagline').scrollIntoView({ block: 'center' })); await pausa(1500);
  const palabrasDespues = await p.$$eval('.tagline-text .word.on', w => w.length);
  const totalPal = await p.$$eval('.tagline-text .word', w => w.length);
  ok(palabrasAntes < palabrasDespues, 'las palabras se encienden con el scroll', `${palabrasAntes} → ${palabrasDespues} de ${totalPal}`);
  const hpad = await p.$eval('#siteHeader', e => e.classList.contains('is-scrolled'));
  ok(hpad, 'header cambia de estado al desplazarse');
  await p.close();

  console.log('\n— 7. Desbordes y errores en móvil (390 px) —');
  const rutas = ['/', '/anuncio.html', `/propiedad.html?id=${pid}`, '/contacto.html', '/nosotros.html', '/pagina-inexistente'];
  for (const r of rutas) {
    p = await nueva({ w: 390, h: 844 });
    await p.goto(B + r, { waitUntil: 'networkidle2' }); await pausa(1000);
    const m = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
    ok(m.sw <= m.vw, `${r.slice(0, 28).padEnd(28)} sin scroll horizontal`, `${m.sw} / ${m.vw}`);
    await p.close();
  }

  console.log('\n— Errores de consola/JS durante todas las pruebas —');
  console.log(errores.length ? [...new Set(errores)].join('\n') : '✅ ninguno');
  await browser.close();
})().catch(e => { console.error('FALLO DE LA PRUEBA', e); process.exit(1); });
