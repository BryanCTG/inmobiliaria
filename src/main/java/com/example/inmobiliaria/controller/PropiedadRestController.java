package com.example.inmobiliaria.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;

import com.example.inmobiliaria.model.Propiedad;
import com.example.inmobiliaria.repository.PropiedadRepository;

@RestController
@RequestMapping("/api/propiedades")
@CrossOrigin(origins = "*")
public class PropiedadRestController {

    @Autowired
    private PropiedadRepository repo;

    private final String UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/";

    @GetMapping
    public List<Propiedad> listar() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public Propiedad obtenerPorId(@PathVariable String id, Authentication auth) {
        Propiedad p = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Propiedad no encontrada"));

        // Las propiedades ocultas solo las puede ver un administrador
        boolean esAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!p.isVisible() && !esAdmin) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Propiedad no encontrada");
        }
        return p;
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public Propiedad crear(
            @Valid @RequestPart("propiedad") Propiedad propiedad,
            @RequestPart(value = "imagenes", required = false) MultipartFile[] imagenes,
            @RequestPart(value = "imagen", required = false) MultipartFile imagen
    ) throws IOException {

        propiedad.setImagenes(guardarImagenes(normalizarImagenes(imagenes, imagen)));
        return repo.save(propiedad);
    }

    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    public Propiedad actualizar(
            @PathVariable String id,
            @Valid @RequestPart("propiedad") Propiedad nueva,
            @RequestPart(value = "imagenes", required = false) MultipartFile[] imagenes,
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

        // Actualizar coordenadas si vienen en el request
        existente.setLatitud(nueva.getLatitud());
        existente.setLongitud(nueva.getLongitud());

        MultipartFile[] archivos = normalizarImagenes(imagenes, imagen);
        if (archivos != null && archivos.length > 0) {
            existente.setImagenes(guardarImagenes(archivos));
        }

        return repo.save(existente);
    }

    private MultipartFile[] normalizarImagenes(MultipartFile[] imagenes, MultipartFile imagen) {
        if (imagenes != null && imagenes.length > 0) return imagenes;
        if (imagen != null && !imagen.isEmpty()) return new MultipartFile[]{imagen};
        return null;
    }

    /**
     * Guarda las imágenes en /uploads con un nombre seguro (UUID + extensión validada).
     * Rechaza archivos que no sean imágenes y nunca usa el nombre original del cliente como ruta.
     */
    private List<String> guardarImagenes(MultipartFile[] archivos) throws IOException {
        List<String> rutas = new ArrayList<>();
        if (archivos == null) return rutas;

        Files.createDirectories(Paths.get(UPLOAD_DIR));
        for (MultipartFile archivo : archivos) {
            if (archivo.isEmpty()) continue;

            String tipo = archivo.getContentType();
            if (tipo == null || !tipo.startsWith("image/")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solo se permiten imágenes");
            }

            String original = archivo.getOriginalFilename() == null ? "" : archivo.getOriginalFilename();
            int punto = original.lastIndexOf('.');
            String extension = punto >= 0 ? original.substring(punto).toLowerCase() : "";
            if (!extension.matches("\\.(jpg|jpeg|png|webp|gif)")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato de imagen no permitido");
            }

            String nombreArchivo = UUID.randomUUID() + extension;
            Files.write(Paths.get(UPLOAD_DIR + nombreArchivo), archivo.getBytes());
            rutas.add("/uploads/" + nombreArchivo);
        }
        return rutas;
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable String id) {
        Propiedad p = repo.findById(id).orElse(null);
        if (p != null) {
            if (p.getImagenes() != null) {
                for (String ruta : p.getImagenes()) {
                    try {
                        Path archivo = Paths.get(System.getProperty("user.dir") + ruta);
                        Files.deleteIfExists(archivo);
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                }
            }
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

    @GetMapping("/visibles")
    public List<Propiedad> listarVisibles() {
        return repo.findAll()
                .stream()
                .filter(Propiedad::isVisible)
                .toList();
    }
}