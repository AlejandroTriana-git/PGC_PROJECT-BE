import db from '../config/db.js';

// ============================================
// ISSUE 1: Listar propuestas aprobadas sin PGC
// ============================================

export const listarPropuestasAprobadasSinPgc = async (id_usuario) => {
    const [propuestas] = await db.query(
        `SELECT p.id_proposal, p.title_proposal, p.problem_proposal, p.justification_proposal, p.objectives_proposal, p.solution_proposal, p.id_cycle, c.name_cycle
         FROM proposals p
         INNER JOIN students s ON p.id_leader = s.id_student
         INNER JOIN cycles c ON p.id_cycle = c.id_cycle
         WHERE s.id_user = ?
         AND p.state_proposal = 'Aprobada'
         AND NOT EXISTS (SELECT 1 FROM pgc WHERE pgc.id_proposal = p.id_proposal)`,
        [id_usuario]
    );

    for (const propuesta of propuestas) {
        // Categorías
        const [categorias] = await db.query(
            `SELECT c.id_category, c.name_category
             FROM proposal_categories pc
             INNER JOIN categories c ON pc.id_category = c.id_category
             WHERE pc.id_proposal = ?`,
            [propuesta.id_proposal]
        );
        propuesta.categorias = categorias;

        // Integrantes
        const [integrantes] = await db.query(
            `SELECT u.id_user, u.full_name
             FROM proposal_students ps
             INNER JOIN students s ON ps.id_student = s.id_student
             INNER JOIN users u ON s.id_user = u.id_user
             WHERE ps.id_proposal = ?`,
            [propuesta.id_proposal]
        );
        propuesta.integrantes = integrantes;
    }

    return propuestas;
};

// ============================================
// ISSUE 2: Registrar PGC
// ============================================

// Verificar si ya existe un PGC para una propuesta
export const existePgcParaPropuesta = async (id_proposal) => {
    const [rows] = await db.query(
        'SELECT id_pgc FROM pgc WHERE id_proposal = ?',
        [id_proposal]
    );
    return rows.length > 0;
};


// Crear PGC usando SP
export const crearPgc = async (id_proposal, id_usuario, dentro_de_fecha) => {
    // 1. Pedir una conexión exclusiva al pool
    const connection = await db.getConnection();
    
    try {
        // 2. Ejecutar el SP usando esa conexión específica
        await connection.query(
            'CALL sp_crear_pgc(?, ?, ?, @id_pgc, @codigo, @mensaje)',
            [id_proposal, id_usuario, dentro_de_fecha ? 1 : 0]
        );

        // 3. Consultar las variables en la MISMA conexión
        const [rows] = await connection.query(
            'SELECT @id_pgc AS id_pgc, @codigo AS codigo, @mensaje AS mensaje'
        );

        return rows[0]; // Retorna { id_pgc, codigo, mensaje }
    } catch (error) {
        console.error('Error en crearPgc:', error);
        throw error; // Re-lanzar para que lo maneje tu controlador/API
    } finally {
        // 4. IMPORTANTE: Devolver la conexión al pool
        connection.release();
    }
};

// ============================================
// ISSUE 3: Listar mis PGC
// ============================================

export const listarPgcPorUsuario = async (id_usuario) => {
    const [rows] = await db.query(
        `SELECT p.id_pgc, p.id_proposal, p.id_cycle, p.state_pgc, p.registered_at,
                pr.title_proposal, pr.problem_proposal, pr.justification_proposal,
                pr.objectives_proposal, pr.solution_proposal,
                c.name_cycle
         FROM pgc p
         INNER JOIN proposals pr ON p.id_proposal = pr.id_proposal
         INNER JOIN cycles c ON p.id_cycle = c.id_cycle
         INNER JOIN proposal_students ps ON pr.id_proposal = ps.id_proposal
         INNER JOIN students s ON ps.id_student = s.id_student
         WHERE s.id_user = ?
         ORDER BY p.registered_at DESC`,
        [id_usuario]
    );

    for (const pgc of rows) {
        // Categorías
        const [categorias] = await db.query(
            `SELECT c.id_category, c.name_category
             FROM proposal_categories pc
             INNER JOIN categories c ON pc.id_category = c.id_category
             WHERE pc.id_proposal = ?`,
            [pgc.id_proposal]
        );
        pgc.categorias = categorias;

        // Integrantes
        const [integrantes] = await db.query(
            `SELECT u.id_user, u.full_name
             FROM proposal_students ps
             INNER JOIN students s ON ps.id_student = s.id_student
             INNER JOIN users u ON s.id_user = u.id_user
             WHERE ps.id_proposal = ?`,
            [pgc.id_proposal]
        );
        pgc.integrantes = integrantes;
    }

    return rows;
};

