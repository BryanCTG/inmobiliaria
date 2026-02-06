# 🏠 Proyecto Inmobiliaria - Spring Boot + MongoDB

Este proyecto es una aplicación web de **gestión inmobiliaria** desarrollada con **Spring Boot**, **Spring Security** y **MongoDB**, orientada a la administración de propiedades y el control de acceso para administradores.

---

## 📌 Funcionalidades principales

### 🌐 Sitio público

* Visualización de propiedades inmobiliarias.
* Página de inicio y catálogo.
* Formulario de contacto para interesados.
* Consumo de APIs públicas.

### 🔐 Panel de administración

* Login seguro para administradores.
* Autenticación con **Spring Security**.
* Usuarios almacenados en **MongoDB**.
* Validación de contraseñas con **BCrypt**.
* Acceso restringido por roles (`ADMIN`).
* Gestión protegida de rutas `/admin/**`.

---

## 🧑‍💻 Tecnologías utilizadas

### Backend

* Java 17+
* Spring Boot
* Spring Security
* Spring Data MongoDB
* Maven

### Frontend

* HTML5
* CSS3
* JavaScript

### Base de datos

* MongoDB

---

## 🔑 Seguridad y autenticación

* Autenticación basada en **username** (no correo).
* Usuarios cargados desde la colección `usuarios`.
* Contraseñas almacenadas de forma segura con **BCrypt**.
* Roles manejados con prefijo `ROLE_` (`ROLE_ADMIN`).
* Servicio personalizado: `CustomUserDetailsService`.

### Flujo de login

1. El administrador accede a `/admin/login.html`.
2. Ingresa usuario y contraseña.
3. Spring Security valida contra MongoDB.
4. Si es correcto, redirige a `/admin/index.html`.
5. Si falla, vuelve al login con `?error=true`.

---

## 📂 Estructura del proyecto

```
com.example.inmobiliaria
│
├── config
│   ├── SecurityConfig.java
│   └── CustomUserDetailsService.java
│
├── model
│   └── Usuario.java
│
├── repository
│   └── UsuarioRepository.java
│
├── controller
│   └── (Controladores REST y Web)
│
└── resources
    ├── static
    │   ├── admin
    │   │   ├── login.html
    │   │   └── index.html
    │   ├── css
    │   ├── js
    │   └── img
    └── application.properties
```

---

## 🗄️ Modelo de usuario (MongoDB)

```json
{
  "nombre": "Administrador",
  "username": "admin",
  "email": "admin@inmobiliaria.com",
  "password": "$2a$10$hashBCrypt",
  "rol": "ADMIN",
  "enabled": true
}
```

---

## ▶️ Cómo ejecutar el proyecto

1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
```

2. Configurar MongoDB y `application.properties`

3. Ejecutar el proyecto

```bash
mvn spring-boot:run
```

4. Acceder desde el navegador

* Sitio público: `http://localhost:8080/`
* Login admin: `http://localhost:8080/admin/login.html`

---

## ✅ Estado actual del proyecto

* Login funcional con Spring Security
* Roles y permisos correctamente configurados
* MongoDB integrado
* Estructura preparada para ampliación (CRUD, más roles, JWT, etc.)

---

## 🚀 Próximas mejoras (opcional)

* CRUD completo de propiedades desde el panel admin
* Creación automática del usuario administrador
* Manejo de errores personalizados
* Implementación de JWT
* Subida de imágenes de propiedades

---

## ✍️ Autor

Proyecto desarrollado con fines académicos y de aprendizaje en **Ingeniería de Sistemas**, enfocado en buenas prácticas de seguridad y arquitectura con Spring Boot.

---

📌 *Este proyecto está en constante mejora y aprendizaje.*
