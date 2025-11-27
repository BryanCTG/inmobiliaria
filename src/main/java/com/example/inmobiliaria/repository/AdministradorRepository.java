package com.example.inmobiliaria.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.inmobiliaria.model.Administrador;

public interface AdministradorRepository extends MongoRepository<Administrador, String> {
    Administrador findByCorreo(String correo);
    boolean existsByCorreo(String correo);
}
