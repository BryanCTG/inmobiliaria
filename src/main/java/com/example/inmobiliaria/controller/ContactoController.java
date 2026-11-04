package com.example.inmobiliaria.controller;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.example.inmobiliaria.Service.NotificacionService;
import com.example.inmobiliaria.Service.RateLimitService;
import com.example.inmobiliaria.model.Contacto;
import com.example.inmobiliaria.model.Propiedad;
import com.example.inmobiliaria.repository.ContactoRepository;
import com.example.inmobiliaria.repository.PropiedadRepository;
import com.example.inmobiliaria.repository.UsuarioRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/contacto")
public class ContactoController {

    private static final ZoneId BOGOTA = ZoneId.of("America/Bogota");
    /** Horas en punto en las que se pueden pedir visitas (lunes a viernes). */
    private static final Set<String> HORAS_VISITA = Set.of(
            "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00");
    private static final int DIAS_MAXIMOS = 60;

    private final ContactoRepository contactoRepository;
    private final PropiedadRepository propiedadRepository;
    private final NotificacionService notificaciones;
    private final RateLimitService limite;
    private final UsuarioRepository usuarios;

    @Value("${app.ratelimit.contacto.max:10}")
    private int maxPorVentana;

    @Value("${app.ratelimit.contacto.ventana:600}")
    private long ventanaSegundos;

    public ContactoController(ContactoRepository contactoRepository, PropiedadRepository propiedadRepository,
                              NotificacionService notificaciones, RateLimitService limite,
                              UsuarioRepository usuarios) {
        this.contactoRepository = contactoRepository;
        this.propiedadRepository = propiedadRepository;
        this.notificaciones = notificaciones;
        this.limite = limite;
        this.usuarios = usuarios;
    }

    // Guardar contacto (público)
    @PostMapping
    public Contacto guardarContacto(@Valid @RequestBody Contacto contacto, HttpServletRequest request,
                                    org.springframework.security.core.Authentication auth) {
        if (!limite.permitir("contacto:" + request.getRemoteAddr(), maxPorVentana, ventanaSegundos)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Enviaste varios mensajes seguidos. Espera unos minutos antes de escribir de nuevo.");
        }

        contacto.setId(null);                       // El ID lo genera la base de datos, nunca el cliente
        contacto.setAtendido(false);                // Siempre inicia como pendiente
        contacto.setUsuarioId(null);                // Se asigna solo desde la sesión, nunca desde el cuerpo
        if (auth != null && !(auth instanceof org.springframework.security.authentication.AnonymousAuthenticationToken)) {
            usuarios.findByUsername(auth.getName())
                    .filter(u -> !"ADMIN".equals(u.getRol()))
                    .ifPresent(u -> contacto.setUsuarioId(u.getId()));
        }
        contacto.setCreado(Instant.now());

        Propiedad propiedad = null;
        if (contacto.getCasaInteres() != null && !contacto.getCasaInteres().isBlank()) {
            propiedad = propiedadRepository.findById(contacto.getCasaInteres()).orElse(null);
        }

        validarVisita(contacto, propiedad);

        Contacto guardado = contactoRepository.save(contacto);
        notificaciones.contactoRecibido(guardado, propiedad);   // en segundo plano
        return guardado;
    }

    /** Si pide visita: propiedad publicada, fecha entre mañana y 60 días, lunes a viernes y hora permitida. */
    private void validarVisita(Contacto c, Propiedad propiedad) {
        if (c.getFechaVisita() == null) {
            c.setHoraVisita(null);
            return;
        }
        if (propiedad == null || !propiedad.isPublica()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Para agendar una visita elige una propiedad disponible.");
        }
        LocalDate hoy = LocalDate.now(BOGOTA);
        LocalDate fecha = c.getFechaVisita();
        if (!fecha.isAfter(hoy) || fecha.isAfter(hoy.plusDays(DIAS_MAXIMOS))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Elige una fecha desde mañana y hasta dentro de " + DIAS_MAXIMOS + " días.");
        }
        DayOfWeek dia = fecha.getDayOfWeek();
        if (dia == DayOfWeek.SATURDAY || dia == DayOfWeek.SUNDAY) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Las visitas se agendan de lunes a viernes.");
        }
        if (c.getHoraVisita() == null || !HORAS_VISITA.contains(c.getHoraVisita())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Elige una hora entre las 8:00 y las 17:00.");
        }
    }

    // Listar todos (admin)
    @GetMapping
    public List<Contacto> listarContactos() {
        return contactoRepository.findAll();
    }

    // Toggle atendido/pendiente (admin)
    @PatchMapping("/{id}/atendido")
    public Contacto toggleAtendido(@PathVariable String id) {
        Contacto c = contactoRepository.findById(id).orElse(null);
        if (c != null) {
            c.setAtendido(!c.isAtendido());
            contactoRepository.save(c);
        }
        return c;
    }

    // Eliminar contacto (admin)
    @DeleteMapping("/{id}")
    public void eliminarContacto(@PathVariable String id) {
        contactoRepository.deleteById(id);
    }
}
