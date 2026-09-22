import db from "../config/db.js";

// se recrea la tabla `proposals` de la bd


//esta funcion reliza la consulta por las llaves primarias (id)
async function buscarPorId(id_proposal) {
  const [filas] = await db.query(
    "SELECT * FROM proposals WHERE id_proposal = ?",
    [id_proposal]
  );
  return filas[0];
}

//esta funcion enlista las propuestas segun el estado y el ciclo
async function listarPorCicloYEstado(id_cycle, state_proposal) {
  const [filas] = await db.query(
    "SELECT * FROM proposals WHERE id_cycle = ? AND state_proposal = ?",
    [id_cycle, state_proposal]
  );
  return filas;
}

//estas dos funcion determinan si el estado de la propuesta va a ser rechazado o aprobado
async function aprobar(id_proposal, reviewed_by) {
  await db.query(
    `UPDATE proposals
     SET state_proposal = 'Aprobada', reviewed_by = ?, reviewed_at = NOW()
     WHERE id_proposal = ?`,
    [reviewed_by, id_proposal]
  );
}

async function rechazar(id_proposal, { rejection_comment, nuevoEstado, nuevoResubmitCount, reviewed_by }) {
  await db.query(
    `UPDATE proposals
     SET state_proposal = ?, rejection_comment = ?, resubmit_count = ?,
         reviewed_by = ?, reviewed_at = NOW()
     WHERE id_proposal = ?`,
    [nuevoEstado, rejection_comment, nuevoResubmitCount, reviewed_by, id_proposal]
  );
}

export { buscarPorId, listarPorCicloYEstado, aprobar, rechazar };