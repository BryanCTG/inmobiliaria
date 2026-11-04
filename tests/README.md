# Pruebas

Dos tipos de pruebas, todas contra la aplicación **en ejecución** (`http://localhost:8080`):

| Archivo | Tipo | Qué cubre |
|---|---|---|
| `publico.js` | Navegador real | Búsqueda desde el inicio, filtros, chips, paginación, formulario de contacto, XSS, movimiento reducido y desbordes en móvil |
| `admin.js` | Navegador real | Login, íconos y estilos, crear, ocultar, buscar y eliminar propiedades, CRM de mensajes, menú móvil |
| `funciones.js` | Navegador real | Favoritos, orden, mapa, WhatsApp, calculadora de cuota y propiedades similares |
| `valoracion-visitas.js` | Navegador real | Valoración pública, agendar visita, que el admin la vea y el encabezado en pantallas intermedias |
| `cuentas-ui.js` | Navegador real | Registro e ingreso, favoritos entre dispositivos, solicitudes, flujo completo del propietario y revisión del admin |
| `cuentas-api.py` | API (HTTP) | Matriz de permisos entre roles, intentos de abuso, límites por IP y aislamiento entre propietarios |

## Requisitos

- La aplicación corriendo con los datos de muestra (`--app.seed=true`) y el usuario `admin`. Las pruebas usan la contraseña de la variable `ADMIN_PASSWORD` (si no la defines, prueban con `admin123`, la contraseña de desarrollo local).
- Node.js 18 o superior y Microsoft Edge o Chrome (define `EDGE_PATH` si no está en la ruta de Windows por defecto).
- Python 3.10 o superior para `cuentas-api.py` (solo usa la biblioteca estándar).

```bash
cd tests
npm install
npm run publico
npm run admin
npm run funciones
npm run valoracion-visitas
npm run cuentas-ui
npm run cuentas-api
```

## Importante

- Las pruebas **crean y borran datos** (propiedades, mensajes y cuentas con correos `@test.com`). Las propiedades y los mensajes los limpian solas; las cuentas de prueba no tienen endpoint de borrado, así que se eliminan directamente de la base:
  `db.usuarios.deleteMany({ email: /@test\.com$/ })` en `mongosh`.
- La aplicación limita por IP los intentos de login (20 por 10 minutos), los registros (10 por hora) y los mensajes de contacto (10 por 10 minutos). Si encadenas varias pruebas seguidas, **reinicia la aplicación entre grupos** para reiniciar esos contadores.
- `cuentas-api.py` incluye a propósito pruebas de fuerza bruta y de límite de registros: ejecútalo en una instancia de desarrollo.
