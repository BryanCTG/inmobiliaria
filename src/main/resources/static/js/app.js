/**
 * Funciones compartidas del sitio público: favoritos, avisos y estado de la sesión.
 * Los favoritos se guardan en el navegador y, si la persona tiene cuenta de cliente, también en su cuenta.
 */
(() => {
  'use strict';

  const KEY = 'belar_favoritos';

  const leer = () => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(v) ? v : [];
    } catch { return []; }
  };
  const guardar = (lista) => { try { localStorage.setItem(KEY, JSON.stringify(lista)); } catch { /* modo privado */ } };

  /* ─── Aviso breve (toast) ─────────────────────────────────── */
  let temporizador;
  function toast(texto) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = texto;
    el.classList.add('is-on');
    clearTimeout(temporizador);
    temporizador = setTimeout(() => el.classList.remove('is-on'), 2600);
  }

  /* ─── Sesión ──────────────────────────────────────────────── */
  let promesaYo = null;
  function yo() {
    if (!promesaYo) {
      promesaYo = fetch('/api/auth/yo', { credentials: 'same-origin' })
        .then(r => (r.ok ? r.json() : { autenticado: false }))
        .catch(() => ({ autenticado: false }));
    }
    return promesaYo;
  }

  const destinoDeRol = (rol) => (rol === 'ADMIN' ? '/admin/index.html' : (rol === 'PROPIETARIO' ? '/propietario.html' : '/cuenta.html'));

  /** Cierra la sesión. Los favoritos viven en la cuenta, así que se limpia la copia local del dispositivo. */
  async function salir() {
    try { await fetch('/logout', { method: 'POST', credentials: 'same-origin' }); } catch { /* aun así se sale */ }
    try { localStorage.removeItem(KEY); } catch { /* sin acceso */ }
    window.location.href = '/?salio=1';
  }

  /* ─── Favoritos ───────────────────────────────────────────── */
  let esCliente = false;
  let envioPendiente;

  function sincronizarConCuenta() {
    if (!esCliente) return;
    clearTimeout(envioPendiente);
    envioPendiente = setTimeout(() => {
      fetch('/api/cliente/favoritos', {
        method: 'PUT', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: leer() }),
      }).catch(() => { /* se reintenta en la próxima acción */ });
    }, 400);
  }

  const Favs = {
    lista: leer,
    tiene: (id) => leer().includes(id),
    alternar(id) {
      const lista = leer();
      const i = lista.indexOf(id);
      if (i >= 0) lista.splice(i, 1); else lista.unshift(id);
      guardar(lista);
      repintar();
      sincronizarConCuenta();
      document.dispatchEvent(new CustomEvent('favoritos:cambio', { detail: { id, activo: i < 0 } }));
      return i < 0;
    }
  };

  function repintar(root = document) {
    const lista = leer();
    root.querySelectorAll('[data-fav]').forEach((btn) => {
      const activo = lista.includes(btn.dataset.fav);
      btn.setAttribute('aria-pressed', String(activo));
      btn.setAttribute('aria-label', activo ? 'Quitar de favoritos' : 'Guardar en favoritos');
      btn.classList.toggle('is-on', activo);
      const icono = btn.querySelector('i');
      if (icono) icono.className = activo ? 'ph-fill ph-heart' : 'ph ph-heart';
    });
    document.querySelectorAll('.nav-fav-count').forEach((c) => {
      c.textContent = String(lista.length);
      c.hidden = lista.length === 0;
    });
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-fav]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const activo = Favs.alternar(btn.dataset.fav);
    toast(activo ? 'Guardada en tus favoritos' : 'Quitada de tus favoritos');
  });

  // Si cambia desde otra pestaña, se refleja aquí
  window.addEventListener('storage', (e) => { if (e.key === KEY) { repintar(); document.dispatchEvent(new CustomEvent('favoritos:cambio')); } });

  document.addEventListener('DOMContentLoaded', () => {
    repintar();

    yo().then(async (u) => {
      // Encabezado: "Ingresar" o "Mi cuenta"
      document.querySelectorAll('#navCuenta, #mmCuenta').forEach((a) => {
        a.textContent = u.autenticado ? 'Mi cuenta' : 'Ingresar';
        a.href = u.autenticado ? destinoDeRol(u.rol) : '/ingresar.html';
      });

      // Cliente: une los favoritos del dispositivo con los de su cuenta
      if (u.autenticado && u.rol === 'CLIENTE') {
        esCliente = true;
        try {
          const res = await fetch('/api/cliente/favoritos', { credentials: 'same-origin' });
          if (!res.ok) return;
          const { ids } = await res.json();
          const local = leer();
          const unidos = [...local, ...ids.filter(id => !local.includes(id))];
          const cambio = unidos.length !== local.length;
          guardar(unidos);
          if (cambio) { repintar(); document.dispatchEvent(new CustomEvent('favoritos:cambio')); }
          if (unidos.length !== ids.length) sincronizarConCuenta();
        } catch { /* sin conexión: se sincroniza más tarde */ }
      }
    });

    // Aviso al volver de cerrar sesión
    if (new URLSearchParams(window.location.search).get('salio') === '1') {
      toast('Cerraste sesión');
      history.replaceState(null, '', window.location.pathname);
    }
  });

  window.Belar = Object.assign(window.BELAR || {}, { favs: Favs, toast, repintar, yo, salir, destinoDeRol });
})();
