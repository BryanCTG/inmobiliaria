/**
 * Ficha de propiedad: galería, características, descripción y mapa.
 * Todo texto que viene de la base de datos pasa por esc() antes de pintarse.
 */
document.addEventListener('DOMContentLoaded', async () => {
  const contenido = document.getElementById('contenido-propiedad');
  const id = new URLSearchParams(window.location.search).get('id');

  const crumbs = (actual) => `
    <nav class="crumbs" aria-label="Ruta de navegación">
      <a href="/">Inicio</a><i class="ph ph-caret-right" aria-hidden="true"></i>
      <a href="/anuncio.html">Propiedades</a>${actual ? `<i class="ph ph-caret-right" aria-hidden="true"></i><span aria-current="page">${esc(actual)}</span>` : ''}
    </nav>`;

  const vistaError = (titulo, texto) => `
    <div class="page-hero"><div class="container">${crumbs('')}</div></div>
    <section class="section--tight" style="padding-bottom:var(--s-900)">
      <div class="container">
        <div class="state-box">
          <i class="ph ph-house-line" aria-hidden="true"></i>
          <h1 class="heading-5">${esc(titulo)}</h1>
          <p class="body-6">${esc(texto)}</p>
          <a href="/anuncio.html" class="btn btn-gold" style="margin-top:var(--s-100)">Ver todas las propiedades</a>
        </div>
      </div>
    </section>`;

  if (!id) {
    contenido.innerHTML = vistaError('Propiedad no encontrada', 'No se indicó una propiedad válida.');
    return;
  }

  try {
    const res = await fetch(`/api/propiedades/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Propiedad no encontrada');
    const p = await res.json();

    const imagenes = (p.imagenes && p.imagenes.length > 0) ? p.imagenes : ['/img/default.svg'];
    const ciudad = ciudadLegible(p.ciudad);
    const ubicacion = [p.barrio, ciudad].filter(Boolean).join(', ');
    const direccionCompleta = [p.direccion, p.barrio, ciudad].filter(Boolean).join(' · ');
    const precio = Number(p.precio || 0).toLocaleString('es-CO');
    const tieneCoordenadas = Number.isFinite(p.latitud) && Number.isFinite(p.longitud);

    document.title = `${p.titulo} | Belar Inmobiliaria`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', `${p.titulo}${ubicacion ? ' en ' + ubicacion : ''}. ${(p.descripcion || '').slice(0, 120)}`);

    const miniaturas = imagenes.length > 1 ? `
      <div class="thumbs" role="group" aria-label="Más imágenes">
        ${imagenes.map((src, i) => `
          <button type="button" data-src="${esc(src)}" aria-label="Ver imagen ${i + 1}" aria-current="${i === 0}">
            <img src="${esc(src)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='/img/default.svg'">
          </button>`).join('')}
      </div>` : '';

    const specs = [
      ['bed', p.habitaciones, 'Habitaciones'],
      ['bathtub', p.wc, 'Baños'],
      ['car', p.estacionamiento, 'Parqueaderos'],
      p.metrosCuadrados ? ['ruler', `${p.metrosCuadrados} m²`, 'Área'] : null,
    ].filter(Boolean).map(([icono, valor, etiqueta]) => `
      <div class="spec"><i class="ph ph-${icono}" aria-hidden="true"></i><div><strong>${esc(valor)}</strong><span>${etiqueta}</span></div></div>`).join('');

    const mapa = tieneCoordenadas ? `
      <section class="panel panel--flush" aria-labelledby="mapa-titulo">
        <h2 id="mapa-titulo">Ubicación</h2>
        ${direccionCompleta ? `<p class="where"><i class="ph ph-map-pin" aria-hidden="true"></i>${esc(direccionCompleta)}</p>` : ''}
        <div class="map" id="mapaPropiedad" role="img" aria-label="Mapa con la ubicación de la propiedad"></div>
      </section>` : '';

    // WhatsApp con el mensaje ya escrito (el número se cambia en js/site-config.js)
    const numeroWa = (window.BELAR && window.BELAR.whatsapp) || '';
    const mensajeWa = `Hola, me interesa la propiedad "${p.titulo}"${ubicacion ? ' en ' + ubicacion : ''}. ${window.location.href}`;
    const urlWhatsApp = `https://wa.me/${numeroWa}?text=${encodeURIComponent(mensajeWa)}`;

    const calculadora = `
      <section class="panel" data-reveal aria-labelledby="calc-titulo">
        <h2 id="calc-titulo">Calculadora de cuota</h2>
        <p class="body-6">Simula la cuota mensual de un crédito para esta propiedad. Los valores son de ejemplo y puedes ajustarlos.</p>
        <div class="calc">
          <div class="field">
            <label for="calcInicial">Cuota inicial <output id="calcInicialOut" for="calcInicial">30 %</output></label>
            <input type="range" id="calcInicial" min="10" max="70" step="5" value="30">
          </div>
          <div class="field">
            <label for="calcPlazo">Plazo <output id="calcPlazoOut" for="calcPlazo">15 años</output></label>
            <input type="range" id="calcPlazo" min="5" max="30" step="1" value="15">
          </div>
          <div class="field">
            <label for="calcTasa">Tasa efectiva anual (%)</label>
            <input type="number" id="calcTasa" class="control" min="1" max="40" step="0.1" value="12" inputmode="decimal">
          </div>
        </div>
        <dl class="calc-result" aria-live="polite">
          <div class="calc-main"><dt>Cuota mensual estimada</dt><dd id="calcCuota">—</dd></div>
          <div><dt>Cuota inicial</dt><dd id="calcEntrada">—</dd></div>
          <div><dt>Valor a financiar</dt><dd id="calcMonto">—</dd></div>
          <div><dt>Intereses totales</dt><dd id="calcIntereses">—</dd></div>
        </dl>
        <p class="body-6 faint">Estimación informativa: no constituye una oferta de crédito. Consulta las condiciones reales con tu entidad financiera.</p>
      </section>`;

    contenido.innerHTML = `
      <div class="page-hero"><div class="container">${crumbs(p.titulo)}</div></div>

      <section class="section--tight" aria-labelledby="desc-titulo">
        <div class="container detail">

          <div class="detail-main">
            <div class="gallery-main" data-reveal>
              <img id="imgPrincipal" src="${esc(imagenes[0])}" alt="${esc(p.titulo)}" onerror="this.onerror=null;this.src='/img/default.svg'">
              <button type="button" class="fav fav--lg" data-fav="${esc(p.id)}" aria-pressed="false" aria-label="Guardar en favoritos"><i class="ph ph-heart" aria-hidden="true"></i></button>
            </div>
            ${miniaturas}

            <section class="panel" data-reveal>
              <h2 id="desc-titulo">Descripción</h2>
              <p class="body-3">${esc(p.descripcion || 'Esta propiedad aún no tiene una descripción.')}</p>
            </section>

            ${calculadora}

            ${mapa}
          </div>

          <aside class="info-card" data-reveal style="--d:120">
            ${ciudad ? `<span class="eyebrow">${esc(ciudad)}</span>` : ''}
            <h1>${esc(p.titulo)}</h1>
            ${ubicacion ? `<p class="where"><i class="ph ph-map-pin" aria-hidden="true"></i>${esc(ubicacion)}</p>` : ''}
            <p class="price">$${precio}</p>
            <div class="spec-grid">${specs}</div>
            <div class="actions">
              <a href="/contacto.html?propiedad=${encodeURIComponent(p.id)}" class="btn btn-gold btn-lg">
                <i class="ph ph-paper-plane-tilt" aria-hidden="true"></i> Contactar asesor
              </a>
              <a href="${esc(urlWhatsApp)}" class="btn btn-ghost btn-wa" target="_blank" rel="noopener"><i class="ph ph-whatsapp-logo" aria-hidden="true"></i> Escribir por WhatsApp</a>
              <div class="actions-row">
                ${tieneCoordenadas ? `<button type="button" class="btn btn-ghost" id="verMapa"><i class="ph ph-map-trifold" aria-hidden="true"></i> Mapa</button>` : ''}
                <button type="button" class="btn btn-ghost" id="compartir"><i class="ph ph-share-network" aria-hidden="true"></i> Compartir</button>
              </div>
            </div>
          </aside>

        </div>
      </section>

      <section class="section--tight" style="padding-bottom:var(--s-900)" id="similares" hidden aria-labelledby="similares-titulo">
        <div class="container">
          <div class="section-head" style="margin-bottom:var(--s-400)"><h2 class="heading-4" id="similares-titulo">También te pueden interesar</h2></div>
          <div class="grid-props" id="similares-grid"></div>
        </div>
      </section>`;

    window.Premium?.reveal(contenido);
    window.Belar?.repintar(contenido);

    // Compartir: menú nativo si existe, si no copia el enlace
    document.getElementById('compartir')?.addEventListener('click', async () => {
      const datos = { title: p.titulo, text: `Mira esta propiedad en Belar Inmobiliaria: ${p.titulo}`, url: window.location.href };
      try {
        if (navigator.share) { await navigator.share(datos); return; }
        await navigator.clipboard.writeText(window.location.href);
        window.Belar?.toast('Enlace copiado');
      } catch (e) { if (e && e.name !== 'AbortError') window.Belar?.toast('No se pudo compartir. Copia el enlace de la barra.'); }
    });

    iniciarCalculadora(p.precio);
    cargarSimilares(p);

    // Galería: cambiar imagen principal
    const principal = document.getElementById('imgPrincipal');
    contenido.querySelectorAll('.thumbs button').forEach(btn => {
      btn.addEventListener('click', () => {
        principal.src = btn.dataset.src;
        contenido.querySelectorAll('.thumbs button').forEach(b => b.setAttribute('aria-current', String(b === btn)));
      });
    });

    // Mapa
    if (tieneCoordenadas) {
      document.getElementById('verMapa')?.addEventListener('click', () => {
        window.Premium?.scrollTo(document.getElementById('mapaPropiedad'));
      });
      iniciarMapa(p, ubicacion, precio);
    }

  } catch (err) {
    console.error('Error cargando propiedad:', err);
    contenido.innerHTML = vistaError('Propiedad no encontrada', 'No pudimos cargar esta propiedad. Puede que ya no esté publicada.');
  }
});

function iniciarMapa(p, ubicacion, precio) {
  const montar = () => {
    const el = document.getElementById('mapaPropiedad');
    if (!el || !window.L || !window.L.map) return;

    const mapa = L.map(el, { scrollWheelZoom: false }).setView([p.latitud, p.longitud], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(mapa);

    const icono = L.divIcon({
      html: '<div class="pin"><i class="ph ph-house" aria-hidden="true"></i></div>',
      iconSize: [40, 40], iconAnchor: [20, 20], className: ''
    });

    L.marker([p.latitud, p.longitud], { icon: icono })
      .addTo(mapa)
      .bindPopup(`
        <strong>${esc(p.titulo)}</strong><br>
        ${ubicacion ? `<span>${esc(ubicacion)}</span><br>` : ''}
        <span style="color:var(--gold);font-weight:600">$${precio}</span>`, { maxWidth: 240 });
  };

  if (window.L && window.L.map) { montar(); return; }
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.onload = montar;
  document.head.appendChild(script);
}

/* ─── Calculadora de cuota (sistema francés, cuota fija) ─────────────────── */
function iniciarCalculadora(precio) {
  const el = (id) => document.getElementById(id);
  const inicial = el('calcInicial'), plazo = el('calcPlazo'), tasa = el('calcTasa');
  if (!inicial || !plazo || !tasa) return;
  const cop = (n) => '$' + Math.round(n).toLocaleString('es-CO');

  const calcular = () => {
    const pct = Number(inicial.value) / 100;
    const anios = Number(plazo.value);
    const ea = Math.min(Math.max(Number(tasa.value) || 0, 0), 60) / 100;
    const entrada = precio * pct;
    const monto = precio - entrada;
    const n = anios * 12;
    const r = Math.pow(1 + ea, 1 / 12) - 1;               // tasa mensual equivalente a la efectiva anual
    const cuota = r === 0 ? monto / n : (monto * r) / (1 - Math.pow(1 + r, -n));
    el('calcInicialOut').textContent = `${Math.round(pct * 100)} %`;
    el('calcPlazoOut').textContent = `${anios} años`;
    el('calcCuota').textContent = cop(cuota);
    el('calcEntrada').textContent = cop(entrada);
    el('calcMonto').textContent = cop(monto);
    el('calcIntereses').textContent = cop(cuota * n - monto);
  };
  [inicial, plazo, tasa].forEach(c => c.addEventListener('input', calcular));
  calcular();
}

/* ─── Propiedades similares: misma ciudad y rango de precio parecido ───────── */
async function cargarSimilares(p) {
  try {
    const res = await fetch('/api/propiedades/visibles');
    if (!res.ok) return;
    const todas = (await res.json()).filter(x => x.id !== p.id);
    const puntaje = (x) => {
      const dPrecio = Math.abs(x.precio - p.precio) / Math.max(p.precio, 1);
      return (x.ciudad === p.ciudad ? 0 : 1) + dPrecio;      // menor es mejor
    };
    const similares = todas.sort((a, b) => puntaje(a) - puntaje(b)).slice(0, 3);
    if (!similares.length || typeof renderizarPropiedades !== 'function') return;
    renderizarPropiedades(similares, document.getElementById('similares-grid'));
    document.getElementById('similares').hidden = false;
  } catch { /* sin similares no pasa nada */ }
}
