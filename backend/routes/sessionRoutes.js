import express from 'express';
import { 
  getPatientSeries,
  createSession, 
  getPatientSessions,
  getMySessions,
  getSessionById,
  updateSession
} from '../controllers/sessionController.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// Rutas específicas para pacientes
router.get('/my-series', requireRole('patient'), getPatientSeries);
router.post('/', requireRole('patient'), createSession);
router.get('/my-sessions', requireRole('patient'), getMySessions);

// Rutas para ambos roles
router.get('/:id', getSessionById);
router.put('/:id', updateSession);

// Rutas para instructores (ver sesiones de sus pacientes)
router.get('/patient/:patientId', getPatientSessions);

export default router;