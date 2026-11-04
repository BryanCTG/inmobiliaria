/** Publicar o corregir una propiedad (propietarios). Siempre queda en revisión del equipo. */
document.addEventListener('DOMContentLoaded', async () => {
  const u = await Cuenta.exigir('PROPIETARIO');
  if (!u) return;

  const id = new URLSearchParams(window.location.search).get('id');
  const form = document.getElementById('formProp');
  const msg = document.getElementById('msgProp');
  const fotos = document.getElementById('pFotos');
  const vista = document.getElementById('previewFotos');
  const textoFotos = document.getElementById('textoFotos');
  const campo = (n) => document.getElementById(n);
  const MAX_FOTOS = 4;
  const TIPOS = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  let archivos = [];            // fotos elegidas para subir
  let existentes = [];          // fotos ya guardadas (al editar)

  /* ─── Fotos con vista previa ─────────────────────────────── */
  function pintarFotos() {
    vista.innerHTML = '';
    const fuentes = archivos.length ? archivos.map((f) => ({ src: URL.createObjectURL(f), nombre: f.name })) : existentes.map((r) => ({ src: r, nombre: '' }));
    fuentes.forEach((f, i) => {
      const fig = document.createElement('figure');
      fig.innerHTML = `<img alt="Foto ${i + 1} de tu propiedad" src="${esc(f.src)}">`;
      if (archivos.length) {
        const b = document.createElement('button');
        b.type = 'button'; b.setAttribute('aria-label', `Quitar foto ${i + 1}`); b.innerHTML = '<i class="ph ph-x" aria-hidden="true"></i>';
        b.addEventListener('click', () => { archivos.splice(i, 1); pintarFotos(); });
        fig.appendChild(b);
      }
      vista.appendChild(fig);
    });
    textoFotos.textContent = archivos.length
      ? `${archivos.length} foto${archivos.length === 1 ? '' : 's'} lista${archivos.length === 1 ? '' : 's'} para enviar`
      : (existentes.length ? 'Sube fotos nuevas para reemplazar las actuales' : 'Elige las fotos de tu propiedad');
  }
  fotos.addEventListener('change', () => {
    const elegidas = Array.from(fotos.files);
    const invalidas = elegidas.filter((f) => !TIPOS.includes(f.type));
    if (invalidas.length) Cuenta.mensaje(msg, 'error', 'Solo se aceptan imágenes JPG, PNG, WEBP o GIF.');
    archivos = elegidas.filter((f) => TIPOS.includes(f.type)).slice(0, MAX_FOTOS);
    if (elegidas.length > MAX_FOTOS) window.Belar.toast(`Solo se pueden subir ${MAX_FOTOS} fotos; usamos las primeras ${MAX_FOTOS}.`);
    pintarFotos();
  });

  /* ─── Editar: precarga y reglas ──────────────────────────── */
  if (id) {
    document.getElementById('tituloForm').textContent = 'Editar mi propiedad';
    const r = await Cuenta.api('GET', `/api/propietario/propiedades/${encodeURIComponent(id)}`);
    if (!r.ok) { window.location.replace('/propietario.html'); return; }
    const p = r.datos;
    if (p.estado === 'PUBLICADA') {
      window.location.replace('/propietario.html');
      return;
    }
    campo('pTitulo').value = p.titulo || '';
    campo('pDescripcion').value = p.descripcion || '';
    campo('pPrecio').value = p.precio || '';
    campo('pMetros').value = p.metrosCuadrados || '';
    campo('pHab').value = p.habitaciones ?? '';
    campo('pWc').value = p.wc ?? '';
    campo('pPark').value = p.estacionamiento ?? '';
    campo('pCiudad').value = p.ciudad || '';
    campo('pBarrio').value = p.barrio || '';
    campo('pDireccion').value = p.direccion || '';
    existentes = p.imagenes || [];
    pintarFotos();
    campo('btnEnviar').lastChild.textContent = ' Guardar y enviar a revisión';
    if (p.estado === 'RECHAZADA' && p.motivoRechazo) {
      const aviso = document.getElementById('avisoRechazo');
      aviso.querySelector('span').textContent = `Tu propiedad fue rechazada. Motivo: ${p.motivoRechazo}. Corrígela y vuelve a enviarla.`;
      aviso.hidden = false;
    }
  }

  /* ─── Estimación de referencia para decidir el precio ───── */
  document.getElementById('btnRef').addEventListener('click', async () => {
    const out = document.getElementById('resRef');
    const datos = {
      ciudad: campo('pCiudad').value,
      habitaciones: Number(campo('pHab').value),
      wc: Number(campo('pWc').value),
      estacionamiento: Number(campo('pPark').value),
      metrosCuadrados: Number(campo('pMetros').value),
    };
    out.hidden = false;
    if (!datos.ciudad || !datos.metrosCuadrados || campo('pHab').value === '' || campo('pWc').value === '' || campo('pPark').value === '') {
      out.textContent = 'Completa ciudad, área, habitaciones, baños y parqueaderos para ver la estimación.';
      return;
    }
    try {
      const res = await fetch('/api/valoracion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
      const c = await res.json().catch(() => ({}));
      if (!res.ok) { out.textContent = c.mensaje || 'No pudimos calcular la estimación.'; return; }
      const mill = (n) => '$' + (n / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 0 }) + ' millones';
      out.innerHTML = `Estimación de referencia: <strong>$${Number(c.precioEstimado).toLocaleString('es-CO')}</strong>, con un rango entre ${esc(mill(c.minimo))} y ${esc(mill(c.maximo))}.${c.fueraDeRango ? ' El área queda fuera de los datos del modelo: tómala con cautela.' : ''}`;
    } catch { out.textContent = 'No pudimos conectar para calcular la estimación.'; }
  });

  /* ─── Envío ──────────────────────────────────────────────── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.className = 'form-message';

    if (!form.checkValidity()) {
      const c = form.querySelector(':invalid');
      const etiqueta = c?.closest('.field')?.querySelector('label')?.textContent.replace('*', '').trim() || 'Este campo';
      Cuenta.mensaje(msg, 'error', `${etiqueta}: revisa este dato antes de enviar.`);
      c?.focus();
      return;
    }
    if (!archivos.length && !existentes.length) {
      Cuenta.mensaje(msg, 'error', 'Sube al menos una foto de tu propiedad.');
      fotos.focus();
      return;
    }

    const boton = campo('btnEnviar');
    const original = boton.innerHTML;
    boton.disabled = true;
    boton.innerHTML = '<i class="ph ph-spinner spin" aria-hidden="true"></i> Enviando';

    const propiedad = {
      titulo: campo('pTitulo').value.trim(),
      descripcion: campo('pDescripcion').value.trim(),
      precio: Number(campo('pPrecio').value),
      metrosCuadrados: Number(campo('pMetros').value),
      habitaciones: Number(campo('pHab').value),
      wc: Number(campo('pWc').value),
      estacionamiento: Number(campo('pPark').value),
      ciudad: campo('pCiudad').value,
      barrio: campo('pBarrio').value.trim(),
      direccion: campo('pDireccion').value.trim(),
    };
    const datos = new FormData();
    datos.append('propiedad', new Blob([JSON.stringify(propiedad)], { type: 'application/json' }));
    archivos.forEach((f) => datos.append('imagenes', f));

    try {
      const r = await Cuenta.api(id ? 'PUT' : 'POST', id ? `/api/propietario/propiedades/${encodeURIComponent(id)}` : '/api/propietario/propiedades', datos, true);
      if (!r.ok) { Cuenta.mensaje(msg, 'error', r.datos?.mensaje || 'No pudimos enviar tu propiedad. Inténtalo de nuevo.'); return; }
      window.location.href = '/propietario.html?ok=enviada';
    } catch (err) {
      console.error('Error enviando propiedad:', err);
      Cuenta.mensaje(msg, 'error', 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      boton.disabled = false;
      boton.innerHTML = original;
    }
  });
});
