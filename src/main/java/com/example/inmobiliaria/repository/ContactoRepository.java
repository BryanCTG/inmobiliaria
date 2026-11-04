package com.example.inmobiliaria.repository;

import com.example.inmobiliaria.model.Contacto;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface ContactoRepository extends MongoRepository<Contacto, String> {

    List<Contacto> findByUsuarioId(String usuarioId);

    long countByCasaInteres(String casaInteres);

    long countByCasaInteresAndFechaVisitaNotNull(String casaInteres);
}
