import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'soft_zen_secret_key_2024_v2_secure';

/**
 * AuthController - Controlador de autenticación optimizado
 * Enfoque en rendimiento, sostenibilidad y escalabilidad
 */
class AuthController {
    constructor() {
        // Cache para tokens revocados (en producción usar Redis)
        this.revokedTokens = new Set();
        
        // Rate limiting interno por IP
        this.attemptCache = new Map();
        
        // Configuración de seguridad optimizada
        this.config = {
            maxLoginAttempts: 5,
            lockoutDuration: 15 * 60 * 1000, // 15 minutos
            tokenExpiry: '24h',
            refreshTokenExpiry: '7d',
            saltRounds: 12,
            passwordMinLength: 8,
            maxPasswordLength: 128
        };

        // Cleanup automático cada 30 minutos
        setInterval(() => {
            this.cleanupCaches();
        }, 30 * 60 * 1000);
    }

    /**
     * Login optimizado con rate limiting y seguridad mejorada
     */
    async login(req, res) {
        try {
            const { email, password, rememberMe = false } = req.body;
            const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

            // Validación de entrada exhaustiva
            const validation = this.validateLoginData({ email, password });
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    message: validation.message,
                    code: 'VALIDATION_ERROR',
                    errors: validation.errors
                });
            }

            // Verificar rate limiting
            const rateLimitResult = this.checkRateLimit(clientIP);
            if (!rateLimitResult.allowed) {
                console.log(`🚫 Rate limit exceeded for IP: ${clientIP}`);
                return res.status(429).json({
                    success: false,
                    message: `Demasiados intentos fallidos. Intenta en ${Math.ceil(rateLimitResult.timeUntilReset / 60000)} minutos`,
                    code: 'RATE_LIMITED',
                    timeUntilReset: rateLimitResult.timeUntilReset
                });
            }

            // Buscar usuario por email (más seguro que username)
            const db = getDatabase();
            const user = await db.get(
                'SELECT * FROM users WHERE email = ? AND is_active = 1', 
                [email.toLowerCase().trim()]
            );
            
            if (!user) {
                this.recordFailedAttempt(clientIP);
                
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            // Verificar si la cuenta está bloqueada
            if (user.locked_until && new Date() < new Date(user.locked_until)) {
                return res.status(423).json({
                    success: false,
                    message: 'Cuenta temporalmente bloqueada. Contacta al administrador.',
                    code: 'ACCOUNT_LOCKED'
                });
            }

            // Verificar contraseña con timing attack protection
            const isValidPassword = await this.verifyPasswordSecure(password, user.password);
            
            if (!isValidPassword) {
                this.recordFailedAttempt(clientIP);
                
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            // Reset failed attempts on successful login
            this.clearFailedAttempts(clientIP);
            await db.run(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP, failed_attempts = 0 WHERE id = ?', 
                [user.id]
            );

            // Generar tokens
            const tokenExpiry = rememberMe ? this.config.refreshTokenExpiry : this.config.tokenExpiry;
            const tokens = await this.generateTokens(user, tokenExpiry);

            // Preparar respuesta segura
            const { password: _, ...userSafe } = user;
            
            console.log(`✅ Login exitoso: ${user.email} desde ${clientIP}`);

            res.json({
                success: true,
                message: 'Login exitoso',
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresIn: tokens.expiresIn,
                user: {
                    ...userSafe,
                    lastLogin: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('❌ Error en login:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    /**
     * Registro optimizado con validaciones avanzadas
     */
    async register(req, res) {
        try {
            const { 
                name, 
                email, 
                password, 
                confirmPassword,
                role = 'patient', 
                age, 
                instructorId,
                phone,
                termsAccepted 
            } = req.body;

            // Validación de entrada mejorada
            const validation = this.validateRegistrationData({ 
                name, email, password, confirmPassword, role, age, termsAccepted 
            });
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    message: validation.message,
                    code: 'VALIDATION_ERROR',
                    errors: validation.errors
                });
            }

            const normalizedEmail = email.toLowerCase().trim();
            const db = getDatabase();

            // Verificar disponibilidad con transacción optimizada
            const existingUser = await db.get(
                'SELECT id, email, role FROM users WHERE email = ?', 
                [normalizedEmail]
            );
            
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'El email ya está registrado',
                    code: 'EMAIL_TAKEN'
                });
            }

            // Para pacientes, verificar que el instructor existe y está activo
            if (role === 'patient' && instructorId) {
                const instructor = await db.get(
                    'SELECT id, name FROM users WHERE id = ? AND role = "instructor" AND is_active = 1', 
                    [instructorId]
                );
                
                if (!instructor) {
                    return res.status(400).json({
                        success: false,
                        message: 'Instructor no válido o inactivo',
                        code: 'INVALID_INSTRUCTOR'
                    });
                }
            }

            // Hash de contraseña con salt fuerte
            const hashedPassword = await bcrypt.hash(password, this.config.saltRounds);

            // Crear usuario con transacción para atomicidad
            await db.run('BEGIN TRANSACTION');

            try {
                const userData = {
                    name: name.trim(),
                    email: normalizedEmail,
                    password: hashedPassword,
                    role,
                    phone: phone?.trim() || null,
                    age: role === 'patient' ? parseInt(age) : null,
                    created_at: new Date().toISOString(),
                    is_active: true,
                    email_verified: false,
                    terms_accepted_at: termsAccepted ? new Date().toISOString() : null
                };

                const result = await db.run(`
                    INSERT INTO users (name, email, password, role, phone, age, created_at, is_active, email_verified, terms_accepted_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    userData.name, userData.email, userData.password, userData.role, 
                    userData.phone, userData.age, userData.created_at, userData.is_active,
                    userData.email_verified, userData.terms_accepted_at
                ]);
                
                const userId = result.lastID;

                // Si es paciente, crear registro en tabla patients
                if (role === 'patient') {
                    await db.run(`
                        INSERT INTO patients (user_id, instructor_id, name, email, age, created_at, is_active)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `, [userId, instructorId, userData.name, userData.email, userData.age, userData.created_at, true]);
                }

                await db.run('COMMIT');

                // Generar tokens
                const user = { id: userId, ...userData };
                delete user.password;
                
                const tokens = await this.generateTokens(user);

                console.log(`✅ Registro exitoso: ${normalizedEmail} como ${role}`);

                res.status(201).json({
                    success: true,
                    message: 'Usuario registrado exitosamente',
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    expiresIn: tokens.expiresIn,
                    user: {
                        ...user,
                        createdAt: userData.created_at
                    }
                });

            } catch (transactionError) {
                await db.run('ROLLBACK');
                throw transactionError;
            }

        } catch (error) {
            console.error('❌ Error en registro:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    /**
     * NUEVO: Cambio de contraseña seguro
     */
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword, confirmPassword } = req.body;

            // Validaciones
            if (!currentPassword || !newPassword || !confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos los campos son obligatorios',
                    code: 'MISSING_FIELDS'
                });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Las contraseñas nuevas no coinciden',
                    code: 'PASSWORD_MISMATCH'
                });
            }

            // Validar fortaleza de la nueva contraseña
            const passwordValidation = this.validatePassword(newPassword);
            if (!passwordValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message: passwordValidation.message,
                    code: 'WEAK_PASSWORD',
                    errors: passwordValidation.errors
                });
            }

            const db = getDatabase();
            const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);

            // Verificar contraseña actual
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Contraseña actual incorrecta',
                    code: 'INVALID_CURRENT_PASSWORD'
                });
            }

            // Hash nueva contraseña
            const hashedNewPassword = await bcrypt.hash(newPassword, this.config.saltRounds);

            // Actualizar contraseña
            await db.run(
                'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
                [hashedNewPassword, req.user.id]
            );

            res.json({
                success: true,
                message: 'Contraseña actualizada exitosamente'
            });

        } catch (error) {
            console.error('❌ Error cambiando contraseña:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    /**
     * Validación de token optimizada
     */
    async validateToken(req, res) {
        try {
            const token = this.extractToken(req);

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Token no proporcionado',
                    code: 'MISSING_TOKEN'
                });
            }

            // Verificar si el token está revocado
            if (this.revokedTokens.has(token)) {
                return res.status(401).json({
                    success: false,
                    message: 'Token revocado',
                    code: 'TOKEN_REVOKED'
                });
            }

            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Verificar que el usuario aún existe y está activo
            const db = getDatabase();
            const user = await db.get(
                'SELECT * FROM users WHERE id = ? AND is_active = 1', 
                [decoded.id]
            );
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no válido o inactivo',
                    code: 'INVALID_USER'
                });
            }

            const { password: _, ...userSafe } = user;

            res.json({
                success: true,
                message: 'Token válido',
                user: userSafe,
                tokenInfo: {
                    issuedAt: new Date(decoded.iat * 1000),
                    expiresAt: new Date(decoded.exp * 1000),
                    remainingTime: decoded.exp * 1000 - Date.now()
                }
            });

        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expirado',
                    code: 'TOKEN_EXPIRED'
                });
            }

            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token malformado',
                    code: 'MALFORMED_TOKEN'
                });
            }

            console.error('❌ Error validando token:', error);
            res.status(401).json({
                success: false,
                message: 'Token inválido',
                code: 'INVALID_TOKEN'
            });
        }
    }

    /**
     * Refresh token optimizado
     */
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token requerido',
                    code: 'MISSING_REFRESH_TOKEN'
                });
            }

            const decoded = jwt.verify(refreshToken, JWT_SECRET);
            
            // Verificar que es un refresh token
            if (decoded.type !== 'refresh') {
                return res.status(401).json({
                    success: false,
                    message: 'Token inválido',
                    code: 'INVALID_TOKEN_TYPE'
                });
            }

            const db = getDatabase();
            const user = await db.get(
                'SELECT * FROM users WHERE id = ? AND is_active = 1', 
                [decoded.id]
            );
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no válido',
                    code: 'INVALID_USER'
                });
            }

            // Generar nuevos tokens
            const tokens = await this.generateTokens(user);
            
            res.json({
                success: true,
                message: 'Token renovado exitosamente',
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresIn: tokens.expiresIn
            });

        } catch (error) {
            console.error('❌ Error renovando token:', error);
            res.status(401).json({
                success: false,
                message: 'Error renovando token',
                code: 'REFRESH_ERROR'
            });
        }
    }

    /**
     * Logout seguro con revocación de token
     */
    async logout(req, res) {
        try {
            const token = this.extractToken(req);
            
            if (token) {
                // Agregar token a lista negra
                this.revokedTokens.add(token);
            }

            res.json({
                success: true,
                message: 'Logout exitoso'
            });

        } catch (error) {
            console.error('❌ Error en logout:', error);
            res.status(500).json({
                success: false,
                message: 'Error en logout',
                code: 'LOGOUT_ERROR'
            });
        }
    }

    /**
     * Obtener lista de instructores para registro de pacientes
     */
    async getInstructors(req, res) {
        try {
            const db = getDatabase();
            const instructors = await db.all(`
                SELECT 
                    id, name, email, phone, specialties, 
                    created_at, is_active,
                    (SELECT COUNT(*) FROM patients WHERE instructor_id = users.id AND is_active = 1) as active_patients_count
                FROM users 
                WHERE role = "instructor" AND is_active = 1 
                ORDER BY name
            `);
            
            // Solo devolver información necesaria
            const instructorsList = instructors.map(instructor => ({
                id: instructor.id,
                name: instructor.name,
                email: instructor.email,
                phone: instructor.phone,
                specialties: instructor.specialties ? JSON.parse(instructor.specialties) : [],
                activePatients: instructor.active_patients_count,
                experienceYears: Math.floor((Date.now() - new Date(instructor.created_at).getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
                isActive: instructor.is_active
            }));

            res.json({
                success: true,
                instructors: instructorsList,
                count: instructorsList.length
            });

        } catch (error) {
            console.error('❌ Error obteniendo instructores:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo instructores',
                code: 'FETCH_ERROR'
            });
        }
    }

    // ========== MÉTODOS AUXILIARES OPTIMIZADOS ==========

    /**
     * Generar tokens JWT con configuración optimizada
     */
    async generateTokens(user, customExpiry = null) {
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            iat: Math.floor(Date.now() / 1000)
        };

        const expiresIn = customExpiry || this.config.tokenExpiry;
        
        const accessToken = jwt.sign(
            { ...payload, type: 'access' },
            JWT_SECRET,
            { expiresIn }
        );

        const refreshToken = jwt.sign(
            { ...payload, type: 'refresh' },
            JWT_SECRET,
            { expiresIn: this.config.refreshTokenExpiry }
        );

        return {
            accessToken,
            refreshToken,
            expiresIn: this.parseExpiry(expiresIn),
            tokenType: 'Bearer'
        };
    }

    /**
     * Verificación de contraseña con protección contra timing attacks
     */
    async verifyPasswordSecure(plainPassword, hashedPassword) {
        try {
            return await bcrypt.compare(plainPassword, hashedPassword);
        } catch (error) {
            // En caso de error, devolver false después del mismo tiempo
            await bcrypt.compare('dummy', '$2b$12$dummy.hash.to.maintain.timing.protection.for.security');
            return false;
        }
    }

    /**
     * Validación mejorada de datos de login
     */
    validateLoginData({ email, password }) {
        const errors = [];

        // Validar email
        if (!email || typeof email !== 'string') {
            errors.push('Email es obligatorio');
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                errors.push('Formato de email inválido');
            }
        }

        // Validar contraseña
        if (!password || typeof password !== 'string') {
            errors.push('Contraseña es obligatoria');
        } else if (password.length < this.config.passwordMinLength) {
            errors.push(`Contraseña debe tener al menos ${this.config.passwordMinLength} caracteres`);
        } else if (password.length > this.config.maxPasswordLength) {
            errors.push(`Contraseña no puede exceder ${this.config.maxPasswordLength} caracteres`);
        }

        return {
            valid: errors.length === 0,
            message: errors.length > 0 ? errors[0] : null,
            errors: errors
        };
    }

    /**
     * Validación mejorada de datos de registro
     */
    validateRegistrationData({ name, email, password, confirmPassword, role, age, termsAccepted }) {
        const errors = [];

        // Validar nombre
        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            errors.push('El nombre debe tener al menos 2 caracteres');
        } else if (name.trim().length > 100) {
            errors.push('El nombre no puede exceder 100 caracteres');
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            errors.push('Email inválido');
        }

        // Validar contraseña
        const passwordValidation = this.validatePassword(password);
        if (!passwordValidation.valid) {
            errors.push(...passwordValidation.errors);
        }

        // Validar confirmación de contraseña
        if (password !== confirmPassword) {
            errors.push('Las contraseñas no coinciden');
        }

        // Validar rol
        if (!['instructor', 'patient'].includes(role)) {
            errors.push('Rol inválido');
        }

        // Validar edad para pacientes
        if (role === 'patient') {
            if (!age || isNaN(parseInt(age)) || age < 1 || age > 120) {
                errors.push('Edad inválida para paciente (debe estar entre 1 y 120 años)');
            }
        }

        return {
            valid: errors.length === 0,
            message: errors.length > 0 ? errors[0] : null,
            errors: errors
        };
    }

    /**
     * Validar fortaleza de contraseña
     */
    validatePassword(password) {
        const errors = [];

        if (!password || typeof password !== 'string') {
            errors.push('Contraseña es obligatoria');
            return { valid: false, errors };
        }

        if (password.length < this.config.passwordMinLength) {
            errors.push(`La contraseña debe tener al menos ${this.config.passwordMinLength} caracteres`);
        }

        if (password.length > this.config.maxPasswordLength) {
            errors.push(`La contraseña no puede exceder ${this.config.maxPasswordLength} caracteres`);
        }

        // Verificar complejidad
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (!hasUpperCase) {
            errors.push('La contraseña debe contener al menos una letra mayúscula');
        }
        if (!hasLowerCase) {
            errors.push('La contraseña debe contener al menos una letra minúscula');
        }
        if (!hasNumbers) {
            errors.push('La contraseña debe contener al menos un número');
        }
        if (!hasSpecialChar) {
            errors.push('La contraseña debe contener al menos un símbolo especial');
        }

        return {
            valid: errors.length === 0,
            message: errors.length > 0 ? errors[0] : null,
            errors: errors
        };
    }

    /**
     * Rate limiting interno optimizado
     */
    checkRateLimit(ip) {
        const now = Date.now();
        const attempts = this.attemptCache.get(ip) || { count: 0, lastAttempt: 0, firstAttempt: now };

        // Reset si ha pasado el tiempo de lockout
        if (now - attempts.lastAttempt > this.config.lockoutDuration) {
            attempts.count = 0;
            attempts.firstAttempt = now;
        }

        if (attempts.count >= this.config.maxLoginAttempts) {
            const timeUntilReset = this.config.lockoutDuration - (now - attempts.lastAttempt);
            
            if (timeUntilReset > 0) {
                return {
                    allowed: false,
                    timeUntilReset: timeUntilReset,
                    attemptsRemaining: 0
                };
            }
        }

        return { 
            allowed: true,
            attemptsRemaining: Math.max(0, this.config.maxLoginAttempts - attempts.count)
        };
    }

    recordFailedAttempt(ip) {
        const now = Date.now();
        const attempts = this.attemptCache.get(ip) || { count: 0, lastAttempt: 0, firstAttempt: now };
        
        attempts.count++;
        attempts.lastAttempt = now;
        if (attempts.firstAttempt === 0) attempts.firstAttempt = now;
        
        this.attemptCache.set(ip, attempts);
    }

    clearFailedAttempts(ip) {
        this.attemptCache.delete(ip);
    }

    /**
     * Extraer token de la request
     */
    extractToken(req) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        return null;
    }

    /**
     * Parsear tiempo de expiración a milisegundos
     */
    parseExpiry(expiry) {
        const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
        const match = expiry.toString().match(/^(\d+)([smhd])$/);
        
        if (match) {
            return parseInt(match[1]) * units[match[2]];
        }
        
        return 86400000; // 24h por defecto
    }

    /**
     * Limpiar caches automáticamente
     */
    cleanupCaches() {
        const now = Date.now();
        
        // Limpiar tokens revocados antiguos (más de 7 días)
        if (this.revokedTokens.size > 10000) {
            this.revokedTokens.clear();
            console.log('🧹 Cleared revoked tokens cache');
        }

        // Limpiar intentos de login antiguos
        let cleanedAttempts = 0;
        for (const [ip, attempts] of this.attemptCache.entries()) {
            if (now - attempts.lastAttempt > this.config.lockoutDuration * 2) {
                this.attemptCache.delete(ip);
                cleanedAttempts++;
            }
        }
        
        if (cleanedAttempts > 0) {
            console.log(`🧹 Cleaned ${cleanedAttempts} old login attempts`);
        }
    }
}

// Exportar instancia del controlador
export default new AuthController();