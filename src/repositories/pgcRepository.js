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


// Crear PGC (con transacción)
export const crearPgc = async (connection, data) => {
    const [result] = await connection.query(
        `INSERT INTO pgc (id_cycle, id_proposal, state_pgc)
         VALUES (?, ?, 'En Proceso')`,
        [data.id_cycle, data.id_proposal]
    );
    return result.insertId;
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
    const [rows] = await db.query(
        `SELECT p.id_pgc, p.id_cycle, p.id_proposal, p.id_pgc_previous, p.state_pgc,
                p.registered_at,
                pr.title_proposal, pr.problem_proposal, pr.justification_proposal,
                pr.objectives_proposal, pr.solution_proposal,
                c.name_cycle
         FROM pgc p
         INNER JOIN proposals pr ON p.id_proposal = pr.id_proposal
         INNER JOIN cycles c ON p.id_cycle = c.id_cycle
         WHERE p.id_pgc = ?`,
        [id_pgc]
    );
    return rows[0];
};

// Buscar categorías de una propuesta
export const buscarCategoriasPropuesta = async (id_proposal) => {
    const [rows] = await db.query(
        `SELECT c.id_category, c.name_category
         FROM proposal_categories pc
         INNER JOIN categories c ON pc.id_category = c.id_category
         WHERE pc.id_proposal = ?`,
        [id_proposal]
    );
    return rows;
};

// Buscar integrantes de una propuesta
export const buscarIntegrantesPropuesta = async (id_proposal) => {
    const [rows] = await db.query(
        `SELECT u.id_user, u.full_name
         FROM proposal_students ps
         INNER JOIN students s ON ps.id_student = s.id_student
         INNER JOIN users u ON s.id_user = u.id_user
         WHERE ps.id_proposal = ?`,
        [id_proposal]
    );
    return rows;
};