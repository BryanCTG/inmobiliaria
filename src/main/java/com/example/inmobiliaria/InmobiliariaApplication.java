package com.example.inmobiliaria;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class InmobiliariaApplication {

	public static void main(String[] args) {
		SpringApplication.run(InmobiliariaApplication.class, args);
	}

}
