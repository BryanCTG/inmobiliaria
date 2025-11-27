package com.example.inmobiliaria;

import org.springframework.security.crypto.bcrypt.BCrypt;

public class HashGenerator {
    public static void main(String[] args) {
        String hash = BCrypt.hashpw("admin123", BCrypt.gensalt());
        System.out.println(hash);
    }
}
