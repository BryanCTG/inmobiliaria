package com.example.inmobiliaria.config;

import java.io.IOException;
import java.util.Set;

import org.springframework.web.filter.OncePerRequestFilter;

import com.example.inmobiliaria.Service.RateLimitService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Frena los intentos masivos de inicio de sesión (fuerza bruta) limitando los envíos a /login por IP.
 * Se crea con new dentro de SecurityConfig (no es un @Component) para que se ejecute una sola vez.
 */
public class LoginRateLimitFilter extends OncePerRequestFilter {

    /** Páginas desde las que se puede iniciar sesión: solo a estas se redirige (evita redirecciones abiertas). */
    static final Set<String> ORIGENES_VALIDOS = Set.of("/ingresar.html", "/admin/login.html");

    private final RateLimitService limite;
    private final int maximo;
    private final long ventanaSegundos;

    public LoginRateLimitFilter(RateLimitService limite, int maximo, long ventanaSegundos) {
        this.limite = limite;
        this.maximo = maximo;
        this.ventanaSegundos = ventanaSegundos;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !("POST".equalsIgnoreCase(request.getMethod()) && "/login".equals(request.getServletPath()));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (!limite.permitir("login:" + request.getRemoteAddr(), maximo, ventanaSegundos)) {
            response.sendRedirect(origenSeguro(request.getParameter("origen")) + "?error=bloqueado");
            return;
        }
        chain.doFilter(request, response);
    }

    static String origenSeguro(String origen) {
        return origen != null && ORIGENES_VALIDOS.contains(origen) ? origen : "/ingresar.html";
    }
}
