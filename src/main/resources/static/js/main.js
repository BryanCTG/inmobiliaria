/**
 * Formulario de contacto: carga las propiedades en el selector, preselecciona la que llega
 * por la URL (?propiedad=ID), valida en el navegador y envía a la API.
 */
document.addEventListener('DOMContentLoaded', function () {

  // ─── Propiedades en el selector (y preselección desde la URL) ─────────────
  const selectPropiedad = document.getElementById('propiedad');
  if (selectPropiedad) {
    const preseleccion = new URLSearchParams(window.location.search).get('propiedad');
    fetch('/api/propiedades/visibles')
      .then(r => r.json())
      .then(data => {
        data.forEach(p => {
          const opt = document.createElement('option');
          opt.value = p.id;
          opt.textContent = p.titulo;
          selectPropiedad.appendChild(opt);
        });
        if (preseleccion) selectPropiedad.value = preseleccion;
      })
      .catch(err => console.error('Error al cargar propiedades para el selector:', err));
  }

  // ─── Formulario ───────────────────────────────────────────────────────────
  const form = document.getElementById('formContacto');
  if (!form) return;

  const mensajeDiv = document.getElementById('mensajeContacto');
  const mostrar = (tipo, texto) => {
    mensajeDiv.textContent = texto;
    mensajeDiv.className = `form-message ${tipo === 'ok' ? 'is-ok' : 'is-error'}`;
  };

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    mensajeDiv.className = 'form-message';

    // Validación en el navegador con mensajes específicos
    if (!form.checkValidity()) {
      const campo = form.querySelector(':invalid');
      const etiqueta = campo?.closest('.field')?.querySelector('label')?.textContent.replace('*', '').trim() || 'Este campo';
      if (campo?.type === 'checkbox') {
        mostrar('error', 'Debes aceptar la política de privacidad para poder enviar tu mensaje.');
        campo.focus();
        return;
      }
      mostrar('error', campo?.validity.typeMismatch
        ? `${etiqueta}: escribe un formato válido.`
        : `${etiqueta}: revisa este campo antes de enviar.`);
      campo?.focus();
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const textoOriginal = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="ph ph-spinner spin" aria-hidden="true"></i> Enviando';
    submitBtn.disabled = true;

    const datos = {
      nombre:        document.getElementById('nombre').value.trim(),
      correo:        document.getElementById('email').value.trim(),
      celular:       document.getElementById('telefono').value.trim(),
      casaInteres:   document.getElementById('propiedad').value,
      mensaje:       document.getElementById('mensaje').value.trim(),
      medioContacto: form.querySelector('input[name="contacto"]:checked')?.value
    };

    try {
      const res = await fetch('/api/contacto', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(datos)
      });

      if (!res.ok) throw new Error('Error al enviar');

      mostrar('ok', `Mensaje enviado. Un asesor te contactará por ${datos.medioContacto === 'telefono' ? 'teléfono' : datos.medioContacto}.`);
      form.reset();
      if (selectPropiedad) selectPropiedad.value = '';

    } catch (err) {
      console.error('Error enviando contacto:', err);
      mostrar('error', 'No pudimos enviar tu mensaje. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      submitBtn.innerHTML = textoOriginal;
      submitBtn.disabled  = false;
    }
  });
});
