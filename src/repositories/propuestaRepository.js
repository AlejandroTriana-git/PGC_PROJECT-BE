import db from '../config/db.js';

// Crear propuesta (con transacción)
export const crearPropuesta = async (connection, data) => {
    const [result] = await connection.query(
        `INSERT INTO proposals 
        (id_leader, id_cycle, title_proposal, descr_proposal, problem_proposal, justification_proposal, objectives_proposal, solution_proposal, pdf_storage_path, state_proposal, resubmit_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente de validación', 0)`,
        [
            data.id_leader,
            data.id_cycle,
            data.title_proposal,
            data.descr_proposal,
            data.problem_proposal,
            data.justification_proposal,
            data.objectives_proposal,
            data.solution_proposal,
            data.pdf_storage_path
        ]
    );
    return result.insertId;
};

// Insertar en proposal_students (con transacción)
export const insertarIntegrante = async (connection, id_proposal, id_student) => {
    await connection.query(
        'INSERT INTO proposal_students (id_proposal, id_student) VALUES (?, ?)',
        [id_proposal, id_student]
    );
};

// Buscar propuesta activa por estudiante y ciclo
export const buscarPropuestaActiva = async (id_student, id_cycle) => {
    const [rows] = await db.query(
        `SELECT p.* FROM proposals p
         INNER JOIN proposal_students ps ON p.id_proposal = ps.id_proposal
         WHERE ps.id_student = ? AND p.id_cycle = ?
         AND p.state_proposal IN ('Pendiente de validación', 'Aprobada', 'Rechazada')`,
        [id_student, id_cycle]
    );
    return rows[0];
};

// Buscar estudiante por id_user
export const buscarEstudiantePorId = async (id_user) => {
    const [rows] = await db.query(
        'SELECT * FROM students WHERE id_user = ?',
        [id_user]
    );
    return rows[0];
};

// Buscar ciclo por id
export const buscarCicloPorId = async (id_cycle) => {
    const [rows] = await db.query(
        'SELECT * FROM cycles WHERE id_cycle = ?',
        [id_cycle]
    );
    return rows[0];
};

// Buscar propuesta por ID
export const buscarPropuestaPorId = async (id_proposal) => {
    const [rows] = await db.query(
        'SELECT * FROM proposals WHERE id_proposal = ?',
        [id_proposal]
    );
    return rows[0];
};

// Reenviar propuesta (con transacción)
export const reenviarPropuesta = async (connection, id_proposal, data) => {
    await connection.query(
        `UPDATE proposals 
         SET title_proposal = ?, descr_proposal = ?, problem_proposal = ?, justification_proposal = ?, objectives_proposal = ?, solution_proposal = ?, pdf_storage_path = ?, state_proposal = 'Pendiente de validación'
         WHERE id_proposal = ?`,
        [
            data.title_proposal,
            data.descr_proposal,
            data.problem_proposal,
            data.justification_proposal,
            data.objectives_proposal,
            data.solution_proposal,
            data.pdf_storage_path,
            id_proposal
        ]
    );
};

// Verificar si un usuario es miembro de una propuesta
export async function esMiembroDePropuesta(id_proposal, id_user) {
  const [rows] = await db.query(
    `SELECT 1
     FROM proposal_students ps
     JOIN students s ON s.id_student = ps.id_student
     WHERE ps.id_proposal = ? AND s.id_user = ?
     LIMIT 1`,
    [id_proposal, id_user]
  );
  return rows.length > 0;
}
//Buscar la propuesta del estudiante
export const buscarPropuestaPorEstudiante = async (id_student) => {
    const [rows] = await db.query(
        `SELECT p.*, u.full_name AS leader_name
         FROM proposals p
         INNER JOIN proposal_students ps ON p.id_proposal = ps.id_proposal
         INNER JOIN students s ON p.id_leader = s.id_student
         INNER JOIN users u ON s.id_user = u.id_user
         WHERE ps.id_student = ?
         AND p.state_proposal IN ('Pendiente de validación', 'Aprobada', 'Rechazada', 'Anulada')
         ORDER BY p.created_at DESC
         LIMIT 1`,
        [id_student]
    );
    return rows[0];
};



