import {obtenerFechasEtapas} from "../repositories/ciclosRepository.js" ;
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
//Funcion para encontrar las fechas de inicio y fin de una etapa específica de un ciclo
async function encontrarFechasEtapas(id_ciclo, stage) {
  const fechas = await obtenerFechasEtapas(id_ciclo, stage);
  if (!fechas) {
    return null; // Si no se encuentran las fechas del ciclo, devolvemos null
  }
  return { fechaInicio: fechas.start_date, fechaFin: fechas.end_date };
}

//Funcion para verificar si la fecha actual está dentro del rango de fechas de una etapa específica de un ciclo
async function estaDentroDeLaEtapa(id_ciclo, stage) {
  const fechas = await encontrarFechasEtapas(id_ciclo, stage);

  if (fechas === null) {
    return false; // Si no se encuentran las fechas del ciclo, devolvemos false
  }

  const ahora = new Date();
  const inicio = new Date(fechas.fechaInicio);
  const fin = new Date(fechas.fechaFin);



  return ahora >= inicio && ahora <= fin;
}



export { validarCiclo, estaDentroDeLaEtapa, encontrarFechasEtapas };