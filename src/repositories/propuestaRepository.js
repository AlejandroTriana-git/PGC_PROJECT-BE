import db from '../config/db.js';

// Crear propuesta (con transacción)
export const crearPropuesta = async (connection, data) => {
    const [result] = await connection.query(
        `INSERT INTO proposals 
        (id_leader, id_cycle, title_proposal, descr_proposal, problem_proposal, justification_proposal, objectives_proposal, solution_proposal, pdf_format_url, state_proposal, resubmit_count)
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
            data.pdf_format_url
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
         SET title_proposal = ?, descr_proposal = ?, problem_proposal = ?, justification_proposal = ?, objectives_proposal = ?, solution_proposal = ?, pdf_format_url = ?, state_proposal = 'Pendiente de validación'
         WHERE id_proposal = ?`,
        [
            data.title_proposal,
            data.descr_proposal,
            data.problem_proposal,
            data.justification_proposal,
            data.objectives_proposal,
            data.solution_proposal,
            data.pdf_format_url,
            id_proposal
        ]
    );
};