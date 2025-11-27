package com.example.inmobiliaria.config;

import java.util.List;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.example.inmobiliaria.model.Administrador;
import com.example.inmobiliaria.repository.AdministradorRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final AdministradorRepository repo;

    public CustomUserDetailsService(AdministradorRepository repo) {
        this.repo = repo;
    }

    @Override
    public UserDetails loadUserByUsername(String correo) throws UsernameNotFoundException {
        Administrador admin = repo.findByCorreo(correo);
        if (admin == null) {
            throw new UsernameNotFoundException("Administrador no encontrado: " + correo);
        }
        return User.builder()
                .username(admin.getCorreo())
                .password(admin.getContrasena())
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_ADMIN")))
                .build();
    }
}
