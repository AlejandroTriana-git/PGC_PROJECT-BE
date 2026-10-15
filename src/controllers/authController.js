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

//POST /api/auth/logout
//aca se cierra la sesion, el token que llega en el header queda invalidado
const logout = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const result = await authLogout(req.usuario, token);
        res.status(200).json(result);
    } catch (error) {
        console.error('ERROR LOGOUT:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

export { login, logout };