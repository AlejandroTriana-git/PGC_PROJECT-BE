import * as cicloArchivoRepository from '../repositories/cicloArchivoRepository.js';
import db from '../config/db.js';
import  bucket  from '../config/firebaseConfig.js'; 
import * as cicloRepository from '../repositories/ciclosRepository.js' ;
const DOC_TYPE_LINEAMIENTO = 'Lineamiento';

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

const normalizarVersionLabel = (versionLabel) => {
    if (!versionLabel || typeof versionLabel !== 'string' || versionLabel.trim() === '') {
        throw { status: 400, mensaje: 'El version_label es obligatorio' };
    }
    return versionLabel.trim();
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
// ---------- Endpoint: crear lineamiento ----------

export const crearLineamiento = async (datos, idUsuario, idCiclo, archivo) => {
    // 0) Validar que el ciclo exista
    const ciclo = await cicloRepository.buscarPorId(idCiclo);
    if (!ciclo) {
        throw { status: 404, mensaje: 'Ciclo no encontrado' };
    }
    // 1) Validaciones de entrada
    validarPDF(archivo);
    const titleFileRaw = normalizarTitleFile(datos.title_file);
    const versionLabel = normalizarVersionLabel(datos.version_label);
    const descFile = datos.desc_file ? datos.desc_file.trim() : null;
    const docType = DOC_TYPE_LINEAMIENTO;

    // 2) Segunda capa: normalizar contra títulos existentes del mismo ciclo+tipo
    const tituloExistente = await cicloArchivoRepository.obtenerTituloExistente(
        idCiclo,
        docType,
        titleFileRaw
    );
    const titleFile = tituloExistente || titleFileRaw;

    // 3) Subir a Firebase
    const path = `ciclos/${idCiclo}/documentos/${docType.toLowerCase()}/${sanitizarParaPath(titleFile)}_${versionLabel}_${Date.now()}.pdf`;
    await subirArchivoFirebase(path, archivo);

    // 4) Insertar en BD con transacción
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await cicloArchivoRepository.crearDocumento(
            {
                idCiclo,
                idUsuario,
                docType,
                titleFile,
                descFile,
                versionLabel,
                storagePath: path,
            },
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
// ---------- Endpoint: obtener documentos vigentes de un ciclo ----------
export const obtenerDocumentosCiclo = async (idCiclo, tipoDocumento) => {
    // 0) Validar que el ciclo exista
    const ciclo = await cicloRepository.buscarPorId(idCiclo);
    if (!ciclo) {
        throw { status: 404, mensaje: 'Ciclo no encontrado' };
    }
    // Si no llega tipo, podríamos rechazar o devolver todo. La issue pide filtrar.
    if (!tipoDocumento || !['Lineamiento', 'Rubrica'].includes(tipoDocumento)) {
        throw { status: 400, mensaje: 'El parámetro "tipo" debe ser "Lineamiento" o "Rubrica".' };
    }

    const documentos = await cicloArchivoRepository.obtenerDocumentosVigentes(idCiclo, tipoDocumento);
    
    // Colección vacía → [] (nunca null). Aplica para ambos tipos.
    if (!documentos || documentos.length === 0) {
       
        return tipoDocumento === 'Rubrica' ? null : [];
    }
    

    // Adjuntar URL firmada a cada uno, en paralelo
    const conUrl = await Promise.all(
        documentos.map(async (doc) => {
            const { url, expira_en_segundos } = await generarUrlFirmada(doc.storage_path);
            return {
                id_document: doc.id_document,
                title_file: doc.title_file,
                desc_file: doc.desc_file,
                version_label: doc.version_label,
                uploaded_at: doc.uploaded_at,
                uploaded_by: doc.uploaded_by,
                url,
                expira_en_segundos,
                // No exponemos storage_path crudo: el FE solo necesita la url
            };
        })
    );

    return conUrl;
};




export const obtenerHistoriaDocumentosCiclo = async (idCiclo, titleFile, tipoDocumento) => {
    // 0) Validar que el ciclo exista
    const ciclo = await cicloRepository.buscarPorId(idCiclo);
    if (!ciclo) {
        throw { status: 404, mensaje: 'Ciclo no encontrado' };
    }

    if (!tipoDocumento || !['Lineamiento', 'Rubrica'].includes(tipoDocumento)) {
        throw { status: 400, mensaje: 'El parámetro "tipo" debe ser "Lineamiento" o "Rubrica".' };
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
