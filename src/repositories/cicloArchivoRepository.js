import db from '../config/db.js';


//esta funcion busca si ya existe un titulo igual en ese ciclo y tipo (sin importar mayusculas ni espacios)
//y devuelve el titulo guardado, asi las versiones nuevas quedan amarradas al mismo documento
export const obtenerTituloExistente = async (idCiclo, docType, titleFile) => {
    const [filas] = await db.query(
        `SELECT title_file
           FROM cycle_documents
          WHERE id_cycle = ?
            AND doc_type = ?
            AND LOWER(TRIM(title_file)) = LOWER(TRIM(?))
          LIMIT 1`,
        [idCiclo, docType, titleFile]
    );
    return filas.length > 0 ? filas[0].title_file : null;
};

//aca se inserta la nueva version del documento, recibe la conexion porque el service la usa dentro de una transaccion
export const crearDocumento = async (
    { idCiclo, idUsuario, docType, titleFile, descFile, versionLabel, storagePath },
    connection = db
) => {
    const [resultado] = await connection.query(
        `INSERT INTO cycle_documents (id_cycle, storage_path, doc_type, version_label, uploaded_by, title_file, desc_file)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [idCiclo, storagePath, docType, versionLabel, idUsuario, titleFile, descFile]
    );
    return resultado.insertId;
};

//esta funcion trae una fila por cada titulo del ciclo, siempre la version mas reciente
export const obtenerDocumentosVigentes = async (idCiclo, docType) => {
    const [filas] = await db.query(
        `SELECT id_cycle_document, title_file, desc_file, version_label, storage_path
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
        [idCiclo, docType]
    );
    return filas;
};

//esta funcion trae todas las versiones de un titulo del ciclo (solo metadata, sin url), igual que lineamientos
export const obtenerHistorialDocumentosCiclo = async (idCiclo, titleFile, docType) => {
    const [filas] = await db.query(
        `SELECT cd.version_label,
                DATE_FORMAT(cd.uploaded_at, '%Y-%m-%d %H:%i:%s') AS uploaded_at,
                u.full_name AS uploaded_by
           FROM cycle_documents cd
          INNER JOIN users u ON cd.uploaded_by = u.id_user
          WHERE cd.id_cycle = ?
            AND cd.doc_type = ?
            AND LOWER(TRIM(cd.title_file)) = LOWER(TRIM(?))
          ORDER BY cd.uploaded_at DESC, cd.id_cycle_document DESC`,
        [idCiclo, docType, titleFile]
    );
    return filas;
};