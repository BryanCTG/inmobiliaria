
# Belar Inmobiliaria

Sistema web completo para la gestión de bienes raíces, enfocado en la administración de propiedades y la gestión de clientes mediante un panel administrativo tipo CRM.

---

## Descripción

Belar Inmobiliaria es una aplicación full stack que permite gestionar propiedades y clientes desde un panel administrativo. El sistema integra dos bases de datos para optimizar el manejo de información: MySQL para propiedades y MongoDB para contactos.

Incluye funcionalidades de tipo CRM para el seguimiento de clientes interesados en propiedades.

---

## Características principales

### Gestión de propiedades
- Crear, editar y eliminar propiedades
- Asociación de propiedades con vendedores
- Catálogo público de propiedades
- Página individual con información detallada

### Gestión de contactos (CRM)
- Registro de clientes desde formulario web
- Visualización de contactos en el panel administrativo
- Estados de contacto:
  - Pendiente
  - Atendido
- Marcado de contactos como atendidos
- Filtros por estado
- Búsqueda por nombre o correo
- Paginación para grandes volúmenes de datos

### Panel administrativo
- Acceso exclusivo para administrador
- Interfaz organizada tipo dashboard
- Métricas en tiempo real:
  - Total de contactos
  - Contactos pendientes
  - Contactos atendidos

---

## Tecnologías utilizadas

### Frontend
- HTML5
- CSS3 (Flexbox y Grid)
- JavaScript (Vanilla)

### Backend
- Java
- Spring Boot
- API REST

### Base de datos
- MySQL (gestión de propiedades)
- MongoDB (gestión de contactos)

### Herramientas
- Mongoose
- Express (versión anterior del proyecto)
- Postman
- Git y GitHub

---

## Estructura del proyecto

```

/admin
├── contactos.html
├── propiedades.html
├── crear.html

/css
/js
/backend (Spring Boot)

````

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/BryanCTG/inmobiliaria.git
cd inmobiliaria
````

---

### 2. Configurar backend (Spring Boot)

Editar el archivo application.properties:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/inmobiliaria
spring.datasource.username=root
spring.datasource.password=tu_password

spring.data.mongodb.uri=mongodb://localhost:27017/inmobiliaria
```

---

### 3. Ejecutar el backend

```bash
./mvnw spring-boot:run
```

---

### 4. Ejecutar frontend

Abrir en el navegador:

```
/admin/contactos.html
```

O utilizar un servidor local.

---

## Funcionalidades destacadas

* Sistema de contactos tipo CRM
* Estados visuales de clientes
* Panel administrativo con métricas
* Paginación eficiente para grandes cantidades de datos
* Interfaz moderna y organizada

---

## Objetivo del proyecto

Este proyecto fue desarrollado como parte de formación en Ingeniería de Sistemas con el objetivo de:

* Aplicar arquitectura cliente-servidor
* Integrar múltiples bases de datos
* Desarrollar una solución real para gestión inmobiliaria
* Implementar un sistema tipo CRM funcional

---

## Mejoras futuras

* Notificaciones en tiempo real
* Implementación de WebSockets
* Sistema de roles (administrador y vendedores)
* Optimización de carga de imágenes
* Despliegue en la nube

---

## Autor

Bryan Beltrán

GitHub: [https://github.com/BryanCTG](https://github.com/BryanCTG)

---

## Contribuciones

Las contribuciones son bienvenidas.
Puedes hacer un fork del proyecto y enviar un pull request.

---

## Licencia

Proyecto de uso educativo.

```
```