// ============================================
// Ficha histórica del PGC (HU-05)
// ============================================

// Buscar PGC por ID (con datos de la propuesta)
export const buscarPgcPorId = async (id_pgc) => {
    const conn = await db.getConnection();
    try {
        // CALL + lectura de OUT params usando la MISMA conexión
        const [resultSets] = await conn.query(
            'CALL sp_obtener_pgc_por_id(?, @codigo, @mensaje)',
            [id_pgc]
        );

        const [[{ codigo, mensaje }]] = await conn.query(
            'SELECT @codigo AS codigo, @mensaje AS mensaje'
        );

        // Si no existe, cortamos temprano
        if (codigo !== 1) {
            return { codigo, mensaje, pgc: null, categorias: [], integrantes: [] };
        }

        return {
            codigo,
            mensaje,
            pgc:          resultSets[0]?.[0] || null,
            categorias:   resultSets[1]      || [],
            integrantes:  resultSets[2]      || []
        };
    } finally {
        conn.release();
    }
};

// ============================================
// HU-04: Buscador de PGC
// ============================================

//esta funcion escapa \ % y _ para que lo que escribe el usuario se busque tal cual dentro del LIKE
//(sin esto, si el usuario escribe "%" o "_" el LIKE los toma como comodines y traeria todos los proyectos)
const escaparLike = (texto) => texto.replace(/[\\%_]/g, '\\$&');

export const buscarPgc = async (filtros, limite, desplazamiento) => {
    // Armamos el patrón en JS, el SP solo lo usa
    const q_pattern = filtros.q ? `%${escaparLike(filtros.q)}%` : null;

    const conn = await db.getConnection();
    try {
        const [resultSets] = await conn.query(
            'CALL sp_buscar_pgc(?, ?, ?, ?, ?, ?, @total, @codigo, @mensaje)',
            [
                q_pattern,
                filtros.id_cycle    || null,
                filtros.state_pgc   || null,
                filtros.id_category || null,
                limite,
                desplazamiento
            ]
        );

        const [[{ total, codigo, mensaje }]] = await conn.query(
            'SELECT @total AS total, @codigo AS codigo, @mensaje AS mensaje'
        );

        return {
            codigo,
            mensaje,
            total,
            filas:      resultSets[0] || [],
            categorias: resultSets[1] || []
        };
    } finally {
        conn.release();
    }
};

// ============================================
// HU-07: Calificación (BE#2)
// ============================================

/// Listar PGCs pendientes de calificar por el jurado logueado
export const listarPgcPendientesDeCalificar = async (id_juror) => {
    const [rows] = await db.query(
        `SELECT p.id_pgc, p.id_proposal, p.id_cycle, p.state_pgc, p.registered_at,
                pr.title_proposal, pr.problem_proposal, pr.justification_proposal,
                pr.objectives_proposal, pr.solution_proposal,
                c.name_cycle,
                u.full_name AS leader_name,
                0 AS ya_calificado
         FROM pgc p
         INNER JOIN proposals pr ON p.id_proposal = pr.id_proposal
         INNER JOIN cycles c ON p.id_cycle = c.id_cycle
         INNER JOIN cycle_juror cj ON cj.id_cycle = p.id_cycle
         INNER JOIN students s ON pr.id_leader = s.id_student
         INNER JOIN users u ON s.id_user = u.id_user
         WHERE cj.id_juror = ?
         AND NOT EXISTS (
             SELECT 1 FROM jury_grades jg
             WHERE jg.id_pgc = p.id_pgc AND jg.id_juror = ?
         )
         ORDER BY p.registered_at ASC`,
        [id_juror, id_juror]
    );
    return rows;
};

// ============================================
// HU-07: Registrar calificación
// ============================================

// Verificar si el usuario es jurado del ciclo
export const esJuradoDelCiclo = async (id_juror, id_cycle) => {
    const [rows] = await db.query(
        'SELECT 1 FROM cycle_juror WHERE id_juror = ? AND id_cycle = ?',
        [id_juror, id_cycle]
    );
    return rows.length > 0;
};

