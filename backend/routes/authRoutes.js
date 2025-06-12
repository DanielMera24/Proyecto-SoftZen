import express from 'express';
import { 
    register, 
    login, 
    getProfile, 
    updateProfile, 
    changePassword,
    getAvailableInstructors
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.post('/register', register);
router.post('/login', login);
router.get('/instructors', getAvailableInstructors);

// Rutas protegidas
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changePassword);

// Ruta para verificar token
router.get('/verify', authenticateToken, (req, res) => {
    res.json({ 
        valid: true, 
        user: req.user,
        message: 'Token válido'
    });
});

export default router;