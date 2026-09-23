import { obtenerCategorias } from '../services/categoriasService.js';

// Devuelve todas las categorías disponibles para radicar propuestas
export const getCategorias = async (req, res) => {
    try {
        const categorias = await obtenerCategorias();
        res.status(200).json(categorias);
    } catch (error) {
        console.error('ERROR GET CATEGORIAS:', error);
        res.status(error.status || 500).json({ mensaje: error.mensaje || 'Error al obtener las categorías' });
    }
};