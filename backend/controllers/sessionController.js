import { getDatabase } from '../config/database.js';

const getPatientSeries = async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        error: 'Solo los pacientes pueden ver su serie asignada',
        code: 'PATIENT_ONLY'
      });
    }

    const db = getDatabase();

    // CORREGIDA: Query mejorada con nombres de campo explícitos
    const patient = await db.get(`
      SELECT 
        p.*,
        ts.id as series_id,
        ts.name as series_name,
        ts.description as series_description,
        ts.therapy_type,
        ts.postures,
        ts.total_sessions,
        ts.estimated_duration,
        u.name as instructor_name
      FROM patients p
      LEFT JOIN therapy_series ts ON p.assigned_series_id = ts.id
      LEFT JOIN users u ON p.instructor_id = u.id
      WHERE p.user_id = ? AND p.is_active = 1
    `, [req.user.id]);

    if (!patient) {
      return res.status(404).json({
        error: 'No se encontró información del paciente',
        code: 'PATIENT_NOT_FOUND'
      });
    }

    if (!patient.assigned_series_id || !patient.series_id) {
      return res.json({
        patient: {
          id: patient.id,
          name: patient.name,
          instructor_name: patient.instructor_name
        },
        series: null,
        message: 'No tienes una serie asignada aún. Consulta con tu instructor.'
      });
    }

    // Calcular progreso
    const progressPercentage = patient.total_sessions > 0 ? 
      Math.round((patient.current_session / patient.total_sessions) * 100) : 0;
    const isCompleted = patient.current_session >= patient.total_sessions;

    const responseData = {
      patient: {
        id: patient.id,
        name: patient.name,
        instructor_name: patient.instructor_name,
        current_session: patient.current_session,
        total_sessions_completed: patient.total_sessions_completed
      },
      series: {
        id: patient.assigned_series_id,
        name: patient.series_name || 'Serie Asignada',
        description: patient.series_description || '',
        therapy_type: patient.therapy_type,
        postures: patient.postures ? JSON.parse(patient.postures) : [],
        total_sessions: patient.total_sessions,
        current_session: patient.current_session,
        progress_percentage: progressPercentage,
        is_completed: isCompleted,
        estimated_duration: patient.estimated_duration
      }
    };

    res.json(responseData);

  } catch (error) {
    console.error('Error obteniendo serie del paciente:', error);
    res.status(500).json({
      error: 'Error obteniendo serie',
      code: 'GET_PATIENT_SERIES_ERROR'
    });
  }
};

