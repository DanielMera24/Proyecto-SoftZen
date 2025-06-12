import express from 'express';
import { 
  getTherapyTypes,
  getSeries, 
  getSingleSeries,
  createSeries, 
  updateSeries, 
  deleteSeries,
  duplicateSeries
} from '../controllers/seriesController.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas (dentro del middleware de auth)
router.get('/therapy-types', getTherapyTypes);

// Rutas para instructores
router.get('/', requireRole('instructor'), getSeries);
router.post('/', requireRole('instructor'), createSeries);
router.get('/:id', getSingleSeries);
router.put('/:id', requireRole('instructor'), updateSeries);
router.delete('/:id', requireRole('instructor'), deleteSeries);
router.post('/:id/duplicate', requireRole('instructor'), duplicateSeries);

export default router;