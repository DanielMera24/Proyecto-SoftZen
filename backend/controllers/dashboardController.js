import { getDatabase } from '../config/database.js';

/**
 * DashboardController - Controlador optimizado para dashboards
 * Enfoque en rendimiento, sostenibilidad y escalabilidad
 */

// Cache para consultas de dashboard (en producción usar Redis)
const dashboardCache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutos para dashboards

/**
 * Dashboard del instructor con métricas avanzadas
 */
const getInstructorDashboard = async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({
        error: 'Solo los instructores pueden acceder al dashboard',
        code: 'INSTRUCTOR_ONLY'
      });
    }

    const db = getDatabase();
    const cacheKey = `instructor_dashboard_${req.user.id}`;

    // Verificar cache
    const cached = dashboardCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    // Ejecutar todas las consultas en paralelo con optimización mejorada
    const [
      overviewStats,
      recentActivity,
      painTrends,
      therapyTypeStats,
      patientsProgress,
      seriesStats,
      weeklyStats,
      topPerformingPatients
    ] = await Promise.all([
      // Estadísticas generales optimizadas
      db.get(`
        SELECT 
          COUNT(DISTINCT p.id) as total_patients,
          COUNT(DISTINCT CASE WHEN p.assigned_series_id IS NOT NULL THEN p.id END) as active_patients,
          COUNT(DISTINCT ts.id) as total_series,
          COUNT(DISTINCT s.id) as total_sessions,
          COALESCE(AVG(s.pain_before - s.pain_after), 0) as avg_pain_improvement,
          COALESCE(AVG(s.duration_minutes), 0) as avg_session_duration,
          COALESCE(AVG(s.rating), 0) as avg_rating,
          COUNT(DISTINCT CASE WHEN s.completed_at >= date('now', '-7 days') THEN s.id END) as sessions_this_week,
          COUNT(DISTINCT CASE WHEN p.created_at >= date('now', '-30 days') THEN p.id END) as new_patients_month
        FROM patients p
        LEFT JOIN therapy_series ts ON ts.instructor_id = ?
        LEFT JOIN sessions s ON s.patient_id = p.id
        WHERE p.instructor_id = ? AND p.is_active = 1
      `, [req.user.id, req.user.id]),

      // Actividad reciente (últimas 15 sesiones con más detalle)
      db.all(`
        SELECT 
          'session' as type,
          p.id as patient_id,
          p.name as patient_name,
          s.id as session_id,
          s.session_number,
          s.completed_at as date,
          s.pain_before,
          s.pain_after,
          (s.pain_before - s.pain_after) as pain_improvement,
          s.rating,
          s.duration_minutes,
          COALESCE(ts.name, 'Sin serie') as series_name,
          ts.therapy_type,
          s.comments
        FROM sessions s
        JOIN patients p ON s.patient_id = p.id
        LEFT JOIN therapy_series ts ON s.series_id = ts.id
        WHERE p.instructor_id = ?
        ORDER BY s.completed_at DESC
        LIMIT 15
      `, [req.user.id]),

      // Tendencias de dolor por semana (últimas 12 semanas)
      db.all(`
        SELECT 
          strftime('%Y-%W', s.completed_at) as week,
          strftime('%Y-%m-%d', s.completed_at, 'weekday 0', '-6 days') as week_start,
          COALESCE(AVG(s.pain_before), 0) as avg_pain_before,
          COALESCE(AVG(s.pain_after), 0) as avg_pain_after,
          COALESCE(AVG(s.pain_before - s.pain_after), 0) as avg_improvement,
          COUNT(s.id) as session_count,
          COUNT(DISTINCT p.id) as unique_patients
        FROM sessions s
        JOIN patients p ON s.patient_id = p.id
        WHERE p.instructor_id = ? AND s.completed_at >= date('now', '-12 weeks')
        GROUP BY strftime('%Y-%W', s.completed_at)
        ORDER BY week DESC
        LIMIT 12
      `, [req.user.id]),

      // Estadísticas por tipo de terapia con métricas avanzadas
      db.all(`
        SELECT 
          ts.therapy_type,
          COUNT(DISTINCT ts.id) as series_count,
          COUNT(DISTINCT p.id) as patients_count,
          COUNT(s.id) as sessions_count,
          COALESCE(AVG(s.pain_before - s.pain_after), 0) as avg_improvement,
          COALESCE(AVG(s.rating), 0) as avg_rating,
          COALESCE(AVG(s.duration_minutes), 0) as avg_duration,
          COALESCE(MAX(s.pain_before - s.pain_after), 0) as max_improvement,
          COUNT(DISTINCT CASE WHEN s.completed_at >= date('now', '-30 days') THEN s.id END) as recent_sessions
        FROM therapy_series ts
        LEFT JOIN patients p ON p.assigned_series_id = ts.id AND p.is_active = 1
        LEFT JOIN sessions s ON s.patient_id = p.id
        WHERE ts.instructor_id = ? AND ts.is_active = 1
        GROUP BY ts.therapy_type
        ORDER BY sessions_count DESC
      `, [req.user.id]),

      // Progreso de pacientes activos con métricas de adherencia
      db.all(`
        SELECT 
          p.id,
          p.name,
          p.age,
          p.condition,
          p.current_session,
          ts.total_sessions,
          ts.name as series_name,
          ts.therapy_type,
          ts.difficulty_level,
          ROUND((CAST(p.current_session AS REAL) / NULLIF(ts.total_sessions, 0)) * 100, 0) as progress_percentage,
          MAX(s.completed_at) as last_session_date,
          MIN(s.completed_at) as first_session_date,
          COALESCE(AVG(s.pain_before - s.pain_after), 0) as avg_improvement,
          COALESCE(AVG(s.rating), 0) as avg_rating,
          COUNT(s.id) as completed_sessions,
          SUM(s.duration_minutes) as total_practice_time,
          p.series_assigned_at,
          JULIANDAY('now') - JULIANDAY(p.series_assigned_at) as days_since_assignment
        FROM patients p
        JOIN therapy_series ts ON p.assigned_series_id = ts.id
        LEFT JOIN sessions s ON s.patient_id = p.id
        WHERE p.instructor_id = ? AND p.is_active = 1 AND ts.is_active = 1
        GROUP BY p.id, p.name, p.current_session, ts.total_sessions, ts.name, ts.therapy_type
        ORDER BY progress_percentage DESC, p.name
      `, [req.user.id]),

      // Estadísticas de series con métricas de efectividad
      db.all(`
        SELECT 
          ts.id,
          ts.name,
          ts.description,
          ts.therapy_type,
          ts.total_sessions,
          ts.difficulty_level,
          ts.estimated_duration,
          COUNT(DISTINCT p.id) as assigned_patients,
          COUNT(s.id) as completed_sessions,
          COALESCE(AVG(s.pain_before - s.pain_after), 0) as avg_improvement,
          COALESCE(AVG(s.rating), 0) as avg_rating,
          COALESCE(AVG(s.duration_minutes), 0) as avg_session_duration,
          COUNT(DISTINCT CASE WHEN p.current_session >= ts.total_sessions THEN p.id END) as completed_patients,
          ts.created_at,
          JULIANDAY('now') - JULIANDAY(ts.created_at) as days_since_created
        FROM therapy_series ts
        LEFT JOIN patients p ON p.assigned_series_id = ts.id AND p.is_active = 1
        LEFT JOIN sessions s ON s.patient_id = p.id
        WHERE ts.instructor_id = ? AND ts.is_active = 1
        GROUP BY ts.id
        ORDER BY assigned_patients DESC, ts.created_at DESC
      `, [req.user.id]),

      // Estadísticas por día de la semana
      db.all(`
        SELECT 
          CAST(strftime('%w', s.completed_at) AS INTEGER) as day_of_week,
          CASE CAST(strftime('%w', s.completed_at) AS INTEGER)
            WHEN 0 THEN 'Domingo'
            WHEN 1 THEN 'Lunes'
            WHEN 2 THEN 'Martes'
            WHEN 3 THEN 'Miércoles'
            WHEN 4 THEN 'Jueves'
            WHEN 5 THEN 'Viernes'
            WHEN 6 THEN 'Sábado'
          END as day_name,
          COUNT(s.id) as session_count,
          COALESCE(AVG(s.pain_before - s.pain_after), 0) as avg_improvement,
          COALESCE(AVG(s.rating), 0) as avg_rating
        FROM sessions s
        JOIN patients p ON s.patient_id = p.id
        WHERE p.instructor_id = ? AND s.completed_at >= date('now', '-30 days')
        GROUP BY strftime('%w', s.completed_at)
        ORDER BY day_of_week
      `, [req.user.id]),

      // Top 5 pacientes con mejor mejora
      db.all(`
        SELECT 
          p.id,
          p.name,
          p.age,
          COUNT(s.id) as total_sessions,
          COALESCE(AVG(s.pain_before - s.pain_after), 0) as avg_improvement,
          COALESCE(AVG(s.rating), 0) as avg_rating,
          MAX(s.pain_before - s.pain_after) as best_improvement,
          ts.name as series_name
        FROM sessions s
        JOIN patients p ON s.patient_id = p.id
        LEFT JOIN therapy_series ts ON p.assigned_series_id = ts.id
        WHERE p.instructor_id = ? AND s.completed_at >= date('now', '-30 days')
        GROUP BY p.id
        HAVING COUNT(s.id) >= 3
        ORDER BY avg_improvement DESC
        LIMIT 5
      `, [req.user.id])
    ]);

    // Procesar y formatear los datos
    const processedData = {
      overview: {
        ...overviewStats,
        avg_pain_improvement: Math.round((overviewStats.avg_pain_improvement || 0) * 10) / 10,
        avg_session_duration: Math.round(overviewStats.avg_session_duration || 0),
        avg_rating: Math.round((overviewStats.avg_rating || 0) * 10) / 10,
        inactive_patients: overviewStats.total_patients - overviewStats.active_patients,
        completion_rate: overviewStats.active_patients > 0 ? 
          Math.round((overviewStats.sessions_this_week / overviewStats.active_patients) * 100) : 0
      },
      
      recent_activity: recentActivity.map(activity => ({
        ...activity,
        date_formatted: new Date(activity.date).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        improvement_category: categorizeImprovement(activity.pain_improvement)
      })),
      
      pain_trends: painTrends.reverse().map(trend => ({
        ...trend,
        avg_pain_before: Math.round((trend.avg_pain_before || 0) * 10) / 10,
        avg_pain_after: Math.round((trend.avg_pain_after || 0) * 10) / 10,
        avg_improvement: Math.round((trend.avg_improvement || 0) * 10) / 10,
        week_label: new Date(trend.week_start).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit'
        })
      })),
      
      therapy_types: therapyTypeStats.map(stat => ({
        ...stat,
        avg_improvement: Math.round((stat.avg_improvement || 0) * 10) / 10,
        avg_rating: Math.round((stat.avg_rating || 0) * 10) / 10,
        avg_duration: Math.round(stat.avg_duration || 0),
        therapy_type_name: getTherapyTypeName(stat.therapy_type),
        effectiveness_score: calculateEffectivenessScore(stat)
      })),
      
      patients_progress: patientsProgress.map(patient => ({
        ...patient,
        avg_improvement: Math.round((patient.avg_improvement || 0) * 10) / 10,
        avg_rating: Math.round((patient.avg_rating || 0) * 10) / 10,
        is_completed: patient.current_session >= patient.total_sessions,
        last_session_formatted: patient.last_session_date ? 
          new Date(patient.last_session_date).toLocaleDateString('es-ES') : 'Nunca',
        therapy_type_name: getTherapyTypeName(patient.therapy_type),
        progress_percentage: patient.progress_percentage || 0,
        adherence_score: calculateAdherenceScore(patient),
        total_practice_hours: patient.total_practice_time ? 
          Math.round(patient.total_practice_time / 60 * 10) / 10 : 0
      })),
      
      series_stats: seriesStats.map(series => ({
        ...series,
        avg_improvement: Math.round((series.avg_improvement || 0) * 10) / 10,
        avg_rating: Math.round((series.avg_rating || 0) * 10) / 10,
        avg_session_duration: Math.round(series.avg_session_duration || 0),
        completion_rate: series.assigned_patients > 0 ? 
          Math.round((series.completed_patients / series.assigned_patients) * 100) : 0,
        usage_rate: series.assigned_patients > 0 && series.total_sessions > 0 ? 
          Math.round((series.completed_sessions / (series.assigned_patients * series.total_sessions)) * 100) : 0,
        therapy_type_name: getTherapyTypeName(series.therapy_type),
        popularity_score: calculatePopularityScore(series)
      })),

      weekly_stats: weeklyStats.map(stat => ({
        ...stat,
        avg_improvement: Math.round((stat.avg_improvement || 0) * 10) / 10,
        avg_rating: Math.round((stat.avg_rating || 0) * 10) / 10
      })),

      top_patients: topPerformingPatients.map(patient => ({
        ...patient,
        avg_improvement: Math.round((patient.avg_improvement || 0) * 10) / 10,
        avg_rating: Math.round((patient.avg_rating || 0) * 10) / 10,
        best_improvement: Math.round((patient.best_improvement || 0) * 10) / 10
      })),
      
      insights: generateInstructorInsights(overviewStats, painTrends, therapyTypeStats),
      generated_at: new Date().toISOString(),
      cache_expires_at: new Date(Date.now() + CACHE_TTL).toISOString()
    };

    // Cachear resultado
    dashboardCache.set(cacheKey, {
      data: processedData,
      timestamp: Date.now()
    });

    res.json(processedData);

  } catch (error) {
    console.error('❌ Error obteniendo dashboard del instructor:', error);
    res.status(500).json({
      error: 'Error obteniendo datos del dashboard',
      code: 'INSTRUCTOR_DASHBOARD_ERROR'
    });
  }
};

