package com.example.inmobiliaria.controller;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.ui.Model;



@Controller
public class LoginController {

    @GetMapping("/login")
public String login(@RequestParam(value = "error", required = false) String error,
                    Model model) {

    if (error != null) {
        model.addAttribute("errorMessage", "Usuario o contraseña incorrectos");
    }

    return "login";
}
}


//     @GetMapping("/login")
//     public String login() {
//         return "login";
//     }
// 