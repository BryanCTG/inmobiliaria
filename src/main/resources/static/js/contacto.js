document.addEventListener('DOMContentLoaded', async () => {

    const params = new URLSearchParams(window.location.search);
    const propiedadSeleccionada = params.get("propiedadId");

    const select = document.getElementById("propiedad");

    try {
        const res = await fetch("http://localhost:8080/api/propiedades/visibles");
        if (!res.ok) throw new Error("Error al cargar propiedades");

        const propiedades = await res.json();

        propiedades.forEach(p => {
            const option = document.createElement("option");
            option.value = p.id;
            option.textContent = p.titulo;

            // SI VIENE DESDE "ME INTERESA ESTA CASA", SELECCIONAR AUTOMÁTICAMENTE
            if (propiedadSeleccionada && propiedadSeleccionada == p.id) {
                option.selected = true;
            }

            select.appendChild(option);
        });

    } catch (error) {
        console.error("Error cargando propiedades:", error);
    }
});


document.getElementById("form-contacto").addEventListener("submit", function(e) {
    e.preventDefault();

    const estado = document.getElementById("estado");

    emailjs.sendForm(
        "service_ktulq4a",
        "template_2ykz1qr",
        this
    )
    .then(() => {
        estado.textContent = "Mensaje enviado correctamente.";
        estado.style.color = "green";
        this.reset();
    })
    .catch((error) => {
        console.log("ERROR EMAILJS:", error);
        estado.textContent = "Hubo un error al enviar.";
        estado.style.color = "red";
    });
});
