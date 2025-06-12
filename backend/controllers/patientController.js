import { getDatabase } from '../config/database.js';

export async function getPatients(req, res) {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ 
        error: 'Solo los instructores pueden ver pacientes',
        code: 'INSTRUCTOR_ONLY'
      });
    }

    const db = getDatabase();
    
    const patients = await db.all(`
      SELECT 
        p.*,
        u.email as user_email,
        u.phone as user_phone,
        u.last_login,
        ts.name as series_name,
        ts.therapy_type,
        ts.total_sessions,
        COUNT(s.id) as sessions_completed,
        AVG(s.pain_before - s.pain_after) as avg_pain_improvement,
        MAX(s.completed_at) as last_session_date
      FROM patients p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN therapy_series ts ON p.assigned_series_id = ts.id
      LEFT JOIN sessions s ON p.id = s.patient_id
      WHERE p.instructor_id = ? AND p.is_active = 1
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [req.user.id]);

    const processedPatients = patients.map(patient => ({
      ...patient,
      progress_percentage: patient.total_sessions 
        ? Math.round((patient.current_session / patient.total_sessions) * 100)
        : 0,
      avg_pain_improvement: patient.avg_pain_improvement 
        ? Math.round(patient.avg_pain_improvement * 10) / 10 
        : 0,
      has_series: !!patient.assigned_series_id,
      is_completed: patient.total_sessions 
        ? patient.current_session >= patient.total_sessions
        : false
    }));

    res.json(processedPatients);
  } catch (error) {
    console.error('Error obteniendo pacientes:', error);
    res.status(500).json({
      error: 'Error obteniendo pacientes',
      code: 'GET_PATIENTS_ERROR'
    });
  }
}

export async function getPatient(req, res) {
  try {
    const patientId = parseInt(req.params.id);
    const db = getDatabase();

    let query = `
      SELECT 
        p.*,
        u.email as user_email,
        u.phone as user_phone,
        u.last_login,
        ts.name as series_name,
        ts.therapy_type,
        ts.total_sessions,
        ts.postures as series_postures,
        instructor.name as instructor_name,
        instructor.email as instructor_email
      FROM patients p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN therapy_series ts ON p.assigned_series_id = ts.id
      LEFT JOIN users instructor ON p.instructor_id = instructor.id
      WHERE p.id = ? AND p.is_active = 1
    `;

    let params = [patientId];

    // Si es instructor, verificar que el paciente le pertenece
    if (req.user.role === 'instructor') {
      query += ' AND p.instructor_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'patient') {
      // Si es paciente, verificar que es su propio registro
      query += ' AND p.user_id = ?';
      params.push(req.user.id);
    }

    const patient = await db.get(query, params);

    if (!patient) {
      return res.status(404).json({
        error: 'Paciente no encontrado',
        code: 'PATIENT_NOT_FOUND'
      });
    }

    // Obtener estadísticas de sesiones
    const sessionStats = await db.get(`
      SELECT 
        COUNT(*) as total_sessions,
        AVG(pain_before) as avg_pain_before,
        AVG(pain_after) as avg_pain_after,
        AVG(pain_before - pain_after) as avg_improvement,
        AVG(duration_minutes) as avg_duration,
        MIN(completed_at) as first_session,
        MAX(completed_at) as last_session
      FROM sessions 
      WHERE patient_id = ?
    `, [patientId]);

    // Obtener últimas 10 sesiones
    const recentSessions = await db.all(`
      SELECT 
        s.*,
        ts.name as series_name,
        ts.therapy_type
      FROM sessions s
      LEFT JOIN therapy_series ts ON s.series_id = ts.id
      WHERE s.patient_id = ?
      ORDER BY s.completed_at DESC
      LIMIT 10
    `, [patientId]);

    res.json({
      patient: {
        ...patient,
        series_postures: patient.series_postures ? JSON.parse(patient.series_postures) : null,
        progress_percentage: patient.total_sessions 
          ? Math.round((patient.current_session / patient.total_sessions) * 100)
          : 0
      },
      stats: {
        ...sessionStats,
        avg_pain_before: sessionStats.avg_pain_before ? Math.round(sessionStats.avg_pain_before * 10) / 10 : 0,
        avg_pain_after: sessionStats.avg_pain_after ? Math.round(sessionStats.avg_pain_after * 10) / 10 : 0,
        avg_improvement: sessionStats.avg_improvement ? Math.round(sessionStats.avg_improvement * 10) / 10 : 0,
        avg_duration: sessionStats.avg_duration ? Math.round(sessionStats.avg_duration) : 0
      },
      recent_sessions: recentSessions
    });

  } catch (error) {
    console.error('Error obteniendo paciente:', error);
    res.status(500).json({
      error: 'Error obteniendo paciente',
      code: 'GET_PATIENT_ERROR'
    });
  }
}

export async function createPatient(req, res) {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({
        error: 'Solo los instructores pueden crear pacientes',
        code: 'INSTRUCTOR_ONLY'
      });
    }

    const { name, email, age, condition, emergency_contact, phone } = req.body;

    // Validaciones
    if (!name || !email || !age) {
      return res.status(400).json({
        error: 'Nombre, email y edad son obligatorios',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    if (age < 1 || age > 120) {
      return res.status(400).json({
        error: 'La edad debe estar entre 1 y 120 años',
        code: 'INVALID_AGE'
      });
    }

    const db = getDatabase();

    // Verificar si ya existe un paciente con este email para este instructor
    const existingPatient = await db.get(`
      SELECT id FROM patients 
      WHERE email = ? AND instructor_id = ? AND is_active = 1
    `, [email.toLowerCase(), req.user.id]);

    if (existingPatient) {
      return res.status(400).json({
        error: 'Ya tienes un paciente registrado con este email',
        code: 'PATIENT_EXISTS'
      });
    }

    // Crear paciente
    const result = await db.run(`
      INSERT INTO patients (
        instructor_id, name, email, age, condition, emergency_contact
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [req.user.id, name, email.toLowerCase(), age, condition, emergency_contact]);

    const patient = await db.get('SELECT * FROM patients WHERE id = ?', [result.lastID]);

    // Log analytics
    await db.run(`
      INSERT INTO analytics_events (user_id, patient_id, event_type, event_data) 
      VALUES (?, ?, 'patient_created', ?)
    `, [req.user.id, patient.id, JSON.stringify({ patient_name: name })]);

    res.status(201).json({
      patient,
      message: 'Paciente creado exitosamente'
    });

  } catch (error) {
    console.error('Error creando paciente:', error);
    res.status(500).json({
      error: 'Error creando paciente',
      code: 'CREATE_PATIENT_ERROR'
    });
  }
}

