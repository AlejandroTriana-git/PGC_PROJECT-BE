import mailConfig from '../config/mailConfig.js';
import { plantillaBase } from '../templates/correoBaseTemplate.js';

// Envío genérico de correo usando la API HTTP de Brevo (puerto 443 HTTPS, sin SMTP 587).
// Best-effort: si falla, no relanza el error para no interrumpir el flujo principal.
const enviarCorreo = async ({ destinatario, asunto, cuerpoHtml }) => {
    if (!destinatario) {
        console.warn('⚠️ No se envió correo: falta el destinatario (datos de usuario incompletos)');
        return { enviado: false, motivo: 'sin_destinatario' };
    }

    if (!mailConfig.brevoApiKey) {
        console.warn('⚠️ No se envió correo: falta BREVO_API_KEY en las variables de entorno');
        return { enviado: false, motivo: 'sin_api_key' };
    }

    if (!mailConfig.senderEmail) {
        console.warn('⚠️ No se envió correo: falta MAIL_SENDER en las variables de entorno');
        return { enviado: false, motivo: 'sin_remitente' };
    }

    const html = plantillaBase({ titulo: asunto, cuerpoHtml });

    try {
        const respuesta = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'api-key': mailConfig.brevoApiKey,
            },
            body: JSON.stringify({
                sender: {
                    name: mailConfig.senderName,
                    email: mailConfig.senderEmail,
                },
                to: [
                    { email: destinatario },
                ],
                subject: asunto,
                htmlContent: html,
            }),
        });

        if (!respuesta.ok) {
    // Se limpia el texto de error antes de loguearlo: viene de un servidor externo (Brevo)
    // y SonarCloud marca como "log injection" meter texto sin filtrar en el log.
    const detalleError = (await respuesta.text()).replace(/[\r\n]/g, ' ').slice(0, 300);
    throw new Error(`Brevo HTTP ${respuesta.status}: ${detalleError}`);
}

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