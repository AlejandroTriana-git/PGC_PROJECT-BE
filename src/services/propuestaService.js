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
    if (!pdf || !pdf.endsWith('.pdf')) {
        throw { status: 400, mensaje: 'El archivo debe ser PDF' };
    }
};

// Crear propuesta
export const crearPropuesta = async (data, id_user) => {
    // 1. Validar campos obligatorios
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

    // 4. Validar que el líder no tenga propuesta activa en el ciclo
    const propuestaActiva = await propuestaRepository.buscarPropuestaActiva(lider.id_student, data.id_cycle);
    if (propuestaActiva) {
        throw { status: 400, mensaje: 'El líder ya tiene una propuesta activa en este ciclo' };
    }

    // 5. Validar que la cantidad de integrantes no supere el máximo del ciclo
    if (data.integrantes.length > ciclo.max_members) {
        throw { status: 400, mensaje: `El máximo de integrantes es ${ciclo.max_members}` };
    }

    // 6. Crear la propuesta
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

    // 8. Validar e insertar a los demás integrantes
    for (const id_integrante of data.integrantes) {

        // 8.1. Validación 1: Que sea estudiante (exista en la tabla students)
        const integrante = await propuestaRepository.buscarEstudiantePorId(id_integrante);
        if (!integrante) {
            throw { status: 404, mensaje: `El integrante ${id_integrante} no existe` };
        }

        // 8.2. Validación 2: Que pertenezca al mismo ciclo
        if (integrante.id_cycle !== data.id_cycle) {
            throw { status: 400, mensaje: `El integrante ${id_integrante} no pertenece al mismo ciclo` };
        }

        // 8.3. Validación 3: Que no tenga propuesta activa en el mismo ciclo
        const propuestaActivaIntegrante = await propuestaRepository.buscarPropuestaActiva(integrante.id_student, data.id_cycle);
        if (propuestaActivaIntegrante) {
            throw { status: 400, mensaje: `El integrante ${id_integrante} ya tiene una propuesta activa en este ciclo` };
        }

        // 8.4. Insertar al integrante en proposal_students
        await propuestaRepository.insertarIntegrante(id_proposal, integrante.id_student);
    }

    return { id_proposal, mensaje: 'Propuesta radicada exitosamente' };
};

// Reenviar propuesta
export const reenviarPropuesta = async (id_proposal, data, id_user) => {
    // 1. Validar campos
    validarCampos(data);
    validarPDF(data.pdf_format_url);

    // 2. Buscar la propuesta
    const propuesta = await propuestaRepository.buscarPropuestaPorId(id_proposal);
    if (!propuesta) {
        throw { status: 404, mensaje: 'Propuesta no encontrada' };
    }

    // 3. Verificar que esté rechazada
    if (propuesta.state_proposal !== 'Rechazada') {
        throw { status: 400, mensaje: 'Solo se pueden reenviar propuestas rechazadas' };
    }

    // 4. Verificar que el usuario sea el líder
    const lider = await propuestaRepository.buscarEstudiantePorId(id_user);
    if (!lider || lider.id_student !== propuesta.id_leader) {
        throw { status: 403, mensaje: 'Solo el líder puede reenviar la propuesta' };
    }

    // 5. Reenviar
    await propuestaRepository.reenviarPropuesta(id_proposal, data);

    return { mensaje: 'Propuesta reenviada exitosamente' };
};