export async function updatePatient(req, res) {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({
        error: 'Solo los instructores pueden actualizar pacientes',
        code: 'INSTRUCTOR_ONLY'
      });
    }

    const patientId = parseInt(req.params.id);
    const { name, email, age, condition, emergency_contact, medical_notes } = req.body;

    const db = getDatabase();

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

    // Actualizar paciente
    const result = await db.run(`
      UPDATE patients 
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          age = COALESCE(?, age),
          condition = COALESCE(?, condition),
          emergency_contact = COALESCE(?, emergency_contact),
          medical_notes = COALESCE(?, medical_notes)
      WHERE id = ?
    `, [name, email?.toLowerCase(), age, condition, emergency_contact, medical_notes, patientId]);

    const updatedPatient = await db.get('SELECT * FROM patients WHERE id = ?', [patientId]);

    // Log analytics
    await db.run(`
      INSERT INTO analytics_events (user_id, patient_id, event_type, event_data) 
      VALUES (?, ?, 'patient_updated', ?)
    `, [req.user.id, patientId, JSON.stringify({ updated_fields: Object.keys(req.body) })]);

    res.json({
      patient: updatedPatient,
      message: 'Paciente actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando paciente:', error);
    res.status(500).json({
      error: 'Error actualizando paciente',
      code: 'UPDATE_PATIENT_ERROR'
    });
  }
}

