#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

/**
 * Script de configuración automática para SoftZen
 * Enfoque en automatización, verificación y resolución de problemas
 */

class SoftZenSetup {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '..');
        this.backendDir = __dirname;
        this.frontendDir = path.join(this.projectRoot, 'frontend');
        this.databaseDir = path.join(this.backendDir, 'database');
        
        this.errors = [];
        this.warnings = [];
        this.fixes = [];
    }

    async setup() {
        console.log('🧘‍♀️ CONFIGURADOR AUTOMÁTICO DE SOFTZEN v2.0');
        console.log('===============================================');
        console.log('⚡ Optimizado para: Rendimiento, Sostenibilidad y Escalabilidad\n');

        try {
            await this.checkPrerequisites();
            await this.setupDirectories();
            await this.createConfigFiles();
            await this.setupDatabase();
            await this.verifyInstallation();
            await this.displaySummary();
            
        } catch (error) {
            console.error('💥 Error fatal durante la configuración:', error);
            process.exit(1);
        }
    }

    async checkPrerequisites() {
        console.log('🔍 VERIFICANDO PREREQUISITOS...');
        
        try {
            // Verificar Node.js
            const { stdout: nodeVersion } = await execAsync('node --version');
            const nodeVersionNum = parseFloat(nodeVersion.replace('v', ''));
            
            if (nodeVersionNum < 16) {
                this.errors.push('Node.js versión 16+ requerida. Versión actual: ' + nodeVersion.trim());
            } else {
                console.log(`✅ Node.js ${nodeVersion.trim()} encontrado`);
            }

            // Verificar npm
            const { stdout: npmVersion } = await execAsync('npm --version');
            console.log(`✅ npm ${npmVersion.trim()} encontrado`);

        } catch (error) {
            this.errors.push('Error verificando prerequisitos: ' + error.message);
        }

        console.log('');
    }

    async setupDirectories() {
        console.log('📁 CONFIGURANDO ESTRUCTURA DE DIRECTORIOS...');
        
        const requiredDirs = [
            this.databaseDir,
            path.join(this.backendDir, 'uploads'),
            path.join(this.backendDir, 'logs'),
        ];

        for (const dir of requiredDirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
                console.log(`✅ Directorio asegurado: ${path.relative(this.backendDir, dir)}`);
            } catch (error) {
                this.errors.push(`Error creando directorio ${dir}: ${error.message}`);
            }
        }

        console.log('');
    }

    async createConfigFiles() {
        console.log('⚙️ CREANDO ARCHIVOS DE CONFIGURACIÓN...');
        
        // Crear .env si no existe
        await this.createEnvFile();
        
        // Verificar package.json
        await this.verifyPackageJson();

        console.log('');
    }

    async createEnvFile() {
        const envPath = path.join(this.backendDir, '.env');
        
        try {
            await fs.access(envPath);
            console.log('✅ .env ya existe');
        } catch {
            const envContent = `# SoftZen Configuration
NODE_ENV=development
PORT=3001
JWT_SECRET=soft_zen_secret_key_2024_v2_secure_change_in_production
DB_PATH=./database/therapy.db

# Security
BCRYPT_ROUNDS=12
SESSION_TIMEOUT=24h
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Features
ANALYTICS_ENABLED=true
CACHE_ENABLED=true
LOGS_ENABLED=true

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
CORS_CREDENTIALS=true`;

            try {
                await fs.writeFile(envPath, envContent, 'utf8');
                console.log('✅ Creado: .env');
                this.fixes.push('Creado archivo de configuración de entorno');
            } catch (error) {
                this.errors.push(`Error creando .env: ${error.message}`);
            }
        }
    }

    async verifyPackageJson() {
        const packageJsonPath = path.join(this.backendDir, 'package.json');
        
        try {
            const content = await fs.readFile(packageJsonPath, 'utf8');
            const packageJson = JSON.parse(content);
            
            // Verificar que tenga las dependencias necesarias
            const requiredDeps = [
                'express', 'cors', 'helmet', 'compression', 'bcrypt', 
                'jsonwebtoken', 'sqlite3', 'sqlite', 'dotenv'
            ];
            
            const missingDeps = requiredDeps.filter(dep => 
                !packageJson.dependencies || !packageJson.dependencies[dep]
            );
            
            if (missingDeps.length > 0) {
                this.warnings.push(`Dependencias faltantes: ${missingDeps.join(', ')}`);
            } else {
                console.log('✅ package.json verificado');
            }
            
        } catch (error) {
            this.errors.push(`Error verificando package.json: ${error.message}`);
        }
    }

    async setupDatabase() {
        console.log('🗄️ CONFIGURANDO BASE DE DATOS...');
        
        try {
            // Ejecutar migraciones
            const { runMigrations } = await import('./migrate-database.js');
            await runMigrations();
            
            console.log('✅ Base de datos configurada exitosamente');
            this.fixes.push('Base de datos migrada y configurada');
            
        } catch (error) {
            this.errors.push(`Error configurando base de datos: ${error.message}`);
        }

        console.log('');
    }

    async verifyInstallation() {
        console.log('🔍 VERIFICANDO INSTALACIÓN...');
        
        const criticalFiles = [
            'package.json',
            'server.js',
            '.env',
            'config/database.js',
            'middleware/auth.js',
            'models/predefinedTherapy.js',
            'controllers/authController.js',
            'controllers/patientController.js',
            'controllers/seriesController.js',
            'controllers/sessionController.js',
            'controllers/dashboardController.js',
            'routes/authRoutes.js',
            'routes/patientRoutes.js',
            'routes/seriesRoutes.js',
            'routes/sessionRoutes.js',
            'routes/dashboardRoutes.js',
            'migrate-database.js'
        ];

        for (const file of criticalFiles) {
            const filePath = path.join(this.backendDir, file);
            
            try {
                await fs.access(filePath);
                console.log(`✅ ${file}`);
            } catch (error) {
                this.errors.push(`Archivo crítico faltante: ${file}`);
            }
        }

        console.log('');
    }

    async displaySummary() {
        console.log('📋 RESUMEN DE CONFIGURACIÓN');
        console.log('===========================');
        console.log(`✅ Correcciones aplicadas: ${this.fixes.length}`);
        console.log(`⚠️ Advertencias: ${this.warnings.length}`);
        console.log(`❌ Errores: ${this.errors.length}`);
        console.log('');

        if (this.fixes.length > 0) {
            console.log('✅ CORRECCIONES APLICADAS:');
            this.fixes.forEach((fix, index) => {
                console.log(`   ${index + 1}. ${fix}`);
            });
            console.log('');
        }

        if (this.warnings.length > 0) {
            console.log('⚠️ ADVERTENCIAS:');
            this.warnings.forEach((warning, index) => {
                console.log(`   ${index + 1}. ${warning}`);
            });
            console.log('');
        }

        if (this.errors.length > 0) {
            console.log('❌ ERRORES QUE REQUIEREN ATENCIÓN:');
            this.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
            console.log('');
        }

        if (this.errors.length === 0) {
            console.log('🎉 ¡CONFIGURACIÓN COMPLETADA EXITOSAMENTE!');
            console.log('');
            console.log('🚀 PRÓXIMOS PASOS:');
            console.log('   1. npm install (si no se han instalado las dependencias)');
            console.log('   2. npm run dev (para desarrollo)');
            console.log('   3. npm start (para producción)');
            console.log('');
            console.log('🌐 ACCESO A LA APLICACIÓN:');
            console.log('   http://localhost:3001');
            console.log('');
            console.log('👤 CREDENCIALES POR DEFECTO:');
            console.log('   Email: admin@softzen.com');
            console.log('   Password: SoftZen2024!');
            console.log('');
            console.log('⚠️ IMPORTANTE: Cambia las credenciales después del primer login');
        } else {
            console.log('⚠️ Configuración completada con errores. Revisa los mensajes arriba.');
        }
    }
}

// Ejecutar configurador
const setup = new SoftZenSetup();
setup.setup().catch(console.error);