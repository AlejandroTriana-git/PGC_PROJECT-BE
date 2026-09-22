import db from '../config/db.js';
import bucket from '../config/firebaseConfig.js';
import * as propuestaRepository from '../repositories/propuestaRepository.js';
import * as cyclesRepository from "../repositories/ciclosRepository.js";

// Validar campos obligatorios
// NOTA: id_cycle ya no se recibe del FE — se obtiene internamente del líder en la BD
const validarCampos = (data) => {
    const campos = ['title_proposal', 'descr_proposal', 'problem_proposal', 'justification_proposal', 'objectives_proposal', 'solution_proposal', 'integrantes'];
    for (const campo of campos) {
        if (!data[campo]) {
            throw { status: 400, mensaje: `El campo ${campo} es obligatorio` };
        }
    }
};

// Validar PDF
const validarPDF = (file) => {
  if (!file) {
    throw { status: 400, mensaje: 'El archivo PDF es obligatorio' };
  }
  if (file.mimetype !== 'application/pdf') {
    throw { status: 400, mensaje: 'El archivo debe ser PDF' };
  }
};

// Subir archivo a Firebase Storage
const subirArchivoFirebase = async (path, file) => {
    const fileRef = bucket.file(path);
    try {
        await fileRef.save(file.buffer, {
            metadata: { contentType: 'application/pdf' },
            public: false,
        });
        return fileRef;
    } catch (error) {
        // Debug: log útil sin exponerlo al cliente
        console.error('❌ Error subiendo a Firebase:');
        console.error('   code:', error.code);
        console.error('   message:', error.message);
        console.error('   path:', path);
        throw { status: 500, mensaje: 'Error al subir el PDF. Intenta de nuevo.' };
    }
};