export async function deletePatient(req, res) {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({
        error: 'Solo los instructores pueden eliminar pacientes',
        code: 'INSTRUCTOR_ONLY'
      });
    }

    const patientId = parseInt(req.params.id);
    const db = getDatabase();

    // Verificar que el paciente pertenece al instructor
    const patient = await db.get(`
      SELECT id, name FROM patients 
      WHERE id = ? AND instructor_id = ? AND is_active = 1
    `, [patientId, req.user.id]);

    if (!patient) {
      return res.status(404).json({
        error: 'Paciente no encontrado',
        code: 'PATIENT_NOT_FOUND'
      });
    }

    // Soft delete del paciente
    await db.run(`
      UPDATE patients 
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [patientId]);

    // Log analytics
    await db.run(`
      INSERT INTO analytics_events (user_id, patient_id, event_type, event_data) 
      VALUES (?, ?, 'patient_deleted', ?)
    `, [req.user.id, patientId, JSON.stringify({ patient_name: patient.name })]);

    res.json({ message: 'Paciente eliminado exitosamente' });

  } catch (error) {
    console.error('Error eliminando paciente:', error);
    res.status(500).json({
      error: 'Error eliminando paciente',
      code: 'DELETE_PATIENT_ERROR'
    });
  }
}

export async function assignSeries(req, res) {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({
        error: 'Solo los instructores pueden asignar series',
        code: 'INSTRUCTOR_ONLY'
      });
    }

    const patientId = parseInt(req.params.id);
    const { seriesId } = req.body;

    if (!seriesId) {
      return res.status(400).json({
        error: 'ID de serie es obligatorio',
        code: 'MISSING_SERIES_ID'
      });
    }

    const db = getDatabase();

    // Verificar que el paciente y la serie pertenecen al instructor
    const [patient, series] = await Promise.all([
      db.get(`
        SELECT id, name FROM patients 
        WHERE id = ? AND instructor_id = ? AND is_active = 1
      `, [patientId, req.user.id]),
      
      db.get(`
        SELECT id, name, therapy_type, total_sessions FROM therapy_series 
        WHERE id = ? AND instructor_id = ? AND is_active = 1
      `, [seriesId, req.user.id])
    ]);

    if (!patient) {
      return res.status(404).json({
        error: 'Paciente no encontrado',
        code: 'PATIENT_NOT_FOUND'
      });
    }

    if (!series) {
      return res.status(404).json({
        error: 'Serie no encontrada',
        code: 'SERIES_NOT_FOUND'
      });
    }

    // Asignar serie al paciente
    await db.run(`
      UPDATE patients 
      SET assigned_series_id = ?, 
          current_session = 0,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [seriesId, patientId]);

    // Crear notificación para el paciente si tiene cuenta de usuario
    const patientUser = await db.get('SELECT id FROM users WHERE id = (SELECT user_id FROM patients WHERE id = ?)', [patientId]);
    
    if (patientUser) {
      await db.run(`
        INSERT INTO notifications (user_id, type, title, message, data) 
        VALUES (?, 'series_assigned', 'Nueva Serie Asignada', ?, ?)
      `, [
        patientUser.id, 
        `Tu instructor te ha asignado la serie "${series.name}". ¡Puedes comenzar cuando estés listo!`,
        JSON.stringify({ series_id: seriesId, patient_id: patientId })
      ]);
    }

    // Log analytics
    await db.run(`
      INSERT INTO analytics_events (user_id, patient_id, event_type, event_data) 
      VALUES (?, ?, 'series_assigned', ?)
    `, [req.user.id, patientId, JSON.stringify({ 
      series_id: seriesId, 
      series_name: series.name,
      therapy_type: series.therapy_type
    })]);

    res.json({
      message: 'Serie asignada exitosamente',
      assignment: {
        patient_name: patient.name,
        series_name: series.name,
        therapy_type: series.therapy_type,
        total_sessions: series.total_sessions
      }
    });

  } catch (error) {
    console.error('Error asignando serie:', error);
    res.status(500).json({
      error: 'Error asignando serie',
      code: 'ASSIGN_SERIES_ERROR'
    });
  }
}

