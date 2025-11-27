document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) {
        alert("No se encontró el ID de la propiedad");
        return;
    }

    const res = await fetch(`http://localhost:8080/api/propiedades/${id}`);
    if (!res.ok) {
        alert("No se pudo cargar la información de la propiedad");
        return;
    }

    const p = await res.json();

    document.getElementById("idPropiedad").value = p.id;
    document.getElementById("titulo").value = p.titulo;
    document.getElementById("descripcion").value = p.descripcion;
    document.getElementById("precio").value = p.precio;
    document.getElementById("wc").value = p.wc;
    document.getElementById("estacionamiento").value = p.estacionamiento;
    document.getElementById("habitaciones").value = p.habitaciones;

    if (p.imagenId) {
        document.getElementById("preview").src = `http://localhost:8080/api/propiedades/imagen/${p.imagenId}`;
    }

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
            habitaciones: parseInt(document.getElementById("habitaciones").value)
        };

        formData.append("propiedad", new Blob([JSON.stringify(propiedad)], { type: "application/json" }));

        const imagenFile = document.getElementById("imagen").files[0];
        if (imagenFile) formData.append("imagen", imagenFile);

        const res = await fetch(`http://localhost:8080/api/propiedades/${id}`, {
            method: "PUT",
            body: formData
        });

        if (res.ok) {
            alert("Propiedad actualizada correctamente");
            window.location.href = "/admin/index.html";
        } else {
            alert("Error al actualizar la propiedad");
        }
    });
});
