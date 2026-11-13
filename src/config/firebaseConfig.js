import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

let serviceAccount;

// Verificamos si la variable de entorno con el JSON existe (caso Render)
if (process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.GOOGLE_APPLICATION_CREDENTIALS.trim().startsWith('{')) {
    try {
        serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    } catch (error) {
        console.error('❌ Error al parsear GOOGLE_APPLICATION_CREDENTIALS desde las variables de entorno:', error.message);
    }
} else {
    // Caso local: cargamos el archivo físico mediante path absoluto o relativo
    try {
        const filePath = path.resolve('./src/config/service-account.json');
        if (fs.existsSync(filePath)) {
            serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (error) {
        console.error('⚠️ No se pudo cargar el archivo service-account.json local:', error.message);
    }
}

const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });

const bucket = getStorage(app).bucket();

export default bucket;