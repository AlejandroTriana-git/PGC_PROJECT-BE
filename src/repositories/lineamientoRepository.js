import db from '../config/db.js';

//aca van las consultas de la tabla guideline_documents (lineamientos globales, sin id_cycle)

//esta funcion busca si ya existe un titulo igual (sin importar mayusculas ni espacios) y devuelve el titulo guardado
export const obtenerTituloExistente = async (title_file) => {
    const [filas] = await db.query(
        `SELECT title_file
           FROM guideline_documents
          WHERE LOWER(TRIM(title_file)) = LOWER(TRIM(?))
          LIMIT 1`,
        [title_file]
    );
    return filas.length > 0 ? filas[0].title_file : null;
};

//esta funcion revisa si ya existe esa version para ese titulo (la tabla no tiene indice unico, lo valida el backend)
export const existeVersion = async (title_file, version_label) => {
    const [filas] = await db.query(
        `SELECT 1
           FROM guideline_documents
          WHERE LOWER(TRIM(title_file)) = LOWER(TRIM(?))
            AND LOWER(TRIM(version_label)) = LOWER(TRIM(?))
          LIMIT 1`,
        [title_file, version_label]
    );
    return filas.length > 0;
};

//aca se inserta la nueva version del lineamiento
export const crear = async ({ title_file, desc_file, storage_path, version_label, uploaded_by }) => {
    const [resultado] = await db.query(
        `INSERT INTO guideline_documents (title_file, desc_file, storage_path, version_label, uploaded_by)
         VALUES (?, ?, ?, ?, ?)`,
        [title_file, desc_file, storage_path, version_label, uploaded_by]
    );
    return resultado.insertId;
};

//esta funcion trae una fila por cada titulo, siempre la version mas reciente
export const obtenerVigentes = async () => {
    const [filas] = await db.query(
        `SELECT id_guideline_document, title_file, desc_file, version_label, storage_path
           FROM (
                SELECT gd.*,
                       ROW_NUMBER() OVER (
                           PARTITION BY LOWER(TRIM(gd.title_file))
                           ORDER BY gd.uploaded_at DESC, gd.id_guideline_document DESC
                       ) AS rn
                  FROM guideline_documents gd
           ) t
          WHERE t.rn = 1
          ORDER BY t.title_file ASC`
    );
    return filas;
};

//esta funcion trae todas las versiones de un titulo (solo metadata, sin url)
export const obtenerHistorial = async (title_file) => {
    const [filas] = await db.query(
        `SELECT gd.version_label,
                DATE_FORMAT(gd.uploaded_at, '%Y-%m-%d %H:%i:%s') AS uploaded_at,
                u.full_name AS uploaded_by
           FROM guideline_documents gd
          INNER JOIN users u ON gd.uploaded_by = u.id_user
          WHERE LOWER(TRIM(gd.title_file)) = LOWER(TRIM(?))
          ORDER BY gd.uploaded_at DESC, gd.id_guideline_document DESC`,
        [title_file]
    );
    return filas;
};