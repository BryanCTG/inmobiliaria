package com.example.inmobiliaria.controller;

import com.example.inmobiliaria.model.Usuario;
import com.example.inmobiliaria.Service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    // Registro
    @PostMapping("/registro")
    public ResponseEntity<?> registrar(@RequestBody Usuario usuario) {
        Usuario nuevoUsuario = usuarioService.registrarAdmin(usuario.getNombre(), usuario.getEmail(), usuario.getPassword());
        return ResponseEntity.ok(nuevoUsuario);
    }

    // Login
    @PostMapping("/login")
    // In UsuarioService.java
    public boolean validarCredenciales(String nombre, String email, String password) {
        // Implement the logic to validate the credentials here
        // For example:
       Usuario usuario = usuarioService.obtenerPorCorreo(email);
        if (usuario != null && usuario.getPassword().equals(password)) {
            return true;
        } else {
            return false;
        }
    }
}