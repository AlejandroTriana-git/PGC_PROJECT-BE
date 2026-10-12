//valores permitidos para el filtro de estado (columna pgc.state_pgc)
export const ESTADOS_PGC = ["En Proceso", "Terminado"];

//cuantos resultados se devuelven por pagina (HU-04 dice 15)
export const RESULTADOS_POR_PAGINA = 15;

//esta funcion lee un parametro de la url y dice si el filtro viene o no viene
//un filtro vacio (?q=&estado=) cuenta como "sin filtro", asi lo manda el formulario del FE
//devuelve undefined si no hay filtro, el texto limpio si lo hay, o null si llega raro (ej. ?q=a&q=b)
function leerFiltro(valor) {
  //si el parametro no esta en la url, no hay filtro
  if (valor === undefined) return undefined;
  //si no es texto (por ejemplo llego repetido y express lo vuelve arreglo) se marca como raro
  if (typeof valor !== "string") return null;
  //aca se quitan los espacios, si despues no queda nada tampoco hay filtro
  const texto_limpio = valor.trim();
  return texto_limpio === "" ? undefined : texto_limpio;
}

//entero positivo de hasta 9 digitos, asi no llegan numeros gigantes al OFFSET
const ES_ENTERO_POSITIVO = /^[1-9]\d{0,8}$/;

//esta funcion valida los parametros del buscador antes de tocar la bd
export function validarBusquedaPgc(query) {
  const errores = [];
  //aca se lee cada parametro con la misma funcion de arriba
  const q = leerFiltro(query.q);
  const categoria = leerFiltro(query.categoria);
  const ciclo = leerFiltro(query.ciclo);
  const estado = leerFiltro(query.estado);
  const pagina = leerFiltro(query.pagina);

  //q es texto libre, solo se rechaza si llega repetido
  if (q === null) errores.push("q debe ser un solo texto");
  //categoria y ciclo tienen que ser un solo id numerico
  if (categoria === null || (categoria !== undefined && !ES_ENTERO_POSITIVO.test(categoria))) {
    errores.push("categoria debe ser un id numérico");
  }
  if (ciclo === null || (ciclo !== undefined && !ES_ENTERO_POSITIVO.test(ciclo))) {
    errores.push("ciclo debe ser un id numérico");
  }
  //estado solo puede ser uno de los dos valores que existen en la bd
  if (estado === null || (estado !== undefined && !ESTADOS_PGC.includes(estado))) {
    errores.push(`estado debe ser uno de: ${ESTADOS_PGC.join(", ")}`);
  }
  //pagina tiene que ser un entero mayor a 0
  if (pagina === null || (pagina !== undefined && !ES_ENTERO_POSITIVO.test(pagina))) {
    errores.push("pagina debe ser un entero mayor a 0");
  }
  return errores;
}

//esta funcion pasa los parametros ya validados a los nombres y tipos que usa el repository
//(categoria -> id_category, ciclo -> id_cycle, estado -> state_pgc) y si no viene pagina usa la 1
export function normalizarFiltrosBusquedaPgc(query) {
  const q = leerFiltro(query.q);
  const categoria = leerFiltro(query.categoria);
  const ciclo = leerFiltro(query.ciclo);
  const estado = leerFiltro(query.estado);
  const pagina = leerFiltro(query.pagina);

  return {
    q,
    id_category: categoria === undefined ? undefined : Number(categoria),
    id_cycle: ciclo === undefined ? undefined : Number(ciclo),
    state_pgc: estado,
    pagina: pagina === undefined ? 1 : Number(pagina),
  };
}