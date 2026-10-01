import multer from 'multer';//Se usa para gestionar la carga de archivos
import { FORMATOS_PERMITIDOS, TAMANO_MAXIMO_BYTES } from '../validators/archivoPgcValidator.js';

const storage = multer.memoryStorage();

export const subirPdfPropuesta = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB, ajústarlo para no gastar mucho espacio en Firebase Storage
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Solo se permiten archivos PDF'));
    }
    cb(null, true);
  },
}).single('pdf'); // 'pdf' es el nombre del campo en el FormData
const cargar_archivo_pgc = multer({
  storage,
  limits: { fileSize: TAMANO_MAXIMO_BYTES },
  fileFilter: (req, file, cb) => {
    if (!Object.hasOwn(FORMATOS_PERMITIDOS, file.mimetype)) {
      return cb(new Error('Formato de archivo no permitido'));
    }
    cb(null, true);
  },
}).single('archivo'); // 'archivo' es el campo del FormData que especifico Joseph

// envuelve a multer para que sus errores salgan como { mensaje } y no como
// la pagina de error por defecto de Express
export const subirArchivoPgc = (req, res, next) => {
  cargar_archivo_pgc(req, res, (error) => {
    if (!error) return next();
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ mensaje: 'El archivo supera el tamaño máximo de 10 MB' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ mensaje: 'El campo del archivo debe llamarse "archivo"' });
    }
    return res.status(400).json({ mensaje: error.message });
  });
};