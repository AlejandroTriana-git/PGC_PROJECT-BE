import * as cicloArchivoRepository from '../repositories/cicloArchivoRepository.js';
import db from '../config/db.js';
import  bucket  from '../config/firebaseConfig.js'; 
import * as cicloRepository from '../repositories/ciclosRepository.js' ;


// Constante para el tipo de documento, tiene que ser igual al ENUM de cycle_documents.doc_type (con tilde)
// los lineamientos ya no van aca, ahora estan en guideline_documents (ver lineamientoService.js)
const DOC_TYPE_RUBRICA = 'Rúbrica';
const TIPOS_PERMITIDOS = [DOC_TYPE_RUBRICA];

// ---------- Helpers ----------

const validarPDF = (file) => {
    if (!file) {
        throw { status: 400, mensaje: 'El archivo PDF es obligatorio' };
    }
    if (file.mimetype !== 'application/pdf') {
        throw { status: 400, mensaje: 'El archivo debe ser PDF' };
    }
};

const normalizarTitleFile = (titleFile) => {
    if (!titleFile || typeof titleFile !== 'string' || titleFile.trim() === '') {
        throw { status: 400, mensaje: 'El title_file es obligatorio' };
    }
    return titleFile.trim();
};

//aca se deja la version siempre como "V" + numero (ej. V2.0), el FE ya manda la V fija pero se asegura aca tambien
const normalizarVersionLabel = (versionLabel) => {
    if (!versionLabel || typeof versionLabel !== 'string' || versionLabel.trim() === '') {
        throw { status: 400, mensaje: 'El version_label es obligatorio' };
    }
    const numero = versionLabel.trim().replace(/^v\s*/i, '');
    if (!/^\d+(\.\d+)*$/.test(numero)) {
        throw { status: 400, mensaje: 'La versión debe ser un número, por ejemplo 1.0 o 2' };
    }
    const version = `V${numero}`;
    if (version.length > 20) {
        throw { status: 400, mensaje: 'El version_label no puede superar los 20 caracteres' };
    }
    return version;
};

// Sanitiza un string para usarlo como nombre de archivo en Storage
const sanitizarParaPath = (str) =>
    str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // quita tildes
        .replace(/[^a-zA-Z0-9-_]/g, '_') // reemplaza caracteres raros
        .replace(/_+/g, '_');

// ---------- Firebase ----------

const subirArchivoFirebase = async (path, file) => {
    const fileRef = bucket.file(path);
    try {
        await fileRef.save(file.buffer, {
            metadata: { contentType: 'application/pdf' },
            public: false,
        });
        return fileRef;
    } catch (error) {
        console.error('❌ Error subiendo a Firebase:');
        console.error('   code:', error.code);
        console.error('   message:', error.message);
        console.error('   path:', path);
        throw { status: 500, mensaje: 'Error al subir el PDF. Intenta de nuevo.' };
    }
};

const borrarArchivoFirebase = async (path) => {
    if (!path) return;
    try {
        await bucket.file(path).delete();
    } catch (error) {
        console.error('No se pudo borrar archivo en Firebase:', path, error.code);
        // best-effort, no relanzamos
    }
};

async function generarUrlFirmada(storage_path) {
  const [url] = await bucket.file(storage_path).getSignedUrl({
    action: "read",
    expires: Date.now() + 60 * 60 * 1000, // 1 hora
  });
  return { url, expira_en_segundos: 3600 };
}
// ---------- Endpoint: crear documentos, sea rubrica o lineamiento ----------


