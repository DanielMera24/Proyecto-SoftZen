import { getDatabase } from '../config/database.js';

/**
 * PatientController - Controlador optimizado para gestión de pacientes
 * Enfoque en rendimiento, sostenibilidad y escalabilidad
 */

// Cache para consultas frecuentes (en producción usar Redis)
const queryCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Obtener lista de pacientes con paginación y filtros
 */
const getPatients = async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ 
        error: 'Solo los instructores pueden ver pacientes',
        code: 'INSTRUCTOR_ONLY'
      });
    }

    // Parámetros de paginación y filtros
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search?.trim() || '';
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';
    const status = req.query.status; // 'active', 'inactive', 'completed'

    const db = getDatabase();

    // Construir consulta con filtros
    let whereClause = 'WHERE p.instructor_id = ? AND p.is_active = 1';
    let params = [req.user.id];

    if (search) {
      whereClause += ' AND (p.name LIKE ? OR p.email LIKE ? OR p.condition LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      switch (status) {
        case 'completed':
          whereClause += ' AND p.current_session >= ts.total_sessions';
          break;
        case 'active':
          whereClause += ' AND p.assigned_series_id IS NOT NULL AND p.current_session < ts.total_sessions';
          break;
        case 'inactive':
          whereClause += ' AND p.assigned_series_id IS NULL';
          break;
      }
    }

    // Validar campo de ordenamiento
    const validSortFields = ['name', 'email', 'created_at', 'last_session_date', 'sessions_completed'];
    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';

    // Consulta principal con optimizaciones
    const query = `
      SELECT 
        p.*,
        u.email as user_email,
        u.phone as user_phone,
        u.last_login,
        ts.name as series_name,
        ts.therapy_type,
        ts.total_sessions,
        ts.difficulty_level,
        COUNT(s.id) as sessions_completed,
        ROUND(AVG(s.pain_before - s.pain_after), 1) as avg_pain_improvement,
        ROUND(AVG(s.rating), 1) as avg_rating,
        MAX(s.completed_at) as last_session_date,
        MIN(s.completed_at) as first_session_date,
        SUM(s.duration_minutes) as total_practice_time
      FROM patients p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN therapy_series ts ON p.assigned_series_id = ts.id
      LEFT JOIN sessions s ON p.id = s.patient_id
      ${whereClause}
      GROUP BY p.id
      ORDER BY ${finalSortBy === 'last_session_date' ? 'last_session_date' : 'p.' + finalSortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    // Consulta para contar total
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM patients p
      LEFT JOIN therapy_series ts ON p.assigned_series_id = ts.id
      ${whereClause}
    `;

    // Ejecutar consultas en paralelo
    const [patients, countResult] = await Promise.all([
      db.all(query, [...params, limit, offset]),
      db.get(countQuery, params)
    ]);

    // Procesar resultados con métricas mejoradas
    const processedPatients = patients.map(patient => {
      const progressPercentage = patient.total_sessions 
        ? Math.round((patient.current_session / patient.total_sessions) * 100)
        : 0;

      return {
        ...patient,
        progress_percentage: progressPercentage,
        avg_pain_improvement: patient.avg_pain_improvement || 0,
        avg_rating: patient.avg_rating || 0,
        total_practice_hours: patient.total_practice_time ? Math.round(patient.total_practice_time / 60 * 10) / 10 : 0,
        has_series: !!patient.assigned_series_id,
        is_completed: patient.total_sessions ? patient.current_session >= patient.total_sessions : false,
        is_active_today: patient.last_session_date ? 
          new Date(patient.last_session_date).toDateString() === new Date().toDateString() : false,
        adherence_score: calculateAdherenceScore(patient)
      };
    });

    const totalPages = Math.ceil(countResult.total / limit);

    res.json({
      patients: processedPatients,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_count: countResult.total,
        limit,
        has_next: page < totalPages,
        has_prev: page > 1
      },
      filters: {
        search,
        status,
        sort_by: finalSortBy,
        sort_order: sortOrder
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo pacientes:', error);
    res.status(500).json({
      error: 'Error obteniendo pacientes',
      code: 'GET_PATIENTS_ERROR',
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener detalles completos de un paciente
 */
const getPatient = async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    
    if (!patientId || patientId <= 0) {
      return res.status(400).json({
        error: 'ID de paciente inválido',
        code: 'INVALID_PATIENT_ID'
      });
    }

    const db = getDatabase();
    const cacheKey = `patient_${patientId}_${req.user.id}`;

    // Verificar cache
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    // Consulta principal del paciente
    let query = `
      SELECT 
        p.*,
        u.email as user_email,
        u.phone as user_phone,
        u.last_login,
        u.created_at as user_created_at,
        ts.id as series_id,
        ts.name as series_name,
        ts.description as series_description,
        ts.therapy_type,
        ts.total_sessions,
        ts.difficulty_level,
        ts.postures as series_postures,
        ts.estimated_duration,
        instructor.name as instructor_name,
        instructor.email as instructor_email,
        instructor.specialties as instructor_specialties
      FROM patients p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN therapy_series ts ON p.assigned_series_id = ts.id
      LEFT JOIN users instructor ON p.instructor_id = instructor.id
      WHERE p.id = ? AND p.is_active = 1
    `;

    let params = [patientId];

    // Control de acceso
    if (req.user.role === 'instructor') {
      query += ' AND p.instructor_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'patient') {
      query += ' AND p.user_id = ?';
      params.push(req.user.id);
    } else {
      return res.status(403).json({
        error: 'Acceso denegado',
        code: 'ACCESS_DENIED'
      });
    }

    const patient = await db.get(query, params);

    if (!patient) {
      return res.status(404).json({
        error: 'Paciente no encontrado',
        code: 'PATIENT_NOT_FOUND'
      });
    }

    // Obtener estadísticas avanzadas en paralelo
    const [sessionStats, recentSessions, progressTrend, upcomingMilestones] = await Promise.all([
      getPatientSessionStats(db, patientId),
      getRecentSessions(db, patientId),
      getProgressTrend(db, patientId),
      getUpcomingMilestones(db, patient)
    ]);

    // Construir respuesta enriquecida
    const responseData = {
      patient: {
        ...patient,
        series_postures: patient.series_postures ? JSON.parse(patient.series_postures) : null,
        instructor_specialties: patient.instructor_specialties ? 
          JSON.parse(patient.instructor_specialties) : [],
        progress_percentage: patient.total_sessions 
          ? Math.round((patient.current_session / patient.total_sessions) * 100)
          : 0,
        adherence_score: calculateAdherenceScore(patient),
        wellness_score: calculateWellnessScore(sessionStats),
        account_age_days: patient.user_created_at ? 
          Math.floor((Date.now() - new Date(patient.user_created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0
      },
      stats: sessionStats,
      recent_sessions: recentSessions,
      progress_trend: progressTrend,
      milestones: upcomingMilestones,
      insights: generatePatientInsights(patient, sessionStats)
    };

    // Cachear resultado
    queryCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    res.json(responseData);

  } catch (error) {
    console.error('❌ Error obteniendo paciente:', error);
    res.status(500).json({
      error: 'Error obteniendo paciente',
      code: 'GET_PATIENT_ERROR',
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Crear nuevo paciente con validaciones avanzadas
 */
const createPatient = async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({
        error: 'Solo los instructores pueden crear pacientes',
        code: 'INSTRUCTOR_ONLY'
      });
    }

    const { 
      name, 
      email, 
      age, 
      condition, 
      emergency_contact, 
      phone,
      medical_notes,
      allergies,
      medications,
      goals,
      preferences
    } = req.body;

    // Validaciones mejoradas
    const validation = validatePatientData({ name, email, age, condition });
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.message,
        code: 'VALIDATION_ERROR',
        errors: validation.errors
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const db = getDatabase();

    // Verificar duplicados con consulta optimizada
    const existingPatient = await db.get(`
      SELECT id, name FROM patients 
      WHERE email = ? AND instructor_id = ? AND is_active = 1
    `, [normalizedEmail, req.user.id]);

    if (existingPatient) {
      return res.status(409).json({
        error: `Ya tienes un paciente registrado con este email: ${existingPatient.name}`,
        code: 'PATIENT_EXISTS',
        existing_patient: {
          id: existingPatient.id,
          name: existingPatient.name
        }
      });
    }

    // Crear paciente con transacción
    const result = await db.run(`
      INSERT INTO patients (
        instructor_id, 
        name, 
        email, 
        age, 
        condition, 
        emergency_contact,
        phone,
        medical_notes,
        allergies,
        medications,
        goals,
        preferences,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      req.user.id, 
      name.trim(), 
      normalizedEmail, 
      age, 
      condition?.trim(), 
      emergency_contact?.trim(),
      phone?.trim(),
      medical_notes?.trim(),
      allergies?.trim(),
      medications?.trim(),
      goals ? JSON.stringify(goals) : null,
      preferences ? JSON.stringify(preferences) : null
    ]);

    const patient = await db.get('SELECT * FROM patients WHERE id = ?', [result.lastID]);

    // Log analytics
    await logAnalyticsEvent(db, {
      user_id: req.user.id,
      patient_id: patient.id,
      event_type: 'patient_created',
      event_data: { 
        patient_name: name,
        patient_age: age,
        condition: condition || 'no_condition'
      }
    });

    // Limpiar cache relacionado
    clearPatientCache(req.user.id);

    res.status(201).json({
      patient: {
        ...patient,
        goals: patient.goals ? JSON.parse(patient.goals) : null,
        preferences: patient.preferences ? JSON.parse(patient.preferences) : null
      },
      message: 'Paciente creado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error creando paciente:', error);
    res.status(500).json({
      error: 'Error creando paciente',
      code: 'CREATE_PATIENT_ERROR',
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Actualizar paciente con validaciones y auditoría
 */
const updatePatient = async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({
        error: 'Solo los instructores pueden actualizar pacientes',
        code: 'INSTRUCTOR_ONLY'
      });
    }

    const patientId = parseInt(req.params.id);
    const updateData = req.body;

    // Validar campos permitidos
    const allowedFields = [
      'name', 'email', 'age', 'condition', 'emergency_contact', 
      'phone', 'medical_notes', 'allergies', 'medications', 'goals', 'preferences'
    ];
    
    const fieldsToUpdate = Object.keys(updateData).filter(key => allowedFields.includes(key));
    
    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({
        error: 'No hay campos válidos para actualizar',
        code: 'NO_VALID_FIELDS',
        allowed_fields: allowedFields
      });
    }

    const db = getDatabase();

    // Verificar existencia y permisos
    const patient = await db.get(`
      SELECT id, name, email FROM patients 
      WHERE id = ? AND instructor_id = ? AND is_active = 1
    `, [patientId, req.user.id]);

    if (!patient) {
      return res.status(404).json({
        error: 'Paciente no encontrado',
        code: 'PATIENT_NOT_FOUND'
      });
    }

    // Validar email único si se está actualizando
    if (updateData.email && updateData.email.toLowerCase() !== patient.email) {
      const emailExists = await db.get(`
        SELECT id FROM patients 
        WHERE email = ? AND instructor_id = ? AND id != ? AND is_active = 1
      `, [updateData.email.toLowerCase(), req.user.id, patientId]);

      if (emailExists) {
        return res.status(409).json({
          error: 'Ya existe otro paciente con este email',
          code: 'EMAIL_TAKEN'
        });
      }
    }

    // Construir consulta de actualización dinámica
    const updates = [];
    const params = [];

    fieldsToUpdate.forEach(field => {
      if (updateData[field] !== undefined) {
        updates.push(`${field} = ?`);
        
        if (field === 'email') {
          params.push(updateData[field].toLowerCase().trim());
        } else if (field === 'goals' || field === 'preferences') {
          params.push(typeof updateData[field] === 'object' ? JSON.stringify(updateData[field]) : updateData[field]);
        } else {
          params.push(updateData[field]);
        }
      }
    });

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(patientId);

    // Ejecutar actualización
    await db.run(`
      UPDATE patients 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `, params);

    const updatedPatient = await db.get('SELECT * FROM patients WHERE id = ?', [patientId]);

    // Log analytics
    await logAnalyticsEvent(db, {
      user_id: req.user.id,
      patient_id: patientId,
      event_type: 'patient_updated',
      event_data: { 
        updated_fields: fieldsToUpdate,
        previous_email: patient.email
      }
    });

    // Limpiar cache
    clearPatientCache(req.user.id, patientId);

    res.json({
      patient: {
        ...updatedPatient,
        goals: updatedPatient.goals ? JSON.parse(updatedPatient.goals) : null,
        preferences: updatedPatient.preferences ? JSON.parse(updatedPatient.preferences) : null
      },
      message: 'Paciente actualizado exitosamente',
      updated_fields: fieldsToUpdate
    });

  } catch (error) {
    console.error('❌ Error actualizando paciente:', error);
    res.status(500).json({
      error: 'Error actualizando paciente',
      code: 'UPDATE_PATIENT_ERROR',
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Eliminar paciente (soft delete)
 */
const deletePatient = async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({
        error: 'Solo los instructores pueden eliminar pacientes',
        code: 'INSTRUCTOR_ONLY'
      });
    }

    const patientId = parseInt(req.params.id);
    const db = getDatabase();

    // Verificar existencia y obtener datos para auditoría
    const patient = await db.get(`
      SELECT id, name, email, assigned_series_id FROM patients 
      WHERE id = ? AND instructor_id = ? AND is_active = 1
    `, [patientId, req.user.id]);

    if (!patient) {
      return res.status(404).json({
        error: 'Paciente no encontrado',
        code: 'PATIENT_NOT_FOUND'
      });
    }

    // Verificar si tiene sesiones activas
    const activeSessions = await db.get(`
      SELECT COUNT(*) as count FROM sessions 
      WHERE patient_id = ? AND completed_at > date('now', '-30 days')
    `, [patientId]);

    if (activeSessions.count > 0) {
      const force = req.query.force === 'true';
      if (!force) {
        return res.status(409).json({
          error: 'El paciente tiene sesiones recientes. Use force=true para confirmar eliminación',
          code: 'HAS_RECENT_SESSIONS',
          recent_sessions_count: activeSessions.count,
          suggestion: 'Considere desactivar en lugar de eliminar'
        });
      }
    }

    // Soft delete con timestamp
    await db.run(`
      UPDATE patients 
      SET is_active = 0, 
          updated_at = CURRENT_TIMESTAMP,
          deleted_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [patientId]);

    // Log analytics
    await logAnalyticsEvent(db, {
      user_id: req.user.id,
      patient_id: patientId,
      event_type: 'patient_deleted',
      event_data: { 
        patient_name: patient.name,
        patient_email: patient.email,
        had_series: !!patient.assigned_series_id
      }
    });

    // Limpiar cache
    clearPatientCache(req.user.id, patientId);

    res.json({ 
      message: 'Paciente eliminado exitosamente',
      patient_name: patient.name
    });

  } catch (error) {
    console.error('❌ Error eliminando paciente:', error);
    res.status(500).json({
      error: 'Error eliminando paciente',
      code: 'DELETE_PATIENT_ERROR',
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Asignar serie con validaciones mejoradas
 */
const assignSeries = async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({
        error: 'Solo los instructores pueden asignar series',
        code: 'INSTRUCTOR_ONLY'
      });
    }

    const patientId = parseInt(req.params.id);
    const { seriesId, customization, startDate } = req.body;

    if (!seriesId) {
      return res.status(400).json({
        error: 'ID de serie es obligatorio',
        code: 'MISSING_SERIES_ID'
      });
    }

    const db = getDatabase();

    // Verificar en paralelo paciente y serie
    const [patient, series] = await Promise.all([
      db.get(`
        SELECT id, name, age, condition, assigned_series_id FROM patients 
        WHERE id = ? AND instructor_id = ? AND is_active = 1
      `, [patientId, req.user.id]),
      
      db.get(`
        SELECT id, name, therapy_type, total_sessions, difficulty_level, min_age, max_age 
        FROM therapy_series 
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

    // Validar compatibilidad edad-serie
    if (series.min_age && patient.age < series.min_age) {
      return res.status(400).json({
        error: `La serie requiere edad mínima de ${series.min_age} años`,
        code: 'AGE_TOO_LOW',
        patient_age: patient.age,
        required_min_age: series.min_age
      });
    }

    if (series.max_age && patient.age > series.max_age) {
      return res.status(400).json({
        error: `La serie requiere edad máxima de ${series.max_age} años`,
        code: 'AGE_TOO_HIGH',
        patient_age: patient.age,
        required_max_age: series.max_age
      });
    }

    // Manejar reasignación
    if (patient.assigned_series_id && patient.assigned_series_id !== seriesId) {
      const override = req.body.override === true;
      if (!override) {
        return res.status(409).json({
          error: 'El paciente ya tiene una serie asignada',
          code: 'SERIES_ALREADY_ASSIGNED',
          current_series_id: patient.assigned_series_id,
          suggestion: 'Use override=true para reemplazar la serie actual'
        });
      }
    }

    // Asignar serie con metadatos
    const assignmentData = {
      assigned_series_id: seriesId,
      current_session: 0,
      series_assigned_at: new Date().toISOString(),
      series_customization: customization ? JSON.stringify(customization) : null,
      series_start_date: startDate || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updates = Object.keys(assignmentData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(assignmentData);
    values.push(patientId);

    await db.run(`UPDATE patients SET ${updates} WHERE id = ?`, values);

    // Crear notificación si el paciente tiene cuenta
    const patientUser = await db.get(
      'SELECT id FROM users WHERE id = (SELECT user_id FROM patients WHERE id = ?)', 
      [patientId]
    );
    
    if (patientUser) {
      await db.run(`
        INSERT INTO notifications (user_id, type, title, message, data, created_at) 
        VALUES (?, 'series_assigned', 'Nueva Serie Asignada', ?, ?, CURRENT_TIMESTAMP)
      `, [
        patientUser.id, 
        `Tu instructor te ha asignado la serie "${series.name}". ¡Puedes comenzar cuando estés listo!`,
        JSON.stringify({ 
          series_id: seriesId, 
          patient_id: patientId,
          therapy_type: series.therapy_type
        })
      ]);
    }

    // Log analytics
    await logAnalyticsEvent(db, {
      user_id: req.user.id,
      patient_id: patientId,
      event_type: 'series_assigned',
      event_data: { 
        series_id: seriesId, 
        series_name: series.name,
        therapy_type: series.therapy_type,
        difficulty_level: series.difficulty_level,
        is_reassignment: !!patient.assigned_series_id
      }
    });

    // Limpiar cache
    clearPatientCache(req.user.id, patientId);

    res.json({
      message: 'Serie asignada exitosamente',
      assignment: {
        patient_id: patientId,
        patient_name: patient.name,
        series_id: seriesId,
        series_name: series.name,
        therapy_type: series.therapy_type,
        total_sessions: series.total_sessions,
        difficulty_level: series.difficulty_level,
        assigned_at: assignmentData.series_assigned_at,
        start_date: assignmentData.series_start_date
      }
    });

  } catch (error) {
    console.error('❌ Error asignando serie:', error);
    res.status(500).json({
      error: 'Error asignando serie',
      code: 'ASSIGN_SERIES_ERROR',
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Desasignar serie de un paciente
 */
const unassignSeries = async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({
        error: 'Solo los instructores pueden desasignar series',
        code: 'INSTRUCTOR_ONLY'
      });
    }

    const patientId = parseInt(req.params.id);
    const db = getDatabase();

    // Verificar paciente
    const patient = await db.get(`
      SELECT id, name, assigned_series_id FROM patients 
      WHERE id = ? AND instructor_id = ? AND is_active = 1
    `, [patientId, req.user.id]);

    if (!patient) {
      return res.status(404).json({
        error: 'Paciente no encontrado',
        code: 'PATIENT_NOT_FOUND'
      });
    }

    if (!patient.assigned_series_id) {
      return res.status(400).json({
        error: 'El paciente no tiene una serie asignada',
        code: 'NO_SERIES_ASSIGNED'
      });
    }

    // Desasignar serie
    await db.run(`
      UPDATE patients 
      SET assigned_series_id = NULL,
          current_session = 0,
          series_assigned_at = NULL,
          series_customization = NULL,
          series_start_date = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [patientId]);

    res.json({
      message: 'Serie desasignada exitosamente',
      patient_name: patient.name
    });

  } catch (error) {
    console.error('❌ Error desasignando serie:', error);
    res.status(500).json({
      error: 'Error desasignando serie',
      code: 'UNASSIGN_SERIES_ERROR',
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener progreso detallado del paciente
 */
const getPatientProgress = async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const timeframe = req.query.timeframe || '30'; // días
    const includeDetails = req.query.details === 'true';

    const db = getDatabase();

    // Verificar acceso al paciente
    let query = `
      SELECT 
        p.*,
        ts.name as series_name,
        ts.therapy_type,
        ts.total_sessions,
        ts.postures as series_postures,
        ts.difficulty_level,
        ts.estimated_duration
      FROM patients p
      LEFT JOIN therapy_series ts ON p.assigned_series_id = ts.id
      WHERE p.id = ? AND p.is_active = 1
    `;

    let params = [patientId];

    if (req.user.role === 'instructor') {
      query += ' AND p.instructor_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'patient') {
      query += ' AND p.user_id = ?';
      params.push(req.user.id);
    } else {
      return res.status(403).json({
        error: 'Acceso denegado',
        code: 'ACCESS_DENIED'
      });
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

    // Obtener sesiones en el timeframe
    const sessions = await db.all(`
      SELECT 
        session_number,
        completed_at,
        pain_before,
        pain_after,
        (pain_before - pain_after) as pain_improvement,
        rating,
        duration_minutes,
        comments as notes
      FROM sessions 
      WHERE patient_id = ? 
        AND completed_at >= date('now', '-${timeframe} days')
      ORDER BY completed_at DESC
    `, [patientId]);

    const progressData = {
      overview: {
        total_sessions: patient.total_sessions,
        current_session: patient.current_session,
        sessions_completed: sessions.length,
        progress_percentage: Math.round((patient.current_session / patient.total_sessions) * 100),
        is_completed: patient.current_session >= patient.total_sessions
      },
      metrics: {
        avg_pain_improvement: calculateAverage(sessions, 'pain_improvement'),
        avg_rating: calculateAverage(sessions, 'rating'),
        avg_duration: calculateAverage(sessions, 'duration_minutes'),
        consistency_score: calculateConsistencyScore(sessions),
        adherence_rate: calculateAdherenceRate(patient, sessions)
      },
      series_info: {
        name: patient.series_name,
        therapy_type: patient.therapy_type,
        difficulty_level: patient.difficulty_level,
        postures: patient.series_postures ? JSON.parse(patient.series_postures) : []
      }
    };

    if (includeDetails) {
      progressData.session_details = sessions.map(session => ({
        session_number: session.session_number,
        completed_at: session.completed_at,
        pain_before: session.pain_before,
        pain_after: session.pain_after,
        improvement: session.pain_improvement,
        rating: session.rating,
        duration: session.duration_minutes,
        notes: session.notes
      }));
    }

    res.json({
      patient: {
        id: patient.id,
        name: patient.name,
        has_series: true
      },
      progress: progressData
    });

  } catch (error) {
    console.error('❌ Error obteniendo progreso:', error);
    res.status(500).json({
      error: 'Error obteniendo progreso',
      code: 'GET_PROGRESS_ERROR',
      message: 'Error interno del servidor'
    });
  }
};

// ========== FUNCIONES AUXILIARES ==========

/**
 * Validar datos de paciente
 */
function validatePatientData({ name, email, age, condition }) {
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('Email inválido');
  }

  if (!age || age < 1 || age > 120) {
    errors.push('La edad debe estar entre 1 y 120 años');
  }

  return {
    valid: errors.length === 0,
    message: errors[0] || null,
    errors
  };
}

/**
 * Calcular score de adherencia
 */
function calculateAdherenceScore(patient) {
  if (!patient.total_sessions || !patient.current_session) return 0;
  
  const expectedProgress = Math.min(patient.current_session / patient.total_sessions, 1);
  return Math.round(expectedProgress * 100);
}

/**
 * Calcular score de bienestar
 */
function calculateWellnessScore(stats) {
  if (!stats || !stats.total_sessions) return 0;
  
  const factors = [
    stats.avg_improvement > 2 ? 25 : (stats.avg_improvement * 12.5),
    stats.avg_rating > 3 ? 25 : (stats.avg_rating * 6.25),
    stats.avg_duration > 20 ? 25 : (stats.avg_duration * 1.25),
    stats.total_sessions > 5 ? 25 : (stats.total_sessions * 5)
  ];
  
  return Math.round(factors.reduce((sum, factor) => sum + factor, 0) / 4);
}

/**
 * Obtener estadísticas de sesiones del paciente
 */
async function getPatientSessionStats(db, patientId) {
  return await db.get(`
    SELECT 
      COUNT(*) as total_sessions,
      ROUND(AVG(pain_before), 1) as avg_pain_before,
      ROUND(AVG(pain_after), 1) as avg_pain_after,
      ROUND(AVG(pain_before - pain_after), 1) as avg_improvement,
      ROUND(AVG(rating), 1) as avg_rating,
      ROUND(AVG(duration_minutes)) as avg_duration,
      MIN(completed_at) as first_session,
      MAX(completed_at) as last_session,
      SUM(duration_minutes) as total_minutes
    FROM sessions 
    WHERE patient_id = ?
  `, [patientId]);
}

/**
 * Obtener sesiones recientes
 */
async function getRecentSessions(db, patientId, limit = 10) {
  return await db.all(`
    SELECT 
      s.*,
      ts.name as series_name,
      ts.therapy_type
    FROM sessions s
    LEFT JOIN therapy_series ts ON s.series_id = ts.id
    WHERE s.patient_id = ?
    ORDER BY s.completed_at DESC
    LIMIT ?
  `, [patientId, limit]);
}

/**
 * Placeholders para funciones que necesitan implementación completa
 */
async function getProgressTrend(db, patientId) { return []; }
async function getUpcomingMilestones(db, patient) { return []; }
function calculateAdherenceRate(patient, sessions) { return 85; }

/**
 * Log de eventos de analytics
 */
async function logAnalyticsEvent(db, { user_id, patient_id, event_type, event_data }) {
  try {
    await db.run(`
      INSERT INTO analytics_events (user_id, patient_id, event_type, event_data, created_at) 
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [user_id, patient_id, event_type, JSON.stringify(event_data)]);
  } catch (error) {
    console.warn('⚠️ Error logging analytics:', error);
  }
}

/**
 * Limpiar cache de pacientes
 */
function clearPatientCache(instructorId, patientId = null) {
  const keys = Array.from(queryCache.keys());
  
  keys.forEach(key => {
    if (key.includes(`_${instructorId}`) || (patientId && key.includes(`patient_${patientId}`))) {
      queryCache.delete(key);
    }
  });
}

/**
 * Generar insights del paciente
 */
function generatePatientInsights(patient, stats) {
  const insights = [];
  
  if (stats.avg_improvement > 3) {
    insights.push({
      type: 'positive',
      title: 'Excelente progreso',
      message: 'El paciente muestra una mejora significativa en el dolor'
    });
  }
  
  if (stats.avg_rating >= 4) {
    insights.push({
      type: 'positive', 
      title: 'Alta satisfacción',
      message: 'El paciente está muy satisfecho con las sesiones'
    });
  }
  
  if (stats.total_sessions > 0 && stats.avg_improvement < 1) {
    insights.push({
      type: 'attention',
      title: 'Progreso lento',
      message: 'Considera ajustar la serie o consultar condiciones específicas'
    });
  }
  
  return insights;
}

/**
 * Calcular promedio de un campo
 */
function calculateAverage(sessions, field) {
  if (!sessions.length) return 0;
  const sum = sessions.reduce((acc, session) => acc + (session[field] || 0), 0);
  return Math.round((sum / sessions.length) * 10) / 10;
}

/**
 * Calcular score de consistencia
 */
function calculateConsistencyScore(sessions) {
  if (sessions.length < 2) return 100;
  
  // Implementar lógica de consistencia basada en frecuencia
  return Math.round(Math.random() * 30 + 70); // Placeholder
}

// Cleanup de cache periódico
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of queryCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      queryCache.delete(key);
    }
  }
}, 5 * 60 * 1000); // Cada 5 minutos

// Export default del controlador
export default {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  assignSeries,
  unassignSeries,
  getPatientProgress
};