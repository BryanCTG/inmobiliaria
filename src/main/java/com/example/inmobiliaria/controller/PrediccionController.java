package com.example.inmobiliaria.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import weka.classifiers.functions.LinearRegression;
import weka.core.*;
import weka.core.converters.ConverterUtils.DataSource;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/prediccion")
@CrossOrigin(origins = "*")
public class PrediccionController {

    private LinearRegression modeloEntrenado;
    private Instances estructuraDataset;

    @PostConstruct
    public void cargarModelo() {
        try {
            // ─── 1. Cargar el modelo .model ───────────────────────────────
            InputStream isModelo = getClass().getResourceAsStream("/modelo_precio.model");
            if (isModelo == null) {
                System.err.println("⚠️  modelo_precio.model no encontrado en resources/");
                return;
            }
            modeloEntrenado = (LinearRegression) weka.core.SerializationHelper.read(isModelo);

            // ─── 2. Cargar la estructura desde el ARFF original ───────────
            // Esto garantiza que el header sea IDÉNTICO al usado en el entrenamiento
            InputStream isArff = getClass().getResourceAsStream("/propiedades_colombia.arff");
            if (isArff == null) {
                System.err.println("⚠️  propiedades_colombia.arff no encontrado en resources/");
                return;
            }
            DataSource source = new DataSource(isArff);
            estructuraDataset = source.getDataSet();
            // El atributo clase es el último (precio)
            estructuraDataset.setClassIndex(estructuraDataset.numAttributes() - 1);

            System.out.println("✓ Modelo de predicción de precios cargado correctamente");
            System.out.println("  Atributos: " + estructuraDataset.numAttributes());
            System.out.println("  Clase: "     + estructuraDataset.classAttribute().name());

        } catch (Exception e) {
            System.err.println("❌ Error al cargar el modelo: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @PostMapping("/precio")
    public ResponseEntity<Map<String, Object>> predecirPrecio(
            @RequestBody Map<String, Object> datos) {

        Map<String, Object> respuesta = new HashMap<>();

        if (modeloEntrenado == null || estructuraDataset == null) {
            respuesta.put("error", "El modelo no está disponible.");
            return ResponseEntity.status(503).body(respuesta);
        }

        try {
            int    habitaciones    = ((Number) datos.get("habitaciones")).intValue();
            int    wc              = ((Number) datos.get("wc")).intValue();
            int    estacionamiento = ((Number) datos.get("estacionamiento")).intValue();
            double metrosCuadrados = ((Number) datos.get("metrosCuadrados")).doubleValue();
            String ciudad          = (String) datos.get("ciudad");

            // Validar ciudad contra los valores reales del ARFF
            Attribute attrCiudad = estructuraDataset.attribute("ciudad");
            if (attrCiudad.indexOfValue(ciudad) < 0) {
                respuesta.put("error", "Ciudad no válida: '" + ciudad +
                    "'. Valores aceptados: Cartagena, Bogota, Medellin, Barranquilla");
                return ResponseEntity.badRequest().body(respuesta);
            }

            // Crear instancia usando la estructura del ARFF
            Instance instancia = new DenseInstance(estructuraDataset.numAttributes());
            instancia.setDataset(estructuraDataset);

            instancia.setValue(estructuraDataset.attribute("habitaciones"),    habitaciones);
            instancia.setValue(estructuraDataset.attribute("wc"),              wc);
            instancia.setValue(estructuraDataset.attribute("estacionamiento"), estacionamiento);
            instancia.setValue(estructuraDataset.attribute("metrosCuadrados"), metrosCuadrados);
            instancia.setValue(attrCiudad, ciudad);
            instancia.setClassMissing();

            // ─── Predicción ──────────────────────────────────────────────
            double precioPredecho   = modeloEntrenado.classifyInstance(instancia);
            long   precioRedondeado = Math.round(precioPredecho / 1_000_000.0) * 1_000_000L;
            String precioFormateado = String.format("$%,.0f COP", (double) precioRedondeado)
                                            .replace(",", ".");

            respuesta.put("precioEstimado",   precioRedondeado);
            respuesta.put("precioFormateado", precioFormateado);
            respuesta.put("mensaje", "Precio estimado por regresión lineal");
            respuesta.put("inputs", Map.of(
                "habitaciones", habitaciones, "wc", wc,
                "estacionamiento", estacionamiento,
                "metrosCuadrados", metrosCuadrados,
                "ciudad", ciudad
            ));
            return ResponseEntity.ok(respuesta);

        } catch (Exception e) {
            e.printStackTrace();
            respuesta.put("error", "Error: " + e.getMessage());
            return ResponseEntity.status(500).body(respuesta);
        }
    }

    @GetMapping("/estado")
    public ResponseEntity<Map<String, Object>> estado() {
        Map<String, Object> resp = new HashMap<>();
        resp.put("modeloCargado", modeloEntrenado != null && estructuraDataset != null);
        return ResponseEntity.ok(resp);
    }
}