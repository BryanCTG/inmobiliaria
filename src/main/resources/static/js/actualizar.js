document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const cargando = document.getElementById('cargando');
  const form     = document.getElementById('formEditar');
  const mensaje  = document.getElementById('mensajeEditar');

  let mapa = null;
  let marcador = null;

  function initMap(lat, lng) {
    if (mapa) return;
    const center = (lat && lng) ? [lat, lng] : [4.711, -74.0721];
    const zoom   = (lat && lng) ? 15 : 6;

    mapa = L.map('mapaPicker').setView(center, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(mapa);

    if (lat && lng) setMarker(lat, lng);

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

  // Toggle map
  const toggleMapBtn = document.getElementById('toggleMap');
  const mapWrapper   = document.getElementById('mapWrapper');
  let existingLat = null, existingLng = null;

  if (toggleMapBtn) {
    toggleMapBtn.addEventListener('click', () => {
      const isHidden = mapWrapper.style.display === 'none' || !mapWrapper.style.display;
      mapWrapper.style.display = isHidden ? 'block' : 'none';
      toggleMapBtn.querySelector('span:last-child').textContent =
        isHidden ? 'Ocultar mapa' : 'Editar en mapa';

      if (isHidden) {
        setTimeout(() => {
          initMap(existingLat, existingLng);
          mapa.invalidateSize();
        }, 100);
      }
    });
  }

  // Geocoding
  const buscarBtn = document.getElementById('btnBuscarDir');
  if (buscarBtn) {
    buscarBtn.addEventListener('click', async () => {
      const dir = [
        document.getElementById('direccion')?.value,
        document.getElementById('barrio')?.value,
        document.getElementById('ciudad')?.value,
        'Colombia'
      ].filter(Boolean).join(', ');

      if (!dir.trim()) { alert('Completa al menos el campo Ciudad.'); return; }

      buscarBtn.disabled = true;
      buscarBtn.textContent = 'Buscando...';

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dir)}&limit=1`,
          { headers: { 'Accept-Language': 'es' } }
        );
        const data = await res.json();
        if (data.length === 0) {
          alert('No se encontró la dirección. Haz clic en el mapa.'); return;
        }
        const { lat, lon } = data[0];
        mapWrapper.style.display = 'block';
        document.getElementById('toggleMap').querySelector('span:last-child').textContent = 'Ocultar mapa';
        setTimeout(() => mapa.invalidateSize(), 100);

        if (!mapa) initMap(parseFloat(lat), parseFloat(lon));
        else {
          mapa.setView([lat, lon], 16);
          setMarker(parseFloat(lat), parseFloat(lon));
        }
      } catch {
        alert('Error al geocodificar. Haz clic en el mapa.');
      } finally {
        buscarBtn.disabled = false;
        buscarBtn.textContent = 'Buscar dirección';
      }
    });
  }

  if (!id) {
    if (cargando) cargando.innerHTML = '';
    mostrarMensaje('No se encontró el ID de la propiedad.', 'error');
    return;
  }

  try {
    const res = await fetch(`http://localhost:8080/api/propiedades/${id}`);
    if (!res.ok) throw new Error('No encontrado');
    const p = await res.json();

    document.getElementById('idPropiedad').value    = p.id;
    document.getElementById('titulo').value          = p.titulo;
    document.getElementById('descripcion').value     = p.descripcion;
    document.getElementById('precio').value          = p.precio;
    document.getElementById('wc').value              = p.wc;
    document.getElementById('estacionamiento').value = p.estacionamiento;
    document.getElementById('habitaciones').value    = p.habitaciones;
    document.getElementById('metrosCuadrados').value = p.metrosCuadrados || '';

    // Location fields
    if (document.getElementById('direccion'))
      document.getElementById('direccion').value = p.direccion || '';
    if (document.getElementById('barrio'))
      document.getElementById('barrio').value = p.barrio || '';
    if (document.getElementById('ciudad'))
      document.getElementById('ciudad').value = p.ciudad || '';

    // Coordinates
    if (p.latitud && p.longitud) {
      existingLat = p.latitud;
      existingLng = p.longitud;
      document.getElementById('latitud').value  = p.latitud;
      document.getElementById('longitud').value = p.longitud;
      const coordsEl = document.getElementById('coordsDisplay');
      if (coordsEl) {
        coordsEl.textContent = `${p.latitud.toFixed(5)}, ${p.longitud.toFixed(5)}`;
        coordsEl.style.display = 'inline-flex';
      }
    }

    const subtitulo = document.getElementById('nombrePropiedad');
    if (subtitulo) subtitulo.textContent = p.titulo;

    const preview = document.getElementById('preview');
    if (preview && Array.isArray(p.imagenes) && p.imagenes.length > 0) {
      preview.src = p.imagenes[0];
    } else if (preview) {
      preview.src = '/img/default.jpg';
    }

    if (cargando) cargando.style.display = 'none';
    if (form) form.style.display = 'block';

  } catch (err) {
    if (cargando) cargando.innerHTML = '';
    mostrarMensaje('Error al cargar la propiedad.', 'error');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const textoOriginal = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="material-symbols-rounded" style="animation:spin .7s linear infinite;">refresh</span> Guardando...';
    submitBtn.disabled = true;

    const latVal = document.getElementById('latitud').value;
    const lngVal = document.getElementById('longitud').value;

    const formData = new FormData();
    const propiedad = {
      titulo:          document.getElementById('titulo').value,
      descripcion:     document.getElementById('descripcion').value,
      precio:          parseFloat(document.getElementById('precio').value),
      wc:              parseInt(document.getElementById('wc').value),
      estacionamiento: parseInt(document.getElementById('estacionamiento').value),
      habitaciones:    parseInt(document.getElementById('habitaciones').value),
      metrosCuadrados: parseFloat(document.getElementById('metrosCuadrados').value),
      direccion:       document.getElementById('direccion')?.value || '',
      barrio:          document.getElementById('barrio')?.value || '',
      ciudad:          document.getElementById('ciudad')?.value || '',
      latitud:         latVal ? parseFloat(latVal) : null,
      longitud:        lngVal ? parseFloat(lngVal) : null
    };

    formData.append('propiedad', new Blob([JSON.stringify(propiedad)], { type: 'application/json' }));

    const archivos = Array.from(document.getElementById('imagen').files || []).slice(0, 4);
    archivos.forEach((file) => formData.append('imagenes', file));

    try {
      const res = await fetch(`http://localhost:8080/api/propiedades/${id}`, {
        method: 'PUT',
        body: formData
      });
      if (!res.ok) throw new Error('Error al actualizar');

      mostrarMensaje('✓ Propiedad actualizada correctamente', 'exito');
      setTimeout(() => { window.location.href = '/admin/propiedades.html'; }, 1500);

    } catch (err) {
      mostrarMensaje('Error al actualizar. Intenta de nuevo.', 'error');
    } finally {
      submitBtn.innerHTML = textoOriginal;
      submitBtn.disabled = false;
    }
  });

  function mostrarMensaje(texto, tipo) {
    if (!mensaje) return;
    mensaje.textContent = texto;
    mensaje.className = `form-message ${tipo}`;
    mensaje.style.display = 'block';
    mensaje.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});