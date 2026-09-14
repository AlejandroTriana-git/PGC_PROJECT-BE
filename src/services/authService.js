import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { findByEmail } from '../repositories/authRepository.js';

dotenv.config();


const login = async (data) => {
    const usuario = await findByEmail(data.correo);

    if (!usuario) {
        throw { status: 404, mensaje: 'Correo electrónico no registrado' };
    }

    const contrasenaValida = await bcrypt.compare(data.contrasena, usuario.password_user);

    if (!contrasenaValida) {
        throw { status: 401, mensaje: 'Contraseña incorrecta' };
    }

    const rolTraducido = usuario.name_role;

    // Obtener el nombre real
    const nombreReal = usuario.name_student || usuario.mail_user;

    const token = jwt.sign(
        {
            id: usuario.id_user,
            correo: usuario.mail_user,
            rol: rolTraducido,
            nombre: nombreReal
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return {
        token: token,
        id: usuario.id_user,
        nombre: nombreReal,
        correo: usuario.mail_user,
        rol: rolTraducido,
        mensaje: 'Inicio de sesión exitoso'
    };
};

export { login };