const createSession = async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        error: 'Solo los pacientes pueden crear sesiones',
        code: 'PATIENT_ONLY'
      });
    }

    const { 
      painBefore, 
      painAfter, 
      moodBefore,
      moodAfter,
      comments, 
      durationMinutes = 30,
      posturesCompleted = 0,
      posturesSkipped = 0,
      rating
    } = req.body;

    // Validaciones mejoradas
    if (painBefore === undefined || painAfter === undefined) {
      return res.status(400).json({
        error: 'Los niveles de dolor antes y después son obligatorios',
        code: 'MISSING_PAIN_LEVELS'
      });
    }

    if (!comments || comments.trim().length < 10) {
      return res.status(400).json({
        error: 'Los comentarios deben tener al menos 10 caracteres',
        code: 'INVALID_COMMENTS'
      });
    }

    if (painBefore < 0 || painBefore > 10 || painAfter < 0 || painAfter > 10) {
      return res.status(400).json({
        error: 'Los niveles de dolor deben estar entre 0 y 10',
        code: 'INVALID_PAIN_RANGE'
      });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        error: 'La calificación debe estar entre 1 y 5',
        code: 'INVALID_RATING'
      });
    }

    const db = getDatabase();

    // Obtener información del paciente
    const patient = await db.get(`
      SELECT p.*, ts.id as series_id, ts.total_sessions
      FROM patients p
      LEFT JOIN therapy_series ts ON p.assigned_series_id = ts.id
      WHERE p.user_id = ? AND p.is_active = 1
    `, [req.user.id]);

    if (!patient) {
      return res.status(404).json({
        error: 'Paciente no encontrado',
        code: 'PATIENT_NOT_FOUND'
      });
    }

    if (!patient.series_id) {
      return res.status(400).json({
        error: 'No tienes una serie asignada',
        code: 'NO_SERIES_ASSIGNED'
      });
    }

    // Verificar si ya completó la serie
    if (patient.current_session >= patient.total_sessions) {
      return res.status(400).json({
        error: 'Ya has completado todas las sesiones de esta serie',
        code: 'SERIES_COMPLETED'
      });
    }

    const sessionNumber = (patient.current_session || 0) + 1;

    // Crear sesión usando una transacción para asegurar consistencia
    await db.run('BEGIN TRANSACTION');

    try {
      const result = await db.run(`
        INSERT INTO sessions (
          patient_id, series_id, session_number, pain_before, pain_after, 
          mood_before, mood_after, comments, duration_minutes, 
          postures_completed, postures_skipped, rating
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        patient.id, 
        patient.series_id, 
        sessionNumber, 
        painBefore, 
        painAfter,
        moodBefore || null,
        moodAfter || null,
        comments.trim(), 
        durationMinutes,
        posturesCompleted,
        posturesSkipped,
        rating || null
      ]);

      const session = await db.get('SELECT * FROM sessions WHERE id = ?', [result.lastID]);

      // Crear notificación para el instructor
      try {
        await db.run(`
          INSERT INTO notifications (user_id, type, title, message, data) 
          VALUES (?, 'session_completed', 'Sesión Completada', ?, ?)
        `, [
          patient.instructor_id, 
          `${patient.name} completó la sesión ${sessionNumber} con una mejora de dolor de ${painBefore - painAfter} puntos.`,
          JSON.stringify({ 
            patient_id: patient.id, 
            session_id: session.id, 
            session_number: sessionNumber,
            pain_improvement: painBefore - painAfter
          })
        ]);
      } catch (notificationError) {
        console.warn('Error creando notificación:', notificationError);
        // No fallar la sesión por un error de notificación
      }

      // Log analytics
      try {
        await db.run(`
          INSERT INTO analytics_events (user_id, patient_id, event_type, event_data) 
          VALUES (?, ?, 'session_completed', ?)
        `, [req.user.id, patient.id, JSON.stringify({
          session_id: session.id,
          session_number: sessionNumber,
          pain_improvement: painBefore - painAfter,
          duration_minutes: durationMinutes,
          rating: rating
        })]);
      } catch (analyticsError) {
        console.warn('Error registrando analytics:', analyticsError);
        // No fallar la sesión por un error de analytics
      }

      await db.run('COMMIT');

      // Calcular mensaje de mejora
      const painImprovement = painBefore - painAfter;
      let improvementMessage = '';
      
      if (painImprovement > 0) {
        improvementMessage = `¡Excelente! Tu nivel de dolor se redujo en ${painImprovement} puntos.`;
      } else if (painImprovement < 0) {
        improvementMessage = `Aunque el dolor aumentó ligeramente, seguir practicando traerá beneficios.`;
      } else {
        improvementMessage = `Mantuviste tu nivel de dolor estable. ¡Sigue así!`;
      }

      res.status(201).json({
        session,
        progress: {
          current_session: sessionNumber,
          total_sessions: patient.total_sessions,
          progress_percentage: Math.round((sessionNumber / patient.total_sessions) * 100),
          is_completed: sessionNumber >= patient.total_sessions
        },
        message: `🎉 ¡Sesión ${sessionNumber} completada exitosamente! ${improvementMessage}`
      });

    } catch (transactionError) {
      await db.run('ROLLBACK');
      throw transactionError;
    }

  } catch (error) {
    console.error('Error creando sesión:', error);
    res.status(500).json({
      error: 'Error creando sesión',
      code: 'CREATE_SESSION_ERROR'
    });
  }
};

const getPatientSessions = async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    
    if (isNaN(patientId)) {
      return res.status(400).json({
        error: 'ID de paciente inválido',
        code: 'INVALID_PATIENT_ID'
      });
    }

    const db = getDatabase();

    let query = `
      SELECT s.*, COALESCE(ts.name, 'Sin serie') as series_name, ts.therapy_type
      FROM sessions s
      LEFT JOIN therapy_series ts ON s.series_id = ts.id
      WHERE s.patient_id = ?
    `;

    let params = [patientId];

    // Verificar permisos
    if (req.user.role === 'instructor') {
      // Verificar que el paciente pertenece al instructor
      const patient = await db.get(`
        SELECT id FROM patients 
        WHERE id = ? AND instructor_id = ? AND is_active = 1
      `, [patientId, req.user.id]);

      if (!patient) {
        return res.status(404).json({
          error: 'Paciente no encontrado',
          code: 'PATIENT_NOT_FOUND'
        });
      }
    } else if (req.user.role === 'patient') {
      // Verificar que el paciente está viendo sus propias sesiones
      const patient = await db.get(`
        SELECT id FROM patients 
        WHERE id = ? AND user_id = ? AND is_active = 1
      `, [patientId, req.user.id]);

      if (!patient) {
        return res.status(403).json({
          error: 'No puedes ver sesiones de otros pacientes',
          code: 'ACCESS_DENIED'
        });
      }
    }

    query += ' ORDER BY s.completed_at DESC';

    const sessions = await db.all(query, params);

    // Calcular estadísticas
    const stats = {
      total_sessions: sessions.length,
      avg_pain_before: 0,
      avg_pain_after: 0,
      avg_improvement: 0,
      avg_duration: 0,
      avg_rating: 0,
      total_postures_completed: 0,
      total_postures_skipped: 0
    };

    if (sessions.length > 0) {
      stats.avg_pain_before = sessions.reduce((sum, s) => sum + s.pain_before, 0) / sessions.length;
      stats.avg_pain_after = sessions.reduce((sum, s) => sum + s.pain_after, 0) / sessions.length;
      stats.avg_improvement = stats.avg_pain_before - stats.avg_pain_after;
      stats.avg_duration = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / sessions.length;
      
      const ratedSessions = sessions.filter(s => s.rating);
      if (ratedSessions.length > 0) {
        stats.avg_rating = ratedSessions.reduce((sum, s) => sum + s.rating, 0) / ratedSessions.length;
      }
      
      stats.total_postures_completed = sessions.reduce((sum, s) => sum + (s.postures_completed || 0), 0);
      stats.total_postures_skipped = sessions.reduce((sum, s) => sum + (s.postures_skipped || 0), 0);

      // Redondear valores
      stats.avg_pain_before = Math.round(stats.avg_pain_before * 10) / 10;
      stats.avg_pain_after = Math.round(stats.avg_pain_after * 10) / 10;
      stats.avg_improvement = Math.round(stats.avg_improvement * 10) / 10;
      stats.avg_duration = Math.round(stats.avg_duration);
      stats.avg_rating = Math.round(stats.avg_rating * 10) / 10;
    }

    res.json({
      sessions,
      stats
    });

  } catch (error) {
    console.error('Error obteniendo sesiones del paciente:', error);
    res.status(500).json({
      error: 'Error obteniendo sesiones',
      code: 'GET_PATIENT_SESSIONS_ERROR'
    });
  }
};

const getMySessions = async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        error: 'Solo los pacientes pueden ver sus sesiones',
        code: 'PATIENT_ONLY'
      });
    }

    const db = getDatabase();

    // Obtener información del paciente
    const patient = await db.get(`
      SELECT id FROM patients 
      WHERE user_id = ? AND is_active = 1
    `, [req.user.id]);

    if (!patient) {
      return res.status(404).json({
        error: 'Información del paciente no encontrada',
        code: 'PATIENT_NOT_FOUND'
      });
    }

    // Reutilizar la función existente
    req.params.patientId = patient.id.toString();
    return getPatientSessions(req, res);

  } catch (error) {
    console.error('Error obteniendo mis sesiones:', error);
    res.status(500).json({
      error: 'Error obteniendo sesiones',
      code: 'GET_MY_SESSIONS_ERROR'
    });
  }
};

const getSessionById = async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    
    if (isNaN(sessionId)) {
      return res.status(400).json({
        error: 'ID de sesión inválido',
        code: 'INVALID_SESSION_ID'
      });
    }

    const db = getDatabase();

    let query = `
      SELECT s.*, COALESCE(ts.name, 'Sin serie') as series_name, ts.therapy_type, p.name as patient_name
      FROM sessions s
      LEFT JOIN therapy_series ts ON s.series_id = ts.id
      LEFT JOIN patients p ON s.patient_id = p.id
      WHERE s.id = ?
    `;

    let params = [sessionId];

    // Verificar permisos según el rol
    if (req.user.role === 'instructor') {
      query += ' AND p.instructor_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'patient') {
      query += ' AND p.user_id = ?';
      params.push(req.user.id);
    }

    const session = await db.get(query, params);

    if (!session) {
      return res.status(404).json({
        error: 'Sesión no encontrada',
        code: 'SESSION_NOT_FOUND'
      });
    }

    res.json(session);

  } catch (error) {
    console.error('Error obteniendo sesión:', error);
    res.status(500).json({
      error: 'Error obteniendo sesión',
      code: 'GET_SESSION_ERROR'
    });
  }
};

const updateSession = async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        error: 'Solo los pacientes pueden actualizar sus sesiones',
        code: 'PATIENT_ONLY'
      });
    }

    const sessionId = parseInt(req.params.id);
    const { comments, rating } = req.body;

    if (isNaN(sessionId)) {
      return res.status(400).json({
        error: 'ID de sesión inválido',
        code: 'INVALID_SESSION_ID'
      });
    }

    if (!comments && !rating) {
      return res.status(400).json({
        error: 'Debe proporcionar comentarios o calificación para actualizar',
        code: 'NO_UPDATE_DATA'
      });
    }

    const db = getDatabase();

    // Verificar que la sesión pertenece al paciente
    const session = await db.get(`
      SELECT s.id, p.user_id 
      FROM sessions s
      JOIN patients p ON s.patient_id = p.id
      WHERE s.id = ? AND p.user_id = ?
    `, [sessionId, req.user.id]);

    if (!session) {
      return res.status(404).json({
        error: 'Sesión no encontrada',
        code: 'SESSION_NOT_FOUND'
      });
    }

    // Construir query de actualización
    let updateFields = [];
    let updateValues = [];

    if (comments && comments.trim().length >= 10) {
      updateFields.push('comments = ?');
      updateValues.push(comments.trim());
    }

    if (rating) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          error: 'La calificación debe estar entre 1 y 5',
          code: 'INVALID_RATING'
        });
      }
      updateFields.push('rating = ?');
      updateValues.push(rating);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'No hay datos válidos para actualizar',
        code: 'NO_VALID_UPDATE_DATA'
      });
    }

    updateValues.push(sessionId);

    await db.run(`
      UPDATE sessions 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    const updatedSession = await db.get('SELECT * FROM sessions WHERE id = ?', [sessionId]);

    res.json({
      session: updatedSession,
      message: 'Sesión actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando sesión:', error);
    res.status(500).json({
      error: 'Error actualizando sesión',
      code: 'UPDATE_SESSION_ERROR'
    });
  }
};

// Export default del controlador
export default {
  getPatientSeries,
  createSession,
  getPatientSessions,
  getMySessions,
  getSessionById,
  updateSession
};