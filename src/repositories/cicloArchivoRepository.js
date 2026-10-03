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
                storage_path,
                uploaded_at,
                uploaded_by
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