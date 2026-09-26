// scripts/test-firebase.js
import 'dotenv/config';          // carga las variables del .env
import crypto from 'node:crypto';
import bucket from '../src/config/firebaseConfig.js';

// Coloresss
const OK    = (msg) => console.log(`\x1b[32m✔\x1b[0m ${msg}`);
const FAIL  = (msg) => console.log(`\x1b[31m✘\x1b[0m ${msg}`);
const INFO  = (msg) => console.log(`\x1b[36mℹ\x1b[0m ${msg}`);
const LINE  = ()    => console.log('─'.repeat(60));

async function main() {
  LINE();
  console.log('  Test de credenciales Firebase Storage');
  LINE();

  // 1. Verificar variables de entorno mínimas
  INFO('1/5  Verificando variables de entorno...');
  if (!process.env.FIREBASE_STORAGE_BUCKET) {
    FAIL('Falta FIREBASE_STORAGE_BUCKET en el .env');
    process.exit(1);
  }
  OK(`Bucket configurado: ${process.env.FIREBASE_STORAGE_BUCKET}`);

  // 2. Probar subida
  INFO('2/5  Subiendo archivo de prueba...');
  const contenido = `Test ejecutado por ${process.env.USER || process.env.USERNAME || 'dev'} ` +
                    `el ${new Date().toISOString()}`;
  const token = crypto.randomBytes(4).toString('hex');
  const path = `_test/${Date.now()}-${token}.txt`;
  const fileRef = bucket.file(path);

  try {
    await fileRef.save(Buffer.from(contenido, 'utf-8'), {
      metadata: { contentType: 'text/plain' },
      public: false,
    });
    OK(`Archivo subido: ${path}`);
  } catch (err) {
    FAIL(`No se pudo subir: ${err.message}`);
    console.log('   → Revisa que tu archivo de credenciales exista y sea válido.');
    console.log(`   → code: ${err.code ?? 'N/A'}`);
    process.exit(1);
  }

  // 3. Verificar que el archivo existe en el bucket
  INFO('3/5  Verificando que el archivo existe...');
  try {
    const [exists] = await fileRef.exists();
    if (!exists) {
      FAIL('El archivo se subió pero no existe al consultarlo. Algo raro.');
      process.exit(1);
    }
    OK('El archivo existe en el bucket.');
  } catch (err) {
    FAIL(`Error consultando metadata: ${err.message}`);
    process.exit(1);
  }

  // 4. Generar URL firmada y descargar para verificar
  INFO('4/5  Generando URL firmada y probando descarga...');
  let signedUrl;
  try {
    [signedUrl] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 1000, // 1 minuto
    });
    OK(`URL firmada generada (primeros 60 chars): ${signedUrl.slice(0, 60)}...`);
  } catch (err) {
    FAIL(`No se pudo generar la URL firmada: ${err.message}`);
    console.log('   → La subida funcionó pero la firma falló.');
    console.log('   → Revisa que el service account tenga permisos de "Service Account Token Creator".');
    process.exit(1);
  }

  try {
    const res = await fetch(signedUrl);
    if (!res.ok) {
      FAIL(`La URL firmada devolvió HTTP ${res.status}`);
      process.exit(1);
    }
    const body = await res.text();
    if (body !== contenido) {
      FAIL('El contenido descargado NO coincide con el subido.');
      process.exit(1);
    }
    OK('La URL firmada descarga correctamente el archivo.');
  } catch (err) {
    FAIL(`Error descargando la URL firmada: ${err.message}`);
    process.exit(1);
  }

  // 5. Borrar el archivo de prueba
  INFO('5/5  Borrando archivo de prueba...');
  try {
    await fileRef.delete();
    OK('Archivo borrado correctamente.');
  } catch (err) {
    FAIL(`No se pudo borrar: ${err.message}`);
    console.log('   → El archivo queda en el bucket. Bórralo manualmente:');
    console.log(`   → ${path}`);
    process.exit(1);
  }

  LINE();
  console.log('\x1b[32m✔✔✔  Todo funciona. Tus credenciales están listas.\x1b[0m');
  LINE();
  process.exit(0);
}

main().catch((err) => {
  FAIL(`Error inesperado: ${err.message}`);
  console.error(err);
  process.exit(1);
});