package com.example.inmobiliaria.Service;

import com.example.inmobiliaria.model.Usuario;
import com.example.inmobiliaria.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Servicio para gestionar usuarios del sistema
 */
@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Crear un nuevo usuario con contraseña hasheada
     */
    public Usuario crearUsuario(String nombre, String username, String email, 
                                 String passwordPlano, String rol) {
        
        // Verificar que no exista el username
        if (usuarioRepository.existsByUsername(username)) {
            throw new RuntimeException("El username ya existe: " + username);
        }

        // Verificar que no exista el email


        // Crear el usuario
        Usuario usuario = new Usuario();
        usuario.setNombre(nombre);
        usuario.setUsername(username);
        usuario.setEmail(email);
        usuario.setPassword(passwordEncoder.encode(passwordPlano)); // Hashear contraseña
        usuario.setRol(rol);
        usuario.setEnabled(true);

        // Guardar en la base de datos
        return usuarioRepository.save(usuario);
    }

    /**
     * Buscar usuario por username
     */
    public Optional<Usuario> buscarPorUsername(String username) {
        return usuarioRepository.findByUsername(username);
    }

    
    /**
     * Actualizar contraseña de un usuario
     */
    public void actualizarPassword(String username, String nuevoPasswordPlano) {
        Usuario usuario = usuarioRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        usuario.setPassword(passwordEncoder.encode(nuevoPasswordPlano));
        usuarioRepository.save(usuario);
    }

    /**
     * Habilitar o deshabilitar usuario
     */
    public void cambiarEstado(String username, boolean enabled) {
        Usuario usuario = usuarioRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        usuario.setEnabled(enabled);
        usuarioRepository.save(usuario);
    }
}