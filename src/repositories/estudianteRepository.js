import db from '../config/db.js';

// Listar estudiantes por ciclo (excluyendo al líder)
export const listarEstudiantesPorCiclo = async (id_cycle, id_lider) => {
    const [rows] = await db.query(
        `SELECT s.id_student, u.id_user, u.full_name, u.mail_user
         FROM students s
         INNER JOIN users u ON s.id_user = u.id_user
         WHERE s.id_cycle = ? AND s.id_student != ?
         ORDER BY u.full_name ASC`,
        [id_cycle, id_lider]
    );
    return rows;
};