import bcrypt from 'bcryptjs';
import { getDatabase } from '../config/database.js';
import { generateToken } from '../middleware/auth.js';

export async function register(req, res) {
    try {
        const { 
            email, 
            password, 
            name, 
            role = 'instructor', 
            age, 
            condition, 
            phone, 
            instructorId,
            emergencyContact,
            specialization,
            bio
        } = req.body;

        console.log('Datos de registro recibidos:', { email, name, role, age, instructorId });

        // Validaciones básicas
        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                error: 'Email, contraseña y nombre son obligatorios',
                code: 'MISSING_REQUIRED_FIELDS'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'La contraseña debe tener al menos 6 caracteres',
                code: 'PASSWORD_TOO_SHORT'
            });
        }

        if (!['instructor', 'patient'].includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Rol inválido. Debe ser "instructor" o "patient"',
                code: 'INVALID_ROLE'
            });
        }

        const db = getDatabase();

        // Validaciones específicas para pacientes
        if (role === 'patient') {
            if (!age || age < 1 || age > 120) {
                return res.status(400).json({
                    success: false,
                    error: 'Edad es obligatoria y debe estar entre 1 y 120 años',
                    code: 'INVALID_AGE'
                });
            }

            if (!instructorId) {
                return res.status(400).json({
                    success: false,
                    error: 'Debe seleccionar un instructor',
                    code: 'INSTRUCTOR_REQUIRED'
                });
            }

            // Verificar que el instructor existe y está activo
            const instructor = await db.get(
                'SELECT id, name FROM users WHERE id = ? AND role = "instructor" AND is_active = 1',
                [instructorId]
            );

            if (!instructor) {
                return res.status(400).json({
                    success: false,
                    error: 'El instructor seleccionado no existe o no está disponible',
                    code: 'INVALID_INSTRUCTOR'
                });
            }
        }

        // Verificar si el usuario ya existe
        const existingUser = await db.get(
            'SELECT id FROM users WHERE email = ?',
            [email.toLowerCase()]
        );

        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'Ya existe un usuario con este email',
                code: 'USER_EXISTS'
            });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 12);

        // Crear usuario
        const userResult = await db.run(
            `INSERT INTO users (email, password, name, role, phone, specialization, bio) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                email.toLowerCase(), 
                hashedPassword, 
                name, 
                role, 
                phone || null,
                specialization || null,
                bio || null
            ]
        );

        const userId = userResult.lastID;

        // Si es paciente, crear registro completo
        let patientRecord = null;
        if (role === 'patient') {
            const patientResult = await db.run(`
                INSERT INTO patients (
                    user_id, instructor_id, name, email, age, condition, emergency_contact
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                userId, 
                instructorId, 
                name, 
                email.toLowerCase(), 
                age, 
                condition || null,
                emergencyContact || null
            ]);

            patientRecord = {
                id: patientResult.lastID,
                instructor_id: instructorId
            };

            // Crear notificación para el instructor
            await db.run(`
                INSERT INTO notifications (user_id, type, title, message, data) 
                VALUES (?, 'new_patient', 'Nuevo Paciente Registrado', ?, ?)
            `, [
                instructorId,
                `${name} se ha registrado como tu nuevo paciente. Revisa su perfil y asígnale una serie terapéutica.`,
                JSON.stringify({ 
                    patient_id: patientRecord.id, 
                    user_id: userId,
                    patient_name: name,
                    patient_email: email.toLowerCase()
                })
            ]);
        }

        // Obtener usuario completo
        const user = await db.get(
            'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
            [userId]
        );

        // Crear preferencias por defecto
        await db.run(`
            INSERT INTO user_preferences (user_id) VALUES (?)
        `, [userId]);

        // Log de analytics
        await db.run(`
            INSERT INTO analytics_events (user_id, event_type, event_data, ip_address, user_agent) 
            VALUES (?, 'user_registered', ?, ?, ?)
        `, [
            userId, 
            JSON.stringify({ 
                role, 
                patient_id: patientRecord?.id,
                instructor_id: role === 'patient' ? instructorId : null,
                timestamp: new Date().toISOString()
            }),
            req.ip || req.connection.remoteAddress,
            req.get('User-Agent')
        ]);

        // Generar token
        const token = generateToken(user);

        res.status(201).json({
            success: true,
            token,
            user: {
                ...user,
                patient_id: patientRecord?.id,
                instructor_id: patientRecord?.instructor_id
            },
            message: role === 'patient' 
                ? 'Registro exitoso. Tu cuenta está lista. Tu instructor te asignará una serie terapéutica pronto.'
                : 'Registro exitoso. Puedes comenzar a crear series terapéuticas y gestionar pacientes.'
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            code: 'INTERNAL_SERVER_ERROR'
        });
    }
}

