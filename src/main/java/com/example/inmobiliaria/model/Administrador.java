package com.example.inmobiliaria.model;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;


@Document("administrador")
public class Administrador {
    
    @Id
    private String id;
    private String correo;
    private String contrasena;



    // Getters y Setters

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getContrasena() {
        return contrasena;
    }

    public void setContrasena(String contrasea) {
        this.contrasena = contrasea;
    }
}
