package com.example.inmobiliaria.config;

import java.security.SecureRandom;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.inmobiliaria.model.Usuario;
import com.example.inmobiliaria.repository.UsuarioRepository;

/**
 * Crea el usuario administrador la primera vez que arranca la aplicación.
 *
 * La contraseña se toma de la variable de entorno ADMIN_PASSWORD (propiedad app.admin.password).
 * Si no se define, se genera una contraseña aleatoria que se muestra UNA sola vez en la consola.
 * Nunca existe una contraseña por defecto conocida.
 */
@Configuration
public class DataInitializer {

    private static final String ALFABETO =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${app.admin.username:admin}")
    private String adminUsername;

    @Value("${app.admin.password:${ADMIN_PASSWORD:}}")
    private String adminPassword;

    @Bean
    public CommandLineRunner initData() {
        return args -> {

            if (usuarioRepository.existsByUsername(adminUsername)) {
                System.out.println("Usuario administrador ya existe en la base de datos");
                return;
            }

            boolean generada = adminPassword == null || adminPassword.isBlank();
            String password = generada ? generarPassword(16) : adminPassword;

            Usuario admin = new Usuario();
            admin.setNombre("Administrador");
            admin.setUsername(adminUsername);
            admin.setEmail("admin@inmobiliaria.com");
            admin.setPassword(passwordEncoder.encode(password));
            admin.setRol("ADMIN");
            admin.setEnabled(true);
            usuarioRepository.save(admin);

            System.out.println("===========================================");
            System.out.println("Usuario administrador creado: " + adminUsername);
            if (generada) {
                System.out.println("Contraseña generada (guárdala, no se vuelve a mostrar): " + password);
            } else {
                System.out.println("Contraseña tomada de ADMIN_PASSWORD.");
            }
            System.out.println("===========================================");
        };
    }

    private static String generarPassword(int largo) {
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(largo);
        for (int i = 0; i < largo; i++) {
            sb.append(ALFABETO.charAt(random.nextInt(ALFABETO.length())));
        }
        return sb.toString();
    }
}
