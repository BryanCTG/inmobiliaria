package com.example.inmobiliaria.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.StringUtils;
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


    // LISTAR TODAS
    
    @GetMapping
    public List<Propiedad> listar() {
        return repo.findAll();
    }

    // OBTENER POR ID
   
    @GetMapping("/{id}")
    public Propiedad obtenerPorId(@PathVariable String id) {
        return repo.findById(id).orElse(null);
    }

  
    // CREAR PROPIEDAD
   
    @PostMapping(consumes = {"multipart/form-data"})
    public Propiedad crear(
            @RequestPart("propiedad") Propiedad propiedad,
            @RequestPart(value = "imagenes", required = false) MultipartFile[] imagenes,
            @RequestPart(value = "imagenes[]", required = false) MultipartFile[] imagenesArray,
            @RequestPart(value = "imagen", required = false) MultipartFile imagen
    ) throws IOException {

        List<String> rutas = new ArrayList<>();

        MultipartFile[] archivos = normalizarImagenes(imagenes, imagenesArray, imagen);

        if (archivos != null) {
            rutas.addAll(guardarImagenes(archivos));
        }

        propiedad.setImagenes(rutas);

        return repo.save(propiedad);
    }


    // ACTUALIZAR PROPIEDAD 
    
    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    public Propiedad actualizar(
            @PathVariable String id,
            @RequestPart("propiedad") Propiedad nueva,
            @RequestPart(value = "imagenes", required = false) MultipartFile[] imagenes,
            @RequestPart(value = "imagenes[]", required = false) MultipartFile[] imagenesArray,
            @RequestPart(value = "imagen", required = false) MultipartFile imagen
    ) throws IOException {

        Propiedad existente = repo.findById(id).orElse(null);

        if (existente == null) return null;

        //  ACTUALIZAR TODOS LOS CAMPOS
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

        //  SOLO CAMBIAR IMÁGENES SI VIENEN NUEVAS
        MultipartFile[] archivos = normalizarImagenes(imagenes, imagenesArray, imagen);
        if (archivos != null && archivos.length > 0) {
            List<String> rutas = guardarImagenes(archivos);
            existente.setImagenes(rutas);
        }

        return repo.save(existente);
    }

    
    

    private List<String> guardarImagenes(MultipartFile[] archivos) throws IOException {
        Path uploadsDir = asegurarCarpetaUploads();

        List<String> rutas = new ArrayList<>();
        for (MultipartFile archivo : archivos) {
            if (archivo.isEmpty()) {
                continue;
            }

            String nombreLimpio = StringUtils.cleanPath(archivo.getOriginalFilename());
            String nombreArchivo = UUID.randomUUID() + "_" + nombreLimpio;
            Path rutaArchivo = uploadsDir.resolve(nombreArchivo);
            Files.write(rutaArchivo, archivo.getBytes());
            rutas.add("/uploads/" + nombreArchivo);
        }

        return rutas;
    }

    private MultipartFile[] normalizarImagenes(MultipartFile[] imagenes, MultipartFile[] imagenesArray, MultipartFile imagen) {
        if (imagenes != null && imagenes.length > 0) {
            return imagenes;
        }

        if (imagenesArray != null && imagenesArray.length > 0) {
            return imagenesArray;
        }

        if (imagen != null && !imagen.isEmpty()) {
            return new MultipartFile[]{imagen};
        }

        return null;
    }

    private Path asegurarCarpetaUploads() throws IOException {
        Path staticDir = Paths.get("src/main/resources/static");

        if (!Files.exists(staticDir)) {
            staticDir = Paths.get("static");
        }

        Path uploadsDir = staticDir.resolve("uploads");
        Files.createDirectories(uploadsDir);

        return uploadsDir;
    }


    private Path resolverRutaDesdeStatic(String rutaRelativa) {
        String rutaNormalizada = rutaRelativa.startsWith("/")
                ? rutaRelativa.substring(1)
                : rutaRelativa;

        Path staticDir = Paths.get("src/main/resources/static");
        if (!Files.exists(staticDir)) {
            staticDir = Paths.get("static");
        }

        return staticDir.resolve(rutaNormalizada);
    }

    // ELIMINAR PROPIEDAD
   
    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable String id) {

        Propiedad p = repo.findById(id).orElse(null);

        if (p != null) {

            if (p.getImagenes() != null) {

                for (String ruta : p.getImagenes()) {

                    try {

                        Path archivo = resolverRutaDesdeStatic(ruta);

                        Files.deleteIfExists(archivo);

                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                }
            }

            repo.deleteById(id);
        }
    }

    
    // CAMBIAR VISIBILIDAD
    
    @PatchMapping("/{id}/visibilidad")
    public Propiedad cambiarVisibilidad(@PathVariable String id) {

        Propiedad p = repo.findById(id).orElse(null);

        if (p != null) {

            p.setVisible(!p.isVisible());

            repo.save(p);
        }

        return p;
    }

    
    // LISTAR SOLO VISIBLES
    
    @GetMapping("/visibles")
    public List<Propiedad> listarVisibles() {

        return repo.findAll()
                .stream()
                .filter(Propiedad::isVisible)
                .toList();
    }
}