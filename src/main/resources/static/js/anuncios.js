document.addEventListener('DOMContentLoaded', async () => {
  const contenedor = document.getElementById('lista-anuncios');
  if (!contenedor) return;

  const paginacionContainer = document.getElementById('paginacion');

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

    // Detectar si estamos en index (homepage)
    const esIndex = window.location.pathname === '/' ||
                    window.location.pathname.endsWith('index.html') ||
                    window.location.pathname === '';

    if (esIndex) {
      renderizarPropiedades(propiedades.slice(0, 3), contenedor);
      return;
    }

    // Paginación para anuncio.html
    let paginaActual = 1;
    const porPagina = 6;
    const totalPaginas = Math.ceil(propiedades.length / porPagina);

    const textoResultados = document.getElementById('resultados-texto');

    function mostrarPagina(pagina) {
      paginaActual = pagina;
      const inicio = (pagina - 1) * porPagina;
      const fin    = inicio + porPagina;
      const slice  = propiedades.slice(inicio, fin);

      renderizarPropiedades(slice, contenedor);

      if (textoResultados) {
        textoResultados.textContent =
          `Mostrando ${inicio + 1}–${Math.min(fin, propiedades.length)} de ${propiedades.length} propiedades`;
      }
      renderizarPaginacion();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function renderizarPaginacion() {
      if (!paginacionContainer || totalPaginas <= 1) return;
      paginacionContainer.innerHTML = '';

      // Prev
      if (paginaActual > 1) {
        const btn = document.createElement('button');
        btn.innerHTML = '<span class="material-symbols-rounded" style="font-size:2rem;">chevron_left</span>';
        btn.title = 'Anterior';
        btn.onclick = () => mostrarPagina(paginaActual - 1);
        paginacionContainer.appendChild(btn);
      }

      // Pages
      for (let i = 1; i <= totalPaginas; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.classList.toggle('active', i === paginaActual);
        btn.onclick = () => mostrarPagina(i);
        paginacionContainer.appendChild(btn);
      }

      // Next
      if (paginaActual < totalPaginas) {
        const btn = document.createElement('button');
        btn.innerHTML = '<span class="material-symbols-rounded" style="font-size:2rem;">chevron_right</span>';
        btn.title = 'Siguiente';
        btn.onclick = () => mostrarPagina(paginaActual + 1);
        paginacionContainer.appendChild(btn);
      }
    }

    mostrarPagina(1);

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

// ─── RENDER FUNCTION ───────────────────────────────────────────────────────────

function renderizarPropiedades(lista, contenedor) {
  contenedor.innerHTML = lista.map(p => {
    const imagenUrl = p.imagenId
      ? `http://localhost:8080/api/imagenes/${p.imagenId}`
      : '/img/default.jpg';

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
          </div>
          <a href="/propiedad.html?id=${p.id}" class="btn btn-fill" style="width:100%;justify-content:center;">
            <span class="material-symbols-rounded">visibility</span>
            Ver propiedad
          </a>
        </div>
      </div>
    `;
  }).join('');
}
