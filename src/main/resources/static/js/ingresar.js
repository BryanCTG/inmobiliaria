/**
 * Ingresar y crear cuenta. El inicio de sesión es un envío de formulario normal a /login
 * (Spring decide a dónde ir según el rol); el registro usa la API y luego inicia sesión solo.
 */
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);

  // Si ya hay sesión, no tiene sentido mostrar el formulario
  const u = await window.Belar.yo();
  if (u.autenticado) { window.location.replace(window.Belar.destinoDeRol(u.rol)); return; }

  const tabIngresar = document.getElementById('tabIngresar');
  const tabRegistro = document.getElementById('tabRegistro');
  const panelIngresar = document.getElementById('panelIngresar');
  const panelRegistro = document.getElementById('panelRegistro');
  const aviso = document.getElementById('mensajeAuth');

  const mostrar = (tipo, texto) => {
    aviso.textContent = texto;
    aviso.className = 'form-message ' + (tipo === 'ok' ? 'is-ok' : 'is-error');
  };
  const limpiar = () => { aviso.className = 'form-message'; };

  function activar(cual, enfocar) {
    const registro = cual === 'registro';
    tabIngresar.setAttribute('aria-selected', String(!registro));
    tabRegistro.setAttribute('aria-selected', String(registro));
    tabIngresar.tabIndex = registro ? -1 : 0;
    tabRegistro.tabIndex = registro ? 0 : -1;
    panelIngresar.hidden = registro;
    panelRegistro.hidden = !registro;
    limpiar();
    if (enfocar) (registro ? document.getElementById('rgNombre') : document.getElementById('liCorreo')).focus();
  }
  tabIngresar.addEventListener('click', () => activar('ingresar'));
  tabRegistro.addEventListener('click', () => activar('registro'));
  [tabIngresar, tabRegistro].forEach((t) => t.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { activar('registro'); tabRegistro.focus(); }
    if (e.key === 'ArrowLeft') { activar('ingresar'); tabIngresar.focus(); }
  }));
  document.querySelectorAll('[data-ir]').forEach((b) => b.addEventListener('click', () => activar(b.dataset.ir, true)));

  // Pestaña y tipo de cuenta desde la URL (?tab=registro&rol=propietario)
  if (params.get('tab') === 'registro' || params.get('rol')) activar('registro');
  if ((params.get('rol') || '').toLowerCase() === 'propietario') {
    document.querySelector('input[name="rol"][value="PROPIETARIO"]').checked = true;
  }

  // A dónde volver después de ingresar (solo rutas internas)
  const volver = params.get('volver') || '';
  const volverSeguro = volver.startsWith('/') && !volver.startsWith('//') && !volver.includes('\\') ? volver : '';
  document.getElementById('campoVolver').value = volverSeguro;

  // Errores que devuelve el servidor
  if (params.get('error') === 'true') mostrar('error', 'El correo o la contraseña no son correctos.');
  if (params.get('error') === 'bloqueado') mostrar('error', 'Demasiados intentos seguidos. Espera unos minutos e inténtalo de nuevo.');

  // Mostrar u ocultar contraseña
  document.querySelectorAll('.pw-toggle').forEach((b) => b.addEventListener('click', () => {
    const campo = document.getElementById(b.dataset.pw);
    const visible = campo.type === 'text';
    campo.type = visible ? 'password' : 'text';
    b.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
    b.querySelector('i').className = visible ? 'ph ph-eye' : 'ph ph-eye-slash';
  }));

  // El celular es obligatorio solo para propietarios
  const tel = document.getElementById('rgTel');
  const etiquetaTel = document.getElementById('rgTelLabel');
  const ajustarRol = () => {
    const esProp = document.querySelector('input[name="rol"]:checked').value === 'PROPIETARIO';
    tel.required = esProp;
    etiquetaTel.textContent = esProp ? 'Celular de contacto *' : 'Celular';
  };
  document.querySelectorAll('input[name="rol"]').forEach((r) => r.addEventListener('change', ajustarRol));
  ajustarRol();

  // Ingresar: validación mínima y envío normal del formulario
  panelIngresar.addEventListener('submit', (e) => {
    limpiar();
    if (!panelIngresar.checkValidity()) {
      e.preventDefault();
      mostrar('error', 'Escribe tu correo y tu contraseña.');
      panelIngresar.querySelector(':invalid')?.focus();
    }
  });

  // Crear cuenta
  panelRegistro.addEventListener('submit', async (e) => {
    e.preventDefault();
    limpiar();

    if (!panelRegistro.checkValidity()) {
      const campo = panelRegistro.querySelector(':invalid');
      if (campo?.type === 'checkbox') mostrar('error', 'Debes aceptar la política de privacidad y los términos para crear tu cuenta.');
      else if (campo?.id === 'rgClave') mostrar('error', 'La contraseña debe tener al menos 8 caracteres.');
      else if (campo?.type === 'email') mostrar('error', 'Escribe un correo válido.');
      else if (campo?.id === 'rgTel' && tel.required && !tel.value) mostrar('error', 'Para publicar propiedades necesitamos un celular de contacto.');
      else mostrar('error', 'Revisa los campos marcados antes de continuar.');
      campo?.focus();
      return;
    }
    const clave = document.getElementById('rgClave').value;
    if (!/[A-Za-z]/.test(clave) || !/\d/.test(clave)) {
      mostrar('error', 'La contraseña debe incluir al menos una letra y un número.');
      document.getElementById('rgClave').focus();
      return;
    }

    const boton = panelRegistro.querySelector('button[type="submit"]');
    const original = boton.innerHTML;
    boton.disabled = true;
    boton.innerHTML = '<i class="ph ph-spinner spin" aria-hidden="true"></i> Creando cuenta';

    const correo = document.getElementById('rgCorreo').value.trim();
    try {
      const res = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: document.getElementById('rgNombre').value.trim(),
          correo,
          password: clave,
          rol: document.querySelector('input[name="rol"]:checked').value,
          telefono: tel.value.trim(),
        }),
      });
      const cuerpo = await res.json().catch(() => ({}));
      if (!res.ok) { mostrar('error', cuerpo.mensaje || 'No pudimos crear tu cuenta. Inténtalo de nuevo.'); return; }

      // Cuenta creada: inicia sesión automáticamente
      mostrar('ok', 'Cuenta creada. Entrando…');
      const f = document.createElement('form');
      f.method = 'POST'; f.action = '/login';
      [['username', correo.toLowerCase()], ['password', clave], ['origen', '/ingresar.html'], ['volver', volverSeguro]].forEach(([n, v]) => {
        const i = document.createElement('input'); i.type = 'hidden'; i.name = n; i.value = v; f.appendChild(i);
      });
      document.body.appendChild(f);
      f.submit();
    } catch (err) {
      console.error('Error en el registro:', err);
      mostrar('error', 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      boton.disabled = false;
      boton.innerHTML = original;
    }
  });
});