//Este se reutiliza para crear tanto lineamientos como rubricas, dependiendo del docType que se le pase
const crearDocumento = async (docType, datos, idUsuario, idCiclo, archivo) => {
    // 0) Validar ciclo
    const ciclo = await cicloRepository.buscarPorId(idCiclo);
    if (!ciclo) throw { status: 404, mensaje: 'Ciclo no encontrado' };

    // 1) Validaciones
    validarPDF(archivo);
    const titleFileRaw = normalizarTitleFile(datos.title_file);
    const versionLabel = normalizarVersionLabel(datos.version_label);
    const descFile = datos.desc_file ? datos.desc_file.trim() : null;

    // 2) Normalizar contra título canónico
    const tituloExistente = await cicloArchivoRepository.obtenerTituloExistente(
        idCiclo, docType, titleFileRaw
    );
    const titleFile = tituloExistente || titleFileRaw;

    // 3) Subir a Firebase
    const path = `ciclos/${idCiclo}/documentos/${docType.toLowerCase()}/${sanitizarParaPath(titleFile)}_${versionLabel}_${Date.now()}.pdf`;
    await subirArchivoFirebase(path, archivo);

    // 4) Insertar
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await cicloArchivoRepository.crearDocumento(
            { idCiclo, idUsuario, docType, titleFile, descFile, versionLabel, storagePath: path },
            connection
        );
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        await borrarArchivoFirebase(path);
        if (error.code === 'ER_DUP_ENTRY') {
            throw { status: 409, mensaje: 'Ya existe una versión con ese label para este documento.' };
        }
        throw error;
    } finally {
        connection.release();
    }
};


// --- Wrappers por caso de uso ---
export const crearRubrica = (datos, idUsuario, idCiclo, archivo) =>
    crearDocumento(DOC_TYPE_RUBRICA, datos, idUsuario, idCiclo, archivo);



// ---------- Endpoint: obtener documentos vigentes de un ciclo ----------
export const obtenerDocumentosCiclo = async (idCiclo, tipoDocumento) => {
    // 0) Validar que el ciclo exista
    const ciclo = await cicloRepository.buscarPorId(idCiclo);
    if (!ciclo) {
        throw { status: 404, mensaje: 'Ciclo no encontrado' };
    }
    //si no llega tipo se toma rubrica, que es el unico tipo que guarda esta tabla
    tipoDocumento = tipoDocumento || DOC_TYPE_RUBRICA;
    if (!TIPOS_PERMITIDOS.includes(tipoDocumento)) {
        throw { status: 400, mensaje: 'El parámetro "tipo" debe ser "Rúbrica".' };
    }

    const documentos = await cicloArchivoRepository.obtenerDocumentosVigentes(idCiclo, tipoDocumento);
    
    // Colección vacía → [] (nunca null). Aplica para ambos tipos.
    if (!documentos || documentos.length === 0) {
       
        return []; //coleccion vacia siempre como [] (nunca null)
    }
    

    // Adjuntar URL firmada a cada uno, en paralelo
    const conUrl = await Promise.all(
        documentos.map(async (doc) => {
            //si falla la url de un documento no se cae toda la lista, ese sale sin url (igual que lineamientos)
            let url = null;
            let expira_en_segundos = 0;
            try {
                ({ url, expira_en_segundos } = await generarUrlFirmada(doc.storage_path));
            } catch (error) {
                console.error('Error generando URL de rubrica', doc.id_cycle_document, error.message);
            }
            return {
                id_document: doc.id_cycle_document,
                title_file: doc.title_file,
                desc_file: doc.desc_file,
                version_label: doc.version_label,
                url,
                expira_en_segundos,
                // No exponemos storage_path crudo: el FE solo necesita la url
            };
        })
    );

    return conUrl;
};



// ---------- Endpoint: obtener historial de versiones de un documento puntual ----------
export const obtenerHistoriaDocumentosCiclo = async (idCiclo, titleFile, tipoDocumento) => {
    // 0) Validar que el ciclo exista
    const ciclo = await cicloRepository.buscarPorId(idCiclo);
    if (!ciclo) {
        throw { status: 404, mensaje: 'Ciclo no encontrado' };
    }

    tipoDocumento = tipoDocumento || DOC_TYPE_RUBRICA;
    if (!TIPOS_PERMITIDOS.includes(tipoDocumento)) {
        throw { status: 400, mensaje: 'El parámetro "tipo" debe ser "Rúbrica".' };
    }

    if (!titleFile){
        throw { status: 400, mensaje: 'El parámetro "title_file" es obligatorio.' };
    }

    const historial = await cicloArchivoRepository.obtenerHistorialDocumentosCiclo(idCiclo, titleFile, tipoDocumento);

    if (!historial || historial.length === 0) {
        return [];
    }
    return historial
}