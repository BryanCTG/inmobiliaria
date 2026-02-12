package com.example.inmobiliaria.controller;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.example.inmobiliaria.model.Propiedad;
import com.example.inmobiliaria.repository.PropiedadRepository;

@Controller
@RequestMapping("/admin/propiedades")
public class PropiedadController {

    private final PropiedadRepository repo;

    public PropiedadController(PropiedadRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public String listar(Model model) {
        model.addAttribute("propiedades", repo.findAll());
        return "admin/listar";
    }

    @GetMapping("/nueva")
    public String nuevaPropiedadForm(Model model) {
        model.addAttribute("propiedad", new Propiedad());
        return "admin/crear";
    }

@GetMapping("/visibles")
public List<Propiedad> listarVisibles() {
    return repo.findAll()
               .stream()
               .filter(Propiedad::isVisible)
               .toList();
}
    @PostMapping
    public String guardar(@ModelAttribute Propiedad propiedad) {
        repo.save(propiedad);
        return "redirect:/admin/propiedades";
    }

    @GetMapping("/editar/{id}")
    public String editarPropiedad(@PathVariable String id, Model model) {
        model.addAttribute("propiedad", repo.findById(id).orElse(null));
        return "admin/editar";
    }

    @PostMapping("/{id}")
    public String actualizarPropiedad(@PathVariable String id, @ModelAttribute Propiedad propiedad) {
        propiedad.setId(id);
        repo.save(propiedad);
        return "redirect:/admin/propiedades";
    }

    @GetMapping("/eliminar/{id}")
    public String eliminar(@PathVariable String id) {
        repo.deleteById(id);
        return "redirect:/admin/propiedades";
    }
}



