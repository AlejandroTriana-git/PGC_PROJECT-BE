import * as lineamientoService from '../services/lineamientoService.js';

//aca los errores controlados (los que traen status) se muestran tal cual, los demas solo van al log
function responderError(res, error) {
    if (error.status) return res.status(error.status).json({ mensaje: error.message || error.mensaje });
    console.error('ERROR LINEAMIENTOS:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
}

//GET /api/lineamientos
//esta funcion devuelve la version vigente de cada lineamiento con su url firmada
export async function listar(req, res) {
    try {
        const lineamientos = await lineamientoService.listarVigentes();
        return res.status(200).json(lineamientos);
    } catch (error) {
        return responderError(res, error);
    }
}

//POST /api/lineamientos (FormData con title_file, desc_file opcional, version_label y archivo)
export async function crear(req, res) {
    try {
        await lineamientoService.crearLineamiento(req.body || {}, req.usuario.id, req.file);
        return res.status(201).json({ mensaje: 'Lineamiento publicado exitosamente' });
    } catch (error) {
        return responderError(res, error);
    }
}

//GET /api/lineamientos/:title_file/historial
export async function historial(req, res) {
    try {
        const versiones = await lineamientoService.obtenerHistorial(req.params.title_file);
        return res.status(200).json(versiones);
    } catch (error) {
        return responderError(res, error);
    }
}