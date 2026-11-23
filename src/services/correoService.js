import transportador from '../config/mailConfig.js';
import { plantillaBase } from '../templates/correoBaseTemplate.js';

// Remitente que se usa en todos los correos salientes
const remitente = () => process.env.MAIL_FROM || 'PGC - Gestión de Proyectos <no-responder@pgc.edu.co>';

// Envío genérico de correo con la plantilla HTML corporativa (logo + estilos).
// Best-effort: si falla (SMTP sin configurar, red, etc.) NO se relanza el error,
// solo se registra en consola, para que una notificación fallida nunca tumbe el flujo
// principal (aprobar/rechazar una propuesta, etc.), igual que el borrado best-effort en Firebase.
const enviarCorreo = async ({ destinatario, asunto, cuerpoHtml }) => {
    if (!destinatario) {
        console.warn('⚠️ No se envió correo: falta el destinatario (datos de usuario incompletos)');
        return { enviado: false, motivo: 'sin_destinatario' };
    }

    const html = plantillaBase({ titulo: asunto, cuerpoHtml });

    try {
        await transportador.sendMail({
            from: remitente(),
            to: destinatario,
            subject: asunto,
            html,
        });
        return { enviado: true };
    } catch (error) {
        console.error('❌ Error enviando correo:', error.message);
        return { enviado: false, motivo: error.message };
    }
};

// Notifica al líder que su propuesta fue aprobada
// datos: { mail_user, full_name, title_proposal } (ver propuestaRepository.buscarDatosNotificacionPropuesta)
export const enviarCorreoPropuestaAprobada = async (datos) => {
    if (!datos) {
        console.warn('⚠️ No se envió correo de aprobación: no se encontraron datos de la propuesta');
        return { enviado: false, motivo: 'sin_datos' };
    }

    const { mail_user, full_name, title_proposal } = datos;
    return enviarCorreo({
        destinatario: mail_user,
        asunto: 'Tu propuesta de PGC fue aprobada',
        cuerpoHtml: `
            <p>Hola ${full_name || ''},</p>
            <p>Tu propuesta <strong>"${title_proposal}"</strong> fue <strong style="color:#0a7d33;">aprobada</strong>.</p>
            <p>Ya puedes registrar tu PGC desde la plataforma dentro del periodo de registro habilitado.</p>
        `,
    });
};

// Notifica al líder que su propuesta fue rechazada (o anulada, si llegó al tercer rechazo)
// datos: { mail_user, full_name, title_proposal }
export const enviarCorreoPropuestaRechazada = async (datos, comentario, nuevoResubmitCount) => {
    if (!datos) {
        console.warn('⚠️ No se envió correo de rechazo: no se encontraron datos de la propuesta');
        return { enviado: false, motivo: 'sin_datos' };
    }

    const { mail_user, full_name, title_proposal } = datos;
    const anulada = Number(nuevoResubmitCount) >= 3;

    return enviarCorreo({
        destinatario: mail_user,
        asunto: anulada ? 'Tu propuesta de PGC fue anulada' : 'Tu propuesta de PGC fue rechazada',
        cuerpoHtml: `
            <p>Hola ${full_name || ''},</p>
            <p>Tu propuesta <strong>"${title_proposal}"</strong> fue
               <strong style="color:#c0392b;">${anulada ? 'anulada tras 3 rechazos' : 'rechazada'}</strong>.</p>
            ${comentario ? `<p><strong>Comentario del encargado:</strong><br/>${comentario}</p>` : ''}
            ${!anulada ? '<p>Puedes corregirla y reenviarla desde la plataforma.</p>' : ''}
        `,
    });
};

export default { enviarCorreoPropuestaAprobada, enviarCorreoPropuestaRechazada };
