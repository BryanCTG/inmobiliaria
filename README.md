# 🏠 Belar Inmobiliaria

> Plataforma web completa para la gestión y publicación de propiedades inmobiliarias, con panel de administración tipo CRM y sitio público para compradores.

---

## 📸 Vista previa

> **📌 Recomendación de imágenes:** Agrega capturas de pantalla reales de tu proyecto en una carpeta `/screenshots` en la raíz del repositorio y referencia las imágenes así:

```
/screenshots/
├── hero.png           → Página de inicio (sección hero)
├── propiedades.png    → Catálogo de propiedades (anuncio.html)
├── detalle.png        → Detalle de propiedad con mapa
├── admin-dashboard.png → Dashboard del panel admin
├── admin-propiedades.png → Gestión de propiedades (tabla)
├── admin-crear.png    → Formulario creación con mapa
└── admin-contactos.png → Vista CRM de mensajes
```

Una vez agregadas, descomenta y usa estas líneas en el README:

```markdown
| Inicio | Propiedades | Detalle |
|--------|-------------|---------|
| ![Inicio](screenshots/hero.png) | ![Props](screenshots/propiedades.png) | ![Detalle](screenshots/detalle.png) |

| Dashboard Admin | Gestión | Contactos CRM |
|-----------------|---------|---------------|
| ![Dashboard](screenshots/admin-dashboard.png) | ![Admin](screenshots/admin-propiedades.png) | ![CRM](screenshots/admin-contactos.png) |
```

---

## ✨ Características

### 🌐 Sitio público
- Página de inicio con hero animado y buscador
- Catálogo de propiedades con paginación (6 por página)
- Vista detallada de cada propiedad con **galería de imágenes** e integración de **mapa interactivo** (OpenStreetMap + Leaflet)
- Formulario de contacto con selección de propiedad y medio de contacto preferido
- Páginas de Nosotros y Blog
- Diseño totalmente **responsive** (mobile-first)

### 🔐 Panel de administración
- Autenticación segura con Spring Security y contraseñas hasheadas con BCrypt
- **Dashboard** con métricas en tiempo real: total de propiedades, publicadas, ocultas y mensajes recibidos
- Gestión completa de propiedades (CRUD): crear, editar, eliminar, publicar/ocultar
- **Creación de propiedades** con formulario enriquecido:
  - Subida de hasta 4 imágenes
  - Geocodificación de dirección (Nominatim)
  - Selector de ubicación por clic en mapa
- **Módulo CRM** para gestión de mensajes de contacto:
  - Estados: Pendiente / Atendido
  - Filtros por estado y búsqueda por nombre o correo
  - Eliminación de mensajes

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Java 17 · Spring Boot 3.4.5 · Spring Security |
| Base de datos | MongoDB (propiedades, usuarios, contactos) |
| Autenticación | Spring Security + BCrypt |
| Almacenamiento de imágenes | Sistema de archivos local (`/uploads`) |
| Frontend | HTML5 · CSS3 (custom design system) · Vanilla JavaScript |
| Mapas | Leaflet.js + OpenStreetMap + Nominatim |
| Animaciones | AOS (Animate On Scroll) |
| Fuentes e iconos | Google Fonts (Montserrat) · Material Symbols Rounded |
| Build tool | Maven Wrapper (mvnw) |

---

## 📁 Estructura del proyecto

```
inmobiliaria/
├── src/
│   └── main/
│       ├── java/com/example/inmobiliaria/
│       │   ├── InmobiliariaApplication.java
│       │   ├── config/
│       │   │   ├── SecurityConfig.java          # Configuración Spring Security
│       │   │   ├── CustomUserDetailsService.java
│       │   │   ├── DataInitializer.java          # Crea admin por defecto
│       │   │   └── WebConfig.java               # Sirve imágenes /uploads
│       │   ├── controller/
│       │   │   ├── PropiedadRestController.java  # API REST propiedades
│       │   │   ├── ContactoController.java       # API REST contactos
│       │   │   ├── ImagenController.java         # API imágenes (GridFS)
│       │   │   ├── AdministradorController.java
│       │   │   └── LoginController.java
│       │   ├── model/
│       │   │   ├── Propiedad.java
│       │   │   ├── Contacto.java
│       │   │   └── Usuario.java
│       │   ├── repository/
│       │   │   ├── PropiedadRepository.java
│       │   │   ├── ContactoRepository.java
│       │   │   └── UsuarioRepository.java
│       │   └── Service/
│       │       ├── PropiedadService.java
│       │       ├── UsuarioService.java
│       │       └── PasswordService.java
│       └── resources/
│           ├── application.properties
│           └── static/
│               ├── index.html                   # Página de inicio
│               ├── anuncio.html                 # Catálogo de propiedades
│               ├── propiedad.html               # Detalle de propiedad
│               ├── contacto.html
│               ├── nosotros.html
│               ├── blog.html
│               ├── admin/
│               │   ├── login.html
│               │   ├── index.html               # Dashboard
│               │   ├── propiedades.html
│               │   ├── crear.html
│               │   ├── actualizar.html
│               │   └── contactos.html           # CRM
│               ├── css/
│               │   └── app.css                  # Design system completo
│               └── js/
│                   ├── anuncios.js
│                   ├── crear.js
│                   ├── actualizar.js
│                   ├── propiedad.js
│                   ├── contacto.js
│                   └── main.js
├── uploads/                                     # Imágenes subidas (generada en runtime)
├── pom.xml
└── mvnw
```

