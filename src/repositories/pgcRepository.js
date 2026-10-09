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
// ============================================
// HU-04: Buscador de PGC
// ============================================

//esta funcion escapa \ % y _ para que lo que escribe el usuario se busque tal cual dentro del LIKE
//(sin esto, si el usuario escribe "%" o "_" el LIKE los toma como comodines y traeria todos los proyectos)
const escaparLike = (texto) => texto.replace(/[\\%_]/g, '\\$&');

//esta funcion arma el WHERE de la busqueda, solo con los filtros que si llegaron
//siempre exige que la propuesta este Aprobada, y el ciclo y el estado se filtran sobre pgc (id_cycle, state_pgc)
//devuelve el texto del WHERE (donde) y los valores que van en cada ?, en el mismo orden
const armarCondicionesBusquedaPgc = (filtros) => {
    //esta condicion siempre va, lo demas se va agregando segun los filtros que lleguen
    const condiciones = ["p.state_proposal = 'Aprobada'"];
    const valores = [];

    //aca la palabra clave se busca en el titulo o en la descripcion (OR entre los dos campos)
    if (filtros.q) {
        const patron = `%${escaparLike(filtros.q)}%`;
        condiciones.push('(p.title_proposal LIKE ? OR p.descr_proposal LIKE ?)');
        valores.push(patron, patron);
    }
    //aca el ciclo del PGC
    if (filtros.id_cycle) {
        condiciones.push('pgc.id_cycle = ?');
        valores.push(filtros.id_cycle);
    }
    //aca el estado del PGC (En Proceso o Terminado)
    if (filtros.state_pgc) {
        condiciones.push('pgc.state_pgc = ?');
        valores.push(filtros.state_pgc);
    }
    //aca la categoria, se usa EXISTS y no un JOIN para que un PGC con varias categorias no salga repetido ni cuente doble
    if (filtros.id_category) {
        condiciones.push(
            'EXISTS (SELECT 1 FROM proposal_categories pc WHERE pc.id_proposal = p.id_proposal AND pc.id_category = ?)'
        );
        valores.push(filtros.id_category);
    }

    //aca se unen todas las condiciones con AND, o sea que cada filtro que llega achica mas el resultado
    return { donde: condiciones.join(' AND '), valores };
};

//esta funcion cuenta cuantos PGC cumplen los filtros, sirve para total_paginas y total_resultados
export const contarPgcBuscados = async (filtros) => {
    const { donde, valores } = armarCondicionesBusquedaPgc(filtros);
    const [filas] = await db.query(
        `SELECT COUNT(*) AS total
         FROM pgc
         INNER JOIN proposals p ON p.id_proposal = pgc.id_proposal
         INNER JOIN cycles c ON c.id_cycle = pgc.id_cycle
         WHERE ${donde}`,
        valores
    );
    return filas[0].total;
};

//esta funcion trae una pagina de resultados, del mas reciente al mas antiguo
//id_pgc desempata para que la paginacion no se mueva si dos PGC tienen la misma fecha
//limite es cuantos trae (15) y desplazamiento cuantos se salta (pagina - 1 por 15)
export const buscarPgcPaginados = async (filtros, limite, desplazamiento) => {
    const { donde, valores } = armarCondicionesBusquedaPgc(filtros);
    const [filas] = await db.query(
        `SELECT pgc.id_pgc, pgc.id_proposal, pgc.state_pgc, p.title_proposal, c.name_cycle
         FROM pgc
         INNER JOIN proposals p ON p.id_proposal = pgc.id_proposal
         INNER JOIN cycles c ON c.id_cycle = pgc.id_cycle
         WHERE ${donde}
         ORDER BY pgc.registered_at DESC, pgc.id_pgc DESC
         LIMIT ? OFFSET ?`,
        [...valores, limite, desplazamiento]
    );
    return filas;
};

//esta funcion trae las categorias de varias propuestas en UNA sola consulta, en vez de una consulta por cada resultado
export const buscarCategoriasDeVariasPropuestas = async (ids_proposal) => {
    //si la pagina no trajo resultados no hay nada que consultar
    if (ids_proposal.length === 0) return [];
    const [filas] = await db.query(
        `SELECT pc.id_proposal, cat.id_category, cat.name_category
         FROM proposal_categories pc
         INNER JOIN categories cat ON cat.id_category = pc.id_category
         WHERE pc.id_proposal IN (?)
         ORDER BY cat.id_category ASC`,
        [ids_proposal]
    );
    return filas;
};

// ============================================
// HU-07: Calificación (BE#2)
// ============================================

// Listar PGCs pendientes de calificar por el jurado logueado
export const listarPgcPendientesDeCalificar = async (id_juror) => {
    const [rows] = await db.query(
        `SELECT p.id_pgc, p.id_proposal, p.id_cycle, p.state_pgc, p.registered_at,
                pr.title_proposal, pr.problem_proposal, pr.justification_proposal,
                pr.objectives_proposal, pr.solution_proposal,
                c.name_cycle
         FROM pgc p
         INNER JOIN proposals pr ON p.id_proposal = pr.id_proposal
         INNER JOIN cycles c ON p.id_cycle = c.id_cycle
         INNER JOIN cycle_juror cj ON cj.id_cycle = p.id_cycle
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