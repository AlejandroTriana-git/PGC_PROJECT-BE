import * as propuestaService from '../services/propuestaService.js';

const crearPropuesta = async (req, res) => {
    try {
        // DIAGNÓSTICO
        console.log('=================================');
        console.log('BODY RECIBIDO:', JSON.stringify(req.body, null, 2));
        console.log('USUARIO DEL TOKEN:', req.usuario);
        console.log('=================================');

        // 1. Obtener el id_user del token
        const id_user = req.usuario.id;

        // 2. Llamar al servicio
        const result = await propuestaService.crearPropuesta(req.body, id_user);

        // 3. Responder
        res.status(201).json(result);
    } catch (error) {
        console.error('ERROR CREAR PROPUESTA:', error);
        res.status(error.status || 500).json({
            mensaje: error.mensaje || 'Error interno del servidor'
        });
    }
};

export { crearPropuesta };