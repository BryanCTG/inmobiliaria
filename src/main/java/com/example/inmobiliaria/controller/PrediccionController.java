package com.example.inmobiliaria.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.inmobiliaria.Service.EstimadorPrecioService;

/**
 * Estimación para el panel de administración (formulario de crear propiedad).
 * Solo ADMIN: la versión pública con límites y margen de error está en ValoracionController.
 */
@RestController
@RequestMapping("/api/prediccion")
public class PrediccionController {

    private final EstimadorPrecioService estimador;

    public PrediccionController(EstimadorPrecioService estimador) {
        this.estimador = estimador;
    }

    @PostMapping("/precio")
    public ResponseEntity<Map<String, Object>> predecirPrecio(@RequestBody Map<String, Object> datos) {
        Map<String, Object> respuesta = new HashMap<>();

        if (!estimador.disponible()) {
            respuesta.put("error", "El modelo no está disponible.");
            return ResponseEntity.status(503).body(respuesta);
        }

        try {
            int habitaciones = ((Number) datos.get("habitaciones")).intValue();
            int wc = ((Number) datos.get("wc")).intValue();
            int estacionamiento = ((Number) datos.get("estacionamiento")).intValue();
            double metros = ((Number) datos.get("metrosCuadrados")).doubleValue();
            String ciudad = (String) datos.get("ciudad");

            EstimadorPrecioService.Estimacion e = estimador.estimar(ciudad, habitaciones, wc, estacionamiento, metros);

            respuesta.put("precioEstimado", e.precio());
            respuesta.put("precioFormateado", String.format("$%,.0f COP", (double) e.precio()).replace(",", "."));
            respuesta.put("mensaje", "Precio estimado por regresión lineal");
            respuesta.put("inputs", Map.of(
                    "habitaciones", habitaciones, "wc", wc, "estacionamiento", estacionamiento,
                    "metrosCuadrados", metros, "ciudad", ciudad));
            return ResponseEntity.ok(respuesta);

        } catch (IllegalArgumentException e) {
            respuesta.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(respuesta);
        } catch (Exception e) {
            respuesta.put("error", "Revisa los datos: habitaciones, baños, parqueaderos, área y ciudad son obligatorios.");
            return ResponseEntity.badRequest().body(respuesta);
        }
    }

    @GetMapping("/estado")
    public ResponseEntity<Map<String, Object>> estado() {
        Map<String, Object> resp = new HashMap<>();
        resp.put("modeloCargado", estimador.disponible());
        return ResponseEntity.ok(resp);
    }
}
