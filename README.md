# Plataforma Web Gestión PGC — Backend

API REST de la plataforma de gestión, seguimiento y continuidad de los **Proyectos de Gestión del Conocimiento (PGC)**. Centraliza la información de los proyectos, permite hacer seguimiento durante los ciclos académicos y consultar proyectos anteriores para fomentar su reutilización.

El frontend (HTML, CSS y JS puro) está desplegado en `https://pgcfe.vercel.app` y es el único origen permitido por CORS.

## Tecnologías

| Área | Tecnología |
|---|---|
| Entorno | Node.js 22 (módulos ES) |
| Framework | Express 5 |
| Base de datos | MySQL (`mysql2`, pool de conexiones, procedimientos almacenados) |
| Autenticación | JWT (`jsonwebtoken`) + contraseñas con `bcryptjs` |
| Archivos | `multer` (memoria) + Firebase Storage (`firebase-admin`) |
| Pruebas | Jest + Supertest |
| Calidad | ESLint + SonarCloud |
| Metodología | Ágil(marco de trabajo scrum + kanban) |

## Arquitectura

Se sigue una arquitectura por capas. Cada petición recorre el mismo camino:

```
Ruta → Middlewares → Controlador → Servicio → Repositorio → MySQL
```

```
server.js                 punto de entrada (levanta el servidor)
src/
├── app.js                configura Express, CORS y monta las rutas
├── config/               conexión a MySQL (db.js) y Firebase (firebaseConfig.js)
├── routes/               define endpoints y los middlewares de cada uno
├── middlewares/          autenticación, roles, pertenencia al ciclo, subida de archivos
├── controllers/          reciben la petición y devuelven la respuesta HTTP
├── services/             reglas de negocio
├── repositories/         consultas SQL y llamadas a procedimientos almacenados
└── validators/           validación de datos de entrada
tests/                    pruebas unitarias y de integración (con base de datos y Firebase simulados)
```

## Roles

- **Estudiante**: radica propuestas, crea y gestiona su PGC y sus archivos.
- **Profesor**: encargado o jurado de un ciclo; revisa propuestas, configura fechas y califica PGC.
- **Administrador**: crea y edita ciclos, asigna jurados y publica lineamientos.

## Endpoints

Todas las rutas empiezan con `/api`. 🔒 = requiere token (`Authorization: Bearer <token>`); 🔓 = el token es opcional.

### Autenticación — `/api/auth`
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/login` | Inicia sesión y devuelve el JWT |
| POST | `/logout` 🔒 | Cierra sesión (el token queda en lista negra) |

### Propuestas — `/api/propuestas`
| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/` 🔒 | Estudiante | Radica una propuesta (PDF) |
| PATCH | `/:id/reenviar` 🔒 | Estudiante | Reenvía una propuesta corregida |
| GET | `/mia` 🔒 | Estudiante | Consulta su propuesta |
| GET | `/aprobadas-sin-pgc` 🔒 | Estudiante | Propuestas aprobadas que aún no tienen PGC |
| GET | `/` 🔒 | Todos | Lista propuestas pendientes |
| PATCH | `/:id/aprobar` 🔒 | Encargado del ciclo | Aprueba una propuesta |
| PATCH | `/:id/rechazar` 🔒 | Encargado del ciclo | Rechaza una propuesta |
| GET | `/:idProposal/pdf` 🔒 | Con permiso de ver | Descarga el PDF de la propuesta |

### PGC — `/api/pgc`
| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/` 🔒 | Estudiante | Crea un PGC |
| GET | `/search` 🔓 | Todos | Busca PGC (buscador/histórico) |
| GET | `/mine` 🔒 | Estudiante | Lista sus PGC |
| GET | `/pendientes-calificacion` 🔒 | Profesor | PGC por calificar |
| GET | `/calificados-por-mi` 🔒 | Profesor | PGC que ya calificó |
| POST | `/:id_pgc/calificar` 🔒 | Profesor | Califica un PGC |
| GET | `/:id_pgc/calificaciones` 🔒 | Estudiante, Profesor | Consulta las calificaciones |
| GET | `/:id` 🔓 | Todos | Ficha de un PGC |
| POST | `/:id/files` 🔒 | — | Sube un archivo al PGC |
| GET | `/:id/files` 🔒 | — | Lista los archivos del PGC |
| PUT | `/:id/files/:idArchivo` 🔒 | — | Reemplaza un archivo |
| DELETE | `/:id/files/:idArchivo` 🔒 | — | Elimina un archivo |

### Ciclos — `/api/ciclos`
| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/` 🔓 | Todos | Lista ciclos |
| POST | `/` 🔒 | Administrador | Crea un ciclo |
| PUT | `/:id` 🔒 | Administrador | Edita un ciclo |
| GET | `/profesores` 🔒 | Todos | Profesores disponibles para el ciclo |
| GET | `/:id/jurados` 🔒 | Todos | Lista los jurados |
| POST | `/:id/jurados` 🔒 | Administrador | Asigna jurados |
| DELETE | `/:id/jurados/:id_jurado` 🔒 | Administrador | Quita un jurado |
| GET | `/:id/fechas` 🔒 | Todos | Fechas del ciclo |
| PUT | `/:id/fechas/:stage` 🔒 | Profesor encargado | Actualiza las fechas de una etapa |
| POST | `/:id/documentos/rubrica` 🔒 | Encargado del ciclo | Sube la rúbrica (PDF) |
| GET | `/:id/documentos` 🔒 | Miembros del ciclo | Documentos del ciclo |
| GET | `/:id/documentos/:title_file/historial` 🔒 | Miembros del ciclo | Historial de versiones de un documento |

