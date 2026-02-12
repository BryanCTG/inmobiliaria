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
            visible: true
        };

        formData.append(
            "propiedad",
            new Blob([JSON.stringify(propiedad)], { type: "application/json" })
        );

        if (form.imagen.files[0]) {
            formData.append("imagen", form.imagen.files[0]);
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











//  document.addEventListener('DOMContentLoaded', () => {
//      const form = document.getElementById('formPropiedad');
//      const mensaje = document.getElementById('mensajePropiedad');

//      form.addEventListener('submit', async (e) => {
//          e.preventDefault();

//         const imagenFile = form.imagen.files[0];
//         let imagenId = null;

//         try {
//              // 1️ Subir imagen a GridFS
//              if (imagenFile) {
//                  const formData = new FormData();
//                  formData.append('file', imagenFile);

//                 const resImg = await fetch('http://localhost:8080/api/imagenes/subir', {
//                    method: 'POST',
//                      body: formData
//                  });                 if (!resImg.ok) throw new Error('Error al subir la imagen');
//                  imagenId = await resImg.text();
//              }

//              // 2️   Crear propiedad con referencia a la imagen
//              const propiedad = {
//                  titulo: form.titulo.value,
//                  descripcion: form.descripcion.value,
//                  precio: parseInt(form.precio.value),                 
//                  habitaciones: parseInt(form.habitaciones.value),
//                  wc: parseInt(form.wc.value),
//                  estacionamiento: parseInt(form.estacionamiento.value),
//                  visible: true,
//                  imagenId: imagenId
//              };

//              const resProp = await fetch('http://localhost:8080/api/propiedades', {
//                 method: 'POST',
//                  headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(propiedad)
//              });


//          try {
//              const response = await fetch('http://localhost:8080/api/propiedades', {
//                  method: 'POST',
//                  body: formData
//              });

//              if (!response.ok) {
//                 throw new Error("Error al guardar");
//              }

//              mensaje.textContent = "Propiedad creada correctamente";
//              mensaje.classList.add("exito");
//              mensaje.style.display = "block";

//              form.reset();

//          } catch (error) {
//              console.error(error);

//              mensaje.textContent = "Hubo un error al crear la propiedad";
//              mensaje.classList.add("error");
//             mensaje.style.display = "block";
//          }
//     });
//      });
