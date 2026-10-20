import { Router } from "express";
import verificarToken from "../middlewares/autenticarMiddleware.js";
import verificarTokenOpcional from "../middlewares/autenticarOpcionalMiddleware.js";
import autorizarRoles from "../middlewares/rolMiddleware.js";
import * as cyclesController from "../controllers/ciclosController.js";
import { autorizarEncargadoDeCiclo } from "../middlewares/autorizarEncargadoMiddleware.js";

const router = Router();

/**
 * @swagger
 * /api/ciclos/profesores:
 *   get:
 *     summary: Listar profesores disponibles
 *     description: Obtiene la lista de profesores para los selects de encargado o jurado. Se pueden aplicar filtros.
 *     tags: [Ciclos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id_cycle
 *         schema:
 *           type: integer
 *         description: Filtrar por ciclo específico
 *       - in: query
 *         name: excluirEncargado
 *         schema:
 *           type: boolean
 *         description: Si es true, excluye al encargado actual
 *       - in: query
 *         name: excluirJurado
 *         schema:
 *           type: boolean
 *         description: Si es true, excluye a los jurados actuales
 *     responses:
 *       200:
 *         description: Lista de profesores
 *       401:
 *         description: Token no proporcionado
 */
// GET /api/ciclos/profesores — DEBE ir ANTES de /:id para que Express no lo confunda
router.get("/profesores", verificarToken, cyclesController.listarProfesores);

/**
 * @swagger
 * /api/ciclos:
 *   post:
 *     summary: Crear un nuevo ciclo
 *     description: Permite al Administrador registrar un nuevo ciclo en el sistema.
 *     tags: [Ciclos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject_cycle:
 *                 type: string
 *                 example: "Fundamentación"
 *               max_members:
 *                 type: integer
 *                 example: 4
 *               id_encargado:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Ciclo creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tienes permisos (solo Admin)
 */
// aca se llama a los middlewares para los roles
router.post("/", verificarToken, autorizarRoles("Administrador"), cyclesController.crear);

/**
 * @swagger
 * /api/ciclos/{id}:
 *   put:
 *     summary: Editar un ciclo
 *     description: Permite al Administrador actualizar la información de un ciclo.
 *     tags: [Ciclos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject_cycle:
 *                 type: string
 *               max_members:
 *                 type: integer
 *               id_encargado:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Ciclo actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.put("/:id", verificarToken, autorizarRoles("Administrador"), cyclesController.editar);

/**
 * @swagger
 * /api/ciclos:
 *   get:
 *     summary: Listar todos los ciclos
 *     description: Obtiene la lista de ciclos. Es público porque el buscador lo usa sin sesión.
 *     tags: [Ciclos]
 *     responses:
 *       200:
 *         description: Lista de ciclos
 */
//la lista de ciclos es publica porque el buscador de PGC la usa para el filtro de ciclo (sin sesion tambien)
router.get("/", verificarTokenOpcional, cyclesController.listar);

/**
 * @swagger
 * /api/ciclos/{id}/jurados:
 *   post:
 *     summary: Asignar jurados a un ciclo
 *     description: Permite al Administrador asignar una lista de profesores como jurados del ciclo.
 *     tags: [Ciclos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_jurados:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [3, 4, 5]
 *     responses:
 *       200:
 *         description: Jurados asignados correctamente
 */
router.post("/:id/jurados", verificarToken, autorizarRoles("Administrador"), cyclesController.asignarJurados);

/**
 * @swagger
 * /api/ciclos/{id}/jurados/{id_jurado}:
 *   delete:
 *     summary: Quitar jurado de un ciclo
 *     description: Permite al Administrador retirar a un jurado del ciclo.
 *     tags: [Ciclos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: id_jurado
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Jurado removido
 */
router.delete("/:id/jurados/:id_jurado", verificarToken, autorizarRoles("Administrador"), cyclesController.quitarJurado);

/**
 * @swagger
 * /api/ciclos/{id}/jurados:
 *   get:
 *     summary: Listar jurados de un ciclo
 *     description: Obtiene los profesores que son jurados del ciclo.
 *     tags: [Ciclos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de jurados
 */
router.get("/:id/jurados", verificarToken, cyclesController.listarJurados);

/**
 * @swagger
 * /api/ciclos/{id}/fechas:
 *   get:
 *     summary: Obtener fechas de las etapas del ciclo
 *     description: Devuelve las fechas de Radicación, Registro PGC, Sustentación y Calificación.
 *     tags: [Ciclos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de fechas
 */
router.get("/:id/fechas", verificarToken, cyclesController.obtenerFechas);

/**
 * @swagger
 * /api/ciclos/{id}/fechas/{stage}:
 *   put:
 *     summary: Actualizar fechas de una etapa
 *     description: Permite al encargado del ciclo actualizar las fechas de una etapa específica.
 *     tags: [Ciclos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: stage
 *         required: true
 *         schema:
 *           type: string
 *           example: "Radicación"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               start_date:
 *                 type: string
 *                 example: "2026-10-01T00:00:00"
 *               end_date:
 *                 type: string
 *                 example: "2026-11-30T23:59:59"
 *     responses:
 *       200:
 *         description: Fechas actualizadas correctamente
 *       403:
 *         description: No eres el encargado de este ciclo
 */
router.put("/:id/fechas/:stage", verificarToken, autorizarEncargadoDeCiclo(), autorizarRoles("Profesor"), cyclesController.actualizarFechas);

export default router;