export async function unassignSeries(req, res) {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({
        error: 'Solo los instructores pueden desasignar series',
        code: 'INSTRUCTOR_ONLY'
      });
    }

    const patientId = parseInt(req.params.id);
    const db = getDatabase();

    // Verificar que el paciente pertenece al instructor
    const patient = await db.get(`
      SELECT id, name FROM patients 
      WHERE id = ? AND instructor_id = ? AND is_active = 1
    `, [patientId, req.user.id]);

    if (!patient) {
      return res.status(404).json({
        error: 'Paciente no encontrado',
        code: 'PATIENT_NOT_FOUND'
      });
    }

    // Desasignar serie
    await db.run(`
      UPDATE patients 
      SET assigned_series_id = NULL,
          current_session = 0,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [patientId]);

    // Log analytics
    await db.run(`
      INSERT INTO analytics_events (user_id, patient_id, event_type, event_data) 
      VALUES (?, ?, 'series_unassigned', ?)
    `, [req.user.id, patientId, JSON.stringify({ patient_name: patient.name })]);

    res.json({ message: 'Serie desasignada exitosamente' });

  } catch (error) {
    console.error('Error desasignando serie:', error);
    res.status(500).json({
      error: 'Error desasignando serie',
      code: 'UNASSIGN_SERIES_ERROR'
    });
  }
}

export async function getPatientProgress(req, res) {
  try {
    const patientId = parseInt(req.params.id);
    const db = getDatabase();

    let query = `
      SELECT 
        p.*,
        ts.name as series_name,
        ts.therapy_type,
        ts.total_sessions,
        ts.postures as series_postures
      FROM patients p
      LEFT JOIN therapy_series ts ON p.assigned_series_id = ts.id
      WHERE p.id = ? AND p.is_active = 1
    `;

    let params = [patientId];

    // Verificar permisos
    if (req.user.role === 'instructor') {
      query += ' AND p.instructor_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'patient') {
      query += ' AND p.user_id = ?';
      params.push(req.user.id);
    }

    const patient = await db.get(query, params);

    if (!patient) {
      return res.status(404).json({
        error: 'Paciente no encontrado',
        code: 'PATIENT_NOT_FOUND'
      });
    }

    if (!patient.assigned_series_id) {
      return res.json({
        patient: {
          id: patient.id,
          name: patient.name,
          has_series: false
        },
        progress: null,
        message: 'No hay serie asignada'
      });
    }

    // Obtener progreso detallado
    const sessions = await db.all(`
      SELECT * FROM sessions 
      WHERE patient_id = ? 
      ORDER BY session_number ASC
    `, [patientId]);

    const progressData = {
      total_sessions: patient.total_sessions,
      current_session: patient.current_session,
      sessions_completed: sessions.length,
      progress_percentage: Math.round((patient.current_session / patient.total_sessions) * 100),
      is_completed: patient.current_session >= patient.total_sessions,
      series_postures: patient.series_postures ? JSON.parse(patient.series_postures) : [],
      pain_trend: sessions.map(s => ({
        session: s.session_number,
        before: s.pain_before,
        after: s.pain_after,
        improvement: s.pain_before - s.pain_after,
        date: s.completed_at
      }))
    };

    res.json({
      patient: {
        id: patient.id,
        name: patient.name,
        series_name: patient.series_name,
        therapy_type: patient.therapy_type,
        has_series: true
      },
      progress: progressData
    });

  } catch (error) {
    console.error('Error obteniendo progreso:', error);
    res.status(500).json({
      error: 'Error obteniendo progreso',
      code: 'GET_PROGRESS_ERROR'
    });
  }
}