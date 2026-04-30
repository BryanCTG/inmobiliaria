document.addEventListener('DOMContentLoaded', async () => {
  const contenido = document.getElementById('contenido-propiedad');
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    contenido.innerHTML = `
      <div class="container section">
        <div class="empty-state">
          <span class="material-symbols-rounded">error</span>
          <h3>Propiedad no encontrada</h3>
          <p>No se especificó una propiedad válida.</p>
          <a href="/anuncio.html" class="btn btn-fill" style="margin-top:16px;display:inline-flex;">Ver todas las propiedades</a>
        </div>
      </div>`;
    return;
  }

  try {
    const res = await fetch(`http://localhost:8080/api/propiedades/${id}`);
    if (!res.ok) throw new Error('Propiedad no encontrada');
    const p = await res.json();

    const imagenes = (p.imagenes && p.imagenes.length > 0) ? p.imagenes : ['/img/default.jpg'];
    const imagenPrincipal = imagenes[0];

    // Galería de miniaturas si hay más de una imagen
    const galeriaHTML = imagenes.length > 1
      ? `<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
          ${imagenes.map((src, i) => `
            <img src="${src}" alt="Imagen ${i+1}" onerror="this.src='/img/default.jpg'"
              style="width:80px;height:60px;object-fit:cover;border-radius:8px;cursor:pointer;border:2px solid ${i===0?'var(--primary-100)':'transparent'};"
              onclick="document.getElementById('imgPrincipal').src=this.src;
                       document.querySelectorAll('.thumb-gallery img').forEach(t=>t.style.borderColor='transparent');
                       this.style.borderColor='var(--primary-100)';">
          `).join('')}
         </div>`
      : '';

    // Update page title
    document.title = `${p.titulo} | Bienes Raíces`;

    contenido.innerHTML = `
      <div style="background:var(--white);padding:20px 0;border-bottom:1px solid var(--neutral-95);margin-bottom:0;">
        <div class="container">
          <div style="display:flex;align-items:center;gap:8px;font-size:var(--fs-label-medium);color:var(--neutral-60);">
            <a href="/" style="color:var(--primary-100);">Inicio</a>
            <span class="material-symbols-rounded" style="font-size:1.8rem;">chevron_right</span>
            <a href="/anuncio.html" style="color:var(--primary-100);">Propiedades</a>
            <span class="material-symbols-rounded" style="font-size:1.8rem;">chevron_right</span>
            <span>${p.titulo}</span>
          </div>
        </div>
      </div>

      <section class="section">
        <div class="container">
          <div class="property-detail-grid">

            <!-- Gallery -->
            <div>
              <div class="property-gallery">
                <img id="imgPrincipal" src="${imagenPrincipal}" alt="${p.titulo}" onerror="this.src='/img/default.jpg'">
              </div>
              <div class="thumb-gallery">${galeriaHTML}</div>
              <div class="admin-card" style="margin-top:24px;">
                <div class="admin-card-header">
                  <h2 style="font-size:var(--fs-title-medium);">Descripción</h2>
                </div>
                <div class="admin-card-body">
                  <p style="color:var(--neutral-40);font-size:var(--fs-body-large);line-height:1.8;">${p.descripcion || 'Sin descripción disponible.'}</p>
                </div>
              </div>
            </div>

            <!-- Info card -->
            <div>
              <div class="property-info-card">
                <span class="tag" style="margin-bottom:16px;">En Venta</span>
                <h1 style="font-size:var(--fs-headline-small);color:var(--neutral-10);margin-bottom:8px;line-height:1.3;">${p.titulo}</h1>
                <p style="font-size:3.2rem;font-weight:700;color:var(--primary-100);margin-bottom:24px;">$${p.precio.toLocaleString('es-CO')}</p>

                <div class="property-features-list">
                  <div class="property-feature">
                    <span class="material-symbols-rounded">bed</span>
                    <div>
                      <strong>${p.habitaciones}</strong>
                      <span>Habitaciones</span>
                    </div>
                  </div>
                  <div class="property-feature">
                    <span class="material-symbols-rounded">bathroom</span>
                    <div>
                      <strong>${p.wc}</strong>
                      <span>Baños</span>
                    </div>
                  </div>
                  <div class="property-feature">
                    <span class="material-symbols-rounded">directions_car</span>
                    <div>
                      <strong>${p.estacionamiento}</strong>
                      <span>Parqueadero(s)</span>
                    </div>
                  </div>
                  ${p.metrosCuadrados ? `
                  <div class="property-feature">
                    <span class="material-symbols-rounded">square_foot</span>
                    <div>
                      <strong>${p.metrosCuadrados} m²</strong>
                      <span>Área</span>
                    </div>
                  </div>` : ''}
                </div>

                <div style="margin-top:24px;display:flex;flex-direction:column;gap:12px;">
                  <a href="/contacto.html" class="btn btn-fill" style="width:100%;justify-content:center;">
                    <span class="material-symbols-rounded">mail</span>
                    Contactar asesor
                  </a>
                  <a href="/anuncio.html" class="btn btn-outline" style="width:100%;justify-content:center;">
                    <span class="material-symbols-rounded">arrow_back</span>
                    Ver más propiedades
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    `;

  } catch (err) {
    console.error('Error cargando propiedad:', err);
    contenido.innerHTML = `
      <div class="container section">
        <div class="empty-state">
          <span class="material-symbols-rounded">error</span>
          <h3>Propiedad no encontrada</h3>
          <p>No pudimos cargar esta propiedad. Puede que ya no esté disponible.</p>
          <a href="/anuncio.html" class="btn btn-fill" style="margin-top:16px;display:inline-flex;">Ver todas las propiedades</a>
        </div>
      </div>`;
  }
});
