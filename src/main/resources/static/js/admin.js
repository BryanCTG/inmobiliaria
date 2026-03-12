document.addEventListener('DOMContentLoaded', async () => {
  await cargarPropiedades();
});

async function cargarPropiedades() {
  try {

    const res = await fetch('http://localhost:8080/api/propiedades');
    if (!res.ok) throw new Error('Error al obtener propiedades');

    const propiedades = await res.json();
    const contenedor = document.getElementById('lista-propiedades');

    contenedor.innerHTML = '';

    if (propiedades.length === 0) {
      contenedor.innerHTML = '<p>No hay propiedades registradas.</p>';
      return;
    }

    propiedades.forEach(p => {

      console.log("Propiedad:", p); // para verificar datos en consola

      const div = document.createElement('div');
      div.classList.add('anuncio');

      // ✅ versión segura para imágenes
      let imagenUrl = '/img/default.jpg';

      if (p.imagenes) {

        if (Array.isArray(p.imagenes) && p.imagenes.length > 0) {
          imagenUrl = `http://localhost:8080/api/imagenes/${p.imagenes[0]}`;
        } 
        else {
          imagenUrl = `http://localhost:8080/api/imagenes/${p.imagenes}`;
        }

      }

      div.innerHTML = `
        <picture>
          <img 
            src="${imagenUrl}" 
            alt="${p.titulo}" 
            style="width:100%; height:200px; object-fit:cover; border-radius:10px;">
        </picture>

        <div class="contenido-anuncio">
          <h3>${p.titulo}</h3>
          <p>${p.descripcion || ''}</p>

          <p class="precio">
            $${Number(p.precio).toLocaleString('es-CO')}
          </p>

          <ul class="iconos-caracteristicas">
            <li>
              <img src="/img/icono_wc.svg" alt="wc">
              <p>${p.wc}</p>
            </li>

            <li>
              <img src="/img/icono_estacionamiento.svg" alt="estacionamiento">
              <p>${p.estacionamiento}</p>
            </li>

            <li>
              <img src="/img/icono_dormitorio.svg" alt="habitaciones">
              <p>${p.habitaciones}</p>
            </li>
          </ul>

          <div class="acciones">
            <a href="/Admin/actualizar.html?id=${p.id}" class="boton-amarillo-block">
              Editar
            </a>

            <button onclick="toggleVisibilidad('${p.id}')" 
              class="boton-gris-block">
              ${p.visible ? 'Ocultar' : 'Mostrar'}
            </button>

            <button onclick="eliminarPropiedad('${p.id}')" 
              class="boton-rojo-block">
              Eliminar
            </button>
          </div>
        </div>
      `;

      contenedor.appendChild(div);

    });

  } catch (error) {

    console.error('Error al cargar propiedades:', error);

    document.getElementById('lista-propiedades').innerHTML =
      '<p>Error al cargar propiedades.</p>';

  }
}

// 🗑 eliminar propiedad
async function eliminarPropiedad(id) {

  if (!confirm('¿Deseas eliminar esta propiedad?')) return;

  try {

    const res = await fetch(`http://localhost:8080/api/propiedades/${id}`, {
      method: 'DELETE'
    });

    if (!res.ok) throw new Error('Error al eliminar propiedad');

    alert('Propiedad eliminada correctamente');

    await cargarPropiedades();

  } catch (error) {

    console.error('Error al eliminar:', error);
    alert('No se pudo eliminar la propiedad');

  }

}

// 👁 cambiar visibilidad
async function toggleVisibilidad(id) {

  try {

    const res = await fetch(`http://localhost:8080/api/propiedades/${id}/visibilidad`, {
      method: 'PATCH'
    });

    if (!res.ok) throw new Error('Error al cambiar visibilidad');

    const propiedad = await res.json();

    alert(`Propiedad ahora está ${propiedad.visible ? 'visible' : 'oculta'}.`);

    await cargarPropiedades();

  } catch (error) {

    console.error('Error al cambiar visibilidad:', error);

  }

}