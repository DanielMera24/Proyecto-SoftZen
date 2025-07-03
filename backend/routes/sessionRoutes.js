import express from 'express';
import sessionController from '../controllers/sessionController.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// Rutas específicas para pacientes
router.get('/my-series', requireRole('patient'), sessionController.getPatientSeries);
router.post('/', requireRole('patient'), sessionController.createSession);
router.get('/my-sessions', requireRole('patient'), sessionController.getMySessions);

// Rutas para ambos roles
router.get('/:id', sessionController.getSessionById);
router.put('/:id', sessionController.updateSession);

// Rutas para instructores (ver sesiones de sus pacientes)
router.get('/patient/:patientId', sessionController.getPatientSessions);

export default router;