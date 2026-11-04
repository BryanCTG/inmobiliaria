// Etapa 1: favoritos, orden, mapa, WhatsApp, calculadora, similares, contacto.
const puppeteer = require('puppeteer-core');
const B = 'http://localhost:8080';
const pausa = ms => new Promise(r => setTimeout(r, ms));
const ok = (c, t, x = '') => console.log(`${c ? '✅' : '❌'} ${t}${x ? '  → ' + x : ''}`);

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

  console.log('\n— 1. Favoritos —');
  let p = await nueva();
  await p.goto(B + '/anuncio.html', { waitUntil: 'networkidle2' }); await pausa(600);
  ok((await p.$$('.prop .fav')).length === 6, 'cada tarjeta tiene su corazón');
  ok(await p.$eval('.nav-fav-count', e => e.hidden), 'contador oculto mientras no hay favoritos');
  const idPrimero = await p.$eval('.prop .fav', e => e.dataset.fav);
  await p.click('.prop .fav'); await pausa(300);
  ok(await p.$eval('.prop .fav', e => e.getAttribute('aria-pressed')) === 'true', 'el corazón queda activo');
  ok(await p.$eval('.nav-fav-count', e => !e.hidden && e.textContent === '1'), 'el contador del encabezado muestra 1');
  ok((await p.evaluate(() => JSON.parse(localStorage.getItem('belar_favoritos')))).includes(idPrimero), 'se guardó en el navegador');
  ok(p.url().includes('/anuncio.html'), 'tocar el corazón NO abre la propiedad');
  ok(await p.$eval('#toast', e => e.textContent), 'aparece un aviso', await p.$eval('#toast', e => e.textContent));
  await p.click('.prop:nth-child(2) .fav'); await pausa(200);
  await p.goto(B + '/favoritos.html', { waitUntil: 'networkidle2' }); await pausa(600);
  ok((await p.$$('#lista-anuncios .prop')).length === 2, 'la página de favoritos muestra las 2 guardadas');
  ok((await p.$eval('#resultados-texto', e => e.textContent)).includes('2'), 'indica cuántas hay', await p.$eval('#resultados-texto', e => e.textContent));
  await p.click('#lista-anuncios .prop .fav'); await pausa(400);
  ok((await p.$$('#lista-anuncios .prop')).length === 1, 'quitar un corazón la saca de la lista al instante');
  await p.click('#lista-anuncios .prop .fav'); await pausa(400);
  ok(await p.$('.state-box h3').then(h => !!h), 'sin favoritos muestra el estado vacío', await p.$eval('.state-box h3', e => e.textContent));
  await p.close();

  console.log('\n— 2. Ordenar y vista de mapa —');
  p = await nueva();
  await p.goto(B + '/anuncio.html', { waitUntil: 'networkidle2' }); await pausa(500);
  const precios = async () => p.$$eval('#lista-anuncios .prop-price', els => els.map(e => Number(e.textContent.replace(/\D/g, ''))));
  await p.select('#fOrden', 'precio-asc'); await pausa(500);
  let pr = await precios();
  ok(pr.every((v, i) => i === 0 || v >= pr[i - 1]), 'precio de menor a mayor', pr.map(v => v / 1e6).join(' < '));
  await p.select('#fOrden', 'precio-desc'); await pausa(500);
  pr = await precios();
  ok(pr.every((v, i) => i === 0 || v <= pr[i - 1]) && pr[0] === Math.max(...props.map(x => x.precio)), 'precio de mayor a menor (el más caro primero)', `${pr[0] / 1e6}M`);
  await p.click('#vistaMapa'); await pausa(2500);
  ok(await p.$eval('#lista-anuncios', e => getComputedStyle(e).display === 'none'), 'en vista mapa se oculta la lista');
  ok(await p.$eval('#mapaCatalogo', e => getComputedStyle(e).display !== 'none' && e.offsetHeight > 300), 'se muestra el mapa');
  const marcadores = await p.$$eval('#mapaCatalogo .leaflet-marker-icon', e => e.length);
  ok(marcadores === props.length, 'un marcador por propiedad con ubicación', `${marcadores} de ${props.length}`);
  await p.click('#mapaCatalogo .leaflet-marker-icon'); await pausa(500);
  ok(await p.$('.leaflet-popup a.pop').then(a => !!a), 'al tocar un marcador aparece la tarjeta con enlace');
  await p.select('#fCiudad', 'Bogota'); await pausa(1200);
  ok(await p.$$eval('#mapaCatalogo .leaflet-marker-icon', e => e.length) === props.filter(x => x.ciudad === 'Bogota').length, 'el mapa respeta los filtros');
  await p.click('#vistaLista'); await pausa(400);
  ok(await p.$eval('#lista-anuncios', e => getComputedStyle(e).display !== 'none'), 'volver a lista funciona');
  await p.close();

  console.log('\n— 3. Ficha: WhatsApp, calculadora y similares —');
  const prop = props.find(x => x.titulo.startsWith('Casa moderna'));
  p = await nueva();
  await p.goto(`${B}/propiedad.html?id=${prop.id}`, { waitUntil: 'networkidle2' }); await pausa(1500);
  const wa = await p.$eval('.btn-wa', e => e.href);
  ok(wa.startsWith('https://wa.me/573001234567?text=') && decodeURIComponent(wa).includes(prop.titulo) && decodeURIComponent(wa).includes('propiedad.html?id=' + prop.id), 'WhatsApp con mensaje y enlace de la propiedad', decodeURIComponent(wa).slice(0, 90) + '…');
  const cuota = await p.$eval('#calcCuota', e => Number(e.textContent.replace(/\D/g, '')));
  const r = Math.pow(1.12, 1 / 12) - 1, monto = prop.precio * 0.7, n = 180;
  const esperada = Math.round(monto * r / (1 - Math.pow(1 + r, -n)));
  ok(Math.abs(cuota - esperada) <= 1, 'cuota inicial calculada correctamente', `${cuota.toLocaleString('es-CO')} vs ${esperada.toLocaleString('es-CO')}`);
  await p.$eval('#calcPlazo', e => { e.value = 30; e.dispatchEvent(new Event('input')); });
  await p.$eval('#calcInicial', e => { e.value = 50; e.dispatchEvent(new Event('input')); });
  await p.$eval('#calcTasa', e => { e.value = '9.5'; e.dispatchEvent(new Event('input')); });
  const cuota2 = await p.$eval('#calcCuota', e => Number(e.textContent.replace(/\D/g, '')));
  const r2 = Math.pow(1.095, 1 / 12) - 1, m2 = prop.precio * 0.5, e2 = Math.round(m2 * r2 / (1 - Math.pow(1 + r2, -360)));
  ok(Math.abs(cuota2 - e2) <= 1, 'recalcula al mover los controles', `${cuota2.toLocaleString('es-CO')} vs ${e2.toLocaleString('es-CO')}`);
  ok(await p.$eval('#calcInicialOut', e => e.textContent) === '50 %' && await p.$eval('#calcPlazoOut', e => e.textContent) === '30 años', 'los valores se muestran junto a los deslizadores');
  const sim = await p.$$eval('#similares-grid .prop-title a', a => a.map(x => x.href));
  ok(sim.length === 3 && !sim.some(h => h.includes(prop.id)), 'muestra 3 similares y ninguna es la misma', `${sim.length}`);
  await p.click('.gallery-main .fav'); await pausa(300);
  ok(await p.$eval('.gallery-main .fav', e => e.getAttribute('aria-pressed')) === 'true', 'el corazón también está en la ficha');
  await p.close();

  console.log('\n— 4. Contacto —');
  p = await nueva();
  await p.goto(`${B}/contacto.html?mensaje=${encodeURIComponent('Quiero valorar mi apartamento')}`, { waitUntil: 'networkidle2' }); await pausa(500);
  ok(await p.$eval('#mensaje', e => e.value) === 'Quiero valorar mi apartamento', 'el mensaje llega precargado desde la URL');
  ok((await p.$eval('#waContacto', e => e.href)).startsWith('https://wa.me/573001234567'), 'el enlace de WhatsApp usa el número de la configuración');
  await p.close();

  console.log('\n— 5. Móvil (390 px) —');
  for (const r of ['/anuncio.html', '/favoritos.html', `/propiedad.html?id=${prop.id}`, '/']) {
    p = await nueva(390, 844);
    await p.goto(B + r, { waitUntil: 'networkidle2' }); await pausa(900);
    const m = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
    ok(m.sw <= m.vw, `${r.slice(0, 26).padEnd(26)} sin scroll horizontal`, `${m.sw}/${m.vw}`);
    await p.close();
  }

  console.log('\n— Errores de consola/JS —');
  console.log(errores.length ? [...new Set(errores)].join('\n') : '✅ ninguno');
  await browser.close();
})().catch(e => { console.error('FALLO DE LA PRUEBA', e); process.exit(1); });
