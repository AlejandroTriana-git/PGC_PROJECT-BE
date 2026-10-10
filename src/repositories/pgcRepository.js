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
                pr.objectives_proposal, pr.solution_proposal
         FROM pgc p
         INNER JOIN proposals pr ON p.id_proposal = pr.id_proposal
         INNER JOIN proposal_students ps ON pr.id_proposal = ps.id_proposal
         INNER JOIN students s ON ps.id_student = s.id_student
         WHERE s.id_user = ?
         ORDER BY p.registered_at DESC`,
        [id_usuario]
    );

    for (const pgc of rows) {
        // Categorías (de la propuesta vinculada)
        const [categorias] = await db.query(
            `SELECT c.id_category, c.name_category
             FROM proposal_categories pc
             INNER JOIN categories c ON pc.id_category = c.id_category
             WHERE pc.id_proposal = ?`,
            [pgc.id_proposal]
        );
        pgc.categorias = categorias;

        // Integrantes (de la propuesta vinculada)
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