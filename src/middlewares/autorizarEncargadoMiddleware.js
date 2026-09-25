import {esEncargadoDeCiclo, obtenerCicloPropuesta} from '../repositories/asignacionesRepository.js';

//En este middleware se verifica que el profesor autenticado sea el encargado del ciclo que pertenece a la propuesa.
//Que no solo tenga rol profesor



//Rutas donde llega el id de la propuesta
//Pirmero toca mirar a que ciclo pertenece la propuesta y luego verificar si el profesor autenticado es el encargado de ese ciclo

export function autorizarEncargadoPropuesta(){
    return async (req, res, next) => {
        //Cheuqeo de seguridad
        if (!req.usuario) {
            return res.status(401).json({ mensaje: "No autenticado" });
        }
        const idProposal = req.params.idProposal;

        try {
            //Obtenemos el id del ciclo al que pertenece la propuesta
            const idCycle = await obtenerCicloPropuesta(idProposal);
            if (!idCycle) {
                return res.status(404).json({ mensaje: "Propuesta no encontrada" });
            }
            //Verificamos si el usuario autenticado es el encargado de ese ciclo
            const esEncargado = await esEncargadoDeCiclo(idCycle, req.usuario.id);
            if (!esEncargado) {
                return res.status(403).json({ mensaje: "No tienes permiso para esta acción" });
            }
            next();
        } catch (error) {
            return res.status(500).json({ mensaje: "Error interno del servidor" });
        }
}
};


//Para rutas donde llega el id del ciclo directamente, se verifica si el profesor autenticado es el encargado de ese ciclo
//Servira mas adleante para solo mostrarle las propuestas que sean del ciclo que tienen encargado
export function autorizarEncargadoDeCiclo() {
  return async (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ mensaje: "No autenticado" });
    }

    const idCycle = req.params.id; // Se obtiene el id del ciclo desde los parámetros de la ruta o la query

    try {
      const esEncargado = await esEncargadoDeCiclo(idCycle, req.usuario.id);

      if (!esEncargado) {
        return res.status(403).json({ mensaje: "No eres el encargado de este ciclo" });
      }

      next();
    } catch (error) {
      return res.status(500).json({ mensaje: "Error validando la autorización" });
    }
  };
}