package com.example.inmobiliaria.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Document(collection = "contactos")
public class Contacto {

    @Id
    private String id;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no puede superar 100 caracteres")
    private String nombre;

    @Pattern(regexp = "^$|^[0-9+\\s()-]{7,20}$", message = "El celular no es válido")
    private String celular;

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "El correo no es válido")
    @Size(max = 150, message = "El correo no puede superar 150 caracteres")
    private String correo;

    @NotBlank(message = "El mensaje es obligatorio")
    @Size(max = 1000, message = "El mensaje no puede superar 1000 caracteres")
    private String mensaje;

    @Size(max = 40, message = "Propiedad de interés no válida")
    private String casaInteres;

    @Pattern(regexp = "^$|^(telefono|correo|whatsapp)$", message = "Medio de contacto no válido")
    private String medioContacto;

    // Estado de atención: false = pendiente, true = atendido
    private boolean atendido = false;

    // Visita solicitada (opcional): fecha y hora en punto, de lunes a viernes
    private LocalDate fechaVisita;

    @Pattern(regexp = "^$|^([01]\\d|2[0-3]):00$", message = "La hora de la visita no es válida")
    private String horaVisita;

    // Cuenta de usuario que envió el mensaje, si había iniciado sesión
    private String usuarioId;

    // Fecha de recepción
    private java.time.Instant creado;

    // Getters y Setters

    public LocalDate getFechaVisita() { return fechaVisita; }
    public void setFechaVisita(LocalDate fechaVisita) { this.fechaVisita = fechaVisita; }

    public String getHoraVisita() { return horaVisita; }
    public void setHoraVisita(String horaVisita) { this.horaVisita = horaVisita; }

    public String getUsuarioId() { return usuarioId; }
    public void setUsuarioId(String usuarioId) { this.usuarioId = usuarioId; }

    public java.time.Instant getCreado() { return creado; }
    public void setCreado(java.time.Instant creado) { this.creado = creado; }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getCelular() { return celular; }
    public void setCelular(String celular) { this.celular = celular; }

    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { this.correo = correo; }

    public String getMensaje() { return mensaje; }
    public void setMensaje(String mensaje) { this.mensaje = mensaje; }

    public String getCasaInteres() { return casaInteres; }
    public void setCasaInteres(String casaInteres) { this.casaInteres = casaInteres; }

    public String getMedioContacto() { return medioContacto; }
    public void setMedioContacto(String medioContacto) { this.medioContacto = medioContacto; }

    public boolean isAtendido() { return atendido; }
    public void setAtendido(boolean atendido) { this.atendido = atendido; }
}
