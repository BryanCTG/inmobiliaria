package com.example.inmobiliaria.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.inmobiliaria.model.Propiedad;

public interface PropiedadRepository extends MongoRepository<Propiedad, String> {
}

