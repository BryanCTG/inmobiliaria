package com.example.inmobiliaria.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.inmobiliaria.model.Propiedad;
import com.example.inmobiliaria.repository.PropiedadRepository;
import com.mongodb.client.gridfs.model.GridFSFile;

@RestController
@RequestMapping("/api/propiedades")
@CrossOrigin(origins = "*")
public class PropiedadRestController {

    @Autowired
    private PropiedadRepository repo;

    @Autowired
    private GridFsTemplate gridFsTemplate;

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
            @RequestPart(value = "imagen", required = false) MultipartFile imagen
    ) throws IOException {
        if (imagen != null && !imagen.isEmpty()) {
            var fileId = gridFsTemplate.store(imagen.getInputStream(), imagen.getOriginalFilename(), imagen.getContentType());
            propiedad.setImagenId(fileId.toString());
        }
        return repo.save(propiedad);
    }

    // Actualizar propiedad (incluye cambio de imagen)
    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    public Propiedad actualizar(
            @PathVariable String id,
            @RequestPart("propiedad") Propiedad nueva,
            @RequestPart(value = "imagen", required = false) MultipartFile imagen
    ) throws IOException {

        Propiedad existente = repo.findById(id).orElse(null);
        if (existente == null) return null;

        existente.setTitulo(nueva.getTitulo());
        existente.setDescripcion(nueva.getDescripcion());
        existente.setPrecio(nueva.getPrecio());
        existente.setWc(nueva.getWc());
        existente.setEstacionamiento(nueva.getEstacionamiento());
        existente.setHabitaciones(nueva.getHabitaciones());

        if (imagen != null && !imagen.isEmpty()) {
            // Eliminar imagen anterior si existe
            if (existente.getImagenId() != null) {
                gridFsTemplate.delete(
                    new org.springframework.data.mongodb.core.query.Query(
                        org.springframework.data.mongodb.core.query.Criteria.where("_id").is(existente.getImagenId())
                    )
                );
            }

            var fileId = gridFsTemplate.store(imagen.getInputStream(), imagen.getOriginalFilename(), imagen.getContentType());
            existente.setImagenId(fileId.toString());
        }

        return repo.save(existente);
    }

    // Eliminar propiedad
    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable String id) {
        Propiedad p = repo.findById(id).orElse(null);
        if (p != null && p.getImagenId() != null) {
            gridFsTemplate.delete(
                new org.springframework.data.mongodb.core.query.Query(
                    org.springframework.data.mongodb.core.query.Criteria.where("_id").is(p.getImagenId())
                )
            );
        }
        repo.deleteById(id);
    }

    // Servir imagen por ID
    @GetMapping("/imagen/{id}")
    public ResponseEntity<byte[]> obtenerImagen(@PathVariable String id) throws IOException {
        GridFSFile file = gridFsTemplate.findOne(
            new org.springframework.data.mongodb.core.query.Query(
                org.springframework.data.mongodb.core.query.Criteria.where("_id").is(id)
            )
        );

        if (file == null) return ResponseEntity.notFound().build();

        GridFsResource resource = gridFsTemplate.getResource(file);
        byte[] data = resource.getInputStream().readAllBytes();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(resource.getContentType()))
                .body(data);
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
