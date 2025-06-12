import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Importar configuración
import { initDatabase } from './config/database.js';
import { authenticateToken } from './middleware/auth.js';
import { apiLimiter, authLimiter, validateInput } from './middleware/security.js';

// Importar rutas
import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import seriesRoutes from './routes/seriesRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Crear directorio de base de datos si no existe
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Middleware de seguridad y optimización
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'", "https://www.youtube.com", "https://youtube.com"]
        }
    }
}));

app.use(compression());

// Logging
if (isProduction) {
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// CORS configuración
const corsOptions = {
    origin: isProduction 
        ? [process.env.FRONTEND_URL || 'https://localhost:3001']
        : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3001', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(validateInput);

// Servir archivos estáticos del frontend
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/patients', authenticateToken, patientRoutes);
app.use('/api/series', authenticateToken, seriesRoutes);
app.use('/api/sessions', authenticateToken, sessionRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

// Ruta para obtener información de la aplicación
app.get('/api/info', (req, res) => {
    res.json({
        name: 'Yoga Terapéutico Online',
        version: '1.0.0',
        description: 'Plataforma de yoga terapéutico para instructores y pacientes'
    });
});

// Servir frontend para todas las rutas no API (SPA routing)
app.get('*', (req, res, next) => {
    // Si es una ruta de API que no existe, devolver 404
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ 
            error: 'Endpoint no encontrado',
            path: req.path 
        });
    }
    
    // Para rutas del frontend, servir index.html
    res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
        if (err) {
            console.error('Error sirviendo index.html:', err);
            res.status(500).send('Error interno del servidor');
        }
    });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Error de validación de datos
    if (err.name === 'ValidationError') {
        return res.status(400).json({ 
            error: 'Datos de entrada inválidos',
            details: err.message,
            code: 'VALIDATION_ERROR'
        });
    }
    
    // Error de autorización
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ 
            error: 'Token inválido',
            code: 'UNAUTHORIZED'
        });
    }
    
    // Error de sintaxis JSON
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ 
            error: 'JSON inválido',
            code: 'INVALID_JSON'
        });
    }
    
    // Error genérico
    res.status(err.status || 500).json({ 
        error: isProduction ? 'Error interno del servidor' : err.message,
        code: err.code || 'INTERNAL_ERROR',
        ...(isProduction ? {} : { stack: err.stack })
    });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Recurso no encontrado',
        path: req.path,
        code: 'NOT_FOUND'
    });
});

// Inicializar base de datos y servidor
async function startServer() {
    try {
        console.log('🚀 Iniciando servidor...');
        console.log(`📂 Directorio frontend: ${frontendPath}`);
        
        // Verificar que existe el directorio frontend
        if (!fs.existsSync(frontendPath)) {
            console.warn('⚠️  Directorio frontend no encontrado:', frontendPath);
        }
        
        await initDatabase();
        console.log('✅ Base de datos inicializada correctamente');
        
        const server = app.listen(PORT, () => {
            console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
            console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
            console.log(`💻 Frontend: http://localhost:${PORT}`);
            
            if (isProduction) {
                console.log('🔒 Modo producción activado');
            } else {
                console.log('🛠️  Modo desarrollo activado');
            }
        });

        // Configurar timeout del servidor
        server.timeout = 30000; // 30 segundos
        
        return server;
    } catch (error) {
        console.error('❌ Error iniciando servidor:', error);
        process.exit(1);
    }
}

// Manejo de cierre graceful
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown(signal) {
    console.log(`\n🔄 Recibida señal ${signal}. Cerrando servidor gracefully...`);
    
    // Dar tiempo para que las conexiones existentes terminen
    setTimeout(() => {
        console.log('👋 Servidor cerrado');
        process.exit(0);
    }, 1000);
}

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
    console.error('💥 Error no capturado:', err);
    if (isProduction) {
        process.exit(1);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Promesa rechazada no manejada:', reason);
    console.error('En promesa:', promise);
    if (isProduction) {
        process.exit(1);
    }
});

// Iniciar servidor
startServer();

export default app;