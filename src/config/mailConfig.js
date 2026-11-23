import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Transportador de correo (SMTP). Se arma a partir de las variables de entorno MAIL_*.
// Si el .env no tiene credenciales configuradas (ej. en pruebas) el transportador se
// crea igual; el envío fallará de forma controlada y lo atrapa correoService.js.
const transportador = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === 'true', // true para el puerto 465, false para el resto (STARTTLS)
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
    },
});

export default transportador;
