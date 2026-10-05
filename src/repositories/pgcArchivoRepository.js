import db from "../config/db.js";

// consultas de solo lectura sobre pgc / students / proposal_students para resolver membresia

//esta funcion busca el pgc por su id y trae el ciclo y la propuesta a la que pertenece
async function buscarPgcPorId(id_pgc) {
  const [filas] = await db.query(
    "SELECT id_pgc, id_cycle, id_proposal FROM pgc WHERE id_pgc = ?",
    [id_pgc]
  );
  return filas[0];
}

//esta funcion busca el id_student que tiene un usuario, si el usuario no es estudiante devuelve undefined
async function buscarIdStudentPorUsuario(id_user) {
  const [filas] = await db.query("SELECT id_student FROM students WHERE id_user = ?", [id_user]);
  return filas[0]?.id_student;
}

//esta funcion revisa si el estudiante hace parte del equipo de esa propuesta (lider o integrante)
async function esIntegranteDePropuesta(id_proposal, id_student) {
  const [filas] = await db.query(
    "SELECT 1 FROM proposal_students WHERE id_proposal = ? AND id_student = ?",
    [id_proposal, id_student]
  );
  return filas.length > 0;
}

// lo propio de pgc_files
//aca realizamos la insercion del archivo, title_file y desc_file son obligatorios en la tabla
async function crear({ id_pgc, storage_path, file_format, uploaded_by, title_file, desc_file }) {
  const [resultado] = await db.query(
    "INSERT INTO pgc_files (id_pgc, storage_path, file_format, uploaded_by, title_file, desc_file) VALUES (?, ?, ?, ?, ?, ?)",
    [id_pgc, storage_path, file_format, uploaded_by, title_file, desc_file]
  );
  return resultado.insertId;
}

//esta funcion lista todos los archivos que tiene un pgc
async function listarPorPgc(id_pgc) {
  const [filas] = await db.query("SELECT * FROM pgc_files WHERE id_pgc = ?", [id_pgc]);
  return filas;
}

//esta funcion busca un archivo por su id
async function buscarPorId(id_pgc_file) {
  const [filas] = await db.query("SELECT * FROM pgc_files WHERE id_pgc_file = ?", [id_pgc_file]);
  return filas[0];
}

//esta funcion actualiza el archivo cuando llega uno nuevo (cambia la ruta, el formato, el titulo y la descripcion)
// el orden de los ? debe coincidir exacto con el orden del arreglo de valores
async function actualizar(id_pgc_file, { storage_path, file_format, title_file, desc_file }) {
  await db.query(
    "UPDATE pgc_files SET storage_path = ?, file_format = ?, title_file = ?, desc_file = ? WHERE id_pgc_file = ?",
    [storage_path, file_format, title_file, desc_file, id_pgc_file]
  );
}

//esta funcion cambia solo el titulo y la descripcion, el archivo guardado se queda igual
async function actualizarTextos(id_pgc_file, { title_file, desc_file }) {
  await db.query(
    "UPDATE pgc_files SET title_file = ?, desc_file = ? WHERE id_pgc_file = ?",
    [title_file, desc_file, id_pgc_file]
  );
}

//esta funcion borra el registro del archivo en la bd
async function eliminar(id_pgc_file) {
  await db.query("DELETE FROM pgc_files WHERE id_pgc_file = ?", [id_pgc_file]);
}

export {
  buscarPgcPorId,
  buscarIdStudentPorUsuario,
  esIntegranteDePropuesta,
  crear,
  listarPorPgc,
  buscarPorId,
  actualizar,
  actualizarTextos,
  eliminar,
};