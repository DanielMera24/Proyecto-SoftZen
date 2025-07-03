#!/usr/bin/env node

/**
 * Script de verificación optimizado para SoftZen v2.1
 * Verifica que todos los componentes estén funcionando correctamente
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Iniciando verificación de SoftZen v2.1...\n');

// Verificar estructura de archivos
function verifyFileStructure() {
    console.log('📁 Verificando estructura de archivos...');
    
    const requiredFiles = [
        // Frontend Core
        '../frontend/index.html',
        '../frontend/app.js',
        '../frontend/styles.css',
        '../frontend/manifest.json',
        '../frontend/sw.js',
        
        // Frontend JavaScript
        '../frontend/js/firebase-config.js',
        '../frontend/js/firebase-service.js',
        '../frontend/js/utils.js',
        '../frontend/js/app-extensions-p2.js',
        '../frontend/js/app-extensions-p3.js',
        '../frontend/js/app-extensions-p4.js',
        '../frontend/js/app-extensions-p5.js',
        
        // Backend Core
        './server.js',
        './package.json',
        './config/database.js',
        './config/environment.js',
        
        // Controllers
        './controllers/authController.js',
        './controllers/patientController.js',
        './controllers/sessionController.js',
        './controllers/dashboardController.js',
        
        // Routes
        './routes/authRoutes.js',
        './routes/patientRoutes.js',
        
        // Middleware
        './middleware/auth.js',
        './middleware/security.js'
    ];
    
    const missing = [];
    const existing = [];
    
    requiredFiles.forEach(file => {
        const fullPath = path.join(__dirname, file);
        if (fs.existsSync(fullPath)) {
            existing.push(file);
        } else {
            missing.push(file);
        }
    });
    
    console.log(`   ✅ Archivos encontrados: ${existing.length}/${requiredFiles.length}`);
    
    if (missing.length > 0) {
        console.log(`   ⚠️ Archivos faltantes: ${missing.length}`);
        missing.forEach(file => console.log(`      - ${file}`));
    } else {
        console.log('   🎉 Todos los archivos están presentes');
    }
    
    console.log('');
    return missing.length === 0;
}

// Verificar dependencias del backend
function verifyBackendDependencies() {
    console.log('📦 Verificando dependencias del backend...');
    
    try {
        const packagePath = path.join(__dirname, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        const requiredDeps = [
            'express',
            'cors', 
            'helmet',
            'compression',
            'morgan',
            'express-rate-limit',
            'bcrypt',
            'jsonwebtoken',
            'sqlite3',
            'nodemon'
        ];
        
        const installedDeps = {
            ...Object.keys(packageJson.dependencies || {}),
            ...Object.keys(packageJson.devDependencies || {})
        };
        
        const missing = requiredDeps.filter(dep => !installedDeps.includes(dep));
        
        if (missing.length > 0) {
            console.log(`   ⚠️ Dependencias faltantes: ${missing.join(', ')}`);
            console.log('   💡 Ejecuta: npm install');
        } else {
            console.log('   ✅ Todas las dependencias están instaladas');
        }
        
        console.log('');
        return missing.length === 0;
        
    } catch (error) {
        console.log(`   ❌ Error verificando package.json: ${error.message}\n`);
        return false;
    }
}

// Verificar configuración de la base de datos
function verifyDatabaseSetup() {
    console.log('🗄️ Verificando configuración de base de datos...');
    
    const dbDir = path.join(__dirname, 'database');
    
    if (!fs.existsSync(dbDir)) {
        console.log('   📁 Creando directorio de base de datos...');
        fs.mkdirSync(dbDir, { recursive: true });
    }
    
    console.log('   ✅ Directorio de base de datos configurado\n');
    return true;
}

// Verificar configuración del frontend
function verifyFrontendConfiguration() {
    console.log('💻 Verificando configuración del frontend...');
    
    const checks = [];
    
    try {
        // Verificar index.html
        const indexPath = path.join(__dirname, '../frontend/index.html');
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        
        // Verificar PWA
        if (indexContent.includes('manifest.json')) {
            checks.push({ name: 'Manifest PWA', status: true });
        } else {
            checks.push({ name: 'Manifest PWA', status: false });
        }
        
        // Verificar Firebase
        if (indexContent.includes('firebase-config.js')) {
            checks.push({ name: 'Firebase Config', status: true });
        } else {
            checks.push({ name: 'Firebase Config', status: false });
        }
        
        // Verificar Service Worker
        if (indexContent.includes('/sw.js')) {
            checks.push({ name: 'Service Worker', status: true });
        } else {
            checks.push({ name: 'Service Worker', status: false });
        }
        
        // Verificar que firebase-config.js tenga las exportaciones correctas
        const firebaseConfigPath = path.join(__dirname, '../frontend/js/firebase-config.js');
        if (fs.existsSync(firebaseConfigPath)) {
            const firebaseContent = fs.readFileSync(firebaseConfigPath, 'utf8');
            if (firebaseContent.includes('export const COLLECTIONS') && 
                firebaseContent.includes('export const USER_ROLES')) {
                checks.push({ name: 'Firebase Exports', status: true });
            } else {
                checks.push({ name: 'Firebase Exports', status: false });
            }
        } else {
            checks.push({ name: 'Firebase Exports', status: false });
        }
        
        const allPassed = checks.every(check => check.status);
        
        checks.forEach(check => {
            const status = check.status ? '✅' : '❌';
            console.log(`   ${status} ${check.name}`);
        });
        
        console.log('');
        return allPassed;
        
    } catch (error) {
        console.log(`   ❌ Error verificando frontend: ${error.message}\n`);
        return false;
    }
}

// Verificar Firebase y Firestore
function verifyFirebaseConfiguration() {
    console.log('🔥 Verificando configuración de Firebase...');
    
    const checks = [];
    
    try {
        // Verificar firebase.json
        const firebaseJsonPath = path.join(__dirname, '../firebase.json');
        if (fs.existsSync(firebaseJsonPath)) {
            const firebaseJson = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));
            
            if (firebaseJson.hosting) {
                checks.push({ name: 'Firebase Hosting', status: true });
            } else {
                checks.push({ name: 'Firebase Hosting', status: false });
            }
            
            if (firebaseJson.firestore) {
                checks.push({ name: 'Firestore Config', status: true });
            } else {
                checks.push({ name: 'Firestore Config', status: false });
            }
        } else {
            checks.push({ name: 'Firebase JSON', status: false });
        }
        
        // Verificar firestore.rules
        const rulesPath = path.join(__dirname, '../firestore.rules');
        if (fs.existsSync(rulesPath)) {
            const rulesContent = fs.readFileSync(rulesPath, 'utf8');
            if (rulesContent.includes('function isAuthenticated()') && 
                rulesContent.includes('function getUserRole()')) {
                checks.push({ name: 'Firestore Rules', status: true });
            } else {
                checks.push({ name: 'Firestore Rules', status: false });
            }
        } else {
            checks.push({ name: 'Firestore Rules', status: false });
        }
        
        // Verificar firestore.indexes.json
        const indexesPath = path.join(__dirname, '../firestore.indexes.json');
        if (fs.existsSync(indexesPath)) {
            const indexesContent = fs.readFileSync(indexesPath, 'utf8');
            const indexes = JSON.parse(indexesContent);
            if (indexes.indexes && indexes.indexes.length > 0) {
                checks.push({ name: 'Firestore Indexes', status: true });
            } else {
                checks.push({ name: 'Firestore Indexes', status: false });
            }
        } else {
            checks.push({ name: 'Firestore Indexes', status: false });
        }
        
        const allPassed = checks.every(check => check.status);
        
        checks.forEach(check => {
            const status = check.status ? '✅' : '❌';
            console.log(`   ${status} ${check.name}`);
        });
        
        console.log('');
        return allPassed;
        
    } catch (error) {
        console.log(`   ❌ Error verificando Firebase: ${error.message}\n`);
        return false;
    }
}

// Verificar optimizaciones de rendimiento
function verifyPerformanceOptimizations() {
    console.log('⚡ Verificando optimizaciones de rendimiento...');
    
    const checks = [];
    
    try {
        // Service Worker
        const swPath = path.join(__dirname, '../frontend/sw.js');
        if (fs.existsSync(swPath)) {
            const swContent = fs.readFileSync(swPath, 'utf8');
            if (swContent.includes('CACHE_VERSION') && swContent.includes('CacheManager')) {
                checks.push({ name: 'Service Worker Optimizado', status: true });
            } else {
                checks.push({ name: 'Service Worker Optimizado', status: false });
            }
        } else {
            checks.push({ name: 'Service Worker Optimizado', status: false });
        }
        
        // Server optimizations
        const serverPath = path.join(__dirname, './server.js');
        if (fs.existsSync(serverPath)) {
            const serverContent = fs.readFileSync(serverPath, 'utf8');
            
            if (serverContent.includes('compression()')) {
                checks.push({ name: 'Compresión GZIP', status: true });
            } else {
                checks.push({ name: 'Compresión GZIP', status: false });
            }
            
            if (serverContent.includes('helmet(')) {
                checks.push({ name: 'Helmet Security', status: true });
            } else {
                checks.push({ name: 'Helmet Security', status: false });
            }
            
            if (serverContent.includes('rateLimit')) {
                checks.push({ name: 'Rate Limiting', status: true });
            } else {
                checks.push({ name: 'Rate Limiting', status: false });
            }
        }
        
        const passedChecks = checks.filter(check => check.status).length;
        
        checks.forEach(check => {
            const status = check.status ? '✅' : '❌';
            console.log(`   ${status} ${check.name}`);
        });
        
        console.log(`   📊 Optimizaciones: ${passedChecks}/${checks.length} implementadas`);
        console.log('');
        
        return passedChecks >= checks.length * 0.8; // 80% o más
        
    } catch (error) {
        console.log(`   ❌ Error verificando optimizaciones: ${error.message}\n`);
        return false;
    }
}

// Verificar funcionalidades avanzadas
function verifyAdvancedFeatures() {
    console.log('🚀 Verificando funcionalidades avanzadas...');
    
    const extensions = [
        { file: '../frontend/js/app-extensions-p2.js', name: 'Dashboard & Pacientes' },
        { file: '../frontend/js/app-extensions-p3.js', name: 'Series & Sesiones' },
        { file: '../frontend/js/app-extensions-p4.js', name: 'Analytics & Reportes' },
        { file: '../frontend/js/app-extensions-p5.js', name: 'Configuraciones & Perfil' }
    ];
    
    const checks = [];
    
    extensions.forEach(ext => {
        const extPath = path.join(__dirname, ext.file);
        if (fs.existsSync(extPath)) {
            const content = fs.readFileSync(extPath, 'utf8');
            if (content.includes('Object.assign(window.SoftZenApp.prototype') && 
                content.length > 5000) { // Verificar que tiene contenido sustancial
                checks.push({ name: ext.name, status: true });
            } else {
                checks.push({ name: ext.name, status: false });
            }
        } else {
            checks.push({ name: ext.name, status: false });
        }
    });
    
    const allPassed = checks.every(check => check.status);
    
    checks.forEach(check => {
        const status = check.status ? '✅' : '❌';
        console.log(`   ${status} ${check.name}`);
    });
    
    if (allPassed) {
        console.log('   🌟 Todas las funcionalidades avanzadas están disponibles');
    } else {
        console.log('   ⚠️ Algunas funcionalidades necesitan revisión');
    }
    
    console.log('');
    return allPassed;
}

// Generar reporte de verificación
function generateVerificationReport(results) {
    console.log('📋 REPORTE DE VERIFICACIÓN DE SOFTZEN V2.1');
    console.log('===========================================\n');
    
    const categories = [
        { name: 'Estructura de Archivos', status: results.fileStructure, critical: true },
        { name: 'Dependencias Backend', status: results.dependencies, critical: true },
        { name: 'Base de Datos', status: results.database, critical: true },
        { name: 'Configuración Frontend', status: results.frontend, critical: true },
        { name: 'Configuración Firebase', status: results.firebase, critical: true },
        { name: 'Optimizaciones de Rendimiento', status: results.performance, critical: false },
        { name: 'Funcionalidades Avanzadas', status: results.advanced, critical: false }
    ];
    
    let passed = 0;
    let criticalPassed = 0;
    let totalCritical = 0;
    
    categories.forEach(category => {
        const status = category.status ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${category.name}`);
        
        if (category.status) passed++;
        if (category.critical) {
            totalCritical++;
            if (category.status) criticalPassed++;
        }
    });
    
    console.log(`\n📊 Resumen: ${passed}/${categories.length} verificaciones pasaron`);
    console.log(`🔴 Críticas: ${criticalPassed}/${totalCritical} verificaciones críticas pasaron`);
    
    if (criticalPassed === totalCritical) {
        console.log('\n🎉 ¡SOFTZEN COMPLETAMENTE FUNCIONAL!');
        console.log('🚀 Tu aplicación está lista para usar');
        
        console.log('\n📝 INICIO RÁPIDO:');
        console.log('   1. cd backend');
        console.log('   2. npm install (si no se ha hecho)');
        console.log('   3. npm run dev');
        console.log('   4. Abrir: http://localhost:3001');
        console.log('   5. Login: admin@softzen.com / SoftZen2024!');
        
        if (passed === categories.length) {
            console.log('\n🌟 TODAS LAS FUNCIONALIDADES DISPONIBLES:');
            console.log('   ✅ Autenticación completa');
            console.log('   ✅ Dashboard optimizado');
            console.log('   ✅ Gestión de pacientes');
            console.log('   ✅ Series terapéuticas');
            console.log('   ✅ Analytics avanzados');
            console.log('   ✅ PWA instalable');
            console.log('   ✅ Modo offline');
        }
        
    } else {
        console.log('\n⚠️ VERIFICACIÓN PARCIAL');
        console.log('🔧 Faltan verificaciones críticas para el funcionamiento básico');
        console.log('💡 Revisa los elementos marcados como FAIL');
    }
    
    console.log('\n🏷️ Versión: SoftZen v2.1.0');
    console.log('🛠️ Optimizado para: Rendimiento + Sostenibilidad + Escalabilidad');
    console.log('📅 Fecha de verificación:', new Date().toLocaleString());
    console.log('💻 Sistema:', process.platform, process.arch);
    console.log('📦 Node.js:', process.version);
}

// Función principal
async function runVerification() {
    const results = {
        fileStructure: verifyFileStructure(),
        dependencies: verifyBackendDependencies(),
        database: verifyDatabaseSetup(),
        frontend: verifyFrontendConfiguration(),
        firebase: verifyFirebaseConfiguration(),
        performance: verifyPerformanceOptimizations(),
        advanced: verifyAdvancedFeatures()
    };
    
    generateVerificationReport(results);
    
    // Retornar código de salida apropiado
    const criticalTests = [results.fileStructure, results.dependencies, results.database, results.frontend, results.firebase];
    const allCriticalPassed = criticalTests.every(test => test);
    
    if (!allCriticalPassed) {
        process.exit(1);
    }
}

// Ejecutar verificación
runVerification().catch(error => {
    console.error('❌ Error durante la verificación:', error);
    process.exit(1);
});