/**
 * Dashboard del paciente con métricas personalizadas
 */
const getPatientDashboard = async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        error: 'Solo los pacientes pueden acceder a su dashboard',
        code: 'PATIENT_ONLY'
      });
    }

    const db = getDatabase();
    const cacheKey = `patient_dashboard_${req.user.id}`;

    // Verificar cache
    const cached = dashboardCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    // Obtener información del paciente con consulta optimizada
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
        ts.difficulty_level,
        u.name as instructor_name, 
        u.email as instructor_email,
        u.phone as instructor_phone
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
        instructor_phone: patient.instructor_phone,
        total_sessions_completed: patient.total_sessions_completed,
        member_since: patient.created_at
      },
      series: null,
      stats: null,
      recent_sessions: [],
      progress_trends: [],
      achievements: [],
      recommendations: []
    };

    if (patient.assigned_series_id && patient.series_id) {
      // Calcular progreso de la serie con métricas avanzadas
      const progressPercentage = patient.total_sessions > 0 ? 
        Math.round((patient.current_session / patient.total_sessions) * 100) : 0;
      const isCompleted = patient.current_session >= patient.total_sessions;

      dashboardData.series = {
        id: patient.assigned_series_id,
        name: patient.series_name || 'Serie Asignada',
        description: patient.series_description || '',
        therapy_type: patient.therapy_type,
        therapy_type_name: getTherapyTypeName(patient.therapy_type),
        postures: patient.postures ? JSON.parse(patient.postures) : [],
        total_sessions: patient.total_sessions,
        current_session: patient.current_session,
        sessions_remaining: Math.max(0, patient.total_sessions - patient.current_session),
        progress_percentage: progressPercentage,
        is_completed: isCompleted,
        estimated_duration: patient.estimated_duration,
        difficulty_level: patient.difficulty_level,
        next_session_number: isCompleted ? null : patient.current_session + 1
      };

      // Ejecutar consultas para estadísticas del paciente
      const [sessionStats, recentSessions, progressTrend, achievements] = await Promise.all([
        // Estadísticas generales de sesiones
        db.get(`
          SELECT 
            COUNT(*) as total_sessions,
            COALESCE(AVG(pain_before), 0) as avg_pain_before,
            COALESCE(AVG(pain_after), 0) as avg_pain_after,
            COALESCE(AVG(pain_before - pain_after), 0) as avg_improvement,
            COALESCE(AVG(rating), 0) as avg_rating,
            COALESCE(AVG(duration_minutes), 0) as avg_duration,
            MIN(completed_at) as first_session,
            MAX(completed_at) as last_session,
            SUM(duration_minutes) as total_minutes,
            MAX(pain_before - pain_after) as best_improvement,
            COUNT(CASE WHEN rating >= 4 THEN 1 END) as high_rated_sessions
          FROM sessions 
          WHERE patient_id = ?
        `, [patient.id]),

        // Sesiones recientes (últimas 10)
        db.all(`
          SELECT 
            s.*,
            ts.name as series_name,
            ts.therapy_type,
            (s.pain_before - s.pain_after) as pain_improvement
          FROM sessions s
          LEFT JOIN therapy_series ts ON s.series_id = ts.id
          WHERE s.patient_id = ?
          ORDER BY s.completed_at DESC
          LIMIT 10
        `, [patient.id]),

        // Tendencia de progreso por semanas
        db.all(`
          SELECT 
            strftime('%Y-%W', completed_at) as week,
            strftime('%Y-%m-%d', completed_at, 'weekday 0', '-6 days') as week_start,
            COUNT(*) as sessions_count,
            COALESCE(AVG(pain_before), 0) as avg_pain_before,
            COALESCE(AVG(pain_after), 0) as avg_pain_after,
            COALESCE(AVG(pain_before - pain_after), 0) as avg_improvement,
            COALESCE(AVG(rating), 0) as avg_rating
          FROM sessions 
          WHERE patient_id = ? AND completed_at >= date('now', '-8 weeks')
          GROUP BY strftime('%Y-%W', completed_at)
          ORDER BY week DESC
          LIMIT 8
        `, [patient.id]),

        // Logros y milestones
        generatePatientAchievements(db, patient.id, patient.total_sessions)
      ]);

      dashboardData.stats = {
        ...sessionStats,
        avg_pain_before: Math.round((sessionStats.avg_pain_before || 0) * 10) / 10,
        avg_pain_after: Math.round((sessionStats.avg_pain_after || 0) * 10) / 10,
        avg_improvement: Math.round((sessionStats.avg_improvement || 0) * 10) / 10,
        avg_rating: Math.round((sessionStats.avg_rating || 0) * 10) / 10,
        avg_duration: Math.round(sessionStats.avg_duration || 0),
        total_hours: sessionStats.total_minutes ? 
          Math.round(sessionStats.total_minutes / 60 * 10) / 10 : 0,
        best_improvement: Math.round((sessionStats.best_improvement || 0) * 10) / 10,
        consistency_score: calculateConsistencyScore(patient, sessionStats),
        satisfaction_rate: sessionStats.total_sessions > 0 ? 
          Math.round((sessionStats.high_rated_sessions / sessionStats.total_sessions) * 100) : 0
      };

      dashboardData.recent_sessions = recentSessions.map(session => ({
        ...session,
        date_formatted: new Date(session.completed_at).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        improvement_category: categorizeImprovement(session.pain_improvement)
      }));

      dashboardData.progress_trends = progressTrend.reverse().map(trend => ({
        ...trend,
        avg_pain_before: Math.round((trend.avg_pain_before || 0) * 10) / 10,
        avg_pain_after: Math.round((trend.avg_pain_after || 0) * 10) / 10,
        avg_improvement: Math.round((trend.avg_improvement || 0) * 10) / 10,
        avg_rating: Math.round((trend.avg_rating || 0) * 10) / 10,
        week_label: new Date(trend.week_start).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit'
        })
      }));

      dashboardData.achievements = achievements;
      dashboardData.recommendations = generatePatientRecommendations(sessionStats, progressTrend);
    }

    // Obtener notificaciones recientes
    const notifications = await db.all(`
      SELECT * FROM notifications 
      WHERE user_id = ? AND created_at >= date('now', '-7 days')
      ORDER BY created_at DESC 
      LIMIT 5
    `, [req.user.id]);

    dashboardData.notifications = notifications.map(notif => ({
      ...notif,
      data: notif.data ? JSON.parse(notif.data) : null,
      created_formatted: new Date(notif.created_at).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));

    dashboardData.generated_at = new Date().toISOString();

    // Cachear resultado
    dashboardCache.set(cacheKey, {
      data: dashboardData,
      timestamp: Date.now()
    });

    res.json(dashboardData);

  } catch (error) {
    console.error('❌ Error obteniendo dashboard del paciente:', error);
    res.status(500).json({
      error: 'Error obteniendo dashboard del paciente',
      code: 'PATIENT_DASHBOARD_ERROR'
    });
  }
};

