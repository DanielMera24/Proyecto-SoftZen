import express from 'express';
import authController from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.post('/refresh', (req, res) => authController.refreshToken(req, res));
router.get('/instructors', (req, res) => authController.getInstructors(req, res));

// Rutas protegidas
router.get('/validate', (req, res) => authController.validateToken(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));

// Ruta para verificar token (compatibilidad)
router.get('/verify', authenticateToken, (req, res) => {
    res.json({ 
        valid: true, 
        user: req.user,
        message: 'Token válido'
    });
});

export default router;