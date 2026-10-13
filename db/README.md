# Base de datos

Esta carpeta contiene la estructura y los datos de prueba de la base de datos
del proyecto PGC, actualizada hasta el sprint número 5, hasta este punto se supone que
es la BD definitiva para la sustentación final de los PGC.

> **Nota:** este documento refleja el estado de la base de datos *hasta este
> sprint*. A pesar de decir que es la definita, a medida que aparezcan
> correcciones, ajustes de alcance o nuevas HUs en los siguientes sprints,
> este README se sigue actualizando junto con el esquema.

## Alcance del quinto sprint

`schema.sql` define la estructura acumulada hasta este quinto sprint. Incluye
todas las tablas de los sprints 1, 2, 3, 4 más las nuevas de este sprint:

- Correcciones frente al tema de separacion tabla de lineamientos.
- Seed definitiva para el dia de la sistentación de los PGC.

La base de datos utilizada sigue siendo `pgc_db`, para MySQL con motor
InnoDB.

## Estructura del esquema

### Tablas base (sprints 1 y 2)

Sin cambios en su estructura. Se listan aquí solo como referencia rápida;
la descripción completa de cada una sigue siendo válida tal como se
documentó en su momento:

- **`rol`** — roles de la plataforma (Estudiante, Profesor, Administrador).
  "Jurado" y "Encargado de ciclo" no son roles: son responsabilidades que
  se asignan a un usuario con rol Profesor.
- **`users`** — credenciales de acceso, con `full_name` para todos los
  roles.
- **`cycles`** — configuración de cada ciclo: nombre
  (`name_cycle`, valores actuales: *Fundamentación*, *Profundización*,
  *Investigación-producción*), máximo de integrantes (`max_members`) y
  encargado del ciclo (`id_person_charge`).
- **`cycle_juror`** — profesores que actúan como jurado en cada ciclo. Todos
  los jurados de un ciclo califican todos los PGC de ese ciclo.
- **`students`** — estudiante ligado a un ciclo específico. Una misma
  persona (`id_user`) puede tener varias filas en `students` a lo largo de
  su carrera, una por cada ciclo que cursa; así una propuesta o PGC de un
  ciclo anterior nunca se mezcla con el ciclo actual del estudiante.
- **`blacklisted_tokens`** — tokens JWT invalidados al cerrar sesión. Guarda
  el usuario, el token y su fecha de expiración natural (`expires_at`, la
  misma que ya traía el JWT). Esa fecha no se usa para decidir si un token
  está bloqueado; solo sirve para limpiar después las filas que ya vencieron.
- **`proposals`** — propuestas de PGC radicadas (HU-09) y su ciclo de vida
  de validación (HU-08): título, problema, justificación, objetivos,
  solución, PDF adjunto, estado, comentario de rechazo, contador de
  reenvíos y quién tomó la última decisión.
- **`categories`** y **`proposal_categories`** — catálogo de categorías de
  proyecto y su relación con cada propuesta.
- **`proposal_students`** — integrantes de una propuesta, incluido el
  líder.

### Tablas agregadas desde el sprint 3

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
  pantalla); ningún endpoint la valida.
- **Calificación** — ventana en la que los jurados pueden calificar
  (HU-07).

Las fechas son `DATETIME`. Para que el último día de una ventana cuente
completo, la fecha de fin debe guardarse con hora `23:59:59`.

#### `pgc`

Activa una propuesta aprobada como proyecto formal. No copia título,
problema, justificación, objetivos, solución, categorías ni integrantes:
como el equipo decidió que esos campos **no se pueden editar en ningún
momento posterior a la aprobación de la idea** (HU-03 quedó limitada solo a
subir archivos, sin edición de contenido), esos datos se consultan siempre
desde `proposals`, `proposal_categories` y `proposal_students` mediante
`id_proposal`. Evita duplicar información que nunca va a divergir de la
propuesta original. Una propuesta solo puede activarse como un único PGC
(`id_proposal` es único).

Incluye además:

- `id_pgc_previous` — referencia opcional (auto-FK, `ON DELETE SET NULL`)
  a otro PGC anterior. **Siempre queda en `NULL` por ahora**: ninguna HU de
  este proyecto la escribe. Existe para que, si más adelante se retoma
  HU-10 (continuidad de un proyecto entre ciclos), la ficha histórica de
  HU-05 ya tenga dónde apuntar sin necesitar otro cambio de esquema.
