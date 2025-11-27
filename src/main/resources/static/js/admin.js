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
      const div = document.createElement('div');
      div.classList.add('anuncio');

      // ✅ Mostrar imagen desde MongoDB GridFS
      const imagenUrl = p.imagenId
        ? `http://localhost:8080/api/imagenes/${p.imagenId}`
        : '/img/default.jpg';

      div.innerHTML = `
        <picture>
          <img src="${imagenUrl}" alt="${p.titulo}" style="max-width:100%; border-radius:10px;">
        </picture>
        <div class="contenido-anuncio">
          <h3>${p.titulo}</h3>
          <p>${p.descripcion || ''}</p>
          <p class="precio">$${p.precio.toLocaleString('es-CO')}</p>

          <ul class="iconos-caracteristicas">
            <li><img src="/img/icono_wc.svg" alt="wc"> <p>${p.wc}</p></li>
            <li><img src="/img/icono_estacionamiento.svg" alt="estacionamiento"> <p>${p.estacionamiento}</p></li>
            <li><img src="/img/icono_dormitorio.svg" alt="habitaciones"> <p>${p.habitaciones}</p></li>
          </ul>

          <div class="acciones">
            <a href="/Admin/actualizar.html?id=${p.id}" class="boton-amarillo-block">Editar</a>
            <button onclick="toggleVisibilidad('${p.id}')" 
              class="boton-gris-block">${p.visible ? 'Ocultar' : 'Mostrar'}</button>
            <button onclick="eliminarPropiedad('${p.id}')" 
              class="boton-rojo-block">Eliminar</button>
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

// ✅ Eliminar propiedad
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

// ✅ Cambiar visibilidad (mostrar / ocultar)
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
