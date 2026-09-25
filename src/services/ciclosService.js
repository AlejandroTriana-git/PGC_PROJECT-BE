import * as asignacionesRepository from "../repositories/asignacionesRepository.js";
import * as usersRepository from "../repositories/usuariosRepository.js";
import * as cyclesRepository from "../repositories/ciclosRepository.js"

//Aca estan los stages permitidos
const stagesPermitidos = ["Radicación", "Registro PGC", "Sustentación", "Calificación"];
//esta es la funcion traductora del sistema a la bd

function mapearDatosCiclo(body) {
  return {
    name_cycle: body.subject_cycle,
    max_members: body.max_members,
    id_person_charge: body.id_encargado,
  };
}


//esta funcion es la encargada de crear el ciclo vacio para luego llamarlo y diligenciarlo con los datos pertinentes

async function crearCiclo(body) {
  const id_cycle = await cyclesRepository.crear(mapearDatosCiclo(body));
  return cyclesRepository.buscarPorId(id_cycle);
}

// esta funcion se revisa que el ciclo a editar exista, para que no de error en la bd
async function editarCiclo(id_cycle, body) {
  const cicloExistente = await cyclesRepository.buscarPorId(id_cycle);
  if (!cicloExistente) {
    const error = new Error("Ciclo no encontrado");
    error.status = 404;
    throw error;
  }

  await cyclesRepository.actualizar(id_cycle, mapearDatosCiclo(body));
  return cyclesRepository.buscarPorId(id_cycle);
}
// esta funcion asigna uno o varios jurados a un ciclo existente
async function asignarJurados(id_cycle, id_jurados) {
  const cicloExistente = await cyclesRepository.buscarPorId(id_cycle);
  if (!cicloExistente) {
    const error = new Error("Ciclo no encontrado");
    error.status = 404;
    throw error;
  }

  // permite que llegue un solo id o un arreglo de ids
  const listaJurados = Array.isArray(id_jurados) ? id_jurados : [id_jurados];

  if (listaJurados.length === 0) {
    const error = new Error("Debe enviar al menos un jurado");
    error.status = 400;
    throw error;
  }

  for (const id_juror of listaJurados) {
    // evitamos insertar duplicados si ya estaba asignado
    const yaAsignado = await asignacionesRepository.existeAsignacionJurado(id_cycle, id_juror);
    if (!yaAsignado) {
      await asignacionesRepository.asignarJurado(id_cycle, id_juror);
    }
  }

  return cyclesRepository.buscarPorId(id_cycle);
}

// esta funcion quita un jurado asignado a un ciclo
async function quitarJurado(id_cycle, id_juror) {
  const cicloExistente = await cyclesRepository.buscarPorId(id_cycle);
  if (!cicloExistente) {
    const error = new Error("Ciclo no encontrado");
    error.status = 404;
    throw error;
  }

  await asignacionesRepository.quitarJurado(id_cycle, id_juror);
  return cyclesRepository.buscarPorId(id_cycle);
}

// esta funcion lista los jurados asignados a un ciclo
async function listarJuradosDeCiclo(id_cycle) {
  const cicloExistente = await cyclesRepository.buscarPorId(id_cycle);
  if (!cicloExistente) {
    const error = new Error("Ciclo no encontrado");
    error.status = 404;
    throw error;
  }

  return asignacionesRepository.listarJuradosPorCiclo(id_cycle);
}

// esta funcion lista los profesores disponibles para los selects de encargado/jurado
async function listarProfesoresDisponibles(id_cycle, { excluirEncargado, excluirJurado } = {}) {
  return usersRepository.listarProfesores({ idCycle: id_cycle, excluirEncargado, excluirJurado });
}

//Funcion para obtener las fechas de un ciclo, si no existe el ciclo lanza un error 404, si existe pero no hay fechas devuelve []
async function obtenerFechas(id_cycle) {
  const cicloExistente = await cyclesRepository.buscarPorId(id_cycle);
  if (!cicloExistente) {
    const error = new Error("Ciclo no encontrado");
    error.status = 404;
    throw error;
  }

  return cyclesRepository.obtenerFechas(id_cycle);
  // Si el ciclo existe pero no hay fechas, esto devuelve [] y el controller responde 200 con []
}


async function actualizarFechas(id_cycle, stage, fechas, id_usuario) {
  const cicloExistente = await cyclesRepository.buscarPorId(id_cycle);
  if (!cicloExistente) {
    const error = new Error("Ciclo no encontrado");
    error.status = 404;
    throw error;
  }
  //Validar que fechas no venga vacio
  if (!fechas || !fechas.start_date || !fechas.end_date) {
    const error = new Error("Debe enviar las fechas de inicio y fin");
    error.status = 400;
    throw error;
  }

  // Validar que stage sea uno de los valores permitidos
  if (!stagesPermitidos.includes(stage)) {
    const error = new Error("Stage no válido");
    error.status = 400;
    throw error;
  }
  //Validar que la fecha de inicio sea menor a la fecha de fin
  if (new Date(fechas.start_date) >= new Date(fechas.end_date)) {
    const error = new Error("La fecha de inicio debe ser menor a la fecha de fin");
    error.status = 400;
    throw error;
  }
  // Actualizar las fechas del ciclo
  const actualizado = await cyclesRepository.actualizarFechas(id_cycle, stage, fechas.start_date, fechas.end_date, id_usuario);
  if (!actualizado) {
    const error = new Error("No hay fechas configuradas para esa etapa");
    error.status = 404;
    throw error;
  }
}

export { crearCiclo, editarCiclo, asignarJurados, quitarJurado, listarJuradosDeCiclo, listarProfesoresDisponibles, obtenerFechas, actualizarFechas };
