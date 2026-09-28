import { Router } from "express";
import { verificarToken } from "../middlewares/autenticarMiddleware.js";
import { subirArchivoPgc } from "../middlewares/uploadMiddleware.js";
import * as pgcArchivoController from "../controllers/pgcArchivoController.js";

const router = Router();

router.post("/:id/files", verificarToken, subirArchivoPgc, pgcArchivoController.subir);
router.get("/:id/files", verificarToken, pgcArchivoController.listar);
router.put("/:id/files/:idArchivo", verificarToken, subirArchivoPgc, pgcArchivoController.reemplazar);
router.delete("/:id/files/:idArchivo", verificarToken, pgcArchivoController.eliminar);

export default router;