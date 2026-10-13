import * as cicloArchivoService from '../services/cicloArchivoService.js';


//esta funcion crea un lineamiento global (ya no va por ciclo), o una version nueva de uno que ya existe
export const crearLineamiento = async (req, res) => {
    try {
        const idUsuario = req.usuario.id;
        //req.body || {} por si llega sin body
        await cicloArchivoService.crearLineamiento(
            req.body || {},
            idUsuario,
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

//Función para crear un nuevo archivo de tipo rubrica de ciclo
export const crearRubrica = async (req, res) => {
    try {
        const idUsuario = req.usuario.id;
        const idCiclo = req.params.id;
        await cicloArchivoService.crearRubrica(
            req.body,
            idUsuario,
            idCiclo,
            req.file
        );
        res.status(201).json({
            mensaje: 'Rubrica creada exitosamente'
        });
    } catch (error) {
        console.error('ERROR CREAR RUBRICA:', error);
        res.status(error.status || 500).json({
            mensaje: error.mensaje || 'Error interno del servidor',
        });
    }
};
//Función para obtener los docuemntos vigentes de un ciclo, filtrando por tipo de documento (rubrica)
export const obtenerDocumentosCiclo = async (req, res) => { 
    

    try {
        
        const idCiclo = req.params.id;
        const tipoDocumento = req.query.tipo; // 'Rúbrica'
        const documentos = await cicloArchivoService.obtenerDocumentosCiclo(idCiclo, tipoDocumento);
        res.status(200).json(documentos);


    }catch (error) {
        console.error('ERROR OBTENER DOCUMENTOS CICLO:', error);
        res.status(error.status || 500).json({
            mensaje: error.mensaje || 'Error interno del servidor',
        });
    }


};

//Obtener el historial de versiones de un documento puntual (rubrica) de un ciclo
export const obtenerHistoriaDocumentosCiclo = async (req, res) => { 

    try {
        const idCiclo = req.params.id;
        const titleFile = req.params.title_file;
        const tipoDocumento = req.query.tipo; // 'Rúbrica'
        const historial = await cicloArchivoService.obtenerHistoriaDocumentosCiclo(idCiclo, titleFile, tipoDocumento);
        
        res.status(200).json(historial);
        
    }catch (error) {
        console.error('ERROR OBTENER HISTORIAL DOCUMENTOS CICLO:', error);
        res.status(error.status || 500).json({
            mensaje: error.mensaje || 'Error interno del servidor',
        });
    }

 };

//GET /api/lineamientos
//esta funcion devuelve la version vigente de cada lineamiento global
export const obtenerLineamientos = async (req, res) => {
    try {
        const lineamientos = await cicloArchivoService.obtenerLineamientos();
        res.status(200).json(lineamientos);
    } catch (error) {
        console.error('ERROR OBTENER LINEAMIENTOS:', error);
        res.status(error.status || 500).json({
            mensaje: error.mensaje || 'Error interno del servidor',
        });
    }
};

//GET /api/lineamientos/:title_file/historial
//esta funcion devuelve todas las versiones de un lineamiento global
export const obtenerHistoriaLineamiento = async (req, res) => {
    try {
        const historial = await cicloArchivoService.obtenerHistoriaLineamiento(req.params.title_file);
        res.status(200).json(historial);
    } catch (error) {
        console.error('ERROR OBTENER HISTORIAL LINEAMIENTO:', error);
        res.status(error.status || 500).json({
            mensaje: error.mensaje || 'Error interno del servidor',
        });
    }
};