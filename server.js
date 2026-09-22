import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import propuestaRoutes from './src/routes/propuestaRoutes.js';
import estudianteRoutes from './src/routes/estudianteRoutes.js';
import ciclosRoutes from './src/routes/ciclosRoutes.js';
import profesoresRoutes from './src/routes/profesoresRoutes.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 7000;

app.use(cors());
app.use(express.json());

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/propuestas', propuestaRoutes);
app.use('/api/estudiantes', estudianteRoutes);
app.use('/api/ciclos', ciclosRoutes);
app.use('/api/profesores', profesoresRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('API funcionando correctamente');
});


app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});