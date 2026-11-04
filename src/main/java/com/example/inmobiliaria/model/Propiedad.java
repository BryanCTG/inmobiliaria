package com.example.inmobiliaria.model;

import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

@Document(collection = "propiedades")
public class Propiedad {

    @Id
    private String id;

    @NotBlank(message = "El título es obligatorio")
    @Size(max = 150, message = "El título no puede superar 150 caracteres")
    private String titulo;

    @Size(max = 3000, message = "La descripción no puede superar 3000 caracteres")
    private String descripcion;

    @Positive(message = "El precio debe ser mayor que cero")
    private double precio;

    @PositiveOrZero(message = "Las habitaciones no pueden ser negativas")
    private int habitaciones;

    @PositiveOrZero(message = "Los baños no pueden ser negativos")
    private int wc;

    @PositiveOrZero(message = "Los parqueaderos no pueden ser negativos")
    private int estacionamiento;

    @PositiveOrZero(message = "Los metros cuadrados no pueden ser negativos")
    private double metrosCuadrados;

    private boolean visible = true;

    private List<String> imagenes;

    private String direccion;
    private String ciudad;
    private String barrio;

    // Coordenadas para el mapa
    private Double latitud;
    private Double longitud;

    // ── Publicación por propietarios ─────────────────────────────────────────
    // Las propiedades creadas por el admin (y las anteriores a esta función) son PUBLICADA.
    // Las de propietarios nacen PENDIENTE y solo salen al público cuando el admin las aprueba.
    public static final String PENDIENTE = "PENDIENTE";
    public static final String PUBLICADA = "PUBLICADA";
    public static final String RECHAZADA = "RECHAZADA";
    public static final String RETIRADA = "RETIRADA";

    @com.fasterxml.jackson.annotation.JsonIgnore
    private String propietarioId;

    private String estado = PUBLICADA;
    private String motivoRechazo;
    private java.time.Instant creado;

    // Solo para el panel admin: se llenan al listar, no se guardan
    @org.springframework.data.annotation.Transient
    private String propietarioNombre;
    @org.springframework.data.annotation.Transient
    private String propietarioContacto;

    @com.fasterxml.jackson.annotation.JsonIgnore
    public String getPropietarioId() { return propietarioId; }
    @com.fasterxml.jackson.annotation.JsonIgnore
    public void setPropietarioId(String propietarioId) { this.propietarioId = propietarioId; }

    public String getEstado() { return estado == null ? PUBLICADA : estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getMotivoRechazo() { return motivoRechazo; }
    public void setMotivoRechazo(String motivoRechazo) { this.motivoRechazo = motivoRechazo; }

    public java.time.Instant getCreado() { return creado; }
    public void setCreado(java.time.Instant creado) { this.creado = creado; }

    public String getPropietarioNombre() { return propietarioNombre; }
    public void setPropietarioNombre(String v) { this.propietarioNombre = v; }
    public String getPropietarioContacto() { return propietarioContacto; }
    public void setPropietarioContacto(String v) { this.propietarioContacto = v; }

    /** Visible para el público: marcada como visible Y aprobada. */
    @com.fasterxml.jackson.annotation.JsonIgnore
    public boolean isPublica() { return visible && PUBLICADA.equals(getEstado()); }


    // GETTERS Y SETTERS

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public double getPrecio() { return precio; }
    public void setPrecio(double precio) { this.precio = precio; }

    public int getHabitaciones() { return habitaciones; }
    public void setHabitaciones(int habitaciones) { this.habitaciones = habitaciones; }

    public int getWc() { return wc; }
    public void setWc(int wc) { this.wc = wc; }

    public int getEstacionamiento() { return estacionamiento; }
    public void setEstacionamiento(int estacionamiento) { this.estacionamiento = estacionamiento; }

    public double getMetrosCuadrados() { return metrosCuadrados; }
    public void setMetrosCuadrados(double metrosCuadrados) { this.metrosCuadrados = metrosCuadrados; }

    public boolean isVisible() { return visible; }
    public void setVisible(boolean visible) { this.visible = visible; }

    public List<String> getImagenes() { return imagenes; }
    public void setImagenes(List<String> imagenes) { this.imagenes = imagenes; }

    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }

    public String getCiudad() { return ciudad; }
    public void setCiudad(String ciudad) { this.ciudad = ciudad; }

    public String getBarrio() { return barrio; }
    public void setBarrio(String barrio) { this.barrio = barrio; }

    public Double getLatitud() { return latitud; }
    public void setLatitud(Double latitud) { this.latitud = latitud; }

    public Double getLongitud() { return longitud; }
    public void setLongitud(Double longitud) { this.longitud = longitud; }
}