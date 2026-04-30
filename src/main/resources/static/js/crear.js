document.addEventListener('DOMContentLoaded', () => {
  const form    = document.getElementById('formPropiedad');
  const mensaje = document.getElementById('mensajePropiedad');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const textoOriginal = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="material-symbols-rounded" style="animation:spin .7s linear infinite;">refresh</span> Publicando...';
    submitBtn.disabled = true;

    ocultarMensaje();

    const formData = new FormData();
    const propiedad = {
      titulo:          form.titulo.value.trim(),
      descripcion:     form.descripcion.value.trim(),
      precio:          parseInt(form.precio.value),
      habitaciones:    parseInt(form.habitaciones.value),
      wc:              parseInt(form.wc.value),
      estacionamiento: parseInt(form.estacionamiento.value),
      metrosCuadrados: parseFloat(form.metrosCuadrados.value),
      visible:         true
    };

    formData.append('propiedad', new Blob([JSON.stringify(propiedad)], { type: 'application/json' }));

    const archivos = Array.from(form.imagen.files || []).slice(0, 4);
    archivos.forEach((file) => formData.append('imagenes', file));

    try {
      const response = await fetch('http://localhost:8080/api/propiedades', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Error al guardar');

      mostrarMensaje('✓ Propiedad creada y publicada correctamente', 'exito');
      form.reset();

      // Reset image preview
      const preview = document.getElementById('previewWrapper');
      if (preview) preview.style.display = 'none';

      setTimeout(() => { window.location.href = '/admin/propiedades.html'; }, 1800);

    } catch (err) {
      console.error(err);
      mostrarMensaje('Error al crear la propiedad. Verifica los datos e intenta de nuevo.', 'error');
    } finally {
      submitBtn.innerHTML = textoOriginal;
      submitBtn.disabled = false;
    }
  });

  function mostrarMensaje(texto, tipo) {
    if (!mensaje) return;
    mensaje.textContent = texto;
    mensaje.className   = `form-message ${tipo}`;
    mensaje.style.display = 'block';
    mensaje.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function ocultarMensaje() {
    if (!mensaje) return;
    mensaje.style.display = 'none';
    mensaje.className = 'form-message';
  }
});