// Borrar archivo de Firebase Storage(Cuando ya se ha rechazado la propuesta y se sube un nuevo PDF, se borra el anterior)
const borrarArchivoFirebase = async (path) => {
    if (!path) return;
    try {
        await bucket.file(path).delete();
    } catch (error) {
        console.error(' No se pudo borrar archivo en Firebase:', path, error.code);
        // No relanzar: es best-effort
    }
};
// Crear propuesta (con transacción)
export const crearPropuesta = async (data, id_user, file) => {
    // Si llega como String, lo convertimos a Array de JavaScript
    if (typeof data.integrantes === 'string') {
        data.integrantes = JSON.parse(data.integrantes);
    }

    // 👇 CAMBIO: normalizar integrantes a Number ANTES de cualquier uso
    data.integrantes = data.integrantes.map(Number);

    validarCampos(data);
    validarPDF(file);

    const lider = await propuestaRepository.buscarEstudiantePorId(id_user);
    if (!lider) {
        throw { status: 404, mensaje: 'El líder no es estudiante' };
    }

    // 👇 CAMBIO: el ciclo sale SIEMPRE del líder, nunca del FE
    const id_cycle = Number(lider.id_cycle);

    const ciclo = await propuestaRepository.buscarCicloPorId(id_cycle);
    if (!ciclo) {
        throw { status: 404, mensaje: 'El ciclo no existe' };
    }

    const propuestaActiva = await propuestaRepository.buscarPropuestaActiva(lider.id_student, id_cycle);
    if (propuestaActiva) {
        throw { status: 400, mensaje: 'El líder ya tiene una propuesta activa en este ciclo' };
    }

    console.log("Integrantes recibidos:", data.integrantes.length);
    console.log("Máximo de integrantes permitido:", ciclo.max_members);

    if (data.integrantes.length > ciclo.max_members) {
        throw { status: 400, mensaje: `El máximo de integrantes es ${ciclo.max_members}` };
    }

    // 👇 CAMBIO: usar id_cycle (del líder), no data.id_cycle
    const pdf_storage_path = `propuestas/${id_cycle}/${lider.id_student}/formato-pgc-${Date.now()}.pdf`;

    await subirArchivoFirebase(pdf_storage_path, file);

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const id_proposal = await propuestaRepository.crearPropuesta(connection, {
            id_leader: lider.id_student,
            id_cycle: id_cycle,               // 👈 ya lo estaba
            title_proposal: data.title_proposal,
            descr_proposal: data.descr_proposal,
            problem_proposal: data.problem_proposal,
            justification_proposal: data.justification_proposal,
            objectives_proposal: data.objectives_proposal,
            solution_proposal: data.solution_proposal,
            pdf_storage_path,
        });

        await propuestaRepository.insertarIntegrante(connection, id_proposal, lider.id_student);

        for (const id_integrante of data.integrantes) {
            const integrante = await propuestaRepository.buscarEstudiantePorId(id_integrante);

            console.log(`Verificando integrante ${id_integrante}:`, integrante);

            if (!integrante) {
                throw { status: 404, mensaje: `El integrante ${id_integrante} no existe` };
            }

            // 👇 CAMBIO: comparar contra id_cycle (del líder) y normalizar a Number
            const integranteCycle = Number(integrante.id_cycle);
            console.log(`Integrante ${id_integrante} pertenece al ciclo ${integranteCycle}, ciclo esperado: ${id_cycle}`);

            if (integranteCycle !== id_cycle) {
                throw { status: 400, mensaje: `El integrante ${id_integrante} no pertenece al mismo ciclo` };
            }

            // 👇 CAMBIO: usar id_cycle, no data.id_cycle
            const propuestaActivaIntegrante = await propuestaRepository.buscarPropuestaActiva(
                integrante.id_student,
                id_cycle
            );
            if (propuestaActivaIntegrante) {
                throw { status: 400, mensaje: `El integrante ${id_integrante} ya tiene una propuesta activa en este ciclo` };
            }

            await propuestaRepository.insertarIntegrante(connection, id_proposal, integrante.id_student);
        }

        const estado = 'Pendiente de validación';
        await connection.commit();

        return { id_proposal, estado, mensaje: 'Propuesta radicada exitosamente' };

    } catch (error) {
        await connection.rollback();
        await borrarArchivoFirebase(pdf_storage_path);
        throw error;
    } finally {
        connection.release();
    }
};
// Reenviar propuesta (con transacción)
export const reenviarPropuesta = async (id_proposal, data, id_user, file) => {
    validarCampos(data);
    validarPDF(file);

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


    // PLUS: Guardar el path viejo para borrarlo al final
    const oldPath = propuesta.pdf_storage_path;

    // PLUS: nuevo path (con timestamp, no colisiona con el anterior)
    const newPath = `propuestas/${propuesta.id_cycle}/${lider.id_student}/formato-pgc-${Date.now()}.pdf`;

    // PLUS: subir el nuevo antes de tocar la DB
    await subirArchivoFirebase(newPath, file);

    // Iniciar transacción
    const connection = await db.getConnection();
    

    try {
        await connection.beginTransaction();
        await propuestaRepository.reenviarPropuesta(connection, id_proposal, {
            ...data,
            pdf_storage_path: newPath,
        });

      
        await connection.commit();
         // PLUS: borrar el archivo VIEJO solo después del commit exitoso
        await borrarArchivoFirebase(oldPath);
        return { mensaje: 'Propuesta reenviada exitosamente, pendiente a calificar' };
    } catch (error) {
        await connection.rollback();
        await borrarArchivoFirebase(newPath); // Borrar el nuevo archivo si la transacción falla, el viejo sigue intacto
        throw error;
    } finally {
        connection.release();
    }
};



// Obtener URL de visualización del PDF
export const obtenerUrlPdf = async (id_proposal) => {
  const propuesta = await propuestaRepository.buscarPropuestaPorId(id_proposal);

  if (!propuesta) {
    throw { status: 404, mensaje: 'Propuesta no encontrada' };
  }
  if (!propuesta.pdf_storage_path) {
    throw { status: 404, mensaje: 'La propuesta no tiene PDF adjunto' };
  }

  const fileRef = bucket.file(propuesta.pdf_storage_path);

  let url;
  try {
    [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hora
    });
  } catch (error) {
    console.error('❌ Error generando signed URL:', error.code, error.message);
    throw {
      status: 500,
      mensaje: 'No se pudo generar el enlace de visualización',
    };
  }

  return {
    url,
    expira_en_segundos: 3600,
  };
};

