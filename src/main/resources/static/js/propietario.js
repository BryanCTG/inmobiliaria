/** Panel del propietario: sus propiedades con estado, consultas y visitas. */
document.addEventListener('DOMContentLoaded', async () => {
  const u = await Cuenta.exigir('PROPIETARIO');
  if (!u) return;

  document.getElementById('saludo').textContent = `Hola, ${(u.nombre || '').split(' ')[0] || 'bienvenido'}`;
  Cuenta.tabs({ tabMias: 'panelMias', tabPerfil: 'panelPerfil' }, window.location.hash === '#perfil' ? 'tabPerfil' : 'tabMias');

  const lista = document.getElementById('listaMias');
  const resumen = document.getElementById('resumenPropietario');
  const ESTADOS = {
    PENDIENTE: { texto: 'En revisión', clase: 'estado--pend' },
    PUBLICADA: { texto: 'Publicada', clase: 'estado--ok' },
    RECHAZADA: { texto: 'Rechazada', clase: 'estado--mal' },
    RETIRADA:  { texto: 'Retirada',  clase: 'estado--off' },
  };

  if (new URLSearchParams(window.location.search).get('ok') === 'enviada') {
    window.Belar.toast('Tu propiedad quedó en revisión. Te avisamos aquí cuando se publique.');
    history.replaceState(null, '', window.location.pathname);
  }

  async function cargar() {
    const r = await Cuenta.api('GET', '/api/propietario/propiedades');
    if (!r.ok || !Array.isArray(r.datos)) {
      lista.innerHTML = '<div class="state-box"><i class="ph ph-warning-circle" aria-hidden="true"></i><h3 class="heading-6">No pudimos cargar tus propiedades</h3><p class="body-6">Inténtalo de nuevo en unos segundos.</p></div>';
      return;
    }
    const items = r.datos;

    const consultas = items.reduce((t, x) => t + x.consultas, 0);
    resumen.innerHTML = `
      <div><strong>${items.length}</strong><span>Propiedades enviadas</span></div>
      <div><strong>${items.filter(x => x.propiedad.estado === 'PUBLICADA').length}</strong><span>Publicadas</span></div>
      <div><strong>${items.filter(x => x.propiedad.estado === 'PENDIENTE').length}</strong><span>En revisión</span></div>
      <div><strong>${consultas}</strong><span>Consultas recibidas</span></div>`;

    if (!items.length) {
      lista.innerHTML = `
        <div class="state-box">
          <i class="ph ph-house-line" aria-hidden="true"></i>
          <h3 class="heading-6">Aún no has publicado propiedades</h3>
          <p class="body-6">Envía tu primera propiedad: el equipo la revisa y, si todo está bien, la publica en el catálogo.</p>
          <a href="/propietario-propiedad.html" class="btn btn-gold btn-sm" style="margin-top:var(--s-100)">Publicar propiedad</a>
        </div>`;
      return;
    }

    lista.innerHTML = items.map(({ propiedad: p, consultas, visitas }) => {
      const e = ESTADOS[p.estado] || ESTADOS.PENDIENTE;
      const foto = (p.imagenes && p.imagenes[0]) || '/img/default.svg';
      const editable = ['PENDIENTE', 'RECHAZADA', 'RETIRADA'].includes(p.estado);
      const ciudad = ciudadLegible(p.ciudad);
      return `
        <article class="mia">
          <img src="${esc(foto)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='/img/default.svg'">
          <div class="mia-info">
            <span class="estado ${e.clase}">${e.texto}</span>
            <h3 class="heading-6">${esc(p.titulo)}</h3>
            <p class="muted">${esc([p.barrio, ciudad].filter(Boolean).join(', '))} · <span class="gold">$${Number(p.precio).toLocaleString('es-CO')}</span></p>
            <p class="mia-stats">
              <span><i class="ph ph-chat-circle-text" aria-hidden="true"></i> ${consultas} consulta${consultas === 1 ? '' : 's'}</span>
              <span><i class="ph ph-calendar-check" aria-hidden="true"></i> ${visitas} visita${visitas === 1 ? '' : 's'}</span>
            </p>
            ${p.estado === 'RECHAZADA' && p.motivoRechazo ? `<p class="mia-motivo"><i class="ph ph-warning-circle" aria-hidden="true"></i> <span>Motivo: ${esc(p.motivoRechazo)}</span></p>` : ''}
            ${p.estado === 'PENDIENTE' ? '<p class="body-6 faint">El equipo la está revisando. Puedes corregirla mientras tanto.</p>' : ''}
          </div>
          <div class="mia-acciones">
            ${p.estado === 'PUBLICADA' ? `<a class="btn btn-ghost btn-sm" href="/propiedad.html?id=${esc(p.id)}">Ver publicación</a>` : ''}
            ${editable ? `<a class="btn btn-ghost btn-sm" href="/propietario-propiedad.html?id=${esc(p.id)}"><i class="ph ph-pencil-simple" aria-hidden="true"></i> ${p.estado === 'RETIRADA' ? 'Corregir y reenviar' : 'Editar'}</a>` : ''}
            ${p.estado !== 'RETIRADA' ? `<button type="button" class="btn btn-ghost btn-sm" data-retirar="${esc(p.id)}">Retirar</button>` : ''}
          </div>
        </article>`;
    }).join('');
  }

  // Retirar con confirmación en dos pasos (sin ventanas del navegador)
  lista.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-retirar]');
    if (!btn) return;
    if (btn.dataset.confirmar !== '1') {
      btn.dataset.confirmar = '1';
      btn.textContent = 'Confirmar retiro';
      btn.classList.add('btn-peligro');
      setTimeout(() => { btn.dataset.confirmar = ''; btn.textContent = 'Retirar'; btn.classList.remove('btn-peligro'); }, 4000);
      return;
    }
    btn.disabled = true;
    const r = await Cuenta.api('POST', `/api/propietario/propiedades/${encodeURIComponent(btn.dataset.retirar)}/retirar`);
    window.Belar.toast(r.ok ? 'Propiedad retirada' : (r.datos?.mensaje || 'No pudimos retirarla'));
    cargar();
  });

  cargar();
});
