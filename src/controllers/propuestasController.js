import * as proposalsService from "../services/proposals.service.js";
import { validarRechazo } from "../validators/proposals.validator.js";

//esta funcion valida que venga el parametro cycle, llama al servicio y responde con las propuestas o el error
async function listarPendientes(req, res) {
  const { cycle, estado } = req.query;

  if (!cycle) {
    return res.status(400).json({ mensaje: "El parámetro cycle es obligatorio" });
  }

  try {
    const propuestas = await proposalsService.listarPendientesPorCiclo(cycle, estado, req.usuario);
    return res.status(200).json(propuestas);
  } catch (error) {
    return res.status(error.status || 500).json({ mensaje: error.message || "Error interno" });
  }
}

//esta funcion llama al servicio para aprobar la propuesta con el id de la url y responde con la propuesta ya actualizada
async function aprobar(req, res) {
  try {
    const propuesta = await proposalsService.aprobarPropuesta(req.params.id, req.usuario);
    return res.status(200).json(propuesta);
  } catch (error) {
    return res.status(error.status || 500).json({ mensaje: error.message || "Error interno" });
  }
}

//esta funcion valida que venga el comentario obligatorio, llama al servicio para rechazar y responde con la propuesta actualizada

async function rechazar(req, res) {
  const errores = validarRechazo(req.body);
  if (errores.length > 0) {
    return res.status(400).json({ mensaje: "Datos inválidos", errores });
  }

  try {
    const propuesta = await proposalsService.rechazarPropuesta(req.params.id, req.body.comentario, req.usuario);
    return res.status(200).json(propuesta);
  } catch (error) {
    return res.status(error.status || 500).json({ mensaje: error.message || "Error interno" });
  }
}

export { listarPendientes, aprobar, rechazar };