import db from '../config/db.js';

// Función para listar todos los usuarios con rol Profesor, para poblar selects de encargado/jurado
// Si se envía idCycle, excluye a los profesores que ya son encargado y/o jurado de ese ciclo especifico
export const listarProfesores = async ({ idCycle, excluirEncargado, excluirJurado } = {}) => {
    let query = `
        SELECT u.id_user AS id, u.full_name AS nombre
        FROM users u
        INNER JOIN rol r ON r.id_rol = u.id_rol
        WHERE r.name_role = 'Profesor'
    `;
    const params = [];

    // excluye al que ya es encargado de este ciclo
    if (idCycle && excluirEncargado) {
        query += ` AND u.id_user NOT IN (
            SELECT id_person_charge FROM cycles WHERE id_cycle = ? AND id_person_charge IS NOT NULL
        )`;
        params.push(idCycle);
    }

    // excluye a los que ya son jurado de este ciclo
    if (idCycle && excluirJurado) {
        query += ` AND u.id_user NOT IN (
            SELECT id_juror FROM cycle_juror WHERE id_cycle = ?
        )`;
        params.push(idCycle);
    }

    query += ' ORDER BY u.full_name ASC';

    const [rows] = await db.query(query, params);
    return rows;
};