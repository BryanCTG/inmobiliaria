document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formPropiedad');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const imagenFile = form.imagen.files[0];
        let imagenId = null;

        try {
            // 1️ Subir imagen a GridFS
            if (imagenFile) {
                const formData = new FormData();
                formData.append('file', imagenFile);

                const resImg = await fetch('http://localhost:8080/api/imagenes/subir', {
                    method: 'POST',
                    body: formData
                });

                if (!resImg.ok) throw new Error('Error al subir la imagen');
                imagenId = await resImg.text();
            }

            // 2️   Crear propiedad con referencia a la imagen
            const propiedad = {
                titulo: form.titulo.value,
                descripcion: form.descripcion.value,
                precio: parseInt(form.precio.value),
                habitaciones: parseInt(form.habitaciones.value),
                wc: parseInt(form.wc.value),
                estacionamiento: parseInt(form.estacionamiento.value),
                visible: true,
                imagenId: imagenId
            };

            const resProp = await fetch('http://localhost:8080/api/propiedades', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(propiedad)
            });

            if (!resProp.ok) throw new Error('Error al guardar la propiedad');

            alert('Propiedad creada correctamente');
            window.location.href = '/admin/index.html';

        } catch (error) {
            console.error(error);
            alert('Hubo un error al crear la propiedad');
        }
    });
});
