package com.example.inmobiliaria.Service;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

/**
 * Límite de solicitudes por clave (por ejemplo, IP + acción) en una ventana de tiempo.
 * Está en memoria: sirve para frenar abuso en una sola instancia. Con varias instancias
 * habría que moverlo a un almacén compartido (Redis).
 */
@Service
public class RateLimitService {

    private final Map<String, Deque<Long>> registros = new ConcurrentHashMap<>();

    /** @return true si la solicitud se permite; false si superó el máximo dentro de la ventana. */
    public boolean permitir(String clave, int maximo, long ventanaSegundos) {
        long ahora = System.currentTimeMillis();
        long desde = ahora - ventanaSegundos * 1000;
        Deque<Long> marcas = registros.computeIfAbsent(clave, k -> new ArrayDeque<>());
        synchronized (marcas) {
            while (!marcas.isEmpty() && marcas.peekFirst() < desde) marcas.pollFirst();
            if (marcas.size() >= maximo) return false;
            marcas.addLast(ahora);
        }
        if (registros.size() > 10_000) {   // limpieza simple para que el mapa no crezca sin límite
            registros.entrySet().removeIf(e -> e.getValue().isEmpty() || e.getValue().peekLast() < desde);
        }
        return true;
    }
}
