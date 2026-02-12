package com.example.inmobiliaria;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Utilidad para generar hashes de contraseñas
 * Útil para crear usuarios directamente en MongoDB
 */
public class PasswordHashGenerator {
    
    public static void main(String[] args) {
        
        if (args.length == 0) {
            System.out.println("===========================================");
            System.out.println("GENERADOR DE HASH DE CONTRASEÑAS");
            System.out.println("===========================================");
            System.out.println("");
            System.out.println("Uso: java PasswordHashGenerator <contraseña>");
            System.out.println("");
            System.out.println("Ejemplo:");
            System.out.println("  java PasswordHashGenerator miPassword123");
            System.out.println("");
            
            // Generar ejemplo
            System.out.println("Ejemplo de hash generado:");
            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
            String hash = encoder.encode("ejemplo123");
            System.out.println("  Password: ejemplo123");
            System.out.println("  Hash: " + hash);
            System.out.println("");
            
            return;
        }
        
        String password = args[0];
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode(password);
        
        System.out.println("===========================================");
        System.out.println("Hash generado exitosamente");
        System.out.println("===========================================");
        System.out.println("");
        System.out.println("Password original: " + password);
        System.out.println("Hash BCrypt: " + hash);
        System.out.println("");
        System.out.println("Puedes usar este hash para insertar usuarios en MongoDB:");
        System.out.println("");
        System.out.println("db.usuarios.insertOne({");
        System.out.println("  \"nombre\": \"Tu Nombre\",");
        System.out.println("  \"username\": \"tuusername\",");
        System.out.println("  \"email\": \"tu@email.com\",");
        System.out.println("  \"password\": \"" + hash + "\",");
        System.out.println("  \"rol\": \"ADMIN\",");
        System.out.println("  \"enabled\": true");
        System.out.println("})");
        System.out.println("");
    }
}






