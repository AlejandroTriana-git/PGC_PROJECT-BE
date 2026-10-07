import * as pgcService from '../services/pgcService.js';
import { validarBusquedaPgc, normalizarFiltrosBusquedaPgc } from '../validators/busquedaPgcValidator.js';

// ============================================
// ISSUE 1: Listar propuestas aprobadas sin PGC
// ============================================

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

// ============================================
// ISSUE 2: Registrar PGC
// ============================================

const crearPgc = async (req, res) => {
    try {
        const { id_proposal } = req.body;
        const id_usuario = req.usuario.id;

        if (!id_proposal) {
            return res.status(400).json({ mensaje: 'Debe enviar id_proposal' });
        }

        const result = await pgcService.crearPgc(id_proposal, id_usuario);
        res.status(201).json(result);
    } catch (error) {
        console.error('ERROR CREAR PGC:', error);
        res.status(error.status || 500).json({
            mensaje: error.mensaje || 'Error interno del servidor',
            ...(error.fecha_inicio_registro_pgc && {
                fecha_inicio_registro_pgc: error.fecha_inicio_registro_pgc,
                fecha_fin_registro_pgc: error.fecha_fin_registro_pgc
            })
        });
    }
};

// ============================================
// ISSUE 3: Listar mis PGC
// ============================================

const listarMisPgc = async (req, res) => {
    try {
        const id_usuario = req.usuario.id;
        const pgcs = await pgcService.listarMisPgc(id_usuario);
        res.status(200).json(pgcs);
    } catch (error) {
        console.error('ERROR LISTAR MIS PGC:', error);
        res.status(error.status || 500).json({
            mensaje: error.mensaje || 'Error interno del servidor'
        });
    }
};
// ============================================
// HU-04: Buscador de PGC
// ============================================

//GET /api/pgc/search?q=&categoria=&ciclo=&estado=&pagina=
//esta funcion valida los parametros, llama al service y responde, si no hay resultados responde 200 con resultados: []
export const buscarPgc = async (req, res) => {
    //primero se validan los parametros, si hay errores se devuelven todos juntos en un solo mensaje
    const errores = validarBusquedaPgc(req.query);
    if (errores.length > 0) {
        return res.status(400).json({ mensaje: errores.join('. ') });
    }

    try {
        const resultado = await pgcService.buscarPgc(normalizarFiltrosBusquedaPgc(req.query));
        return res.status(200).json(resultado);
    } catch (error) {
        console.error('ERROR BUSCAR PGC:', error);
        //solo se muestra el mensaje si es un error controlado (trae status), uno de la bd no se le muestra al cliente
        const mensaje = error.status ? (error.mensaje || error.message) : 'Error interno del servidor';
        return res.status(error.status || 500).json({ mensaje });
    }
};

// ============================================
// Ficha histórica del PGC (HU-05)
// ============================================

const obtenerPgc = async (req, res) => {
    try {
        const id_pgc = req.params.id;
        const pgc = await pgcService.obtenerPgcPorId(id_pgc);
        res.status(200).json(pgc);
    } catch (error) {
        console.error('ERROR OBTENER PGC:', error);
        res.status(error.status || 500).json({
            mensaje: error.mensaje || 'Error interno del servidor'
        });
    }
};



export { listarPropuestasAprobadasSinPgc, crearPgc, listarMisPgc, obtenerPgc };