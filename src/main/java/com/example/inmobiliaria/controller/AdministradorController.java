package com.example.inmobiliaria.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/*
 * Controlador del panel de administración.
 * 
 * IMPORTANTE:
 * - Este controlador NO maneja login ni logout.
 * - Spring Security se encarga completamente de la autenticación.
 * - Aquí solo se devuelven vistas protegidas.
 */
@Controller
@RequestMapping("/admin")
public class AdministradorController {

    /*
     * Muestra la página de login del administrador.
     * Spring Security redirige automáticamente aquí
     * cuando el usuario no está autenticado.
     */
    @GetMapping("/login")
    public String login() {
        return "admin/login";
    }

    /*
     * Panel principal del administrador.
     * Esta ruta está protegida por Spring Security.
     */
    @GetMapping("/index")
    public String index() {
        return "admin/index";
    }
}