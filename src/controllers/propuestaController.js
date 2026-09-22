import * as propuestaService from '../services/propuestaService.js';


// Controlador para crear una propuesta
const crearPropuesta = async (req, res) => {
    try {
        const id_user = req.usuario.id;        
        //Envio de datos a la capa de servicio para crear la propuesta
        const result = await propuestaService.crearPropuesta(req.body, id_user, req.file);//Se añade el file
        res.status(201).json(result);
    } catch (error) {
        console.error('ERROR CREAR PROPUESTA:', error);
        res.status(error.status || 500).json({
            mensaje: error.mensaje || 'Error interno del servidor'
        });
    }
};

const reenviarPropuesta = async (req, res) => {
    try {
        const id_proposal = req.params.id;
        const id_user = req.usuario.id;
        const result = await propuestaService.reenviarPropuesta(id_proposal, req.body, id_user, req.file);
        res.status(200).json(result);
    } catch (error) {
        console.error('ERROR REENVIAR PROPUESTA:', error);
        res.status(error.status || 500).json({
            mensaje: error.mensaje || 'Error interno del servidor'
        });
    }
};


// Controlador para obtener la URL de visualización del PDF de una propuesta
export const verPdfPropuesta = async (req, res) => {
  try {
    const { idProposal } = req.params;
    const resultado = await propuestaService.obtenerUrlPdf(idProposal);
    res.status(200).json(resultado);
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ mensaje: error.mensaje || 'Error interno' });
  }
};

export { crearPropuesta, reenviarPropuesta };