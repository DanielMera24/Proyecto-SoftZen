// ===================================================================
// SOFTZEN APP - EXTENSIONES P3: SERIES TERAPÉUTICAS Y SESIONES
// Funcionalidades avanzadas para gestión de series y sesiones
// Enfoque: Rendimiento + Sostenibilidad + Escalabilidad
// ===================================================================

// Extensión de métodos para la clase SoftZenApp
if (window.SoftZenApp && window.SoftZenApp.prototype) {
  Object.assign(window.SoftZenApp.prototype, {

  // ========== GESTIÓN DE SERIES TERAPÉUTICAS ==========

  async loadSeries() {
    try {
      PerformanceMonitor.mark('series-load-start');
      LoadingManager.show('Cargando series terapéuticas...');
      
      // Cache inteligente para series
      const cachedSeries = this.getCachedData('therapy-series');
      if (cachedSeries) {
        this.renderSeries(cachedSeries);
        LoadingManager.hide();
        
        // Actualización en background
        this.updateSeriesInBackground();
        return;
      }
      
      // Cargar series desde Firebase
      const filters = this.getSeriesFilters();
      const series = await firebaseService.getTherapySeries(filters);
      
      // Cache con TTL adaptativo
      const cacheTime = series.length > 50 ? 10 * 60 * 1000 : 15 * 60 * 1000;
      this.setCachedData('therapy-series', series, cacheTime);
      
      this.renderSeries(series);
      LoadingManager.hide();
      
      PerformanceMonitor.mark('series-load-end');
      PerformanceMonitor.measure('series-load', 'series-load-start', 'series-load-end');
      
    } catch (error) {
      LoadingManager.hide();
      console.error('Error cargando series:', error);
      NotificationManager.showError('Error cargando series terapéuticas');
      this.renderEmptySeries();
    }
  },

  getSeriesFilters() {
    const userRole = firebaseService.getUserRole();
    const filters = {};
    
    if (userRole === USER_ROLES.INSTRUCTOR) {
      filters.instructorId = this.currentUser.uid;
    }
    
    return filters;
  },

  async updateSeriesInBackground() {
    try {
      setTimeout(async () => {
        const filters = this.getSeriesFilters();
        const freshSeries = await firebaseService.getTherapySeries(filters);
        this.setCachedData('therapy-series', freshSeries);
        
        // Actualizar indicadores sin re-render completo
        this.updateSeriesIndicators(freshSeries);
      }, 2 * 60 * 1000);
    } catch (error) {
      console.warn('Error en actualización background de series:', error);
    }
  },

  renderSeries(series) {
    const container = document.getElementById('series-container');
    if (!container) return;

    if (series.length === 0) {
      this.renderEmptySeries();
      return;
    }

    // Fragmento para mejor rendimiento
    const fragment = document.createDocumentFragment();
    
    // Header con estadísticas
    const headerDiv = document.createElement('div');
    headerDiv.className = 'series-header';
    headerDiv.innerHTML = this.generateSeriesHeader(series);
    fragment.appendChild(headerDiv);

    // Filtros y búsqueda
    const filtersDiv = document.createElement('div');
    filtersDiv.className = 'series-filters';
    filtersDiv.innerHTML = this.generateSeriesFilters();
    fragment.appendChild(filtersDiv);

    // Grid de series
    const gridDiv = document.createElement('div');
    gridDiv.className = 'series-grid';
    gridDiv.innerHTML = this.generateSeriesGrid(series);
    fragment.appendChild(gridDiv);

    // Reemplazo eficiente
    container.innerHTML = '';
    container.appendChild(fragment);

    // Configurar eventos
    this.setupSeriesEvents();
    
    // Animaciones
    this.animateSeriesCards();
  },

  generateSeriesHeader(series) {
    const totalSeries = series.length;
    const activeSeries = series.filter(s => s.isActive).length;
    const publicSeries = series.filter(s => s.isPublic).length;
    
    return `
      <div class="series-stats">
        <div class="stat-card primary">
          <div class="stat-value">${totalSeries}</div>
          <div class="stat-label">Total Series</div>
        </div>
        <div class="stat-card success">
          <div class="stat-value">${activeSeries}</div>
          <div class="stat-label">Activas</div>
        </div>
        <div class="stat-card info">
          <div class="stat-value">${publicSeries}</div>
          <div class="stat-label">Públicas</div>
        </div>
      </div>
      
      <div class="series-actions">
        <button class="btn-primary" onclick="app.showSeriesModal()">
          <span class="btn-icon">➕</span>
          Nueva Serie
        </button>
        <button class="btn-outline" onclick="app.importSeries()">
          <span class="btn-icon">📥</span>
          Importar
        </button>
      </div>
    `;
  },

  generateSeriesFilters() {
    return `
      <div class="filters-container">
        <div class="search-box">
          <input type="text" 
                 id="series-search" 
                 placeholder="Buscar series..." 
                 class="search-input">
          <button class="search-btn" onclick="app.searchSeries()">🔍</button>
        </div>
        
        <div class="filter-group">
          <select id="therapy-type-filter" onchange="app.filterSeries()">
            <option value="">Todos los tipos</option>
            <option value="back_pain">Dolor de Espalda</option>
            <option value="stress_relief">Alivio del Estrés</option>
            <option value="flexibility">Flexibilidad</option>
            <option value="strength">Fortalecimiento</option>
          </select>
          
          <select id="difficulty-filter" onchange="app.filterSeries()">
            <option value="">Todas las dificultades</option>
            <option value="beginner">Principiante</option>
            <option value="intermediate">Intermedio</option>
            <option value="advanced">Avanzado</option>
          </select>
        </div>
      </div>
    `;
  },

  generateSeriesGrid(series) {
    return series.map((serie, index) => this.generateSeriesCard(serie, index)).join('');
  },

  generateSeriesCard(serie, index) {
    const difficultyLabels = {
      beginner: 'Principiante',
      intermediate: 'Intermedio', 
      advanced: 'Avanzado'
    };

    const therapyTypeLabels = {
      back_pain: 'Dolor de Espalda',
      stress_relief: 'Alivio del Estrés',
      flexibility: 'Flexibilidad',
      strength: 'Fortalecimiento'
    };

    return `
      <div class="series-card ${serie.isActive ? 'active' : 'inactive'}" 
           style="animation-delay: ${index * 100}ms"
           data-series-id="${serie.id}">
        
        <div class="series-card-header">
          <div class="series-thumbnail">
            ${serie.thumbnailUrl ? 
              `<img src="${serie.thumbnailUrl}" alt="${serie.name}" loading="lazy">` :
              `<div class="series-placeholder">
                <span class="placeholder-icon">🧘‍♀️</span>
              </div>`
            }
            <div class="series-duration-badge">${serie.estimatedDuration || 30} min</div>
          </div>
          
          <div class="series-status ${serie.isActive ? 'active' : 'inactive'}">
            ${serie.isActive ? '🟢' : '⚪'}
          </div>
        </div>

        <div class="series-content">
          <h3 class="series-title">${serie.name}</h3>
          <p class="series-description">${serie.description || 'Sin descripción'}</p>
          
          <div class="series-meta">
            <span class="meta-tag therapy-type">
              ${therapyTypeLabels[serie.therapyType] || serie.therapyType}
            </span>
            <span class="meta-tag difficulty ${serie.difficulty}">
              ${difficultyLabels[serie.difficulty] || serie.difficulty}
            </span>
          </div>

          <div class="series-stats">
            <div class="stat-item">
              <span class="stat-icon">🎯</span>
              <span class="stat-value">${serie.posturesCount || 0}</span>
              <span class="stat-label">Posturas</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">👥</span>
              <span class="stat-value">${serie.assignedPatients || 0}</span>
              <span class="stat-label">Pacientes</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">⭐</span>
              <span class="stat-value">${(serie.rating || 0).toFixed(1)}</span>
              <span class="stat-label">Rating</span>
            </div>
          </div>
        </div>

        <div class="series-actions">
          <button class="btn-icon" 
                  onclick="app.viewSeriesDetails('${serie.id}')" 
                  title="Ver detalles">
            👁️
          </button>
          <button class="btn-icon" 
                  onclick="app.editSeries('${serie.id}')" 
                  title="Editar">
            ✏️
          </button>
          <button class="btn-icon" 
                  onclick="app.duplicateSeries('${serie.id}')" 
                  title="Duplicar">
            📋
          </button>
          <button class="btn-icon ${serie.isActive ? 'deactivate' : 'activate'}" 
                  onclick="app.toggleSeriesStatus('${serie.id}')" 
                  title="${serie.isActive ? 'Desactivar' : 'Activar'}">
            ${serie.isActive ? '⏸️' : '▶️'}
          </button>
        </div>
      </div>
    `;
  },

  setupSeriesEvents() {
    // Búsqueda con debounce
    const searchInput = document.getElementById('series-search');
    if (searchInput) {
      searchInput.addEventListener('input', this.debounce(() => {
        this.searchSeries();
      }, 300));
    }

    // Drag and drop para reordenar
    if (typeof Sortable !== 'undefined') {
      const grid = document.querySelector('.series-grid');
      if (grid) {
        this.sortableInstance = Sortable.create(grid, {
          animation: 150,
          onEnd: (evt) => {
            this.reorderSeries(evt.oldIndex, evt.newIndex);
          }
        });
      }
    }
  },

  animateSeriesCards() {
    const cards = document.querySelectorAll('.series-card:not(.animate-in)');
    
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      cards.forEach(card => observer.observe(card));
    }
  },

  // ========== GESTIÓN DE SESIONES ==========

  async loadSessions(patientId = null) {
    try {
      LoadingManager.show('Cargando sesiones...');
      
      const filters = { patientId };
      if (this.currentUser?.role === USER_ROLES.INSTRUCTOR) {
        filters.instructorId = this.currentUser.uid;
      }
      
      const sessions = await firebaseService.getSessions(filters);
      this.renderSessions(sessions);
      
      LoadingManager.hide();
      
    } catch (error) {
      LoadingManager.hide();
      console.error('Error cargando sesiones:', error);
      NotificationManager.showError('Error cargando sesiones');
    }
  },

  renderSessions(sessions) {
    const container = document.getElementById('sessions-container');
    if (!container) return;

    if (sessions.length === 0) {
      this.renderEmptySessions();
      return;
    }

    container.innerHTML = `
      <div class="sessions-header">
        <h2>📅 Historial de Sesiones</h2>
        <div class="sessions-filters">
          <select id="session-status-filter" onchange="app.filterSessions()">
            <option value="">Todos los estados</option>
            <option value="completed">Completadas</option>
            <option value="in_progress">En Progreso</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>
      </div>
      
      <div class="sessions-timeline">
        ${this.generateSessionsTimeline(sessions)}
      </div>
    `;
  },

  generateSessionsTimeline(sessions) {
    return sessions.map((session, index) => `
      <div class="session-item ${session.status}" 
           style="animation-delay: ${index * 50}ms">
        <div class="session-date">
          <div class="date-day">${DateFormatter.formatDay(session.date)}</div>
          <div class="date-month">${DateFormatter.formatMonth(session.date)}</div>
        </div>
        
        <div class="session-content">
          <div class="session-header">
            <h4>${session.seriesName || 'Sesión Individual'}</h4>
            <span class="session-status-badge ${session.status}">
              ${this.getSessionStatusLabel(session.status)}
            </span>
          </div>
          
          <div class="session-metrics">
            ${session.painBefore !== null ? 
              `<div class="metric">
                <span class="metric-label">Dolor:</span>
                <span class="metric-value">${session.painBefore} → ${session.painAfter}</span>
                <span class="metric-change ${session.painBefore > session.painAfter ? 'positive' : 'negative'}">
                  ${session.painBefore > session.painAfter ? '↓' : '↑'}
                </span>
              </div>` : ''
            }
            
            <div class="metric">
              <span class="metric-label">Duración:</span>
              <span class="metric-value">${session.duration || 'N/A'} min</span>
            </div>
            
            ${session.rating ? 
              `<div class="metric">
                <span class="metric-label">Valoración:</span>
                <span class="metric-value">${'⭐'.repeat(session.rating)}</span>
              </div>` : ''
            }
          </div>
          
          ${session.notes ? 
            `<div class="session-notes">
              <strong>Notas:</strong> ${session.notes}
            </div>` : ''
          }
        </div>
        
        <div class="session-actions">
          <button class="btn-icon" 
                  onclick="app.viewSessionDetails('${session.id}')" 
                  title="Ver detalles">
            👁️
          </button>
          ${session.status === 'completed' ? 
            `<button class="btn-icon" 
                     onclick="app.repeatSession('${session.id}')" 
                     title="Repetir sesión">
              🔄
            </button>` : ''
          }
        </div>
      </div>
    `).join('');
  },

  getSessionStatusLabel(status) {
    const labels = {
      completed: 'Completada',
      in_progress: 'En Progreso',
      cancelled: 'Cancelada',
      pending: 'Pendiente'
    };
    return labels[status] || status;
  },

  // ========== MÉTODOS DE BÚSQUEDA Y FILTROS ==========

  async searchSeries() {
    const searchTerm = document.getElementById('series-search')?.value?.trim();
    const allSeries = this.getCachedData('therapy-series') || [];
    
    if (!searchTerm) {
      this.renderSeries(allSeries);
      return;
    }

    const filteredSeries = allSeries.filter(serie => {
      const searchLower = searchTerm.toLowerCase();
      return serie.name.toLowerCase().includes(searchLower) ||
             (serie.description && serie.description.toLowerCase().includes(searchLower)) ||
             serie.therapyType.toLowerCase().includes(searchLower);
    });

    this.renderSeries(filteredSeries);
    
    if (filteredSeries.length === 0) {
      NotificationManager.showInfo(`No se encontraron series para "${searchTerm}"`);
    }
  },

  filterSeries() {
    const therapyTypeFilter = document.getElementById('therapy-type-filter')?.value;
    const difficultyFilter = document.getElementById('difficulty-filter')?.value;
    const allSeries = this.getCachedData('therapy-series') || [];
    
    let filteredSeries = allSeries;
    
    if (therapyTypeFilter) {
      filteredSeries = filteredSeries.filter(s => s.therapyType === therapyTypeFilter);
    }
    
    if (difficultyFilter) {
      filteredSeries = filteredSeries.filter(s => s.difficulty === difficultyFilter);
    }
    
    this.renderSeries(filteredSeries);
  },

  // ========== MÉTODOS DE MODAL Y CRUD ==========

  showSeriesModal(seriesId = null) {
    console.log('🚧 Mostrando modal de serie:', seriesId ? 'Editar' : 'Nueva');
    
    // TODO: Implementar modal completo de series
    ModalManager.alert(
      seriesId ? 'Editar Serie' : 'Nueva Serie',
      'Funcionalidad de series en desarrollo. Próximamente disponible.'
    );
  },

  async viewSeriesDetails(seriesId) {
    try {
      LoadingManager.show('Cargando detalles...');
      
      // TODO: Implementar vista de detalles completa
      const series = await firebaseService.getSeriesById(seriesId);
      
      LoadingManager.hide();
      
      ModalManager.alert(
        'Detalles de Serie',
        `
          <strong>${series?.name || 'Serie'}</strong><br>
          Funcionalidad completa en desarrollo.
        `
      );
      
    } catch (error) {
      LoadingManager.hide();
      NotificationManager.showError('Error cargando detalles de la serie');
    }
  },

  renderEmptySeries() {
    const container = document.getElementById('series-container');
    if (!container) return;

    container.innerHTML = `
      <div class="empty-state-container">
        <div class="empty-state">
          <div class="empty-icon">📚</div>
          <h3>No hay series terapéuticas</h3>
          <p>Crea tu primera serie para comenzar a ofrecer terapias personalizadas.</p>
          <button class="btn-primary btn-large" onclick="app.showSeriesModal()">
            <span class="btn-icon">➕</span>
            Crear Primera Serie
          </button>
        </div>
      </div>
    `;
  },

  renderEmptySessions() {
    const container = document.getElementById('sessions-container');
    if (!container) return;

    container.innerHTML = `
      <div class="empty-state-container">
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <h3>No hay sesiones registradas</h3>
          <p>Las sesiones completadas aparecerán aquí.</p>
        </div>
      </div>
    `;
  }

  });
} else {
  console.warn('⚠️ SoftZenApp no disponible para extensiones P3 - esperando inicialización...');
  document.addEventListener('DOMContentLoaded', () => {
    if (window.SoftZenApp && window.SoftZenApp.prototype) {
      console.log('🔄 Reintentando cargar extensiones P3...');
      const script = document.createElement('script');
      script.src = '/js/app-extensions-p3.js';
      document.body.appendChild(script);
    }
  });
}

