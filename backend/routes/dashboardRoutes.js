import express from 'express';
import { 
  getInstructorDashboard,
  getPatientDashboard,
  exportReports
} from '../controllers/dashboardController.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// Rutas específicas por rol
router.get('/instructor', requireRole('instructor'), getInstructorDashboard);
router.get('/patient', requireRole('patient'), getPatientDashboard);

// Rutas para exportar reportes
router.get('/export', requireRole('instructor'), exportReports);

export default router;