---

## ⚙️ Instalación y configuración

### Prerrequisitos

- **Java 17** o superior
- **MongoDB** corriendo en `localhost:27017`
- **Maven** (o usar el wrapper `./mvnw` incluido)

### 1. Clonar el repositorio

```bash
git clone https://github.com/BryanCTG/inmobiliaria.git
cd inmobiliaria
```

### 2. Configurar la base de datos

El archivo `src/main/resources/application.properties` ya está configurado para conectarse a MongoDB local:

```properties
spring.data.mongodb.uri=mongodb://localhost:27017/bienesraices
spring.data.mongodb.database=bienesraices
```

Asegúrate de tener MongoDB corriendo antes de iniciar la aplicación.

### 3. Ejecutar la aplicación

```bash
./mvnw spring-boot:run
```

En Windows:

```bat
mvnw.cmd spring-boot:run
```

La aplicación estará disponible en: **http://localhost:8080**

### 4. Usuario administrador por defecto

Al iniciar por primera vez, se crea automáticamente un usuario administrador:

| Campo | Valor |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |
| Rol | ADMIN |

> ⚠️ **Importante:** Cambia estas credenciales en un entorno de producción.

---

## 🔌 API REST

### Propiedades

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/propiedades` | Listar todas las propiedades |
| `GET` | `/api/propiedades/{id}` | Obtener propiedad por ID |
| `GET` | `/api/propiedades/visibles` | Listar propiedades publicadas |
| `POST` | `/api/propiedades` | Crear propiedad (multipart/form-data) |
| `PUT` | `/api/propiedades/{id}` | Actualizar propiedad |
| `DELETE` | `/api/propiedades/{id}` | Eliminar propiedad |
| `PATCH` | `/api/propiedades/{id}/visibilidad` | Toggle publicar/ocultar |

### Contactos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/contacto` | Listar todos los mensajes |
| `POST` | `/api/contacto` | Enviar mensaje de contacto |
| `PATCH` | `/api/contacto/{id}/atendido` | Toggle pendiente/atendido |
| `DELETE` | `/api/contacto/{id}` | Eliminar mensaje |

### Imágenes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/imagenes/subir` | Subir imagen (GridFS) |
| `GET` | `/api/imagenes/{id}` | Obtener imagen por ID |

---

## 🗺️ Rutas del panel de administración

| Ruta | Descripción |
|------|-------------|
| `/admin/login.html` | Página de inicio de sesión |
| `/admin/index.html` | Dashboard con estadísticas |
| `/admin/propiedades.html` | Gestión de propiedades |
| `/admin/crear.html` | Crear nueva propiedad |
| `/admin/actualizar.html?id={id}` | Editar propiedad existente |
| `/admin/contactos.html` | Bandeja de mensajes (CRM) |

---

## 🔒 Seguridad

- Autenticación gestionada completamente por **Spring Security**
- Las rutas `/admin/**` requieren el rol `ADMIN`
- Las rutas de la API (`/api/**`) y las páginas públicas son accesibles sin autenticación
- Las contraseñas se almacenan hasheadas con **BCrypt**
- CSRF deshabilitado (API REST con frontend desacoplado)

---

## 🚀 Mejoras futuras

- [ ] Notificaciones en tiempo real con WebSockets
- [ ] Sistema de roles múltiples (administrador y agentes)
- [ ] Filtros avanzados en el catálogo (precio, habitaciones, ciudad)
- [ ] Panel de estadísticas con gráficos
- [ ] Envío de correos automáticos al recibir un contacto
- [ ] Despliegue en la nube (Railway, Render o AWS)
- [ ] Optimización y compresión de imágenes al subir
- [ ] Soporte multi-idioma

---

## 👨‍💻 Autor

**Bryan Beltrán**

- GitHub: [@BryanCTG](https://github.com/BryanCTG)

---

## 📄 Licencia

Proyecto de uso educativo. Desarrollado como parte de la formación en Ingeniería de Sistemas.

---

<div align="center">
  <sub>Hecho con ❤️ en Cartagena, Colombia</sub>
</div>
