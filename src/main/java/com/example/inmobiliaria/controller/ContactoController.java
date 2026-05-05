package com.example.inmobiliaria.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

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

    // Guardar contacto (público)
    @PostMapping
    public Contacto guardarContacto(@RequestBody Contacto contacto) {
        contacto.setAtendido(false); // Siempre inicia como pendiente
        return contactoRepository.save(contacto);
    }

    // Listar todos (admin)
    @GetMapping
    public List<Contacto> listarContactos() {
        return contactoRepository.findAll();
    }

    // Toggle atendido/pendiente (admin)
    @PatchMapping("/{id}/atendido")
    public Contacto toggleAtendido(@PathVariable String id) {
        Contacto c = contactoRepository.findById(id).orElse(null);
        if (c != null) {
            c.setAtendido(!c.isAtendido());
            contactoRepository.save(c);
        }
        return c;
    }

    // Eliminar contacto (admin)
    @DeleteMapping("/{id}")
    public void eliminarContacto(@PathVariable String id) {
        contactoRepository.deleteById(id);
    }
}
