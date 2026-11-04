// ─── Estado global ────────────────────────────────────────────────────────────
let _todasPropiedades = [];
let _listaFiltrada    = [];
let _paginaActual     = 1;
let _vista            = 'lista';   // 'lista' | 'mapa'
let _mapa             = null;
let _capaMarcadores   = null;
const POR_PAGINA      = 6;

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const contenedor = document.getElementById('lista-anuncios');
  if (!contenedor) return;

  const pagina = document.body.dataset.page || '';
  const esIndex = pagina === 'home' || window.location.pathname === '/' || window.location.pathname.endsWith('index.html');

  try {
    const res = await fetch('/api/propiedades/visibles');
    if (!res.ok) throw new Error('Error al cargar propiedades');
    const propiedades = await res.json();

    // Favoritos: solo las propiedades guardadas por la persona, en el orden en que las guardó
    if (pagina === 'favoritos') {
      const pintarFavoritos = () => {
        const ids = window.Belar?.favs.lista() || [];
        const lista = ids.map(id => propiedades.find(p => p.id === id)).filter(Boolean);
        if (lista.length === 0) {
          contenedor.innerHTML = _estado('heart', 'Aún no tienes favoritos',
            'Toca el corazón de una propiedad para guardarla aquí y compararla con calma.');
          return;
        }
        renderizarPropiedades(lista, contenedor);
        const texto = document.getElementById('resultados-texto');
        if (texto) texto.textContent = `${lista.length} propiedad${lista.length !== 1 ? 'es guardadas' : ' guardada'}`;
      };
      pintarFavoritos();
      document.addEventListener('favoritos:cambio', pintarFavoritos);
      return;
    }

    if (propiedades.length === 0) {
      contenedor.innerHTML = _estado('house', 'Aún no hay propiedades publicadas',
        'Estamos preparando nuevas residencias. Vuelve pronto o escríbenos y te avisamos.');
      return;
    }

    // Más reciente primero
    propiedades.reverse();

    if (esIndex) {
      renderizarPropiedades(propiedades.slice(0, 3), contenedor);
      return;
    }

    // Página de catálogo: activar filtros
    _todasPropiedades = propiedades;
    _listaFiltrada    = [...propiedades];
    _vincularFiltros();
    if (_precargarFiltrosDesdeUrl()) {
      _aplicarFiltros();
    } else {
      _mostrarPagina(1, false);
    }
    if (new URLSearchParams(window.location.search).get('vista') === 'mapa') _cambiarVista('mapa');

  } catch (err) {
    console.error('Error cargando anuncios:', err);
    contenedor.innerHTML = _estado('warning-circle', 'No pudimos cargar las propiedades',
      'Revisa tu conexión e intenta de nuevo en unos segundos.');
  }
});

// ─── Estado vacío / error ─────────────────────────────────────────────────────
function _estado(icono, titulo, texto) {
  return `
    <div class="state-box">
      <i class="ph ph-${icono}" aria-hidden="true"></i>
      <h3 class="heading-6">${esc(titulo)}</h3>
      <p class="body-6">${esc(texto)}</p>
      <a href="/anuncio.html" class="btn btn-gold btn-sm" style="margin-top:var(--s-100)">Explorar propiedades</a>
    </div>`;
}

// ─── Vincular eventos ─────────────────────────────────────────────────────────
function _vincularFiltros() {
  const btnFiltrar = document.getElementById('btnFiltrar');
  const btnLimpiar = document.getElementById('btnLimpiar');
  if (!btnFiltrar) return;

  btnFiltrar.addEventListener('click', _aplicarFiltros);
  btnLimpiar.addEventListener('click', _limpiarFiltros);

  document.getElementById('fBusqueda')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); _aplicarFiltros(); }
  });

  ['fCiudad', 'fHabitaciones', 'fBanos', 'fPrecio', 'fOrden'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', _aplicarFiltros);
  });

  document.getElementById('vistaLista')?.addEventListener('click', () => _cambiarVista('lista'));
  document.getElementById('vistaMapa')?.addEventListener('click', () => _cambiarVista('mapa'));
}

