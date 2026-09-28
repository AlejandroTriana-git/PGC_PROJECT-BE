import * as pgcArchivoService from "../services/pgcArchivoService.js";

async function subir(req, res) {
  if (!req.file) {
    return res.status(400).json({ mensaje: "El archivo es obligatorio" });
  }
  try {
    const archivo = await pgcArchivoService.subirArchivo(req.params.id, req.usuario.id, req.file);
    return res.status(201).json(archivo);
  } catch (error) {
    return res.status(error.status || 500).json({ mensaje: error.message || "Error interno" });
  }
}

async function listar(req, res) {
  try {
    const archivos = await pgcArchivoService.listarArchivos(req.params.id, req.usuario.id);
    return res.status(200).json(archivos);
  } catch (error) {
    return res.status(error.status || 500).json({ mensaje: error.message || "Error interno" });
  }
}

async function reemplazar(req, res) {
  if (!req.file) {
    return res.status(400).json({ mensaje: "El archivo es obligatorio" });
  }
  try {
    const archivo = await pgcArchivoService.reemplazarArchivo(
      req.params.id, req.params.idArchivo, req.usuario.id, req.file
    );
    return res.status(200).json(archivo);
  } catch (error) {
    return res.status(error.status || 500).json({ mensaje: error.message || "Error interno" });
  }
}

async function eliminar(req, res) {
  try {
    await pgcArchivoService.eliminarArchivo(req.params.id, req.params.idArchivo, req.usuario.id);
    return res.status(204).send();
  } catch (error) {
    return res.status(error.status || 500).json({ mensaje: error.message || "Error interno" });
  }
}

export { subir, listar, reemplazar, eliminar };