/**
 * Belar Inmobiliaria · comportamiento del sitio público.
 * - Scroll suave con inercia (Lenis) si hay librería y el usuario no pidió movimiento reducido.
 * - Revelado de secciones con IntersectionObserver (una sola vez).
 * - Parallax del hero y frase que se enciende palabra por palabra, con un único listener
 *   de scroll limitado por requestAnimationFrame.
 * - Navegación flotante y menú móvil de altura completa.
 */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ─── Scroll suave ──────────────────────────────────────────── */
  let lenis = null;
  if (!reduceMotion && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true });
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  /* ─── Scroll limitado por rAF (un solo listener) ───────────── */
  const subscribers = [];
  let queued = false;
  const flush = () => { queued = false; subscribers.forEach(fn => fn(window.scrollY)); };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(flush); } };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue, { passive: true });
  const onScroll = (fn) => { subscribers.push(fn); fn(window.scrollY); };

  /* ─── Header ─────────────────────────────────────────────────── */
  const header = $('#siteHeader');
  if (header) onScroll(y => header.classList.toggle('is-scrolled', y > 40));

  /* ─── Revelado al entrar en pantalla ─────────────────────────── */
  let revealObserver = null;
  if ('IntersectionObserver' in window && !reduceMotion) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  }

  function reveal(root = document) {
    $$('[data-reveal-group]', root).forEach(group => {
      Array.from(group.children).forEach((child, i) => {
        if (!child.hasAttribute('data-reveal')) child.setAttribute('data-reveal', '');
        child.style.setProperty('--d', String(Math.min(i, 6) * 90));
      });
    });
    $$('[data-reveal]:not(.is-in)', root).forEach(el => {
      if (revealObserver) revealObserver.observe(el); else el.classList.add('is-in');
    });
  }
  reveal();

  /* ─── Hero: parallax ─────────────────────────────────────────── */
  const heroImg = $('.hero-media img');
  const hero = $('.hero');
  if (heroImg && hero && !reduceMotion) {
    onScroll(y => {
      const limit = hero.offsetHeight;
      if (y > limit) return;
      heroImg.style.setProperty('--py', `${(y * 0.18).toFixed(1)}px`);
    });
  }

  /* ─── Frase que se enciende palabra por palabra ──────────────── */
  const tagline = $('.tagline-text');
  if (tagline) {
    const accents = (tagline.dataset.accent || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const frag = document.createDocumentFragment();
    tagline.textContent.trim().split(/\s+/).forEach((w, i, all) => {
      const span = document.createElement('span');
      span.className = 'word';
      if (accents.includes(w.toLowerCase().replace(/[.,;:]/g, ''))) span.classList.add('accent');
      span.textContent = w;
      frag.appendChild(span);
      if (i < all.length - 1) frag.appendChild(document.createTextNode(' '));
    });
    const label = tagline.textContent.trim();
    tagline.textContent = '';
    tagline.setAttribute('aria-label', label);
    tagline.appendChild(frag);
    const words = $$('.word', tagline);
    words.forEach(w => w.setAttribute('aria-hidden', 'true'));

    if (reduceMotion) {
      words.forEach(w => w.classList.add('on'));
    } else {
      onScroll(() => {
        const rect = tagline.getBoundingClientRect();
        const vh = window.innerHeight;
        const start = vh * 0.85;               // empieza cuando el bloque entra por abajo
        const end = vh * 0.35;                 // termina cuando ya está en el tercio superior
        const progress = Math.min(1, Math.max(0, (start - rect.top) / (start - end + rect.height * 0.6)));
        const active = Math.round(progress * words.length);
        words.forEach((w, i) => w.classList.toggle('on', i < active));
      });
    }
  }

  /* ─── Menú móvil ─────────────────────────────────────────────── */
  const toggle = $('#navToggle');
  const menu = $('#mobileMenu');
  if (toggle && menu) {
    const items = $$('li, .mobile-menu-cta', menu);
    items.forEach((el, i) => el.style.setProperty('--i', String(Math.min(i, 6)))); // 60ms por paso, máx. 360ms

    const setOpen = (open) => {
      menu.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      document.documentElement.style.overflow = open ? 'hidden' : '';
      if (lenis) (open ? lenis.stop() : lenis.start());
      if (open) { const first = $('a', menu); if (first) setTimeout(() => first.focus({ preventScroll: true }), 50); }
    };

    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    $$('a', menu).forEach(a => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
  }

  /* ─── Dato real en el hero: cuántas propiedades hay publicadas ─ */
  const counter = $('#heroCount');
  if (counter) {
    fetch('/api/propiedades/visibles')
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(list => { if (Array.isArray(list) && list.length) counter.textContent = `${list.length} propiedades disponibles hoy en `; })
      .catch(() => { /* si falla, queda el texto base */ });
  }

  /* API pública para contenido que se crea después (tarjetas del catálogo) */
  function scrollTo(target) {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -96 });
    else el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  window.Premium = { reveal, scrollTo, reduceMotion };
})();
