document.addEventListener("DOMContentLoaded", async function () {

    const form = document.getElementById("form-contacto");
    const estado = document.getElementById("estado");
    const contenedorPropiedad = document.getElementById("propiedad-seleccionada");

    // leer propiedad desde URL
    const params = new URLSearchParams(window.location.search);
    const propiedadId = params.get("propiedadId");

    // =============================
    // MOSTRAR CASA SELECCIONADA
    // =============================

    if (propiedadId) {

        try {

            const res = await fetch(`http://localhost:8080/api/propiedades/${propiedadId}`);

            if (!res.ok) throw new Error("Error cargando propiedad");

            const propiedad = await res.json();

            // llenar campo oculto
            form.casaInteres.value = propiedad.id;

            // mostrar propiedad
            if (contenedorPropiedad) {
                contenedorPropiedad.innerHTML = `
                    <div class="propiedad-seleccionada">

                        <h3>Casa seleccionada</h3>

                        <img 
                        src="${propiedad.imagenId 
                            ? `http://localhost:8080/api/imagenes/${propiedad.imagenId}`
                            : '/img/default.jpg'}" 
                        alt="${propiedad.titulo}"
                        style="max-width:400px;border-radius:10px;margin-bottom:10px;">

                        <h4>${propiedad.titulo}</h4>
                        <p style="color:#71b100;font-weight:bold;">
                            $${propiedad.precio.toLocaleString('es-CO')}
                        </p>

                    </div>
                `;
            }

        } catch (error) {
            console.error("Error cargando propiedad:", error);
        }
    }

    // =============================
    // ENVIAR FORMULARIO
    // =============================

    form.addEventListener("submit", async function (e) {

        e.preventDefault();

        const contacto = {
            nombre: form.nombre.value,
            celular: form.celular.value,
            correo: form.correo.value,
            casaInteres: form.casaInteres.value,
            mensaje: form.mensaje.value
        };

        try {

            const response = await fetch("http://localhost:8080/api/contacto", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(contacto)
            });

            if (!response.ok) throw new Error("Error guardando");

            estado.textContent = "Mensaje enviado correctamente.";
            estado.style.color = "green";

            form.reset();

        } catch (error) {

            console.error(error);

            estado.textContent = "Hubo un error.";
            estado.style.color = "red";
        }

    });

});

































// document.addEventListener('DOMContentLoaded', async () => {

//     const params = new URLSearchParams(window.location.search);
//     const propiedadSeleccionada = params.get("propiedadId");

//     const select = document.getElementById("propiedad");

//     try {
//         const res = await fetch("http://localhost:8080/api/propiedades/visibles");
//         if (!res.ok) throw new Error("Error al cargar propiedades");

//         const propiedades = await res.json();

//         propiedades.forEach(p => {
//             const option = document.createElement("option");
//             option.value = p.id;
//             option.textContent = p.titulo;

//             // SI VIENE DESDE "ME INTERESA ESTA CASA", SELECCIONAR AUTOMÁTICAMENTE
//             if (propiedadSeleccionada && propiedadSeleccionada == p.id) {
//                 option.selected = true;
//             }

//             select.appendChild(option);
//         });

//     } catch (error) {
//         console.error("Error cargando propiedades:", error);
//     }
// });


// document.getElementById("form-contacto").addEventListener("submit", function(e) {
//     e.preventDefault();

//     const estado = document.getElementById("estado");

//     emailjs.sendForm(
//         "service_ktulq4a",
//         "template_2ykz1qr",
//         this
//     )
//     .then(() => {
//         estado.textContent = "Mensaje enviado correctamente.";
//         estado.style.color = "green";
//         this.reset();
//     })
//     .catch((error) => {
//         console.log("ERROR EMAILJS:", error);
//         estado.textContent = "Hubo un error al enviar.";
//         estado.style.color = "red";
//     });
// });
