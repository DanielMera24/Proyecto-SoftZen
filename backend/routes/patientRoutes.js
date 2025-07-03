import express from 'express';
import patientController from '../controllers/patientController.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// Rutas para instructores
router.get('/', requireRole('instructor'), patientController.getPatients);
router.post('/', requireRole('instructor'), patientController.createPatient);
router.put('/:id', requireRole('instructor'), patientController.updatePatient);
router.delete('/:id', requireRole('instructor'), patientController.deletePatient);
router.post('/:id/assign-series', requireRole('instructor'), patientController.assignSeries);
router.post('/:id/unassign-series', requireRole('instructor'), patientController.unassignSeries);

// Rutas para ambos roles (instructor puede ver sus pacientes, paciente puede verse a sí mismo)
router.get('/:id', patientController.getPatient);
router.get('/:id/progress', patientController.getPatientProgress);

export default router;