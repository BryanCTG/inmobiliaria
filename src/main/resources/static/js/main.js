document.addEventListener('DOMContentLoaded', function () {

  // ─── CARGAR PROPIEDADES EN SELECT (formulario de contacto) ────────────────
  const selectPropiedad = document.getElementById('propiedad');
  if (selectPropiedad) {
    fetch('http://localhost:8080/api/propiedades/visibles')
      .then(r => r.json())
      .then(data => {
        data.forEach(p => {
          const opt = document.createElement('option');
          opt.value = p.id;
          opt.textContent = p.titulo;
          selectPropiedad.appendChild(opt);
        });
      })
      .catch(err => console.error('Error al cargar propiedades para select:', err));
  }

  // ─── FORMULARIO DE CONTACTO ───────────────────────────────────────────────
  const formContacto = document.getElementById('formContacto');
  if (formContacto) {
    formContacto.addEventListener('submit', async function (e) {
      e.preventDefault();

      const submitBtn = formContacto.querySelector('button[type="submit"]');
      const textoOriginal = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span class="material-symbols-rounded" style="animation:spin .7s linear infinite;">refresh</span> Enviando...';
      submitBtn.disabled = true;

      const mensajeDiv = document.getElementById('mensajeContacto');

      const datos = {
        nombre:        document.getElementById('nombre')?.value,
        correo:        document.getElementById('email')?.value,
        celular:       document.getElementById('telefono')?.value,
        casaInteres:   document.getElementById('propiedad')?.value,
        mensaje:       document.getElementById('mensaje')?.value,
        medioContacto: document.querySelector('input[name="contacto"]:checked')?.value
      };

      try {
        const res = await fetch('http://localhost:8080/api/contacto', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(datos)
        });

        if (!res.ok) throw new Error('Error al enviar');

        if (mensajeDiv) {
          mensajeDiv.textContent   = '✓ ¡Mensaje enviado! Te contactaremos a la brevedad.';
          mensajeDiv.className     = 'form-message exito';
          mensajeDiv.style.display = 'block';
        }
        formContacto.reset();

      } catch (err) {
        console.error('Error enviando contacto:', err);
        if (mensajeDiv) {
          mensajeDiv.textContent   = 'Error al enviar el formulario. Intenta de nuevo.';
          mensajeDiv.className     = 'form-message error';
          mensajeDiv.style.display = 'block';
        }
      } finally {
        submitBtn.innerHTML = textoOriginal;
        submitBtn.disabled  = false;
      }
    });
  }

});
