import db from '../config/db.js';
import bucket from '../config/firebaseConfig.js';
import * as propuestaRepository from '../repositories/propuestaRepository.js';

// Validar campos obligatorios
const validarCampos = (data) => {
    const campos = ['title_proposal', 'descr_proposal', 'problem_proposal', 'justification_proposal', 'objectives_proposal', 'solution_proposal', 'id_cycle', 'integrantes'];
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

     // 👇 NUEVO: normalizar tipos que vienen como string desde FormData
    data.id_cycle = Number(data.id_cycle);
    data.integrantes = data.integrantes.map(Number);

    validarCampos(data);
    validarPDF(file);

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
    console.log("Integrantes recibidos:", data.integrantes.length);
    console.log("Máximo de integrantes permitido:", ciclo.max_members);

    // 5. Validar que la cantidad de integrantes no supere el máximo
    if (data.integrantes.length > ciclo.max_members) {
        throw { status: 400, mensaje: `El máximo de integrantes es ${ciclo.max_members}` };
    }

    //PLUS: generar el patch del PDF
    const pdf_storage_path = `propuestas/${data.id_cycle}/${lider.id_student}/formato-pgc-${Date.now()}.pdf`;
    // PLUS: subir a Firebase ANTES de la transacción
    await subirArchivoFirebase(pdf_storage_path, file);

    // 6. Iniciar transacción
    const connection = await db.getConnection();
   

    try {
         await connection.beginTransaction();
        // 6.1. Crear propuesta
        const id_proposal = await propuestaRepository.crearPropuesta(connection, {
            id_leader: lider.id_student,
            id_cycle: data.id_cycle,
            title_proposal: data.title_proposal,
            descr_proposal: data.descr_proposal,
            problem_proposal: data.problem_proposal,
            justification_proposal: data.justification_proposal,
            objectives_proposal: data.objectives_proposal,
            solution_proposal: data.solution_proposal,
            pdf_storage_path, 
        });

        // 6.2. Insertar al líder
        await propuestaRepository.insertarIntegrante(connection, id_proposal, lider.id_student);
    

        // 6.3. Insertar a los integrantes
        for (const id_integrante of data.integrantes) {
            const integrante = await propuestaRepository.buscarEstudiantePorId(id_integrante);
            console.log(`Verificando integrante ${id_integrante}:`, integrante);
            console.log(`Integrante ${id_integrante} pertenece al ciclo ${integrante?.id_cycle}, ciclo de la propuesta: ${data.id_cycle}`);
            if (!integrante) {
                throw { status: 404, mensaje: `El integrante ${id_integrante} no existe` };
            }
            if (integrante.id_cycle !== data.id_cycle) {
                throw { status: 400, mensaje: `El integrante ${id_integrante} no pertenece al mismo ciclo` };
            }

            const propuestaActivaIntegrante = await propuestaRepository.buscarPropuestaActiva(integrante.id_student, data.id_cycle);
            if (propuestaActivaIntegrante) {
                throw { status: 400, mensaje: `El integrante ${id_integrante} ya tiene una propuesta activa en este ciclo` };
            }

            await propuestaRepository.insertarIntegrante(connection, id_proposal, integrante.id_student);
        }

        const estado = 'Pendiente de validación';
        // 6.4. Confirmar transacción
        await connection.commit();

        return { id_proposal, estado, mensaje: 'Propuesta radicada exitosamente' };
    } catch (error) {
        // 6.5. Revertir cambios si algo falla
        await connection.rollback();
         await borrarArchivoFirebase(pdf_storage_path);//Borrar el PDF subido si la transacción falla
        throw error;
    } finally {
        // 6.6. Liberar la conexión
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