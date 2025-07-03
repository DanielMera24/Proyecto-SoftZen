import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script de migración para crear la estructura completa de la base de datos
 * Enfoque en sostenibilidad, escalabilidad y rendimiento
 */

async function createConnection() {
    const dbPath = path.join(__dirname, 'database', 'therapy.db');
    
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Habilitar claves foráneas y WAL mode para mejor rendimiento
    await db.exec('PRAGMA foreign_keys = ON');
    await db.exec('PRAGMA journal_mode = WAL');
    await db.exec('PRAGMA synchronous = NORMAL');
    await db.exec('PRAGMA cache_size = -64000'); // 64MB cache
    await db.exec('PRAGMA temp_store = MEMORY');
    
    return db;
}

async function runMigrations() {
    const db = await createConnection();
    
    console.log('🚀 Iniciando migraciones de SoftZen...');
    
    try {
        // Crear tabla de versiones de migración si no existe
        await db.exec(`
            CREATE TABLE IF NOT EXISTS migration_versions (
                version INTEGER PRIMARY KEY,
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                description TEXT
            )
        `);

        // Verificar versión actual
        const currentVersion = await db.get(
            'SELECT MAX(version) as version FROM migration_versions'
        );
        const version = currentVersion?.version || 0;
        
        console.log(`📌 Versión actual de la base de datos: ${version}`);

        // Aplicar todas las migraciones necesarias
        if (version < 1) {
            console.log('⬆️ Aplicando migración v1: Estructura completa');
            await createCompleteSchema(db);
            await db.run(
                'INSERT INTO migration_versions (version, description) VALUES (?, ?)',
                [1, 'Estructura completa de la base de datos']
            );
        }

        console.log('✅ Todas las migraciones aplicadas exitosamente');
        
        // Verificar integridad
        await verifyDatabaseIntegrity(db);
        
        // Crear usuario administrador por defecto si no existe
        await createDefaultDataIfNeeded(db);
        
    } catch (error) {
        console.error('❌ Error durante las migraciones:', error);
        throw error;
    } finally {
        await db.close();
    }
}

/**
 * Crear esquema completo de la base de datos
 */
