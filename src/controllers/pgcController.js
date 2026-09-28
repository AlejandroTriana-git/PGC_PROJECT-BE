import * as pgcService from '../services/pgcService.js';

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

export { listarPropuestasAprobadasSinPgc, crearPgc, listarMisPgc };