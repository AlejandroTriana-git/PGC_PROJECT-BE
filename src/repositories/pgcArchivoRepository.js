import db from "../config/db.js";

// consultas de solo lectura sobre pgc / students / proposal_students para resolver membresia
async function buscarPgcPorId(id_pgc) {
  const [filas] = await db.query(
    "SELECT id_pgc, id_cycle, id_proposal FROM pgc WHERE id_pgc = ?",
    [id_pgc]
  );
  return filas[0];
}

async function buscarIdStudentPorUsuario(id_user) {
  const [filas] = await db.query("SELECT id_student FROM students WHERE id_user = ?", [id_user]);
  return filas[0]?.id_student;
}

async function esIntegranteDePropuesta(id_proposal, id_student) {
  const [filas] = await db.query(
    "SELECT 1 FROM proposal_students WHERE id_proposal = ? AND id_student = ?",
    [id_proposal, id_student]
  );
  return filas.length > 0;
}

// lo propio de pgc_files
async function crear({ id_pgc, storage_path, file_format, uploaded_by }) {
  const [resultado] = await db.query(
    "INSERT INTO pgc_files (id_pgc, storage_path, file_format, uploaded_by) VALUES (?, ?, ?, ?)",
    [id_pgc, storage_path, file_format, uploaded_by]
  );
  return resultado.insertId;
}

async function listarPorPgc(id_pgc) {
  const [filas] = await db.query("SELECT * FROM pgc_files WHERE id_pgc = ?", [id_pgc]);
  return filas;
}

async function buscarPorId(id_pgc_file) {
  const [filas] = await db.query("SELECT * FROM pgc_files WHERE id_pgc_file = ?", [id_pgc_file]);
  return filas[0];
}

// el orden de los ? debe coincidir exacto con el orden del arreglo de valores
async function actualizar(id_pgc_file, { storage_path, file_format }) {
  await db.query(
    "UPDATE pgc_files SET storage_path = ?, file_format = ? WHERE id_pgc_file = ?",
    [storage_path, file_format, id_pgc_file]
  );
}

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
  eliminar,
};