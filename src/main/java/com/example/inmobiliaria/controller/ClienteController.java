package com.example.inmobiliaria.controller;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.example.inmobiliaria.Service.UsuarioActual;
import com.example.inmobiliaria.model.Contacto;
import com.example.inmobiliaria.model.Usuario;
import com.example.inmobiliaria.repository.ContactoRepository;
import com.example.inmobiliaria.repository.PropiedadRepository;
import com.example.inmobiliaria.repository.UsuarioRepository;

/** Funciones de la cuenta de cliente: favoritos sincronizados y seguimiento de sus solicitudes. */
@RestController
@RequestMapping("/api/cliente")
public class ClienteController {

    private static final int MAXIMO_FAVORITOS = 200;

    private final UsuarioActual actual;
    private final UsuarioRepository usuarios;
    private final ContactoRepository contactos;
    private final PropiedadRepository propiedades;

    public ClienteController(UsuarioActual actual, UsuarioRepository usuarios, ContactoRepository contactos, PropiedadRepository propiedades) {
        this.actual = actual;
        this.usuarios = usuarios;
        this.contactos = contactos;
        this.propiedades = propiedades;
    }

    @GetMapping("/favoritos")
    public Map<String, List<String>> favoritos(Authentication auth) {
        return Map.of("ids", actual.requerido(auth).getFavoritos());
    }

    /** Reemplaza la lista completa (el navegador envía la unión de lo local y lo guardado). */
    @PutMapping("/favoritos")
    public Map<String, List<String>> guardarFavoritos(@RequestBody Map<String, List<String>> cuerpo, Authentication auth) {
        List<String> recibidos = cuerpo.get("ids");
        if (recibidos == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Falta la lista de favoritos.");

        LinkedHashSet<String> limpios = new LinkedHashSet<>();
        for (String id : recibidos) {
            if (id != null && id.matches("[A-Za-z0-9]{1,40}")) limpios.add(id);
            if (limpios.size() >= MAXIMO_FAVORITOS) break;
        }
        Usuario u = actual.requerido(auth);
        u.setFavoritos(new ArrayList<>(limpios));
        usuarios.save(u);
        return Map.of("ids", u.getFavoritos());
    }

    /** Mensajes y visitas que envió esta persona estando conectada, con el estado que les dio el equipo. */
    @GetMapping("/solicitudes")
    public List<Map<String, Object>> solicitudes(Authentication auth) {
        Usuario u = actual.requerido(auth);
        List<Contacto> lista = new ArrayList<>(contactos.findByUsuarioId(u.getId()));
        lista.sort(Comparator.comparing(Contacto::getCreado, Comparator.nullsLast(Comparator.<Instant>reverseOrder())));

        List<Map<String, Object>> salida = new ArrayList<>();
        for (Contacto c : lista) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", c.getId());
            String titulo = null;
            if (c.getCasaInteres() != null && !c.getCasaInteres().isBlank()) {
                titulo = propiedades.findById(c.getCasaInteres()).map(p -> p.getTitulo()).orElse(null);
            }
            m.put("propiedadId", c.getCasaInteres());
            m.put("propiedadTitulo", titulo);
            m.put("mensaje", c.getMensaje());
            m.put("medioContacto", c.getMedioContacto());
            m.put("fechaVisita", c.getFechaVisita());
            m.put("horaVisita", c.getHoraVisita());
            m.put("atendido", c.isAtendido());
            m.put("creado", c.getCreado());
            salida.add(m);
        }
        return salida;
    }
}
