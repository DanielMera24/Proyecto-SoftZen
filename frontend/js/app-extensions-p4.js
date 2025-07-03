// ===================================================================
// SOFTZEN APP - EXTENSIONES P4: ANALYTICS Y REPORTES AVANZADOS
// Sistema completo de analytics, reportes y visualización de datos
// Enfoque: Rendimiento + Sostenibilidad + Escalabilidad
// ===================================================================

// Extensión de métodos para la clase SoftZenApp
if (window.SoftZenApp && window.SoftZenApp.prototype) {
  Object.assign(window.SoftZenApp.prototype, {

  // ========== SISTEMA DE ANALYTICS AVANZADO ==========

  async loadAnalytics(timeframe = '30d') {
    try {
      PerformanceMonitor.mark('analytics-load-start');
      LoadingManager.show('Cargando analytics...');
      
      // Cache inteligente para analytics
      const cacheKey = `analytics-${timeframe}`;
      const cachedAnalytics = this.getCachedData(cacheKey);
      
      if (cachedAnalytics) {
        this.renderAnalytics(cachedAnalytics, timeframe);
        LoadingManager.hide();
        
        // Actualización en background para datos recientes
        this.updateAnalyticsInBackground(timeframe);
        return;
      }
      
      // Cargar datos de analytics
      const analyticsData = await this.fetchAnalyticsData(timeframe);
      
      // Cache con TTL adaptativo según timeframe
      const cacheTTL = this.getAnalyticsCacheTTL(timeframe);
      this.setCachedData(cacheKey, analyticsData, cacheTTL);
      
      this.renderAnalytics(analyticsData, timeframe);
      LoadingManager.hide();
      
      PerformanceMonitor.mark('analytics-load-end');
      PerformanceMonitor.measure('analytics-load', 'analytics-load-start', 'analytics-load-end');
      
    } catch (error) {
      LoadingManager.hide();
      console.error('Error cargando analytics:', error);
      NotificationManager.showError('Error cargando analytics');
      this.renderEmptyAnalytics();
    }
  },

  async fetchAnalyticsData(timeframe) {
    // Simular datos de analytics (en producción vendría de Firebase)
    const mockData = this.generateMockAnalyticsData(timeframe);
    
    // En producción sería:
    // return await firebaseService.getAnalytics(this.currentUser.uid, timeframe);
    
    return mockData;
  },

  generateMockAnalyticsData(timeframe) {
    const days = this.getTimeframeDays(timeframe);
    const now = new Date();
    
    return {
      overview: {
        totalSessions: Math.floor(Math.random() * 100) + 50,
        activePatientsThisPeriod: Math.floor(Math.random() * 20) + 10,
        averagePainReduction: (Math.random() * 3 + 1).toFixed(1),
        completionRate: (Math.random() * 20 + 75).toFixed(1),
        totalMinutes: Math.floor(Math.random() * 5000) + 2000
      },
      sessionsOverTime: this.generateTimeSeriesData(days, 'sessions'),
      painReductionTrend: this.generateTimeSeriesData(days, 'pain'),
      therapyTypeDistribution: [
        { type: 'Dolor de Espalda', count: Math.floor(Math.random() * 30) + 15, color: '#667eea' },
        { type: 'Estrés', count: Math.floor(Math.random() * 20) + 10, color: '#764ba2' },
        { type: 'Flexibilidad', count: Math.floor(Math.random() * 15) + 8, color: '#f093fb' },
        { type: 'Fortalecimiento', count: Math.floor(Math.random() * 12) + 5, color: '#4ecdc4' }
      ],
      topPatients: this.generateTopPatientsData(),
      sessionCompletionByHour: this.generateHourlyData(),
      improvements: this.generateImprovementsData(),
      recentMilestones: this.generateMilestonesData()
    };
  },

  generateTimeSeriesData(days, type) {
    const data = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      let value;
      if (type === 'sessions') {
        value = Math.floor(Math.random() * 10) + 2;
      } else if (type === 'pain') {
        value = (Math.random() * 2 + 1).toFixed(1);
      }
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: value,
        label: DateFormatter.formatShort(date)
      });
    }
    return data;
  },

  generateTopPatientsData() {
    const patients = ['María García', 'Juan Pérez', 'Ana López', 'Carlos Ruiz', 'Laura Martín'];
    return patients.map((name, index) => ({
      name,
      sessions: Math.floor(Math.random() * 20) + 10 - index * 2,
      improvement: (Math.random() * 3 + 1).toFixed(1),
      lastSession: DateFormatter.formatRelative(new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000))
    }));
  },

  generateHourlyData() {
    const hours = [];
    for (let i = 6; i <= 22; i++) {
      hours.push({
        hour: `${i}:00`,
        sessions: Math.floor(Math.random() * 8) + 1
      });
    }
    return hours;
  },

  generateImprovementsData() {
    return [
      { metric: 'Reducción de Dolor', value: '+2.3', change: 'positive', description: 'vs mes anterior' },
      { metric: 'Tasa de Finalización', value: '+5.2%', change: 'positive', description: 'vs mes anterior' },
      { metric: 'Tiempo por Sesión', value: '+3min', change: 'neutral', description: 'promedio' },
      { metric: 'Satisfacción', value: '+0.4', change: 'positive', description: 'puntos de rating' }
    ];
  },

  generateMilestonesData() {
    return [
      { title: '🎯 100 Sesiones Completadas', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), type: 'achievement' },
      { title: '🌟 Rating Promedio >4.5', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), type: 'milestone' },
      { title: '👥 20 Pacientes Activos', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), type: 'growth' }
    ];
  },

  getTimeframeDays(timeframe) {
    const timeframes = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    return timeframes[timeframe] || 30;
  },

  getAnalyticsCacheTTL(timeframe) {
    const ttls = {
      '7d': 5 * 60 * 1000,   // 5 minutos
      '30d': 15 * 60 * 1000, // 15 minutos
      '90d': 60 * 60 * 1000, // 1 hora
      '1y': 4 * 60 * 60 * 1000 // 4 horas
    };
    return ttls[timeframe] || 15 * 60 * 1000;
  },

  renderAnalytics(data, timeframe) {
    const container = document.getElementById('analytics-container');
    if (!container) return;

    // Fragmento para mejor rendimiento
    const fragment = document.createDocumentFragment();
    
    // Header con controles de timeframe
    const headerDiv = document.createElement('div');
    headerDiv.className = 'analytics-header';
    headerDiv.innerHTML = this.generateAnalyticsHeader(timeframe);
    fragment.appendChild(headerDiv);

    // KPIs Overview
    const kpisDiv = document.createElement('div');
    kpisDiv.className = 'analytics-kpis';
    kpisDiv.innerHTML = this.generateAnalyticsKPIs(data.overview);
    fragment.appendChild(kpisDiv);

    // Charts Grid
    const chartsDiv = document.createElement('div');
    chartsDiv.className = 'analytics-charts';
    chartsDiv.innerHTML = this.generateAnalyticsCharts();
    fragment.appendChild(chartsDiv);

    // Insights y Recomendaciones
    const insightsDiv = document.createElement('div');
    insightsDiv.className = 'analytics-insights';
    insightsDiv.innerHTML = this.generateAnalyticsInsights(data);
    fragment.appendChild(insightsDiv);

    // Reemplazo eficiente
    container.innerHTML = '';
    container.appendChild(fragment);

    // Renderizar gráficos después del DOM
    requestIdleCallback(() => {
      this.renderAnalyticsCharts(data);
    });

    // Configurar eventos
    this.setupAnalyticsEvents();
    
    // Animaciones
    this.animateAnalyticsElements();
  },

  generateAnalyticsHeader(timeframe) {
    return `
      <div class="analytics-header-content">
        <div class="analytics-title">
          <h1>📊 Analytics Dashboard</h1>
          <p class="analytics-subtitle">Insights de rendimiento y progreso</p>
        </div>
        
        <div class="analytics-controls">
          <div class="timeframe-selector">
            <button class="timeframe-btn ${timeframe === '7d' ? 'active' : ''}" 
                    onclick="app.loadAnalytics('7d')">7 días</button>
            <button class="timeframe-btn ${timeframe === '30d' ? 'active' : ''}" 
                    onclick="app.loadAnalytics('30d')">30 días</button>
            <button class="timeframe-btn ${timeframe === '90d' ? 'active' : ''}" 
                    onclick="app.loadAnalytics('90d')">90 días</button>
            <button class="timeframe-btn ${timeframe === '1y' ? 'active' : ''}" 
                    onclick="app.loadAnalytics('1y')">1 año</button>
          </div>
          
          <div class="analytics-actions">
            <button class="btn-outline" onclick="app.exportAnalytics()">
              <span class="btn-icon">📥</span>
              Exportar
            </button>
            <button class="btn-outline" onclick="app.scheduleReport()">
              <span class="btn-icon">📅</span>
              Programar Reporte
            </button>
          </div>
        </div>
      </div>
    `;
  },

  generateAnalyticsKPIs(overview) {
    const kpis = [
      {
        title: 'Sesiones Totales',
        value: overview.totalSessions,
        icon: '✅',
        color: 'primary',
        trend: '+12%'
      },
      {
        title: 'Pacientes Activos',
        value: overview.activePatientsThisPeriod,
        icon: '👥',
        color: 'success',
        trend: '+8%'
      },
      {
        title: 'Reducción Promedio',
        value: `${overview.averagePainReduction}pts`,
        icon: '📉',
        color: 'warning',
        trend: '+15%'
      },
      {
        title: 'Tasa de Finalización',
        value: `${overview.completionRate}%`,
        icon: '🎯',
        color: 'info',
        trend: '+5%'
      },
      {
        title: 'Tiempo Total',
        value: `${Math.floor(overview.totalMinutes / 60)}h`,
        icon: '⏱️',
        color: 'purple',
        trend: '+23%'
      }
    ];

    return `
      <div class="kpi-grid">
        ${kpis.map((kpi, index) => `
          <div class="kpi-card ${kpi.color}" style="animation-delay: ${index * 100}ms">
            <div class="kpi-icon">${kpi.icon}</div>
            <div class="kpi-content">
              <div class="kpi-value" data-animate="counter">${kpi.value}</div>
              <div class="kpi-title">${kpi.title}</div>
              <div class="kpi-trend positive">${kpi.trend}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  generateAnalyticsCharts() {
    return `
      <div class="charts-grid">
        <!-- Sesiones en el Tiempo -->
        <div class="chart-container">
          <div class="chart-header">
            <h3>📈 Sesiones en el Tiempo</h3>
            <button class="chart-expand" onclick="app.expandChart('sessionsChart')">⛶</button>
          </div>
          <div class="chart-content">
            <canvas id="sessionsTimeChart" width="400" height="200"></canvas>
          </div>
        </div>

        <!-- Distribución de Terapias -->
        <div class="chart-container">
          <div class="chart-header">
            <h3>🎯 Distribución de Terapias</h3>
            <button class="chart-expand" onclick="app.expandChart('therapyChart')">⛶</button>
          </div>
          <div class="chart-content">
            <canvas id="therapyDistributionChart" width="400" height="200"></canvas>
          </div>
        </div>

        <!-- Reducción de Dolor -->
        <div class="chart-container">
          <div class="chart-header">
            <h3>📉 Tendencia de Mejora</h3>
            <button class="chart-expand" onclick="app.expandChart('painChart')">⛶</button>
          </div>
          <div class="chart-content">
            <canvas id="painReductionChart" width="400" height="200"></canvas>
          </div>
        </div>

        <!-- Sesiones por Hora -->
        <div class="chart-container">
          <div class="chart-header">
            <h3>🕒 Actividad por Hora</h3>
            <button class="chart-expand" onclick="app.expandChart('hourlyChart')">⛶</button>
          </div>
          <div class="chart-content">
            <canvas id="hourlyActivityChart" width="400" height="200"></canvas>
          </div>
        </div>
      </div>
    `;
  },

  generateAnalyticsInsights(data) {
    return `
      <div class="insights-grid">
        <!-- Top Pacientes -->
        <div class="insight-card">
          <div class="insight-header">
            <h3>🏆 Top Pacientes</h3>
            <span class="insight-badge">Progreso Destacado</span>
          </div>
          <div class="insight-content">
            ${this.generateTopPatientsTable(data.topPatients)}
          </div>
        </div>

        <!-- Mejoras Clave -->
        <div class="insight-card">
          <div class="insight-header">
            <h3>📊 Métricas Clave</h3>
            <span class="insight-badge">Tendencias</span>
          </div>
          <div class="insight-content">
            ${this.generateImprovementsGrid(data.improvements)}
          </div>
        </div>

        <!-- Logros Recientes -->
        <div class="insight-card">
          <div class="insight-header">
            <h3>🎉 Logros Recientes</h3>
            <span class="insight-badge">Hitos</span>
          </div>
          <div class="insight-content">
            ${this.generateMilestonesTimeline(data.recentMilestones)}
          </div>
        </div>

        <!-- Recomendaciones IA -->
        <div class="insight-card ai-recommendations">
          <div class="insight-header">
            <h3>🤖 Recomendaciones IA</h3>
            <span class="insight-badge ai">Inteligencia Artificial</span>
          </div>
          <div class="insight-content">
            ${this.generateAIRecommendations(data)}
          </div>
        </div>
      </div>
    `;
  },

  generateTopPatientsTable(patients) {
    return `
      <div class="top-patients-table">
        ${patients.map((patient, index) => `
          <div class="patient-row" style="animation-delay: ${index * 100}ms">
            <div class="patient-rank">#${index + 1}</div>
            <div class="patient-info">
              <div class="patient-name">${patient.name}</div>
              <div class="patient-meta">${patient.sessions} sesiones • ${patient.lastSession}</div>
            </div>
            <div class="patient-improvement">
              <span class="improvement-value">-${patient.improvement}</span>
              <span class="improvement-label">dolor</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  generateImprovementsGrid(improvements) {
    return `
      <div class="improvements-grid">
        ${improvements.map((improvement, index) => `
          <div class="improvement-item ${improvement.change}" style="animation-delay: ${index * 150}ms">
            <div class="improvement-value">${improvement.value}</div>
            <div class="improvement-metric">${improvement.metric}</div>
            <div class="improvement-description">${improvement.description}</div>
          </div>
        `).join('')}
      </div>
    `;
  },

  generateMilestonesTimeline(milestones) {
    return `
      <div class="milestones-timeline">
        ${milestones.map((milestone, index) => `
          <div class="milestone-item ${milestone.type}" style="animation-delay: ${index * 200}ms">
            <div class="milestone-date">${DateFormatter.formatRelative(milestone.date)}</div>
            <div class="milestone-title">${milestone.title}</div>
          </div>
        `).join('')}
      </div>
    `;
  },

  generateAIRecommendations(data) {
    const recommendations = [
      {
        type: 'optimization',
        title: 'Optimiza horarios de sesión',
        description: 'Las sesiones entre 10-12h tienen 23% más adherencia',
        action: 'Ver detalles',
        priority: 'high'
      },
      {
        type: 'content',
        title: 'Enfócate en terapias de espalda',
        description: 'Tus pacientes muestran 35% más mejora en estas series',
        action: 'Ver series',
        priority: 'medium'
      },
      {
        type: 'engagement',
        title: 'Contacta pacientes inactivos',
        description: '3 pacientes sin actividad en 7+ días',
        action: 'Enviar recordatorio',
        priority: 'high'
      }
    ];

    return `
      <div class="ai-recommendations-list">
        ${recommendations.map((rec, index) => `
          <div class="ai-recommendation ${rec.priority}" style="animation-delay: ${index * 100}ms">
            <div class="rec-icon">${this.getRecommendationIcon(rec.type)}</div>
            <div class="rec-content">
              <div class="rec-title">${rec.title}</div>
              <div class="rec-description">${rec.description}</div>
            </div>
            <button class="rec-action btn-small">${rec.action}</button>
          </div>
        `).join('')}
      </div>
    `;
  },

  getRecommendationIcon(type) {
    const icons = {
      optimization: '⚡',
      content: '🎯',
      engagement: '👋'
    };
    return icons[type] || '💡';
  },

  renderAnalyticsCharts(data) {
    if (!window.Chart) {
      console.warn('Chart.js no disponible para analytics');
      return;
    }

    // Limpiar gráficos anteriores
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });

    // Renderizar cada gráfico
    this.renderSessionsTimeChart(data.sessionsOverTime);
    this.renderTherapyDistributionChart(data.therapyTypeDistribution);
    this.renderPainReductionChart(data.painReductionTrend);
    this.renderHourlyActivityChart(data.sessionCompletionByHour);
  },

  renderSessionsTimeChart(data) {
    const canvas = document.getElementById('sessionsTimeChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    this.charts.sessionsTime = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          label: 'Sesiones',
          data: data.map(d => d.value),
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0,0,0,0.1)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff'
          }
        }
      }
    });
  },

  renderTherapyDistributionChart(data) {
    const canvas = document.getElementById('therapyDistributionChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    this.charts.therapyDistribution = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.type),
        datasets: [{
          data: data.map(d => d.count),
          backgroundColor: data.map(d => d.color),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1200,
          easing: 'easeOutBounce'
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          }
        }
      }
    });
  },

  renderPainReductionChart(data) {
    const canvas = document.getElementById('painReductionChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    this.charts.painReduction = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          label: 'Reducción de Dolor',
          data: data.map(d => d.value),
          backgroundColor: 'rgba(76, 175, 80, 0.8)',
          borderColor: '#4CAF50',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 800,
          easing: 'easeOutQuart'
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Puntos de Reducción'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  },

  renderHourlyActivityChart(data) {
    const canvas = document.getElementById('hourlyActivityChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    this.charts.hourlyActivity = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.hour),
        datasets: [{
          label: 'Sesiones por Hora',
          data: data.map(d => d.sessions),
          borderColor: '#f093fb',
          backgroundColor: 'rgba(240, 147, 251, 0.2)',
          borderWidth: 2,
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 600,
          easing: 'easeOutQuart'
        },
        scales: {
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  },

  setupAnalyticsEvents() {
    // Auto-refresh cada 5 minutos
    this.analyticsRefreshInterval = setInterval(() => {
      const currentTimeframe = document.querySelector('.timeframe-btn.active')?.textContent || '30d';
      this.clearCachedData(`analytics-${currentTimeframe}`);
      this.loadAnalytics(currentTimeframe);
    }, 5 * 60 * 1000);
  },

  animateAnalyticsElements() {
    // Animar KPIs con contador
    const kpiCards = document.querySelectorAll('.kpi-card');
    kpiCards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('animate-in');
        
        const counter = card.querySelector('[data-animate="counter"]');
        if (counter) {
          this.animateCounter(counter);
        }
      }, index * 100);
    });

    // Animar elementos de insights
    const insightElements = document.querySelectorAll('.insight-card, .patient-row, .improvement-item, .milestone-item, .ai-recommendation');
    
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });

      insightElements.forEach(element => observer.observe(element));
    }
  },

  async updateAnalyticsInBackground(timeframe) {
    try {
      setTimeout(async () => {
        const freshData = await this.fetchAnalyticsData(timeframe);
        this.setCachedData(`analytics-${timeframe}`, freshData);
        
        // Actualizar solo los KPIs sin re-renderizar todo
        this.updateAnalyticsKPIs(freshData.overview);
      }, 2 * 60 * 1000);
    } catch (error) {
      console.warn('Error en actualización background de analytics:', error);
    }
  },

  updateAnalyticsKPIs(overview) {
    const updates = [
      { selector: '.kpi-card.primary .kpi-value', value: overview.totalSessions },
      { selector: '.kpi-card.success .kpi-value', value: overview.activePatientsThisPeriod },
      { selector: '.kpi-card.warning .kpi-value', value: `${overview.averagePainReduction}pts` },
      { selector: '.kpi-card.info .kpi-value', value: `${overview.completionRate}%` }
    ];

    updates.forEach(({ selector, value }) => {
      const element = document.querySelector(selector);
      if (element && element.textContent !== value.toString()) {
        element.style.transform = 'scale(1.1)';
        element.textContent = value;
        setTimeout(() => {
          element.style.transform = 'scale(1)';
        }, 200);
      }
    });
  },

  async exportAnalytics() {
    try {
      LoadingManager.show('Generando reporte...');
      
      const timeframe = document.querySelector('.timeframe-btn.active')?.textContent || '30d';
      const data = this.getCachedData(`analytics-${timeframe}`);
      
      if (!data) {
        throw new Error('No hay datos para exportar');
      }
      
      // Generar reporte en formato CSV
      const csvData = this.generateAnalyticsCSV(data);
      const filename = `softzen-analytics-${timeframe}-${DateFormatter.formatFileDate()}.csv`;
      
      DataExporter.export(csvData, filename, 'csv');
      
      LoadingManager.hide();
      NotificationManager.showSuccess('Reporte exportado exitosamente');
      
    } catch (error) {
      LoadingManager.hide();
      console.error('Error exportando analytics:', error);
      NotificationManager.showError('Error exportando reporte');
    }
  },

  generateAnalyticsCSV(data) {
    const csvRows = [];
    
    // Headers
    csvRows.push(['Fecha', 'Sesiones', 'Reducción Dolor', 'Pacientes Activos']);
    
    // Data rows
    data.sessionsOverTime.forEach((session, index) => {
      const painData = data.painReductionTrend[index];
      csvRows.push([
        session.date,
        session.value,
        painData ? painData.value : '',
        data.overview.activePatientsThisPeriod
      ]);
    });
    
    return csvRows;
  },

  renderEmptyAnalytics() {
    const container = document.getElementById('analytics-container');
    if (!container) return;

    container.innerHTML = `
      <div class="empty-state-container">
        <div class="empty-state">
          <div class="empty-icon">📊</div>
          <h3>No hay datos de analytics</h3>
          <p>Completa algunas sesiones para ver tus estadísticas.</p>
          <button class="btn-primary btn-large" onclick="app.showView('dashboard')">
            <span class="btn-icon">🏠</span>
            Ir al Dashboard
          </button>
        </div>
      </div>
    `;
  },

  // Limpiar recursos de analytics
  destroyAnalytics() {
    if (this.analyticsRefreshInterval) {
      clearInterval(this.analyticsRefreshInterval);
      this.analyticsRefreshInterval = null;
    }
    
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
  }

  });
} else {
  console.warn('⚠️ SoftZenApp no disponible para extensiones P4 - esperando inicialización...');
  document.addEventListener('DOMContentLoaded', () => {
    if (window.SoftZenApp && window.SoftZenApp.prototype) {
      console.log('🔄 Reintentando cargar extensiones P4...');
      const script = document.createElement('script');
      script.src = '/js/app-extensions-p4.js';
      document.body.appendChild(script);
    }
  });
}

