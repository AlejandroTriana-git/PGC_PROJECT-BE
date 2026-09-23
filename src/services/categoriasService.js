import * as categoriasRepository from '../repositories/categoriasRepository.js';

/**
 * Obtiene todas las categorías de proyecto disponibles.
 * @returns {Promise<Array<{id_category: number, name_category: string}>>}
 */
export const obtenerCategorias = async () => {
    const categorias = await categoriasRepository.listarCategorias();
    if (!categorias || categorias.length === 0) {
        throw { status: 404, mensaje: 'No hay categorías registradas' };
    }
    return categorias;
};