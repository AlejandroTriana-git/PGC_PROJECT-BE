import * as proposalsRepository from "../repositories/proposals.repository.js";
import * as cyclesRepository from "../repositories/cycles.repository.js";

//aca nombramos exactamente el estado "pendiente" tal cual está en la BD
const ESTADO_PENDIENTE = "Pendiente de validación";

//esta funcion es interna y se usan las otras tres: valida que el ciclo exista y que el usuario sea el correspondiente
async function verificarEncargado(id_cycle, id_usuario) {
  const ciclo = await cyclesRepository.buscarPorId(id_cycle);
  if (!ciclo) {
    const error = new Error("Ciclo no encontrado");
    error.status = 404;
    throw error;
  }

  if (ciclo.id_person_charge !== id_usuario) {
    const error = new Error("No eres el encargado de este ciclo");
    error.status = 403;
    throw error;
  }

  return ciclo;
}

//con esta funcion validamos que el usuario sea encargado de ese ciclo y devuelve las propuestas de ese ciclo en el estado pendientes por defecto
async function listarPendientesPorCiclo(id_cycle, estado, usuario) {
  await verificarEncargado(id_cycle, usuario.id);
  return proposalsRepository.listarPorCicloYEstado(id_cycle, estado || ESTADO_PENDIENTE);
}

//esta funcion busca la propuesta, valida que exista y que el usuario sea el encargado del ciclo y que siga pendiente, y la aprueba
async function aprobarPropuesta(id_proposal, usuario) {
  const propuesta = await proposalsRepository.buscarPorId(id_proposal);
  if (!propuesta) {
    const error = new Error("Propuesta no encontrada");
    error.status = 404;
    throw error;
  }

  await verificarEncargado(propuesta.id_cycle, usuario.id);

  if (propuesta.state_proposal !== ESTADO_PENDIENTE) {
    const error = new Error("Esta propuesta ya fue revisada");
    error.status = 409;
    throw error;
  }

  await proposalsRepository.aprobar(id_proposal, usuario.id);
  return {mensaje: 'Su Propuesta fue aprobada, ¡a desarrollar!'};
}

//esta funcion es igual a la de aprobar pero además calcula el nuevo resubmit_count y decide si pasa a Rechazada o a Anulada
async function rechazarPropuesta(id_proposal, comentario, usuario) {
  const propuesta = await proposalsRepository.buscarPorId(id_proposal);
  if (!propuesta) {
    const error = new Error("Propuesta no encontrada");
    error.status = 404;
    throw error;
  }

  await verificarEncargado(propuesta.id_cycle, usuario.id);

  if (propuesta.state_proposal !== ESTADO_PENDIENTE) {
    const error = new Error("Esta propuesta ya fue revisada");
    error.status = 409;
    throw error;
  }

  const nuevoResubmitCount = propuesta.resubmit_count + 1;
  const nuevoEstado = nuevoResubmitCount >= 3 ? "Anulada" : "Rechazada";

  await proposalsRepository.rechazar(id_proposal, {
    rejection_comment: comentario,
    nuevoEstado,
    nuevoResubmitCount,
    reviewed_by: usuario.id,
  });

  return {nuevoResubmitCount, mensaje: 'Su Propuesta fue rechazado'};
}

export { listarPendientesPorCiclo, aprobarPropuesta, rechazarPropuesta };