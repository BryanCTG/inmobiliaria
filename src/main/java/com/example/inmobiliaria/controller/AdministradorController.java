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










// package com.example.inmobiliaria.controller;

// import java.util.Base64;
// import java.util.Map;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.http.ResponseEntity;
// import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
// import org.springframework.web.bind.annotation.CrossOrigin;
// import org.springframework.web.bind.annotation.PostMapping;
// import org.springframework.web.bind.annotation.RequestBody;
// import org.springframework.web.bind.annotation.RequestMapping;
// import org.springframework.web.bind.annotation.RestController;

// import com.example.inmobiliaria.model.Administrador;
// import com.example.inmobiliaria.repository.AdministradorRepository;

// @RestController
// @RequestMapping("/api/admin")
// @CrossOrigin(origins = "*")
// public class AdministradorController {

//     @Autowired
//     private AdministradorRepository adminRepo;

//     private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

//     @PostMapping("/login")
//     public ResponseEntity<?> login(@RequestBody LoginRequest request) {

//         String correoReq = request.getCorreo() == null ? "" : request.getCorreo().trim();
//         Administrador admin = adminRepo.findByCorreo(correoReq);

//         if (admin == null) {
//             return ResponseEntity.status(401).body(Map.of("error", "Correo incorrecto"));
//         }

//         if (!passwordEncoder.matches(request.getContrasena(), admin.getContrasena())) {
//             return ResponseEntity.status(401).body(Map.of("error", "Contraseña incorrecta"));
//         }

//         String token = Base64.getEncoder().encodeToString((admin.getCorreo() + ":" + request.getContrasena()).getBytes());

//         return ResponseEntity.ok(Map.of("token", token, "message", "Login exitoso"));
//     }

//     static class LoginRequest {
//         private String correo;
//         private String contrasena;

//         public String getCorreo() { return correo; }
//         public void setCorreo(String correo) { this.correo = correo; }

//         public String getContrasena() { return contrasena; }
//         public void setContrasena(String contrasena) { this.contrasena = contrasena; }
//     }
// }
