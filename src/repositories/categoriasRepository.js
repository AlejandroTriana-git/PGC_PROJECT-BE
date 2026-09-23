import db from '../config/db.js';

/**
 * Devuelve todas las categorías de proyecto disponibles.
 * @returns {Promise<Array<{id_category: number, name_category: string}>>}
 */
export const listarCategorias = async () => {
    const [rows] = await db.query(
        'SELECT id_category, name_category FROM categories ORDER BY id_category ASC'
    );
    return rows;
};