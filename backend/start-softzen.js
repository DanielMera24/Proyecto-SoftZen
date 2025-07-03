#!/usr/bin/env node

/**
 * Script de inicio robusto para SoftZen Backend v2.1
 * Verifica dependencias, inicializa base de datos y arranca el servidor
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Iniciando SoftZen Backend v2.1...\n');

// Configuración
const CONFIG = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3001,
  DATABASE_PATH: path.join(__dirname, 'database', 'therapy.db'),
  REQUIRED_NODE_VERSION: '18.0.0'
};

// Colores para console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

// Verificar versión de Node.js
function checkNodeVersion() {
  logStep('1/7', 'Verificando versión de Node.js...');
  
  const nodeVersion = process.version;
  const [major] = nodeVersion.replace('v', '').split('.').map(Number);
  const [requiredMajor] = CONFIG.REQUIRED_NODE_VERSION.split('.').map(Number);
  
  if (major < requiredMajor) {
    logError(`Node.js ${CONFIG.REQUIRED_NODE_VERSION}+ requerido. Versión actual: ${nodeVersion}`);
    process.exit(1);
  }
  
  logSuccess(`Node.js ${nodeVersion} es compatible`);
}

// Verificar e instalar dependencias
async function checkDependencies() {
  logStep('2/7', 'Verificando dependencias...');
  
  const packageJsonPath = path.join(__dirname, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    logError('package.json no encontrado');
    process.exit(1);
  }
  
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  
  if (!fs.existsSync(nodeModulesPath)) {
    logWarning('node_modules no encontrado. Instalando dependencias...');
    
    try {
      execSync('npm install', { 
        cwd: __dirname, 
        stdio: 'inherit' 
      });
      logSuccess('Dependencias instaladas correctamente');
    } catch (error) {
      logError('Error instalando dependencias');
      console.error(error.message);
      process.exit(1);
    }
  } else {
    // Verificar si nodemon está disponible
    const nodemonPath = path.join(nodeModulesPath, '.bin', 'nodemon');
    const nodemonPathCmd = path.join(nodeModulesPath, '.bin', 'nodemon.cmd');
    
    if (!fs.existsSync(nodemonPath) && !fs.existsSync(nodemonPathCmd)) {
      logWarning('nodemon no encontrado. Reinstalando dependencias...');
      
      try {
        execSync('npm install', { 
          cwd: __dirname, 
          stdio: 'inherit' 
        });
        logSuccess('Dependencias actualizadas');
      } catch (error) {
        logError('Error actualizando dependencias');
        console.error(error.message);
      }
    }
    
    logSuccess('Dependencias verificadas');
  }
}

// Verificar estructura de directorios
function checkDirectories() {
  logStep('3/7', 'Verificando estructura de directorios...');
  
  const requiredDirs = [
    'config',
    'controllers',
    'middleware',
    'database',
    'logs'
  ];
  
  requiredDirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logWarning(`Directorio creado: ${dir}`);
    }
  });
  
  logSuccess('Estructura de directorios verificada');
}

// Verificar configuración de ambiente
function checkEnvironment() {
  logStep('4/7', 'Verificando configuración de ambiente...');
  
  const envPath = path.join(__dirname, '.env');
  
  if (!fs.existsSync(envPath)) {
    logWarning('Archivo .env no encontrado. Creando configuración básica...');
    
    const defaultEnv = `# SoftZen Backend Configuration
NODE_ENV=${CONFIG.NODE_ENV}
PORT=${CONFIG.PORT}
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
DATABASE_PATH=${CONFIG.DATABASE_PATH}
CORS_ORIGIN=http://localhost:3001,https://pagina-yoga.firebaseapp.com
LOG_LEVEL=info

# Firebase Configuration (Optional for local development)
# FIREBASE_PROJECT_ID=pagina-yoga
# FIREBASE_CLIENT_EMAIL=
# FIREBASE_PRIVATE_KEY=

# Security Settings
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Performance Settings
COMPRESSION_LEVEL=6
CACHE_TTL=300
`;
    
    fs.writeFileSync(envPath, defaultEnv);
    logSuccess('Archivo .env creado con configuración por defecto');
  } else {
    logSuccess('Configuración de ambiente encontrada');
  }
}

// Verificar e inicializar base de datos
async function checkDatabase() {
  logStep('5/7', 'Verificando base de datos...');
  
  const dbDir = path.dirname(CONFIG.DATABASE_PATH);
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  if (!fs.existsSync(CONFIG.DATABASE_PATH)) {
    logWarning('Base de datos no encontrada. Inicializando...');
    
    try {
      // Importar dinámicamente el módulo de base de datos
      const { initializeDatabase } = await import('./config/database.js');
      await initializeDatabase();
      logSuccess('Base de datos inicializada correctamente');
    } catch (error) {
      logWarning('Error inicializando base de datos automáticamente');
      console.error(error.message);
      logWarning('La base de datos se creará al primer uso del servidor');
    }
  } else {
    logSuccess('Base de datos encontrada');
  }
}

// Verificar conectividad
function checkConnectivity() {
  logStep('6/7', 'Verificando conectividad...');
  
  // Verificar que el puerto esté disponible
  const net = require('net');
  const server = net.createServer();
  
  return new Promise((resolve) => {
    server.listen(CONFIG.PORT, () => {
      server.close(() => {
        logSuccess(`Puerto ${CONFIG.PORT} disponible`);
        resolve();
      });
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logWarning(`Puerto ${CONFIG.PORT} en uso. El servidor intentará usar otro puerto.`);
      } else {
        logWarning(`Error verificando puerto: ${err.message}`);
      }
      resolve();
    });
  });
}

// Iniciar servidor
function startServer() {
  logStep('7/7', 'Iniciando servidor...');
  
  const isProduction = CONFIG.NODE_ENV === 'production';
  const isDevelopment = CONFIG.NODE_ENV === 'development';
  
  // Determinar qué comando usar
  let command, args;
  
  if (isDevelopment) {
    // Intentar usar nodemon primero
    const nodemonPath = path.join(__dirname, 'node_modules', '.bin', 'nodemon');
    const nodemonPathCmd = path.join(__dirname, 'node_modules', '.bin', 'nodemon.cmd');
    
    if (fs.existsSync(nodemonPath) || fs.existsSync(nodemonPathCmd)) {
      command = 'npm';
      args = ['run', 'dev'];
      logSuccess('Usando nodemon para desarrollo con hot reload');
    } else {
      command = 'npm';
      args = ['run', 'dev-safe'];
      logWarning('nodemon no disponible, usando modo seguro');
    }
  } else {
    command = 'npm';
    args = ['start'];
    logSuccess('Iniciando en modo producción');
  }
  
  // Configurar variables de ambiente para el proceso hijo
  const env = {
    ...process.env,
    NODE_ENV: CONFIG.NODE_ENV,
    PORT: CONFIG.PORT
  };
  
  console.log('\n' + '='.repeat(50));
  log('🎉 SoftZen Backend está iniciando...', 'green');
  log(`📍 Puerto: ${CONFIG.PORT}`, 'blue');
  log(`🌍 Ambiente: ${CONFIG.NODE_ENV}`, 'blue');
  log(`🔗 URL: http://localhost:${CONFIG.PORT}`, 'blue');
  console.log('='.repeat(50) + '\n');
  
  // Iniciar el proceso del servidor
  const serverProcess = spawn(command, args, {
    cwd: __dirname,
    stdio: 'inherit',
    env: env,
    shell: true
  });
  
  // Manejar señales de terminación
  process.on('SIGINT', () => {
    log('\n🛑 Recibida señal de interrupción...', 'yellow');
    serverProcess.kill('SIGINT');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    log('\n🛑 Recibida señal de terminación...', 'yellow');
    serverProcess.kill('SIGTERM');
    process.exit(0);
  });
  
  serverProcess.on('error', (error) => {
    logError(`Error iniciando servidor: ${error.message}`);
    process.exit(1);
  });
  
  serverProcess.on('exit', (code) => {
    if (code !== 0) {
      logError(`Servidor terminó con código: ${code}`);
      process.exit(code);
    }
  });
}

// Función principal
async function main() {
  try {
    console.log('🔧 SoftZen Backend Initialization Script v2.1\n');
    
    checkNodeVersion();
    await checkDependencies();
    checkDirectories();
    checkEnvironment();
    await checkDatabase();
    await checkConnectivity();
    
    console.log('\n✅ Todas las verificaciones completadas exitosamente\n');
    
    startServer();
    
  } catch (error) {
    logError(`Error crítico durante la inicialización: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar script principal
main().catch(error => {
  logError(`Error no manejado: ${error.message}`);
  console.error(error);
  process.exit(1);
});