// ✅ Ver mi propuesta — devuelve todos los campos que necesita el FE
export const verMiPropuesta = async (id_user) => {
    const estudiante = await propuestaRepository.buscarEstudiantePorId(id_user);
    if (!estudiante) {
        throw { status: 404, mensaje: 'El usuario no es estudiante' };
    }

    const propuesta = await propuestaRepository.buscarPropuestaPorEstudiante(estudiante.id_student);
    if (!propuesta) {
        throw { status: 404, mensaje: 'No tienes propuestas registradas' };
    }

    // Obtener integrantes de la propuesta (sus id_user para el FE)
    const integrantes = await propuestaRepository.buscarIntegrantesDePropuesta(propuesta.id_proposal);

    // Generar URL firmada del PDF si existe
    let pdf = null;
    if (propuesta.pdf_storage_path) {
        try {
            const fileRef = bucket.file(propuesta.pdf_storage_path);
            const [url] = await fileRef.getSignedUrl({
                action: 'read',
                expires: Date.now() + 60 * 60 * 1000, // 1 hora
            });
            pdf = { url, expira_en_segundos: 3600 };
        } catch (error) {
            console.error('❌ Error generando signed URL en verMiPropuesta:', error.message);
            // No bloqueamos la respuesta si falla la URL
        }
    }

    return {
        id_proposal:              propuesta.id_proposal,
        titulo:                   propuesta.title_proposal,
        estado:                   propuesta.state_proposal,
        comentario:               propuesta.rejection_comment,
        resubmit_count:           propuesta.resubmit_count,
        id_leader:                propuesta.id_leader,
        leader_name:              propuesta.leader_name,
        // Campos del formulario
        title_proposal:           propuesta.title_proposal,
        descr_proposal:           propuesta.descr_proposal,
        problem_proposal:         propuesta.problem_proposal,
        justification_proposal:   propuesta.justification_proposal,
        objectives_proposal:      propuesta.objectives_proposal,
        solution_proposal:        propuesta.solution_proposal,
        // Integrantes: lista de { id_user, full_name } para mostrar nombres en el FE
        integrantes:              integrantes.map(i => ({ id_user: i.id_user, full_name: i.full_name })),
        // PDF con URL firmada
        pdf,
    };
}




//aca nombramos exactamente el estado "pendiente" tal cual está en la BD
const ESTADO_PENDIENTE = "Pendiente de validación";

//esta funcion es interna y se usan las otras tres: valida que el ciclo exista y que el usuario sea el correspondiente
async function verificarEncargado(id_cycle, id_usuario) {
  const ciclo = await cyclesRepository.buscarPorId(id_cycle);
  if (!ciclo) {
    const error = new Error("Ciclo no encontrado");
    error.status = 404;
    throw error;
  }

  if (ciclo.id_person_charge !== id_usuario) {
    const error = new Error("No eres el encargado de este ciclo");
    error.status = 403;
    throw error;
  }

  return ciclo;
}

//con esta funcion validamos que el usuario sea encargado de ese ciclo y devuelve las propuestas de ese ciclo en el estado pendientes por defecto
async function listarPendientesPorCiclo(id_cycle, estado, usuario) {
  await verificarEncargado(id_cycle, usuario.id);
  return propuestaRepository.listarPorCicloYEstado(id_cycle, estado || ESTADO_PENDIENTE);
}

//esta funcion busca la propuesta, valida que exista y que el usuario sea el encargado del ciclo y que siga pendiente, y la aprueba
async function aprobarPropuesta(id_proposal, usuario) {
  const propuesta = await propuestaRepository.buscarPorId(id_proposal);
  if (!propuesta) {
    const error = new Error("Propuesta no encontrada");
    error.status = 404;
    throw error;
  }

  await verificarEncargado(propuesta.id_cycle, usuario.id);

  if (propuesta.state_proposal !== ESTADO_PENDIENTE) {
    const error = new Error("Esta propuesta ya fue revisada");
    error.status = 409;
    throw error;
  }

  await propuestaRepository.aprobar(id_proposal, usuario.id);
  return {mensaje: 'Su Propuesta fue aprobada, ¡a desarrollar!'};
}

//esta funcion es igual a la de aprobar pero además calcula el nuevo resubmit_count y decide si pasa a Rechazada o a Anulada
async function rechazarPropuesta(id_proposal, comentario, usuario) {
  const propuesta = await propuestaRepository.buscarPorId(id_proposal);
  if (!propuesta) {
    const error = new Error("Propuesta no encontrada");
    error.status = 404;
    throw error;
  }

  await verificarEncargado(propuesta.id_cycle, usuario.id);

  if (propuesta.state_proposal !== ESTADO_PENDIENTE) {
    const error = new Error("Esta propuesta ya fue revisada");
    error.status = 409;
    throw error;
  }

  const nuevoResubmitCount = propuesta.resubmit_count + 1;
  const nuevoEstado = nuevoResubmitCount >= 3 ? "Anulada" : "Rechazada";

  await propuestaRepository.rechazar(id_proposal, {
    rejection_comment: comentario,
    nuevoEstado,
    nuevoResubmitCount,
    reviewed_by: usuario.id,
  });

  return {nuevoResubmitCount, mensaje: 'Su Propuesta fue rechazado'};
}


export { listarPendientesPorCiclo, aprobarPropuesta, rechazarPropuesta };