import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import propuestaRoutes from './routes/propuestaRoutes.js';
import estudianteRoutes from './routes/estudianteRoutes.js';
import ciclosRoutes from './routes/ciclosRoutes.js';
import cicloArchivoRoutes from './routes/cicloArchivoRoutes.js';
import profesoresRoutes from './routes/profesoresRoutes.js';
import categoriasRoutes from './routes/categoriasRoutes.js';
import pgcArchivoRoutes from "./routes/pgcArchivoRoutes.js";
import pgcRoutes from './routes/pgcRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/propuestas', propuestaRoutes);
app.use('/api/estudiantes', estudianteRoutes);
app.use('/api/ciclos', ciclosRoutes);
app.use('/api/ciclos', cicloArchivoRoutes);
app.use('/api/profesores', profesoresRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use("/api/pgc", pgcArchivoRoutes);
app.use('/api/pgc', pgcRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('API funcionando correctamente');
});

// 🔑 EXPORTAMOS LA APP PARA LOS TESTS
export default app;