// ========== ESTILOS CSS PARA SERIES Y SESIONES ==========

const seriesStyles = `
  /* Series Grid */
  .series-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--space-6);
    margin-top: var(--space-6);
  }

  .series-card {
    background: var(--surface);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    transition: all 0.3s ease;
    opacity: 0;
    transform: translateY(20px);
  }

  .series-card.animate-in {
    opacity: 1;
    transform: translateY(0);
  }

  .series-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }

  .series-card-header {
    position: relative;
    height: 160px;
    overflow: hidden;
  }

  .series-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .series-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--primary-100), var(--primary-200));
  }

  .series-duration-badge {
    position: absolute;
    top: var(--space-3);
    right: var(--space-3);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-full);
    font-size: var(--text-sm);
  }

  .series-status {
    position: absolute;
    top: var(--space-3);
    left: var(--space-3);
    font-size: var(--text-lg);
  }

  .series-content {
    padding: var(--space-4);
  }

  .series-title {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    margin-bottom: var(--space-2);
    color: var(--text-primary);
  }

  .series-description {
    color: var(--text-secondary);
    font-size: var(--text-sm);
    margin-bottom: var(--space-3);
    line-height: 1.5;
  }

  .series-meta {
    display: flex;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }

  .meta-tag {
    font-size: var(--text-xs);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-full);
    font-weight: var(--font-medium);
  }

  .meta-tag.therapy-type {
    background: var(--primary-100);
    color: var(--primary-700);
  }

  .meta-tag.difficulty.beginner {
    background: var(--success-100);
    color: var(--success-700);
  }

  .meta-tag.difficulty.intermediate {
    background: var(--warning-100);
    color: var(--warning-700);
  }

  .meta-tag.difficulty.advanced {
    background: var(--danger-100);
    color: var(--danger-700);
  }

  .series-stats {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--space-3);
  }

  .stat-item {
    text-align: center;
  }

  .stat-icon {
    display: block;
    font-size: var(--text-lg);
    margin-bottom: var(--space-1);
  }

  .stat-value {
    display: block;
    font-weight: var(--font-semibold);
    color: var(--text-primary);
  }

  .stat-label {
    font-size: var(--text-xs);
    color: var(--text-secondary);
  }

  .series-actions {
    display: flex;
    justify-content: space-around;
    padding: var(--space-3);
    border-top: 1px solid var(--border);
  }

  /* Sessions Timeline */
  .sessions-timeline {
    margin-top: var(--space-6);
  }

  .session-item {
    display: flex;
    gap: var(--space-4);
    padding: var(--space-4);
    background: var(--surface);
    border-radius: var(--radius-lg);
    margin-bottom: var(--space-4);
    opacity: 0;
    transform: translateX(-20px);
    transition: all 0.3s ease;
  }

  .session-item.animate-in {
    opacity: 1;
    transform: translateX(0);
  }

  .session-date {
    text-align: center;
    min-width: 60px;
  }

  .date-day {
    font-size: var(--text-2xl);
    font-weight: var(--font-bold);
    color: var(--primary-600);
  }

  .date-month {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    text-transform: uppercase;
  }

  .session-content {
    flex: 1;
  }

  .session-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-2);
  }

  .session-status-badge {
    font-size: var(--text-xs);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-full);
    font-weight: var(--font-medium);
  }

  .session-status-badge.completed {
    background: var(--success-100);
    color: var(--success-700);
  }

  .session-status-badge.in_progress {
    background: var(--warning-100);
    color: var(--warning-700);
  }

  .session-status-badge.cancelled {
    background: var(--danger-100);
    color: var(--danger-700);
  }

  .session-metrics {
    display: flex;
    gap: var(--space-4);
    margin-bottom: var(--space-2);
  }

  .metric {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .metric-change.positive {
    color: var(--success-600);
  }

  .metric-change.negative {
    color: var(--danger-600);
  }

  .session-notes {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    margin-top: var(--space-2);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .series-grid {
      grid-template-columns: 1fr;
      gap: var(--space-4);
    }
    
    .session-item {
      flex-direction: column;
      text-align: center;
    }
    
    .session-metrics {
      justify-content: center;
      flex-wrap: wrap;
    }
  }
`;

// Agregar estilos
const seriesStyleSheet = document.createElement('style');
seriesStyleSheet.textContent = seriesStyles;
document.head.appendChild(seriesStyleSheet);

console.log('✅ SoftZen App - Extensiones P3 cargadas: Series Terapéuticas y Sesiones');
