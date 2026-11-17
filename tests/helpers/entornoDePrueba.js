// ============================================================
// Entorno de prueba: se importa de PRIMERO en los tests que levantan rutas reales.
//
// Hace 3 cosas para que los tests corran en cualquier maquina (tambien en
// GitHub Actions) sin MySQL, sin Firebase y sin archivo .env:
//   1. Define las variables de entorno que el codigo necesita (JWT).
//   2. Reemplaza src/config/db.js por la base de datos falsa en memoria.
//   3. Reemplaza src/config/firebaseConfig.js por un "bucket" falso, porque el
//      archivo real lanza error al cargar si no hay credenciales de Firebase.
// ============================================================
import { randomBytes } from 'node:crypto';
import { jest } from '@jest/globals';
import dbFalsa from './dbFalsa.js';

// Clave JWT aleatoria en cada ejecucion: no se escribe ningun secreto en el codigo
process.env.JWT_SECRET = randomBytes(32).toString('hex');
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

jest.unstable_mockModule('../../src/config/db.js', () => ({ default: dbFalsa }));

// Bucket falso de Firebase Storage (solo lo minimo que usan los servicios)
const bucketFalso = {
  file: () => ({
    save: async () => {},
    delete: async () => {},
    getSignedUrl: async () => ['https://storage.falso/archivo.pdf'],
    exists: async () => [true],
  }),
};
jest.unstable_mockModule('../../src/config/firebaseConfig.js', () => ({ default: bucketFalso }));
