import * as cicloRepository from '../repositories/ciclosRepository.js';

export const perteneceAlCiclo = async (req, res, next) => {
    try {
        const idUsuario = req.usuario?.id;
        const rol = req.usuario?.rol;
        const idCiclo = req.params.id;

        if (!idUsuario) {
            return res.status(401).json({ mensaje: 'Usuario no autenticado' });
        }

        // Admin pasa sin más chequeos
        if (rol === 'Administrador') {
            return next();
        }

        const pertenece = await cicloRepository.usuarioPerteneceAlCiclo(idUsuario, idCiclo);
        if (!pertenece) {
            return res.status(403).json({ mensaje: 'No tienes acceso a este ciclo' });
        }

        return next();
    } catch (error) {
        console.error('ERROR PERTENENCIA CICLO:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};