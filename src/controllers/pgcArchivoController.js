import * as pgcArchivoService from "../services/pgcArchivoService.js";
import { validarDatosArchivoPgc, normalizarDatosArchivoPgc } from "../validators/archivoPgcValidator.js";

//aca los errores controlados (los que traen status) se muestran tal cual, cualquier otro
//(por ejemplo un fallo de mysql) se guarda en el log del servidor y al cliente solo le llega un mensaje general
function responderError(res, error) {
  if (error.status) return res.status(error.status).json({ mensaje: error.message });
  console.error("ERROR ARCHIVO PGC:", error);
  return res.status(500).json({ mensaje: "Error interno del servidor" });
}

//POST /api/pgc/:id/files (formulario con archivo + title_file + desc_file)
//esta funcion revisa que lleguen el archivo, el title_file y la desc_file antes de llamar al service
async function subir(req, res) {
  if (!req.file) {
    return res.status(400).json({ mensaje: "El archivo es obligatorio" });
  }
  const errores = validarDatosArchivoPgc(req.body);
  if (errores.length > 0) {
    return res.status(400).json({ mensaje: errores.join(". ") });
  }
  try {
    const archivo = await pgcArchivoService.subirArchivo(
      req.params.id, req.usuario.id, req.file, normalizarDatosArchivoPgc(req.body)
    );
    return res.status(201).json(archivo);
  } catch (error) {
    return responderError(res, error);
  }
}

//GET /api/pgc/:id/files
//esta funcion devuelve los archivos del pgc con su title_file, desc_file y la url para verlos
async function listar(req, res) {
  try {
    const archivos = await pgcArchivoService.listarArchivos(req.params.id, req.usuario.id);
    return res.status(200).json(archivos);
  } catch (error) {
    return responderError(res, error);
  }
}

//PUT /api/pgc/:id/files/:idArchivo
//aca el archivo es opcional, pero el title_file y la desc_file siguen siendo obligatorios los dos
async function reemplazar(req, res) {
  const errores = validarDatosArchivoPgc(req.body);
  if (errores.length > 0) {
    return res.status(400).json({ mensaje: errores.join(". ") });
  }
  try {
    //req.file llega vacio si no mandaron archivo, el service sabe que en ese caso solo cambia los textos
    const archivo = await pgcArchivoService.reemplazarArchivo(
      req.params.id, req.params.idArchivo, req.usuario.id, req.file, normalizarDatosArchivoPgc(req.body)
    );
    return res.status(200).json(archivo);
  } catch (error) {
    return responderError(res, error);
  }
}

//DELETE /api/pgc/:id/files/:idArchivo
//esta funcion elimina el archivo y responde 204 sin contenido
async function eliminar(req, res) {
  try {
    await pgcArchivoService.eliminarArchivo(req.params.id, req.params.idArchivo, req.usuario.id);
    return res.status(204).send();
  } catch (error) {
    return responderError(res, error);
  }
}

export { subir, listar, reemplazar, eliminar };