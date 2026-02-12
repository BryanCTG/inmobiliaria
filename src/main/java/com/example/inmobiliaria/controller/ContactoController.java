package com.example.inmobiliaria.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.inmobiliaria.model.Contacto;
import com.example.inmobiliaria.repository.ContactoRepository;


@RestController
@RequestMapping("/api/contacto")
@CrossOrigin(origins = "*")
public class ContactoController {

    private final ContactoRepository contactoRepository;

    public ContactoController(ContactoRepository contactoRepository) {
        this.contactoRepository = contactoRepository;
    }

    @PostMapping
    public Contacto guardarContacto(@RequestBody Contacto contacto) {
        return contactoRepository.save(contacto);
    }

    @GetMapping
    public List<Contacto> listarContactos() {
        return contactoRepository.findAll();
    }
}


// @RestController
// @RequestMapping("/api/contacto")
// @CrossOrigin(origins = "*")
// public class ContactoController {

//     private final ContactoRepository contactoRepository;

//     public ContactoController(ContactoRepository contactoRepository) {
//         this.contactoRepository = contactoRepository;
//     }

//     @PostMapping
//     public Contacto guardarContacto(@RequestBody Contacto contacto) {
//         return contactoRepository.save(contacto);
//     }
// }