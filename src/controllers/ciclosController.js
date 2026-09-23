import * as cyclesService from "../services/ciclosService.js";
import { validarCiclo } from "../validators/ciclosValidator.js";
//esta funcion valida el estado del body antes de realizar la consulta en la bd y responde
// a los errores correspondientes que mande el servicio
export async function crear(req, res) {
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
export async function editar(req, res) {
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
export async function listar(req, res) {
  try {
    const ciclos = await cyclesService.listarCiclos();
    return res.status(200).json(ciclos);
  } catch (error) {
    return res.status(500).json({ mensaje: "Error interno" });
  }
}

//aca se asigna jurados al ciclo seleccionado
export async function asignarJurados(req, res, next) {
  try {
    const { id } = req.params;
    const { id_jurados } = req.body;
    const ciclo = await cyclesService.asignarJurados(id, id_jurados);
    res.json(ciclo);
  } catch (error) {
    next(error);
  }
}
//aca se quita jurados del ciclo seleccionado
export async function quitarJurado(req, res, next) {
  try {
    const { id, id_jurado } = req.params;
    const ciclo = await cyclesService.quitarJurado(id, id_jurado);
    res.json(ciclo);
  } catch (error) {
    next(error);
  }
}
//aca se enlistan todos los jurados que hay
export async function listarJurados(req, res, next) {
  try {
    const { id } = req.params;
    const jurados = await cyclesService.listarJuradosDeCiclo(id);
    res.json(jurados);
  } catch (error) {
    next(error);
  }
}

// GET /api/ciclos/profesores — lista profesores disponibles para selects de encargado/jurado
export async function listarProfesores(req, res) {
  try {
    const { id_cycle, excluirEncargado, excluirJurado } = req.query;
    const profesores = await cyclesService.listarProfesoresDisponibles(
      id_cycle ? Number(id_cycle) : undefined,
      {
        excluirEncargado: excluirEncargado === 'true',
        excluirJurado:    excluirJurado    === 'true',
      }
    );
    res.status(200).json(profesores);
  } catch (error) {
    res.status(error.status || 500).json({ mensaje: error.message || 'Error interno' });
  }
}