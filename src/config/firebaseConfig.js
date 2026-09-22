// config/firebase.js
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import serviceAccount from './service-account.json' with { type: 'json' };

const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });

const bucket = getStorage(app).bucket();

export default bucket;