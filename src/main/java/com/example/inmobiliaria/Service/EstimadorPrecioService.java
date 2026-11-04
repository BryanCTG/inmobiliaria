package com.example.inmobiliaria.Service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import weka.classifiers.functions.LinearRegression;
import weka.core.Attribute;
import weka.core.DenseInstance;
import weka.core.Instance;
import weka.core.Instances;
import weka.core.SerializationHelper;
import weka.core.converters.ConverterUtils.DataSource;

/**
 * Estimación de precio con el modelo de regresión lineal de Weka.
 *
 * El modelo se entrenó con propiedades_colombia.arff (250 registros de ejemplo). Al arrancar se calcula
 * el error absoluto medio (MAE) sobre esos mismos datos y el rango de áreas que cubren, para poder decir
 * con honestidad cuánta confianza merece una estimación.
 */
@Service
public class EstimadorPrecioService {

    private static final Logger log = LoggerFactory.getLogger(EstimadorPrecioService.class);

    private LinearRegression modelo;
    private Instances estructura;
    private double mae;
    private double minM2 = Double.MAX_VALUE;
    private double maxM2 = 0;
    private int registros;

    /** Resultado de una estimación, en pesos colombianos redondeados al millón. */
    public record Estimacion(long precio, long minimo, long maximo, long margen, boolean fueraDeRango) { }

    @PostConstruct
    public void cargar() {
        try (InputStream isModelo = getClass().getResourceAsStream("/modelo_precio.model");
             InputStream isArff = getClass().getResourceAsStream("/propiedades_colombia.arff")) {
            if (isModelo == null || isArff == null) {
                log.warn("Modelo de precios no disponible: faltan modelo_precio.model o propiedades_colombia.arff");
                return;
            }
            modelo = (LinearRegression) SerializationHelper.read(isModelo);
            estructura = new DataSource(isArff).getDataSet();
            estructura.setClassIndex(estructura.numAttributes() - 1);

            // Error medio y rango de áreas sobre los datos del modelo
            double suma = 0;
            Attribute m2 = estructura.attribute("metrosCuadrados");
            for (int i = 0; i < estructura.numInstances(); i++) {
                Instance inst = estructura.instance(i);
                suma += Math.abs(modelo.classifyInstance(inst) - inst.classValue());
                minM2 = Math.min(minM2, inst.value(m2));
                maxM2 = Math.max(maxM2, inst.value(m2));
            }
            registros = estructura.numInstances();
            mae = registros == 0 ? 0 : suma / registros;
            log.info("Modelo de precios cargado: {} registros, MAE {} millones, área {}-{} m2",
                    registros, Math.round(mae / 1_000_000), Math.round(minM2), Math.round(maxM2));
        } catch (Exception e) {
            log.error("No se pudo cargar el modelo de precios", e);
            modelo = null;
        }
    }

    public boolean disponible() {
        return modelo != null && estructura != null;
    }

    public List<String> ciudades() {
        if (!disponible()) return Collections.emptyList();
        List<String> lista = new ArrayList<>();
        estructura.attribute("ciudad").enumerateValues().asIterator().forEachRemaining(v -> lista.add(String.valueOf(v)));
        return lista;
    }

    public int registrosEntrenamiento() { return registros; }

    /** @throws IllegalArgumentException si la ciudad no es una de las que conoce el modelo. */
    public Estimacion estimar(String ciudad, int habitaciones, int wc, int estacionamiento, double metrosCuadrados) throws Exception {
        if (!disponible()) throw new IllegalStateException("El modelo no está disponible");

        Attribute attrCiudad = estructura.attribute("ciudad");
        if (ciudad == null || attrCiudad.indexOfValue(ciudad) < 0) {
            throw new IllegalArgumentException("Ciudad no válida. Valores aceptados: " + String.join(", ", ciudades()));
        }

        Instance instancia = new DenseInstance(estructura.numAttributes());
        instancia.setDataset(estructura);
        instancia.setValue(estructura.attribute("habitaciones"), habitaciones);
        instancia.setValue(estructura.attribute("wc"), wc);
        instancia.setValue(estructura.attribute("estacionamiento"), estacionamiento);
        instancia.setValue(estructura.attribute("metrosCuadrados"), metrosCuadrados);
        instancia.setValue(attrCiudad, ciudad);
        instancia.setClassMissing();

        double prediccion = Math.max(modelo.classifyInstance(instancia), 0);
        long precio = redondear(prediccion);
        long margen = redondear(mae);
        boolean fuera = metrosCuadrados < minM2 || metrosCuadrados > maxM2;
        return new Estimacion(precio, Math.max(precio - margen, 0), precio + margen, margen, fuera);
    }

    private static long redondear(double valor) {
        return Math.round(valor / 1_000_000.0) * 1_000_000L;
    }
}
