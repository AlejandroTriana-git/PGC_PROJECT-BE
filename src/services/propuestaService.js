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
    // 1. Validar campos
    validarCampos(data);
    validarPDF(data.pdf_format_url);

    // 2. Buscar estudiante líder
    const lider = await propuestaRepository.buscarEstudiantePorId(id_user);
    if (!lider) {
        throw { status: 404, mensaje: 'El líder no es estudiante' };
    }

    // 3. Buscar ciclo
    const ciclo = await propuestaRepository.buscarCicloPorId(data.id_cycle);
    if (!ciclo) {
        throw { status: 404, mensaje: 'El ciclo no existe' };
    }

    // 4. Validar que el líder no tenga propuesta activa
    const propuestaActiva = await propuestaRepository.buscarPropuestaActiva(lider.id_student, data.id_cycle);
    if (propuestaActiva) {
        throw { status: 400, mensaje: 'El líder ya tiene una propuesta activa en este ciclo' };
    }

    // 5. Validar integrantes
    if (data.integrantes.length > ciclo.max_members) {
        throw { status: 400, mensaje: `El máximo de integrantes es ${ciclo.max_members}` };
    }

    // 6. Crear propuesta
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

    // 7. Insertar al líder en proposal_students
    await propuestaRepository.insertarIntegrante(id_proposal, lider.id_student);

    // 8. Insertar a los demás integrantes
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