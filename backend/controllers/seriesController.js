import { getDatabase } from '../config/database.js';
import { getAllTherapyTypes, getTherapyType } from '../models/predefinedTherapy.js';

const getTherapyTypes = async (req, res) => {
    try {
        const therapyTypes = getAllTherapyTypes();
        res.json({
            success: true,
            data: therapyTypes,
            count: therapyTypes.length
        });
    } catch (error) {
        console.error('Error obteniendo tipos de terapia:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo tipos de terapia',
            code: 'GET_THERAPY_TYPES_ERROR'
        });
    }
};

const getSeries = async (req, res) => {
    try {
        if (req.user.role !== 'instructor') {
            return res.status(403).json({
                success: false,
                error: 'Solo los instructores pueden ver series',
                code: 'INSTRUCTOR_ONLY'
            });
        }

        const db = getDatabase();
        
        const series = await db.all(`
            SELECT 
                ts.*,
                COUNT(DISTINCT p.id) as assigned_patients_count,
                COUNT(DISTINCT s.id) as total_sessions_count,
                AVG(s.pain_before - s.pain_after) as avg_pain_improvement
            FROM therapy_series ts
            LEFT JOIN patients p ON p.assigned_series_id = ts.id AND p.is_active = 1
            LEFT JOIN sessions s ON s.series_id = ts.id
            WHERE ts.instructor_id = ? AND ts.is_active = 1
            GROUP BY ts.id
            ORDER BY ts.created_at DESC
        `, [req.user.id]);

        const processedSeries = series.map(s => ({
            ...s,
            postures: JSON.parse(s.postures || '[]'),
            avg_pain_improvement: s.avg_pain_improvement 
                ? Math.round(s.avg_pain_improvement * 10) / 10 
                : 0,
            therapy_type_name: getTherapyType(s.therapy_type)?.name || s.therapy_type
        }));

        res.json({
            success: true,
            data: processedSeries,
            count: processedSeries.length
        });
    } catch (error) {
        console.error('Error obteniendo series:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo series',
            code: 'GET_SERIES_ERROR'
        });
    }
};

const getSingleSeries = async (req, res) => {
    try {
        const seriesId = parseInt(req.params.id);
        
        if (isNaN(seriesId)) {
            return res.status(400).json({
                success: false,
                error: 'ID de serie inválido',
                code: 'INVALID_SERIES_ID'
            });
        }

        const db = getDatabase();

        let query = `
            SELECT 
                ts.*,
                COUNT(DISTINCT p.id) as assigned_patients_count,
                COUNT(DISTINCT s.id) as total_sessions_count
            FROM therapy_series ts
            LEFT JOIN patients p ON p.assigned_series_id = ts.id AND p.is_active = 1
            LEFT JOIN sessions s ON s.series_id = ts.id
            WHERE ts.id = ? AND ts.is_active = 1
        `;

        let params = [seriesId];

        // Si es instructor, verificar que la serie le pertenece
        if (req.user.role === 'instructor') {
            query += ' AND ts.instructor_id = ?';
            params.push(req.user.id);
        }

        query += ' GROUP BY ts.id';

        const series = await db.get(query, params);

        if (!series) {
            return res.status(404).json({
                success: false,
                error: 'Serie no encontrada',
                code: 'SERIES_NOT_FOUND'
            });
        }

        // Obtener pacientes asignados a esta serie
        const assignedPatients = await db.all(`
            SELECT p.id, p.name, p.current_session, p.total_sessions_completed
            FROM patients p
            WHERE p.assigned_series_id = ? AND p.is_active = 1
        `, [seriesId]);

        const responseData = {
            ...series,
            postures: JSON.parse(series.postures || '[]'),
            therapy_type_name: getTherapyType(series.therapy_type)?.name || series.therapy_type,
            assigned_patients: assignedPatients
        };

        res.json({
            success: true,
            data: responseData
        });

    } catch (error) {
        console.error('Error obteniendo serie:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo serie',
            code: 'GET_SINGLE_SERIES_ERROR'
        });
    }
};

