import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;

export async function getDatabase() {
    if (!db) {
        const dbPath = path.join(__dirname, '..', 'database', 'therapy.db');
        
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        // Optimizaciones de rendimiento
        await db.exec('PRAGMA foreign_keys = ON');
        await db.exec('PRAGMA journal_mode = WAL');
        await db.exec('PRAGMA synchronous = NORMAL');
        await db.exec('PRAGMA cache_size = -64000');
        await db.exec('PRAGMA temp_store = MEMORY');
    }
    
    return db;
}

export async function closeDatabase() {
    if (db) {
        await db.close();
        db = null;
    }
}