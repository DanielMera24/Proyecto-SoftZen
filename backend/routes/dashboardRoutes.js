import express from 'express';
import dashboardController from '../controllers/dashboardController.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// Rutas específicas por rol
router.get('/instructor', requireRole('instructor'), dashboardController.getInstructorDashboard);
router.get('/patient', requireRole('patient'), dashboardController.getPatientDashboard);

// Rutas para exportar reportes
router.get('/export', requireRole('instructor'), dashboardController.exportReports);

export default router;