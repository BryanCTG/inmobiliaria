package com.example.inmobiliaria.Service;

import com.example.inmobiliaria.model.Usuario;
import com.example.inmobiliaria.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    public Usuario registrarAdmin(String nombre, String correo, String password) {
        Usuario usuario = new Usuario();
        usuario.setNombre(nombre);
        usuario.setEmail(correo);
        usuario.setPassword(BCrypt.hashpw(password, BCrypt.gensalt()));
        return usuarioRepository.save(usuario);
    }

    public Usuario obtenerPorCorreo(String correo) {
        return usuarioRepository.findByEmail(correo);
    }
}

