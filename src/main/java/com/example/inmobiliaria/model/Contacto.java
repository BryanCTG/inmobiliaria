package com.example.inmobiliaria.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "contactos")
public class Contacto {
     @Id
    private String id;
    private String nombre;
    private String celular;
    private String correo;
    private String mensaje;
    private String casaInteres;
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
    public String getCelular() {
        return celular;
    }
    public void setCelular(String celular) {
        this.celular = celular;
    }
    public String getCorreo() {
        return correo;
    }
    public void setCorreo(String correo) {
        this.correo = correo;
    }
    public String getMensaje() {
        return mensaje;
    }
    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }
    public String getCasaInteres() {
        return casaInteres;
    }
    public void setCasaInteres(String casaInteres) {
        this.casaInteres = casaInteres;
    }
}
