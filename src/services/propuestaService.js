import * as propuestaRepository from '../repositories/propuestaRepository.js';

// Validar campos obligatorios
const validarCampos = (data) => {
    const campos = ['title_proposal', 'descr_proposal', 'problem_proposal', 'justification_proposal', 'objectives_proposal', 'solution_proposal', 'pdf_format_url', 'id_cycle', 'integrantes'];
    for (const campo of campos) {
        if (!data[campo]) {
            throw { status: 400, mensaje: `El campo ${campo} es obligatorio` };
        }
    }
};

// Validar PDF
const validarPDF = (pdf) => {
    if (!pdf.endsWith('.pdf')) {
        throw { status: 400, mensaje: 'El archivo debe ser PDF' };
    }
};

// Crear propuesta
export const crearPropuesta = async (data, id_user) => {
    validarCampos(data);
    validarPDF(data.pdf_format_url);

    const lider = await propuestaRepository.buscarEstudiantePorId(id_user);
    if (!lider) {
        throw { status: 404, mensaje: 'El líder no es estudiante' };
    }

    const ciclo = await propuestaRepository.buscarCicloPorId(data.id_cycle);
    if (!ciclo) {
        throw { status: 404, mensaje: 'El ciclo no existe' };
    }

    const propuestaActiva = await propuestaRepository.buscarPropuestaActiva(lider.id_student, data.id_cycle);
    if (propuestaActiva) {
        throw { status: 400, mensaje: 'El líder ya tiene una propuesta activa en este ciclo' };
    }

    if (data.integrantes.length > ciclo.max_members) {
        throw { status: 400, mensaje: `El máximo de integrantes es ${ciclo.max_members}` };
    }

    const id_proposal = await propuestaRepository.crearPropuesta({
        id_leader: lider.id_student,
        id_cycle: data.id_cycle,
        title_proposal: data.title_proposal,
        descr_proposal: data.descr_proposal,
        problem_proposal: data.problem_proposal,
        justification_proposal: data.justification_proposal,
        objectives_proposal: data.objectives_proposal,
        solution_proposal: data.solution_proposal,
        pdf_format_url: data.pdf_format_url
    });

    await propuestaRepository.insertarIntegrante(id_proposal, lider.id_student);

    for (const id_integrante of data.integrantes) {
        const integrante = await propuestaRepository.buscarEstudiantePorId(id_integrante);
        if (!integrante) {
            throw { status: 404, mensaje: `El integrante ${id_integrante} no existe` };
        }
        if (integrante.id_cycle !== data.id_cycle) {
            throw { status: 400, mensaje: `El integrante ${id_integrante} no pertenece al mismo ciclo` };
        }
        await propuestaRepository.insertarIntegrante(id_proposal, integrante.id_student);
    }

    return { id_proposal, mensaje: 'Propuesta radicada exitosamente' };
};

// Reenviar propuesta
export const reenviarPropuesta = async (id_proposal, data, id_user) => {
    validarCampos(data);
    validarPDF(data.pdf_format_url);

    const propuesta = await propuestaRepository.buscarPropuestaPorId(id_proposal);
    if (!propuesta) {
        throw { status: 404, mensaje: 'Propuesta no encontrada' };
    }

    if (propuesta.state_proposal !== 'Rechazada') {
        throw { status: 400, mensaje: 'Solo se pueden reenviar propuestas rechazadas' };
    }

    const lider = await propuestaRepository.buscarEstudiantePorId(id_user);
    if (!lider || lider.id_student !== propuesta.id_leader) {
        throw { status: 403, mensaje: 'Solo el líder puede reenviar la propuesta' };
    }

    await propuestaRepository.reenviarPropuesta(id_proposal, data);

    return { mensaje: 'Propuesta reenviada exitosamente' };
};