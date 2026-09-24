# Base de datos

Esta carpeta contiene la estructura y los datos de prueba de la base de datos
del proyecto PGC, actualizada hasta el sprint número 3.

> **Nota:** este documento refleja el estado de la base de datos *hasta este
> sprint*. No es una versión definitiva ni cerrada: a medida que aparezcan
> correcciones, ajustes de alcance o nuevas HUs en los siguientes sprints,
> este README se sigue actualizando junto con el esquema.

## Alcance del tercer sprint

`schema.sql` define la estructura acumulada hasta el tercer sprint. Incluye
todas las tablas de los sprints 1 y 2, más las nuevas de este sprint,
agregadas mediante `migracion_sprint3.sql`:

- Fechas límite por ciclo y por etapa (Radicación, Registro PGC,
  Sustentación, Calificación).
- PGC (activación de una propuesta aprobada como proyecto formal).
- Archivos de evidencia de un PGC.
- *(Creadas en este sprint, sin uso todavía — ver más abajo)*: notas y
  comentarios de jurado, y documentos oficiales de ciclo (rúbricas y
  lineamientos).

La base de datos utilizada sigue siendo `pgc_db`, para MySQL con motor
InnoDB.

## Estructura del esquema

### Tablas heredadas de los sprints 1 y 2

Sin cambios en su estructura. Se listan aquí solo como referencia rápida;
la descripción completa de cada una sigue siendo válida tal como se
documentó en su momento:

- **`rol`** — roles de la plataforma (Estudiante, Profesor, Administrador).
- **`users`** — credenciales de acceso, con `full_name` para todos los
  roles.
- **`cycles`** — configuración de cada ciclo: nombre/materia
  (`name_cycle`, valores actuales: *Fundamentación*, *Profundización*,
  *Investigación-producción*), máximo de integrantes (`max_members`) y
  encargado del ciclo (`id_person_charge`).
- **`cycle_juror`** — profesores que actúan como jurado en cada ciclo.
- **`students`** — estudiante ligado a un ciclo específico. Una misma
  persona (`id_user`) puede tener varias filas en `students` a lo largo de
  su carrera, una por cada ciclo que cursa; así una propuesta o PGC de un
  ciclo anterior nunca se mezcla con el ciclo actual del estudiante.
- **`blacklisted_tokens`** — tokens JWT invalidados.
- **`proposals`** — propuestas de PGC radicadas (HU-09) y su ciclo de vida
  de validación (HU-08): título, problema, justificación, objetivos,
  solución, PDF adjunto, estado, comentario de rechazo, contador de
  reenvíos y quién tomó la última decisión.
- **`categories`** y **`proposal_categories`** — catálogo de categorías de
  proyecto y su relación con cada propuesta.
- **`proposal_students`** — integrantes de una propuesta, incluido el
  líder.

### Tablas nuevas de este sprint (Sprint 3)

#### `cycle_dates`

Fechas límite configurables por el encargado de cada ciclo, una fila por
combinación de ciclo y etapa (`unique_cycle_stage`). Las etapas son:

- **Radicación** — ventana para que el estudiante envíe su propuesta
  (HU-09). No limita la revisión/aprobación del encargado (HU-08), que
  puede decidir en cualquier momento después de esta ventana.
- **Registro PGC** — ventana para registrar el PGC (HU-02) y para
  subir/reemplazar archivos de evidencia (HU-03). Ambas acciones comparten
  la misma etapa.
- **Sustentación** — por ahora es solo informativa (se muestra en
  pantalla); ningún endpoint la valida todavía.
- **Calificación** — ventana en la que los jurados pueden calificar
  (HU-07). *(Aún sin activar, llega en Sprint 5.)*

#### `pgc`

Activa una propuesta aprobada como proyecto formal. No copia título,
problema, justificación, objetivos, solución, categorías ni integrantes:
como el equipo decidió que esos campos **no se pueden editar en ningún
momento posterior a la aprobación de la idea** (HU-03 quedó limitada solo a
subir archivos, sin edición de contenido), esos datos se siguen
consultando directamente desde `proposals`, `proposal_categories` y
`proposal_students` mediante `id_proposal`. Evita duplicar información que
nunca va a divergir de la propuesta original.

Incluye además:

- `id_pgc_previous` — referencia opcional (auto-FK, `ON DELETE SET NULL`)
  a otro PGC anterior. **Siempre queda en `NULL` por ahora**: ninguna HU de
  este proyecto la escribe. Existe para que, si más adelante se retoma
  HU-10 (continuidad de un proyecto entre ciclos), la ficha histórica de
  HU-05 ya tenga dónde apuntar sin necesitar otro cambio de esquema.
- `state_pgc` — por ahora solo `En Proceso` / `Terminado`. La transición
  automática a `Terminado` se define en Sprint 5, junto con HU-07 (se
  dispara al cerrar la etapa "Calificación").

#### `pgc_files`

Archivos de evidencia subidos por los estudiantes durante la etapa
"Registro PGC" (HU-03): PDF, Word, Excel, imágenes o PowerPoint, con
título/descripción asignado por quien lo sube, validado contra 10 MB
máximo y el formato permitido. El reemplazo de un archivo es simple
(sobrescribe la fila existente); no se guarda historial de versiones.

#### `jury_grades` *(creada en este sprint, sin uso todavía — llega en Sprint 5)*

Nota (0.0 a 5.0) y comentario que cada jurado deja sobre un PGC (HU-07).
Un jurado no puede calificar dos veces el mismo PGC (`unique_pgc_juror`),
y el acceso es privado por diseño: cada jurado solo puede consultar su
propia fila desde el backend.

#### `cycle_documents` *(creada en este sprint, sin uso todavía — llega en Sprint 5)*

Unifica dos necesidades con la misma estructura: rúbricas de calificación
que sube el encargado de ciclo (HU-06) y lineamientos oficiales que sube
el administrador (HU-11), diferenciadas por `doc_type`. Cada fila nueva es
una versión distinta; la "vigente" es la de fecha más reciente para ese
ciclo y tipo de documento — el historial de versiones queda resuelto sin
necesitar una columna adicional.

## Carga de la base de datos

Ejecuta los archivos en este orden:

1. `schema.sql`, para crear el esquema y las tablas heredadas.
2. `seed.sql`, para insertar los datos de prueba.
3. `migracion_sprint3.sql`, para agregar las tablas nuevas de este sprint.

Por ejemplo, desde el cliente de MySQL:

```sql
SOURCE db/schema.sql;
SOURCE db/seed.sql;
SOURCE db/migracion_sprint3.sql;
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

