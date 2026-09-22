import db from '../config/db.js';


// Función para encontrar asignaciones por ID de usuario, lo que se enviara al FE por medio del JWT
export const encontrarAsignacionesPorId = async (idUser) => {

    // Consulta para obtener las asignaciones donde el usuario es encargado
    const [encargadoRows] = await db.query(
        'SELECT id_cycle FROM cycles WHERE id_person_charge = ?',
        [idUser]
    );

    // Consulta para obtener las asignaciones donde el usuario es jurado
    const [juradoRows] = await db.query(
        'SELECT id_cycle FROM cycle_juror WHERE id_juror = ?',
        [idUser]
    );
    // Retornar un objeto con las asignaciones encontradas
    return {
        encargado_de: encargadoRows.map(row => row.id_cycle),
        jurado_de: juradoRows.map(row => row.id_cycle)
    };
};

//Funcion para verificar si el usuario dado es el encargado de un ciclo dado
//Esto se hace para tener mas seguridad, y no confiar unicamante en el JWT

export const esEncargadoDeCiclo = async ( idCycle, idUser) => {
    const [rows] = await db.query(
        'SELECT 1 FROM cycles WHERE id_cycle = ? AND id_person_charge = ?',
        [idCycle, idUser]
    );
    return rows.length > 0;
}


//Dada una propuesta, devuelve el id_cycle al que esta pertenece
export const obtenerCicloPropuesta = async (idProposal) => {
    const [rows] = await db.query(
        'SELECT id_cycle FROM proposals WHERE id_proposal = ?',
        [idProposal]
    );
    return rows.length > 0 ? rows[0].id_cycle : null;
}
// Función para asignar un jurado a un ciclo
export const asignarJurado = async (idCycle, idJuror) => {
    await db.query(
        'INSERT INTO cycle_juror (id_cycle, id_juror) VALUES (?, ?)',
        [idCycle, idJuror]
    );
}
// Función para quitar un jurado de un ciclo
export const quitarJurado = async (idCycle, idJuror) => {
    await db.query(
        'DELETE FROM cycle_juror WHERE id_cycle = ? AND id_juror = ?',
        [idCycle, idJuror]
    );
}

// Función para listar los jurados asignados a un ciclo
export const listarJuradosPorCiclo = async (idCycle) => {
    const [rows] = await db.query(
        'SELECT id_juror FROM cycle_juror WHERE id_cycle = ?',
        [idCycle]
    );
    return rows.map(row => row.id_juror);
}

// Función para verificar si un jurado ya está asignado a ese ciclo, evita duplicados
export const existeAsignacionJurado = async (idCycle, idJuror) => {
    const [rows] = await db.query(
        'SELECT 1 FROM cycle_juror WHERE id_cycle = ? AND id_juror = ?',
        [idCycle, idJuror]
    );
    return rows.length > 0;
};
