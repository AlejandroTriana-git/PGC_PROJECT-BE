import * as cicloArchivoService from '../services/cicloArchivoService.js';

export const crearLineamiento = async (req, res) => {
    try {
        const idUsuario = req.usuario.id;
        const idCiclo = req.params.id;
        await cicloArchivoService.crearLineamiento(
            req.body,
            idUsuario,
            idCiclo,
            req.file
        );
        res.status(201).json({
            mensaje: 'Lineamiento creado exitosamente'
        });
    } catch (error) {
        console.error('ERROR CREAR LINEAMIENTO:', error);
        res.status(error.status || 500).json({
            mensaje: error.mensaje || 'Error interno del servidor',
        });
    }
};

//Función para obtener los docuemntos vigentes de un ciclo, filtrando por tipo de documento (lineamiento o rubrica)
export const obtenerDocumentosCiclo = async (req, res) => { 
    

    try {
        
        const idCiclo = req.params.id;
        const tipoDocumento = req.query.tipo; // 'Lineamiento' o 'Rubrica'
        const documentos = await cicloArchivoService.obtenerDocumentosCiclo(idCiclo, tipoDocumento);
        res.status(200).json(documentos);


    }catch (error) {
        console.error('ERROR OBTENER DOCUMENTOS CICLO:', error);
        res.status(error.status || 500).json({
            mensaje: error.mensaje || 'Error interno del servidor',
        });
    }


};

//Obtener el historial de versiones de un documento puntual (lineamiento o rubrica) de un ciclo
export const obtenerHistoriaDocumentosCiclo = async (req, res) => { 

    try {
        const idCiclo = req.params.id;
        const titleFile = req.params.title_file;
        const tipoDocumento = req.query.tipo; // 'Lineamiento' o 'Rubrica'
        const historial = await cicloArchivoService.obtenerHistoriaDocumentosCiclo(idCiclo, titleFile, tipoDocumento);
        
        res.status(200).json(historial);
        
    }catch (error) {
        console.error('ERROR OBTENER HISTORIAL DOCUMENTOS CICLO:', error);
        res.status(error.status || 500).json({
            mensaje: error.mensaje || 'Error interno del servidor',
        });
    }

 };