// formatos que acepta el PGC (mimetype -> extension que se guarda en pgc_files.file_format).
// Se guarda la extension y no el mimetype porque la columna es VARCHAR(20) y
// mimetypes como el de .docx o .xlsx miden mas de 60 caracteres.
export const FORMATOS_PERMITIDOS = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export const TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024; // 10 MB, segun Joseph