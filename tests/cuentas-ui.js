// Etapa 3 (interfaz): cuentas de cliente y propietario, revisión desde el admin.
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const B = 'http://localhost:8080';
const pausa = ms => new Promise(r => setTimeout(r, ms));
const ok = (c, t, x = '') => console.log(`${c ? '✅' : '❌'} ${t}${x ? '  → ' + x : ''}`);
const TAG = Math.random().toString(36).slice(2, 7);
const CLAVE = 'Clave1234';
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--no-sandbox'] });
  const errores = [];
  const ctxs = [];
  const nueva = async (ctx, w = 1440, h = 900) => {
    const p = await ctx.newPage();
    await p.setViewport({ width: w, height: h });
    p.on('pageerror', e => errores.push(p.url().replace(B, '') + ' pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|tile\.openstreetmap/.test(m.text())) errores.push(p.url().replace(B, '') + ' console: ' + m.text()); });
    return p;
  };
  const contexto = async () => { const c = await browser.createBrowserContext(); ctxs.push(c); return c; };
  const registrar = async (p, { nombre, correo, rol, tel }) => {
    await p.goto(`${B}/ingresar.html?tab=registro${rol === 'PROPIETARIO' ? '&rol=propietario' : ''}`, { waitUntil: 'networkidle2' });
    await pausa(300);
    await p.type('#rgNombre', nombre); await p.type('#rgCorreo', correo);
    if (tel) await p.type('#rgTel', tel);
    await p.type('#rgClave', CLAVE); await p.click('#rgAcepto');
    await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle2' }), p.click('#panelRegistro button[type=submit]')]);
    await pausa(600);
  };

  const props = await (await fetch(B + '/api/propiedades/visibles')).json();
  const adminLogin = await fetch(B + '/login', { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `username=admin&password=${process.env.ADMIN_PASSWORD || 'admin123'}` });
  const adminCookie = adminLogin.headers.getSetCookie().map(c => { const [n, ...v] = c.split(';')[0].split('='); return { name: n, value: v.join('='), url: B }; });
  const adminHeader = adminCookie.map(c => `${c.name}=${c.value}`).join('; ');

  console.log('\n— 1. Guardia de acceso —');
  let ctx = await contexto();
  let p = await nueva(ctx);
  await p.goto(B + '/cuenta.html', { waitUntil: 'networkidle2' }); await pausa(500);
  ok(p.url().includes('/ingresar.html') && p.url().includes('volver=%2Fcuenta.html'), 'sin sesión, /cuenta.html manda a ingresar recordando a dónde volver', p.url().replace(B, ''));
  await p.goto(B + '/propietario.html', { waitUntil: 'networkidle2' }); await pausa(500);
  ok(p.url().includes('/ingresar.html'), 'sin sesión, /propietario.html también');
  ok(await p.$eval('#navCuenta', e => e.textContent) === 'Ingresar', 'el encabezado dice "Ingresar" sin sesión');
  await p.type('#liCorreo', `nadie${TAG}@test.com`); await p.type('#liClave', 'incorrecta1');
  await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle2' }), p.click('#panelIngresar button[type=submit]')]); await pausa(400);
  ok((await p.$eval('#mensajeAuth', e => e.textContent)).includes('no son correctos') && p.url().includes('error=true'), 'credenciales malas muestran un error claro', await p.$eval('#mensajeAuth', e => e.textContent));
  await p.click('#tabRegistro'); await p.click('#panelRegistro button[type=submit]'); await pausa(300);
  ok((await p.$eval('#mensajeAuth', e => e.textContent)).length > 5, 'registro vacío no se envía y explica el motivo', await p.$eval('#mensajeAuth', e => e.textContent));
  await p.close();

  console.log('\n— 2. Cliente: registro, favoritos entre dispositivos y solicitudes —');
  const correoC = `cli${TAG}@test.com`;
  ctx = await contexto(); p = await nueva(ctx);
  await registrar(p, { nombre: 'Camila Prueba', correo: correoC, rol: 'CLIENTE' });
  ok(p.url().includes('/cuenta.html'), 'al crear la cuenta de cliente aterriza en /cuenta.html', p.url().replace(B, ''));
  ok((await p.$eval('#saludo', e => e.textContent)).includes('Camila'), 'saluda por el nombre', await p.$eval('#saludo', e => e.textContent));
  ok(await p.$eval('#navCuenta', e => e.textContent) === 'Mi cuenta', 'el encabezado cambia a "Mi cuenta"');
  ok((await p.$$eval('#tabFavoritos, #tabSolicitudes, #tabPerfil', t => t.length)) === 3, 'tiene las 3 pestañas');
  await p.goto(B + '/propietario.html', { waitUntil: 'networkidle2' }); await pausa(600);
  ok(p.url().includes('/cuenta.html'), 'un cliente que entra a /propietario.html vuelve a su cuenta');
  await p.goto(B + '/anuncio.html', { waitUntil: 'networkidle2' }); await pausa(800);
  const ids = await p.$$eval('.prop .fav', f => f.slice(0, 2).map(x => x.dataset.fav));
  await p.click(`.prop .fav[data-fav="${ids[0]}"]`); await p.click(`.prop .fav[data-fav="${ids[1]}"]`); await pausa(1200);
  const meC = await (await fetch(B + '/login', { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `username=${correoC}&password=${CLAVE}` }));
  const cookieC = meC.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
  const guardados = (await (await fetch(B + '/api/cliente/favoritos', { headers: { cookie: cookieC } })).json()).ids;
  ok(guardados.length === 2 && ids.every(i => guardados.includes(i)), 'los favoritos se guardan en la cuenta (no solo en el navegador)', `${guardados.length} en el servidor`);
  // solicitud estando conectado
  const lab = new Date(); lab.setDate(lab.getDate() + 5); while ([0, 6].includes(lab.getDay())) lab.setDate(lab.getDate() + 1);
  await p.goto(`${B}/contacto.html?propiedad=${ids[0]}`, { waitUntil: 'networkidle2' }); await pausa(700);
  await p.type('#nombre', 'Camila Prueba'); await p.type('#email', correoC); await p.type('#mensaje', 'Quiero visitarla pronto'); await p.click('#acepto');
  await p.$eval('#fechaVisita', (e, v) => { e.value = v; e.dispatchEvent(new Event('input')); }, iso(lab)); await p.select('#horaVisita', '09:00');
  await p.click('#formContacto button[type=submit]'); await pausa(1500);
  ok((await p.$eval('#mensajeContacto', e => e.className)).includes('is-ok'), 'envía la solicitud de visita estando conectada');
  await p.goto(B + '/cuenta.html#solicitudes', { waitUntil: 'networkidle2' }); await pausa(900);
  const sol = await p.$$eval('.solicitud', s => s.map(x => x.textContent.replace(/\s+/g, ' ')));
  ok(sol.length === 1 && sol[0].includes('En espera') && sol[0].includes('Visita solicitada') && sol[0].includes('9:00') || sol[0]?.includes('09:00'), 'aparece en "Mis solicitudes" como "En espera" con su visita', (sol[0] || '').slice(0, 90));
  // cerrar sesión limpia el dispositivo
  await p.click('#tabPerfil'); await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle2' }), p.click('#btnSalir')]); await pausa(500);
  ok(new URL(p.url()).pathname === '/', 'cerrar sesión lleva al inicio', p.url().replace(B, ''));
  ok(await p.evaluate(() => (localStorage.getItem('belar_favoritos') || '[]') === '[]'), 'y borra los favoritos del dispositivo (siguen en la cuenta)');
  ok(await p.$eval('#navCuenta', e => e.textContent) === 'Ingresar', 'el encabezado vuelve a "Ingresar"');
  await p.close();
  // otro dispositivo (contexto nuevo): ingresa y ve los mismos favoritos
  const ctx2 = await contexto(); p = await nueva(ctx2);
  await p.goto(B + '/ingresar.html', { waitUntil: 'networkidle2' }); await pausa(300);
  await p.type('#liCorreo', correoC.toUpperCase()); await p.type('#liClave', CLAVE);
  await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle2' }), p.click('#panelIngresar button[type=submit]')]); await pausa(1500);
  ok(p.url().includes('/cuenta.html'), 'ingresar con el correo en MAYÚSCULAS también funciona');
  ok((await p.$$('#favGrid .prop')).length === 2, 'en otro dispositivo aparecen los 2 favoritos guardados', `${(await p.$$('#favGrid .prop')).length}`);
  ok(await p.$eval('.nav-fav-count', e => e.textContent) === '2', 'y el contador del encabezado dice 2');
  await p.close();

  console.log('\n— 3. Propietario: publicar, revisión y estados —');
  const correoP = `dueno${TAG}@test.com`;
  ctx = await contexto(); p = await nueva(ctx);
  await registrar(p, { nombre: 'Pedro Dueño', correo: correoP, rol: 'PROPIETARIO', tel: '3001234567' });
  ok(p.url().includes('/propietario.html'), 'al crear la cuenta de propietario aterriza en /propietario.html', p.url().replace(B, ''));
  ok(await p.$('#listaMias .state-box h3').then(h => !!h), 'sin propiedades muestra el estado vacío con llamado a publicar');
  await p.goto(B + '/cuenta.html', { waitUntil: 'networkidle2' }); await pausa(600);
  ok(p.url().includes('/propietario.html'), 'un propietario que entra a /cuenta.html vuelve a su panel');
  await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle2' }), p.click('a[href="/propietario-propiedad.html"]')]);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==', 'base64');
  fs.writeFileSync(__dirname + '/foto-e2e.png', png);
  await p.click('#formProp button[type=submit]'); await pausa(300);
  ok((await p.$eval('#msgProp', e => e.textContent)).includes('Título'), 'enviar vacío señala el primer campo faltante', await p.$eval('#msgProp', e => e.textContent));
  await p.type('#pTitulo', 'Casa de Pedro ' + TAG); await p.type('#pDescripcion', 'Casa amplia y luminosa'); await p.type('#pPrecio', '480000000');
  await p.type('#pMetros', '110'); await p.type('#pHab', '3'); await p.type('#pWc', '2'); await p.type('#pPark', '1');
  await p.select('#pCiudad', 'Medellin'); await p.type('#pBarrio', 'Laureles'); await p.type('#pDireccion', 'Calle 10 # 20-30');
  await p.click('#formProp button[type=submit]'); await pausa(300);
  ok((await p.$eval('#msgProp', e => e.textContent)).includes('foto'), 'sin foto no se envía', await p.$eval('#msgProp', e => e.textContent));
  await p.click('#btnRef'); await pausa(1200);
  ok((await p.$eval('#resRef', e => e.textContent)).includes('Estimación de referencia'), 'muestra una estimación de referencia para decidir el precio', (await p.$eval('#resRef', e => e.textContent)).slice(0, 80));
  await (await p.$('#pFotos')).uploadFile(__dirname + '/foto-e2e.png'); await pausa(400);
  ok((await p.$$('#previewFotos figure')).length === 1, 'la foto elegida muestra su vista previa');
  await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle2' }), p.click('#formProp button[type=submit]')]); await pausa(900);
  ok(p.url().includes('/propietario.html'), 'al enviar vuelve al panel', p.url().replace(B, ''));
  const fila = await p.$eval('.mia', e => e.textContent.replace(/\s+/g, ' '));
  ok(fila.includes('En revisión') && fila.includes('Casa de Pedro'), 'la propiedad aparece "En revisión"', fila.slice(0, 70));
  ok(!fila.includes('Ver publicación'), 'y todavía no tiene enlace público');
  const resumen = await p.$eval('#resumenPropietario', e => e.textContent.replace(/\s+/g, ' '));
  ok(resumen.includes('1') && resumen.includes('En revisión'), 'el resumen cuenta 1 propiedad en revisión', resumen);
  ok(!(await (await fetch(B + '/api/propiedades/visibles')).json()).some(x => x.titulo.includes('Casa de Pedro ' + TAG)), 'y NO aparece en el catálogo público');

  console.log('\n— 4. El admin la revisa desde su panel —');
  const pa = await nueva(await contexto());
  await pa.setCookie(...adminCookie);
  await pa.goto(B + '/admin/index.html', { waitUntil: 'networkidle2' }); await pausa(900);
  ok(Number(await pa.$eval('#propiedadesRevision', e => e.textContent)) >= 1, 'el dashboard cuenta las propiedades en revisión', await pa.$eval('#propiedadesRevision', e => e.textContent));
  await pa.goto(B + '/admin/propiedades.html', { waitUntil: 'networkidle2' }); await pausa(900);
  const filaAdmin = await pa.$$eval('#lista-propiedades tr', trs => trs.map(t => t.textContent.replace(/\s+/g, ' ')).find(t => t.includes('Casa de Pedro')) || '');
  ok(filaAdmin.includes('En revisión') && filaAdmin.includes('Pedro Dueño') && filaAdmin.includes('3001234567'), 've el estado y los datos de contacto del propietario', filaAdmin.slice(0, 110));
  // rechazar con motivo
  await pa.select('#filtroVisibilidad', 'revision'); await pausa(300);
  await pa.click('#lista-propiedades button[title="Rechazar"]'); await pausa(300);
  await pa.click('#confirmarRechazo'); await pausa(300);
  ok((await pa.$eval('#errorRechazo', e => e.textContent)).includes('motivo'), 'rechazar sin motivo no se permite', await pa.$eval('#errorRechazo', e => e.textContent));
  await pa.type('#motivoRechazo', 'Falta una foto del exterior'); await pa.click('#confirmarRechazo'); await pausa(1200);
  ok(await pa.$eval('#modalRechazo', e => getComputedStyle(e).display === 'none'), 'el modal se cierra al rechazar');
  await p.reload({ waitUntil: 'networkidle2' }); await pausa(900);
  const rech = await p.$eval('.mia', e => e.textContent.replace(/\s+/g, ' '));
  ok(rech.includes('Rechazada') && rech.includes('Falta una foto del exterior'), 'el propietario ve "Rechazada" y el motivo', rech.slice(0, 100));
  // corregir y reenviar
  await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle2' }), p.click('.mia a[href*="propietario-propiedad.html?id="]')]); await pausa(700);
  ok((await p.$eval('#avisoRechazo', e => !e.hidden && e.textContent.includes('Falta una foto'))), 'al editar se le recuerda el motivo');
  ok(await p.$eval('#pTitulo', e => e.value.includes('Casa de Pedro')) && (await p.$$('#previewFotos figure')).length === 1, 'el formulario viene precargado, con su foto actual');
  await p.$eval('#pTitulo', e => (e.value = e.value + ' (corregida)'));
  await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle2' }), p.click('#formProp button[type=submit]')]); await pausa(900);
  ok((await p.$eval('.mia', e => e.textContent)).includes('En revisión'), 'al corregirla vuelve a "En revisión"');
  // aprobar
  await pa.reload({ waitUntil: 'networkidle2' }); await pausa(900);
  await pa.select('#filtroVisibilidad', 'revision'); await pausa(300);
  await pa.click('#lista-propiedades button[title="Aprobar y publicar"]'); await pausa(1200);
  const publicas = await (await fetch(B + '/api/propiedades/visibles')).json();
  const pub = publicas.find(x => x.titulo.includes('Casa de Pedro'));
  ok(!!pub, 'tras aprobar aparece en el catálogo público', pub && pub.titulo);
  await p.reload({ waitUntil: 'networkidle2' }); await pausa(900);
  const apr = await p.$eval('.mia', e => e.textContent.replace(/\s+/g, ' '));
  ok(apr.includes('Publicada') && apr.includes('Ver publicación') && !apr.includes('Editar'), 'el propietario la ve "Publicada", con enlace y sin edición directa', apr.slice(0, 90));
  // consulta de un tercero → el propietario ve el contador
  await fetch(B + '/api/contacto', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: 'Tercero', correo: `ter${TAG}@test.com`, mensaje: 'Interesado', medioContacto: 'correo', casaInteres: pub.id }) });
  await p.reload({ waitUntil: 'networkidle2' }); await pausa(900);
  ok((await p.$eval('.mia-stats', e => e.textContent.replace(/\s+/g, ' '))).includes('1 consulta'), 'cuando alguien consulta, el propietario ve "1 consulta"', await p.$eval('.mia-stats', e => e.textContent.replace(/\s+/g, ' ')));
  ok(!(await p.content()).includes(`ter${TAG}@test.com`), 'sin ver el correo de la persona interesada');
  // retirar en dos pasos
  await p.click('[data-retirar]'); await pausa(300);
  ok((await p.$eval('[data-retirar]', e => e.textContent)) === 'Confirmar retiro', 'retirar pide confirmación en un segundo clic');
  await p.click('[data-retirar]'); await pausa(1200);
  ok((await p.$eval('.mia', e => e.textContent)).includes('Retirada'), 'queda "Retirada"');
  ok(!(await (await fetch(B + '/api/propiedades/visibles')).json()).some(x => x.id === pub.id), 'y sale del catálogo público');

  console.log('\n— 5. Perfil y contraseña —');
  await p.click('#tabPerfil'); await pausa(300);
  ok(await p.$eval('#pfNombre', e => e.value) === 'Pedro Dueño' && await p.$eval('#pfCorreo', e => e.disabled), 'el perfil carga sus datos y el correo no se edita');
  await p.$eval('#pfTel', e => (e.value = '')); await p.click('#formPerfil button[type=submit]'); await pausa(300);
  ok((await p.$eval('#msgPerfil', e => e.className)).includes('is-error'), 'un propietario no puede dejar el celular vacío');
  await p.type('#pfTel', '3105556677'); await p.click('#formPerfil button[type=submit]'); await pausa(800);
  ok((await p.$eval('#msgPerfil', e => e.textContent)).includes('actualizados'), 'guardar cambios confirma', await p.$eval('#msgPerfil', e => e.textContent));
  await p.type('#pwActual', 'mala-clave1'); await p.type('#pwNueva', 'NuevaClave99'); await p.click('#formPassword button[type=submit]'); await pausa(800);
  ok((await p.$eval('#msgPass', e => e.textContent)).includes('no es correcta'), 'contraseña actual errónea se rechaza', await p.$eval('#msgPass', e => e.textContent));
  await p.close();

  console.log('\n— 6. Móvil (390 px) —');
  const logueado = await contexto();
  const pm0 = await nueva(logueado, 390, 844);
  await registrar(pm0, { nombre: 'Móvil Prueba', correo: `mov${TAG}@test.com`, rol: 'CLIENTE' }); await pm0.close();
  for (const r of ['/ingresar.html?tab=registro', '/cuenta.html', '/cuenta.html#perfil']) {
    const pm = await nueva(logueado, 390, 844);
    await pm.goto(B + r, { waitUntil: 'networkidle2' }); await pausa(900);
    const m = await pm.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
    ok(m.sw <= m.vw, `${r.padEnd(28)} sin scroll horizontal`, `${m.sw}/${m.vw}`);
    await pm.close();
  }
  const ctxO = await contexto(); const po = await nueva(ctxO, 390, 844);
  await registrar(po, { nombre: 'Móvil Dueño', correo: `movd${TAG}@test.com`, rol: 'PROPIETARIO', tel: '3001230000' });
  for (const r of ['/propietario.html', '/propietario-propiedad.html']) {
    await po.goto(B + r, { waitUntil: 'networkidle2' }); await pausa(900);
    const m = await po.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
    ok(m.sw <= m.vw, `${r.padEnd(28)} sin scroll horizontal`, `${m.sw}/${m.vw}`);
  }
  await po.close();

  // limpieza
  for (const x of await (await fetch(B + '/api/propiedades', { headers: { cookie: adminHeader } })).json()) {
    if ((x.titulo || '').includes('Casa de Pedro')) await fetch(`${B}/api/propiedades/${x.id}`, { method: 'DELETE', headers: { cookie: adminHeader } });
  }
  for (const c of await (await fetch(B + '/api/contacto', { headers: { cookie: adminHeader } })).json()) {
    if ((c.correo || '').endsWith('@test.com')) await fetch(`${B}/api/contacto/${c.id}`, { method: 'DELETE', headers: { cookie: adminHeader } });
  }

  console.log('\n— Errores de consola/JS —');
  console.log(errores.length ? [...new Set(errores)].join('\n') : '✅ ninguno');
  await browser.close();
})().catch(e => { console.error('FALLO DE LA PRUEBA', e); process.exit(1); });
