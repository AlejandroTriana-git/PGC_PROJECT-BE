import * as pgcService from '../services/pgcService.js';

const listarPropuestasAprobadasSinPgc = async (req, res) => {
    try {
        const id_usuario = req.usuario.id;
        const propuestas = await pgcService.listarPropuestasAprobadasSinPgc(id_usuario);
        res.status(200).json(propuestas);
    } catch (error) {
        console.error('ERROR LISTAR PROPUESTAS APROBADAS SIN PGC:', error);
        res.status(error.status || 500).json({
            mensaje: error.mensaje || 'Error interno del servidor'
        });
    }
};

export { listarPropuestasAprobadasSinPgc };