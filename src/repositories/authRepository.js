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

//aca se guarda el token en la lista negra cuando el usuario cierra sesion
export const agregarTokenListaNegra = async (id_user, token, expires_at) => {
    await db.query(
        'INSERT INTO blacklisted_tokens (id_user, token, expires_at) VALUES (?, ?, ?)',
        [id_user, token, expires_at]
    );
};

//esta funcion revisa si el token ya fue invalidado por un cierre de sesion
export const tokenEnListaNegra = async (token) => {
    const [rows] = await db.query(
        'SELECT 1 FROM blacklisted_tokens WHERE token = ? AND expires_at > NOW() LIMIT 1',
        [token]
    );
    return rows.length > 0;
};