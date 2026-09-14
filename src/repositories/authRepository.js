import db from '../config/db.js';

const findByEmail = async (correo) => {
    const [rows] = await db.query(
        'SELECT u.id_user, u.mail_user, u.password_user, u.id_rol, r.name_role, s.name_student FROM users u INNER JOIN rol r ON u.id_rol = r.id_rol LEFT JOIN students s ON u.id_user = s.id_user WHERE u.mail_user = ?',
        [correo]
    );
    return rows[0];
};

export { findByEmail };