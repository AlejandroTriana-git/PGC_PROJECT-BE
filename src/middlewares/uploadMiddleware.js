import multer from 'multer';
import { FORMATOS_PERMITIDOS, TAMANO_MAXIMO_BYTES } from '../validators/archivoPgcValidator.js';

const storage = multer.memoryStorage();
const MIMETYPES_PGC = Object.keys(FORMATOS_PERMITIDOS);

/**
 * Crea un middleware de multer ya envuelto para responder JSON
 * con { mensaje } en caso de error.
 */
const crearUploader = ({ campo, mimetypes, maxBytes = TAMANO_MAXIMO_BYTES }) => {
    const mb = Math.round(maxBytes / (1024 * 1024));
    const uploader = multer({
        storage,
        limits: { fileSize: maxBytes },
        fileFilter: (req, file, cb) => {
            if (!mimetypes.includes(file.mimetype)) {
                return cb(new Error('Formato de archivo no permitido'));
            }
            cb(null, true);
        },
    }).single(campo);

    return (req, res, next) => {
        uploader(req, res, (error) => {
            if (!error) return next();
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    mensaje: `El archivo supera el tamaño máximo de ${mb} MB`,
                });
            }
            if (error.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({
                    mensaje: `El campo del archivo debe llamarse "${campo}"`,
                });
            }
            return res.status(400).json({ mensaje: error.message });
        });
    };
};

// --- Middlewares listos para usar ---

// PGC: acepta todos los formatos definidos en el validador
export const subirArchivoPgc = crearUploader({
    campo: 'archivo',
    mimetypes: MIMETYPES_PGC,
});

// Propuesta: solo PDF, campo 'pdf', 5 MB
export const subirPdfPropuesta = crearUploader({
    campo: 'pdf',
    mimetypes: ['application/pdf'],
    maxBytes: 5 * 1024 * 1024,
});

// NUEVO — Lineamientos y rúbricas: solo PDF, campo 'archivo', 10 MB
export const subirPdfDocumento = crearUploader({
    campo: 'archivo',
    mimetypes: ['application/pdf'],
});