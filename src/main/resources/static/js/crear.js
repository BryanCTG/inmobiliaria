document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('formPropiedad');
    const mensaje = document.getElementById('mensajePropiedad');

    form.addEventListener('submit', async (e) => {

        e.preventDefault();

        mensaje.style.display = "none";
        mensaje.classList.remove("exito", "error");

        const formData = new FormData();

        const propiedad = {
            titulo: form.titulo.value,
            descripcion: form.descripcion.value,
            precio: parseInt(form.precio.value),
            habitaciones: parseInt(form.habitaciones.value),
            wc: parseInt(form.wc.value),
            estacionamiento: parseInt(form.estacionamiento.value),
            visible: true,

            // 🔥 AQUÍ ESTABA EL PROBLEMA
            ciudad: form.ciudad.value,
            barrio: form.barrio.value,
            direccion: form.direccion.value
        };

        // 🧪 DEBUG (puedes quitarlo después)
        console.log("Propiedad enviada:", propiedad);

        formData.append(
            "propiedad",
            new Blob([JSON.stringify(propiedad)], { type: "application/json" })
        );

        // obtener todas las imágenes
        const archivos = form.imagenes.files;

        // limitar a máximo 3
        if (archivos.length > 3) {

            mensaje.textContent = "Solo puedes subir máximo 3 imágenes";
            mensaje.classList.add("error");
            mensaje.style.display = "block";

            return;
        }

        // agregar todas las imágenes
        for (let i = 0; i < archivos.length; i++) {
            formData.append("imagenes", archivos[i]);
        }

        try {

            const response = await fetch('http://localhost:8080/api/propiedades', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error("Error al guardar");
            }

            mensaje.textContent = "Propiedad creada correctamente";
            mensaje.classList.add("exito");
            mensaje.style.display = "block";

            form.reset();

        } catch (error) {

            console.error(error);

            mensaje.textContent = "Hubo un error al crear la propiedad";
            mensaje.classList.add("error");
            mensaje.style.display = "block";
        }

    });

});