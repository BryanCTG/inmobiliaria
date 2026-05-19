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
    const res = await fetch('http://localhost:8080/api/propiedades/visibles');
    if (!res.ok) throw new Error('Error al cargar propiedades');
    const propiedades = await res.json();

    if (propiedades.length === 0) {
      contenedor.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <span class="material-symbols-rounded">home</span>
          <h3>Sin propiedades disponibles</h3>
          <p>En este momento no hay propiedades publicadas. Vuelve pronto.</p>
        </div>`;
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
    _mostrarPagina(1);

  } catch (err) {
    console.error('Error cargando anuncios:', err);
    contenedor.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <span class="material-symbols-rounded">error</span>
        <h3>Error al cargar</h3>
        <p>No se pudieron obtener las propiedades. Verifica tu conexión.</p>
      </div>`;
  }
});

// ─── Vincular eventos ─────────────────────────────────────────────────────────
function _vincularFiltros() {
  const btnFiltrar = document.getElementById('btnFiltrar');
  const btnLimpiar = document.getElementById('btnLimpiar');
  if (!btnFiltrar) return;

  btnFiltrar.addEventListener('click', _aplicarFiltros);
  btnLimpiar.addEventListener('click', _limpiarFiltros);

  document.getElementById('fBusqueda')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') _aplicarFiltros();
  });

  ['fCiudad', 'fHabitaciones', 'fBanos', 'fPrecio'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', _aplicarFiltros);
  });
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
  _mostrarPagina(1);
}

// ─── Limpiar filtros ──────────────────────────────────────────────────────────
function _limpiarFiltros() {
  ['fBusqueda', 'fCiudad', 'fHabitaciones', 'fBanos', 'fPrecio'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  _listaFiltrada = [..._todasPropiedades];
  _renderizarChips({});
  _mostrarPagina(1);
}

// ─── Chips activos ────────────────────────────────────────────────────────────
function _renderizarChips({ busqueda, ciudad, habitaciones, banos, precioMax } = {}) {
  const wrapper = document.getElementById('chipsActivos');
  if (!wrapper) return;
  wrapper.innerHTML = '';

  const agregar = (label, clearFn) => {
    const chip = document.createElement('span');
    chip.className = 'chip-filtro';
    chip.innerHTML = `${label}<button title="Quitar filtro"><span class="material-symbols-rounded">close</span></button>`;
    chip.querySelector('button').addEventListener('click', clearFn);
    wrapper.appendChild(chip);
  };

  if (busqueda) agregar(`"${busqueda}"`, () => {
    document.getElementById('fBusqueda').value = '';
    _aplicarFiltros();
  });
  if (ciudad) agregar(ciudad, () => {
    document.getElementById('fCiudad').value = '';
    _aplicarFiltros();
  });
  if (habitaciones) agregar(`${habitaciones}+ hab.`, () => {
    document.getElementById('fHabitaciones').value = '';
    _aplicarFiltros();
  });
  if (banos) agregar(`${banos}+ baños`, () => {
    document.getElementById('fBanos').value = '';
    _aplicarFiltros();
  });
  if (precioMax) {
    const label = `Hasta $${(precioMax / 1_000_000).toLocaleString('es-CO')}M`;
    agregar(label, () => {
      document.getElementById('fPrecio').value = '';
      _aplicarFiltros();
    });
  }
}

// ─── Paginación ───────────────────────────────────────────────────────────────
function _mostrarPagina(pagina) {
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
      ? 'No se encontraron propiedades con esos filtros.'
      : `Mostrando ${inicio + 1}–${fin} de ${total} propiedad${total !== 1 ? 'es' : ''}`;
  }

  _renderizarPaginacion(totalPaginas);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function _renderizarPaginacion(totalPaginas) {
  const pag = document.getElementById('paginacion');
  if (!pag) return;
  pag.innerHTML = '';
  if (totalPaginas <= 1) return;

  if (_paginaActual > 1) {
    const btn = document.createElement('button');
    btn.innerHTML = '<span class="material-symbols-rounded" style="font-size:2rem;">chevron_left</span>';
    btn.onclick = () => _mostrarPagina(_paginaActual - 1);
    pag.appendChild(btn);
  }
  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.classList.toggle('active', i === _paginaActual);
    btn.onclick = () => _mostrarPagina(i);
    pag.appendChild(btn);
  }
  if (_paginaActual < totalPaginas) {
    const btn = document.createElement('button');
    btn.innerHTML = '<span class="material-symbols-rounded" style="font-size:2rem;">chevron_right</span>';
    btn.onclick = () => _mostrarPagina(_paginaActual + 1);
    pag.appendChild(btn);
  }
}

// ─── Render de cards ──────────────────────────────────────────────────────────
function renderizarPropiedades(lista, contenedor) {
  if (lista.length === 0) {
    contenedor.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <span class="material-symbols-rounded">search_off</span>
        <h3>Sin resultados</h3>
        <p>Intenta con otros filtros o amplía tu búsqueda.</p>
      </div>`;
    return;
  }

  contenedor.innerHTML = lista.map(p => {
    const imagenUrl = (p.imagenes && p.imagenes.length > 0) ? p.imagenes[0] : '/img/default.jpg';
    return `
      <div class="property-card">
        <div class="card-banner">
          <div class="img-holder" style="--width:4;--height:3;">
            <img loading="lazy" src="${imagenUrl}" alt="${p.titulo}" class="img-cover" onerror="this.src='/img/default.jpg'">
          </div>
          <span class="tag card-tag">En Venta</span>
        </div>
        <div class="card-body">
          <h3 class="card-title title-small">
            <a href="/propiedad.html?id=${p.id}">${p.titulo}</a>
          </h3>
          ${p.ciudad ? `
          <div style="display:flex;align-items:center;gap:4px;color:var(--neutral-60);font-size:var(--fs-label-medium);margin-bottom:8px;">
            <span class="material-symbols-rounded" style="font-size:1.6rem;color:var(--primary-100);">location_on</span>
            ${[p.barrio, p.ciudad].filter(Boolean).join(', ')}
          </div>` : ''}
          <p class="card-desc">${p.descripcion || ''}</p>
          <p class="card-price">$${p.precio.toLocaleString('es-CO')}</p>
          <div class="card-features">
            <div class="card-feature-item">
              <span class="material-symbols-rounded">bed</span>
              <span>${p.habitaciones} hab.</span>
            </div>
            <div class="card-feature-item">
              <span class="material-symbols-rounded">bathroom</span>
              <span>${p.wc} baños</span>
            </div>
            <div class="card-feature-item">
              <span class="material-symbols-rounded">directions_car</span>
              <span>${p.estacionamiento} parq.</span>
            </div>
            ${p.metrosCuadrados ? `
            <div class="card-feature-item">
              <span class="material-symbols-rounded">square_foot</span>
              <span>${p.metrosCuadrados} m²</span>
            </div>` : ''}
          </div>
          <a href="/propiedad.html?id=${p.id}" class="btn btn-fill" style="width:100%;justify-content:center;">
            <span class="material-symbols-rounded">visibility</span>
            Ver propiedad
          </a>
        </div>
      </div>`;
  }).join('');
}