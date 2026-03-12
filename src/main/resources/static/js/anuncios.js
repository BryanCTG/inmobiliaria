document.addEventListener('DOMContentLoaded', async () => {

  const contenedor = document.getElementById('lista-anuncios');
  const paginacionContainer = document.createElement("div");

  paginacionContainer.id = "paginacion";
  paginacionContainer.style.display = "flex";
  paginacionContainer.style.gap = "10px";
  paginacionContainer.style.marginTop = "30px";
  paginacionContainer.style.justifyContent = "center";

  try {

    const res = await fetch('http://localhost:8080/api/propiedades/visibles');

    if (!res.ok) throw new Error('Error al cargar propiedades');

    const propiedades = await res.json();

    if (propiedades.length === 0) {
      contenedor.innerHTML = '<p>No hay propiedades disponibles en este momento.</p>';
      return;
    }

    // Detectar si estamos en index
    const esIndex = window.location.pathname.includes("index.html") || window.location.pathname === "/";

    // Si es index → solo mostrar 3
    if (esIndex) {

      const primerasTres = propiedades.slice(0, 3);

      renderizarPropiedades(primerasTres, contenedor);

      return;
    }

    // Si no es index → activar paginación
    let paginaActual = 1;

    const porPagina = 6;

    const totalPaginas = Math.ceil(propiedades.length / porPagina);

    function mostrarPagina(pagina) {

      paginaActual = pagina;

      const inicio = (pagina - 1) * porPagina;

      const fin = inicio + porPagina;

      const propiedadesPagina = propiedades.slice(inicio, fin);

      renderizarPropiedades(propiedadesPagina, contenedor);

      renderizarPaginacion();
    }

    function renderizarPaginacion() {

      paginacionContainer.innerHTML = "";

      // botón anterior
      if (paginaActual > 1) {

        const btnAnterior = document.createElement("button");

        btnAnterior.textContent = "Anterior";

        btnAnterior.classList.add("boton-amarillo");

        btnAnterior.onclick = () => mostrarPagina(paginaActual - 1);

        paginacionContainer.appendChild(btnAnterior);
      }

      // botones numéricos
      for (let i = 1; i <= totalPaginas; i++) {

        const btn = document.createElement("button");

        btn.textContent = i;

        btn.classList.add("boton-amarillo");

        if (i === paginaActual) {

          btn.style.background = "#333";

          btn.style.color = "#fff";
        }

        btn.onclick = () => mostrarPagina(i);

        paginacionContainer.appendChild(btn);
      }

      // botón siguiente
      if (paginaActual < totalPaginas) {

        const btnSiguiente = document.createElement("button");

        btnSiguiente.textContent = "Siguiente";

        btnSiguiente.classList.add("boton-amarillo");

        btnSiguiente.onclick = () => mostrarPagina(paginaActual + 1);

        paginacionContainer.appendChild(btnSiguiente);
      }

      contenedor.parentElement.appendChild(paginacionContainer);
    }

    mostrarPagina(1);

  } catch (error) {

    console.error('Error al cargar anuncios:', error);

    contenedor.innerHTML = '<p>Error al cargar propiedades.</p>';
  }

});


// FUNCIÓN PARA RENDERIZAR PROPIEDADES

function renderizarPropiedades(lista, contenedor) {

  contenedor.innerHTML = lista.map(p => {

    const imagen = (p.imagenes && p.imagenes.length > 0)
      ? `http://localhost:8080${p.imagenes[0]}`
      : '/img/default.jpg';

    return `
      <div class="anuncio">

        <picture>
          <img loading="lazy"
               src="${imagen}"
               alt="${p.titulo}">
        </picture>

        <div class="contenido-anuncio">

          <h3>${p.titulo}</h3>

          <p>${(p.descripcion || '').substring(0,80)}...</p>

          <p class="precio">$${p.precio.toLocaleString('es-CO')}</p>

          <ul class="iconos-caracteristicas">

            <li>
              <img class="icono" loading="lazy" src="/img/icono_wc.svg">
              <p>${p.wc}</p>
            </li>

            <li>
              <img class="icono" loading="lazy" src="/img/icono_estacionamiento.svg">
              <p>${p.estacionamiento}</p>
            </li>

            <li>
              <img class="icono" loading="lazy" src="/img/icono_dormitorio.svg">
              <p>${p.habitaciones}</p>
            </li>

          </ul>

          <a href="/propiedad.html?id=${p.id}" class="boton-amarillo-block">
            Ver Propiedad
          </a>

        </div>

      </div>
    `;

  }).join('');

}