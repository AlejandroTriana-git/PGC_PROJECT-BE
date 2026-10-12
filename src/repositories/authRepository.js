import db from '../config/db.js';

export const encontrarPorEmail = async (correo) => {
    const [rows] = await db.query(
        //aca se trae tambien el ciclo del estudiante con LEFT JOIN, si el usuario no es estudiante id_cycle queda null
        `SELECT u.id_user, u.mail_user, u.password_user, u.id_rol, u.full_name, r.name_role, s.id_cycle
            FROM users u 
            INNER JOIN rol r ON u.id_rol = r.id_rol
            LEFT JOIN students s ON s.id_user = u.id_user
            WHERE u.mail_user = ?`,
        [correo]
    );
    return rows[0];
};


//esta funcion busca si un token ya esta en la lista negra, devuelve true o false
export const tokenEstaEnListaNegra = async (token) => {
    const [rows] = await db.query(
        `SELECT 1 FROM blacklisted_tokens WHERE token = ? LIMIT 1`,
        [token]
    );
    return rows.length > 0;
};

//esta funcion mete el token en la lista negra, expires_at llega en segundos (el exp del jwt) y la BD lo pasa a fecha
export const guardarTokenEnListaNegra = async (id_user, token, exp) => {
    await db.query(
        `INSERT INTO blacklisted_tokens (id_user, token, expires_at) VALUES (?, ?, FROM_UNIXTIME(?))`,
        [id_user, token, exp]
    );
};

//esta funcion borra de la lista negra los tokens que ya vencieron (ya no sirven ni con firma valida)
export const eliminarTokensVencidos = async () => {
    const [resultado] = await db.query(
        `DELETE FROM blacklisted_tokens WHERE expires_at < NOW()`
    );
    return resultado.affectedRows;
};