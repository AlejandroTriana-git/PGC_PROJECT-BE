// config/firebase.js
import admin from 'firebase-admin';
import serviceAccount from '..config/service-account.json' assert { type: 'json' }; 

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET, 
  });
}

const bucket = admin.storage().bucket();
export default bucket;