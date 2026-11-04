package com.example.inmobiliaria.controller;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.example.inmobiliaria.Service.RateLimitService;
import com.example.inmobiliaria.model.Usuario;
import com.example.inmobiliaria.repository.UsuarioRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Registro público de cuentas (cliente o propietario) y consulta de la sesión actual. */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Set<String> ROLES_PUBLICOS = Set.of("CLIENTE", "PROPIETARIO");

    public record Registro(
            @NotBlank(message = "El nombre es obligatorio") @Size(max = 100, message = "El nombre no puede superar 100 caracteres") String nombre,
            @NotBlank(message = "El correo es obligatorio") @Email(message = "El correo no es válido") @Size(max = 150, message = "El correo no puede superar 150 caracteres") String correo,
            @NotBlank(message = "La contraseña es obligatoria") @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres") String password,
            @NotBlank(message = "Elige el tipo de cuenta") String rol,
            @Pattern(regexp = "^$|^[0-9+\\s()-]{7,20}$", message = "El celular no es válido") String telefono) { }

    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;
    private final RateLimitService limite;

    public AuthController(UsuarioRepository usuarios, PasswordEncoder encoder, RateLimitService limite) {
        this.usuarios = usuarios;
        this.encoder = encoder;
        this.limite = limite;
    }

    @PostMapping("/registro")
    public ResponseEntity<Map<String, String>> registrar(@Valid @RequestBody Registro r, HttpServletRequest request) {
        String rol = r.rol().trim().toUpperCase();
        if (!ROLES_PUBLICOS.contains(rol)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El tipo de cuenta no es válido.");
        }
        if (!r.password().matches(".*[A-Za-z].*") || !r.password().matches(".*\\d.*")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña debe incluir al menos una letra y un número.");
        }
        String telefono = r.telefono() == null ? "" : r.telefono().trim();
        if ("PROPIETARIO".equals(rol) && telefono.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Para publicar propiedades necesitamos un celular de contacto.");
        }

        String correo = r.correo().trim().toLowerCase();
        if (usuarios.existsByUsername(correo) || usuarios.existsByEmail(correo)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una cuenta con ese correo. Inicia sesión.");
        }

        // El límite cuenta solo las cuentas realmente creadas, no los intentos con datos inválidos
        if (!limite.permitir("registro:" + request.getRemoteAddr(), 10, 3600)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Creaste varias cuentas seguidas. Inténtalo de nuevo más tarde.");
        }

        Usuario u = new Usuario();
        u.setNombre(r.nombre().trim());
        u.setUsername(correo);          // se inicia sesión con el correo
        u.setEmail(correo);
        u.setPassword(encoder.encode(r.password()));
        u.setRol(rol);                  // nunca ADMIN desde el registro público
        u.setEnabled(true);
        u.setTelefono(telefono);
        u.setCreado(Instant.now());
        usuarios.save(u);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("mensaje", "Cuenta creada"));
    }

    /** Quién está conectado. Responde 200 también sin sesión, para que el sitio no genere errores. */
    @GetMapping("/yo")
    public Map<String, Object> yo(Authentication auth) {
        Map<String, Object> r = new LinkedHashMap<>();
        if (auth == null || auth instanceof AnonymousAuthenticationToken || !auth.isAuthenticated()) {
            r.put("autenticado", false);
            return r;
        }
        Usuario u = usuarios.findByUsername(auth.getName()).orElse(null);
        if (u == null) {
            r.put("autenticado", false);
            return r;
        }
        r.put("autenticado", true);
        r.put("nombre", u.getNombre());
        r.put("correo", u.getEmail());
        r.put("telefono", u.getTelefono() == null ? "" : u.getTelefono());
        r.put("rol", u.getRol());
        return r;
    }
}
