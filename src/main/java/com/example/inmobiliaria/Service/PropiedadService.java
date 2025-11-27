package com.example.inmobiliaria.Service;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.inmobiliaria.model.Propiedad;
import com.example.inmobiliaria.repository.PropiedadRepository;


@Service
public class PropiedadService {

    private final PropiedadRepository propiedadRepository;

    public PropiedadService(PropiedadRepository propiedadRepository) {
        this.propiedadRepository = propiedadRepository;
    }

    public List<Propiedad> listarTodas() {
        return propiedadRepository.findAll();
    }

    public Propiedad guardar(Propiedad propiedad) {
        return propiedadRepository.save(propiedad);
    }

    public Propiedad buscarPorId(String id) {
        return propiedadRepository.findById(id).orElse(null);
    }

    public void eliminar(String id) {
        propiedadRepository.deleteById(id);
    }
}










// package com.example.inmobiliaria.Service;
// import java.util.List;
// import org.springframework.stereotype.Service;
// import com.example.inmobiliaria.model.Propiedad;
// import com.example.inmobiliaria.repository.PropiedadRepository;


// @Service
// public class PropiedadService {

//     private final PropiedadRepository propiedadRepository;

//     public PropiedadService(PropiedadRepository propiedadRepository) {
//         this.propiedadRepository = propiedadRepository;
//     }

//     public List<Propiedad> listarTodas() {
//         return propiedadRepository.findAll();
//     }

//     public Propiedad guardar(Propiedad propiedad) {
//         return propiedadRepository.save(propiedad);
//     }

//     public Propiedad buscarPorId(Long id) {
//         return propiedadRepository.findById(id).orElse(null);
//     }

//     public void eliminar(Long id) {
//         propiedadRepository.deleteById(id);
//     }
// }








//package com.example.inmobiliaria.Service;

// import java.util.List;

// import org.springframework.stereotype.Service;

// import com.example.inmobiliaria.model.Propiedad;
// import com.example.inmobiliaria.repository.PropiedadRepository;



// public class PropiedadService {


// @Service

//     private final PropiedadRepository propiedadRepository;

//     public PropiedadService(PropiedadRepository propiedadRepository) {
//         this.propiedadRepository = propiedadRepository;
//     }

//     public List<Propiedad> listarTodas() {
//         return propiedadRepository.findAll();
//     }

//     public Propiedad guardar(Propiedad propiedad) {
//         return propiedadRepository.save(propiedad);
//     }

//     public Propiedad buscarPorId(Long id) {
//         return propiedadRepository.findById(id).orElse(null);
//     }

//     public void eliminar(Long id) {
//         propiedadRepository.deleteById(id);
//     }
// }

    