/**
 * Exportar reportes para instructores
 */
const exportReports = async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({
        error: 'Solo los instructores pueden exportar reportes',
        code: 'INSTRUCTOR_ONLY'
      });
    }

    const { 
      format = 'json', 
      startDate, 
      endDate, 
      patientId, 
      seriesId,
      includeDetails = false 
    } = req.query;

    const db = getDatabase();

    // Construir filtros dinámicos
    let whereConditions = ['p.instructor_id = ?'];
    let params = [req.user.id];

    if (startDate) {
      whereConditions.push('s.completed_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push('s.completed_at <= ?');
      params.push(endDate);
    }

    if (patientId) {
      whereConditions.push('p.id = ?');
      params.push(parseInt(patientId));
    }

    if (seriesId) {
      whereConditions.push('ts.id = ?');
      params.push(parseInt(seriesId));
    }

    const whereClause = whereConditions.join(' AND ');

    // Consulta principal del reporte
    const reportData = await db.all(`
      SELECT 
        p.id as patient_id,
        p.name as patient_name,
        p.age,
        p.condition,
        p.created_at as patient_created,
        ts.id as series_id,
        ts.name as series_name,
        ts.therapy_type,
        ts.total_sessions as series_total_sessions,
        COUNT(s.id) as completed_sessions,
        COALESCE(AVG(s.pain_before), 0) as avg_pain_before,
        COALESCE(AVG(s.pain_after), 0) as avg_pain_after,
        COALESCE(AVG(s.pain_before - s.pain_after), 0) as avg_improvement,
        COALESCE(AVG(s.rating), 0) as avg_rating,
        COALESCE(AVG(s.duration_minutes), 0) as avg_duration,
        SUM(s.duration_minutes) as total_practice_time,
        MIN(s.completed_at) as first_session_date,
        MAX(s.completed_at) as last_session_date,
        MAX(s.pain_before - s.pain_after) as best_improvement
      FROM patients p
      LEFT JOIN therapy_series ts ON p.assigned_series_id = ts.id
      LEFT JOIN sessions s ON s.patient_id = p.id
      WHERE ${whereClause} AND p.is_active = 1
      GROUP BY p.id, ts.id
      ORDER BY p.name, ts.name
    `, params);

    // Procesar datos del reporte
    const processedReport = {
      generated_at: new Date().toISOString(),
      instructor: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      },
      filters: {
        start_date: startDate || null,
        end_date: endDate || null,
        patient_id: patientId || null,
        series_id: seriesId || null
      },
      summary: {
        total_patients: new Set(reportData.map(r => r.patient_id)).size,
        total_series: new Set(reportData.map(r => r.series_id)).filter(id => id).size,
        total_sessions: reportData.reduce((sum, r) => sum + r.completed_sessions, 0),
        avg_improvement_overall: reportData.length > 0 ? 
          Math.round(reportData.reduce((sum, r) => sum + r.avg_improvement, 0) / reportData.length * 10) / 10 : 0
      },
      data: reportData.map(row => ({
        ...row,
        avg_pain_before: Math.round((row.avg_pain_before || 0) * 10) / 10,
        avg_pain_after: Math.round((row.avg_pain_after || 0) * 10) / 10,
        avg_improvement: Math.round((row.avg_improvement || 0) * 10) / 10,
        avg_rating: Math.round((row.avg_rating || 0) * 10) / 10,
        avg_duration: Math.round(row.avg_duration || 0),
        total_practice_hours: row.total_practice_time ? 
          Math.round(row.total_practice_time / 60 * 10) / 10 : 0,
        progress_percentage: row.series_total_sessions > 0 ? 
          Math.round((row.completed_sessions / row.series_total_sessions) * 100) : 0
      }))
    };

    if (format === 'csv') {
      // Generar CSV
      const csvHeader = [
        'Paciente', 'Edad', 'Condición', 'Serie', 'Tipo de Terapia',
        'Sesiones Completadas', 'Sesiones Totales', 'Progreso %',
        'Dolor Promedio Antes', 'Dolor Promedio Después', 'Mejora Promedio',
        'Calificación Promedio', 'Duración Promedio (min)', 'Tiempo Total (horas)',
        'Primera Sesión', 'Última Sesión'
      ].join(',');

      const csvRows = processedReport.data.map(row => [
        `"${row.patient_name}"`,
        row.age || '',
        `"${row.condition || ''}"`,
        `"${row.series_name || 'Sin serie'}"`,
        `"${getTherapyTypeName(row.therapy_type) || ''}"`,
        row.completed_sessions,
        row.series_total_sessions || 0,
        row.progress_percentage,
        row.avg_pain_before,
        row.avg_pain_after,
        row.avg_improvement,
        row.avg_rating,
        row.avg_duration,
        row.total_practice_hours,
        row.first_session_date || '',
        row.last_session_date || ''
      ].join(','));

      const csvContent = [csvHeader, ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="reporte_softzen_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);

    } else {
      // Devolver JSON
      res.json(processedReport);
    }

  } catch (error) {
    console.error('❌ Error exportando reportes:', error);
    res.status(500).json({
      error: 'Error exportando reportes',
      code: 'EXPORT_REPORTS_ERROR'
    });
  }
};