// ─── Precargar filtros desde la URL (ej: /anuncio.html?ciudad=Cartagena&habitaciones=3) ──
function _precargarFiltrosDesdeUrl() {
  const params = new URLSearchParams(window.location.search);
  const mapa = { ciudad: 'fCiudad', habitaciones: 'fHabitaciones', precio: 'fPrecio', q: 'fBusqueda', orden: 'fOrden' };
  let hayFiltros = false;

  Object.entries(mapa).forEach(([param, idCampo]) => {
    const valor = params.get(param);
    const campo = document.getElementById(idCampo);
    if (!valor || !campo) return;
    campo.value = valor;
    // Si el valor no existe entre las opciones del select, el campo queda vacío y se ignora
    if (campo.value === valor) hayFiltros = true;
  });
  return hayFiltros;
}

// ─── Aplicar filtros y orden ──────────────────────────────────────────────────
function _aplicarFiltros() {
  const busqueda     = document.getElementById('fBusqueda')?.value.trim().toLowerCase() || '';
  const ciudad       = document.getElementById('fCiudad')?.value       || '';
  const habitaciones = parseInt(document.getElementById('fHabitaciones')?.value) || 0;
  const banos        = parseInt(document.getElementById('fBanos')?.value)         || 0;
  const precioMax    = parseInt(document.getElementById('fPrecio')?.value)        || 0;
  const orden        = document.getElementById('fOrden')?.value || '';

  _listaFiltrada = _todasPropiedades.filter(p => {
    if (busqueda && !(
      p.titulo?.toLowerCase().includes(busqueda) ||
      p.descripcion?.toLowerCase().includes(busqueda) ||
      p.barrio?.toLowerCase().includes(busqueda)
    )) return false;
    if (ciudad       && p.ciudad       !== ciudad)       return false;
    if (habitaciones && p.habitaciones  < habitaciones)  return false;
    if (banos        && p.wc            < banos)         return false;
    if (precioMax    && p.precio        > precioMax)     return false;
    return true;
  });

  const criterios = {
    'precio-asc':  (a, b) => a.precio - b.precio,
    'precio-desc': (a, b) => b.precio - a.precio,
    'area-desc':   (a, b) => (b.metrosCuadrados || 0) - (a.metrosCuadrados || 0),
  };
  if (criterios[orden]) _listaFiltrada.sort(criterios[orden]);

  _renderizarChips({ busqueda, ciudad, habitaciones, banos, precioMax });
  _mostrarPagina(1, false);
}

// ─── Limpiar filtros ──────────────────────────────────────────────────────────
function _limpiarFiltros() {
  ['fBusqueda', 'fCiudad', 'fHabitaciones', 'fBanos', 'fPrecio', 'fOrden'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  _listaFiltrada = [..._todasPropiedades];
  _renderizarChips({});
  _mostrarPagina(1, false);
}

// ─── Chips activos ────────────────────────────────────────────────────────────
function _renderizarChips({ busqueda, ciudad, habitaciones, banos, precioMax } = {}) {
  const wrapper = document.getElementById('chipsActivos');
  if (!wrapper) return;
  wrapper.innerHTML = '';

  const agregar = (label, clearFn) => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.innerHTML = `${esc(label)}<button type="button" aria-label="Quitar filtro ${esc(label)}"><i class="ph ph-x" aria-hidden="true"></i></button>`;
    chip.querySelector('button').addEventListener('click', clearFn);
    wrapper.appendChild(chip);
  };

  if (busqueda) agregar(`“${busqueda}”`, () => {
    document.getElementById('fBusqueda').value = '';
    _aplicarFiltros();
  });
  if (ciudad) agregar(ciudadLegible(ciudad), () => {
    document.getElementById('fCiudad').value = '';
    _aplicarFiltros();
  });
  if (habitaciones) agregar(`${habitaciones} o más habitaciones`, () => {
    document.getElementById('fHabitaciones').value = '';
    _aplicarFiltros();
  });
  if (banos) agregar(`${banos} o más baños`, () => {
    document.getElementById('fBanos').value = '';
    _aplicarFiltros();
  });
  if (precioMax) {
    agregar(`Hasta $${(precioMax / 1_000_000).toLocaleString('es-CO')} millones`, () => {
      document.getElementById('fPrecio').value = '';
      _aplicarFiltros();
    });
  }
}

