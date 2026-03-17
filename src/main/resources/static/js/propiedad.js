document.addEventListener('DOMContentLoaded', async () => {

    const params = new URLSearchParams(window.location.search);
    const propiedadId = params.get("id");

    const contenedor = document.getElementById("detalle-propiedad");

    if (!propiedadId) {
        contenedor.innerHTML = `<p>No se encontró la propiedad.</p>`;
        return;
    }

    try {

        const res = await fetch(`http://localhost:8080/api/propiedades/${propiedadId}`);

        if (!res.ok) throw new Error("Error al cargar la propiedad");

        const p = await res.json();

        //  GALERÍA MEJORADA
        let galeria = "";

        if (p.imagenes && Array.isArray(p.imagenes) && p.imagenes.length > 0) {

            galeria = p.imagenes.map(img => {

    // 🔥 limpiar posibles errores de ruta
    let ruta = img;

    // Si NO empieza con /uploads, lo arreglamos
    if (!img.startsWith("/uploads")) {
        ruta = `/uploads/${img}`;
    }

    // 🔥 URL FINAL CORRECTA
    const urlFinal = `http://localhost:8080${ruta}`;

    console.log("Imagen:", urlFinal);

    return `
        <img class="imagen-propiedad"
             src="${urlFinal}"
             alt="${p.titulo}"
             onerror="this.src='/img/default.jpg'">
    `;

}).join("");

        } else {

            galeria = `<img class="imagen-propiedad" src="/img/default.jpg">`;

        }

        contenedor.innerHTML = `

            <h1 class="fw-300 centrar-texto">${p.titulo}</h1>

            <div class="galeria-propiedad">
                ${galeria}
            </div>

            <div class="resumen-propiedad">

                <p class="precio">$${(p.precio || 0).toLocaleString('es-CO')}</p>

                <ul class="iconos-caracteristicas">

                    <li>
                        <img class="icono" src="/img/icono_wc.svg">
                        <p>${p.wc ?? 0}</p>
                    </li>

                    <li>
                        <img class="icono" src="/img/icono_estacionamiento.svg">
                        <p>${p.estacionamiento ?? 0}</p>
                    </li>

                    <li>
                        <img class="icono" src="/img/icono_dormitorio.svg">
                        <p>${p.habitaciones ?? 0}</p>
                    </li>

                </ul>

                <p>${p.descripcion || "Sin descripción disponible."}</p>

            </div>

            <div class="acciones-propiedad">

                <button id="btn-volver" class="boton-amarillo">Volver</button>

                <a href="/contacto.html?propiedadId=${p.id}"
                    class="boton boton-verde">
                    Me interesa esta casa
                </a>

            </div>
        `;

        //  BOTÓN VOLVER
        document.getElementById("btn-volver").addEventListener("click", () => {
            window.history.back();
        });

    } catch (error) {

        console.error(error);

        contenedor.innerHTML = `<p>Error al cargar la propiedad.</p>`;

    }

});