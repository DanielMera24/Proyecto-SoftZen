import jwt from 'jsonwebtoken';
import { getDatabase } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'soft_zen_secret_key_2024_v2_secure';

/**
 * Middleware de autenticación optimizado para SoftZen
 */

export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token de acceso requerido',
                code: 'MISSING_TOKEN'
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
                error: 'Usuario no válido',
                code: 'INVALID_USER'
            });
        }

        // Remover información sensible
        const { password, ...userSafe } = user;
        req.user = userSafe;
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expirado',
                code: 'TOKEN_EXPIRED'
            });
        }

        return res.status(403).json({
            success: false,
            error: 'Token inválido',
            code: 'INVALID_TOKEN'
        });
    }
};

export const requireRole = (role) => {
    return async (req, res, next) => {
        // Primero autenticar
        await new Promise((resolve, reject) => {
            authenticateToken(req, res, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Luego verificar rol
        if (req.user.role !== role) {
            return res.status(403).json({
                success: false,
                error: `Acceso denegado. Rol '${role}' requerido`,
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        next();
    };
};