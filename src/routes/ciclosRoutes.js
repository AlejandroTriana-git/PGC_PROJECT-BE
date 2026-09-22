import { Router } from "express";
import verificarToken from "../middlewares/auth.middleware.js";
import autorizarRoles from "../middlewares/role.middleware.js";
import * as cyclesController from "../controllers/cycles.controller.js";

const router = Router();
// aca se llama a los middlewares para los roles
router.post("/", verificarToken, autorizarRoles("Coordinador"), cyclesController.crear);
router.put("/:id", verificarToken, autorizarRoles("Coordinador"), cyclesController.editar);
router.get("/", verificarToken, cyclesController.listar);
router.post("/:id/jurados", verificarToken, autorizarRoles("Coordinador"), cyclesController.asignarJurados);
router.delete("/:id/jurados/:id_jurado", verificarToken, autorizarRoles("Coordinador"), cyclesController.quitarJurado);
router.get("/:id/jurados", verificarToken, cyclesController.listarJurados);

export default router;