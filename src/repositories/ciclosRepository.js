import db from "../config/db.js";

// aca es la representacion de la tabla `cycles` del script SQL, tambien se revisa que no halla un sql injection

//aca se recibe los atributos para usarlos directo en la funcion en ves del objeto
async function crear({ name_cycle, max_members, id_person_charge }) {
//aca realizamos la insercion de datos en la bd
  const [resultado] = await db.query(
    "INSERT INTO cycles (name_cycle, max_members, id_person_charge) VALUES (?, ?, ?)",
    [name_cycle, max_members, id_person_charge]
  );
  return resultado.insertId;
}
// esta funcion realiza la actualizacion de datos en la bd
async function actualizar(id_cycle, { name_cycle, max_members, id_person_charge }) {
  await db.query(
    "UPDATE cycles SET name_cycle = ?, max_members = ?, id_person_charge = ? WHERE id_cycle = ?",
    [name_cycle, max_members, id_person_charge, id_cycle]
  );
}
//aca realizamos la busqueda de todo
async function listarTodos() {
  const [filas] = await db.query("SELECT * FROM cycles");
  return filas;
}
//aca realizamos la busqueda por llave primaria
async function buscarPorId(id_cycle) {
  const [filas] = await db.query("SELECT * FROM cycles WHERE id_cycle = ?", [id_cycle]);
  return filas[0];
}

// esta funcion obtiene las fechas de inicio y fin de una etapa específica de un ciclo
async function obtenerFechasEtapas(id_cycle, stage) {
  const [filas] = await db.query(
    "SELECT start_date, end_date FROM cycle_dates WHERE id_cycle = ? AND stage = ?",
    [id_cycle, stage]
  );
  return filas[0] ?? null;
}





export { crear, actualizar, listarTodos, buscarPorId, obtenerFechasEtapas };