// ─── Vista lista / mapa ───────────────────────────────────────────────────────
function _cambiarVista(vista) {
  _vista = vista;
  const lista = document.getElementById('lista-anuncios');
  const pager = document.getElementById('paginacion');
  const mapaEl = document.getElementById('mapaCatalogo');
  document.getElementById('vistaLista')?.setAttribute('aria-pressed', String(vista === 'lista'));
  document.getElementById('vistaMapa')?.setAttribute('aria-pressed', String(vista === 'mapa'));
  if (lista) lista.hidden = vista === 'mapa';
  if (pager) pager.hidden = vista === 'mapa';
  if (mapaEl) mapaEl.hidden = vista !== 'mapa';
  if (vista === 'mapa') _renderizarMapa();
  _actualizarTexto();
}

function _renderizarMapa() {
  const el = document.getElementById('mapaCatalogo');
  if (!el) return;

  const montar = () => {
    if (!window.L || !window.L.map) return;
    if (!_mapa) {
      _mapa = L.map(el, { scrollWheelZoom: false }).setView([6.5, -74.5], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19
      }).addTo(_mapa);
      _capaMarcadores = L.layerGroup().addTo(_mapa);
    }
    _capaMarcadores.clearLayers();
    const puntos = [];
    _listaFiltrada.forEach(p => {
      if (!Number.isFinite(p.latitud) || !Number.isFinite(p.longitud)) return;
      const icono = L.divIcon({
        html: '<div class="pin"><i class="ph ph-house" aria-hidden="true"></i></div>',
        iconSize: [40, 40], iconAnchor: [20, 20], className: ''
      });
      const foto = (p.imagenes && p.imagenes[0]) || '/img/default.svg';
      L.marker([p.latitud, p.longitud], { icon: icono, title: p.titulo }).addTo(_capaMarcadores).bindPopup(`
        <a href="/propiedad.html?id=${esc(p.id)}" class="pop">
          <img src="${esc(foto)}" alt="" onerror="this.onerror=null;this.src='/img/default.svg'">
          <strong>${esc(p.titulo)}</strong>
          <span class="gold">$${Number(p.precio).toLocaleString('es-CO')}</span>
        </a>`, { maxWidth: 240 });
      puntos.push([p.latitud, p.longitud]);
    });
    setTimeout(() => {
      _mapa.invalidateSize();
      if (puntos.length) _mapa.fitBounds(puntos, { padding: [48, 48], maxZoom: 15 });
    }, 50);
  };

  if (window.L && window.L.map) { montar(); return; }
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.onload = montar;
  document.head.appendChild(script);
}

function _actualizarTexto() {
  const textoEl = document.getElementById('resultados-texto');
  if (!textoEl) return;
  const total = _listaFiltrada.length;
  if (total === 0) { textoEl.textContent = 'No encontramos propiedades con esos filtros.'; return; }
  if (_vista === 'mapa') {
    const conPunto = _listaFiltrada.filter(p => Number.isFinite(p.latitud) && Number.isFinite(p.longitud)).length;
    textoEl.textContent = `${conPunto} de ${total} propiedad${total !== 1 ? 'es' : ''} con ubicación en el mapa`;
    return;
  }
  const inicio = (_paginaActual - 1) * POR_PAGINA;
  const fin = Math.min(inicio + POR_PAGINA, total);
  textoEl.textContent = `Mostrando ${inicio + 1} a ${fin} de ${total} propiedad${total !== 1 ? 'es' : ''}`;
}

