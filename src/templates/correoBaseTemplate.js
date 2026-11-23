// Plantilla HTML base para todos los correos del sistema PGC.
// Mantiene el mismo logo, colores y estructura para que cualquier correo que se envíe
// (aprobación, rechazo, etc.) tenga el mismo formato corporativo.

const COLOR_PRIMARIO = '#00482B'; // azul institucional
const NOMBRE_INSTITUCION = 'Universidad de Cundinamarca — Gestión de PGC';
const LOGO_URL = process.env.MAIL_LOGO_URL || 'https://pgcfe.vercel.app/assets/logos/ESCUDO BLANCO.png';

// data: { titulo, cuerpoHtml }
export const plantillaBase = ({ titulo = '', cuerpoHtml = '' }) => `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${titulo}</title>
</head>
<body style="margin:0; padding:0; background-color:#f2f4f7; font-family:Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f2f4f7; padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color:${COLOR_PRIMARIO}; padding:20px 32px;">
              <img src="${LOGO_URL}" alt="${NOMBRE_INSTITUCION}" height="36" style="display:block; margin-bottom:8px; border:0;" />
              <span style="color:#ffffff; font-size:14px; letter-spacing:0.3px;">${NOMBRE_INSTITUCION}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px; font-size:20px; color:${COLOR_PRIMARIO};">${titulo}</h1>
              <div style="font-size:14px; line-height:1.6; color:#333333;">
                ${cuerpoHtml}
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f7f9fb; padding:16px 32px; font-size:12px; color:#8a94a6;">
              Este es un mensaje automático de la plataforma de gestión de PGC. Por favor no respondas a este correo.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

export default plantillaBase;
