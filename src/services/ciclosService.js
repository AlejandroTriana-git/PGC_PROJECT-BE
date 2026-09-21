
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