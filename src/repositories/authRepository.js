import db from '../config/db.js';

export const encontrarPorEmail = async (correo) => {
    const [rows] = await db.query(
        `SELECT u.id_user, u.mail_user, u.password_user, u.id_rol, u.full_name, r.name_role
            FROM users u 
            INNER JOIN rol r ON u.id_rol = r.id_rol WHERE u.mail_user = ?`,
        [correo]
    );
    return rows[0];
};

