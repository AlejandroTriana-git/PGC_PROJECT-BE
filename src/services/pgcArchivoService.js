import bucket from "../config/firebaseConfig.js";
import * as pgcArchivoRepository from "../repositories/pgcArchivoRepository.js";
import { estaDentroDeLaEtapa, STAGES } from "../validators/ciclosValidator.js";
import { FORMATOS_PERMITIDOS } from "../validators/archivoPgcValidator.js";

function crearError(mensaje, status) {
  const error = new Error(mensaje);
  error.status = status;
  return error;
}

// no hay columna title_file (decision de Alejandro): el titulo que ve el FE se
// deriva del storage_path, quitando la ruta y el timestamp del inicio
function extraerTitulo(storage_path) {
  const nombre_archivo = storage_path.split("/").pop();
  return nombre_archivo.replace(/^\d+-/, "");
}

function generarSlug(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ruta con la convencion del equipo: pgc/{id_cycle}/{id_student}/{id_pgc}/{timestamp}-{slug}
function armarStoragePath(id_cycle, id_student, id_pgc, nombre_original) {
  return `pgc/${id_cycle}/${id_student}/${id_pgc}/${Date.now()}-${generarSlug(nombre_original)}`;
}

// mismo patron que propuestaService.subirArchivoFirebase (duplicado por ahora)
async function subirArchivoFirebase(storage_path, archivo) {
  const referencia_archivo = bucket.file(storage_path);
  try {
    await referencia_archivo.save(archivo.buffer, {
      metadata: { contentType: archivo.mimetype },
      public: false,
    });
  } catch (error) {
    console.error("❌ Error subiendo archivo de PGC a Firebase:", error.code, error.message);
    throw crearError("Error al subir el archivo. Intenta de nuevo.", 500);
  }
}

// best-effort: si falla el borrado no se relanza el error
async function borrarArchivoFirebase(storage_path) {
  if (!storage_path) return;
  try {
    await bucket.file(storage_path).delete();
  } catch (error) {
    console.error("No se pudo borrar archivo de PGC en Firebase:", storage_path, error.code);
  }
}

async function generarUrlFirmada(storage_path) {
  const [url] = await bucket.file(storage_path).getSignedUrl({
    action: "read",
    expires: Date.now() + 60 * 60 * 1000, // 1 hora
  });
  return { url, expira_en_segundos: 3600 };
}

// el usuario del token debe ser integrante (lider o no) de la propuesta a la que pertenece el PGC
async function verificarPertenencia(id_pgc, id_user) {
  const pgc = await pgcArchivoRepository.buscarPgcPorId(id_pgc);
  if (!pgc) throw crearError("PGC no encontrado", 404);

  const id_student = await pgcArchivoRepository.buscarIdStudentPorUsuario(id_user);
  if (!id_student) throw crearError("El usuario no es estudiante", 403);

  const es_integrante = await pgcArchivoRepository.esIntegranteDePropuesta(pgc.id_proposal, id_student);
  if (!es_integrante) throw crearError("No perteneces a este PGC", 403);

  return { pgc, id_student };
}

async function verificarVentanaRegistro(id_cycle) {
  const dentro_ventana = await estaDentroDeLaEtapa(id_cycle, STAGES.REGISTRO_PGC);
  if (!dentro_ventana) throw crearError("Fuera de la ventana de registro de PGC", 400);
}

// mapeo de salida (regla de Alejandro): el FE nunca ve storage_path, id_pgc_file ni uploaded_by
async function mapearArchivoParaFrontend(fila) {
  return {
    id_file: fila.id_pgc_file,
    title_file: extraerTitulo(fila.storage_path),
    url_file: await generarUrlFirmada(fila.storage_path),
  };
}

async function subirArchivo(id_pgc, id_user, archivo) {
  const { pgc, id_student } = await verificarPertenencia(id_pgc, id_user);
  await verificarVentanaRegistro(pgc.id_cycle);

  const storage_path = armarStoragePath(pgc.id_cycle, id_student, id_pgc, archivo.originalname);
  await subirArchivoFirebase(storage_path, archivo);

  try {
    const id_pgc_file = await pgcArchivoRepository.crear({
      id_pgc,
      storage_path,
      file_format: FORMATOS_PERMITIDOS[archivo.mimetype],
      uploaded_by: id_student,
    });
    return mapearArchivoParaFrontend(await pgcArchivoRepository.buscarPorId(id_pgc_file));
  } catch (error) {
    await borrarArchivoFirebase(storage_path); // si la BD falla no queda un archivo huerfano en Firebase
    throw error;
  }
}

async function listarArchivos(id_pgc, id_user) {
  await verificarPertenencia(id_pgc, id_user);
  const filas = await pgcArchivoRepository.listarPorPgc(id_pgc);
  return Promise.all(filas.map(mapearArchivoParaFrontend));
}

async function reemplazarArchivo(id_pgc, id_pgc_file, id_user, archivo) {
  const { pgc, id_student } = await verificarPertenencia(id_pgc, id_user);
  await verificarVentanaRegistro(pgc.id_cycle);

  const archivo_existente = await pgcArchivoRepository.buscarPorId(id_pgc_file);
  if (!archivo_existente || archivo_existente.id_pgc !== Number(id_pgc)) {
    throw crearError("Archivo no encontrado", 404);
  }

  const storage_path_viejo = archivo_existente.storage_path;
  const storage_path = armarStoragePath(pgc.id_cycle, id_student, id_pgc, archivo.originalname);

  await subirArchivoFirebase(storage_path, archivo); // nunca se reutiliza el path, siempre uno nuevo

  try {
    await pgcArchivoRepository.actualizar(id_pgc_file, {
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

async function eliminarArchivo(id_pgc, id_pgc_file, id_user) {
  await verificarPertenencia(id_pgc, id_user);

  const archivo_existente = await pgcArchivoRepository.buscarPorId(id_pgc_file);
  if (!archivo_existente || archivo_existente.id_pgc !== Number(id_pgc)) {
    throw crearError("Archivo no encontrado", 404);
  }

  await pgcArchivoRepository.eliminar(id_pgc_file);
  await borrarArchivoFirebase(archivo_existente.storage_path);
}

export { subirArchivo, listarArchivos, reemplazarArchivo, eliminarArchivo };