//esta funcion reliza la consulta por las llaves primarias (id)
async function buscarPorId(id_proposal) {
  const [filas] = await db.query(
    "SELECT * FROM proposals WHERE id_proposal = ?",
    [id_proposal]
  );
  return filas[0];
}

//esta funcion enlista las propuestas segun el estado y el ciclo
//con JOINs para devolver título, líder, integrantes, categorías y ciclo que necesita el FE
async function listarPorCicloYEstado(id_cycle, state_proposal) {
  const [filas] = await db.query(
    `SELECT
       p.id_proposal,
       p.id_cycle,
       p.id_leader,
       p.title_proposal,
       p.descr_proposal,
       p.problem_proposal,
       p.justification_proposal,
       p.objectives_proposal,
       p.solution_proposal,
       p.pdf_storage_path,
       p.state_proposal,
       p.resubmit_count,
       p.rejection_comment,
       p.created_at,
       u.full_name  AS leader_name,
       c.name_cycle AS ciclo,
       (
         SELECT COUNT(*)
         FROM proposal_students ps2
         WHERE ps2.id_proposal = p.id_proposal
       ) AS num_integrantes,
       (
         SELECT GROUP_CONCAT(cat.name_category SEPARATOR ', ')
         FROM proposal_categories pc
         INNER JOIN categories cat ON cat.id_category = pc.id_category
         WHERE pc.id_proposal = p.id_proposal
       ) AS categorias,
       (
         SELECT GROUP_CONCAT(u2.full_name SEPARATOR ', ')
         FROM proposal_students ps3
         INNER JOIN students s3 ON s3.id_student = ps3.id_student
         INNER JOIN users u2 ON u2.id_user = s3.id_user
         WHERE ps3.id_proposal = p.id_proposal AND s3.id_student != p.id_leader
       ) AS nombres_integrantes
     FROM proposals p
     INNER JOIN students s  ON s.id_student = p.id_leader
     INNER JOIN users   u  ON u.id_user    = s.id_user
     INNER JOIN cycles  c  ON c.id_cycle   = p.id_cycle
     WHERE p.id_cycle = ? AND p.state_proposal = ?`,
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

// Buscar integrantes de una propuesta y devolver sus id_user (para el FE)
export async function buscarIntegrantesDePropuesta(id_proposal) {
  const [rows] = await db.query(
    `SELECT s.id_student, u.id_user, u.full_name
     FROM proposal_students ps
     INNER JOIN students s ON s.id_student = ps.id_student
     INNER JOIN users   u ON u.id_user    = s.id_user
     WHERE ps.id_proposal = ?`,
    [id_proposal]
  );
  return rows;
}

// Eliminar todos los integrantes de una propuesta (para reenvío)
export const eliminarIntegrantesPropuesta = async (connection, id_proposal) => {
    await connection.query(
        'DELETE FROM proposal_students WHERE id_proposal = ?',
        [id_proposal]
    );
};

// Insertar una categoría asociada a una propuesta (transacción)
export const insertarCategoriaPropuesta = async (connection, id_proposal, id_category) => {
    await connection.query(
        'INSERT INTO proposal_categories (id_proposal, id_category) VALUES (?, ?)',
        [id_proposal, id_category]
    );
};

// Eliminar todas las categorías de una propuesta (para reenvío)
export const eliminarCategoriasPropuesta = async (connection, id_proposal) => {
    await connection.query(
        'DELETE FROM proposal_categories WHERE id_proposal = ?',
        [id_proposal]
    );
};

// Obtener las categorías asociadas a una propuesta
export async function buscarCategoriasDePropuesta(id_proposal) {
    const [rows] = await db.query(
        `SELECT c.id_category, c.name_category
         FROM proposal_categories pc
         INNER JOIN categories c ON c.id_category = pc.id_category
         WHERE pc.id_proposal = ?
         ORDER BY c.id_category ASC`,
        [id_proposal]
    );
    return rows;
}

export { buscarPorId, listarPorCicloYEstado, aprobar, rechazar };