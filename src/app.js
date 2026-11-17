import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Rutas
import authRoutes from './routes/authRoutes.js';
import propuestaRoutes from './routes/propuestaRoutes.js';
import estudianteRoutes from './routes/estudianteRoutes.js';
import ciclosRoutes from './routes/ciclosRoutes.js';
import cicloArchivoRoutes from './routes/cicloArchivoRoutes.js';
import profesoresRoutes from './routes/profesoresRoutes.js';
import categoriasRoutes from './routes/categoriasRoutes.js';
import pgcArchivoRoutes from "./routes/pgcArchivoRoutes.js";
import pgcRoutes from './routes/pgcRoutes.js';
import lineamientoRoutes from './routes/lineamientoRoutes.js'; // <-- Ruta nueva de tu compañero

dotenv.config();

const app = express();
app.disable('x-powered-by');
// CORS configurado por tu compañero
const corsOptions = {
    origin: 'https://pgcfe.vercel.app', // Permitir solicitudes unicamente desde este origen
    methods: 'GET,PUT,PATCH,POST,DELETE', // Métodos HTTP permitidos
    preflightContinue: false,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
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
app.use('/api/lineamientos', lineamientoRoutes); // <-- Ruta nueva de tu compañero

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('API funcionando correctamente');
});

// Exportamos la app para los tests
export default app;