- `state_pgc` — solo `En Proceso` / `Terminado`. Ninguna pantalla lo edita:
  el sistema lo pasa a `Terminado` automáticamente cuando todos los jurados
  del ciclo ya calificaron ese PGC (HU-07).

#### `pgc_files`

Archivos de evidencia subidos por los estudiantes durante la etapa
"Registro PGC" (HU-03): PDF, Word, Excel, imágenes o PowerPoint, validados
contra 10 MB máximo y el formato permitido.

- `title_file` y `desc_file` son obligatorios: el estudiante asigna un título
  y una descripción a cada archivo.
- `uploaded_by` es el estudiante (`students.id_student`) que lo sube.
- `storage_path` guarda la ruta del archivo en Firebase Storage, con la forma
  `pgc/{id_cycle}/{id_student}/{id_pgc}/{timestamp}-{nombre}`.
- El reemplazo de un archivo es simple (sobrescribe la fila existente); no se
  guarda historial de versiones.

#### `jury_grades`

Nota y comentario que cada jurado deja sobre un PGC (HU-07).

- Un jurado no puede calificar dos veces el mismo PGC (`unique_pgc_juror`). El
  índice está marcado como `INVISIBLE`, lo que no afecta la restricción: la
  base de datos sigue rechazando el duplicado.
- La nota es `DECIMAL(2,1)`; el rango de 0.0 a 5.0 lo valida el backend, no la
  base de datos.
- El acceso es privado por diseño: cada jurado solo puede consultar su propia
  fila desde el backend.
- La nota global del PGC no se almacena: es el promedio de estas filas y se
  calcula cuando todos los jurados del ciclo ya calificaron.

#### `cycle_documents`

Documentos que pertenecen a un ciclo. Hoy guarda únicamente **rúbricas de
calificación** (`doc_type` solo admite `Rúbrica`), que sube el encargado de
ese ciclo (HU-06). Los lineamientos ya no se guardan aquí: pasaron a
`guideline_documents`.

- Un ciclo puede tener varias rúbricas distintas, cada una identificada por su
  `title_file` (con `desc_file` opcional).
- Las versiones de una misma rúbrica se distinguen por `version_label`
  (por ejemplo, `V1.0`, `V2.0`). Cada versión nueva es una fila nueva; nunca se
  actualiza ni se borra la anterior. La combinación ciclo, tipo, título y versión
  es única (`uq_cycle_doc_version`).
- La versión vigente de cada título es la fila más reciente. Las anteriores se
  muestran solo como historial (versión, fecha y quién la subió), sin permitir
  su descarga.
- `uploaded_by` registra quién subió cada versión.
- `storage_path` guarda la ruta en Firebase, con la forma
  `ciclos/{id_cycle}/documentos/rubrica/{título}_{versión}_{timestamp}.pdf`.

#### `guideline_documents`

Lineamientos oficiales del programa (HU-11): plantillas de radicación, formato
del documento final, reglamentos y similares. Son **globales**: aplican a todos
los ciclos, por eso la tabla no tiene `id_cycle`. Solo el Administrador los
publica, y todos los usuarios autenticados pueden consultarlos.

- Funciona igual que `cycle_documents`: cada documento se identifica por su
  `title_file` (con `desc_file` opcional) y cada nueva versión
  (`version_label`) es una fila nueva. La vigente es la más reciente de cada
  título; las anteriores quedan como historial de solo metadatos.
- `uploaded_by` registra qué administrador subió cada versión.
- `storage_path` guarda la ruta en Firebase, con la forma
  `lineamientos/{título}_{versión}_{timestamp}.pdf`.
- A diferencia de `cycle_documents`, no tiene un índice único sobre título y
  versión, así que es el backend quien debe evitar repetir la versión de un
  mismo título.

**Rúbricas y lineamientos:** los lineamientos dicen cómo se hace el proceso
(plantillas, formatos, reglas institucionales); las rúbricas dicen cómo se
califica. Si un documento define criterios de evaluación, es una rúbrica y lo
sube el encargado del ciclo.

## Carga de la base de datos

Ejecuta los archivos en este orden:

1. `schema.sql`, para crear el esquema y las tablas heredadas.
2. `seed.sql`, para insertar los datos de prueba, hasta este punto la seed ya trae el TRUNCATE.


## Datos de prueba

