import express from 'express';
import seriesController from '../controllers/seriesController.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas (dentro del middleware de auth)
router.get('/therapy-types', seriesController.getTherapyTypes);

// Rutas para instructores
router.get('/', requireRole('instructor'), seriesController.getSeries);
router.post('/', requireRole('instructor'), seriesController.createSeries);
router.get('/:id', seriesController.getSingleSeries);
router.put('/:id', requireRole('instructor'), seriesController.updateSeries);
router.delete('/:id', requireRole('instructor'), seriesController.deleteSeries);
router.post('/:id/duplicate', requireRole('instructor'), seriesController.duplicateSeries);

export default router;