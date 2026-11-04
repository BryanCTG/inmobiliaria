package com.example.inmobiliaria.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.example.inmobiliaria.Service.UsuarioActual;
import com.example.inmobiliaria.model.Usuario;
import com.example.inmobiliaria.repository.UsuarioRepository;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Perfil y contraseña de la persona conectada (clientes y propietarios). */
@RestController
@RequestMapping("/api/cuenta")
public class CuentaController {

    public record Perfil(
            @NotBlank(message = "El nombre es obligatorio") @Size(max = 100, message = "El nombre no puede superar 100 caracteres") String nombre,
            @Pattern(regexp = "^$|^[0-9+\\s()-]{7,20}$", message = "El celular no es válido") String telefono) { }

    public record CambioPassword(
            @NotBlank(message = "Escribe tu contraseña actual") String actual,
            @NotBlank(message = "Escribe la nueva contraseña") @Size(min = 8, max = 72, message = "La nueva contraseña debe tener entre 8 y 72 caracteres") String nueva) { }

    private final UsuarioActual actual;
    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;

    public CuentaController(UsuarioActual actual, UsuarioRepository usuarios, PasswordEncoder encoder) {
        this.actual = actual;
        this.usuarios = usuarios;
        this.encoder = encoder;
    }

    @GetMapping("/perfil")
    public Map<String, Object> perfil(Authentication auth) {
        Usuario u = actual.requerido(auth);
        return Map.of("nombre", u.getNombre(), "correo", u.getEmail(), "telefono", u.getTelefono() == null ? "" : u.getTelefono(), "rol", u.getRol());
    }

    @PutMapping("/perfil")
    public Map<String, String> actualizar(@Valid @RequestBody Perfil p, Authentication auth) {
        Usuario u = actual.requerido(auth);
        String telefono = p.telefono() == null ? "" : p.telefono().trim();
        if ("PROPIETARIO".equals(u.getRol()) && telefono.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Un propietario necesita un celular de contacto.");
        }
        u.setNombre(p.nombre().trim());
        u.setTelefono(telefono);
        usuarios.save(u);
        return Map.of("mensaje", "Perfil actualizado");
    }

    @PutMapping("/password")
    public Map<String, String> cambiarPassword(@Valid @RequestBody CambioPassword c, Authentication auth) {
        Usuario u = actual.requerido(auth);
        if (!encoder.matches(c.actual(), u.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña actual no es correcta.");
        }
        if (!c.nueva().matches(".*[A-Za-z].*") || !c.nueva().matches(".*\\d.*")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La nueva contraseña debe incluir al menos una letra y un número.");
        }
        u.setPassword(encoder.encode(c.nueva()));
        usuarios.save(u);
        return Map.of("mensaje", "Contraseña actualizada");
    }
}