// Verificar si ya calificó ese PGC
export const yaCalificoPgc = async (id_pgc, id_juror) => {
    const [rows] = await db.query(
        'SELECT 1 FROM jury_grades WHERE id_pgc = ? AND id_juror = ?',
        [id_pgc, id_juror]
    );
    return rows.length > 0;
};

// Insertar calificación
export const crearCalificacion = async (id_pgc, id_juror, grade, comment) => {
    const [result] = await db.query(
        `INSERT INTO jury_grades (id_pgc, id_juror, grade, comment)
         VALUES (?, ?, ?, ?)`,
        [id_pgc, id_juror, grade, comment]
    );
    return result.insertId;
};

// ============================================
// HU-07: Auto-transición
// ============================================

// Contar cuántos jurados tiene el ciclo
export const contarJuradosDelCiclo = async (id_cycle) => {
    const [rows] = await db.query(
        'SELECT COUNT(*) AS total FROM cycle_juror WHERE id_cycle = ?',
        [id_cycle]
    );
    return rows[0].total;
};

// Contar cuántos jurados calificaron este PGC
export const contarCalificacionesDelPgc = async (id_pgc) => {
    const [rows] = await db.query(
        'SELECT COUNT(*) AS total FROM jury_grades WHERE id_pgc = ?',
        [id_pgc]
    );
    return rows[0].total;
};

// Calcular promedio de notas de un PGC
export const calcularPromedioPgc = async (id_pgc) => {
    const [rows] = await db.query(
        'SELECT AVG(grade) AS promedio FROM jury_grades WHERE id_pgc = ?',
        [id_pgc]
    );
    return rows[0].promedio;
};

// Marcar PGC como Terminado
export const marcarPgcComoTerminado = async (id_pgc) => {
    await db.query(
        "UPDATE pgc SET state_pgc = 'Terminado' WHERE id_pgc = ?",
        [id_pgc]
    );
};

// ============================================
// HU-07: Vista consolidada
// ============================================

// Verificar si el usuario es del equipo (líder o integrante)
export const esDelEquipo = async (id_proposal, id_usuario) => {
    const [rows] = await db.query(
        `SELECT 1 FROM proposal_students ps
         INNER JOIN students s ON ps.id_student = s.id_student
         WHERE ps.id_proposal = ? AND s.id_user = ?`,
        [id_proposal, id_usuario]
    );
    return rows.length > 0;
};

//aca se listan solo los comentarios de cada jurado (sin la nota individual, el estudiante solo ve la global)
export const listarComentariosDelPgc = async (id_pgc) => {
    const [rows] = await db.query(
        `SELECT u.full_name AS juror_name, jg.comment, jg.graded_at
         FROM jury_grades jg
         INNER JOIN users u ON jg.id_juror = u.id_user
         WHERE jg.id_pgc = ?
         ORDER BY jg.graded_at ASC`,
        [id_pgc]
    );
    return rows;
};

// Buscar la calificación de un jurado específico
export const buscarCalificacionDeJurado = async (id_pgc, id_juror) => {
    const [rows] = await db.query(
        `SELECT grade, comment, graded_at
         FROM jury_grades
         WHERE id_pgc = ? AND id_juror = ?`,
        [id_pgc, id_juror]
    );
    return rows[0];
};

// ============================================
// HU-07: Listar PGCs calificados por el jurado logueado
// ============================================

export const listarPgcCalificadosPorJurado = async (id_juror) => {
    const [rows] = await db.query(
        `SELECT p.id_pgc, p.id_cycle, p.state_pgc,
                pr.title_proposal,
                c.name_cycle,
                u.full_name AS leader_name,
                jg.grade, jg.comment, jg.graded_at
         FROM jury_grades jg
         INNER JOIN pgc p ON jg.id_pgc = p.id_pgc
         INNER JOIN proposals pr ON p.id_proposal = pr.id_proposal
         INNER JOIN cycles c ON p.id_cycle = c.id_cycle
         INNER JOIN students s ON pr.id_leader = s.id_student
         INNER JOIN users u ON s.id_user = u.id_user
         WHERE jg.id_juror = ?
         ORDER BY jg.graded_at DESC`,
        [id_juror]
    );
    return rows;
};