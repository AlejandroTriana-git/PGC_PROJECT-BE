import { login as authLogin } from '../services/authService.js';
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

export { login };