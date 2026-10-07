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
//limites que salen de la tabla pgc_files: title_file es VARCHAR(150) y desc_file es TEXT (65535 bytes)
export const MAX_TITULO_ARCHIVO = 150;
export const MAX_DESCRIPCION_BYTES = 65535;

//esta funcion valida el titulo y la descripcion que manda el FE junto al archivo, los dos son obligatorios
export function validarDatosArchivoPgc(body) {
  const datos = body || {};
  const errores = [];
  const titulo = typeof datos.title_file === "string" ? datos.title_file.trim() : "";
  const descripcion = typeof datos.desc_file === "string" ? datos.desc_file.trim() : "";

  //aca se revisa que el titulo exista y que no pase el largo de la columna
  if (titulo === "") errores.push("title_file es obligatorio");
  else if (titulo.length > MAX_TITULO_ARCHIVO) errores.push(`title_file no puede superar los ${MAX_TITULO_ARCHIVO} caracteres`);

  //aca lo mismo con la descripcion
  if (descripcion === "") errores.push("desc_file es obligatorio");
  else if (Buffer.byteLength(descripcion, "utf8") > MAX_DESCRIPCION_BYTES) errores.push("desc_file es demasiado largo");

  return errores;
}

//esta funcion deja el titulo y la descripcion sin espacios al inicio ni al final, se llama solo despues de validar
export function normalizarDatosArchivoPgc(body) {
  return { title_file: body.title_file.trim(), desc_file: body.desc_file.trim() };
}