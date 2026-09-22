//a diferencia de ciclos, aca no se usa autorizarRoles porque el permiso depende de si el usuario
//es el encargado de ese ciclo puntual, no de un rol fijo — eso se valida en el service

import { Router } from "express";
import verificarToken from "../middlewares/auth.middleware.js";
import * as proposalsController from "../controllers/proposals.controller.js";

const router = Router();


//GET propuestas pendientes de un ciclo (o el estado que se pase por query)
router.get("/", verificarToken, proposalsController.listarPendientes);
//PATCH aprobar una propuesta
router.patch("/:id/aprobar", verificarToken, proposalsController.aprobar);
//PATCH rechazar una propuesta
router.patch("/:id/rechazar", verificarToken, proposalsController.rechazar);

export default router;