package com.example.inmobiliaria.controller;

import java.io.IOException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.inmobiliaria.Service.ImagenService;
import com.example.inmobiliaria.Service.UsuarioActual;
import com.example.inmobiliaria.model.Propiedad;
import com.example.inmobiliaria.model.Usuario;
import com.example.inmobiliaria.repository.ContactoRepository;
import com.example.inmobiliaria.repository.PropiedadRepository;

import jakarta.validation.Valid;

/**
 * Cuenta de propietario: publica sus propiedades (quedan en revisión), ve su estado y cuántas consultas
 * y visitas recibe cada una. Nunca ve datos personales de las personas interesadas.
 */
@RestController
@RequestMapping("/api/propietario")
public class PropietarioController {

    private static final int MAXIMO_ENVIOS_POR_DIA = 5;
    private static final Set<String> CIUDADES = Set.of("Cartagena", "Bogota", "Medellin", "Barranquilla");
    /** Estados en los que el propietario puede corregir y volver a enviar. */
    private static final Set<String> EDITABLES = Set.of(Propiedad.PENDIENTE, Propiedad.RECHAZADA, Propiedad.RETIRADA);

    public record PropiedadPropia(Propiedad propiedad, long consultas, long visitas) { }

    private final UsuarioActual actual;
    private final PropiedadRepository propiedades;
    private final ContactoRepository contactos;
    private final ImagenService imagenes;

    public PropietarioController(UsuarioActual actual, PropiedadRepository propiedades,
                                 ContactoRepository contactos, ImagenService imagenes) {
        this.actual = actual;
        this.propiedades = propiedades;
        this.contactos = contactos;
        this.imagenes = imagenes;
    }

    @GetMapping("/propiedades")
    public List<PropiedadPropia> mias(Authentication auth) {
        Usuario u = actual.requerido(auth);
        List<Propiedad> lista = new ArrayList<>(propiedades.findByPropietarioId(u.getId()));
        lista.sort(Comparator.comparing(Propiedad::getCreado, Comparator.nullsLast(Comparator.<Instant>reverseOrder())));
        List<PropiedadPropia> salida = new ArrayList<>();
        for (Propiedad p : lista) {
            salida.add(new PropiedadPropia(p,
                    contactos.countByCasaInteres(p.getId()),
                    contactos.countByCasaInteresAndFechaVisitaNotNull(p.getId())));
        }
        return salida;
    }

    @GetMapping("/propiedades/{id}")
    public Propiedad una(@PathVariable String id, Authentication auth) {
        return propia(id, actual.requerido(auth));
    }

    @PostMapping(value = "/propiedades", consumes = {"multipart/form-data"})
    public Propiedad crear(
            @Valid @RequestPart("propiedad") Propiedad enviada,
            @RequestPart(value = "imagenes", required = false) MultipartFile[] archivos,
            Authentication auth
    ) throws IOException {
        Usuario u = actual.requerido(auth);

        long ultimas24h = propiedades.countByPropietarioIdAndCreadoAfter(u.getId(), Instant.now().minus(1, ChronoUnit.DAYS));
        if (ultimas24h >= MAXIMO_ENVIOS_POR_DIA) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Alcanzaste el máximo de " + MAXIMO_ENVIOS_POR_DIA + " envíos por día. Inténtalo mañana.");
        }

        Propiedad p = new Propiedad();
        copiarCampos(enviada, p);              // valida los datos ANTES de guardar archivos en disco

        List<String> rutas = imagenes.guardar(archivos);
        if (rutas.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sube al menos una foto de la propiedad.");
        }
        p.setImagenes(rutas);
        p.setPropietarioId(u.getId());          // lo fija el servidor, nunca el cuerpo de la petición
        p.setEstado(Propiedad.PENDIENTE);
        p.setVisible(false);
        p.setCreado(Instant.now());
        return propiedades.save(p);
    }

    @PutMapping(value = "/propiedades/{id}", consumes = {"multipart/form-data"})
    public Propiedad actualizar(
            @PathVariable String id,
            @Valid @RequestPart("propiedad") Propiedad enviada,
            @RequestPart(value = "imagenes", required = false) MultipartFile[] archivos,
            Authentication auth
    ) throws IOException {
        Propiedad p = propia(id, actual.requerido(auth));
        if (!EDITABLES.contains(p.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Una propiedad publicada no se edita directamente. Retírala y vuelve a enviarla con los cambios.");
        }

        copiarCampos(enviada, p);
        if (archivos != null && archivos.length > 0 && !archivos[0].isEmpty()) {
            List<String> nuevas = imagenes.guardar(archivos);
            imagenes.eliminar(p.getImagenes());
            p.setImagenes(nuevas);
        }
        p.setEstado(Propiedad.PENDIENTE);       // cada corrección vuelve a revisión
        p.setMotivoRechazo(null);
        p.setVisible(false);
        return propiedades.save(p);
    }

    @PostMapping("/propiedades/{id}/retirar")
    public Propiedad retirar(@PathVariable String id, Authentication auth) {
        Propiedad p = propia(id, actual.requerido(auth));
        p.setEstado(Propiedad.RETIRADA);
        p.setVisible(false);
        return propiedades.save(p);
    }

    /** Busca la propiedad y exige que sea de quien la pide; si no, responde 404 para no revelar que existe. */
    private Propiedad propia(String id, Usuario u) {
        return propiedades.findById(id)
                .filter(p -> u.getId().equals(p.getPropietarioId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Propiedad no encontrada"));
    }

    /** Copia solo los campos que un propietario puede definir (nada de estado, dueño ni visibilidad). */
    private void copiarCampos(Propiedad origen, Propiedad destino) {
        if (origen.getCiudad() == null || !CIUDADES.contains(origen.getCiudad())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Elige una ciudad de la lista: Cartagena, Bogotá, Medellín o Barranquilla.");
        }
        destino.setTitulo(origen.getTitulo());
        destino.setDescripcion(origen.getDescripcion());
        destino.setPrecio(origen.getPrecio());
        destino.setHabitaciones(origen.getHabitaciones());
        destino.setWc(origen.getWc());
        destino.setEstacionamiento(origen.getEstacionamiento());
        destino.setMetrosCuadrados(origen.getMetrosCuadrados());
        destino.setCiudad(origen.getCiudad());
        destino.setBarrio(origen.getBarrio());
        destino.setDireccion(origen.getDireccion());
    }
}
