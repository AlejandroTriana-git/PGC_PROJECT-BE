import bucket from "../config/firebaseConfig.js";
import * as pgcArchivoRepository from "../repositories/pgcArchivoRepository.js";
import { estaDentroDeLaEtapa, STAGES } from "../validators/ciclosValidator.js";
import { FORMATOS_PERMITIDOS } from "../validators/archivoPgcValidator.js";

//esta funcion arma el error con su status para que el controller sepa que codigo devolver
function crearError(mensaje, status) {
  const error = new Error(mensaje);
  error.status = status;
  return error;
}

//esta funcion convierte el nombre del archivo en un texto limpio (minusculas, sin tildes ni espacios)
//solo sirve para armar el nombre del objeto en firebase, el titulo que ve el FE sale de title_file
function generarSlug(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") //aca se quitan las tildes
    .replace(/[^a-z0-9.]+/g, "-") //todo lo que no sea letra, numero o punto se vuelve guion
    .replace(/(^-|-$)/g, ""); //y se quitan los guiones del inicio y del final
}

//esta funcion arma la ruta del archivo en firebase con la convencion del equipo:
//pgc/{id_cycle}/{id_student}/{id_pgc}/{timestamp}-{slug}
//el timestamp evita que dos archivos con el mismo nombre se pisen
function armarStoragePath(id_cycle, id_student, id_pgc, nombre_original) {
  return `pgc/${id_cycle}/${id_student}/${id_pgc}/${Date.now()}-${generarSlug(nombre_original)}`;
}

//esta funcion sube el archivo a firebase, mismo patron que propuestaService.subirArchivoFirebase (duplicado por ahora)
async function subirArchivoFirebase(storage_path, archivo) {
  const referencia_archivo = bucket.file(storage_path);
  try {
    //public: false para que nadie lo vea sin una url firmada
    await referencia_archivo.save(archivo.buffer, {
      metadata: { contentType: archivo.mimetype },
      public: false,
    });
  } catch (error) {
    //el detalle del error se queda en el log, al cliente solo le llega un mensaje general
    console.error("❌ Error subiendo archivo de PGC a Firebase:", error.code, error.message);
    throw crearError("Error al subir el archivo. Intenta de nuevo.", 500);
  }
}

//esta funcion borra un archivo de firebase, es best-effort: si falla el borrado no se lanza el error
async function borrarArchivoFirebase(storage_path) {
  if (!storage_path) return;
  try {
    await bucket.file(storage_path).delete();
  } catch (error) {
    console.error("No se pudo borrar archivo de PGC en Firebase:", storage_path, error.code);
  }
}

//esta funcion genera la url firmada para ver el archivo, dura 1 hora
async function generarUrlFirmada(storage_path) {
  const [url] = await bucket.file(storage_path).getSignedUrl({
    action: "read",
    expires: Date.now() + 60 * 60 * 1000, // 1 hora
  });
  return { url, expira_en_segundos: 3600 };
}

//esta funcion revisa que el usuario del token sea integrante (lider o no) de la propuesta a la que pertenece el pgc
async function verificarPertenencia(id_pgc, id_user) {
  //primero que el pgc exista
  const pgc = await pgcArchivoRepository.buscarPgcPorId(id_pgc);
  if (!pgc) throw crearError("PGC no encontrado", 404);

  //despues que el usuario sea estudiante
  const id_student = await pgcArchivoRepository.buscarIdStudentPorUsuario(id_user);
  if (!id_student) throw crearError("El usuario no es estudiante", 403);

  //y por ultimo que haga parte del equipo de esa propuesta
  const es_integrante = await pgcArchivoRepository.esIntegranteDePropuesta(pgc.id_proposal, id_student);
  if (!es_integrante) throw crearError("No perteneces a este PGC", 403);

  return { pgc, id_student };
}

//esta funcion revisa que hoy este dentro de la ventana de la etapa "Registro PGC" del ciclo
async function verificarVentanaRegistro(id_cycle) {
  const dentro_ventana = await estaDentroDeLaEtapa(id_cycle, STAGES.REGISTRO_PGC);
  if (!dentro_ventana) throw crearError("Fuera de la ventana de registro de PGC", 400);
}

// mapeo de salida (regla de Alejandro): el FE nunca ve storage_path, id_pgc_file ni uploaded_by
async function mapearArchivoParaFrontend(fila) {
  return {
    id_file: fila.id_pgc_file,
    title_file: fila.title_file, //ahora el titulo sale de la columna, ya no del nombre del archivo
    desc_file: fila.desc_file,
    url_file: await generarUrlFirmada(fila.storage_path),
  };
}

