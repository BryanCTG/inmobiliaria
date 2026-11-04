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

    contenido.innerHTML = `
      <div class="page-hero"><div class="container">${crumbs(p.titulo)}</div></div>

      <section class="section--tight" style="padding-bottom:var(--s-900)">
        <div class="container detail">

          <div class="detail-main">
            <div class="gallery-main" data-reveal>
              <img id="imgPrincipal" src="${esc(imagenes[0])}" alt="${esc(p.titulo)}" onerror="this.onerror=null;this.src='/img/default.svg'">
            </div>
            ${miniaturas}

            <section class="panel" data-reveal aria-labelledby="desc-titulo">
              <h2 id="desc-titulo">Descripción</h2>
              <p class="body-3">${esc(p.descripcion || 'Esta propiedad aún no tiene una descripción.')}</p>
            </section>

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
              ${tieneCoordenadas ? `<button type="button" class="btn btn-ghost" id="verMapa"><i class="ph ph-map-trifold" aria-hidden="true"></i> Ver en el mapa</button>` : ''}
              <a href="/anuncio.html" class="btn btn-ghost"><i class="ph ph-arrow-left" aria-hidden="true"></i> Ver más propiedades</a>
            </div>
          </aside>

        </div>
      </section>`;

    window.Premium?.reveal(contenido);

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