async function createCompleteSchema(db) {
    // Tabla de usuarios principal
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT CHECK(role IN ('instructor', 'patient')) DEFAULT 'patient',
            phone TEXT,
            age INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME,
            is_active BOOLEAN DEFAULT 1,
            email_verified BOOLEAN DEFAULT 0,
            terms_accepted_at DATETIME,
            failed_attempts INTEGER DEFAULT 0,
            locked_until DATETIME,
            specialties TEXT
        )
    `);

    // Tabla de series de terapia
    await db.exec(`
        CREATE TABLE IF NOT EXISTS therapy_series (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            instructor_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            therapy_type TEXT NOT NULL,
            postures TEXT NOT NULL,
            total_sessions INTEGER NOT NULL,
            difficulty_level TEXT CHECK(difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
            estimated_duration INTEGER,
            min_age INTEGER,
            max_age INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 1,
            FOREIGN KEY (instructor_id) REFERENCES users(id)
        )
    `);

    // Tabla de pacientes
    await db.exec(`
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            instructor_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            age INTEGER,
            condition TEXT,
            emergency_contact TEXT,
            phone TEXT,
            medical_notes TEXT,
            allergies TEXT,
            medications TEXT,
            goals TEXT,
            preferences TEXT,
            assigned_series_id INTEGER,
            current_session INTEGER DEFAULT 0,
            total_sessions_completed INTEGER DEFAULT 0,
            series_assigned_at DATETIME,
            series_customization TEXT,
            series_start_date DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            deleted_at DATETIME,
            is_active BOOLEAN DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (instructor_id) REFERENCES users(id),
            FOREIGN KEY (assigned_series_id) REFERENCES therapy_series(id)
        )
    `);

    // Tabla de sesiones
    await db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            series_id INTEGER,
            session_number INTEGER NOT NULL,
            pain_before INTEGER CHECK(pain_before >= 0 AND pain_before <= 10),
            pain_after INTEGER CHECK(pain_after >= 0 AND pain_after <= 10),
            mood_before INTEGER CHECK(mood_before >= 1 AND mood_before <= 5),
            mood_after INTEGER CHECK(mood_after >= 1 AND mood_after <= 5),
            comments TEXT,
            duration_minutes INTEGER,
            postures_completed INTEGER DEFAULT 0,
            postures_skipped INTEGER DEFAULT 0,
            rating INTEGER CHECK(rating >= 1 AND rating <= 5),
            completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id),
            FOREIGN KEY (series_id) REFERENCES therapy_series(id)
        )
    `);

    // Tabla de eventos de analytics
    await db.exec(`
        CREATE TABLE IF NOT EXISTS analytics_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            patient_id INTEGER,
            series_id INTEGER,
            session_id INTEGER,
            event_type TEXT NOT NULL,
            event_data TEXT,
            ip_address TEXT,
            user_agent TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (patient_id) REFERENCES patients(id),
            FOREIGN KEY (series_id) REFERENCES therapy_series(id),
            FOREIGN KEY (session_id) REFERENCES sessions(id)
        )
    `);

    // Tabla de notificaciones
    await db.exec(`
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            data TEXT,
            is_read BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            read_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // Tabla de logs de seguridad
    await db.exec(`
        CREATE TABLE IF NOT EXISTS security_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            user_id INTEGER,
            ip_address TEXT,
            user_agent TEXT,
            event_data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // Tabla de estadísticas de usuario
    await db.exec(`
        CREATE TABLE IF NOT EXISTS user_stats (
            user_id INTEGER PRIMARY KEY,
            total_logins INTEGER DEFAULT 0,
            last_activity DATETIME,
            total_sessions INTEGER DEFAULT 0,
            total_practice_time INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // Tabla de configuraciones del sistema
    await db.exec(`
        CREATE TABLE IF NOT EXISTS system_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            description TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_by INTEGER,
            FOREIGN KEY (updated_by) REFERENCES users(id)
        )
    `);

    console.log('📊 Creando índices de rendimiento...');

    // Índices optimizados para consultas frecuentes
    const indices = [
        'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
        'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
        'CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)',
        'CREATE INDEX IF NOT EXISTS idx_patients_instructor ON patients(instructor_id)',
        'CREATE INDEX IF NOT EXISTS idx_patients_user ON patients(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_patients_series ON patients(assigned_series_id)',
        'CREATE INDEX IF NOT EXISTS idx_patients_active ON patients(is_active)',
        'CREATE INDEX IF NOT EXISTS idx_series_instructor ON therapy_series(instructor_id)',
        'CREATE INDEX IF NOT EXISTS idx_series_type ON therapy_series(therapy_type)',
        'CREATE INDEX IF NOT EXISTS idx_series_active ON therapy_series(is_active)',
        'CREATE INDEX IF NOT EXISTS idx_sessions_patient ON sessions(patient_id)',
        'CREATE INDEX IF NOT EXISTS idx_sessions_series ON sessions(series_id)',
        'CREATE INDEX IF NOT EXISTS idx_sessions_completed ON sessions(completed_at)',
        'CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type)',
        'CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read)',
        'CREATE INDEX IF NOT EXISTS idx_security_logs_user ON security_logs(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_security_logs_type ON security_logs(event_type)'
    ];

    for (const indexSQL of indices) {
        await db.exec(indexSQL);
    }

    // Insertar configuraciones por defecto
    const defaultSettings = [
        ['app_version', '2.0.0', 'Versión actual de la aplicación'],
        ['maintenance_mode', '0', 'Modo de mantenimiento'],
        ['max_sessions_per_day', '5', 'Máximo de sesiones por día'],
        ['session_timeout', '30', 'Timeout de sesión en minutos'],
        ['analytics_enabled', '1', 'Analytics habilitado']
    ];

    for (const [key, value, description] of defaultSettings) {
        await db.run(
            'INSERT OR IGNORE INTO system_settings (key, value, description) VALUES (?, ?, ?)',
            [key, value, description]
        );
    }
}

/**
 * Verificar integridad de la base de datos
 */
async function verifyDatabaseIntegrity(db) {
    console.log('🔍 Verificando integridad de la base de datos...');
    
    try {
        // Verificar integridad de SQLite
        const integrityCheck = await db.get('PRAGMA integrity_check');
        if (integrityCheck.integrity_check !== 'ok') {
            throw new Error('Fallo en verificación de integridad');
        }

        // Verificar existencia de tablas principales
        const requiredTables = [
            'users', 'therapy_series', 'patients', 'sessions',
            'analytics_events', 'notifications', 'security_logs',
            'user_stats', 'system_settings', 'migration_versions'
        ];

        for (const table of requiredTables) {
            const tableExists = await db.get(
                "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
                [table]
            );
            
            if (!tableExists) {
                throw new Error(`Tabla requerida '${table}' no encontrada`);
            }
        }

        console.log('✅ Verificación de integridad completada');
        
    } catch (error) {
        console.error('❌ Error en verificación de integridad:', error);
        throw error;
    }
}

/**
 * Crear datos por defecto si es necesario
 */
async function createDefaultDataIfNeeded(db) {
    const userCount = await db.get('SELECT COUNT(*) as count FROM users');
    
    if (userCount.count === 0) {
        console.log('💡 Base de datos vacía, creando usuario administrador...');
        
        // Importar bcrypt dinámicamente
        const bcrypt = await import('bcrypt');
        const hashedPassword = await bcrypt.default.hash('SoftZen2024!', 12);
        
        await db.run(`
            INSERT INTO users (name, email, password, role, is_active, email_verified, created_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
            'Administrador SoftZen',
            'admin@softzen.com',
            hashedPassword,
            'instructor',
            1,
            1
        ]);
        
        console.log('👤 Usuario administrador creado:');
        console.log('   Email: admin@softzen.com');
        console.log('   Password: SoftZen2024!');
        console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
    }
}

/**
 * Función principal
 */
async function main() {
    try {
        await runMigrations();
        console.log('🎉 ¡Migraciones de SoftZen completadas exitosamente!');
        console.log('🚀 La aplicación está lista para ejecutarse');
    } catch (error) {
        console.error('💥 Error fatal durante las migraciones:', error);
        process.exit(1);
    }
}

// Ejecutar solo si este archivo es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { runMigrations, createConnection };