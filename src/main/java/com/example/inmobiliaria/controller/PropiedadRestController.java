package com.example.inmobiliaria.controller;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.inmobiliaria.Service.ImagenService;
import com.example.inmobiliaria.model.Propiedad;
import com.example.inmobiliaria.model.Usuario;
import com.example.inmobiliaria.repository.PropiedadRepository;
import com.example.inmobiliaria.repository.UsuarioRepository;

import jakarta.validation.Valid;

/**
 * API de propiedades. Lectura pública solo de lo publicado; crear, editar, borrar y revisar son de ADMIN
 * (las reglas están en SecurityConfig). Las propiedades de propietarios las gestiona PropietarioController.
 */
@RestController
@RequestMapping("/api/propiedades")
public class PropiedadRestController {

    @Autowired
    private PropiedadRepository repo;

    @Autowired
    private UsuarioRepository usuarios;

    @Autowired
    private ImagenService imagenes;

    /** Todas, incluidas las pendientes y rechazadas (solo ADMIN). */
    @GetMapping
    public List<Propiedad> listar() {
        List<Propiedad> todas = repo.findAll();
        for (Propiedad p : todas) {
            if (p.getPropietarioId() == null) continue;
            usuarios.findById(p.getPropietarioId()).ifPresent(u -> {
                p.setPropietarioNombre(u.getNombre());
                p.setPropietarioContacto(u.getEmail() + (u.getTelefono() != null && !u.getTelefono().isBlank() ? " · " + u.getTelefono() : ""));
            });
        }
        return todas;
    }

    @GetMapping("/{id}")
    public Propiedad obtenerPorId(@PathVariable String id, Authentication auth) {
        Propiedad p = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Propiedad no encontrada"));

        // Lo que no está publicado solo lo puede ver un administrador
        boolean esAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!p.isPublica() && !esAdmin) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Propiedad no encontrada");
        }
        return p;
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public Propiedad crear(
            @Valid @RequestPart("propiedad") Propiedad propiedad,
            @RequestPart(value = "imagenes", required = false) MultipartFile[] archivos,
            @RequestPart(value = "imagen", required = false) MultipartFile imagen
    ) throws IOException {
        propiedad.setId(null);
        propiedad.setImagenes(imagenes.guardar(imagenes.normalizar(archivos, imagen)));
        propiedad.setEstado(Propiedad.PUBLICADA);       // el admin publica directamente
        propiedad.setMotivoRechazo(null);
        propiedad.setCreado(Instant.now());
        return repo.save(propiedad);
    }

    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    public Propiedad actualizar(
            @PathVariable String id,
            @Valid @RequestPart("propiedad") Propiedad nueva,
            @RequestPart(value = "imagenes", required = false) MultipartFile[] archivos,
            @RequestPart(value = "imagen", required = false) MultipartFile imagen
    ) throws IOException {

        Propiedad existente = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Propiedad no encontrada"));

        existente.setTitulo(nueva.getTitulo());
        existente.setDescripcion(nueva.getDescripcion());
        existente.setPrecio(nueva.getPrecio());
        existente.setWc(nueva.getWc());
        existente.setEstacionamiento(nueva.getEstacionamiento());
        existente.setHabitaciones(nueva.getHabitaciones());
        existente.setCiudad(nueva.getCiudad());
        existente.setBarrio(nueva.getBarrio());
        existente.setDireccion(nueva.getDireccion());
        existente.setMetrosCuadrados(nueva.getMetrosCuadrados());
        existente.setLatitud(nueva.getLatitud());
        existente.setLongitud(nueva.getLongitud());

        MultipartFile[] recibidas = imagenes.normalizar(archivos, imagen);
        if (recibidas != null && recibidas.length > 0) {
            existente.setImagenes(imagenes.guardar(recibidas));
        }
        return repo.save(existente);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable String id) {
        Propiedad p = repo.findById(id).orElse(null);
        if (p != null) {
            imagenes.eliminar(p.getImagenes());
            repo.deleteById(id);
        }
    }

    @PatchMapping("/{id}/visibilidad")
    public Propiedad cambiarVisibilidad(@PathVariable String id) {
        Propiedad p = repo.findById(id).orElse(null);
        if (p != null) {
            p.setVisible(!p.isVisible());
            repo.save(p);
        }
        return p;
    }

    /** Revisión de una propiedad enviada por un propietario: PUBLICADA o RECHAZADA (con motivo). */
    @PatchMapping("/{id}/estado")
    public Propiedad revisar(@PathVariable String id, @RequestBody Map<String, String> cuerpo) {
        Propiedad p = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Propiedad no encontrada"));
        String estado = cuerpo.get("estado");

        if (Propiedad.PUBLICADA.equals(estado)) {
            p.setEstado(Propiedad.PUBLICADA);
            p.setVisible(true);
            p.setMotivoRechazo(null);
        } else if (Propiedad.RECHAZADA.equals(estado)) {
            String motivo = cuerpo.get("motivo") == null ? "" : cuerpo.get("motivo").trim();
            if (motivo.length() < 5) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escribe el motivo del rechazo para que el propietario sepa qué corregir.");
            }
            p.setEstado(Propiedad.RECHAZADA);
            p.setVisible(false);
            p.setMotivoRechazo(motivo.length() > 500 ? motivo.substring(0, 500) : motivo);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El estado debe ser PUBLICADA o RECHAZADA.");
        }
        return repo.save(p);
    }

    @GetMapping("/visibles")
    public List<Propiedad> listarVisibles() {
        return repo.findAll()
                .stream()
                .filter(Propiedad::isPublica)
                .toList();
    }
}
