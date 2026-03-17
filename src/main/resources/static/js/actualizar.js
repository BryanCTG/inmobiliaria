document.addEventListener("DOMContentLoaded", async () => {

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        alert("No se encontró el ID de la propiedad");
        return;
    }

    try {

        const res = await fetch(`http://localhost:8080/api/propiedades/${id}`);

        if (!res.ok) {
            alert("No se pudo cargar la información de la propiedad");
            return;
        }

        const p = await res.json();

        // 🔥 llenar formulario
        document.getElementById("idPropiedad").value = p.id;
        document.getElementById("titulo").value = p.titulo;
        document.getElementById("descripcion").value = p.descripcion;
        document.getElementById("precio").value = p.precio;
        document.getElementById("wc").value = p.wc;
        document.getElementById("estacionamiento").value = p.estacionamiento;
        document.getElementById("habitaciones").value = p.habitaciones;
        document.getElementById("ciudad").value = p.ciudad || "";
        document.getElementById("barrio").value = p.barrio || "";
        document.getElementById("direccion").value = p.direccion || "";

        // 🔥 MOSTRAR IMAGEN ACTUAL (CORREGIDO)
        if (p.imagenes && p.imagenes.length > 0) {

            let ruta = p.imagenes[0];

            if (!ruta.startsWith("/uploads")) {
                ruta = `/uploads/${ruta}`;
            }

            document.getElementById("preview").src =
                `http://localhost:8080${ruta}`;
        }

        // 🔥 PREVIEW AL SELECCIONAR NUEVA IMAGEN
        document.getElementById("imagen").addEventListener("change", function (e) {

            const file = e.target.files[0];

            if (file) {
                const url = URL.createObjectURL(file);
                document.getElementById("preview").src = url;
            }

        });

        const form = document.getElementById("formEditar");

        form.addEventListener("submit", async (e) => {

            e.preventDefault();

            const formData = new FormData();

            const propiedad = {
                titulo: document.getElementById("titulo").value,
                descripcion: document.getElementById("descripcion").value,
                precio: parseFloat(document.getElementById("precio").value),
                wc: parseInt(document.getElementById("wc").value),
                estacionamiento: parseInt(document.getElementById("estacionamiento").value),
                habitaciones: parseInt(document.getElementById("habitaciones").value),
                ciudad: document.getElementById("ciudad").value,
                barrio: document.getElementById("barrio").value,
                direccion: document.getElementById("direccion").value
            };

            formData.append(
                "propiedad",
                new Blob([JSON.stringify(propiedad)], { type: "application/json" })
            );

            // 🔥 CORREGIDO: nombre debe ser "imagenes"
            const imagenFile = document.getElementById("imagen").files[0];

            if (imagenFile) {
                formData.append("imagenes", imagenFile);
            }

            try {

                const res = await fetch(`http://localhost:8080/api/propiedades/${id}`, {
                    method: "PUT",
                    body: formData
                });

                if (res.ok) {
                    alert("Propiedad actualizada correctamente");
                    window.location.href = "/admin/index.html";
                } else {
                    throw new Error("Error al actualizar");
                }

            } catch (error) {

                console.error(error);
                alert("Error al actualizar la propiedad");

            }

        });

    } catch (error) {

        console.error(error);
        alert("Error cargando la propiedad");

    }

});