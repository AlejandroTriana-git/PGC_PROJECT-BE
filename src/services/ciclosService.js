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

//esta es la funcion traductora de la bd al frontend (mapeo de salida): el FE nunca ve name_cycle,
//id_person_charge ni id_cycle, ve los mismos nombres con los que ya envia el body
function mapearCicloParaFrontend(fila) {
  return {
    id: fila.id_cycle,
    subject_cycle: fila.name_cycle,
    max_members: fila.max_members,
    id_encargado: fila.id_person_charge,
  };
}


//esta funcion arma el error con su status para que el controller sepa que codigo devolver
function crearError(mensaje, status) {
  const error = new Error(mensaje);
  error.status = status;
  return error;
}

//aca se revisa que el encargado sea un profesor que exista, antes se guardaba cualquier id y la bd daba un error de llave foranea
async function verificarEncargadoProfesor(id_encargado) {
  const profesores = await usersRepository.filtrarProfesores([id_encargado]);
  if (profesores.length === 0) throw crearError("El encargado debe ser un profesor existente", 400);
}

//esta funcion lista todos los ciclos con el mismo formato que ya devuelven crear y editar
async function listarCiclos() {
  const ciclos = await cyclesRepository.listarTodos();
  return ciclos.map(mapearCicloParaFrontend);
}

//esta funcion es la encargada de crear el ciclo vacio para luego llamarlo y diligenciarlo con los datos pertinentes

async function crearCiclo(body) {
  await verificarEncargadoProfesor(body.id_encargado);
  const id_cycle = await cyclesRepository.crear(mapearDatosCiclo(body));
  return mapearCicloParaFrontend(await cyclesRepository.buscarPorId(id_cycle));
}

// esta funcion se revisa que el ciclo a editar exista, para que no de error en la bd
async function editarCiclo(id_cycle, body) {
  const cicloExistente = await cyclesRepository.buscarPorId(id_cycle);
  if (!cicloExistente) {
    const error = new Error("Ciclo no encontrado");
    error.status = 404;
    throw error;
  }

  await verificarEncargadoProfesor(body.id_encargado);
  await cyclesRepository.actualizar(id_cycle, mapearDatosCiclo(body));
  return mapearCicloParaFrontend(await cyclesRepository.buscarPorId(id_cycle));
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

  //aca se revisa que todos los ids sean numeros y que todos sean profesores, si uno falla no se asigna ninguno
  if (!listaJurados.every((id) => Number.isInteger(id) && id > 0)) {
    throw crearError("id_jurados debe contener solo ids numericos", 400);
  }
  const profesores = await usersRepository.filtrarProfesores(listaJurados);
  if (profesores.length !== new Set(listaJurados).size) {
    throw crearError("Solo se pueden asignar profesores existentes como jurado", 400);
  }

  for (const id_juror of listaJurados) {
    // evitamos insertar duplicados si ya estaba asignado
    const yaAsignado = await asignacionesRepository.existeAsignacionJurado(id_cycle, id_juror);
    if (!yaAsignado) {
      await asignacionesRepository.asignarJurado(id_cycle, id_juror);
    }
  }

  return mapearCicloParaFrontend(await cyclesRepository.buscarPorId(id_cycle));
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
  return mapearCicloParaFrontend(await cyclesRepository.buscarPorId(id_cycle));
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

export { crearCiclo, listarCiclos, editarCiclo, asignarJurados, quitarJurado, listarJuradosDeCiclo, listarProfesoresDisponibles, obtenerFechas, actualizarFechas };