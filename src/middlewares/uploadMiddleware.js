import multer from 'multer';//Se usa para gestionar la carga de archivos

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