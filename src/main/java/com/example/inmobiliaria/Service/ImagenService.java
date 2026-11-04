package com.example.inmobiliaria.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

/**
 * Guarda y elimina las imágenes de las propiedades en /uploads.
 * Nunca usa el nombre del cliente como ruta: genera un UUID y valida tipo y extensión.
 */
@Service
public class ImagenService {

    public static final int MAXIMO_POR_PROPIEDAD = 4;
    private static final String UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/";

    /** Devuelve los archivos útiles (no vacíos) de una o dos fuentes, o null si no hay. */
    public MultipartFile[] normalizar(MultipartFile[] imagenes, MultipartFile imagen) {
        if (imagenes != null && imagenes.length > 0) return imagenes;
        if (imagen != null && !imagen.isEmpty()) return new MultipartFile[]{imagen};
        return null;
    }

    public List<String> guardar(MultipartFile[] archivos) throws IOException {
        List<String> rutas = new ArrayList<>();
        if (archivos == null) return rutas;

        Files.createDirectories(Paths.get(UPLOAD_DIR));
        try {
            guardarTodas(archivos, rutas);
        } catch (IOException | RuntimeException e) {
            eliminar(rutas);          // si algo falla a medias no quedan archivos huérfanos
            throw e;
        }
        return rutas;
    }

    private void guardarTodas(MultipartFile[] archivos, List<String> rutas) throws IOException {
        for (MultipartFile archivo : archivos) {
            if (archivo.isEmpty()) continue;
            if (rutas.size() >= MAXIMO_POR_PROPIEDAD) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Puedes subir hasta " + MAXIMO_POR_PROPIEDAD + " imágenes.");
            }

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
    }

    /** Borra del disco las imágenes subidas (solo las que viven en /uploads). */
    public void eliminar(List<String> rutas) {
        if (rutas == null) return;
        for (String ruta : rutas) {
            if (ruta == null || !ruta.startsWith("/uploads/") || ruta.contains("..")) continue;
            try {
                Path archivo = Paths.get(UPLOAD_DIR + ruta.substring("/uploads/".length()));
                Files.deleteIfExists(archivo);
            } catch (IOException e) {
                // si no se puede borrar el archivo no se detiene la operación
            }
        }
    }
}
