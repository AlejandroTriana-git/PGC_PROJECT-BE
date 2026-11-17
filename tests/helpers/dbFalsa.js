// ============================================================
// Base de datos FALSA para las pruebas de rutas (supertest).
//
// Antes estos tests hacían login contra la BD real (Railway) y hasta
// escribían datos reales. Aca se reemplaza db.js por un objeto con la misma
// forma (query / execute / getConnection) pero que responde desde memoria.
//
// Funciona como un "router de SQL": cada regla tiene un patron (regex) que
// se compara con el texto del SQL y una funcion que devuelve las filas.
// Si ninguna regla coincide, un SELECT devuelve [] y un INSERT/UPDATE/DELETE
// devuelve { affectedRows: 1, insertId: 1 }.
// ============================================================
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';

// Usuarios de prueba. NO hay contraseñas escritas en el codigo: se generan al azar cada vez que
// corren los tests (asi SonarCloud no detecta credenciales dentro del repositorio).
// Los tests leen estos mismos valores desde "usuariosPrueba" para hacer login.
const generarContrasena = () => randomBytes(18).toString('base64url');

export const usuariosPrueba = {
  estudiante: { id_user: 1, correo: 'estudiante@example.com', contrasena: generarContrasena(), id_rol: 1, full_name: 'Estudiante Prueba', name_role: 'Estudiante', id_cycle: 1 },
  profesor: { id_user: 2, correo: 'profesor@example.com', contrasena: generarContrasena(), id_rol: 2, full_name: 'Profesor Prueba', name_role: 'Profesor', id_cycle: null },
  administrador: { id_user: 3, correo: 'admin@example.com', contrasena: generarContrasena(), id_rol: 3, full_name: 'Administrador Prueba', name_role: 'Administrador', id_cycle: null },
};

// Filas tal como las devolveria la tabla users. La contraseña se guarda hasheada, igual que en la
// BD real, para que authService.login use bcrypt.compare de verdad (costo 4 = rapido en tests).
const usuarios = Object.values(usuariosPrueba).map((u) => ({
  id_user: u.id_user,
  mail_user: u.correo,
  password_user: bcrypt.hashSync(u.contrasena, 4),
  id_rol: u.id_rol,
  full_name: u.full_name,
  name_role: u.name_role,
  id_cycle: u.id_cycle,
}));

const fechaEtapa = (etapa) => ({
  stage: etapa,
  start_date: new Date('2026-01-01T00:00:00'),
  end_date: new Date('2026-12-31T23:59:59'),
});

// Cada regla: [patron del SQL, (params, sql) => filas]
export const reglas = [
  // --- login / sesion ---
  [/FROM users u\s+INNER JOIN rol r ON u\.id_rol = r\.id_rol\s+LEFT JOIN students s[\s\S]*WHERE u\.mail_user = \?/i,
    (p) => usuarios.filter((u) => u.mail_user === p[0])],
  [/FROM blacklisted_tokens/i, () => []],            // ningun token esta en la lista negra
  [/SELECT id_cycle FROM cycles WHERE id_person_charge/i, (p) => (p[0] === 2 ? [{ id_cycle: 1 }] : [])],
  [/SELECT id_cycle FROM cycle_juror WHERE id_juror/i, (p) => (p[0] === 2 ? [{ id_cycle: 1 }] : [])],

  // --- catalogos ---
  [/FROM categories/i, () => [{ id_category: 1, name_category: 'Software' }]],
  [/WHERE r\.name_role = 'Profesor'/i, () => [{ id: 2, nombre: 'O. Morera' }]],

  // --- estudiantes ---
  [/FROM students s\s+INNER JOIN users u ON s\.id_user = u\.id_user\s+WHERE s\.id_cycle = \? AND s\.id_student != \?/i,
    () => [{ id_student: 2, id_user: 4, full_name: 'Otro Estudiante', mail_user: 'otro@example.com' }]],
  [/FROM students WHERE id_user/i, () => [{ id_student: 1, id_cycle: 1 }]],

  // --- procedimientos almacenados (CALL sp_...) ---
  // El repositorio hace dos consultas seguidas: el CALL (devuelve los result sets)
  // y luego un SELECT de las variables OUT (@codigo, @mensaje, @total).
  [/SELECT @total AS total, @codigo AS codigo, @mensaje AS mensaje/i, () => [{ total: 1, codigo: 1, mensaje: 'OK' }]],
  [/SELECT @codigo AS codigo, @mensaje AS mensaje/i, () => [{ codigo: 1, mensaje: 'OK' }]],
  [/CALL sp_buscar_pgc/i, () => [
    [{ id_pgc: 1, id_proposal: 1, title_proposal: 'Sistema de inventario', state_pgc: 'Terminado', name_cycle: 'Fundamentación' }],
    [{ id_proposal: 1, id_category: 1, name_category: 'Software' }],
  ]],
  [/CALL sp_obtener_pgc_por_id/i, () => [
    [{ id_pgc: 1, id_proposal: 1, id_pgc_previous: null, title_proposal: 'Sistema de inventario', state_pgc: 'Terminado', name_cycle: 'Fundamentación' }],
    [{ id_category: 1, name_category: 'Software' }],
    [{ id_user: 1, full_name: 'David Gonzalez' }],
  ]],
  [/CALL sp_ver_mi_propuesta/i, () => [
    [{ id_proposal: 1, title_proposal: 'Sistema de inventario', state_proposal: 'Pendiente de validación', pdf_storage_path: null }],
    [{ id_user: 1, full_name: 'David Gonzalez' }],
    [{ id_category: 1, name_category: 'Software' }],
  ]],

  // --- ciclos ---
  [/FROM cycles/i, () => [{ id_cycle: 1, subject_cycle: 'Fundamentación', max_members: 3, id_person_charge: 2, id_encargado: 2 }]],
  [/FROM cycle_dates|FROM cycle_stages|FROM stage_dates/i, () => [fechaEtapa('Radicación'), fechaEtapa('Registro PGC'), fechaEtapa('Calificación')]],
];

// Quita espacios repetidos para que los patrones no dependan de la indentacion del SQL
const normalizar = (sql) => String(sql).replace(/\s+/g, ' ').trim();

export const consultar = async (sql, params = []) => {
  const texto = normalizar(sql);
  for (const [patron, respuesta] of reglas) {
    if (patron.test(texto) || patron.test(String(sql))) return [respuesta(params, texto)];
  }
  // Sin regla: los SELECT devuelven lista vacia y lo demas "afecta" 1 fila
  return /^\s*SELECT/i.test(texto) ? [[]] : [{ affectedRows: 1, insertId: 1 }];
};

const conexion = {
  query: consultar,
  execute: consultar,
  beginTransaction: async () => {},
  commit: async () => {},
  rollback: async () => {},
  release: () => {},
};

const dbFalsa = {
  query: consultar,
  execute: consultar,
  getConnection: async () => conexion,
};

export default dbFalsa;
