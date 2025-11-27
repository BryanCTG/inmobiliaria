package com.example.inmobiliaria.repository;

import com.example.inmobiliaria.model.Contacto;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ContactoRepository extends MongoRepository<Contacto, String> {

}
