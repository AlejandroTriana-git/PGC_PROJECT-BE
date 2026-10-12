import { login as authLogin, logout as authLogout } from '../services/authService.js';
import validarLogin from '../validators/loginValidator.js';

const login = async (req, res) => {
    try {
        const error = validarLogin(req.body);
        if (error) {
            return res.status(400).json(error);
        }

        const result = await authLogin(req.body);

        res.status(200).json(result);
    } catch (error) {
        console.error('ERROR REAL:', error);
        res.status(error.status || 500).json({
            mensaje: error.mensaje || 'Error interno del servidor',
            errorReal: error.message || error.toString()
        });
    }
};

//esta funcion cierra la sesion, lee el token del header Authorization y lo manda al service
const logout = async (req, res) => {
    try {
        const auth_header = req.headers.authorization;
        //si no viene el header o no tiene el formato Bearer, 401
        if (!auth_header || !auth_header.startsWith('Bearer ')) {
            return res.status(401).json({ mensaje: 'Token no proporcionado' });
        }
        const token = auth_header.split(' ')[1];
        const result = await authLogout(token);
        res.status(200).json(result);
    } catch (error) {
        //aca no se devuelve el error real, solo se deja en consola
        console.error('Error al cerrar sesión:', error);
        res.status(error.status || 500).json({
            mensaje: error.mensaje || 'Error interno del servidor'
        });
    }
};

export { login, logout };