import { Router } from "express";
import verificarToken from "../middlewares/autenticarMiddleware.js";
import autorizarRoles from "../middlewares/rolMiddleware.js";
import * as cyclesController from "../controllers/ciclosController.js";
import { autorizarEncargadoDeCiclo } from "../middlewares/autorizarEncargadoMiddleware.js";

const router = Router();

// GET /api/ciclos/profesores — DEBE ir ANTES de /:id para que Express no lo confunda
router.get("/profesores", verificarToken, cyclesController.listarProfesores);

// aca se llama a los middlewares para los roles
router.post("/", verificarToken, autorizarRoles("Administrador"), cyclesController.crear);
router.put("/:id", verificarToken, autorizarRoles("Administrador"), cyclesController.editar);
router.get("/", verificarToken, cyclesController.listar);
router.post("/:id/jurados", verificarToken, autorizarRoles("Administrador"), cyclesController.asignarJurados);
router.delete("/:id/jurados/:id_jurado", verificarToken, autorizarRoles("Administrador"), cyclesController.quitarJurado);
router.get("/:id/jurados", verificarToken, cyclesController.listarJurados);


router.get("/:id/fechas", verificarToken, cyclesController.obtenerFechas);
router.put("/:id/fechas/:stage", verificarToken, autorizarEncargadoDeCiclo(), autorizarRoles("Profesor"), cyclesController.actualizarFechas);
export default router;