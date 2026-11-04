/**
 * Funciones compartidas del sitio público: favoritos y avisos.
 * Los favoritos se guardan en el navegador (localStorage), así que funcionan sin registrarse.
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
    temporizador = setTimeout(() => el.classList.remove('is-on'), 2400);
  }

  /* ─── Favoritos ───────────────────────────────────────────── */
  const Favs = {
    lista: leer,
    tiene: (id) => leer().includes(id),
    alternar(id) {
      const lista = leer();
      const i = lista.indexOf(id);
      if (i >= 0) lista.splice(i, 1); else lista.unshift(id);
      guardar(lista);
      repintar();
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

  document.addEventListener('DOMContentLoaded', () => repintar());

  window.Belar = Object.assign(window.BELAR || {}, { favs: Favs, toast, repintar });
})();
