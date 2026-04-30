document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const cargando = document.getElementById('cargando');
  const form     = document.getElementById('formEditar');
  const mensaje  = document.getElementById('mensajeEditar');

  if (!id) {
    if (cargando) cargando.innerHTML = '';
    mostrarMensaje('No se encontró el ID de la propiedad.', 'error');
    return;
  }

  try {
    const res = await fetch(`http://localhost:8080/api/propiedades/${id}`);
    if (!res.ok) throw new Error('No se encontró la propiedad');
    const p = await res.json();

    // Populate fields
    document.getElementById('idPropiedad').value   = p.id;
    document.getElementById('titulo').value         = p.titulo;
    document.getElementById('descripcion').value    = p.descripcion;
    document.getElementById('precio').value         = p.precio;
    document.getElementById('wc').value             = p.wc;
    document.getElementById('estacionamiento').value = p.estacionamiento;
    document.getElementById('habitaciones').value   = p.habitaciones;
    document.getElementById('metrosCuadrados').value = p.metrosCuadrados || ''; 

    // Update subtitle
    const subtitulo = document.getElementById('nombrePropiedad');
    if (subtitulo) subtitulo.textContent = p.titulo;

    // Preview image
    const preview = document.getElementById('preview');
    if (preview && Array.isArray(p.imagenes) && p.imagenes.length > 0) {
      preview.src = p.imagenes[0];
    } else if (preview) {
      preview.src = '/img/default.jpg';
    }

    // Show form
    if (cargando) cargando.style.display = 'none';
    if (form) form.style.display = 'block';

  } catch (err) {
    if (cargando) cargando.innerHTML = '';
    mostrarMensaje('Error al cargar la propiedad. Verifica que el ID sea correcto.', 'error');
    return;
  }

  // Submit handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const textoOriginal = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="material-symbols-rounded" style="animation:spin .7s linear infinite;">refresh</span> Guardando...';
    submitBtn.disabled = true;

    const formData = new FormData();
    const propiedad = {
      titulo:          document.getElementById('titulo').value,
      descripcion:     document.getElementById('descripcion').value,
      precio:          parseFloat(document.getElementById('precio').value),
      wc:              parseInt(document.getElementById('wc').value),
      estacionamiento: parseInt(document.getElementById('estacionamiento').value),
      habitaciones:    parseInt(document.getElementById('habitaciones').value),
      metrosCuadrados: parseFloat(document.getElementById('metrosCuadrados').value)
    };

    formData.append('propiedad', new Blob([JSON.stringify(propiedad)], { type: 'application/json' }));

    const archivos = Array.from(document.getElementById('imagen').files || []).slice(0, 4);
    archivos.forEach((file) => formData.append('imagenes', file));

    try {
      const res = await fetch(`http://localhost:8080/api/propiedades/${id}`, {
        method: 'PUT',
        body: formData
      });

      if (!res.ok) throw new Error('Error al actualizar');

      mostrarMensaje('✓ Propiedad actualizada correctamente', 'exito');
      setTimeout(() => { window.location.href = '/admin/propiedades.html'; }, 1500);

    } catch (err) {
      mostrarMensaje('Error al actualizar la propiedad. Intenta de nuevo.', 'error');
    } finally {
      submitBtn.innerHTML = textoOriginal;
      submitBtn.disabled = false;
    }
  });

  function mostrarMensaje(texto, tipo) {
    if (!mensaje) return;
    mensaje.textContent = texto;
    mensaje.className = `form-message ${tipo}`;
    mensaje.style.display = 'block';
    mensaje.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});
