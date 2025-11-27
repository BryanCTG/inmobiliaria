
package com.example.inmobiliaria.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "propiedades")
public class Propiedad {
    @Id
    private String id;

    private String titulo;
    private String descripcion;
    private double precio;
    private int habitaciones;
    private int wc;
    private int estacionamiento;
    private boolean visible = true; // 👈 por defecto visible
    private String imagenId;

    // Getters y Setters
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

    public boolean isVisible() { return visible; }
    public void setVisible(boolean visible) { this.visible = visible; }

    public String getImagenId() { return imagenId; }
    public void setImagenId(String imagenId) { this.imagenId = imagenId; }
}


//  package com.example.inmobiliaria.model;

//  import org.springframework.data.annotation.Id;
//  import org.springframework.data.mongodb.core.mapping.Document;

//  @Document(collection = "Propiedades")
//  public class Propiedad {

//      @Id
//      private String id;
//      private String titulo;
//      private String descripcion;
//     private int precio;
//     private int habitaciones;
//     private int wc;
//     private int estacionamiento;
//     private boolean visible = true; // permite ocultar sin eliminar
//     private String imagenId; // ID de la imagen almacenada en GridFS

//      // Constructor vacío
// public Propiedad() {}

//     // Constructor con parámetros
//     public Propiedad(String titulo, String descripcion, int precio, int habitaciones, int wc, int estacionamiento, boolean visible, String imagenId) {
//         this.titulo = titulo;
//         this.descripcion = descripcion;
//         this.precio = precio;
//        this.habitaciones = habitaciones;
//          this.wc = wc;
//          this.estacionamiento = estacionamiento;
//         this.visible = visible;
//          this.imagenId = imagenId;
//      }

//     // Getters y Setters
//     public String getId() {
//          return id;
//    }

//     public void setId(String id) {
//         this.id = id;
//     }

//     public String getTitulo() {
//         return titulo;
//     }

//      public void setTitulo(String titulo) {
//         this.titulo = titulo;
//      }

// public String getDescripcion() {
//         return descripcion;
//     }

//     public void setDescripcion(String descripcion) {
//          this.descripcion = descripcion;
//      }

//      public int getPrecio() {
//         return precio;
//    }

//     public void setPrecio(int precio) {
//         this.precio = precio;
//     }

//      public int getHabitaciones() {
//         return habitaciones;
//      }

//     public void setHabitaciones(int habitaciones) {
//         this.habitaciones = habitaciones;
//     }

//      public int getWc() {
//          return wc;
//     }

//     public void setWc(int wc) {
//        this.wc = wc;
//    }

//      public int getEstacionamiento() {
//       return estacionamiento;
//     }

//     public void setEstacionamiento(int estacionamiento) {
//        this.estacionamiento = estacionamiento;
//    }

//    public boolean isVisible() {
//        return visible;
//    }

//      public void setVisible(boolean visible) {
//          this.visible = visible;
//      }

//      public String getImagenId() {
//         return imagenId;
//    }

//     public void setImagenId(String imagenId) {
//          this.imagenId = imagenId;
//     }
//  }
