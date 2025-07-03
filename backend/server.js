import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración por ambiente
import config from './config/environment.js';

// Importar rutas
import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import seriesRoutes from './routes/seriesRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

// Middleware personalizado
import { authenticateToken } from './middleware/auth.js';
import { apiLimiter, authLimiter } from './middleware/rateLimiter.js';

// Configurar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = config.port;

// Configuración de seguridad con Helmet
app.use(helmet({
    contentSecurityPolicy: false, // Para desarrollo
    crossOriginEmbedderPolicy: false
}));

// Configuración de CORS
app.use(cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compresión de respuestas
app.use(compression());

// Rate limiting general para todas las rutas API
app.use('/api/', apiLimiter);

// Rate limiting específico para autenticación
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Parsing de JSON y URL encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/patients', authenticateToken, patientRoutes);
app.use('/api/series', authenticateToken, seriesRoutes);
app.use('/api/sessions', authenticateToken, sessionRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);

// Ruta de health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '2.0.0',
        uptime: process.uptime()
    });
});

// Ruta catch-all para el frontend (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Manejo de errores global
app.use((error, req, res, next) => {
    console.error('❌ Error del servidor:', error);
    
    res.status(error.status || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' 
            ? 'Error interno del servidor' 
            : error.message,
        code: error.code || 'INTERNAL_ERROR'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('🧘‍♀️ SOFTZEN v2.0 - SERVIDOR INICIADO');
    console.log('===================================');
    console.log(`🌐 Servidor ejecutándose en: http://localhost:${PORT}`);
    console.log(`📊 API Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🔒 Entorno: ${config.nodeEnv}`);
    console.log(`⚡ Optimizado para: Rendimiento, Sostenibilidad y Escalabilidad`);
    console.log('===================================');
});

export default app;