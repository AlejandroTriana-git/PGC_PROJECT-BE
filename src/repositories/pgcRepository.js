import db from '../config/db.js';

// Listar propuestas aprobadas sin PGC (del líder logueado)
export const listarPropuestasAprobadasSinPgc = async (id_usuario) => {
    // 1. Obtener las propuestas aprobadas del líder sin PGC
    const [propuestas] = await db.query(
        `SELECT p.id_proposal, p.title_proposal, p.id_cycle
         FROM proposals p
         INNER JOIN students s ON p.id_leader = s.id_student
         WHERE s.id_user = ?
         AND p.state_proposal = 'Aprobada'
         AND NOT EXISTS (SELECT 1 FROM pgc WHERE pgc.id_proposal = p.id_proposal)`,
        [id_usuario]
    );

    // 2. Para cada propuesta, traer categorías e integrantes
    for (const propuesta of propuestas) {
        // 2.1. Categorías
        const [categorias] = await db.query(
            `SELECT c.id_category, c.name_category
             FROM proposal_categories pc
             INNER JOIN categories c ON pc.id_category = c.id_category
             WHERE pc.id_proposal = ?`,
            [propuesta.id_proposal]
        );
        propuesta.categorias = categorias;

        // 2.2. Integrantes
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