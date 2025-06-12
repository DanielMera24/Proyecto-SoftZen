import express from 'express';
import { 
  getPatients, 
  getPatient, 
  createPatient, 
  updatePatient, 
  deletePatient,
  assignSeries,
  unassignSeries,
  getPatientProgress
} from '../controllers/patientController.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// Rutas para instructores
router.get('/', requireRole('instructor'), getPatients);
router.post('/', requireRole('instructor'), createPatient);
router.put('/:id', requireRole('instructor'), updatePatient);
router.delete('/:id', requireRole('instructor'), deletePatient);
router.post('/:id/assign-series', requireRole('instructor'), assignSeries);
router.delete('/:id/unassign-series', requireRole('instructor'), unassignSeries);

// Rutas para ambos roles (instructor puede ver sus pacientes, paciente puede verse a sí mismo)
router.get('/:id', getPatient);
router.get('/:id/progress', getPatientProgress);

export default router;