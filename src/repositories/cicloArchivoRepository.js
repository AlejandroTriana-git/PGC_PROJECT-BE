import db from '../config/db.js';

/**
 * Busca un title_file existente en el mismo ciclo+tipo
 * comparando case-insensitive y trim. Devuelve el título canónico
 * (el que ya está guardado) o null si no existe.
 */
export const obtenerTituloExistente = async (idCiclo, docType, titleFile) => {
    const [rows] = await db.query(
        `SELECT title_file
           FROM cycle_documents
          WHERE id_cycle = ?
            AND doc_type = ?
            AND LOWER(TRIM(title_file)) = LOWER(TRIM(?))
          LIMIT 1`,
        [idCiclo, docType, titleFile]
    );
    return rows.length > 0 ? rows[0].title_file : null;
};

/**
 * Inserta un nuevo documento (lineamiento o rúbrica).
 * Acepta una conexión activa para poder participar de una transacción.
 */
export const crearDocumento = async (
    { idCiclo, idUsuario, docType, titleFile, descFile, versionLabel, storagePath },
    connection
) => {
    const conn = connection || db;
    await conn.query(
        `INSERT INTO cycle_documents
            (id_cycle, uploaded_by, doc_type, title_file, desc_file, version_label, storage_path)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [idCiclo, idUsuario, docType, titleFile, descFile, versionLabel, storagePath]
    );
    
};



/**
 * Devuelve una fila por cada title_file distinto del ciclo+tipo,
 * tomando siempre la versión más reciente (por uploaded_at, desempate por id).
 */
export const obtenerDocumentosVigentes = async (idCiclo, tipoDocumento) => {
    const [rows] = await db.query(
        `SELECT id_cycle_document,
                title_file,
                desc_file,
                version_label,
                storage_path
           FROM (
                SELECT cd.*,
                       ROW_NUMBER() OVER (
                           PARTITION BY LOWER(TRIM(cd.title_file))
                           ORDER BY cd.uploaded_at DESC, cd.id_cycle_document DESC
                       ) AS rn
                  FROM cycle_documents cd
                 WHERE cd.id_cycle = ?
                   AND cd.doc_type = ?
           ) t
          WHERE t.rn = 1
          ORDER BY t.title_file ASC`,
        [idCiclo, tipoDocumento]
    );
    return rows;
};


export const obtenerHistorialDocumentosCiclo = async (idCiclo, titleFile, tipoDocumento) => {
    const [rows] = await db.query(
        `SELECT version_label,
            DATE_FORMAT(uploaded_at, '%Y-%m-%d %H:%i:%s') AS uploaded_at,
            u.full_name AS uploaded_by
        FROM cycle_documents cd
        INNER JOIN users u ON cd.uploaded_by = u.id_user
        WHERE id_cycle = ?
        AND doc_type = ?
        AND LOWER(TRIM(title_file)) = LOWER(TRIM(?))
        ORDER BY uploaded_at DESC, id_cycle_document DESC`,
        [idCiclo, tipoDocumento, titleFile]
    );
    return rows;
}


//----------- lineamientos globales (tabla guideline_documents, no dependen de ningun ciclo) -----------

//esta funcion busca si ya hay un lineamiento con ese titulo (sin importar mayusculas ni espacios de los lados)
//devuelve el titulo como ya esta guardado o null si no existe, asi un error de tipeo no crea un documento duplicado
export const obtenerTituloLineamientoExistente = async (title_file) => {
    const [rows] = await db.query(
        `SELECT title_file
         FROM guideline_documents
         WHERE LOWER(TRIM(title_file)) = LOWER(TRIM(?))
         LIMIT 1`,
        [title_file]
    );
    return rows.length > 0 ? rows[0].title_file : null;
};

//esta funcion revisa si ya existe esa version para ese lineamiento, la tabla no tiene UNIQUE asi que se revisa aca
export const existeVersionLineamiento = async (title_file, version_label) => {
    const [rows] = await db.query(
        `SELECT 1
         FROM guideline_documents
         WHERE LOWER(TRIM(title_file)) = LOWER(TRIM(?))
         AND LOWER(TRIM(version_label)) = LOWER(TRIM(?))
         LIMIT 1`,
        [title_file, version_label]
    );
    return rows.length > 0;
};

//esta funcion guarda el lineamiento, sirve para uno nuevo y para una version nueva de uno que ya existe
export const crearLineamiento = async ({ title_file, desc_file, version_label, storage_path, uploaded_by }) => {
    await db.query(
        `INSERT INTO guideline_documents (title_file, desc_file, version_label, storage_path, uploaded_by)
         VALUES (?, ?, ?, ?, ?)`,
        [title_file, desc_file, version_label, storage_path, uploaded_by]
    );
};

//esta funcion trae una fila por cada title_file, siempre la version mas reciente (por uploaded_at, y por id si empatan)
export const obtenerLineamientosVigentes = async () => {
    const [rows] = await db.query(
        `SELECT id_guideline_document, title_file, desc_file, version_label, storage_path
         FROM (
             SELECT gd.*,
                    ROW_NUMBER() OVER (
                        PARTITION BY LOWER(TRIM(gd.title_file))
                        ORDER BY gd.uploaded_at DESC, gd.id_guideline_document DESC
                    ) AS posicion
             FROM guideline_documents gd
         ) t
         WHERE t.posicion = 1
         ORDER BY t.title_file ASC`
    );
    return rows;
};

//esta funcion trae todas las versiones de un lineamiento, de la mas nueva a la mas vieja, con el nombre de quien la subio
//no se trae storage_path a proposito, el FE no lo necesita
export const obtenerHistorialLineamiento = async (title_file) => {
    const [rows] = await db.query(
        `SELECT gd.version_label,
                DATE_FORMAT(gd.uploaded_at, '%Y-%m-%d %H:%i:%s') AS uploaded_at,
                u.full_name AS uploaded_by
         FROM guideline_documents gd
         INNER JOIN users u ON gd.uploaded_by = u.id_user
         WHERE LOWER(TRIM(gd.title_file)) = LOWER(TRIM(?))
         ORDER BY gd.uploaded_at DESC, gd.id_guideline_document DESC`,
        [title_file]
    );
    return rows;
};