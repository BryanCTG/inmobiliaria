/**
 * Escapa texto antes de insertarlo en HTML (innerHTML / plantillas).
 * Evita XSS: cualquier dato que venga de usuarios (mensajes de contacto, títulos, etc.)
 * debe pasar por esta función antes de pintarse.
 */
function esc(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

/** Los datos guardan la ciudad sin tilde (coincide con el modelo de precios); aquí se muestra bien escrita. */
function ciudadLegible(ciudad) {
  const nombres = { Bogota: 'Bogotá', Medellin: 'Medellín' };
  return nombres[ciudad] || ciudad || '';
}
