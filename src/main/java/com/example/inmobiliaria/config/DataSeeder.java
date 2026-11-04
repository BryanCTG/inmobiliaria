package com.example.inmobiliaria.config;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import com.example.inmobiliaria.model.Contacto;
import com.example.inmobiliaria.model.Propiedad;
import com.example.inmobiliaria.repository.ContactoRepository;
import com.example.inmobiliaria.repository.PropiedadRepository;

/**
 * Carga datos de demostración (propiedades y mensajes de contacto).
 *
 * Solo se ejecuta si se activa explícitamente con la propiedad  app.seed=true
 * y únicamente cuando la colección de propiedades está vacía, por lo que nunca
 * sobrescribe datos existentes.
 *
 * Uso:  mvnw spring-boot:run "-Dspring-boot.run.arguments=--app.seed=true"
 */
@Component
@ConditionalOnProperty(name = "app.seed", havingValue = "true")
public class DataSeeder implements CommandLineRunner {

    private final PropiedadRepository propiedades;
    private final ContactoRepository contactos;

    public DataSeeder(PropiedadRepository propiedades, ContactoRepository contactos) {
        this.propiedades = propiedades;
        this.contactos = contactos;
    }

    @Override
    public void run(String... args) {
        if (propiedades.count() > 0) {
            System.out.println("[Seed] Ya existen propiedades; no se cargan datos de ejemplo.");
            return;
        }

        Propiedad casaManga = propiedad(
            "Casa moderna con terrazas en Manga",
            "Residencia contemporánea de dos niveles con amplias terrazas de vidrio, acabados de lujo y "
                + "zonas verdes tropicales. A pocos minutos del centro histórico y de la bahía.",
            1_250_000_000, 4, 4, 2, 280, "Cartagena", "Manga", "Calle 25 #20-45",
            10.4065, -75.5380, "/img/anuncio2.jpg");

        Propiedad casaPoblado = propiedad(
            "Casa con vista panorámica en Las Palmas",
            "Casa de dos pisos rodeada de naturaleza con vista abierta a las montañas. Ideal para quien "
                + "busca tranquilidad sin alejarse de la ciudad.",
            1_480_000_000, 4, 3, 2, 240, "Medellin", "Las Palmas", "Km 5 Vía Las Palmas",
            6.1900, -75.5200, "/img/anuncio1.jpg");

        Propiedad casaRiomar = propiedad(
            "Casa familiar con garaje doble en Riomar",
            "Casa de dos niveles en conjunto cerrado, con garaje para dos vehículos, cocina integral y "
                + "habitación principal con vestier.",
            890_000_000, 4, 3, 2, 210, "Barranquilla", "Riomar", "Carrera 55 #98-30",
            11.0120, -74.8300, "/img/anuncio4.jpg");

        Propiedad casaCedritos = propiedad(
            "Casa de ladrillo a la vista en Cedritos",
            "Casa clásica en barrio residencial consolidado, cerca de colegios, parques y transporte. "
                + "Excelente estado, lista para habitar.",
            980_000_000, 3, 3, 2, 165, "Bogota", "Cedritos", "Calle 140 #9-25",
            4.7230, -74.0350, "/img/anuncio5.jpg");

        Propiedad casaCampestre = propiedad(
            "Casa campestre con piscina en La Boquilla",
            "Espectacular casa de madera y piedra con piscina, zona social cubierta y amplios jardines. "
                + "Perfecta para familias que disfrutan del descanso y las reuniones.",
            2_100_000_000, 5, 5, 4, 420, "Cartagena", "La Boquilla", "Vía La Boquilla Km 3",
            10.4700, -75.4950, "/img/anuncio3.jpg");

        Propiedad casaMar = propiedad(
            "Casa frente al mar con muelle en Castillogrande",
            "Propiedad exclusiva con acceso directo al agua, muelle privado y terraza con vista a la "
                + "bahía. Atardeceres únicos en uno de los sectores más cotizados.",
            1_650_000_000, 3, 3, 2, 190, "Cartagena", "Castillogrande", "Carrera 1 #8-60",
            10.3990, -75.5500, "/img/anuncio6.jpg");

        Propiedad villaPoblado = propiedad(
            "Villa con piscina infinita en El Poblado",
            "Villa de lujo con piscina infinita y vista a la ciudad. Espacios abiertos, acabados "
                + "premium y total privacidad.",
            2_800_000_000L, 5, 5, 3, 380, "Medellin", "El Poblado", "Transversal Superior #10-50",
            6.2000, -75.5600, "/img/destacada2.jpg");

        Propiedad penthouse = propiedad(
            "Penthouse con terraza y piscina en Chapinero Alto",
            "Penthouse en edificio con piscina y zonas sociales, terraza privada con asadores y "
                + "vista abierta de la ciudad. A pasos de restaurantes y vida cultural.",
            1_900_000_000, 3, 3, 2, 160, "Bogota", "Chapinero Alto", "Carrera 4 #58-20",
            4.6500, -74.0550, "/img/destacada3.jpg");

        Propiedad villaTropical = propiedad(
            "Villa tropical con piscina en Crespo",
            "Amplia villa rodeada de palmeras con piscina y salones al aire libre. Pensada para "
                + "quienes quieren vivir el Caribe todos los días.",
            3_200_000_000L, 6, 6, 4, 520, "Cartagena", "Crespo", "Calle 70 #1-15",
            10.4400, -75.5100, "/img/destacada.jpg");

        List<Propiedad> guardadas = propiedades.saveAll(List.of(
            casaManga, casaPoblado, casaRiomar, casaCedritos, casaCampestre,
            casaMar, villaPoblado, penthouse, villaTropical));

        // Mensajes de contacto de ejemplo (casaInteres guarda el ID de la propiedad)
        contactos.saveAll(List.of(
            contacto("Laura Martínez", "3001234567", "laura.martinez@example.com",
                "Hola, me interesa agendar una visita este fin de semana.",
                guardadas.get(0).getId(), "whatsapp", false),
            contacto("Andrés Rojas", "3109876543", "andres.rojas@example.com",
                "¿La propiedad acepta crédito hipotecario? ¿Cuál sería el valor de la cuota inicial?",
                guardadas.get(4).getId(), "correo", false),
            contacto("Camila Torres", "3205556677", "camila.torres@example.com",
                "Quisiera más fotos del interior y confirmar el valor de la administración.",
                guardadas.get(7).getId(), "telefono", true),
            contacto("Felipe Gómez", "3152223344", "felipe.gomez@example.com",
                "Estoy interesado, ¿se puede negociar el precio?",
                guardadas.get(2).getId(), "correo", true),
            contacto("Valentina Ruiz", "3187778899", "valentina.ruiz@example.com",
                "Buenas tardes, ¿está disponible para visitarla el próximo martes?",
                guardadas.get(6).getId(), "whatsapp", false)
        ));

        System.out.println("[Seed] Cargadas " + guardadas.size() + " propiedades y 5 mensajes de ejemplo.");
    }

    private Propiedad propiedad(String titulo, String descripcion, double precio,
                                int habitaciones, int wc, int estacionamiento, double metros,
                                String ciudad, String barrio, String direccion,
                                double lat, double lng, String imagen) {
        Propiedad p = new Propiedad();
        p.setTitulo(titulo);
        p.setDescripcion(descripcion);
        p.setPrecio(precio);
        p.setHabitaciones(habitaciones);
        p.setWc(wc);
        p.setEstacionamiento(estacionamiento);
        p.setMetrosCuadrados(metros);
        p.setCiudad(ciudad);
        p.setBarrio(barrio);
        p.setDireccion(direccion);
        p.setLatitud(lat);
        p.setLongitud(lng);
        p.setVisible(true);
        p.setImagenes(List.of(imagen));
        return p;
    }

    private Contacto contacto(String nombre, String celular, String correo, String mensaje,
                              String propiedadId, String medio, boolean atendido) {
        Contacto c = new Contacto();
        c.setNombre(nombre);
        c.setCelular(celular);
        c.setCorreo(correo);
        c.setMensaje(mensaje);
        c.setCasaInteres(propiedadId);
        c.setMedioContacto(medio);
        c.setAtendido(atendido);
        return c;
    }
}
