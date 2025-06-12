import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

export async function initDatabase() {
  try {
    db = await open({
      filename: path.join(__dirname, '../database/therapy.db'),
      driver: sqlite3.Database
    });

    // Configuraciones de rendimiento para SQLite
    await db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA cache_size = 1000;
      PRAGMA temp_store = MEMORY;
      PRAGMA mmap_size = 268435456;
      PRAGMA foreign_keys = ON;
    `);

    // Crear tablas
    await createTables();
    console.log('🗄️ Tablas creadas/verificadas correctamente');
    
    return db;
  } catch (error) {
    console.error('Error inicializando base de datos:', error);
    throw error;
  }
}

async function createTables() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('instructor', 'patient')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      is_active BOOLEAN DEFAULT 1,
      avatar_url TEXT,
      phone TEXT,
      specialization TEXT,
      bio TEXT
    );

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      instructor_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      age INTEGER NOT NULL,
      condition TEXT,
      emergency_contact TEXT,
      medical_notes TEXT,
      assigned_series_id INTEGER,
      current_session INTEGER DEFAULT 0,
      total_sessions_completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
      FOREIGN KEY (instructor_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_series_id) REFERENCES therapy_series (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS therapy_series (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      therapy_type TEXT NOT NULL,
      postures TEXT NOT NULL, -- JSON array
      total_sessions INTEGER NOT NULL,
      difficulty_level TEXT DEFAULT 'beginner',
      estimated_duration INTEGER, -- en minutos
      instructor_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT 1,
      is_template BOOLEAN DEFAULT 0,
      FOREIGN KEY (instructor_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      series_id INTEGER NOT NULL,
      session_number INTEGER NOT NULL,
      pain_before INTEGER CHECK (pain_before >= 0 AND pain_before <= 10),
      pain_after INTEGER CHECK (pain_after >= 0 AND pain_after <= 10),
      mood_before TEXT,
      mood_after TEXT,
      comments TEXT NOT NULL,
      duration_minutes INTEGER,
      postures_completed INTEGER DEFAULT 0,
      postures_skipped INTEGER DEFAULT 0,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE,
      FOREIGN KEY (series_id) REFERENCES therapy_series (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      data TEXT, -- JSON para datos adicionales
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      patient_id INTEGER,
      event_type TEXT NOT NULL,
      event_data TEXT, -- JSON
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
      FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      theme TEXT DEFAULT 'light',
      language TEXT DEFAULT 'es',
      notifications_enabled BOOLEAN DEFAULT 1,
      email_notifications BOOLEAN DEFAULT 1,
      push_notifications BOOLEAN DEFAULT 1,
      timezone TEXT DEFAULT 'America/Mexico_City',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    -- Índices para optimizar consultas
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_patients_instructor ON patients(instructor_id);
    CREATE INDEX IF NOT EXISTS idx_patients_user ON patients(user_id);
    CREATE INDEX IF NOT EXISTS idx_patients_active ON patients(is_active);
    CREATE INDEX IF NOT EXISTS idx_series_instructor ON therapy_series(instructor_id);
    CREATE INDEX IF NOT EXISTS idx_series_type ON therapy_series(therapy_type);
    CREATE INDEX IF NOT EXISTS idx_sessions_patient ON sessions(patient_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_series ON sessions(series_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(completed_at);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_analytics_user_date ON analytics_events(user_id, created_at);

    -- Triggers para mantener updated_at
    CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
      AFTER UPDATE ON users
      BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

    CREATE TRIGGER IF NOT EXISTS update_patients_timestamp 
      AFTER UPDATE ON patients
      BEGIN
        UPDATE patients SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

    CREATE TRIGGER IF NOT EXISTS update_series_timestamp 
      AFTER UPDATE ON therapy_series
      BEGIN
        UPDATE therapy_series SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

    -- Trigger para actualizar total_sessions_completed
    CREATE TRIGGER IF NOT EXISTS update_patient_sessions_count
      AFTER INSERT ON sessions
      BEGIN
        UPDATE patients 
        SET total_sessions_completed = total_sessions_completed + 1,
            current_session = NEW.session_number
        WHERE id = NEW.patient_id;
      END;
  `);
}

export function getDatabase() {
  if (!db) {
    throw new Error('Base de datos no inicializada. Llama a initDatabase() primero.');
  }
  return db;
}

export async function closeDatabase() {
  if (db) {
    await db.close();
    console.log('🔐 Base de datos cerrada');
  }
}