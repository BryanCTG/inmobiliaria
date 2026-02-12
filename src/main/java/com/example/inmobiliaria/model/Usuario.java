package com.example.inmobiliaria.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

@Document(collection = "usuarios")
public class Usuario {

    @Id
    private String id;
    
    private String nombre;
    
    @Indexed(unique = true)
    private String username; // Puede ser email o nombre de usuario
    
    @Indexed(unique = true)
    private String email;
    
    private String password; // Se almacena hasheada con BCrypt
    
    private String rol; // ADMIN o USER
    
    private boolean enabled = true; // Para activar/desactivar usuarios

    // Constructores
    public Usuario() {
    }

    public Usuario(String nombre, String username, String email, String password, String rol) {
        this.nombre = nombre;
        this.username = username;
        this.email = email;
        this.password = password;
        this.rol = rol;
        this.enabled = true;
    }

    // Getters y Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRol() {
        return rol;
    }

    public void setRol(String rol) {
        this.rol = rol;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}