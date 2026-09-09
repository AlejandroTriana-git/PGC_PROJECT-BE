# Base de datos

Esta carpeta contiene la estructura inicial y los datos de prueba de la base de
datos del proyecto PGC.

## Alcance del primer sprint

`schema.sql` define la estructura base para el primer sprint. En esta etapa solo
se incluyen las tablas relacionadas con:

- Roles de usuario.
- Usuarios y sus credenciales.
- Información complementaria de estudiantes.
- Tokens JWT invalidados o en lista negra.

La base de datos utilizada es `pgc_db` y está diseñada para MySQL con el motor
InnoDB.

## Estructura del esquema

### `rol`

Almacena los roles disponibles en la plataforma:

- Estudiante
- Profesor
- Jurado
- Encargado de Ciclo
- Administrador

### `users`

Almacena las credenciales de acceso. Cada usuario pertenece a un rol mediante
`id_rol` y el correo (`mail_user`) es único. La contraseña se almacena en
`password_user` como un hash.

### `students`

Contiene la información específica de los estudiantes y se relaciona con
`users` mediante `id_user`.

### `blacklisted_tokens`

Registra los tokens JWT invalidados. Guarda el usuario asociado, el token y su
fecha de expiración para permitir la invalidación de sesiones o cierres de
sesión.

## Carga de la base de datos

Ejecuta los archivos en este orden:

1. `schema.sql`, para crear el esquema y las tablas.
2. `seed.sql`, para insertar los roles y los datos de prueba.

Por ejemplo, desde el cliente de MySQL:

```sql
SOURCE db/schema.sql;
SOURCE db/seed.sql;
```

## Datos de prueba

`seed.sql` contiene un usuario de prueba por cada rol. Las contraseñas en texto
plano para probar el login son:

| Usuario | Contraseña |
| --- | --- |
| estudiante@ucundinamarca.edu.co | `Estudiante123!` |
| profesor@ucundinamarca.edu.co | `Profesor123!` |
| jurado@ucundinamarca.edu.co | `Jurado123!` |
| encargado@ucundinamarca.edu.co | `Encargado123!` |
| admin@ucundinamarca.edu.co | `Admin123!` |

> **Importante:** los hashes incluidos en `seed.sql` ya fueron generados con
> bcrypt usando un factor de costo 10. No deben regenerarse ni modificarse.
> Importa el archivo tal cual para que todo el equipo conserve los mismos
> usuarios, `id_user` y contraseñas de prueba.


