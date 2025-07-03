const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

class Database {
    constructor() {
        this.db = null;
    }

    init() {
        const dbPath = path.join(__dirname, 'yoga_therapy.db');
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error conectando a la base de datos:', err.message);
            } else {
                console.log('Conectado a la base de datos SQLite');
                this.createTables();
            }
        });
    }

    async createTables() {
        return new Promise((resolve, reject) => {
            // Tabla de usuarios
            this.db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'patient',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                profile_data TEXT
            )`, (err) => {
                if (err) {
                    console.error('Error creando tabla users:', err.message);
                    reject(err);
                } else {
                    console.log('Tabla users creada correctamente');
                    this.createPoses();
                }
            });
        });
    }

    createPoses() {
        // Tabla de posturas
        this.db.run(`CREATE TABLE IF NOT EXISTS poses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            sanskrit_name TEXT,
            category TEXT,
            difficulty TEXT,
            duration INTEGER DEFAULT 60,
            instructions TEXT,
            benefits TEXT,
            modifications TEXT,
            contraindications TEXT,
            image_url TEXT,
            video_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creando tabla poses:', err.message);
            } else {
                console.log('Tabla poses creada correctamente');
                this.createSessions();
            }
        });
    }

    createSessions() {
        // Tabla de sesiones
        this.db.run(`CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT NOT NULL,
            poses TEXT,
            total_duration INTEGER DEFAULT 0,
            completed BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME,
            notes TEXT,
            rating INTEGER,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`, (err) => {
            if (err) {
                console.error('Error creando tabla sessions:', err.message);
            } else {
                console.log('Tabla sessions creada correctamente');
                this.createProgress();
            }
        });
    }

    createProgress() {
        // Tabla de progreso
        this.db.run(`CREATE TABLE IF NOT EXISTS progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            session_id INTEGER,
            pose_id INTEGER,
            duration_completed INTEGER,
            difficulty_rating INTEGER,
            pain_level INTEGER,
            notes TEXT,
            completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (session_id) REFERENCES sessions (id),
            FOREIGN KEY (pose_id) REFERENCES poses (id)
        )`, (err) => {
            if (err) {
                console.error('Error creando tabla progress:', err.message);
            } else {
                console.log('Tabla progress creada correctamente');
                this.insertDefaultData();
            }
        });
    }

    async insertDefaultData() {
        try {
            // Verificar si ya hay usuarios
            const userCount = await this.countUsers();
            if (userCount === 0) {
                await this.createDefaultUsers();
            }

            // Verificar si ya hay posturas
            const poseCount = await this.countPoses();
            if (poseCount === 0) {
                await this.createDefaultPoses();
            }

            console.log('Base de datos inicializada con datos por defecto');
        } catch (error) {
            console.error('Error insertando datos por defecto:', error);
        }
    }

    countUsers() {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
    }

    countPoses() {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT COUNT(*) as count FROM poses', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
    }

    async createDefaultUsers() {
        const defaultUsers = [
            {
                username: 'admin',
                email: 'admin@softzen.com',
                password: await bcrypt.hash('admin123', 10),
                role: 'therapist'
            },
            {
                username: 'paciente1',
                email: 'paciente1@softzen.com',
                password: await bcrypt.hash('paciente123', 10),
                role: 'patient'
            },
            {
                username: 'demo',
                email: 'demo@softzen.com',
                password: await bcrypt.hash('demo123', 10),
                role: 'patient'
            }
        ];

        for (const user of defaultUsers) {
            await this.insertUser(user);
        }
    }

    insertUser(user) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
                [user.username, user.email, user.password, user.role],
                function(err) {
                    if (err) {
                        console.error('Error insertando usuario:', err.message);
                        reject(err);
                    } else {
                        console.log(`Usuario ${user.username} creado con ID: ${this.lastID}`);
                        resolve(this.lastID);
                    }
                }
            );
        });
    }

    async createDefaultPoses() {
        const defaultPoses = [
            {
                name: 'Gato-Vaca',
                sanskrit_name: 'Marjaryasana-Bitilasana',
                category: 'movilidad',
                difficulty: 'principiante',
                duration: 300,
                instructions: '1. Comienza en posición de cuatro patas con las muñecas debajo de los hombros y las rodillas debajo de las caderas.\n2. Inhala y arquea la espalda, llevando el pecho hacia arriba y la mirada hacia el techo (postura de la vaca).\n3. Exhala y redondea la espalda hacia el techo, llevando la barbilla hacia el pecho (postura del gato).\n4. Repite el movimiento de forma fluida siguiendo tu respiración.',
                benefits: 'Mejora la flexibilidad de la columna vertebral, alivia la tensión en la espalda, mejora la postura, calma la mente y reduce el estrés.',
                modifications: 'Si tienes problemas en las muñecas, puedes apoyarte en los antebrazos. Si las rodillas te molestan, coloca una manta debajo.',
                contraindications: 'Evitar si hay lesiones graves en el cuello o la espalda.',
                image_url: '/images/poses/gato-vaca.jpg',
                video_url: '/videos/poses/gato-vaca.mp4'
            },
            {
                name: 'Postura del Árbol',
                sanskrit_name: 'Vrksasana',
                category: 'equilibrio',
                difficulty: 'intermedio',
                duration: 180,
                instructions: '1. Párate en posición de montaña con los pies juntos.\n2. Dobla la rodilla derecha y coloca la planta del pie derecho en la parte interna del muslo izquierdo.\n3. Presiona el pie contra la pierna y la pierna contra el pie.\n4. Lleva las manos al centro del pecho en posición de oración.\n5. Mantén la mirada fija en un punto frente a ti.\n6. Repite del otro lado.',
                benefits: 'Mejora el equilibrio y la concentración, fortalece las piernas y el core, mejora la postura.',
                modifications: 'Puedes apoyar el pie en el tobillo o la pantorrilla, nunca en la rodilla. Usa una pared para apoyo si es necesario.',
                contraindications: 'Problemas de equilibrio severos, lesiones en tobillos o rodillas.',
                image_url: '/images/poses/arbol.jpg',
                video_url: '/videos/poses/arbol.mp4'
            },
            {
                name: 'Postura del Niño',
                sanskrit_name: 'Balasana',
                category: 'restaurativa',
                difficulty: 'principiante',
                duration: 300,
                instructions: '1. Comienza arrodillado en el suelo.\n2. Siéntate sobre los talones.\n3. Abre las rodillas al ancho de las caderas.\n4. Inclínate hacia adelante desde las caderas.\n5. Extiende los brazos hacia adelante o a los lados del cuerpo.\n6. Descansa la frente en el suelo.',
                benefits: 'Calma el sistema nervioso, alivia el estrés y la ansiedad, estira la espalda baja y las caderas.',
                modifications: 'Coloca un cojín bajo las rodillas o entre los muslos y pantorrillas. Usa una manta sobre la espalda.',
                contraindications: 'Lesiones en las rodillas, embarazo avanzado.',
                image_url: '/images/poses/nino.jpg',
                video_url: '/videos/poses/nino.mp4'
            },
            {
                name: 'Perro Boca Abajo',
                sanskrit_name: 'Adho Mukha Svanasana',
                category: 'fuerza',
                difficulty: 'intermedio',
                duration: 240,
                instructions: '1. Comienza en cuatro patas.\n2. Mete los dedos de los pies bajo el cuerpo.\n3. Levanta las caderas hacia arriba y atrás.\n4. Estira las piernas y los brazos.\n5. Forma una V invertida con el cuerpo.\n6. Mantén la cabeza relajada entre los brazos.',
                benefits: 'Fortalece brazos y piernas, estira la columna vertebral, mejora la circulación, energiza el cuerpo.',
                modifications: 'Dobla ligeramente las rodillas, usa bloques bajo las manos, o practica contra una pared.',
                contraindications: 'Síndrome del túnel carpiano, presión arterial alta, embarazo avanzado.',
                image_url: '/images/poses/perro-boca-abajo.jpg',
                video_url: '/videos/poses/perro-boca-abajo.mp4'
            },
            {
                name: 'Guerrero I',
                sanskrit_name: 'Virabhadrasana I',
                category: 'fuerza',
                difficulty: 'intermedio',
                duration: 180,
                instructions: '1. Desde posición de pie, da un gran paso hacia atrás con el pie izquierdo.\n2. Gira el pie trasero 45 grados hacia afuera.\n3. Dobla la rodilla delantera hasta formar un ángulo de 90 grados.\n4. Cuadra las caderas hacia adelante.\n5. Levanta los brazos por encima de la cabeza.\n6. Repite del otro lado.',
                benefits: 'Fortalece las piernas y el core, mejora el equilibrio, abre el pecho y los hombros.',
                modifications: 'Usa bloques bajo las manos, acorta la postura, apóyate en una pared.',
                contraindications: 'Problemas de rodilla o cadera, presión arterial alta.',
                image_url: '/images/poses/guerrero1.jpg',
                video_url: '/videos/poses/guerrero1.mp4'
            },
            {
                name: 'Torsión Sentada',
                sanskrit_name: 'Ardha Matsyendrasana',
                category: 'flexibilidad',
                difficulty: 'intermedio',
                duration: 240,
                instructions: '1. Siéntate con las piernas extendidas.\n2. Dobla la rodilla derecha y coloca el pie al lado exterior de la rodilla izquierda.\n3. Mantén la pierna izquierda extendida.\n4. Coloca la mano derecha detrás de ti para apoyo.\n5. Abraza la rodilla derecha con el brazo izquierdo.\n6. Gira suavemente hacia la derecha.\n7. Repite del otro lado.',
                benefits: 'Mejora la digestión, desintoxica los órganos internos, aumenta la flexibilidad de la columna.',
                modifications: 'Siéntate sobre una manta o cojín, usa la pared como apoyo para la espalda.',
                contraindications: 'Lesiones en la espalda baja, hernia discal.',
                image_url: '/images/poses/torsion-sentada.jpg',
                video_url: '/videos/poses/torsion-sentada.mp4'
            }
        ];

        for (const pose of defaultPoses) {
            await this.insertPose(pose);
        }
    }

    insertPose(pose) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO poses (name, sanskrit_name, category, difficulty, duration, instructions, benefits, modifications, contraindications, image_url, video_url) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [pose.name, pose.sanskrit_name, pose.category, pose.difficulty, pose.duration, 
                 pose.instructions, pose.benefits, pose.modifications, pose.contraindications, 
                 pose.image_url, pose.video_url],
                function(err) {
                    if (err) {
                        console.error('Error insertando postura:', err.message);
                        reject(err);
                    } else {
                        console.log(`Postura ${pose.name} creada con ID: ${this.lastID}`);
                        resolve(this.lastID);
                    }
                }
            );
        });
    }

    // Métodos de consulta
    findUserByUsername(username) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    findUserByEmail(email) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    getAllPoses() {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM poses ORDER BY name', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    getPoseById(id) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM poses WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    createSession(sessionData) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO sessions (user_id, name, poses, total_duration, notes) VALUES (?, ?, ?, ?, ?)',
                [sessionData.user_id, sessionData.name, JSON.stringify(sessionData.poses), 
                 sessionData.total_duration, sessionData.notes],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    getUserSessions(userId) {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    updateSessionCompletion(sessionId, completed = true, rating = null, notes = '') {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE sessions SET completed = ?, completed_at = CURRENT_TIMESTAMP, rating = ?, notes = ? WHERE id = ?',
                [completed, rating, notes, sessionId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    recordProgress(progressData) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO progress (user_id, session_id, pose_id, duration_completed, difficulty_rating, pain_level, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [progressData.user_id, progressData.session_id, progressData.pose_id, 
                 progressData.duration_completed, progressData.difficulty_rating, 
                 progressData.pain_level, progressData.notes],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    getUserProgress(userId, limit = 50) {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT p.*, s.name as session_name, po.name as pose_name 
                 FROM progress p 
                 JOIN sessions s ON p.session_id = s.id 
                 JOIN poses po ON p.pose_id = po.id 
                 WHERE p.user_id = ? 
                 ORDER BY p.completed_at DESC 
                 LIMIT ?`,
                [userId, limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    getKPIs(userId) {
        return new Promise((resolve, reject) => {
            const queries = [
                // Total de sesiones completadas
                'SELECT COUNT(*) as total_sessions FROM sessions WHERE user_id = ? AND completed = 1',
                // Tiempo total practicado
                'SELECT SUM(total_duration) as total_time FROM sessions WHERE user_id = ? AND completed = 1',
                // Promedio de calificación
                'SELECT AVG(rating) as avg_rating FROM sessions WHERE user_id = ? AND rating IS NOT NULL',
                // Días consecutivos
                'SELECT COUNT(DISTINCT DATE(completed_at)) as practice_days FROM sessions WHERE user_id = ? AND completed = 1 AND completed_at >= date("now", "-30 days")',
                // Progreso por categoría
                'SELECT po.category, COUNT(*) as count FROM progress p JOIN poses po ON p.pose_id = po.id WHERE p.user_id = ? GROUP BY po.category'
            ];

            const results = {};
            let completed = 0;
            
            const executeQuery = (query, params, key) => {
                this.db.get(query, params, (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    results[key] = row;
                    completed++;
                    if (completed === queries.length) {
                        resolve(results);
                    }
                });
            };

            executeQuery(queries[0], [userId], 'totalSessions');
            executeQuery(queries[1], [userId], 'totalTime');
            executeQuery(queries[2], [userId], 'avgRating');
            executeQuery(queries[3], [userId], 'practiceDays');
            
            // Para categorías necesitamos una consulta diferente
            this.db.all(queries[4], [userId], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                results.categories = rows;
                completed++;
                if (completed === queries.length) {
                    resolve(results);
                }
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error cerrando la base de datos:', err.message);
                } else {
                    console.log('Conexión a la base de datos cerrada');
                }
            });
        }
    }
}

module.exports = new Database();
