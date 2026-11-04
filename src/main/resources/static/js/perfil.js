/**
 * Utilidades de las cuentas de cliente y propietario: guardia de rol, llamadas a la API,
 * pestañas accesibles y los formularios de perfil y contraseña (compartidos).
 */
(() => {
  'use strict';

  const Cuenta = {
    /** Exige una sesión del rol indicado; si no, redirige al lugar correcto y devuelve null. */
    async exigir(rol) {
      const u = await window.Belar.yo();
      if (!u.autenticado) {
        window.location.replace('/ingresar.html?volver=' + encodeURIComponent(window.location.pathname + window.location.search));
        return null;
      }
      if (u.rol !== rol) {
        window.location.replace(window.Belar.destinoDeRol(u.rol));
        return null;
      }
      return u;
    },

    /** fetch con sesión. Devuelve { ok, status, datos } y manda al ingreso si la sesión expiró. */
    async api(metodo, ruta, cuerpo, esFormData = false) {
      const opts = { method: metodo, credentials: 'same-origin' };
      if (cuerpo !== undefined && cuerpo !== null) {
        if (esFormData) opts.body = cuerpo;
        else { opts.headers = { 'Content-Type': 'application/json' }; opts.body = JSON.stringify(cuerpo); }
      }
      const res = await fetch(ruta, opts);
      let datos = null;
      try { datos = await res.json(); } catch { /* sin cuerpo */ }
      if (res.status === 401) {
        window.location.replace('/ingresar.html?volver=' + encodeURIComponent(window.location.pathname));
      }
      return { ok: res.ok, status: res.status, datos };
    },

    mensaje(el, tipo, texto) {
      if (!el) return;
      el.textContent = texto;
      el.className = 'form-message ' + (tipo === 'ok' ? 'is-ok' : 'is-error');
    },

    /** Pestañas con roles ARIA y flechas del teclado. mapa = { idPestaña: idPanel } */
    tabs(mapa, inicial) {
      const ids = Object.keys(mapa);
      const activar = (id, enfocar = false) => {
        ids.forEach((t) => {
          const activa = t === id;
          const tab = document.getElementById(t);
          tab.setAttribute('aria-selected', String(activa));
          tab.tabIndex = activa ? 0 : -1;
          document.getElementById(mapa[t]).hidden = !activa;
        });
        if (enfocar) document.getElementById(id).focus();
      };
      ids.forEach((id, i) => {
        const tab = document.getElementById(id);
        tab.addEventListener('click', () => activar(id));
        tab.addEventListener('keydown', (e) => {
          if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
          const siguiente = ids[(i + (e.key === 'ArrowRight' ? 1 : ids.length - 1)) % ids.length];
          activar(siguiente, true);
        });
      });
      activar(inicial && ids.includes(inicial) ? inicial : ids[0]);
      return activar;
    },

    fecha(iso) {
      if (!iso) return '';
      const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);
      return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    },
  };
  window.Cuenta = Cuenta;

  /* ─── Perfil y contraseña ─────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', async () => {
    const formPerfil = document.getElementById('formPerfil');
    if (!formPerfil) return;

    const msgPerfil = document.getElementById('msgPerfil');
    const msgPass = document.getElementById('msgPass');
    const tel = document.getElementById('pfTel');

    const r = await Cuenta.api('GET', '/api/cuenta/perfil');
    if (r.ok) {
      document.getElementById('pfNombre').value = r.datos.nombre || '';
      document.getElementById('pfCorreo').value = r.datos.correo || '';
      tel.value = r.datos.telefono || '';
      if (r.datos.rol === 'PROPIETARIO') {
        tel.required = true;
        document.getElementById('pfTelLabel').textContent = 'Celular de contacto *';
      }
    }

    formPerfil.addEventListener('submit', async (e) => {
      e.preventDefault();
      msgPerfil.className = 'form-message';
      if (!formPerfil.checkValidity()) {
        Cuenta.mensaje(msgPerfil, 'error', 'Revisa tu nombre y tu celular antes de guardar.');
        formPerfil.querySelector(':invalid')?.focus();
        return;
      }
      const res = await Cuenta.api('PUT', '/api/cuenta/perfil', {
        nombre: document.getElementById('pfNombre').value.trim(),
        telefono: tel.value.trim(),
      });
      Cuenta.mensaje(msgPerfil, res.ok ? 'ok' : 'error', res.ok ? 'Datos actualizados.' : (res.datos?.mensaje || 'No pudimos guardar tus datos.'));
    });

    document.getElementById('formPassword').addEventListener('submit', async (e) => {
      e.preventDefault();
      msgPass.className = 'form-message';
      const actual = document.getElementById('pwActual');
      const nueva = document.getElementById('pwNueva');
      if (!actual.value || nueva.value.length < 8) {
        Cuenta.mensaje(msgPass, 'error', 'Escribe tu contraseña actual y una nueva de al menos 8 caracteres.');
        return;
      }
      const res = await Cuenta.api('PUT', '/api/cuenta/password', { actual: actual.value, nueva: nueva.value });
      Cuenta.mensaje(msgPass, res.ok ? 'ok' : 'error', res.ok ? 'Contraseña actualizada.' : (res.datos?.mensaje || 'No pudimos cambiar la contraseña.'));
      if (res.ok) { actual.value = ''; nueva.value = ''; }
    });

    document.getElementById('btnSalir')?.addEventListener('click', () => window.Belar.salir());
  });
})();
