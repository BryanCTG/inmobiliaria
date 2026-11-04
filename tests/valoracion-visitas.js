// Etapa 2: valoración, visita, correo (ya probado por API), admin y encabezado.
const puppeteer = require('puppeteer-core');
const B = 'http://localhost:8080';
const pausa = ms => new Promise(r => setTimeout(r, ms));
const ok = (c, t, x = '') => console.log(`${c ? '✅' : '❌'} ${t}${x ? '  → ' + x : ''}`);
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--no-sandbox'] });
  const errores = [];
  const nueva = async (w = 1440, h = 900) => {
    const p = await browser.newPage();
    await p.setViewport({ width: w, height: h });
    p.on('pageerror', e => errores.push(p.url().replace(B, '') + ' pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|tile\.openstreetmap/.test(m.text())) errores.push(p.url().replace(B, '') + ' console: ' + m.text()); });
    return p;
  };
  const props = await (await fetch(B + '/api/propiedades/visibles')).json();
  const login = await fetch(B + '/login', { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `username=admin&password=${process.env.ADMIN_PASSWORD || 'admin123'}` });
  const cookie = login.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');

  console.log('\n— 1. Valoración —');
  let p = await nueva();
  await p.goto(B + '/valoracion.html', { waitUntil: 'networkidle2' }); await pausa(500);
  await p.click('#formValoracion button[type=submit]'); await pausa(1200);
  const valor = await p.$eval('#valorEstimado', e => e.textContent);
  ok(valor === '$467.000.000', 'estimación correcta para Cartagena, 3 hab., 2 baños, 1 parq., 90 m²', valor);
  const rango = await p.$eval('#resultadoValoracion .rango', e => e.textContent);
  ok(rango.includes('$395 millones') && rango.includes('$539 millones'), 'muestra el rango con el margen real', rango);
  ok(await p.$eval('#resultadoValoracion', e => e.textContent.includes('72 millones') && e.textContent.includes('250')), 'explica el margen de error y los 250 datos de entrenamiento');
  ok(!(await p.$('#resultadoValoracion .notice')), 'sin advertencia cuando está dentro del rango');
  await p.$eval('#metrosCuadrados', e => (e.value = '400'));
  await p.click('#formValoracion button[type=submit]'); await pausa(1200);
  ok(!!(await p.$('#resultadoValoracion .notice')), 'área de 400 m² muestra la advertencia de fuera de rango');
  await p.$eval('#habitaciones', e => (e.value = '99'));
  await p.click('#formValoracion button[type=submit]'); await pausa(400);
  ok((await p.$eval('#mensajeValoracion', e => e.className)).includes('is-error'), '99 habitaciones se rechaza antes de enviar', await p.$eval('#mensajeValoracion', e => e.textContent));
  await p.$eval('#habitaciones', e => (e.value = '3')); await p.$eval('#metrosCuadrados', e => (e.value = '90'));
  await p.click('#formValoracion button[type=submit]'); await pausa(1000);
  const href = await p.$eval('#resultadoValoracion a.btn-gold', e => e.getAttribute('href'));
  ok(decodeURIComponent(href).includes('467.000.000') && decodeURIComponent(href).includes('90 m²'), 'el botón lleva la valoración al formulario de contacto');
  await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle2' }), p.click('#resultadoValoracion a.btn-gold')]);
  ok((await p.$eval('#mensaje', e => e.value)).includes('valoración de mi propiedad en Cartagena'), 'el mensaje llega precargado en contacto');
  await p.close();

  console.log('\n— 2. Agendar visita desde el formulario —');
  const prop = props[2];
  const hoy = new Date(); const sab = new Date(hoy); while (sab.getDay() !== 6) sab.setDate(sab.getDate() + 1);
  const lab = new Date(hoy); lab.setDate(lab.getDate() + 4); while ([0, 6].includes(lab.getDay())) lab.setDate(lab.getDate() + 1);
  p = await nueva();
  await p.goto(`${B}/contacto.html`, { waitUntil: 'networkidle2' }); await pausa(600);
  ok(await p.$eval('#bloqueVisita', e => e.hidden), 'sin propiedad elegida no aparece la visita');
  await p.select('#propiedad', prop.id); await pausa(300);
  ok(await p.$eval('#bloqueVisita', e => !e.hidden), 'al elegir una propiedad aparece "Agendar una visita"');
  ok(await p.$eval('#fechaVisita', (e, h) => e.min > h && e.max > e.min, iso(hoy)), 'el calendario limita las fechas (desde mañana, hasta 60 días)', await p.$eval('#fechaVisita', e => `${e.min} a ${e.max}`));
  await p.type('#nombre', 'Visita E2E'); await p.type('#email', 'visita.e2e@test.com'); await p.type('#mensaje', 'Quiero conocer la propiedad');
  await p.click('#acepto');
  await p.$eval('#fechaVisita', (e, v) => { e.value = v; e.dispatchEvent(new Event('input')); }, iso(sab));
  await p.select('#horaVisita', '10:00');
  await p.click('#formContacto button[type=submit]'); await pausa(500);
  ok((await p.$eval('#mensajeContacto', e => e.textContent)).includes('lunes a viernes'), 'un sábado se rechaza con un mensaje claro', await p.$eval('#mensajeContacto', e => e.textContent));
  await p.$eval('#fechaVisita', (e, v) => { e.value = v; e.dispatchEvent(new Event('input')); }, iso(lab));
  await p.select('#horaVisita', '');
  await p.click('#formContacto button[type=submit]'); await pausa(400);
  ok((await p.$eval('#mensajeContacto', e => e.textContent)).includes('hora'), 'sin hora pide elegirla', await p.$eval('#mensajeContacto', e => e.textContent));
  await p.select('#horaVisita', '15:00');
  await p.click('#formContacto button[type=submit]'); await pausa(1500);
  const msg = await p.$eval('#mensajeContacto', e => ({ c: e.className, t: e.textContent }));
  ok(msg.c.includes('is-ok') && msg.t.includes('solicitud de visita'), 'visita válida confirmada', msg.t);
  await p.close();

  const contactos = await (await fetch(B + '/api/contacto', { headers: { cookie } })).json();
  const mio = contactos.find(c => c.correo === 'visita.e2e@test.com');
  ok(mio && mio.fechaVisita === iso(lab) && mio.horaVisita === '15:00' && mio.casaInteres === prop.id, 'la visita quedó guardada con fecha, hora y propiedad', mio && `${mio.fechaVisita} ${mio.horaVisita}`);

  console.log('\n— 3. El admin ve la visita —');
  p = await nueva();
  await p.setCookie(...login.headers.getSetCookie().map(c => { const [n, ...v] = c.split(';')[0].split('='); return { name: n, value: v.join('='), url: B }; }));
  await p.goto(B + '/admin/contactos.html', { waitUntil: 'networkidle2' }); await pausa(800);
  const texto = await p.$$eval('.contact-card', cs => cs.map(c => c.textContent.replace(/\s+/g, ' ')).find(t => t.includes('Visita E2E')) || '');
  ok(texto.includes('Visita solicitada') && texto.includes('15:00'), 'la tarjeta del CRM muestra la visita solicitada', (texto.match(/Visita solicitada:[^"]{0,60}/) || [''])[0]);
  await p.close();
  for (const c of contactos.filter(c => c.correo === 'visita.e2e@test.com')) await fetch(`${B}/api/contacto/${c.id}`, { method: 'DELETE', headers: { cookie } });

  console.log('\n— 4. Encabezado y móvil —');
  for (const w of [901, 960, 1024, 1280]) {
    p = await nueva(w, 800);
    await p.goto(B + '/', { waitUntil: 'networkidle2' }); await pausa(500);
    const m = await p.evaluate(() => { const r = document.querySelector('.nav').getBoundingClientRect(); return { izq: Math.round(r.left), der: Math.round(r.right), vw: document.documentElement.clientWidth }; });
    ok(m.izq >= 0 && m.der <= m.vw, `la barra cabe a ${w} px`, `${m.izq} a ${m.der} de ${m.vw}`);
    await p.close();
  }
  for (const r of ['/valoracion.html', '/contacto.html', '/']) {
    p = await nueva(390, 844);
    await p.goto(B + r, { waitUntil: 'networkidle2' }); await pausa(800);
    const m = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
    ok(m.sw <= m.vw, `${r.padEnd(18)} sin scroll horizontal en móvil`, `${m.sw}/${m.vw}`);
    await p.close();
  }

  console.log('\n— Errores de consola/JS —');
  console.log(errores.length ? [...new Set(errores)].join('\n') : '✅ ninguno');
  await browser.close();
})().catch(e => { console.error('FALLO DE LA PRUEBA', e); process.exit(1); });
