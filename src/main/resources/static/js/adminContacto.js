document.addEventListener("DOMContentLoaded", async function () {

    const contenedor = document.getElementById("contenedor-contactos");

    try {

        //  Traer contactos
        const resContactos = await fetch("http://localhost:8080/api/contacto");
        const contactos = await resContactos.json();

        //  Traer propiedades
        const resPropiedades = await fetch("http://localhost:8080/api/propiedades");
        const propiedades = await resPropiedades.json();

        //  Crear mapa ID → Título
        const mapaPropiedades = {};
        propiedades.forEach(p => {
            mapaPropiedades[p.id] = p.titulo;
        });

       
        contactos.reverse();

        contactos.forEach(c => {

            const nombrePropiedad = mapaPropiedades[c.casaInteres] || "Propiedad no encontrada";

            const card = document.createElement("div");
            card.classList.add("card-contacto");

            card.innerHTML = `
                <h3>${c.nombre}</h3>
                <p><strong>Correo:</strong> ${c.correo}</p>
                <p><strong>Celular:</strong> ${c.celular}</p>
                <p><strong>Casa:</strong> ${nombrePropiedad}</p>
                <div class="mensaje">${c.mensaje}</div>
            `;

            contenedor.appendChild(card);
        });

    } catch (error) {
        console.error("Error:", error);
    }

});
