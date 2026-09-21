import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import {encontrarPorEmail}  from '../repositories/authRepository.js';
import {encontrarAsignacionesPorId} from '../repositories/asignacionesRepository.js';
dotenv.config();


export const login = async (data) => {
    const usuario = await encontrarPorEmail(data.correo);

    if (!usuario) {
        throw { status: 404, mensaje: 'Correo electrónico no registrado' };
    }

    const contrasenaValida = await bcrypt.compare(data.contrasena, usuario.password_user);

    if (!contrasenaValida) {
        throw { status: 401, mensaje: 'Contraseña incorrecta' };
    }

    const {encargado_de, jurado_de} = await encontrarAsignacionesPorId(usuario.id_user);
      

    const token = jwt.sign(
        {
            id: usuario.id_user,
            correo: usuario.mail_user,
            rol: usuario.name_role,
            nombre: usuario.full_name,
            encargado_de: encargado_de,
            jurado_de: jurado_de
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return {
        token: token,
        id: usuario.id_user,
        nombre: usuario.full_name,
        correo: usuario.mail_user,
        rol: usuario.name_role,
        encargado_de: encargado_de,
        jurado_de: jurado_de,
        mensaje: 'Inicio de sesión exitoso'
    };
};