// ========== FUNCIONES AUXILIARES ==========

/**
 * Obtener nombre de tipo de terapia
 */
function getTherapyTypeName(therapyType) {
  const therapyNames = {
    'back_pain': 'Dolor de Espalda',
    'neck_pain': 'Dolor de Cuello',
    'joint_pain': 'Dolor Articular',
    'stress_relief': 'Alivio del Estrés',
    'flexibility': 'Flexibilidad',
    'strength': 'Fortalecimiento',
    'posture': 'Corrección Postural',
    'breathing': 'Respiración',
    'meditation': 'Meditación',
    'general': 'General'
  };
  
  return therapyNames[therapyType] || therapyType || 'No especificado';
}

/**
 * Categorizar mejora de dolor
 */
function categorizeImprovement(improvement) {
  if (improvement >= 4) return 'excellent';
  if (improvement >= 2) return 'good';
  if (improvement >= 0) return 'slight';
  return 'none';
}

/**
 * Calcular score de efectividad
 */
function calculateEffectivenessScore(stat) {
  if (!stat.sessions_count) return 0;
  
  const improvementScore = Math.min(stat.avg_improvement * 20, 50); // max 50 puntos
  const ratingScore = stat.avg_rating * 10; // max 50 puntos
  
  return Math.round(improvementScore + ratingScore);
}

