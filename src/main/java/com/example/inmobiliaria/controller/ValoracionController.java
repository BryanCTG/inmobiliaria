package com.example.inmobiliaria.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.example.inmobiliaria.Service.EstimadorPrecioService;
import com.example.inmobiliaria.Service.RateLimitService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

/** Valoración pública: cualquier visitante puede pedir una estimación de referencia. */
@RestController
@RequestMapping("/api/valoracion")
public class ValoracionController {

    public record Solicitud(
            @NotBlank(message = "Elige una ciudad") String ciudad,
            @Min(value = 1, message = "Las habitaciones deben ser entre 1 y 10") @Max(value = 10, message = "Las habitaciones deben ser entre 1 y 10") int habitaciones,
            @Min(value = 1, message = "Los baños deben ser entre 1 y 10") @Max(value = 10, message = "Los baños deben ser entre 1 y 10") int wc,
            @Min(value = 0, message = "Los parqueaderos deben ser entre 0 y 10") @Max(value = 10, message = "Los parqueaderos deben ser entre 0 y 10") int estacionamiento,
            @DecimalMin(value = "20", message = "El área debe estar entre 20 y 1000 m²") @DecimalMax(value = "1000", message = "El área debe estar entre 20 y 1000 m²") double metrosCuadrados) { }

    private final EstimadorPrecioService estimador;
    private final RateLimitService limite;

    public ValoracionController(EstimadorPrecioService estimador, RateLimitService limite) {
        this.estimador = estimador;
        this.limite = limite;
    }

    @GetMapping("/info")
    public Map<String, Object> info() {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("disponible", estimador.disponible());
        r.put("ciudades", estimador.ciudades());
        r.put("registros", estimador.registrosEntrenamiento());
        return r;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> estimar(@Valid @RequestBody Solicitud s, HttpServletRequest request) throws Exception {
        if (!limite.permitir("valoracion:" + request.getRemoteAddr(), 12, 60)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Hiciste muchas consultas seguidas. Espera un minuto e inténtalo de nuevo.");
        }
        if (!estimador.disponible()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "La valoración no está disponible en este momento.");
        }

        EstimadorPrecioService.Estimacion e;
        try {
            e = estimador.estimar(s.ciudad(), s.habitaciones(), s.wc(), s.estacionamiento(), s.metrosCuadrados());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("precioEstimado", e.precio());
        r.put("minimo", e.minimo());
        r.put("maximo", e.maximo());
        r.put("margen", e.margen());
        r.put("fueraDeRango", e.fueraDeRango());
        r.put("registros", estimador.registrosEntrenamiento());
        return ResponseEntity.ok(r);
    }
}
