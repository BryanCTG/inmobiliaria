package com.example.inmobiliaria.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.mongodb.client.gridfs.model.GridFSFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/imagenes")
@CrossOrigin(origins = "*")
public class ImagenController {

    @Autowired
    private GridFsTemplate gridFsTemplate;

    //  Subir imagen
    @PostMapping("/subir")
    public ResponseEntity<String> subirImagen(@RequestParam("file") MultipartFile file) throws IOException {
        String id = gridFsTemplate.store(file.getInputStream(), file.getOriginalFilename(), file.getContentType()).toString();
        return ResponseEntity.ok(id); // devuelve el ID de la imagen
    }

    //  Obtener imagen por ID
    @GetMapping("/{id}")
    public ResponseEntity<byte[]> obtenerImagen(@PathVariable String id) throws IOException {
        GridFSFile file = gridFsTemplate.findOne(new Query(Criteria.where("_id").is(id)));

        if (file == null) {
            return ResponseEntity.notFound().build();
        }

        GridFsResource resource = gridFsTemplate.getResource(file);
        byte[] data = resource.getInputStream().readAllBytes();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getFilename() + "\"")
                .contentType(MediaType.parseMediaType(file.getMetadata().getString("_contentType")))
                .body(data);
    }
}
