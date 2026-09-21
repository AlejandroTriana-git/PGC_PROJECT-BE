
//esta funcion valida el estado del body antes de realizar la consulta en la bd y responde
// a los errores correspondientes que mande el servicio
async function crear(req, res) {
  const errores = validarCiclo(req.body);
  if (errores.length > 0) {
    return res.status(400).json({ mensaje: "Datos inválidos", errores });
  }

  try {
    const ciclo = await cyclesService.crearCiclo(req.body);
    return res.status(201).json(ciclo);
  } catch (error) {
    return res.status(error.status || 500).json({ mensaje: error.message || "Error interno" });
  }
}

//esta funcion valida el estado del body antes de editar datos en la bd y responde
// a los errores correspondientes que mande el servicio
async function editar(req, res) {
  const errores = validarCiclo(req.body);
  if (errores.length > 0) {
    return res.status(400).json({ mensaje: "Datos inválidos", errores });
  }

  try {
    const ciclo = await cyclesService.editarCiclo(req.params.id, req.body);
    return res.status(200).json(ciclo);
  } catch (error) {
    return res.status(error.status || 500).json({ mensaje: error.message || "Error interno" });
  }
}

//esta funcion lista todos los ciclos y tambien por si el await no es perfecto
async function listar(req, res) {
  try {
    const ciclos = await cyclesService.listarCiclos();
    return res.status(200).json(ciclos);
  } catch (error) {
    return res.status(500).json({ mensaje: "Error interno" });
  }
}