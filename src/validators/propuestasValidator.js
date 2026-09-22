
//aca se verifica que el body cumple con los parametros validos ya que el comentario es obligatorio

function validarRechazo(body) {
  const errores = [];

  if (!body.comentario || typeof body.comentario !== "string" || body.comentario.trim() === "") {
    errores.push("El comentario de rechazo es obligatorio");
  }

  return errores;
}

export { validarRechazo };