/**
 * Calcular score de adherencia
 */
function calculateAdherenceScore(patient) {
  if (!patient.total_sessions || !patient.days_since_assignment) return 0;
  
  const expectedProgress = Math.min(patient.days_since_assignment / 7, patient.total_sessions);
  const actualProgress = patient.current_session;
  
  return Math.round((actualProgress / expectedProgress) * 100);
}

/**
 * Calcular score de popularidad de series
 */
function calculatePopularityScore(series) {
  const assignmentScore = Math.min(series.assigned_patients * 10, 50);
  const completionScore = series.completion_rate / 2;
  const ratingScore = series.avg_rating * 10;
  
  return Math.round(assignmentScore + completionScore + ratingScore);
}

/**
 * Calcular score de consistencia
 */
function calculateConsistencyScore(patient, stats) {
  if (!stats.total_sessions || stats.total_sessions < 3) return 0;
  
  // Días desde la primera sesión
  const daysSinceStart = patient.first_session ? 
    Math.floor((Date.now() - new Date(patient.first_session).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  
  if (daysSinceStart === 0) return 100;
  
  // Sesiones por día esperadas vs reales
  const expectedFrequency = 0.5; // 3-4 sesiones por semana
  const actualFrequency = stats.total_sessions / daysSinceStart;
  
  return Math.min(Math.round((actualFrequency / expectedFrequency) * 100), 100);
}

/**
 * Generar insights para instructores
 */
function generateInstructorInsights(overview, trends, therapyTypes) {
  const insights = [];
  
  if (overview.avg_pain_improvement > 3) {
    insights.push({
      type: 'success',
      title: 'Excelentes resultados',
      message: 'Tus pacientes muestran una mejora promedio significativa en el dolor',
      metric: `${overview.avg_pain_improvement} puntos de mejora`
    });
  }
  
  if (overview.avg_rating >= 4.5) {
    insights.push({
      type: 'success',
      title: 'Alta satisfacción',
      message: 'Los pacientes están muy satisfechos con las sesiones',
      metric: `${overview.avg_rating}/5 estrellas`
    });
  }
  
  if (overview.sessions_this_week < overview.active_patients * 0.3) {
    insights.push({
      type: 'warning',
      title: 'Baja actividad semanal',
      message: 'Considera motivar a los pacientes a mantener consistencia',
      metric: `${overview.sessions_this_week} sesiones esta semana`
    });
  }
  
  const bestTherapy = therapyTypes.reduce((best, current) => 
    current.avg_improvement > best.avg_improvement ? current : best, 
    { avg_improvement: 0 }
  );
  
  if (bestTherapy.therapy_type) {
    insights.push({
      type: 'info',
      title: 'Terapia más efectiva',
      message: `${getTherapyTypeName(bestTherapy.therapy_type)} muestra los mejores resultados`,
      metric: `${bestTherapy.avg_improvement} puntos de mejora`
    });
  }
  
  return insights;
}

/**
 * Generar logros del paciente
 */
async function generatePatientAchievements(db, patientId, totalSessions) {
  const achievements = [];
  
  // Consultar logros basados en sesiones
  const sessionCount = await db.get(
    'SELECT COUNT(*) as count FROM sessions WHERE patient_id = ?', 
    [patientId]
  );
  
  const milestones = [
    { sessions: 1, title: 'Primer Paso', description: 'Completaste tu primera sesión' },
    { sessions: 5, title: 'Constante', description: 'Has completado 5 sesiones' },
    { sessions: 10, title: 'Dedicado', description: 'Has completado 10 sesiones' },
    { sessions: 25, title: 'Comprometido', description: 'Has completado 25 sesiones' },
    { sessions: 50, title: 'Maestro', description: 'Has completado 50 sesiones' }
  ];
  
  milestones.forEach(milestone => {
    if (sessionCount.count >= milestone.sessions) {
      achievements.push({
        ...milestone,
        achieved: true,
        achieved_at: new Date().toISOString() // En una implementación real, esto vendría de la DB
      });
    }
  });
  
  return achievements;
}

/**
 * Generar recomendaciones para pacientes
 */
function generatePatientRecommendations(stats, trends) {
  const recommendations = [];
  
  if (stats.avg_improvement < 1) {
    recommendations.push({
      type: 'technique',
      title: 'Mejora tu técnica',
      description: 'Considera revisar las posturas con tu instructor para obtener mejores resultados'
    });
  }
  
  if (stats.avg_duration < 20) {
    recommendations.push({
      type: 'duration',
      title: 'Aumenta la duración',
      description: 'Trata de extender tus sesiones a al menos 20-30 minutos para mejores beneficios'
    });
  }
  
  if (trends.length > 2 && trends.slice(-2).every(t => t.sessions_count < 2)) {
    recommendations.push({
      type: 'consistency',
      title: 'Mantén la consistencia',
      description: 'Trata de practicar al menos 3 veces por semana para obtener mejores resultados'
    });
  }
  
  if (stats.avg_rating >= 4 && stats.avg_improvement >= 2) {
    recommendations.push({
      type: 'progress',
      title: '¡Excelente progreso!',
      description: 'Estás haciendo un gran trabajo. Considera hablar con tu instructor sobre nuevos desafíos'
    });
  }
  
  return recommendations;
}

// Cleanup de cache periódico
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, value] of dashboardCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      dashboardCache.delete(key);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned ${cleanedCount} dashboard cache entries`);
  }
}, 5 * 60 * 1000); // Cada 5 minutos

// Export default del controlador
export default {
  getInstructorDashboard,
  getPatientDashboard,
  exportReports
};