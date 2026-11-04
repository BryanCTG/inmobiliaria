document.addEventListener('DOMContentLoaded', function () {
  const params = new URLSearchParams(window.location.search);
  const error  = params.get('error');
  const errorDiv = document.getElementById('error-message');
  if (!errorDiv) return;

  if (error === 'true') {
    errorDiv.classList.add('show');
  } else if (error === 'bloqueado') {
    errorDiv.lastChild.textContent = ' Demasiados intentos seguidos. Espera unos minutos e inténtalo de nuevo.';
    errorDiv.classList.add('show');
  }
});
