import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { findByEmail } from '../repositories/authRepository.js';

dotenv.config();

const login = async (data) => {
    // 1. Buscar usuario
    const usuario = await findByEmail(data.correo);

    if (!usuario) {
        throw { status: 404, mensaje: 'Correo electrónico no registrado' };
    }

    // 2. Comprobar contraseña
    const contrasenaValida = await bcrypt.compare(data.contrasena, usuario.password_user);

    if (!contrasenaValida) {
        throw { status: 401, mensaje: 'Contraseña incorrecta' };
    }

    // 3. Generar token
    const token = jwt.sign(
        {
            id: usuario.id_user,
            correo: usuario.mail_user,
            rol: usuario.name_role.toLowerCase(),
            nombre: usuario.mail_user
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // 4. Devolver información
    return {
        token,
        rol: usuario.name_role.toLowerCase(),
        mensaje: 'Inicio de sesión exitoso'
    };
};

export { login };