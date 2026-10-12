import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import {encontrarPorEmail, tokenEstaEnListaNegra, guardarTokenEnListaNegra, eliminarTokensVencidos}  from '../repositories/authRepository.js';
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
      

    //aca se mete el id_cycle en el token para que el FE sepa el ciclo del estudiante (null si no es estudiante)
    const token = jwt.sign(
        {
            id: usuario.id_user,
            correo: usuario.mail_user,
            rol: usuario.name_role,
            nombre: usuario.full_name,
            id_cycle: usuario.id_cycle ?? null,
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
        id_cycle: usuario.id_cycle ?? null,
        encargado_de: encargado_de,
        jurado_de: jurado_de,
        mensaje: 'Inicio de sesión exitoso'
    };
};


//esta funcion cierra la sesion: mete el token en la lista negra para que no se pueda volver a usar
export const logout = async (token) => {
    //aca se verifica la firma pero se ignora si ya vencio, un token vencido igual cierra sesion bien
    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    } catch (error) {
        throw { status: 401, mensaje: 'Token inválido' };
    }

    //aca se limpian los tokens vencidos de la lista negra (si esto falla no se cae el logout)
    try {
        await eliminarTokensVencidos();
    } catch (error) {
        console.error('No se pudo limpiar la lista negra:', error.message);
    }

    //si el token ya vencio no hace falta guardarlo, ya no sirve para entrar
    const ahora = Math.floor(Date.now() / 1000);
    if (payload.exp > ahora) {
        //aca se busca primero porque la tabla no tiene UNIQUE en token y asi no se repite
        const ya_esta = await tokenEstaEnListaNegra(token);
        if (!ya_esta) {
            await guardarTokenEnListaNegra(payload.id, token, payload.exp);
        }
    }

    //siempre se responde igual, haya estado o no el token en la lista
    return { mensaje: 'Sesión cerrada correctamente' };
};