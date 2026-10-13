import * as cicloArchivoRepository from '../repositories/cicloArchivoRepository.js';
import db from '../config/db.js';
import  bucket  from '../config/firebaseConfig.js'; 
import * as cicloRepository from '../repositories/ciclosRepository.js' ;


// Constantes para los tipos de documentos
//aca ya no hay tipo lineamiento porque los lineamientos son globales y viven en guideline_documents
//el tipo de la rubrica va con tilde porque asi esta en el ENUM de cycle_documents
const DOC_TYPE_RUBRICA = 'Rúbrica';

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

//esta funcion pasa el tipo que manda el FE al valor que tiene la bd, acepta "Rúbrica" y "Rubrica", si es otro devuelve null
const normalizarTipoDocumento = (tipo) =>
    ['Rúbrica', 'Rubrica'].includes(tipo) ? DOC_TYPE_RUBRICA : null;

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
    const path = `ciclos/${idCiclo}/documentos/${sanitizarParaPath(docType.toLowerCase())}/${sanitizarParaPath(titleFile)}_${versionLabel}_${Date.now()}.pdf`;
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
    // Si no llega tipo, podríamos rechazar o devolver todo. La issue pide filtrar.
    //aca el tipo llega como "Rúbrica" (o "Rubrica" sin tilde) y se pasa al valor que tiene la bd, los lineamientos ya no son por ciclo
    const tipo_normalizado = normalizarTipoDocumento(tipoDocumento);
    if (!tipo_normalizado) {
        throw { status: 400, mensaje: 'El parámetro "tipo" debe ser "Rúbrica".' };
    }

    const documentos = await cicloArchivoRepository.obtenerDocumentosVigentes(idCiclo, tipo_normalizado);
    
    // Colección vacía → [] (nunca null). Aplica para ambos tipos.
    if (!documentos || documentos.length === 0) {
       
        return tipo_normalizado === DOC_TYPE_RUBRICA ? null : [];
    }
    

    // Adjuntar URL firmada a cada uno, en paralelo
    const conUrl = await Promise.all(
        documentos.map(async (doc) => {
            const { url, expira_en_segundos } = await generarUrlFirmada(doc.storage_path);
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

    //aca se hace lo mismo con el tipo
    const tipo_normalizado = normalizarTipoDocumento(tipoDocumento);
    if (!tipo_normalizado) {
        throw { status: 400, mensaje: 'El parámetro "tipo" debe ser "Rúbrica".' };
    }

    if (!titleFile){
        throw { status: 400, mensaje: 'El parámetro "title_file" es obligatorio.' };
    }

    const historial = await cicloArchivoRepository.obtenerHistorialDocumentosCiclo(idCiclo, titleFile, tipo_normalizado);

    if (!historial || historial.length === 0) {
        return [];
    }
    return historial
}


// ---------- Lineamientos globales (no dependen de ningun ciclo) ----------

//limites que salen de la tabla guideline_documents: title_file es VARCHAR(150) y version_label es VARCHAR(20)
const MAX_TITULO = 150;
const MAX_VERSION = 20;

//esta funcion crea un lineamiento: sirve para agregar uno nuevo y para subir una version nueva de uno que ya existe
export const crearLineamiento = async (datos, idUsuario, archivo) => {
    //primero se validan los datos que llegaron
    validarPDF(archivo);
    //aca el titulo se deja sin espacios de mas (los de los lados y los repetidos del medio)
    const titulo_recibido = normalizarTitleFile(datos.title_file).replace(/\s+/g, ' ');
    const version_label = normalizarVersionLabel(datos.version_label);
    const desc_file = typeof datos.desc_file === 'string' && datos.desc_file.trim() !== '' ? datos.desc_file.trim() : null;

    //aca se revisa que no pasen el largo de las columnas
    if (titulo_recibido.length > MAX_TITULO) {
        throw { status: 400, mensaje: `El title_file no puede superar los ${MAX_TITULO} caracteres` };
    }
    if (version_label.length > MAX_VERSION) {
        throw { status: 400, mensaje: `El version_label no puede superar los ${MAX_VERSION} caracteres` };
    }

    //si ya hay un lineamiento con ese titulo (aunque cambie mayusculas o espacios) se usa el titulo que ya esta guardado
    const titulo_existente = await cicloArchivoRepository.obtenerTituloLineamientoExistente(titulo_recibido);
    const title_file = titulo_existente || titulo_recibido;

    //la misma version del mismo lineamiento no se puede subir dos veces
    if (await cicloArchivoRepository.existeVersionLineamiento(title_file, version_label)) {
        throw { status: 409, mensaje: 'Ya existe una versión con ese label para este documento.' };
    }

    //primero se sube a firebase y despues se guarda en la bd
    const storage_path = `lineamientos/${sanitizarParaPath(title_file)}_${sanitizarParaPath(version_label)}_${Date.now()}.pdf`;
    await subirArchivoFirebase(storage_path, archivo);

    try {
        await cicloArchivoRepository.crearLineamiento({
            title_file,
            desc_file,
            version_label,
            storage_path,
            uploaded_by: idUsuario,
        });
    } catch (error) {
        await borrarArchivoFirebase(storage_path); // si la BD falla no queda un archivo huerfano en Firebase
        throw error;
    }
};

//esta funcion lista la version vigente de cada lineamiento con su url firmada, si no hay ninguno devuelve [] (nunca null)
export const obtenerLineamientos = async () => {
    const filas = await cicloArchivoRepository.obtenerLineamientosVigentes();
    return Promise.all(
        filas.map(async (fila) => {
            //si falla la url de uno no se cae toda la lista, ese sale con url en null
            let archivo = { url: null, expira_en_segundos: null };
            try {
                archivo = await generarUrlFirmada(fila.storage_path);
            } catch (error) {
                console.error('Error generando URL firmada para lineamiento', fila.id_guideline_document, error.message);
            }
            //id_guideline_document sale como id_document y no se muestra storage_path
            return {
                id_document: fila.id_guideline_document,
                title_file: fila.title_file,
                desc_file: fila.desc_file,
                version_label: fila.version_label,
                url: archivo.url,
                expira_en_segundos: archivo.expira_en_segundos,
            };
        })
    );
};

//esta funcion devuelve todas las versiones de un lineamiento, si no existe devuelve []
export const obtenerHistoriaLineamiento = async (titleFile) => {
    if (!titleFile || titleFile.trim() === '') {
        throw { status: 400, mensaje: 'El parámetro "title_file" es obligatorio.' };
    }
    return cicloArchivoRepository.obtenerHistorialLineamiento(titleFile);
};