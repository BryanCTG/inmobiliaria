// ─── Estado global ────────────────────────────────────────────────────────────
let _todasPropiedades = [];
let _listaFiltrada    = [];
let _paginaActual     = 1;
const POR_PAGINA      = 6;

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const contenedor = document.getElementById('lista-anuncios');
  if (!contenedor) return;

  const esIndex = window.location.pathname === '/' ||
                  window.location.pathname.endsWith('index.html') ||
                  window.location.pathname === '';

  try {
    const res = await fetch('/api/propiedades/visibles');
    if (!res.ok) throw new Error('Error al cargar propiedades');
    const propiedades = await res.json();

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

  ['fCiudad', 'fHabitaciones', 'fBanos', 'fPrecio'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', _aplicarFiltros);
  });
}

// ─── Precargar filtros desde la URL (ej: /anuncio.html?ciudad=Cartagena&habitaciones=3) ──
function _precargarFiltrosDesdeUrl() {
  const params = new URLSearchParams(window.location.search);
  const mapa = { ciudad: 'fCiudad', habitaciones: 'fHabitaciones', precio: 'fPrecio', q: 'fBusqueda' };
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

// ─── Aplicar filtros ──────────────────────────────────────────────────────────
function _aplicarFiltros() {
  const busqueda     = document.getElementById('fBusqueda')?.value.trim().toLowerCase() || '';
  const ciudad       = document.getElementById('fCiudad')?.value       || '';
  const habitaciones = parseInt(document.getElementById('fHabitaciones')?.value) || 0;
  const banos        = parseInt(document.getElementById('fBanos')?.value)         || 0;
  const precioMax    = parseInt(document.getElementById('fPrecio')?.value)        || 0;

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

  _renderizarChips({ busqueda, ciudad, habitaciones, banos, precioMax });
  _mostrarPagina(1, false);
}

// ─── Limpiar filtros ──────────────────────────────────────────────────────────
function _limpiarFiltros() {
  ['fBusqueda', 'fCiudad', 'fHabitaciones', 'fBanos', 'fPrecio'].forEach(id => {
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

// ─── Paginación ───────────────────────────────────────────────────────────────
function _mostrarPagina(pagina, desplazar = true) {
  _paginaActual = pagina;
  const total        = _listaFiltrada.length;
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  if (_paginaActual > totalPaginas) _paginaActual = totalPaginas;

  const inicio = (_paginaActual - 1) * POR_PAGINA;
  const fin    = Math.min(inicio + POR_PAGINA, total);

  renderizarPropiedades(_listaFiltrada.slice(inicio, fin), document.getElementById('lista-anuncios'));

  const textoEl = document.getElementById('resultados-texto');
  if (textoEl) {
    textoEl.textContent = total === 0
      ? 'No encontramos propiedades con esos filtros.'
      : `Mostrando ${inicio + 1} a ${fin} de ${total} propiedad${total !== 1 ? 'es' : ''}`;
  }

  _renderizarPaginacion(totalPaginas);

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
}
