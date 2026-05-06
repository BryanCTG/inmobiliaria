document.addEventListener('DOMContentLoaded', () => {
  const form    = document.getElementById('formPropiedad');
  const mensaje = document.getElementById('mensajePropiedad');

  // ─── LEAFLET MAP PICKER ─────────────────────────────────────────────────────
  let mapa = null;
  let marcador = null;

  function initMap() {
    if (mapa) return;
    // Centro inicial: Colombia
    mapa = L.map('mapaPicker').setView([4.711, -74.0721], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(mapa);

    mapa.on('click', function (e) {
      setMarker(e.latlng.lat, e.latlng.lng);
    });
  }

  function setMarker(lat, lng) {
    if (marcador) mapa.removeLayer(marcador);
    marcador = L.marker([lat, lng]).addTo(mapa);
    document.getElementById('latitud').value  = lat.toFixed(7);
    document.getElementById('longitud').value = lng.toFixed(7);
    document.getElementById('coordsDisplay').textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    document.getElementById('coordsDisplay').style.display = 'inline-flex';
  }

  // Toggle map visibility
  const toggleMapBtn = document.getElementById('toggleMap');
  const mapWrapper   = document.getElementById('mapWrapper');

  if (toggleMapBtn) {
    toggleMapBtn.addEventListener('click', () => {
      const isHidden = mapWrapper.style.display === 'none' || !mapWrapper.style.display;
      mapWrapper.style.display = isHidden ? 'block' : 'none';
      toggleMapBtn.querySelector('span:last-child').textContent =
        isHidden ? 'Ocultar mapa' : 'Seleccionar en mapa';

      if (isHidden) {
        setTimeout(() => {
          initMap();
          mapa.invalidateSize();
        }, 100);
      }
    });
  }

  // Geocoding with Nominatim
  const buscarBtn = document.getElementById('btnBuscarDir');
  if (buscarBtn) {
    buscarBtn.addEventListener('click', async () => {
      const dir = [
        document.getElementById('direccion')?.value,
        document.getElementById('barrio')?.value,
        document.getElementById('ciudad')?.value,
        'Colombia'
      ].filter(Boolean).join(', ');

      if (!dir.trim()) {
        alert('Completa al menos el campo Ciudad para buscar.');
        return;
      }

      buscarBtn.disabled = true;
      buscarBtn.textContent = 'Buscando...';

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dir)}&limit=1`,
          { headers: { 'Accept-Language': 'es' } }
        );
        const data = await res.json();
        if (data.length === 0) {
          alert('No se encontró la dirección. Intenta con menos detalles o haz clic en el mapa.');
          return;
        }
        const { lat, lon } = data[0];
        initMap();
        mapWrapper.style.display = 'block';
        document.getElementById('toggleMap').querySelector('span:last-child').textContent = 'Ocultar mapa';
        setTimeout(() => mapa.invalidateSize(), 100);
        mapa.setView([lat, lon], 16);
        setMarker(parseFloat(lat), parseFloat(lon));
      } catch {
        alert('Error al buscar la dirección. Intenta hacer clic directamente en el mapa.');
      } finally {
        buscarBtn.disabled = false;
        buscarBtn.textContent = 'Buscar dirección';
      }
    });
  }

  // ─── FORM SUBMIT ────────────────────────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const textoOriginal = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="material-symbols-rounded" style="animation:spin .7s linear infinite;">refresh</span> Publicando...';
    submitBtn.disabled = true;
    ocultarMensaje();

    const latVal = document.getElementById('latitud').value;
    const lngVal = document.getElementById('longitud').value;

    const formData = new FormData();
    const propiedad = {
      titulo:          form.titulo.value.trim(),
      descripcion:     form.descripcion.value.trim(),
      precio:          parseInt(form.precio.value),
      habitaciones:    parseInt(form.habitaciones.value),
      wc:              parseInt(form.wc.value),
      estacionamiento: parseInt(form.estacionamiento.value),
      metrosCuadrados: parseFloat(form.metrosCuadrados.value),
      direccion:       form.direccion?.value.trim() || '',
      barrio:          form.barrio?.value.trim() || '',
      ciudad:          form.ciudad?.value.trim() || '',
      latitud:         latVal ? parseFloat(latVal) : null,
      longitud:        lngVal ? parseFloat(lngVal) : null,
      visible:         true
    };

    formData.append('propiedad', new Blob([JSON.stringify(propiedad)], { type: 'application/json' }));

    const archivos = Array.from(form.imagen.files || []).slice(0, 4);
    archivos.forEach((file) => formData.append('imagenes', file));

    try {
      const response = await fetch('http://localhost:8080/api/propiedades', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Error al guardar');

      mostrarMensaje('✓ Propiedad creada y publicada correctamente', 'exito');
      form.reset();
      const preview = document.getElementById('previewWrapper');
      if (preview) preview.style.display = 'none';
      if (marcador && mapa) { mapa.removeLayer(marcador); marcador = null; }
      document.getElementById('coordsDisplay').style.display = 'none';

      setTimeout(() => { window.location.href = '/admin/propiedades.html'; }, 1800);

    } catch (err) {
      console.error(err);
      mostrarMensaje('Error al crear la propiedad. Verifica los datos e intenta de nuevo.', 'error');
    } finally {
      submitBtn.innerHTML = textoOriginal;
      submitBtn.disabled = false;
    }
  });

  function mostrarMensaje(texto, tipo) {
    if (!mensaje) return;
    mensaje.textContent = texto;
    mensaje.className   = `form-message ${tipo}`;
    mensaje.style.display = 'block';
    mensaje.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function ocultarMensaje() {
    if (!mensaje) return;
    mensaje.style.display = 'none';
    mensaje.className = 'form-message';
  }
});