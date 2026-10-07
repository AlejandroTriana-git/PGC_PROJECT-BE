import { Router } from "express";
import * as cicloArchivoController from "../controllers/cicloArchivoController.js";
import  verificarToken  from '../middlewares/autenticarMiddleware.js';       
import  autorizarRoles  from '../middlewares/rolMiddleware.js';     
import { subirPdfDocumento } from '../middlewares/uploadMiddleware.js'; // <-- Importa el middleware de subida de archivos
import { perteneceAlCiclo } from '../middlewares/pertenecenciaCiclomiddleware.js'; // <-- Importa el middleware de auorizar para ver si esta en el ciclo
import { autorizarEncargadoDeCiclo } from '../middlewares/autorizarEncargadoMiddleware.js'; // <-- Importa el middleware de auorizar para ver si es encargado del ciclo
const router = Router();


// Ruta para crear un nuevo archivo de tipo lineamiento de ciclo
router.post('/:id/documentos/lineamiento', verificarToken,  autorizarRoles("Administrador"), subirPdfDocumento, cicloArchivoController.crearLineamiento); 

// Ruta para crear un nuevo archivo de tipo rubrica de ciclo

router.post('/:id/documentos/rubrica', verificarToken,  autorizarEncargadoDeCiclo(), subirPdfDocumento, cicloArchivoController.crearRubrica); 



/** 
 * Estos sirven para cualquier tipo de documento, sea rubrica o lineamiento
 **/
// Ruta para obtener 
router.get('/:id/documentos', verificarToken, perteneceAlCiclo, cicloArchivoController.obtenerDocumentosCiclo);


//Ruta para obteneer el historial de versiones de un documento puntual
router.get('/:id/documentos/:title_file/historial', verificarToken, perteneceAlCiclo, cicloArchivoController.obtenerHistoriaDocumentosCiclo);

export default router;