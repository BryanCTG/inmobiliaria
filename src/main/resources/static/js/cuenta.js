/** Cuenta del cliente: favoritos sincronizados, estado de sus solicitudes y perfil. */
document.addEventListener('DOMContentLoaded', async () => {
  const u = await Cuenta.exigir('CLIENTE');
  if (!u) return;

  document.getElementById('saludo').textContent = `Hola, ${(u.nombre || '').split(' ')[0] || 'bienvenido'}`;
  const hash = (window.location.hash || '').replace('#', '');
  Cuenta.tabs({ tabFavoritos: 'panelFavoritos', tabSolicitudes: 'panelSolicitudes', tabPerfil: 'panelPerfil' },
    { favoritos: 'tabFavoritos', solicitudes: 'tabSolicitudes', perfil: 'tabPerfil' }[hash]);

  /* ─── Favoritos ─────────────────────────────────────────── */
  const grid = document.getElementById('favGrid');
  let catalogo = null;
  async function pintarFavoritos() {
    try {
      if (!catalogo) {
        const res = await fetch('/api/propiedades/visibles');
        catalogo = res.ok ? await res.json() : [];
      }
      const ids = window.Belar.favs.lista();
      const lista = ids.map((id) => catalogo.find((p) => p.id === id)).filter(Boolean);
      if (!lista.length) {
        grid.innerHTML = `
          <div class="state-box">
            <i class="ph ph-heart" aria-hidden="true"></i>
            <h3 class="heading-6">Aún no tienes favoritos</h3>
            <p class="body-6">Toca el corazón de una propiedad para guardarla aquí. Se conservan en tu cuenta y las ves desde cualquier dispositivo.</p>
            <a href="/anuncio.html" class="btn btn-gold btn-sm" style="margin-top:var(--s-100)">Explorar propiedades</a>
          </div>`;
        return;
      }
      renderizarPropiedades(lista, grid);
    } catch (err) {
      console.error('Error cargando favoritos:', err);
      grid.innerHTML = '<div class="state-box"><i class="ph ph-warning-circle" aria-hidden="true"></i><h3 class="heading-6">No pudimos cargar tus favoritos</h3><p class="body-6">Inténtalo de nuevo en unos segundos.</p></div>';
    }
  }
  pintarFavoritos();
  document.addEventListener('favoritos:cambio', pintarFavoritos);

  /* ─── Solicitudes ───────────────────────────────────────── */
  const cont = document.getElementById('listaSolicitudes');
  const medios = { telefono: 'teléfono', correo: 'correo', whatsapp: 'WhatsApp' };
  const r = await Cuenta.api('GET', '/api/cliente/solicitudes');
  if (!r.ok || !Array.isArray(r.datos)) {
    cont.innerHTML = '<div class="state-box"><i class="ph ph-warning-circle" aria-hidden="true"></i><h3 class="heading-6">No pudimos cargar tus solicitudes</h3><p class="body-6">Inténtalo de nuevo en unos segundos.</p></div>';
  } else if (!r.datos.length) {
    cont.innerHTML = `
      <div class="state-box">
        <i class="ph ph-chat-circle-text" aria-hidden="true"></i>
        <h3 class="heading-6">Todavía no has enviado mensajes</h3>
        <p class="body-6">Cuando escribas a un asesor o pidas una visita estando conectado, aquí verás cómo va cada solicitud.</p>
        <a href="/contacto.html" class="btn btn-gold btn-sm" style="margin-top:var(--s-100)">Escribir a un asesor</a>
      </div>`;
  } else {
    cont.innerHTML = r.datos.map((s) => `
      <article class="solicitud">
        <div class="sol-top">
          <span class="estado ${s.atendido ? 'estado--ok' : 'estado--pend'}">${s.atendido ? 'Atendida' : 'En espera'}</span>
          <span class="faint">${esc(Cuenta.fecha(s.creado))}</span>
        </div>
        <h3 class="heading-6">${s.propiedadId && s.propiedadTitulo
          ? `<a href="/propiedad.html?id=${esc(s.propiedadId)}">${esc(s.propiedadTitulo)}</a>`
          : 'Consulta general'}</h3>
        <p class="muted">${esc(s.mensaje)}</p>
        ${s.fechaVisita ? `<p class="sol-visita"><i class="ph ph-calendar-check" aria-hidden="true"></i> Visita solicitada para el <strong>${esc(Cuenta.fecha(s.fechaVisita))}</strong>${s.horaVisita ? ' a las ' + esc(s.horaVisita) : ''}</p>` : ''}
        <p class="body-6 faint">Te contactamos por ${esc(medios[s.medioContacto] || 'correo')}.</p>
      </article>`).join('');
  }
});