//esta funcion recibe en datos el title_file y la desc_file que ya valido el controller
async function subirArchivo(id_pgc, id_user, archivo, datos) {
  //aca se revisa que sea del equipo y que este dentro de la ventana de fechas
  const { pgc, id_student } = await verificarPertenencia(id_pgc, id_user);
  await verificarVentanaRegistro(pgc.id_cycle);

  //primero se sube a firebase y despues se guarda en la bd
  const storage_path = armarStoragePath(pgc.id_cycle, id_student, id_pgc, archivo.originalname);
  await subirArchivoFirebase(storage_path, archivo);

  try {
    const id_pgc_file = await pgcArchivoRepository.crear({
      id_pgc,
      storage_path,
      file_format: FORMATOS_PERMITIDOS[archivo.mimetype],
      uploaded_by: id_student,
      title_file: datos.title_file,
      desc_file: datos.desc_file,
    });
    return mapearArchivoParaFrontend(await pgcArchivoRepository.buscarPorId(id_pgc_file));
  } catch (error) {
    await borrarArchivoFirebase(storage_path); // si la BD falla no queda un archivo huerfano en Firebase
    throw error;
  }
}

//esta funcion mapea una lista de filas, si falla la url de un archivo no se cae toda la lista, ese archivo sale con url_file en null
async function mapearListaArchivos(filas) {
  return Promise.all(
    filas.map(async (fila) => {
      try {
        return await mapearArchivoParaFrontend(fila);
      } catch (error) {
        console.error("Error generando URL firmada para archivo", fila.id_pgc_file, error.message);
        return {
          id_file: fila.id_pgc_file,
          title_file: fila.title_file,
          desc_file: fila.desc_file,
          url_file: null,
        };
      }
    })
  );
}

//esta funcion lista los archivos del pgc, solo para los integrantes del equipo
async function listarArchivos(id_pgc, id_user) {
  await verificarPertenencia(id_pgc, id_user);
  const filas = await pgcArchivoRepository.listarPorPgc(id_pgc);
  return mapearListaArchivos(filas);
}

//esta funcion lista los archivos para la ficha publica del pgc (HU-05), no revisa si es del equipo
//porque la ficha esta abierta a los 3 roles, la existencia del pgc ya la valida pgcService
async function listarArchivosParaFicha(id_pgc) {
  const filas = await pgcArchivoRepository.listarPorPgc(id_pgc);
  return mapearListaArchivos(filas);
}

//aca el archivo es opcional, si no llega solo se cambian title_file y desc_file y el archivo guardado se mantiene igual
async function reemplazarArchivo(id_pgc, id_pgc_file, id_user, archivo, datos) {
  //aca se revisa que sea del equipo y que este dentro de la ventana de fechas
  const { pgc, id_student } = await verificarPertenencia(id_pgc, id_user);
  await verificarVentanaRegistro(pgc.id_cycle);

  //el archivo tiene que existir y ser de ese pgc, si no, no se deja editar el de otro equipo
  const archivo_existente = await pgcArchivoRepository.buscarPorId(id_pgc_file);
  if (!archivo_existente || archivo_existente.id_pgc !== Number(id_pgc)) {
    throw crearError("Archivo no encontrado", 404);
  }

  //si no mandaron archivo nuevo solo se actualizan los textos y no se toca firebase
  if (!archivo) {
    await pgcArchivoRepository.actualizarTextos(id_pgc_file, datos);
    return mapearArchivoParaFrontend(await pgcArchivoRepository.buscarPorId(id_pgc_file));
  }

  //si mandaron archivo nuevo se sube con una ruta nueva y el viejo se borra al final
  const storage_path_viejo = archivo_existente.storage_path;
  const storage_path = armarStoragePath(pgc.id_cycle, id_student, id_pgc, archivo.originalname);

  await subirArchivoFirebase(storage_path, archivo); // nunca se reutiliza el path, siempre uno nuevo

  try {
    await pgcArchivoRepository.actualizar(id_pgc_file, {
      title_file: datos.title_file,
      desc_file: datos.desc_file,
      storage_path,
      file_format: FORMATOS_PERMITIDOS[archivo.mimetype],
    });
    await borrarArchivoFirebase(storage_path_viejo); // el viejo solo se borra si el UPDATE funciono
    return mapearArchivoParaFrontend(await pgcArchivoRepository.buscarPorId(id_pgc_file));
  } catch (error) {
    await borrarArchivoFirebase(storage_path); // si fallo, se borra el nuevo y el viejo queda intacto
    throw error;
  }
}

//esta funcion elimina el archivo, primero de la bd y despues de firebase
async function eliminarArchivo(id_pgc, id_pgc_file, id_user) {
  await verificarPertenencia(id_pgc, id_user);

  const archivo_existente = await pgcArchivoRepository.buscarPorId(id_pgc_file);
  if (!archivo_existente || archivo_existente.id_pgc !== Number(id_pgc)) {
    throw crearError("Archivo no encontrado", 404);
  }

  await pgcArchivoRepository.eliminar(id_pgc_file);
  await borrarArchivoFirebase(archivo_existente.storage_path);
}

export { subirArchivo, listarArchivos, listarArchivosParaFicha, reemplazarArchivo, eliminarArchivo };