`seed.sql` contiene 58 usuarios: 33 estudiantes, 24 profesores (21 de ciclos siendo 
jurados y encargados algunos, más 3 de prueba adicionales) y 1 administrador. 
Para este caso, se hizo uso de datos de estudiantes que estan cursando
software, sin embargo fueron divididos en los ciclos en sus mismos grupos
(pero se agruparon en los ciclos de acuerdo a la cantidad de integrantes 
que habia en cada grupo).

Las contraseñas en texto plano para probar el login son:

| Rol | Contraseña |
| --- | --- |
| Estudiantes | `Estudiante123!` |
| Profesores| `Profesor123!` |
| Administrador| `Admin123!` |

> **Importante:** los hashes incluidos en `seed.sql` ya fueron generados con
> bcrypt usando un factor de costo 10. No deben regenerarse ni modificarse.
> Importa el archivo tal cual para que todo el equipo conserve los mismos
> usuarios, `id_user` y contraseñas de prueba.

## Escenario de demostracón


Cada equipo quedó en un estado distinto para poder mostrar cada HU en vivo, ademas de que sirve
para probar en este 5 sprint.
 
| Equipo | Ciclo | Estado | Qué permite mostrar |
|---|---|---|---|
| 1 | Fundamentación | Aprobada / PGC Terminado | Aprobada + PGC **Terminado**, 4 archivos, 7/7 notas (promedio 4.4). Vista consolidada de notas (HU-07), ficha (HU-05), buscador (HU-04). |
| 2 | Investigación-producción | Aprobada / PGC Terminado | PGC **Terminado**, 3 archivos, 7/7 notas (promedio 4.0), calificación cerrada. |
| 3 | Fundamentación | Aprobada / PGC En Proceso | PGC **En Proceso**, 2 archivos, 3/7 notas. Los 4 jurados restantes pueden calificar en vivo; muestra que cada jurado solo ve lo suyo. |
| 4 | Profundización | Aprobada / PGC En Proceso | PGC **En Proceso**, 2 archivos, 0 notas: los 7 jurados de Profundización pueden calificar en vivo. |
| 5 | Fundamentación | Aprobada | Aprobada **sin PGC**: el líder registra el PGC en vivo (HU-02) y sube archivos (HU-03). |
| 6 | Investigación-producción | Aprobada / PGC En Proceso | PGC **En Proceso**, 2 archivos, 4/7 notas, **Calificación cerrada**: los 3 jurados faltantes ven "El periodo de calificación ha finalizado". |
| 7 | Fundamentación | Pendiente de validación | **Pendiente de validación**: el encargado de Fundamentación aprueba o rechaza en vivo (HU-08). |
| 8 | Investigación-producción | Aprobada | Aprobada sin PGC con **Registro PGC cerrado**: muestra el mensaje de periodo no disponible. |
| 9 | Profundización | Rechazada | **Rechazada** (1 rechazo) con comentario visible para todo el equipo; el líder puede editar y reenviar. |
| 10 | Profundización | Anulada | **Anulada** (3 rechazos): mensaje de propuesta anulada. |
| 11 | Profundización | Pendiente de validación | **Pendiente de validación** en un ciclo con Radicación cerrada: muestra que el encargado sí puede revisar fuera de esa ventana. |

### Ventanas de fechas (relativas a hoy)
 
| Ciclo | Radicación | Registro PGC | Sustentación | Calificación |
|---|---|---|---|---|
| Fundamentación | abierta (-60 a +30 d) | abierta (-20 a +30 d) | futura (+20 a +25 d) | abierta (-5 a +40 d) |
| Profundización | cerrada (-60 a -30 d) | abierta (-20 a +30 d) | futura (+20 a +25 d) | abierta (-5 a +40 d) |
| Investigación-producción | cerrada (-90 a -60 d) | cerrada (-60 a -20 d) | cerrada (-15 a -10 d) | cerrada (-9 a -1 d) |
 
En Fundamentación y Profundización la Calificación está abierta aunque la Sustentación todavía sea futura; es intencional para poder calificar en vivo.


## Qué no cubre
- **Paginación del buscador (HU-04):** con 33 estudiantes salen 11 equipos y solo 5 PGC, así que no se llega a 15 resultados.
- **Nota 0.0 de propuestas anuladas:** no hay columna donde guardarla; la propuesta anulada solo queda con su estado, pensar en un trigger a futuro para ese proceso.
- **Estado del PGC:** el seed deja `Terminado` donde ya calificaron todos los jurados, igual que debería hacerlo el sistema. La transición automática en sí es parte de HU-07, no del seed.