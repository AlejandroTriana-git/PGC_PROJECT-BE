import * as propuestaService from '../services/propuestaService.js';

const crearPropuesta = async (req, res) => {
    try {
        const id_user = req.usuario.id;
        const result = await propuestaService.crearPropuesta(req.body, id_user);
        res.status(201).json(result);
    } catch (error) {
        console.error('ERROR CREAR PROPUESTA:', error);
        res.status(error.status || 500).json({
            mensaje: error.mensaje || 'Error interno del servidor'
        });
    }
};

const reenviarPropuesta = async (req, res) => {
    try {
        const id_proposal = req.params.id;
        const id_user = req.usuario.id;
        const result = await propuestaService.reenviarPropuesta(id_proposal, req.body, id_user);
        res.status(200).json(result);
    } catch (error) {
        console.error('ERROR REENVIAR PROPUESTA:', error);
        res.status(error.status || 500).json({
            mensaje: error.mensaje || 'Error interno del servidor'
        });
    }
};

// ✅ NUEVA FUNCIÓN: Ver mi propuesta
const verMiPropuesta = async (req, res) => {
    try {
        const id_user = req.usuario.id;
        const result = await propuestaService.verMiPropuesta(id_user);
        res.status(200).json(result);
    } catch (error) {
        console.error('ERROR VER MI PROPUESTA:', error);
        res.status(error.status || 500).json({
            mensaje: error.mensaje || 'Error interno del servidor'
        });
    }
};

export { crearPropuesta, reenviarPropuesta, verMiPropuesta };