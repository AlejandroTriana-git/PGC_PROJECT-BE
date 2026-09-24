import {
  esEncargadoDeCiclo,
  obtenerCicloPropuesta,
} from '../repositories/asignacionesRepository.js';
import { esMiembroDePropuesta } from '../repositories/propuestaRepository.js';

export function puedeVerPropuesta() {
  return async (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ mensaje: 'No autenticado' });
    }

    const idProposal = req.params.idProposal;

    try {
      // 1. ¿Es líder o integrante del equipo?
      const esMiembro = await esMiembroDePropuesta(idProposal, req.usuario.id);
      if (esMiembro) return next();

      // 2. ¿Es el encargado del ciclo de esa propuesta?
      const idCycle = await obtenerCicloPropuesta(idProposal);
      if (!idCycle) {
        return res.status(404).json({ mensaje: 'Propuesta no encontrada' });
      }

      const esEncargado = await esEncargadoDeCiclo(idCycle, req.usuario.id);
      if (esEncargado) return next();

      // 3. Ni miembro ni encargado → fuera
      return res
        .status(403)
        .json({ mensaje: 'No tienes permiso para ver esta propuesta' });
    } catch (error) {
      console.error('Error validando permiso de visualización:', error);
      return res.status(500).json({ mensaje: 'Error validando permisos' });
    }
  };
}