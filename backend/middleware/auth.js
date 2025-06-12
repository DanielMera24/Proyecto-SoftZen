import jwt from 'jsonwebtoken';
import { getDatabase } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'therapeutic-yoga-secret-key-super-secure-for-development-only';
const JWT_EXPIRES_IN = process.env.SESSION_TIMEOUT || '7d';

export function generateToken(user) {
    try {
        const payload = { 
            id: user.id, 
            email: user.email, 
            role: user.role,
            name: user.name,
            iat: Math.floor(Date.now() / 1000)
        };
        
        return jwt.sign(payload, JWT_SECRET, { 
            expiresIn: JWT_EXPIRES_IN,
            issuer: 'yoga-therapy-app',
            audience: 'yoga-therapy-users'
        });
    } catch (error) {
        console.error('Error generando token:', error);
        throw new Error('Error generando token de autenticación');
    }
}

export async function authenticateToken(req, res, next) {
    try {
        // Extraer token del header Authorization
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.startsWith('Bearer ') 
            ? authHeader.split(' ')[1] 
            : authHeader;

        if (!token) {
            return res.status(401).json({ 
                success: false,
                error: 'Token de acceso requerido',
                code: 'NO_TOKEN'
            });
        }

        // Verificar y decodificar token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET, {
                issuer: 'yoga-therapy-app',
                audience: 'yoga-therapy-users'
            });
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(403).json({ 
                    success: false,
                    error: 'Token expirado',
                    code: 'EXPIRED_TOKEN'
                });
            }
            
            if (jwtError.name === 'JsonWebTokenError') {
                return res.status(403).json({ 
                    success: false,
                    error: 'Token inválido',
                    code: 'INVALID_TOKEN'
                });
            }
            
            throw jwtError;
        }
        
        // Verificar que el usuario aún existe y está activo
        const db = getDatabase();
        const user = await db.get(
            'SELECT id, email, name, role, is_active, last_login FROM users WHERE id = ? AND is_active = 1',
            [decoded.id]
        );

        if (!user) {
            return res.status(403).json({ 
                success: false,
                error: 'Usuario no encontrado o inactivo',
                code: 'USER_NOT_FOUND'
            });
        }

        // Verificar que los datos del token coinciden con los de la base de datos
        if (user.email !== decoded.email || user.role !== decoded.role) {
            return res.status(403).json({ 
                success: false,
                error: 'Token inválido - datos no coinciden',
                code: 'TOKEN_DATA_MISMATCH'
            });
        }

        // Actualizar último acceso (de forma asíncrona para no bloquear)
        db.run(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        ).catch(err => {
            console.error('Error actualizando last_login:', err);
        });

        // Agregar información del usuario a la request
        req.user = user;
        req.token = token;
        req.tokenPayload = decoded;
        
        next();
    } catch (error) {
        console.error('Error en autenticación:', error);
        
        return res.status(500).json({ 
            success: false,
            error: 'Error de autenticación interno',
            code: 'AUTH_ERROR'
        });
    }
}

export function requireRole(roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                error: 'Usuario no autenticado',
                code: 'NOT_AUTHENTICATED'
            });
        }

        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false,
                error: 'Permisos insuficientes',
                code: 'INSUFFICIENT_PERMISSIONS',
                details: {
                    required: allowedRoles,
                    current: req.user.role
                }
            });
        }

        next();
    };
}

export function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.split(' ')[1] 
        : authHeader;

    if (!token) {
        req.user = null;
        req.token = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET, {
            issuer: 'yoga-therapy-app',
            audience: 'yoga-therapy-users'
        });
        req.user = decoded;
        req.token = token;
    } catch (error) {
        // En autenticación opcional, si el token es inválido simplemente continuamos sin usuario
        req.user = null;
        req.token = null;
    }

    next();
}

// Middleware para verificar que el token no esté en una lista negra (para futuras mejoras)
export function checkTokenBlacklist(req, res, next) {
    // Aquí se podría implementar una verificación contra una lista negra de tokens
    // Por ejemplo, tokens que han sido revocados explícitamente
    next();
}

// Función para validar la estructura del token sin verificar la firma
export function parseTokenPayload(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }
        
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        return payload;
    } catch (error) {
        return null;
    }
}

// Función para verificar si un token está próximo a expirar
export function isTokenNearExpiry(token, minutesThreshold = 30) {
    try {
        const payload = parseTokenPayload(token);
        if (!payload || !payload.exp) {
            return false;
        }
        
        const expiryTime = payload.exp * 1000; // Convertir a millisegundos
        const currentTime = Date.now();
        const timeUntilExpiry = expiryTime - currentTime;
        const thresholdMs = minutesThreshold * 60 * 1000;
        
        return timeUntilExpiry <= thresholdMs;
    } catch (error) {
        return false;
    }
}

export default {
    generateToken,
    authenticateToken,
    requireRole,
    optionalAuth,
    checkTokenBlacklist,
    parseTokenPayload,
    isTokenNearExpiry
};