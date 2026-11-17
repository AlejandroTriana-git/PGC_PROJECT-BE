import bucket from '../config/firebaseConfig.js';
import * as lineamientoRepository from '../repositories/lineamientoRepository.js';

//esta funcion arma el error con su status para que el controller sepa que codigo devolver
function crearError(mensaje, status) {
    const error = new Error(mensaje);
    error.status = status;
    return error;
}

//esta funcion deja el texto sin tildes ni caracteres raros para usarlo como nombre en firebase
function sanitizarParaPath(texto) {
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_.]/g, '_')
        .replace(/_+/g, '_');
}

//esta funcion genera la url firmada para ver el pdf, dura 1 hora
async function generarUrlFirmada(storage_path) {
    const [url] = await bucket.file(storage_path).getSignedUrl({
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000,
    });
    return { url, expira_en_segundos: 3600 };
}

//esta funcion borra un archivo de firebase, si falla no se lanza el error (best-effort)
async function borrarArchivoFirebase(storage_path) {
    try {
        await bucket.file(storage_path).delete();
    } catch (error) {
        console.error('No se pudo borrar lineamiento en Firebase:', storage_path, error.code);
    }
}

//aca se lista la version vigente de cada lineamiento con su url, mismo formato que las rubricas
async function listarVigentes() {
    const filas = await lineamientoRepository.obtenerVigentes();
    return Promise.all(
        filas.map(async (fila) => {
            //si falla la url de un documento no se cae toda la lista, ese sale sin url
            let enlace = { url: null, expira_en_segundos: 0 };
            try {
                enlace = await generarUrlFirmada(fila.storage_path);
            } catch (error) {
                console.error('Error generando URL de lineamiento', fila.id_guideline_document, error.message);
            }
            return {
                id_document: fila.id_guideline_document,
                title_file: fila.title_file,
                desc_file: fila.desc_file,
                version_label: fila.version_label,
                url: enlace.url,
                expira_en_segundos: enlace.expira_en_segundos,
            };
        })
    );
}

//aca se publica una version nueva (o un lineamiento nuevo), solo pdf
async function crearLineamiento(datos, id_usuario, archivo) {
    if (!archivo) throw crearError('El archivo PDF es obligatorio', 400);
    if (archivo.mimetype !== 'application/pdf') throw crearError('El archivo debe ser PDF', 400);

    const titulo = typeof datos.title_file === 'string' ? datos.title_file.trim() : '';
    //aca la version queda siempre como "V" + numero (ej. V1.1), igual que en las rubricas
    const numero_version = typeof datos.version_label === 'string' ? datos.version_label.trim().replace(/^v\s*/i, '') : '';
    if (numero_version && !/^\d+(\.\d+)*$/.test(numero_version)) {
        throw crearError('La versión debe ser un número, por ejemplo 1.0 o 2', 400);
    }
    const version = numero_version ? `V${numero_version}` : '';
    const descripcion = typeof datos.desc_file === 'string' && datos.desc_file.trim() !== '' ? datos.desc_file.trim() : null;

    if (!titulo) throw crearError('El title_file es obligatorio', 400);
    if (titulo.length > 150) throw crearError('El title_file no puede superar los 150 caracteres', 400);
    if (!version) throw crearError('El version_label es obligatorio', 400);
    if (version.length > 20) throw crearError('El version_label no puede superar los 20 caracteres', 400);

    //aca se usa el titulo que ya estaba guardado para que las versiones queden amarradas al mismo documento
    const title_file = (await lineamientoRepository.obtenerTituloExistente(titulo)) || titulo;

    //como la tabla no tiene indice unico, aca se evita repetir la misma version de un titulo
    if (await lineamientoRepository.existeVersion(title_file, version)) {
        throw crearError('Ya existe una versión con ese label para este documento.', 409);
    }

    //primero se sube a firebase y despues se guarda en la bd
    const storage_path = `lineamientos/${sanitizarParaPath(title_file)}_${sanitizarParaPath(version)}_${Date.now()}.pdf`;
    try {
        await bucket.file(storage_path).save(archivo.buffer, {
            metadata: { contentType: 'application/pdf' },
            public: false,
        });
    } catch (error) {
        console.error('❌ Error subiendo lineamiento a Firebase:', error.code, error.message);
        throw crearError('Error al subir el PDF. Intenta de nuevo.', 500);
    }

    try {
        await lineamientoRepository.crear({
            title_file,
            desc_file: descripcion,
            storage_path,
            version_label: version,
            uploaded_by: id_usuario,
        });
    } catch (error) {
        await borrarArchivoFirebase(storage_path); //si la bd falla no queda el archivo huerfano en firebase
        throw error;
    }
}

//aca se trae el historial de versiones de un lineamiento (solo metadata)
async function obtenerHistorial(title_file) {
    if (!title_file || !title_file.trim()) throw crearError('El título del documento es obligatorio', 400);
    return lineamientoRepository.obtenerHistorial(title_file);
}

export { listarVigentes, crearLineamiento, obtenerHistorial };