### Lineamientos — `/api/lineamientos`
| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/` 🔒 | Todos | Lista los lineamientos |
| POST | `/` 🔒 | Administrador | Sube un lineamiento (PDF) |
| GET | `/:title_file/historial` 🔒 | Todos | Historial de versiones |

### Catálogos
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/categorias` 🔓 | Lista categorías |
| GET | `/api/profesores` 🔒 | Lista profesores |
| GET | `/api/estudiantes` 🔒 | Lista estudiantes |

La ruta `GET /` responde `API funcionando correctamente` y sirve para comprobar que el servidor está arriba.

## Puesta en marcha

### Requisitos
- Node.js 22 o superior
- Una base de datos MySQL con el esquema del proyecto (tablas y procedimientos `sp_*`)
- Un proyecto de Firebase con Storage habilitado

### Instalación

```bash
git clone https://github.com/AlejandroTriana-git/PGC_PROJECT-BE.git
cd PGC_PROJECT-BE
npm ci
```

### Variables de entorno

Crea un archivo `.env` en la raíz (no se sube al repositorio). Guíate por `.env-example`:

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (por defecto `3000`) |
| `DB_HOST` | Host de MySQL |
| `DB_PORT` | Puerto de MySQL |
| `DB_USER` | Usuario de MySQL |
| `DB_PASSWORD` | Contraseña de MySQL |
| `DB_NAME` | Nombre de la base de datos |
| `JWT_SECRET` | Clave para firmar los tokens (usa un valor largo y aleatorio) |
| `JWT_EXPIRES_IN` | Duración del token, por ejemplo `2h` |
| `FIREBASE_STORAGE_BUCKET` | Bucket de Firebase Storage |
| `GOOGLE_APPLICATION_CREDENTIALS` | JSON de la cuenta de servicio de Firebase en una sola línea (despliegue). En local se puede usar el archivo `src/config/service-account.json` |

> Nunca subas el `.env` ni `service-account.json`: ambos están en `.gitignore`.

### Ejecutar

```bash
npm run dev     # desarrollo, con recarga automática (nodemon)
npm start       # producción
```

El servidor queda en `http://localhost:3000` (o el `PORT` configurado).

## Pruebas y calidad

```bash
npm test        # pruebas unitarias + cobertura (genera coverage/lcov.info)
npm run lint    # ESLint
```

- Las pruebas **no necesitan** MySQL, Firebase ni un `.env`: usan una base de datos falsa y un bucket simulado (carpeta `tests/helpers/`), y generan sus propios secretos al vuelo. Por eso corren igual en local y en CI.
- Cobertura actual: **más de 80 % de líneas** sobre `src/`.
- Se ejecuta con `node --experimental-vm-modules` porque el proyecto usa módulos ES.

### Integración continua

El workflow `.github/workflows/ci.yml` corre en cada push y pull request a `main` y `develop`:

1. Instala dependencias (`npm ci`)
2. Lint
3. Verifica la sintaxis de todos los archivos
4. Ejecuta las pruebas y genera la cobertura
5. Envía el análisis a **SonarCloud** (configuración en `sonar-project.properties`)

Requisitos en el repositorio: el secreto `SONAR_TOKEN` y el **Automatic Analysis desactivado** en SonarCloud (no puede convivir con el análisis por CI).

## Seguridad

- Contraseñas almacenadas con hash (`bcryptjs`).
- Autenticación con JWT; al cerrar sesión el token se guarda en la tabla `blacklisted_tokens` y deja de ser válido.
- Control de acceso por rol y por pertenencia al ciclo mediante middlewares.
- CORS restringido al dominio del frontend.
- Se oculta la cabecera `X-Powered-By`.
- Subida de archivos con validación de formato y tamaño máximo.
- Sin credenciales en el código: todo secreto va en variables de entorno.

## Flujo de trabajo (Git)

- `main`: versión estable.
- `develop`: integración; todo cambio entra por pull request.
- Ramas por funcionalidad (`creacion-pgc`, `calificacion-pgc`, `pruebas-unitarias-jest`, etc.) que salen de `develop`.

## Equipo

Proyecto desarrollado por un equipo de 4 integrantes bajo la metodología ágil, marco de trabajo**Scrum**.

## Estado

🚧 En desarrollo.