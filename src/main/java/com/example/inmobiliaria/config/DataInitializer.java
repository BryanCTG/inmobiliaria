package com.example.inmobiliaria.config;

import com.example.inmobiliaria.model.Usuario;
import com.example.inmobiliaria.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Inicializa datos básicos en la base de datos
 * Se ejecuta automáticamente al iniciar la aplicación
 */
@Configuration
public class DataInitializer {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Crea un usuario administrador por defecto si no existe
     */
    @Bean
    public CommandLineRunner initData() {
        return args -> {
            
            // Verificar si ya existe el usuario admin
            if (!usuarioRepository.existsByUsername("admin")) {
                
                System.out.println("===========================================");
                System.out.println("CREANDO USUARIO ADMINISTRADOR POR DEFECTO");
                System.out.println("===========================================");
                
                // Crear usuario admin
                Usuario admin = new Usuario();
                admin.setNombre("Administrador");
                admin.setUsername("admin");
                admin.setEmail("admin@inmobiliaria.com");
                admin.setPassword(passwordEncoder.encode("admin123")); // Contraseña hasheada
                admin.setRol("ADMIN");
                admin.setEnabled(true);
                
                usuarioRepository.save(admin);
                
                System.out.println("✓ Usuario administrador creado exitosamente");
                System.out.println("  Username: admin");
                System.out.println("  Password: admin123");
                System.out.println("  Email: admin@inmobiliaria.com");
                System.out.println("===========================================");
                System.out.println("");
                System.out.println("⚠️  IMPORTANTE: Cambia esta contraseña en producción");
                System.out.println("");
                
            } else {
                System.out.println("Usuario administrador ya existe en la base de datos");
            }
        };
    }
}