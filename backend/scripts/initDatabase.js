import { initDatabase, closeDatabase } from '../config/database.js';

async function init() {
    try {
        console.log('🚀 Inicializando base de datos...');
        await initDatabase();
        console.log('✅ Base de datos inicializada correctamente');
        await closeDatabase();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error inicializando base de datos:', error);
        process.exit(1);
    }
}

init();