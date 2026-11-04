/**
 * Formulario de contacto: propiedades en el selector, preselección por URL (?propiedad=ID),
 * mensaje precargado (?mensaje=...), visita opcional con fecha y hora, validación y envío.
 */
document.addEventListener('DOMContentLoaded', function () {

  // ─── WhatsApp y mensaje precargado desde la URL ──────────────────────────
  const wa = document.getElementById('waContacto');
  if (wa && window.BELAR) {
    wa.href = `https://wa.me/${window.BELAR.whatsapp}?text=${encodeURIComponent('Hola, quisiera información sobre una propiedad.')}`;
  }
  const params = new URLSearchParams(window.location.search);
  const campoMensaje = document.getElementById('mensaje');
  if (params.get('mensaje') && campoMensaje) campoMensaje.value = params.get('mensaje').slice(0, 1000);

  // ─── Visita: solo aparece cuando hay una propiedad elegida ───────────────
  const selectPropiedad = document.getElementById('propiedad');
  const bloqueVisita = document.getElementById('bloqueVisita');
  const fechaVisita = document.getElementById('fechaVisita');
  const horaVisita = document.getElementById('horaVisita');

  const aISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  if (fechaVisita) {
    const manana = new Date(); manana.setDate(manana.getDate() + 1);
    const limite = new Date(); limite.setDate(limite.getDate() + 60);
    fechaVisita.min = aISO(manana);
    fechaVisita.max = aISO(limite);
  }
  const actualizarVisita = () => {
    if (!bloqueVisita) return;
    const hay = !!selectPropiedad.value;
    bloqueVisita.hidden = !hay;
    if (!hay) { fechaVisita.value = ''; horaVisita.value = ''; }
  };

  if (selectPropiedad) {
    const preseleccion = params.get('propiedad');
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
        actualizarVisita();
      })
      .catch(err => console.error('Error al cargar propiedades para el selector:', err));
    selectPropiedad.addEventListener('change', actualizarVisita);
  }

  // ─── Formulario ───────────────────────────────────────────────────────────
  const form = document.getElementById('formContacto');
  if (!form) return;

  const mensajeDiv = document.getElementById('mensajeContacto');
  const mostrar = (tipo, texto) => {
    mensajeDiv.textContent = texto;
    mensajeDiv.className = `form-message ${tipo === 'ok' ? 'is-ok' : 'is-error'}`;
    mensajeDiv.scrollIntoView({ block: 'nearest', behavior: window.Premium?.reduceMotion ? 'auto' : 'smooth' });
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

    // Validación de la visita
    const conVisita = !!(fechaVisita && fechaVisita.value);
    if (conVisita) {
      const dia = new Date(`${fechaVisita.value}T12:00:00`).getDay();
      if (dia === 0 || dia === 6) {
        mostrar('error', 'Las visitas se agendan de lunes a viernes. Elige otra fecha.');
        fechaVisita.focus();
        return;
      }
      if (!horaVisita.value) {
        mostrar('error', 'Elige la hora de tu visita.');
        horaVisita.focus();
        return;
      }
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const textoOriginal = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="ph ph-spinner spin" aria-hidden="true"></i> Enviando';
    submitBtn.disabled = true;

    const datos = {
      nombre:        document.getElementById('nombre').value.trim(),
      correo:        document.getElementById('email').value.trim(),
      celular:       document.getElementById('telefono').value.trim(),
      casaInteres:   selectPropiedad ? selectPropiedad.value : '',
      mensaje:       document.getElementById('mensaje').value.trim(),
      medioContacto: form.querySelector('input[name="contacto"]:checked')?.value,
      fechaVisita:   conVisita ? fechaVisita.value : null,
      horaVisita:    conVisita ? horaVisita.value : null
    };

    try {
      const res = await fetch('/api/contacto', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(datos)
      });

      if (!res.ok) {
        let texto = 'No pudimos enviar tu mensaje. Revisa tu conexión e inténtalo de nuevo.';
        try { const cuerpo = await res.json(); if (cuerpo && cuerpo.mensaje) texto = cuerpo.mensaje; } catch { /* sin cuerpo */ }
        mostrar('error', texto);
        return;
      }

      const medio = datos.medioContacto === 'telefono' ? 'teléfono' : (datos.medioContacto === 'whatsapp' ? 'WhatsApp' : 'correo');
      mostrar('ok', conVisita
        ? `Mensaje enviado. Recibimos tu solicitud de visita y te confirmaremos la disponibilidad por ${medio}.`
        : `Mensaje enviado. Un asesor te contactará por ${medio}.`);
      form.reset();
      if (selectPropiedad) selectPropiedad.value = '';
      actualizarVisita();

    } catch (err) {
      console.error('Error enviando contacto:', err);
      mostrar('error', 'No pudimos enviar tu mensaje. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      submitBtn.innerHTML = textoOriginal;
      submitBtn.disabled  = false;
    }
  });
});