// ========== ESTILOS CSS PARA ANALYTICS ==========

const analyticsStyles = `
  /* Analytics Layout */
  .analytics-header {
    margin-bottom: var(--space-8);
  }

  .analytics-header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-6);
  }

  .analytics-title h1 {
    font-size: var(--text-3xl);
    font-weight: var(--font-bold);
    color: var(--text-primary);
    margin-bottom: var(--space-2);
  }

  .analytics-subtitle {
    color: var(--text-secondary);
    font-size: var(--text-lg);
  }

  .analytics-controls {
    display: flex;
    gap: var(--space-4);
    align-items: center;
  }

  .timeframe-selector {
    display: flex;
    background: var(--surface-secondary);
    border-radius: var(--radius-lg);
    padding: var(--space-1);
  }

  .timeframe-btn {
    padding: var(--space-2) var(--space-4);
    border: none;
    background: transparent;
    color: var(--text-secondary);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: var(--font-medium);
  }

  .timeframe-btn.active {
    background: var(--primary-500);
    color: white;
    box-shadow: var(--shadow-sm);
  }

  .timeframe-btn:hover:not(.active) {
    background: var(--surface-hover);
    color: var(--text-primary);
  }

  /* KPI Cards */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-6);
    margin-bottom: var(--space-8);
  }

  .kpi-card {
    background: var(--surface);
    border-radius: var(--radius-xl);
    padding: var(--space-6);
    display: flex;
    align-items: center;
    gap: var(--space-4);
    box-shadow: var(--shadow-sm);
    border-left: 4px solid var(--primary-500);
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.4s ease;
  }

  .kpi-card.animate-in {
    opacity: 1;
    transform: translateY(0);
  }

  .kpi-card.success {
    border-left-color: var(--success-500);
  }

  .kpi-card.warning {
    border-left-color: var(--warning-500);
  }

  .kpi-card.info {
    border-left-color: var(--info-500);
  }

  .kpi-card.purple {
    border-left-color: #9333ea;
  }

  .kpi-icon {
    font-size: var(--text-3xl);
    line-height: 1;
  }

  .kpi-value {
    font-size: var(--text-2xl);
    font-weight: var(--font-bold);
    color: var(--text-primary);
    margin-bottom: var(--space-1);
  }

  .kpi-title {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    margin-bottom: var(--space-2);
  }

  .kpi-trend {
    font-size: var(--text-sm);
    font-weight: var(--font-semibold);
  }

  .kpi-trend.positive {
    color: var(--success-600);
  }

  /* Charts Grid */
  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: var(--space-6);
    margin-bottom: var(--space-8);
  }

  .chart-container {
    background: var(--surface);
    border-radius: var(--radius-xl);
    padding: var(--space-6);
    box-shadow: var(--shadow-sm);
  }

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);
  }

  .chart-header h3 {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
  }

  .chart-expand {
    background: none;
    border: none;
    font-size: var(--text-lg);
    color: var(--text-secondary);
    cursor: pointer;
    padding: var(--space-2);
    border-radius: var(--radius-md);
    transition: all 0.2s ease;
  }

  .chart-expand:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
  }

  .chart-content {
    height: 250px;
    position: relative;
  }

  /* Insights Grid */
  .insights-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--space-6);
  }

  .insight-card {
    background: var(--surface);
    border-radius: var(--radius-xl);
    padding: var(--space-6);
    box-shadow: var(--shadow-sm);
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.4s ease;
  }

  .insight-card.animate-in {
    opacity: 1;
    transform: translateY(0);
  }

  .insight-card.ai-recommendations {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .insight-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);
  }

  .insight-header h3 {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    margin: 0;
  }

  .insight-badge {
    font-size: var(--text-xs);
    padding: var(--space-1) var(--space-3);
    background: var(--primary-100);
    color: var(--primary-700);
    border-radius: var(--radius-full);
    font-weight: var(--font-medium);
  }

  .insight-badge.ai {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }

  /* Top Patients Table */
  .top-patients-table {
    space-y: var(--space-3);
  }

  .patient-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3);
    background: var(--surface-secondary);
    border-radius: var(--radius-lg);
    opacity: 0;
    transform: translateX(-20px);
    transition: all 0.3s ease;
  }

  .patient-row.animate-in {
    opacity: 1;
    transform: translateX(0);
  }

  .patient-rank {
    font-weight: var(--font-bold);
    color: var(--primary-600);
    min-width: 30px;
  }

  .patient-info {
    flex: 1;
  }

  .patient-name {
    font-weight: var(--font-semibold);
    color: var(--text-primary);
  }

  .patient-meta {
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  .patient-improvement {
    text-align: right;
  }

  .improvement-value {
    font-weight: var(--font-bold);
    color: var(--success-600);
  }

  .improvement-label {
    font-size: var(--text-xs);
    color: var(--text-secondary);
  }

  /* Improvements Grid */
  .improvements-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-4);
  }

  .improvement-item {
    text-align: center;
    padding: var(--space-4);
    background: var(--surface-secondary);
    border-radius: var(--radius-lg);
    opacity: 0;
    transform: scale(0.9);
    transition: all 0.3s ease;
  }

  .improvement-item.animate-in {
    opacity: 1;
    transform: scale(1);
  }

  .improvement-value {
    font-size: var(--text-xl);
    font-weight: var(--font-bold);
    color: var(--primary-600);
  }

  .improvement-item.positive .improvement-value {
    color: var(--success-600);
  }

  .improvement-item.negative .improvement-value {
    color: var(--danger-600);
  }

  .improvement-metric {
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin: var(--space-1) 0;
  }

  .improvement-description {
    font-size: var(--text-xs);
    color: var(--text-secondary);
  }

  /* AI Recommendations */
  .ai-recommendations-list {
    space-y: var(--space-4);
  }

  .ai-recommendation {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4);
    background: rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-lg);
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.3s ease;
  }

  .ai-recommendation.animate-in {
    opacity: 1;
    transform: translateY(0);
  }

  .ai-recommendation.high {
    border-left: 3px solid #ff6b6b;
  }

  .ai-recommendation.medium {
    border-left: 3px solid #feca57;
  }

  .rec-icon {
    font-size: var(--text-xl);
  }

  .rec-content {
    flex: 1;
  }

  .rec-title {
    font-weight: var(--font-semibold);
    margin-bottom: var(--space-1);
  }

  .rec-description {
    font-size: var(--text-sm);
    opacity: 0.8;
  }

  .rec-action {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .rec-action:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .analytics-header-content {
      flex-direction: column;
      gap: var(--space-4);
    }
    
    .analytics-controls {
      flex-direction: column;
      width: 100%;
    }
    
    .timeframe-selector {
      width: 100%;
      justify-content: space-around;
    }
    
    .charts-grid {
      grid-template-columns: 1fr;
    }
    
    .improvements-grid {
      grid-template-columns: 1fr;
    }
    
    .kpi-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 480px) {
    .kpi-grid {
      grid-template-columns: 1fr;
    }
  }
`;

// Agregar estilos
const analyticsStyleSheet = document.createElement('style');
analyticsStyleSheet.textContent = analyticsStyles;
document.head.appendChild(analyticsStyleSheet);

console.log('✅ SoftZen App - Extensiones P4 cargadas: Analytics y Reportes Avanzados');
