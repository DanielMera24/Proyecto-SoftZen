import { getDatabase } from '../config/database.js';

export async function getInstructorDashboard(req, res) {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({
        error: 'Solo los instructores pueden acceder al dashboard',
        code: 'INSTRUCTOR_ONLY'
      });
    }

    const db = getDatabase();

    // Ejecutar todas las consultas en paralelo
    const [
      overviewStats,
      recentActivity,
      painTrends,
      therapyTypeStats,
      patientsProgress,
      seriesStats
    ] = await Promise.all([
      // Estadísticas generales
      db.get(`
        SELECT 
          COUNT(DISTINCT p.id) as total_patients,
          COUNT(DISTINCT CASE WHEN p.assigned_series_id IS NOT NULL THEN p.id END) as active_patients,
          COUNT(DISTINCT ts.id) as total_series,
          COUNT(DISTINCT s.id) as total_sessions,
          AVG(s.pain_before - s.pain_after) as avg_pain_improvement,
          AVG(s.duration_minutes) as avg_session_duration,
          AVG(s.rating) as avg_rating
        FROM patients p
        LEFT JOIN therapy_series ts ON ts.instructor_id = ?
        LEFT JOIN sessions s ON s.patient_id = p.id
        WHERE p.instructor_id = ? AND p.is_active = 1
      `, [req.user.id, req.user.id]),

      // Actividad reciente (últimas 10 sesiones)
      db.all(`
        SELECT 
          'session' as type,
          p.name as patient_name,
          s.completed_at as date,
          s.pain_before,
          s.pain_after,
          s.session_number,
          s.rating,
          ts.name as series_name
        FROM sessions s
        JOIN patients p ON s.patient_id = p.id
        LEFT JOIN therapy_series ts ON s.series_id = ts.id
        WHERE p.instructor_id = ?
        ORDER BY s.completed_at DESC
        LIMIT 10
      `, [req.user.id]),

      // Tendencias de dolor por semana (últimas 8 semanas)
      db.all(`
        SELECT 
          strftime('%Y-%W', s.completed_at) as week,
          strftime('%Y-%m-%d', s.completed_at, 'weekday 0', '-6 days') as week_start,
          AVG(s.pain_before) as avg_pain_before,
          AVG(s.pain_after) as avg_pain_after,
          COUNT(s.id) as session_count
        FROM sessions s
        JOIN patients p ON s.patient_id = p.id
        WHERE p.instructor_id = ? AND s.completed_at >= date('now', '-8 weeks')
        GROUP BY strftime('%Y-%W', s.completed_at)
        ORDER BY week DESC
        LIMIT 8
      `, [req.user.id]),

      // Estadísticas por tipo de terapia
      db.all(`
        SELECT 
          ts.therapy_type,
          COUNT(DISTINCT ts.id) as series_count,
          COUNT(DISTINCT p.id) as patients_count,
          COUNT(s.id) as sessions_count,
          AVG(s.pain_before - s.pain_after) as avg_improvement,
          AVG(s.rating) as avg_rating
        FROM therapy_series ts
        LEFT JOIN patients p ON p.assigned_series_id = ts.id AND p.is_active = 1
        LEFT JOIN sessions s ON s.patient_id = p.id
        WHERE ts.instructor_id = ? AND ts.is_active = 1
        GROUP BY ts.therapy_type
      `, [req.user.id]),

      // Progreso de pacientes activos
      db.all(`
        SELECT 
          p.id,
          p.name,
          p.current_session,
          ts.total_sessions,
          ts.name as series_name,
          ts.therapy_type,
          ROUND((CAST(p.current_session AS REAL) / ts.total_sessions) * 100) as progress_percentage,
          MAX(s.completed_at) as last_session_date,
          AVG(s.pain_before - s.pain_after) as avg_improvement
        FROM patients p
        JOIN therapy_series ts ON p.assigned_series_id = ts.id
        LEFT JOIN sessions s ON s.patient_id = p.id
        WHERE p.instructor_id = ? AND p.is_active = 1 AND ts.is_active = 1
        GROUP BY p.id, p.name, p.current_session, ts.total_sessions, ts.name, ts.therapy_type
        ORDER BY progress_percentage DESC, p.name
      `, [req.user.id]),

      // Estadísticas de series
      db.all(`
        SELECT 
          ts.id,
          ts.name,
          ts.therapy_type,
          ts.total_sessions,
          COUNT(DISTINCT p.id) as assigned_patients,
          COUNT(s.id) as completed_sessions,
          AVG(s.pain_before - s.pain_after) as avg_improvement,
          AVG(s.rating) as avg_rating,
          ts.created_at
        FROM therapy_series ts
        LEFT JOIN patients p ON p.assigned_series_id = ts.id AND p.is_active = 1
        LEFT JOIN sessions s ON s.patient_id = p.id
        WHERE ts.instructor_id = ? AND ts.is_active = 1
        GROUP BY ts.id
        ORDER BY ts.created_at DESC
      `, [req.user.id])
    ]);

    // Procesar y formatear los datos
    const processedData = {
      overview: {
        ...overviewStats,
        avg_pain_improvement: overviewStats.avg_pain_improvement ? 
          Math.round(overviewStats.avg_pain_improvement * 10) / 10 : 0,
        avg_session_duration: overviewStats.avg_session_duration ? 
          Math.round(overviewStats.avg_session_duration) : 0,
        avg_rating: overviewStats.avg_rating ? 
          Math.round(overviewStats.avg_rating * 10) / 10 : 0,
        inactive_patients: overviewStats.total_patients - overviewStats.active_patients
      },
      
      recent_activity: recentActivity.map(activity => ({
        ...activity,
        pain_improvement: activity.pain_before - activity.pain_after,
        date_formatted: new Date(activity.date).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      })),
      
      pain_trends: painTrends.reverse().map(trend => ({
        ...trend,
        avg_pain_before: Math.round(trend.avg_pain_before * 10) / 10,
        avg_pain_after: Math.round(trend.avg_pain_after * 10) / 10,
        improvement: Math.round((trend.avg_pain_before - trend.avg_pain_after) * 10) / 10,
        week_label: new Date(trend.week_start).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit'
        })
      })),
      
      therapy_types: therapyTypeStats.map(stat => ({
        ...stat,
        avg_improvement: stat.avg_improvement ? 
          Math.round(stat.avg_improvement * 10) / 10 : 0,
        avg_rating: stat.avg_rating ? 
          Math.round(stat.avg_rating * 10) / 10 : 0,
        therapy_type_name: getTherapyTypeName(stat.therapy_type)
      })),
      
      patients_progress: patientsProgress.map(patient => ({
        ...patient,
        avg_improvement: patient.avg_improvement ? 
          Math.round(patient.avg_improvement * 10) / 10 : 0,
        is_completed: patient.current_session >= patient.total_sessions,
        last_session_formatted: patient.last_session_date ? 
          new Date(patient.last_session_date).toLocaleDateString('es-ES') : 'Nunca',
        therapy_type_name: getTherapyTypeName(patient.therapy_type)
      })),
      
      series_stats: seriesStats.map(series => ({
        ...series,
        avg_improvement: series.avg_improvement ? 
          Math.round(series.avg_improvement * 10) / 10 : 0,
        avg_rating: series.avg_rating ? 
          Math.round(series.avg_rating * 10) / 10 : 0,
        usage_rate: series.assigned_patients > 0 ? 
          Math.round((series.completed_sessions / (series.assigned_patients * series.total_sessions)) * 100) : 0,
        therapy_type_name: getTherapyTypeName(series.therapy_type)
      })),
      
      generated_at: new Date().toISOString()
    };

    res.json(processedData);

  } catch (error) {
    console.error('Error obteniendo dashboard:', error);
    res.status(500).json({
      error: 'Error obteniendo datos del dashboard',
      code: 'DASHBOARD_ERROR'
    });
  }
}

