import * as propuestaService from '../services/propuestaService.js';
import { validarRechazo } from '../validators/propuestasValidator.js';

// Controlador para crear una propuesta
const crearPropuesta = async (req, res) => {
    try {
        const id_user = req.usuario.id;

        // DIAGNÓSTICO: ver qué llega
        console.log('=================================');
        console.log('BODY RECIBIDO:', req.body);
        console.log('FILE RECIBIDO:', req.file);
        console.log('=================================');

        const result = await propuestaService.crearPropuesta(req.body, id_user, req.file);
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
        const result = await propuestaService.reenviarPropuesta(id_proposal, req.body, id_user, req.file);
        res.status(200).json(result);
    } catch (error) {
        console.error('ERROR REENVIAR PROPUESTA:', error);
        res.status(error.status || 500).json({
            mensaje: error.mensaje || 'Error interno del servidor'
        });
    }
};

// Controlador para obtener la URL de visualización del PDF de una propuesta
export const verPdfPropuesta = async (req, res) => {
    try {
        const { idProposal } = req.params;
        const resultado = await propuestaService.obtenerUrlPdf(idProposal);
        res.status(200).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({
            mensaje: error.mensaje || 'Error interno'
        });
    }
};

// ✅ Ver mi propuesta
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

// Listar propuestas pendientes por ciclo (Encargado)
async function listarPendientes(req, res) {
    const { cycle, estado } = req.query;

    if (!cycle) {
        return res.status(400).json({ mensaje: 'El parámetro cycle es obligatorio' });
    }

    try {
        const propuestas = await propuestaService.listarPendientesPorCiclo(cycle, estado, req.usuario);
        return res.status(200).json(propuestas);
    } catch (error) {
        return res.status(error.status || 500).json({ mensaje: error.message || 'Error interno' });
    }
}

// Aprobar propuesta
async function aprobar(req, res) {
    try {
        const propuesta = await propuestaService.aprobarPropuesta(req.params.id, req.usuario);
        return res.status(200).json(propuesta);
    } catch (error) {
        return res.status(error.status || 500).json({ mensaje: error.message || 'Error interno' });
    }
}

// Rechazar propuesta
async function rechazar(req, res) {
    const errores = validarRechazo(req.body);
    if (errores.length > 0) {
        return res.status(400).json({ mensaje: 'Datos inválidos', errores });
    }

    try {
        const propuesta = await propuestaService.rechazarPropuesta(req.params.id, req.body.comentario, req.usuario);
        return res.status(200).json(propuesta);
    } catch (error) {
        return res.status(error.status || 500).json({ mensaje: error.message || 'Error interno' });
    }
}

export { crearPropuesta, reenviarPropuesta, verMiPropuesta, listarPendientes, aprobar, rechazar };