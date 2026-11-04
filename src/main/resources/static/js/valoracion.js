/**
 * Valoración pública: envía las características a /api/valoracion y muestra la estimación
 * con su rango. Todo lo que se pinta viene del servidor o de lo que escribió la persona.
 */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formValoracion');
  if (!form) return;

  const panel = document.getElementById('resultadoValoracion');
  const aviso = document.getElementById('mensajeValoracion');
  const cop = (n) => '$' + Number(n).toLocaleString('es-CO');
  const millones = (n) => '$' + (Number(n) / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 0 }) + ' millones';
  const nombres = { Cartagena: 'Cartagena', Bogota: 'Bogotá', Medellin: 'Medellín', Barranquilla: 'Barranquilla' };

  const mostrarAviso = (texto) => {
    aviso.textContent = texto;
    aviso.className = 'form-message is-error';
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    aviso.className = 'form-message';

    if (!form.checkValidity()) {
      const campo = form.querySelector(':invalid');
      const etiqueta = campo?.closest('.field')?.querySelector('label')?.textContent.trim() || 'Este campo';
      mostrarAviso(`${etiqueta}: revisa este dato antes de calcular.`);
      campo?.focus();
      return;
    }

    const datos = {
      ciudad: form.ciudad.value,
      habitaciones: Number(form.habitaciones.value),
      wc: Number(form.wc.value),
      estacionamiento: Number(form.estacionamiento.value),
      metrosCuadrados: Number(form.metrosCuadrados.value),
    };

    const boton = form.querySelector('button[type="submit"]');
    const original = boton.innerHTML;
    boton.disabled = true;
    boton.innerHTML = '<i class="ph ph-spinner spin" aria-hidden="true"></i> Calculando';
    panel.setAttribute('aria-busy', 'true');

    try {
      const res = await fetch('/api/valoracion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      const cuerpo = await res.json().catch(() => ({}));
      if (!res.ok) { mostrarAviso(cuerpo.mensaje || 'No pudimos calcular la valoración. Inténtalo de nuevo.'); return; }

      // Posición del valor dentro del rango (la barra va de 0 a 100 %)
      const mensaje = `Quisiera una valoración de mi propiedad en ${nombres[datos.ciudad] || datos.ciudad}: `
        + `${datos.habitaciones} habitaciones, ${datos.wc} baños, ${datos.estacionamiento} parqueaderos y ${datos.metrosCuadrados} m². `
        + `La estimación de referencia fue de ${cop(cuerpo.precioEstimado)}.`;
      const numeroWa = (window.BELAR && window.BELAR.whatsapp) || '';

      panel.innerHTML = `
        <p class="eyebrow">Estimación de referencia</p>
        <p class="valor" id="valorEstimado">${esc(cop(cuerpo.precioEstimado))}</p>
        <p class="rango">Entre <strong>${esc(millones(cuerpo.minimo))}</strong> y <strong>${esc(millones(cuerpo.maximo))}</strong></p>
        <div class="rango-barra" role="img" aria-label="El valor estimado queda en el centro del rango"><span></span></div>
        <p class="body-6 muted">El margen de ${esc(millones(cuerpo.margen))} es el error promedio del modelo sobre sus propios datos de entrenamiento (${esc(cuerpo.registros)} propiedades de ejemplo).</p>
        ${cuerpo.fueraDeRango ? `<p class="notice" role="note"><i class="ph ph-warning-circle" aria-hidden="true"></i><span>Esta propiedad tiene un área fuera del rango que conoce el modelo (35 a 245 m²). Tómala con más cautela y consulta con un asesor.</span></p>` : ''}
        <div class="resultado-acciones">
          <a class="btn btn-gold btn-lg" href="/contacto.html?mensaje=${encodeURIComponent(mensaje)}"><i class="ph ph-paper-plane-tilt" aria-hidden="true"></i> Hablar con un asesor</a>
          <a class="btn btn-ghost btn-lg btn-wa" target="_blank" rel="noopener" href="https://wa.me/${esc(numeroWa)}?text=${encodeURIComponent(mensaje)}"><i class="ph ph-whatsapp-logo" aria-hidden="true"></i> Escribir por WhatsApp</a>
        </div>
        <p class="body-6 faint">Es una referencia estadística y no reemplaza el avalúo comercial de un perito autorizado.</p>`;
      panel.classList.add('tiene-resultado');
      if (window.innerWidth < 1024) window.Premium?.scrollTo(panel);
    } catch (err) {
      console.error('Error en la valoración:', err);
      mostrarAviso('No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      boton.disabled = false;
      boton.innerHTML = original;
      panel.removeAttribute('aria-busy');
    }
  });
});