const createSeries = async (req, res) => {
    try {
        if (req.user.role !== 'instructor') {
            return res.status(403).json({
                success: false,
                error: 'Solo los instructores pueden crear series',
                code: 'INSTRUCTOR_ONLY'
            });
        }

        const { 
            name, 
            description, 
            therapyType, 
            postures, 
            totalSessions,
            difficultyLevel = 'beginner'
        } = req.body;

        // Validaciones mejoradas
        const validationErrors = [];

        if (!name || name.trim().length < 3) {
            validationErrors.push('El nombre debe tener al menos 3 caracteres');
        }

        if (!therapyType) {
            validationErrors.push('Tipo de terapia es obligatorio');
        }

        if (!postures || !Array.isArray(postures) || postures.length === 0) {
            validationErrors.push('Debe seleccionar al menos una postura');
        }

        if (!totalSessions || totalSessions < 1 || totalSessions > 50) {
            validationErrors.push('El número de sesiones debe estar entre 1 y 50');
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Errores de validación',
                details: validationErrors,
                code: 'VALIDATION_ERROR'
            });
        }

        // Verificar que el tipo de terapia existe
        const therapyTypeData = getTherapyType(therapyType);
        if (!therapyTypeData) {
            return res.status(400).json({
                success: false,
                error: 'Tipo de terapia inválido',
                code: 'INVALID_THERAPY_TYPE'
            });
        }

        // Validar posturas
        const validPostures = postures.filter(p => 
            p.id && p.name && p.duration && 
            Number(p.duration) > 0 && Number(p.duration) <= 60
        );

        if (validPostures.length !== postures.length) {
            return res.status(400).json({
                success: false,
                error: 'Todas las posturas deben tener ID, nombre y duración válida (1-60 minutos)',
                code: 'INVALID_POSTURES'
            });
        }

        // Calcular duración estimada total
        const estimatedDuration = validPostures.reduce((sum, p) => sum + Number(p.duration), 0);

        const db = getDatabase();

        // Verificar que no existe una serie con el mismo nombre para este instructor
        const existingSeries = await db.get(`
            SELECT id FROM therapy_series 
            WHERE name = ? AND instructor_id = ? AND is_active = 1
        `, [name.trim(), req.user.id]);

        if (existingSeries) {
            return res.status(400).json({
                success: false,
                error: 'Ya tienes una serie con este nombre',
                code: 'DUPLICATE_SERIES_NAME'
            });
        }

        // Crear serie
        const result = await db.run(`
            INSERT INTO therapy_series (
                name, description, therapy_type, postures, total_sessions, 
                difficulty_level, estimated_duration, instructor_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            name.trim(), 
            description?.trim() || '', 
            therapyType, 
            JSON.stringify(validPostures), 
            totalSessions,
            difficultyLevel,
            estimatedDuration,
            req.user.id
        ]);

        const series = await db.get('SELECT * FROM therapy_series WHERE id = ?', [result.lastID]);

        // Log analytics
        await db.run(`
            INSERT INTO analytics_events (user_id, event_type, event_data) 
            VALUES (?, 'series_created', ?)
        `, [req.user.id, JSON.stringify({
            series_id: series.id,
            therapy_type: therapyType,
            postures_count: validPostures.length,
            total_sessions: totalSessions,
            estimated_duration: estimatedDuration
        })]);

        res.status(201).json({
            success: true,
            data: {
                ...series,
                postures: JSON.parse(series.postures)
            },
            message: 'Serie creada exitosamente'
        });

    } catch (error) {
        console.error('Error creando serie:', error);
        res.status(500).json({
            success: false,
            error: 'Error creando serie',
            code: 'CREATE_SERIES_ERROR'
        });
    }
};

const updateSeries = async (req, res) => {
    try {
        if (req.user.role !== 'instructor') {
            return res.status(403).json({
                success: false,
                error: 'Solo los instructores pueden actualizar series',
                code: 'INSTRUCTOR_ONLY'
            });
        }

        const seriesId = parseInt(req.params.id);
        
        if (isNaN(seriesId)) {
            return res.status(400).json({
                success: false,
                error: 'ID de serie inválido',
                code: 'INVALID_SERIES_ID'
            });
        }

        const { 
            name, 
            description, 
            postures, 
            totalSessions,
            difficultyLevel
        } = req.body;

        const db = getDatabase();

        // Verificar que la serie pertenece al instructor
        const series = await db.get(`
            SELECT id, name FROM therapy_series 
            WHERE id = ? AND instructor_id = ? AND is_active = 1
        `, [seriesId, req.user.id]);

        if (!series) {
            return res.status(404).json({
                success: false,
                error: 'Serie no encontrada',
                code: 'SERIES_NOT_FOUND'
            });
        }

        // Verificar si hay pacientes asignados a esta serie
        const assignedPatientsCount = await db.get(`
            SELECT COUNT(*) as count FROM patients 
            WHERE assigned_series_id = ? AND is_active = 1
        `, [seriesId]);

        if (assignedPatientsCount.count > 0) {
            return res.status(400).json({
                success: false,
                error: 'No se puede modificar una serie que tiene pacientes asignados',
                code: 'SERIES_IN_USE'
            });
        }

        // Preparar datos para actualizar
        let updateFields = [];
        let updateValues = [];

        if (name && name.trim().length >= 3) {
            updateFields.push('name = ?');
            updateValues.push(name.trim());
        }

        if (description !== undefined) {
            updateFields.push('description = ?');
            updateValues.push(description?.trim() || '');
        }

        if (postures && Array.isArray(postures) && postures.length > 0) {
            const estimatedDuration = postures.reduce((sum, p) => sum + (Number(p.duration) || 0), 0);
            updateFields.push('postures = ?, estimated_duration = ?');
            updateValues.push(JSON.stringify(postures), estimatedDuration);
        }

        if (totalSessions && totalSessions >= 1 && totalSessions <= 50) {
            updateFields.push('total_sessions = ?');
            updateValues.push(totalSessions);
        }

        if (difficultyLevel && ['beginner', 'intermediate', 'advanced'].includes(difficultyLevel)) {
            updateFields.push('difficulty_level = ?');
            updateValues.push(difficultyLevel);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No hay campos válidos para actualizar',
                code: 'NO_UPDATE_FIELDS'
            });
        }

        updateValues.push(seriesId);

        // Actualizar serie
        await db.run(`
            UPDATE therapy_series 
            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, updateValues);

        const updatedSeries = await db.get('SELECT * FROM therapy_series WHERE id = ?', [seriesId]);

        // Log analytics
        await db.run(`
            INSERT INTO analytics_events (user_id, event_type, event_data) 
            VALUES (?, 'series_updated', ?)
        `, [req.user.id, JSON.stringify({
            series_id: seriesId,
            updated_fields: Object.keys(req.body)
        })]);

        res.json({
            success: true,
            data: {
                ...updatedSeries,
                postures: JSON.parse(updatedSeries.postures)
            },
            message: 'Serie actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error actualizando serie:', error);
        res.status(500).json({
            success: false,
            error: 'Error actualizando serie',
            code: 'UPDATE_SERIES_ERROR'
        });
    }
};

