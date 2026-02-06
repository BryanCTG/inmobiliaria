document.addEventListener('DOMContentLoaded', function () {

  // =========================
  // DARK MODE
  // =========================
  const prefiereDarkMode = window.matchMedia('(prefers-color-scheme: dark)');

  if (prefiereDarkMode.matches) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }

  prefiereDarkMode.addEventListener('change', function () {
    document.body.classList.toggle('dark-mode', prefiereDarkMode.matches);
  });

  const botonDarkMode = document.querySelector('.dark-mode-boton');
  if (botonDarkMode) {
    botonDarkMode.addEventListener('click', function () {
      document.body.classList.toggle('dark-mode');
    });
  }

  // =========================
  // MENÚ RESPONSIVE
  // =========================
  const mobileMenu = document.querySelector('.mobile-menu');
  if (mobileMenu) {
    mobileMenu.addEventListener('click', function () {
      const navegacion = document.querySelector('.navegacion');
      if (navegacion) {
        navegacion.classList.toggle('mostrar');
      }
    });
  }

  // =========================
  // CARGAR PROPIEDADES (SOLO SI EXISTE EL SELECT)
  // =========================
  const selectPropiedad = document.getElementById('propiedad');

  if (selectPropiedad) {
    fetch('http://localhost:8080/api/propiedades')
      .then(response => response.json())
      .then(data => {
        data.forEach(propiedad => {
          const option = document.createElement('option');
          option.value = propiedad.id;
          option.textContent = propiedad.titulo;
          selectPropiedad.appendChild(option);
        });
      })
      .catch(error => {
        console.error('Error al cargar propiedades:', error);
      });
  }

  // =========================
  // FORMULARIO DE CONTACTO (AISLADO)
  // =========================
  const formContacto = document.getElementById('formContacto');

  if (formContacto) {
    formContacto.addEventListener('submit', function (e) {
      e.preventDefault();

      const nombre = document.getElementById('nombre')?.value;
      const email = document.getElementById('email')?.value;
      const telefono = document.getElementById('telefono')?.value;
      const casa = document.getElementById('propiedad')?.value;
      const mensaje = document.getElementById('mensaje')?.value;
      const contacto = document.querySelector('input[name="contacto"]:checked')?.value;

      const datos = {
        nombre,
        correo: email,
        celular: telefono,
        casaInteres: casa,
        mensaje,
        medioContacto: contacto
      };

      fetch('http://localhost:8080/api/contacto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Error al enviar los datos');
          }
          return response.json();
        })
        .then(data => {
          alert('Formulario enviado correctamente');
          console.log(data);
          formContacto.reset();
        })
        .catch(error => {
          console.error('Error en el envío:', error);
          alert('Error al enviar el formulario');
        });
    });
  }

});