export async function getPatientDashboard(req, res) {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        error: 'Solo los pacientes pueden acceder a su dashboard',
        code: 'PATIENT_ONLY'
      });
    }

    const db = getDatabase();

    // Obtener información del paciente
    const patient = await db.get(`
      SELECT p.*, ts.*, u.name as instructor_name, u.email as instructor_email
      FROM patients p
      LEFT JOIN therapy_series ts ON p.assigned_series_id = ts.id
      LEFT JOIN users u ON p.instructor_id = u.id
      WHERE p.user_id = ? AND p.is_active = 1
    `, [req.user.id]);

    if (!patient) {
      return res.status(404).json({
        error: 'Información del paciente no encontrada',
        code: 'PATIENT_NOT_FOUND'
      });
    }

    let dashboardData = {
      patient_info: {
        id: patient.id,
        name: patient.name,
        age: patient.age,
        condition: patient.condition,
        instructor_name: patient.instructor_name,
        instructor_email: patient.instructor_email,
        total_sessions_completed: patient.total_sessions_completed
      },
      series: null,
      stats: null,
      recent_sessions: [],
      notifications: []
    };

    if (patient.assigned_series_id) {
      // Calcular progreso de la serie
      const progressPercentage = Math.round((patient.current_session / patient.total_sessions) * 100);
      const isCompleted = patient.current_session >= patient.total_sessions;

      dashboardData.series = {
        id: patient.assigned_series_id,
        name: patient.name_1 || 'Serie Asignada', // CORREGIDO: usar el nombre correcto de la serie
        description: patient.description,
        therapy_type: patient.therapy_type,
        therapy_type_name: getTherapyTypeName(patient.therapy_type),
        postures: patient.postures ? JSON.parse(patient.postures) : [],
        total_sessions: patient.total_sessions,
        current_session: patient.current_session,
        progress_percentage: progressPercentage,
        is_completed: isCompleted,
        estimated_duration: patient.estimated_duration,
        next_session: isCompleted ? null : patient.current_session + 1
      };

      // Obtener estadísticas de sesiones del paciente
      const sessionStats = await db.get(`
        SELECT 
          COUNT(*) as total_completed,
          AVG(pain_before) as avg_pain_before,
          AVG(pain_after) as avg_pain_after,
          AVG(pain_before - pain_after) as avg_improvement,
          AVG(duration_minutes) as avg_duration,
          AVG(rating) as avg_rating,
          SUM(postures_completed) as total_postures_completed,
          MIN(completed_at) as first_session,
          MAX(completed_at) as last_session
        FROM sessions 
        WHERE patient_id = ?
      `, [patient.id]);

      dashboardData.stats = {
        ...sessionStats,
        avg_pain_before: sessionStats.avg_pain_before ? 
          Math.round(sessionStats.avg_pain_before * 10) / 10 : 0,
        avg_pain_after: sessionStats.avg_pain_after ? 
          Math.round(sessionStats.avg_pain_after * 10) / 10 : 0,
        avg_improvement: sessionStats.avg_improvement ? 
          Math.round(sessionStats.avg_improvement * 10) / 10 : 0,
        avg_duration: sessionStats.avg_duration ? 
          Math.round(sessionStats.avg_duration) : 0,
        avg_rating: sessionStats.avg_rating ? 
          Math.round(sessionStats.avg_rating * 10) / 10 : 0,
        completion_rate: patient.total_sessions > 0 ? 
          Math.round((patient.current_session / patient.total_sessions) * 100) : 0
      };

      // Obtener últimas 5 sesiones
      dashboardData.recent_sessions = await db.all(`
        SELECT 
          session_number,
          pain_before,
          pain_after,
          rating,
          duration_minutes,
          completed_at,
          comments
        FROM sessions 
        WHERE patient_id = ?
        ORDER BY completed_at DESC
        LIMIT 5
      `, [patient.id]);
    }

    // Obtener notificaciones del paciente
    dashboardData.notifications = await db.all(`
      SELECT id, type, title, message, is_read, created_at
      FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 5
    `, [req.user.id]);

    res.json(dashboardData);

  } catch (error) {
    console.error('Error obteniendo dashboard del paciente:', error);
    res.status(500).json({
      error: 'Error obteniendo dashboard',
      code: 'PATIENT_DASHBOARD_ERROR'
    });
  }
}

