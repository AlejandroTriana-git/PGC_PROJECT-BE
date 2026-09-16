# Base de datos

Esta carpeta contiene la estructura inicial y los datos de prueba de la base de
datos del proyecto PGC, en este caso para el sprint numero 2.

## Alcance del segundo sprint

`schema.sql` define la estructura base para el segundo sprint. En esta etapa solo
se incluyen las tablas relacionadas en el primer sprint, mas las nuevas necesarias para este segundo sprint:

- Roles de usuario (correccion, y solo se usan 3 de base).
- Usuarios y sus credenciales (se corrije y ahora hay full_name, para que todos tengan su nombre).
- Tokens JWT invalidados o en lista negra.
- Ciclos
- Jurados por ciclo
- Propuesta para PGC
- Categorias de proyectos+ tabla intermedia para que una propuesta pueda tener varias categorias
- Tabla intermedia para los miembros de un grupo

La base de datos utilizada es `pgc_db` y está diseñada para MySQL con el motor
InnoDB.

## Estructura del esquema

### `rol`

Almacena los roles disponibles en la plataforma. Se usan solo 3 valores base:

- Estudiante
- Profesor
- Administrador

**Nota:** "Jurado" y "Encargado de Ciclo" ya no son un rol de la cuenta.
Ambos son responsabilidades que se asignan sobre un usuario con rol Profesor,
y pueden cambiar en cada ciclo o periodo académico. Por eso se resuelven como
relaciones (`cycles.id_person_charge` y `cycle_juror`) y no como una fila más
de esta tabla. Esto permite que un mismo profesor sea, por ejemplo, encargado
de un ciclo y jurado de otro al mismo tiempo, sin conflicto.

### `users`

Almacena las credenciales de acceso. Cada usuario pertenece a un rol mediante
`id_rol` y el correo (`mail_user`) es único. La contraseña se almacena en
`password_user` como un hash. `full_name` guarda el nombre del usuario sin
importar su rol (antes solo `students` tenía nombre).

### `cycles`

Guarda la configuración de cada ciclo del programa: nombre/materia
(`name_cycle`), el máximo de integrantes permitido por equipo
(`max_members`) y el profesor encargado de validar las propuestas de ese
ciclo (`id_person_charge`, referencia a `users`). Esta configuración la
gestiona el Administrador.

### `cycle_juror`

Tabla intermedia entre `users` y `cycles`: indica qué profesores actúan como
jurado en cada ciclo. Un ciclo puede tener varios jurados, y un mismo
profesor puede ser jurado de más de un ciclo.

### `students`

Contiene la información específica de los estudiantes: se relaciona con
`users` mediante `id_user` (de ahí toma el nombre, vía `full_name`) y con
`cycles` mediante `id_cycle`, para saber en qué ciclo se encuentra
actualmente cada estudiante.

### `blacklisted_tokens`

Registra los tokens JWT invalidados. Guarda el usuario asociado, el token y su
fecha de expiración para permitir la invalidación de sesiones o cierres de
sesión.

### `proposals`

Almacena las propuestas de PGC que radica un estudiante líder (HU-09) y su
ciclo de vida de validación (HU-08). Incluye el título, la descripción y los
campos que más adelante reutilizará el registro del PGC (`problem_proposal`,
`justification_proposal`, `objectives_proposal`, `solution_proposal`), la
ruta del PDF adjunto, el estado (`Pendiente de validación`, `Aprobada`,
`Rechazada`, `Anulada`), el comentario del último rechazo, el contador de
reenvíos (`resubmit_count`, se anula automáticamente al llegar a 3) y quién
tomó la última decisión (`reviewed_by`, `reviewed_at`). Un mismo estudiante
solo puede liderar una propuesta por ciclo (`unique_leader_cycle`).

### `categories` y `proposal_categories`

`categories` es el catálogo de categorías de proyecto (Web, App Móvil, IoT,
Hardware, Gestión). `proposal_categories` es la tabla intermedia que permite
que una propuesta tenga una o varias categorías asociadas.

### `proposal_students`

Tabla intermedia que guarda todos los integrantes de una propuesta
(incluyendo al líder), para poder consultar el equipo completo con una sola
consulta.

## Carga de la base de datos

Ejecuta los archivos en este orden:

1. `schema.sql`, para crear el esquema y las tablas.
2. `seed.sql`, para insertar los datos de prueba.

Por ejemplo, desde el cliente de MySQL:

```sql
SOURCE db/schema.sql;
SOURCE db/seed.sql;
```

## Datos de prueba

`seed.sql` contiene 7 usuarios de prueba: 3 estudiantes, 3 profesores y 1
administrador. Los dos primeros estudiantes quedan en el mismo ciclo (para
poder probar la radicación de una propuesta en equipo) y el tercero en otro
ciclo distinto (para probar la validación de "integrantes de otro ciclo").
Entre los profesores, `profesor2` y `profesor3` quedan como jurado de un
ciclo distinto al que son encargados, para dejar de ejemplo en los datos el
caso de un profesor con varias responsabilidades a la vez.

Las contraseñas en texto plano para probar el login son:

| Usuario | Contraseña |
| --- | --- |
| estudiante1@ucundinamarca.edu.co | `Estudiante123!` |
| estudiante2@ucundinamarca.edu.co | `Estudiante123!` |
| estudiante3@ucundinamarca.edu.co | `Estudiante123!` |
| profesor1@ucundinamarca.edu.co | `Profesor123!` |
| profesor2@ucundinamarca.edu.co | `Profesor123!` |
| profesor3@ucundinamarca.edu.co | `Profesor123!` |
| admin@ucundinamarca.edu.co | `Admin123!` |

> **Importante:** los hashes incluidos en `seed.sql` ya fueron generados con
> bcrypt usando un factor de costo 10. No deben regenerarse ni modificarse.
> Importa el archivo tal cual para que todo el equipo conserve los mismos
> usuarios, `id_user` y contraseñas de prueba.