export async function getAvailableInstructors(req, res) {
    try {
        const db = getDatabase();
        
        const instructors = await db.all(`
            SELECT 
                u.id, 
                u.name, 
                u.specialization,
                u.bio,
                COUNT(p.id) as patient_count
            FROM users u
            LEFT JOIN patients p ON u.id = p.instructor_id AND p.is_active = 1
            WHERE u.role = 'instructor' AND u.is_active = 1
            GROUP BY u.id, u.name, u.specialization, u.bio
            ORDER BY patient_count ASC, u.name ASC
        `);

        res.json({
            success: true,
            instructors: instructors.map(instructor => ({
                id: instructor.id,
                name: instructor.name,
                specialization: instructor.specialization || 'Yoga Terapéutico General',
                bio: instructor.bio || 'Instructor certificado en yoga terapéutico',
                patient_count: instructor.patient_count,
                availability: instructor.patient_count < 20 ? 'Disponible' : 'Cupo Limitado'
            }))
        });

    } catch (error) {
        console.error('Error obteniendo instructores:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo instructores disponibles',
            code: 'GET_INSTRUCTORS_ERROR'
        });
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email y contraseña son obligatorios',
                code: 'MISSING_CREDENTIALS'
            });
        }

        const db = getDatabase();

        // Buscar usuario
        const user = await db.get(
            'SELECT * FROM users WHERE email = ? AND is_active = 1',
            [email.toLowerCase()]
        );

        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Credenciales inválidas',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                error: 'Credenciales inválidas',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Obtener información adicional si es paciente
        let patientInfo = null;
        if (user.role === 'patient') {
            patientInfo = await db.get(`
                SELECT p.*, ts.name as series_name, ts.total_sessions, u.name as instructor_name
                FROM patients p
                LEFT JOIN therapy_series ts ON p.assigned_series_id = ts.id
                LEFT JOIN users u ON p.instructor_id = u.id
                WHERE p.user_id = ? AND p.is_active = 1
            `, [user.id]);
        }

        // Actualizar último login
        await db.run(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );

        // Log de analytics
        await db.run(`
            INSERT INTO analytics_events (user_id, event_type, event_data) 
            VALUES (?, 'user_login', ?)
        `, [user.id, JSON.stringify({ timestamp: new Date().toISOString() })]);

        // Generar token
        const token = generateToken(user);

        const responseUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            created_at: user.created_at,
            patient_info: patientInfo
        };

        res.json({
            success: true,
            token,
            user: responseUser,
            message: `Bienvenido/a, ${user.name}`
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            code: 'INTERNAL_SERVER_ERROR'
        });
    }
}

export async function getProfile(req, res) {
    try {
        const db = getDatabase();
        
        let profile = await db.get(`
            SELECT u.*, up.theme, up.language, up.notifications_enabled
            FROM users u
            LEFT JOIN user_preferences up ON u.id = up.user_id
            WHERE u.id = ?
        `, [req.user.id]);

        if (req.user.role === 'patient') {
            const patientInfo = await db.get(`
                SELECT p.*, ts.name as series_name, ts.total_sessions, 
                       u.name as instructor_name, u.email as instructor_email
                FROM patients p
                LEFT JOIN therapy_series ts ON p.assigned_series_id = ts.id
                LEFT JOIN users u ON p.instructor_id = u.id
                WHERE p.user_id = ?
            `, [req.user.id]);
            
            profile.patient_info = patientInfo;
        }

        delete profile.password;

        res.json({ 
            success: true,
            user: profile 
        });
    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo perfil',
            code: 'PROFILE_ERROR'
        });
    }
}

export async function updateProfile(req, res) {
    try {
        const { name, phone, bio, specialization, age, condition, emergency_contact } = req.body;
        const db = getDatabase();

        // Actualizar datos básicos del usuario
        await db.run(`
            UPDATE users 
            SET name = COALESCE(?, name), 
                phone = COALESCE(?, phone), 
                bio = COALESCE(?, bio),
                specialization = COALESCE(?, specialization)
            WHERE id = ?
        `, [name, phone, bio, specialization, req.user.id]);

        // Si es paciente, actualizar también datos específicos
        if (req.user.role === 'patient') {
            await db.run(`
                UPDATE patients 
                SET name = COALESCE(?, name),
                    age = COALESCE(?, age),
                    condition = COALESCE(?, condition),
                    emergency_contact = COALESCE(?, emergency_contact)
                WHERE user_id = ?
            `, [name, age, condition, emergency_contact, req.user.id]);
        }

        res.json({ 
            success: true,
            message: 'Perfil actualizado exitosamente' 
        });
    } catch (error) {
        console.error('Error actualizando perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Error actualizando perfil',
            code: 'UPDATE_PROFILE_ERROR'
        });
    }
}

export async function changePassword(req, res) {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Contraseña actual y nueva son obligatorias',
                code: 'MISSING_PASSWORDS'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'La nueva contraseña debe tener al menos 6 caracteres',
                code: 'PASSWORD_TOO_SHORT'
            });
        }

        const db = getDatabase();
        const user = await db.get('SELECT password FROM users WHERE id = ?', [req.user.id]);

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                error: 'Contraseña actual incorrecta',
                code: 'INVALID_CURRENT_PASSWORD'
            });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, req.user.id]);

        // Log analytics
        await db.run(`
            INSERT INTO analytics_events (user_id, event_type, event_data) 
            VALUES (?, 'password_changed', ?)
        `, [req.user.id, JSON.stringify({ timestamp: new Date().toISOString() })]);

        res.json({ 
            success: true,
            message: 'Contraseña cambiada exitosamente' 
        });
    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        res.status(500).json({
            success: false,
            error: 'Error cambiando contraseña',
            code: 'CHANGE_PASSWORD_ERROR'
        });
    }
}