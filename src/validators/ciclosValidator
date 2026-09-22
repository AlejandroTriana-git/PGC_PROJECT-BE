
// esta funcion es la encargada de validar que los datos lleguen correctamente para crear o editar un ciclo

function validarCiclo(body) {
  const errores = [];

//aca es revision de tipo de dato por si llega un null o numeros  y/o objetos en vez de texto
//con la finalidad de optimizar los elementos que se guarden en la bd
  if (!body.subject_cycle || typeof body.subject_cycle !== "string") {
    errores.push("subject_cycle es obligatorio");
  }

//valida que max_members venga como entero positivo (0 o vacío no sirve)
  if (
    body.max_members === undefined ||
    !Number.isInteger(body.max_members) ||
    body.max_members < 1
  ) {
    errores.push("max_members es obligatorio y debe ser un entero mayor a 0");
  }

//aca es para rectificar que si halla un encargado valido por ese ciclo
  if (
    body.id_encargado === undefined ||
    body.id_encargado === null ||
    !Number.isInteger(body.id_encargado)
  ) {
    errores.push("id_encargado es obligatorio y debe ser un id numérico");
  }

  return errores;
}

export { validarCiclo };