// ─── Paginación ───────────────────────────────────────────────────────────────
function _mostrarPagina(pagina, desplazar = true) {
  _paginaActual = pagina;
  const total        = _listaFiltrada.length;
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  if (_paginaActual > totalPaginas) _paginaActual = totalPaginas;

  const inicio = (_paginaActual - 1) * POR_PAGINA;
  const fin    = Math.min(inicio + POR_PAGINA, total);

  renderizarPropiedades(_listaFiltrada.slice(inicio, fin), document.getElementById('lista-anuncios'));
  _actualizarTexto();
  _renderizarPaginacion(totalPaginas);
  if (_vista === 'mapa') _renderizarMapa();

  if (desplazar) {
    const destino = document.getElementById('resultados');
    if (destino && window.Premium) window.Premium.scrollTo(destino);
  }
}

function _renderizarPaginacion(totalPaginas) {
  const pag = document.getElementById('paginacion');
  if (!pag) return;
  pag.innerHTML = '';
  if (totalPaginas <= 1) return;

  const boton = (html, etiqueta, destino, activo = false) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerHTML = html;
    btn.setAttribute('aria-label', etiqueta);
    if (activo) btn.setAttribute('aria-current', 'page');
    btn.addEventListener('click', () => _mostrarPagina(destino));
    pag.appendChild(btn);
  };

  if (_paginaActual > 1) boton('<i class="ph ph-caret-left" aria-hidden="true"></i>', 'Página anterior', _paginaActual - 1);
  for (let i = 1; i <= totalPaginas; i++) boton(String(i), `Página ${i}`, i, i === _paginaActual);
  if (_paginaActual < totalPaginas) boton('<i class="ph ph-caret-right" aria-hidden="true"></i>', 'Página siguiente', _paginaActual + 1);
}

// ─── Render de tarjetas ───────────────────────────────────────────────────────
function renderizarPropiedades(lista, contenedor) {
  if (lista.length === 0) {
    contenedor.innerHTML = _estado('magnifying-glass', 'Sin resultados',
      'Prueba con otros filtros o amplía tu búsqueda para ver más propiedades.');
    return;
  }

  contenedor.innerHTML = lista.map(p => {
    const imagenUrl = (p.imagenes && p.imagenes.length > 0) ? p.imagenes[0] : '/img/default.svg';
    const ciudad = ciudadLegible(p.ciudad);
    const ubicacion = [p.barrio, ciudad].filter(Boolean).join(', ');
    const precio = Number(p.precio || 0).toLocaleString('es-CO');

    return `
      <article class="prop" data-reveal>
        <div class="prop-media">
          <img loading="lazy" src="${esc(imagenUrl)}" alt="${esc(p.titulo)}" onerror="this.onerror=null;this.src='/img/default.svg'">
          ${ciudad ? `<span class="prop-city">${esc(ciudad)}</span>` : ''}
          <button type="button" class="fav" data-fav="${esc(p.id)}" aria-pressed="false" aria-label="Guardar en favoritos"><i class="ph ph-heart" aria-hidden="true"></i></button>
        </div>
        <div class="prop-body">
          <h3 class="prop-title"><a href="/propiedad.html?id=${esc(p.id)}">${esc(p.titulo)}</a></h3>
          ${ubicacion ? `<p class="prop-where"><i class="ph ph-map-pin" aria-hidden="true"></i>${esc(ubicacion)}</p>` : ''}
          ${p.descripcion ? `<p class="prop-desc">${esc(p.descripcion)}</p>` : ''}
          <p class="prop-price">$${precio}</p>
          <div class="prop-meta">
            <span title="Habitaciones"><i class="ph ph-bed" aria-hidden="true"></i>${esc(p.habitaciones)}<span class="sr-only"> habitaciones</span></span>
            <span title="Baños"><i class="ph ph-bathtub" aria-hidden="true"></i>${esc(p.wc)}<span class="sr-only"> baños</span></span>
            <span title="Parqueaderos"><i class="ph ph-car" aria-hidden="true"></i>${esc(p.estacionamiento)}<span class="sr-only"> parqueaderos</span></span>
            ${p.metrosCuadrados ? `<span title="Área"><i class="ph ph-ruler" aria-hidden="true"></i>${esc(p.metrosCuadrados)} m²</span>` : ''}
          </div>
        </div>
      </article>`;
  }).join('');

  if (window.Premium) window.Premium.reveal(contenedor);
  if (window.Belar) window.Belar.repintar(contenedor);
}