export async function exportReports(req, res) {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({
        error: 'Solo los instructores pueden exportar reportes',
        code: 'INSTRUCTOR_ONLY'
      });
    }

    const { format = 'json', dateFrom, dateTo, includePatients = true, includeSessions = true } = req.query;

    const db = getDatabase();

    let dateFilter = '';
    let params = [req.user.id];

    if (dateFrom && dateTo) {
      dateFilter = 'AND s.completed_at BETWEEN ? AND ?';
      params.push(dateFrom, dateTo);
    }

    const reportData = {
      generated_at: new Date().toISOString(),
      instructor: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      },
      period: {
        from: dateFrom || null,
        to: dateTo || null
      },
      summary: await db.get(`
        SELECT 
          COUNT(DISTINCT p.id) as total_patients,
          COUNT(DISTINCT s.id) as total_sessions,
          COUNT(DISTINCT ts.id) as total_series,
          AVG(s.pain_before - s.pain_after) as avg_improvement
        FROM patients p
        LEFT JOIN sessions s ON s.patient_id = p.id ${dateFilter.replace('AND', 'WHERE').replace('s.completed_at', 's.completed_at')}
        LEFT JOIN therapy_series ts ON ts.instructor_id = ?
        WHERE p.instructor_id = ? AND p.is_active = 1
      `, dateFilter ? [dateFrom, dateTo, req.user.id, req.user.id] : [req.user.id, req.user.id])
    };

    if (includePatients) {
      reportData.patients = await db.all(`
        SELECT 
          p.name,
          p.email,
          p.age,
          p.condition,
          p.current_session,
          p.total_sessions_completed,
          ts.name as series_name,
          ts.therapy_type,
          ts.total_sessions,
          AVG(s.pain_before - s.pain_after) as avg_improvement,
          COUNT(s.id) as sessions_in_period
        FROM patients p
        LEFT JOIN therapy_series ts ON p.assigned_series_id = ts.id
        LEFT JOIN sessions s ON s.patient_id = p.id ${dateFilter}
        WHERE p.instructor_id = ? AND p.is_active = 1
        GROUP BY p.id
        ORDER BY p.name
      `, dateFilter ? [...params] : [req.user.id]);
    }

    if (includeSessions) {
      reportData.sessions = await db.all(`
        SELECT 
          p.name as patient_name,
          s.session_number,
          s.pain_before,
          s.pain_after,
          s.pain_before - s.pain_after as improvement,
          s.duration_minutes,
          s.rating,
          s.comments,
          s.completed_at,
          ts.name as series_name,
          ts.therapy_type
        FROM sessions s
        JOIN patients p ON s.patient_id = p.id
        LEFT JOIN therapy_series ts ON s.series_id = ts.id
        WHERE p.instructor_id = ? ${dateFilter}
        ORDER BY s.completed_at DESC
      `, params);
    }

    // Log de analytics
    await db.run(`
      INSERT INTO analytics_events (user_id, event_type, event_data) 
      VALUES (?, 'report_exported', ?)
    `, [req.user.id, JSON.stringify({
      format,
      dateFrom,
      dateTo,
      includePatients,
      includeSessions,
      recordCount: reportData.sessions?.length || 0
    })]);

    if (format === 'csv' && reportData.sessions) {
      const csv = [
        'Paciente,Sesión,Dolor Antes,Dolor Después,Mejora,Duración (min),Calificación,Serie,Tipo Terapia,Fecha,Comentarios',
        ...reportData.sessions.map(row => [
          row.patient_name,
          row.session_number,
          row.pain_before,
          row.pain_after,
          row.improvement,
          row.duration_minutes || '',
          row.rating || '',
          row.series_name || '',
          row.therapy_type || '',
          new Date(row.completed_at).toLocaleDateString('es-ES'),
          `"${(row.comments || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="reporte-yoga-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send('\ufeff' + csv); // BOM para UTF-8
    }

    res.json(reportData);

  } catch (error) {
    console.error('Error exportando reportes:', error);
    res.status(500).json({
      error: 'Error exportando reportes',
      code: 'EXPORT_ERROR'
    });
  }
}

// Función auxiliar para nombres de tipos de terapia
function getTherapyTypeName(type) {
  const names = {
    'anxiety': 'Ansiedad y Estrés',
    'arthritis': 'Artritis y Rigidez Articular',
    'back_pain': 'Dolor de Espalda'
  };
  return names[type] || type;
}