const deleteSeries = async (req, res) => {
    try {
        if (req.user.role !== 'instructor') {
            return res.status(403).json({
                success: false,
                error: 'Solo los instructores pueden eliminar series',
                code: 'INSTRUCTOR_ONLY'
            });
        }

        const seriesId = parseInt(req.params.id);
        
        if (isNaN(seriesId)) {
            return res.status(400).json({
                success: false,
                error: 'ID de serie inválido',
                code: 'INVALID_SERIES_ID'
            });
        }

        const db = getDatabase();

        // Verificar que la serie pertenece al instructor
        const series = await db.get(`
            SELECT id, name FROM therapy_series 
            WHERE id = ? AND instructor_id = ? AND is_active = 1
        `, [seriesId, req.user.id]);

        if (!series) {
            return res.status(404).json({
                success: false,
                error: 'Serie no encontrada',
                code: 'SERIES_NOT_FOUND'
            });
        }

        // Verificar si hay pacientes asignados a esta serie
        const assignedPatients = await db.all(`
            SELECT id, name FROM patients 
            WHERE assigned_series_id = ? AND is_active = 1
        `, [seriesId]);

        if (assignedPatients.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'No se puede eliminar una serie que tiene pacientes asignados',
                code: 'SERIES_IN_USE',
                details: {
                    assigned_patients: assignedPatients,
                    count: assignedPatients.length
                }
            });
        }

        // Soft delete de la serie
        await db.run(`
            UPDATE therapy_series 
            SET is_active = 0, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, [seriesId]);

        // Log analytics
        await db.run(`
            INSERT INTO analytics_events (user_id, event_type, event_data) 
            VALUES (?, 'series_deleted', ?)
        `, [req.user.id, JSON.stringify({
            series_id: seriesId,
            series_name: series.name
        })]);

        res.json({ 
            success: true,
            message: 'Serie eliminada exitosamente' 
        });

    } catch (error) {
        console.error('Error eliminando serie:', error);
        res.status(500).json({
            success: false,
            error: 'Error eliminando serie',
            code: 'DELETE_SERIES_ERROR'
        });
    }
};

const duplicateSeries = async (req, res) => {
    try {
        if (req.user.role !== 'instructor') {
            return res.status(403).json({
                success: false,
                error: 'Solo los instructores pueden duplicar series',
                code: 'INSTRUCTOR_ONLY'
            });
        }

        const seriesId = parseInt(req.params.id);
        
        if (isNaN(seriesId)) {
            return res.status(400).json({
                success: false,
                error: 'ID de serie inválido',
                code: 'INVALID_SERIES_ID'
            });
        }

        const db = getDatabase();

        // Obtener la serie original
        const originalSeries = await db.get(`
            SELECT * FROM therapy_series 
            WHERE id = ? AND instructor_id = ? AND is_active = 1
        `, [seriesId, req.user.id]);

        if (!originalSeries) {
            return res.status(404).json({
                success: false,
                error: 'Serie no encontrada',
                code: 'SERIES_NOT_FOUND'
            });
        }

        // Crear nombre único para la copia
        let newName = `${originalSeries.name} (Copia)`;
        let counter = 1;
        
        // Verificar si ya existe una serie con este nombre
        while (await db.get(`
            SELECT id FROM therapy_series 
            WHERE name = ? AND instructor_id = ? AND is_active = 1
        `, [newName, req.user.id])) {
            counter++;
            newName = `${originalSeries.name} (Copia ${counter})`;
        }
        
        const result = await db.run(`
            INSERT INTO therapy_series (
                name, description, therapy_type, postures, total_sessions, 
                difficulty_level, estimated_duration, instructor_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            newName,
            originalSeries.description,
            originalSeries.therapy_type,
            originalSeries.postures,
            originalSeries.total_sessions,
            originalSeries.difficulty_level,
            originalSeries.estimated_duration,
            req.user.id
        ]);

        const duplicatedSeries = await db.get('SELECT * FROM therapy_series WHERE id = ?', [result.lastID]);

        // Log analytics
        await db.run(`
            INSERT INTO analytics_events (user_id, event_type, event_data) 
            VALUES (?, 'series_duplicated', ?)
        `, [req.user.id, JSON.stringify({
            original_series_id: seriesId,
            new_series_id: duplicatedSeries.id,
            new_series_name: newName
        })]);

        res.status(201).json({
            success: true,
            data: {
                ...duplicatedSeries,
                postures: JSON.parse(duplicatedSeries.postures)
            },
            message: 'Serie duplicada exitosamente'
        });

    } catch (error) {
        console.error('Error duplicando serie:', error);
        res.status(500).json({
            success: false,
            error: 'Error duplicando serie',
            code: 'DUPLICATE_SERIES_ERROR'
        });
    }
};

// Export default del controlador
export default {
    getTherapyTypes,
    getSeries,
    getSingleSeries,
    createSeries,
    updateSeries,
    deleteSeries,
    duplicateSeries
};