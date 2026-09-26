
# Firebase Storage — Guía para archivos de PGC

Última actualización: 2026-09-25
Responsable: [ALEJANDRO TRIANA]

## Contexto

El proyecto ya usa Firebase Storage para el PDF de propuestas (formato PGC del HU-01).
Para los issues de PGC (HU-02, HU-03) reutilizamos **el mismo bucket y el mismo proyecto Firebase**, solo cambia la "carpeta" (path).

No se crea proyecto ni bucket nuevo.

## Infraestructura

- **Proyecto Firebase:** [proyecto-storage-archivos]
- **Bucket:** `proyecto-storage-4ece8.firebasestorage.app`
- **Visibility de objetos:** `public: false` (todo acceso mediante URL firmada)

## Estructura de paths

Los "paths" de Storage son strings, no carpetas reales. Convención del equipo:

| Recurso | Path |
|---|---|
| PDF de propuesta (HU-01) | `propuestas/{id_cycle}/{id_student}/formato-pgc-{timestamp}.pdf` |
| Archivo de PGC (HU-03) | `pgc/{id_cycle}/{id_student}/{id_pgc}/{timestamp}-{slug_nombre}` |

Reglas:
- Usar **siempre** un `{timestamp}` (o `uuid`) antes del nombre del archivo → evita colisiones si dos personas suben "titulo.pdf".
- No usar `{title_file}` crudo como nombre final. Se sanitiza a "slug" (minúsculas, sin espacios, sin caracteres raros).
- Nunca reutilizar un path. Si se reemplaza un archivo, se sube con un path nuevo y se borra el viejo al final.

## Cómo subir un archivo

Ejemplo en Node.js (mismo patrón que ya usa `propuestaService.subirArchivoFirebase`):

```js
import bucket from '../config/firebaseConfig.js';

export async function subirArchivo(path, buffer, mimetype) {
  const fileRef = bucket.file(path);
  await fileRef.save(buffer, {
    metadata: { contentType: mimetype },
    public: false,
  });
  return path;
}
```

Por lo que para entender bien el proceso que se hace ne FIREBASE, miren el archivo completo, funciones importantes:subirArchivoFirebase, borrarArchivoFirebase, crearPropuesta,obtenerUrlPdf

## A tener en cuenta
Recordar que en el PGC, se peuden subir cualquier tipo de archivo (no solo PDF), por lo que deben mirar lo que mando Jospeh y verificar que tipos son.

Adiconal los tamaños permitidos.

## CREAR MEET CUANDO NECESITEN PROBAR, PARA AYUDARLES A CREAR LAS CRDENCIALES FIREBASE

Antes de empezar a codear cualquier cosa que use Firebase Storage, **cada desarrollador debe**:

1. Obtener sus propias credenciales **(LLAMARME)**.
2. Configurar el `.env` local.
3. Correr el script de verificación `scripts/test-firebase.js`.
4. Confirmar que los 5 pasos dan verde.

Si el script falla, **no empiecen a codear** — mándenme el error y lo resolvemos primero.

---

### Paso 2 — Configurar el `.env` local

En la raíz del proyecto, crear el archivo `.env` (si no existe):


# Copiar la plantilla
cp .env.example .env

**VERIFICAR QUE EN EL GITIGNORE ESTE ESE ARCHIVO .env y el JSON**
---

### Paso 3 — Instalacion de dependencias

npm install dotenv

y 
```js
{
  "scripts": {
    "test:firebase": "node scripts/test-firebase.js"
  }
}
```
Correr:

npm run test:firebase

**RESULTADO ESPERADO**
────────────────────────────────────────────────────────────
  Test de credenciales Firebase Storage
────────────────────────────────────────────────────────────
ℹ 1/5  Verificando variables de entorno...
✔ Bucket configurado: proyecto-storage-archivos.appspot.com
ℹ 2/5  Subiendo archivo de prueba...
✔ Archivo subido: _test/1727234567890-a1b2c3d4.txt
ℹ 3/5  Verificando que el archivo existe...
✔ El archivo existe en el bucket.
ℹ 4/5  Generando URL firmada y probando descarga...
✔ URL firmada generada (primeros 60 chars): https://storage.googleapis.com/...
✔ La URL firmada descarga correctamente el archivo.
ℹ 5/5  Borrando archivo de prueba...
✔ Archivo borrado correctamente.
────────────────────────────────────────────────────────────
✔✔✔  Todo funciona. Tus credenciales están listas.
────────────────────────────────────────────────────────────