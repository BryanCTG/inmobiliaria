document.addEventListener('DOMContentLoaded', async () => {

    const params = new URLSearchParams(window.location.search);
    const propiedadId = params.get("id");

    if (!propiedadId) {
        document.getElementById("detalle-propiedad").innerHTML = `<p>No se encontró la propiedad.</p>`;
        return;
    }

    try {

        const res = await fetch(`http://localhost:8080/api/propiedades/${propiedadId}`);

        if (!res.ok) throw new Error("Error al cargar la propiedad");

        const p = await res.json();

        const contenedor = document.getElementById("detalle-propiedad");

        // generar galería de imágenes
        let galeria = "";

        if (p.imagenes && p.imagenes.length > 0) {

            galeria = p.imagenes.map(img => `
                <img class="imagen-propiedad"
                     src="http://localhost:8080${img}"
                     alt="${p.titulo}">
            `).join("");

        } else {

            galeria = `<img class="imagen-propiedad" src="/img/default.jpg">`;

        }

        contenedor.innerHTML = `

            <h1 class="fw-300 centrar-texto">${p.titulo}</h1>

            <div class="galeria-propiedad">
                ${galeria}
            </div>

            <div class="resumen-propiedad">

                <p class="precio">$${p.precio.toLocaleString('es-CO')}</p>

                <ul class="iconos-caracteristicas">

                    <li>
                        <img class="icono" src="/img/icono_wc.svg">
                        <p>${p.wc}</p>
                    </li>

                    <li>
                        <img class="icono" src="/img/icono_estacionamiento.svg">
                        <p>${p.estacionamiento}</p>
                    </li>

                    <li>
                        <img class="icono" src="/img/icono_dormitorio.svg">
                        <p>${p.habitaciones}</p>
                    </li>

                </ul>

                <p>${p.descripcion}</p>

            </div>

            <div class="acciones-propiedad">

                <button id="btn-volver" class="boton-amarillo">Volver</button>

                <a href="/contacto.html?propiedadId=${p.id}"
                    class="boton boton-verde">
                    Me interesa esta casa
                </a>

            </div>
        `;

        document.getElementById("btn-volver").addEventListener("click", () => {
            window.history.back();
        });

    } catch (error) {

        document.getElementById("detalle-propiedad").innerHTML = `<p>Error al cargar la propiedad.</p>`;

    }

});