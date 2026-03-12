package com.example.inmobiliaria.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;

import com.example.inmobiliaria.model.Propiedad;
import com.example.inmobiliaria.repository.PropiedadRepository;

@RestController
@RequestMapping("/api/propiedades")
@CrossOrigin(origins = "*")
public class PropiedadRestController {

    @Autowired
    private PropiedadRepository repo;

    private final String UPLOAD_DIR = "src/main/resources/static/uploads/";

    // Listar todas
    @GetMapping
    public List<Propiedad> listar() {
        return repo.findAll();
    }

    // Obtener una propiedad
    @GetMapping("/{id}")
    public Propiedad obtenerPorId(@PathVariable String id) {
        return repo.findById(id).orElse(null);
    }

    // Crear propiedad
    @PostMapping(consumes = {"multipart/form-data"})
    public Propiedad crear(
            @RequestPart("propiedad") Propiedad propiedad,
            @RequestPart(value = "imagenes", required = false) MultipartFile[] imagenes
    ) throws IOException {

        List<String> rutas = new ArrayList<>();

        if (imagenes != null) {

            for (MultipartFile imagen : imagenes) {

                if (!imagen.isEmpty()) {

                    String nombreArchivo = System.currentTimeMillis() + "_" + imagen.getOriginalFilename();

                    Path rutaArchivo = Paths.get(UPLOAD_DIR + nombreArchivo);

                    Files.write(rutaArchivo, imagen.getBytes());

                    rutas.add("/uploads/" + nombreArchivo);
                }
            }
        }

        propiedad.setImagenes(rutas);

        return repo.save(propiedad);
    }

    // Actualizar propiedad
    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    public Propiedad actualizar(
            @PathVariable String id,
            @RequestPart("propiedad") Propiedad nueva,
            @RequestPart(value = "imagenes", required = false) MultipartFile[] imagenes
    ) throws IOException {

        Propiedad existente = repo.findById(id).orElse(null);

        if (existente == null) return null;

        existente.setTitulo(nueva.getTitulo());
        existente.setDescripcion(nueva.getDescripcion());
        existente.setPrecio(nueva.getPrecio());
        existente.setWc(nueva.getWc());
        existente.setEstacionamiento(nueva.getEstacionamiento());
        existente.setHabitaciones(nueva.getHabitaciones());

        if (imagenes != null && imagenes.length > 0) {

            List<String> rutas = new ArrayList<>();

            for (MultipartFile imagen : imagenes) {

                if (!imagen.isEmpty()) {

                    String nombreArchivo = System.currentTimeMillis() + "_" + imagen.getOriginalFilename();

                    Path rutaArchivo = Paths.get(UPLOAD_DIR + nombreArchivo);

                    Files.write(rutaArchivo, imagen.getBytes());

                    rutas.add("/uploads/" + nombreArchivo);
                }
            }

            existente.setImagenes(rutas);
        }

        return repo.save(existente);
    }

    // Eliminar propiedad
    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable String id) {

        Propiedad p = repo.findById(id).orElse(null);

        if (p != null) {

            if (p.getImagenes() != null) {

                for (String ruta : p.getImagenes()) {

                    try {

                        Path archivo = Paths.get("src/main/resources/static" + ruta);

                        Files.deleteIfExists(archivo);

                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                }
            }

            repo.deleteById(id);
        }
    }

    // Cambiar visibilidad
    @PatchMapping("/{id}/visibilidad")
    public Propiedad cambiarVisibilidad(@PathVariable String id) {

        Propiedad p = repo.findById(id).orElse(null);

        if (p != null) {

            p.setVisible(!p.isVisible());

            repo.save(p);
        }

        return p;
    }

    // Listar solo visibles
    @GetMapping("/visibles")
    public List<Propiedad> listarVisibles() {

        return repo.findAll()
                .stream()
                .filter(Propiedad::isVisible)
                .toList();
    }
}