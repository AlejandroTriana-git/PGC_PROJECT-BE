import dotenv from 'dotenv';

dotenv.config();

const mailConfig = {
    brevoApiKey: process.env.BREVO_API_KEY,
    senderEmail: process.env.MAIL_SENDER || process.env.MAIL_USER,
    senderName: process.env.MAIL_SENDER_NAME || 'PGC - Gestión de Proyectos',
};

export default mailConfig;