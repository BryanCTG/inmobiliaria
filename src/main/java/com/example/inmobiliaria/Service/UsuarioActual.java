package com.example.inmobiliaria.Service;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.example.inmobiliaria.model.Usuario;
import com.example.inmobiliaria.repository.UsuarioRepository;

/** Resuelve el usuario de la sesión actual a partir del Authentication de Spring Security. */
@Component
public class UsuarioActual {

    private final UsuarioRepository usuarios;

    public UsuarioActual(UsuarioRepository usuarios) {
        this.usuarios = usuarios;
    }

    public Usuario requerido(Authentication auth) {
        if (auth == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Inicia sesión para continuar.");
        return usuarios.findByUsername(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tu sesión ya no es válida. Inicia sesión de nuevo."));
    }
}
