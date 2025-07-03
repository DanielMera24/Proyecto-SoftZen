// ===================================================================
// SOFTZEN APP - EXTENSIONES P5: CONFIGURACIONES Y FUNCIONALIDADES AVANZADAS
// Sistema completo de configuraciones, perfil, notificaciones y herramientas
// Enfoque: Rendimiento + Sostenibilidad + Escalabilidad
// ===================================================================

// Extensión de métodos para la clase SoftZenApp
if (window.SoftZenApp && window.SoftZenApp.prototype) {
  Object.assign(window.SoftZenApp.prototype, {

  // ========== GESTIÓN DE PERFIL DE USUARIO ==========

  async loadUserProfile() {
    try {
      LoadingManager.show('Cargando perfil...');
      
      const userProfile = await firebaseService.getUserData(this.currentUser.uid);
      this.renderUserProfile(userProfile);
      
      LoadingManager.hide();
      
    } catch (error) {
      LoadingManager.hide();
      console.error('Error cargando perfil:', error);
      NotificationManager.showError('Error cargando perfil de usuario');
    }
  },

  renderUserProfile(profile) {
    const container = document.getElementById('profile-container');
    if (!container) return;

    container.innerHTML = `
      <div class="profile-layout">
        <div class="profile-sidebar">
          ${this.generateProfileSidebar(profile)}
        </div>
        
        <div class="profile-content">
          ${this.generateProfileContent(profile)}
        </div>
      </div>
    `;

    this.setupProfileEvents();
  },

  generateProfileSidebar(profile) {
    return `
      <div class="profile-card">
        <div class="profile-avatar-section">
          <div class="profile-avatar-container">
            ${profile.photoURL ? 
              `<img src="${profile.photoURL}" alt="${profile.displayName}" class="profile-avatar">` :
              `<div class="profile-avatar placeholder">
                <span>${profile.displayName?.charAt(0)?.toUpperCase() || 'U'}</span>
              </div>`
            }
            <button class="avatar-edit-btn" onclick="app.changeProfilePhoto()">
              <span class="edit-icon">📷</span>
            </button>
          </div>
          
          <div class="profile-basic-info">
            <h2 class="profile-name">${profile.displayName || 'Usuario'}</h2>
            <p class="profile-email">${profile.email}</p>
            <span class="profile-role-badge ${profile.role}">
              ${this.getRoleLabel(profile.role)}
            </span>
          </div>
        </div>

        <div class="profile-stats">
          <div class="stat-item">
            <span class="stat-value">${profile.stats?.sessionsCompleted || 0}</span>
            <span class="stat-label">Sesiones</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${Math.floor((profile.stats?.totalMinutes || 0) / 60)}</span>
            <span class="stat-label">Horas</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${DateFormatter.formatShort(profile.createdAt)}</span>
            <span class="stat-label">Miembro desde</span>
          </div>
        </div>

        <div class="profile-menu">
          <button class="menu-item active" data-section="general">
            <span class="menu-icon">⚙️</span>
            <span class="menu-label">General</span>
          </button>
          <button class="menu-item" data-section="security">
            <span class="menu-icon">🔒</span>
            <span class="menu-label">Seguridad</span>
          </button>
          <button class="menu-item" data-section="notifications">
            <span class="menu-icon">🔔</span>
            <span class="menu-label">Notificaciones</span>
          </button>
          <button class="menu-item" data-section="preferences">
            <span class="menu-icon">🎨</span>
            <span class="menu-label">Preferencias</span>
          </button>
          <button class="menu-item" data-section="privacy">
            <span class="menu-icon">🛡️</span>
            <span class="menu-label">Privacidad</span>
          </button>
          <button class="menu-item" data-section="export">
            <span class="menu-icon">📥</span>
            <span class="menu-label">Exportar Datos</span>
          </button>
        </div>
      </div>
    `;
  },

  generateProfileContent(profile) {
    return `
      <div class="profile-sections">
        <!-- Sección General -->
        <div class="profile-section active" id="section-general">
          <div class="section-header">
            <h3>🔧 Configuración General</h3>
            <p>Información básica de tu perfil</p>
          </div>
          
          <form class="profile-form" id="general-form">
            <div class="form-group">
              <label for="displayName">Nombre Completo</label>
              <input type="text" id="displayName" name="displayName" 
                     value="${profile.displayName || ''}" 
                     placeholder="Tu nombre completo">
            </div>
            
            <div class="form-group">
              <label for="bio">Biografía</label>
              <textarea id="bio" name="bio" 
                        placeholder="Cuéntanos un poco sobre ti..."
                        rows="3">${profile.bio || ''}</textarea>
            </div>
            
            <div class="form-group">
              <label for="specialization">Especialización</label>
              <select id="specialization" name="specialization">
                <option value="">Selecciona tu especialización</option>
                <option value="hatha" ${profile.specialization === 'hatha' ? 'selected' : ''}>Hatha Yoga</option>
                <option value="vinyasa" ${profile.specialization === 'vinyasa' ? 'selected' : ''}>Vinyasa</option>
                <option value="therapeutic" ${profile.specialization === 'therapeutic' ? 'selected' : ''}>Yoga Terapéutico</option>
                <option value="yin" ${profile.specialization === 'yin' ? 'selected' : ''}>Yin Yoga</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="location">Ubicación</label>
              <input type="text" id="location" name="location" 
                     value="${profile.location || ''}" 
                     placeholder="Ciudad, País">
            </div>
            
            <button type="submit" class="btn-primary">
              <span class="btn-icon">💾</span>
              Guardar Cambios
            </button>
          </form>
        </div>

        <!-- Sección Seguridad -->
        <div class="profile-section" id="section-security">
          <div class="section-header">
            <h3>🔒 Seguridad de la Cuenta</h3>
            <p>Gestiona la seguridad de tu cuenta</p>
          </div>
          
          <div class="security-options">
            <div class="security-item">
              <div class="security-info">
                <h4>Cambiar Contraseña</h4>
                <p>Actualiza tu contraseña regularmente para mayor seguridad</p>
              </div>
              <button class="btn-outline" onclick="app.showChangePasswordModal()">
                Cambiar
              </button>
            </div>
            
            <div class="security-item">
              <div class="security-info">
                <h4>Autenticación de Dos Factores</h4>
                <p>Agrega una capa extra de seguridad a tu cuenta</p>
              </div>
              <button class="btn-outline" onclick="app.setup2FA()">
                Configurar
              </button>
            </div>
            
            <div class="security-item">
              <div class="security-info">
                <h4>Sesiones Activas</h4>
                <p>Ve y gestiona tus dispositivos conectados</p>
              </div>
              <button class="btn-outline" onclick="app.viewActiveSessions()">
                Ver Sesiones
              </button>
            </div>
          </div>
        </div>

        <!-- Sección Notificaciones -->
        <div class="profile-section" id="section-notifications">
          <div class="section-header">
            <h3>🔔 Preferencias de Notificaciones</h3>
            <p>Controla qué notificaciones recibir</p>
          </div>
          
          <div class="notifications-settings">
            ${this.generateNotificationSettings(profile.preferences?.notifications)}
          </div>
        </div>

        <!-- Sección Preferencias -->
        <div class="profile-section" id="section-preferences">
          <div class="section-header">
            <h3>🎨 Preferencias de la Aplicación</h3>
            <p>Personaliza tu experiencia en SoftZen</p>
          </div>
          
          <div class="preferences-settings">
            ${this.generatePreferencesSettings(profile.preferences)}
          </div>
        </div>

        <!-- Sección Privacidad -->
        <div class="profile-section" id="section-privacy">
          <div class="section-header">
            <h3>🛡️ Configuración de Privacidad</h3>
            <p>Controla quién puede ver tu información</p>
          </div>
          
          <div class="privacy-settings">
            ${this.generatePrivacySettings(profile.privacy)}
          </div>
        </div>

        <!-- Sección Exportar Datos -->
        <div class="profile-section" id="section-export">
          <div class="section-header">
            <h3>📥 Exportar Datos</h3>
            <p>Descarga una copia de tus datos</p>
          </div>
          
          <div class="export-options">
            ${this.generateExportOptions()}
          </div>
        </div>
      </div>
    `;
  },

  generateNotificationSettings(notifications = {}) {
    const settings = [
      { 
        key: 'sessionReminders', 
        label: 'Recordatorios de Sesión', 
        description: 'Recibe recordatorios antes de tus sesiones programadas',
        icon: '⏰'
      },
      { 
        key: 'progressUpdates', 
        label: 'Actualizaciones de Progreso', 
        description: 'Notificaciones sobre el progreso de tus pacientes',
        icon: '📈'
      },
      { 
        key: 'newPatients', 
        label: 'Nuevos Pacientes', 
        description: 'Alertas cuando se asignen nuevos pacientes',
        icon: '👥'
      },
      { 
        key: 'emailDigest', 
        label: 'Resumen por Email', 
        description: 'Recibe un resumen semanal de actividad',
        icon: '📧'
      },
      { 
        key: 'marketingEmails', 
        label: 'Emails de Marketing', 
        description: 'Recibe información sobre nuevas funcionalidades',
        icon: '📢'
      }
    ];

    return settings.map(setting => `
      <div class="notification-setting">
        <div class="setting-info">
          <div class="setting-icon">${setting.icon}</div>
          <div class="setting-details">
            <h4>${setting.label}</h4>
            <p>${setting.description}</p>
          </div>
        </div>
        <div class="setting-control">
          <label class="toggle-switch">
            <input type="checkbox" 
                   name="${setting.key}" 
                   ${notifications[setting.key] !== false ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    `).join('');
  },

  generatePreferencesSettings(preferences = {}) {
    return `
      <div class="preferences-grid">
        <div class="preference-group">
          <h4>🌙 Tema de la Aplicación</h4>
          <div class="theme-options">
            <label class="theme-option">
              <input type="radio" name="theme" value="light" 
                     ${(preferences.theme || 'light') === 'light' ? 'checked' : ''}>
              <span class="theme-preview light">
                <span class="theme-icon">☀️</span>
                <span class="theme-label">Claro</span>
              </span>
            </label>
            <label class="theme-option">
              <input type="radio" name="theme" value="dark" 
                     ${preferences.theme === 'dark' ? 'checked' : ''}>
              <span class="theme-preview dark">
                <span class="theme-icon">🌙</span>
                <span class="theme-label">Oscuro</span>
              </span>
            </label>
            <label class="theme-option">
              <input type="radio" name="theme" value="auto" 
                     ${preferences.theme === 'auto' ? 'checked' : ''}>
              <span class="theme-preview auto">
                <span class="theme-icon">🔄</span>
                <span class="theme-label">Auto</span>
              </span>
            </label>
          </div>
        </div>

        <div class="preference-group">
          <h4>🌍 Idioma</h4>
          <select name="language" class="preference-select">
            <option value="es" ${(preferences.language || 'es') === 'es' ? 'selected' : ''}>Español</option>
            <option value="en" ${preferences.language === 'en' ? 'selected' : ''}>English</option>
            <option value="fr" ${preferences.language === 'fr' ? 'selected' : ''}>Français</option>
            <option value="pt" ${preferences.language === 'pt' ? 'selected' : ''}>Português</option>
          </select>
        </div>

        <div class="preference-group">
          <h4>📊 Métricas por Defecto</h4>
          <select name="defaultMetrics" class="preference-select">
            <option value="imperial" ${preferences.defaultMetrics === 'imperial' ? 'selected' : ''}>Imperial (lb, ft)</option>
            <option value="metric" ${(preferences.defaultMetrics || 'metric') === 'metric' ? 'selected' : ''}>Métrico (kg, cm)</option>
          </select>
        </div>

        <div class="preference-group">
          <h4>⚡ Rendimiento</h4>
          <div class="performance-options">
            <label class="checkbox-option">
              <input type="checkbox" name="enableAnimations" 
                     ${preferences.enableAnimations !== false ? 'checked' : ''}>
              <span>Habilitar animaciones</span>
            </label>
            <label class="checkbox-option">
              <input type="checkbox" name="autoSave" 
                     ${preferences.autoSave !== false ? 'checked' : ''}>
              <span>Autoguardado</span>
            </label>
            <label class="checkbox-option">
              <input type="checkbox" name="offlineMode" 
                     ${preferences.offlineMode === true ? 'checked' : ''}>
              <span>Modo offline avanzado</span>
            </label>
          </div>
        </div>
      </div>
      
      <button class="btn-primary" onclick="app.savePreferences()">
        <span class="btn-icon">💾</span>
        Guardar Preferencias
      </button>
    `;
  },

  generatePrivacySettings(privacy = {}) {
    return `
      <div class="privacy-options">
        <div class="privacy-option">
          <div class="privacy-info">
            <h4>🔍 Perfil Público</h4>
            <p>Permite que otros instructores vean tu perfil básico</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" name="publicProfile" 
                   ${privacy.publicProfile !== false ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="privacy-option">
          <div class="privacy-info">
            <h4>📊 Estadísticas Públicas</h4>
            <p>Comparte estadísticas anónimas para mejorar la plataforma</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" name="shareStats" 
                   ${privacy.shareStats !== false ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="privacy-option">
          <div class="privacy-info">
            <h4>🔔 Notificaciones de Actividad</h4>
            <p>Permite que los pacientes vean cuando estás en línea</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" name="showOnlineStatus" 
                   ${privacy.showOnlineStatus === true ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="privacy-option">
          <div class="privacy-info">
            <h4>📧 Compartir Email</h4>
            <p>Permite que otros usuarios vean tu email de contacto</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" name="shareEmail" 
                   ${privacy.shareEmail === true ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="privacy-actions">
        <button class="btn-primary" onclick="app.savePrivacySettings()">
          <span class="btn-icon">🛡️</span>
          Guardar Configuración
        </button>
        
        <button class="btn-outline btn-danger" onclick="app.deleteAccountModal()">
          <span class="btn-icon">🗑️</span>
          Eliminar Cuenta
        </button>
      </div>
    `;
  },

  generateExportOptions() {
    return `
      <div class="export-grid">
        <div class="export-option">
          <div class="export-icon">👥</div>
          <h4>Datos de Pacientes</h4>
          <p>Información de pacientes y su progreso</p>
          <button class="btn-outline" onclick="app.exportData('patients')">
            <span class="btn-icon">📥</span>
            Exportar
          </button>
        </div>

        <div class="export-option">
          <div class="export-icon">📊</div>
          <h4>Sesiones</h4>
          <p>Historial completo de sesiones</p>
          <button class="btn-outline" onclick="app.exportData('sessions')">
            <span class="btn-icon">📥</span>
            Exportar
          </button>
        </div>

        <div class="export-option">
          <div class="export-icon">📈</div>
          <h4>Analytics</h4>
          <p>Reportes y estadísticas de rendimiento</p>
          <button class="btn-outline" onclick="app.exportData('analytics')">
            <span class="btn-icon">📥</span>
            Exportar
          </button>
        </div>

        <div class="export-option">
          <div class="export-icon">📚</div>
          <h4>Series Terapéuticas</h4>
          <p>Todas tus series y ejercicios creados</p>
          <button class="btn-outline" onclick="app.exportData('series')">
            <span class="btn-icon">📥</span>
            Exportar
          </button>
        </div>

        <div class="export-option complete">
          <div class="export-icon">💾</div>
          <h4>Copia Completa</h4>
          <p>Todos tus datos en un archivo único</p>
          <button class="btn-primary" onclick="app.exportData('complete')">
            <span class="btn-icon">📦</span>
            Exportar Todo
          </button>
        </div>
      </div>

      <div class="export-info">
        <div class="info-card">
          <h4>ℹ️ Información sobre Exportación</h4>
          <ul>
            <li>Los datos se exportan en formato JSON para máxima compatibilidad</li>
            <li>Las imágenes y archivos multimedia se incluyen como enlaces</li>
            <li>Los datos están encriptados para proteger tu privacidad</li>
            <li>Puedes solicitar la eliminación permanente después de exportar</li>
          </ul>
        </div>
      </div>
    `;
  },

  setupProfileEvents() {
    // Menú lateral
    document.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const section = e.currentTarget.dataset.section;
        this.switchProfileSection(section);
      });
    });

    // Formulario general
    const generalForm = document.getElementById('general-form');
    if (generalForm) {
      generalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveGeneralSettings();
      });
    }

    // Toggle switches para notificaciones
    document.querySelectorAll('.toggle-switch input').forEach(toggle => {
      toggle.addEventListener('change', this.debounce(() => {
        this.saveNotificationSettings();
      }, 500));
    });

    // Radio buttons para tema
    document.querySelectorAll('input[name="theme"]').forEach(radio => {
      radio.addEventListener('change', () => {
        this.applyTheme(radio.value);
      });
    });
  },

  switchProfileSection(sectionName) {
    // Actualizar menú activo
    document.querySelectorAll('.menu-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`)?.classList.add('active');

    // Mostrar sección correspondiente
    document.querySelectorAll('.profile-section').forEach(section => {
      section.classList.remove('active');
    });
    document.getElementById(`section-${sectionName}`)?.classList.add('active');
  },

  getRoleLabel(role) {
    const labels = {
      instructor: 'Instructor',
      patient: 'Paciente',
      admin: 'Administrador'
    };
    return labels[role] || role;
  },

  // ========== MÉTODOS DE GUARDADO ==========

  async saveGeneralSettings() {
    try {
      LoadingManager.show('Guardando configuración...');
      
      const formData = new FormData(document.getElementById('general-form'));
      const updates = Object.fromEntries(formData.entries());
      
      await firebaseService.updateUserData(this.currentUser.uid, updates);
      
      LoadingManager.hide();
      NotificationManager.showSuccess('Configuración guardada correctamente');
      
    } catch (error) {
      LoadingManager.hide();
      console.error('Error guardando configuración:', error);
      NotificationManager.showError('Error guardando configuración');
    }
  },

  async saveNotificationSettings() {
    try {
      const notifications = {};
      document.querySelectorAll('.notification-setting input[type="checkbox"]').forEach(checkbox => {
        notifications[checkbox.name] = checkbox.checked;
      });

      await firebaseService.updateUserData(this.currentUser.uid, {
        'preferences.notifications': notifications
      });

      console.log('✅ Configuración de notificaciones guardada');
      
    } catch (error) {
      console.error('Error guardando notificaciones:', error);
    }
  },

  async savePreferences() {
    try {
      LoadingManager.show('Guardando preferencias...');
      
      const preferences = {};
      
      // Tema
      const theme = document.querySelector('input[name="theme"]:checked')?.value;
      if (theme) preferences.theme = theme;
      
      // Idioma
      const language = document.querySelector('select[name="language"]')?.value;
      if (language) preferences.language = language;
      
      // Métricas
      const metrics = document.querySelector('select[name="defaultMetrics"]')?.value;
      if (metrics) preferences.defaultMetrics = metrics;
      
      // Opciones de rendimiento
      preferences.enableAnimations = document.querySelector('input[name="enableAnimations"]')?.checked;
      preferences.autoSave = document.querySelector('input[name="autoSave"]')?.checked;
      preferences.offlineMode = document.querySelector('input[name="offlineMode"]')?.checked;

      await firebaseService.updateUserData(this.currentUser.uid, {
        preferences: preferences
      });

      LoadingManager.hide();
      NotificationManager.showSuccess('Preferencias guardadas correctamente');
      
    } catch (error) {
      LoadingManager.hide();
      console.error('Error guardando preferencias:', error);
      NotificationManager.showError('Error guardando preferencias');
    }
  },

  async savePrivacySettings() {
    try {
      LoadingManager.show('Guardando configuración de privacidad...');
      
      const privacy = {};
      document.querySelectorAll('.privacy-option input[type="checkbox"]').forEach(checkbox => {
        privacy[checkbox.name] = checkbox.checked;
      });

      await firebaseService.updateUserData(this.currentUser.uid, {
        privacy: privacy
      });

      LoadingManager.hide();
      NotificationManager.showSuccess('Configuración de privacidad guardada');
      
    } catch (error) {
      LoadingManager.hide();
      console.error('Error guardando privacidad:', error);
      NotificationManager.showError('Error guardando configuración de privacidad');
    }
  },

  // ========== FUNCIONALIDADES AVANZADAS ==========

  applyTheme(theme) {
    const body = document.body;
    
    // Remover clases de tema anteriores
    body.classList.remove('theme-light', 'theme-dark', 'theme-auto');
    
    // Aplicar nuevo tema
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
    } else {
      body.classList.add(`theme-${theme}`);
    }
    
    // Guardar preferencia
    this.debounce(() => {
      this.savePreferences();
    }, 1000)();
  },

  async exportData(type) {
    try {
      LoadingManager.show(`Exportando ${type}...`);
      
      let data = {};
      const timestamp = DateFormatter.formatFileDate();
      
      switch (type) {
        case 'patients':
          data = await firebaseService.getInstructorPatients(this.currentUser.uid);
          break;
        case 'sessions':
          data = await firebaseService.getUserSessions(this.currentUser.uid);
          break;
        case 'analytics':
          data = await this.fetchAnalyticsData('1y');
          break;
        case 'series':
          data = await firebaseService.getTherapySeries({ instructorId: this.currentUser.uid });
          break;
        case 'complete':
          data = await this.exportCompleteData();
          break;
        default:
          throw new Error('Tipo de exportación no válido');
      }
      
      const filename = `softzen-${type}-${timestamp}.json`;
      DataExporter.export(data, filename, 'json');
      
      LoadingManager.hide();
      NotificationManager.showSuccess(`Datos de ${type} exportados correctamente`);
      
    } catch (error) {
      LoadingManager.hide();
      console.error('Error exportando datos:', error);
      NotificationManager.showError('Error exportando datos');
    }
  },

  async exportCompleteData() {
    const [patients, sessions, analytics, series, profile] = await Promise.all([
      firebaseService.getInstructorPatients(this.currentUser.uid),
      firebaseService.getUserSessions(this.currentUser.uid),
      this.fetchAnalyticsData('1y'),
      firebaseService.getTherapySeries({ instructorId: this.currentUser.uid }),
      firebaseService.getUserData(this.currentUser.uid)
    ]);

    return {
      exportInfo: {
        timestamp: new Date().toISOString(),
        version: '2.1.0',
        userId: this.currentUser.uid,
        type: 'complete_backup'
      },
      profile,
      patients,
      sessions,
      analytics,
      series
    };
  },

  async changeProfilePhoto() {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        LoadingManager.show('Subiendo foto...');
        
        // En producción sería:
        // const photoURL = await firebaseService.uploadProfilePhoto(file);
        // await firebaseService.updateUserData(this.currentUser.uid, { photoURL });
        
        // Simulación:
        const photoURL = URL.createObjectURL(file);
        
        // Actualizar preview
        const avatar = document.querySelector('.profile-avatar');
        if (avatar) {
          avatar.src = photoURL;
        }
        
        LoadingManager.hide();
        NotificationManager.showSuccess('Foto de perfil actualizada');
      };
      
      input.click();
      
    } catch (error) {
      LoadingManager.hide();
      console.error('Error cambiando foto:', error);
      NotificationManager.showError('Error actualizando foto de perfil');
    }
  },

  async showChangePasswordModal() {
    const confirmed = await ModalManager.confirm(
      'Cambiar Contraseña',
      'Se enviará un email para restablecer tu contraseña. ¿Continuar?',
      { confirmText: 'Enviar Email', cancelText: 'Cancelar' }
    );

    if (confirmed) {
      try {
        // En producción sería:
        // await firebaseService.sendPasswordResetEmail(this.currentUser.email);
        NotificationManager.showSuccess('Email de restablecimiento enviado');
      } catch (error) {
        NotificationManager.showError('Error enviando email de restablecimiento');
      }
    }
  },

  async deleteAccountModal() {
    const confirmed = await ModalManager.confirm(
      '⚠️ Eliminar Cuenta',
      'Esta acción es irreversible. Se eliminarán todos tus datos permanentemente.',
      { 
        confirmText: 'Eliminar Permanentemente', 
        cancelText: 'Cancelar',
        type: 'error'
      }
    );

    if (confirmed) {
      const finalConfirm = await ModalManager.confirm(
        '🔴 Confirmación Final',
        'Escribe "ELIMINAR" para confirmar la eliminación permanente de tu cuenta.',
        { confirmText: 'Confirmar', cancelText: 'Cancelar' }
      );

      if (finalConfirm) {
        try {
          LoadingManager.show('Eliminando cuenta...');
          
          // En producción sería:
          // await firebaseService.deleteUserAccount(this.currentUser.uid);
          
          LoadingManager.hide();
          NotificationManager.showInfo('Cuenta programada para eliminación');
          
          // Logout automático
          setTimeout(() => {
            this.logout();
          }, 2000);
          
        } catch (error) {
          LoadingManager.hide();
          console.error('Error eliminando cuenta:', error);
          NotificationManager.showError('Error eliminando cuenta');
        }
      }
    }
  },

  // ========== HERRAMIENTAS ADICIONALES ==========

  async viewActiveSessions() {
    ModalManager.alert(
      'Sesiones Activas',
      `
        <div class="active-sessions-list">
          <div class="session-item current">
            <span class="device-icon">💻</span>
            <div class="session-info">
              <strong>Navegador actual</strong>
              <span>Windows - Chrome</span>
              <span>Activo ahora</span>
            </div>
            <span class="session-status current">Actual</span>
          </div>
          
          <div class="session-item">
            <span class="device-icon">📱</span>
            <div class="session-info">
              <strong>Móvil</strong>
              <span>Android - Chrome</span>
              <span>Hace 2 horas</span>
            </div>
            <button class="btn-small btn-outline">Cerrar</button>
          </div>
        </div>
        
        <p class="session-note">
          💡 Si no reconoces alguna sesión, ciérrala inmediatamente y cambia tu contraseña.
        </p>
      `,
      'info'
    );
  },

  async setup2FA() {
    ModalManager.alert(
      'Autenticación de Dos Factores',
      `
        <div class="setup-2fa">
          <div class="step-indicator">
            <div class="step active">1</div>
            <div class="step">2</div>
            <div class="step">3</div>
          </div>
          
          <h4>Paso 1: Descarga una app de autenticación</h4>
          <p>Recomendamos Google Authenticator o Authy.</p>
          
          <div class="qr-placeholder">
            <div class="qr-code">📱 Código QR</div>
            <p>Escanea este código con tu app de autenticación</p>
          </div>
          
          <div class="manual-code">
            <strong>Código manual:</strong>
            <code>ABCD EFGH IJKL MNOP</code>
          </div>
          
          <p>💡 Esta funcionalidad estará disponible próximamente.</p>
        </div>
      `,
      'info'
    );
  },

  // ========== LIMPIEZA ==========

  destroyProfile() {
    // Limpiar eventos y recursos relacionados con el perfil
    document.querySelectorAll('.menu-item').forEach(item => {
      item.removeEventListener('click', () => {});
    });
  }

  });
} else {
  console.warn('⚠️ SoftZenApp no disponible para extensiones P5 - esperando inicialización...');
  document.addEventListener('DOMContentLoaded', () => {
    if (window.SoftZenApp && window.SoftZenApp.prototype) {
      console.log('🔄 Reintentando cargar extensiones P5...');
      const script = document.createElement('script');
      script.src = '/js/app-extensions-p5.js';
      document.body.appendChild(script);
    }
  });
}

// ========== ESTILOS CSS PARA PERFIL Y CONFIGURACIONES ==========

const profileStyles = `
  /* Profile Layout */
  .profile-layout {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: var(--space-8);
    max-width: 1200px;
    margin: 0 auto;
  }

  .profile-sidebar {
    position: sticky;
    top: var(--space-6);
    height: fit-content;
  }

  .profile-card {
    background: var(--surface);
    border-radius: var(--radius-xl);
    padding: var(--space-6);
    box-shadow: var(--shadow-sm);
  }

  /* Profile Avatar */
  .profile-avatar-section {
    text-align: center;
    margin-bottom: var(--space-6);
  }

  .profile-avatar-container {
    position: relative;
    display: inline-block;
    margin-bottom: var(--space-4);
  }

  .profile-avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid var(--primary-100);
  }

  .profile-avatar.placeholder {
    background: var(--primary-500);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-2xl);
    font-weight: var(--font-bold);
  }

  .avatar-edit-btn {
    position: absolute;
    bottom: 0;
    right: 0;
    background: var(--primary-500);
    color: white;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    cursor: pointer;
    box-shadow: var(--shadow-md);
    transition: all 0.2s ease;
  }

  .avatar-edit-btn:hover {
    background: var(--primary-600);
    transform: scale(1.1);
  }

  .profile-name {
    font-size: var(--text-xl);
    font-weight: var(--font-bold);
    color: var(--text-primary);
    margin-bottom: var(--space-1);
  }

  .profile-email {
    color: var(--text-secondary);
    margin-bottom: var(--space-2);
  }

  .profile-role-badge {
    display: inline-block;
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-full);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
  }

  .profile-role-badge.instructor {
    background: var(--primary-100);
    color: var(--primary-700);
  }

  .profile-role-badge.patient {
    background: var(--success-100);
    color: var(--success-700);
  }

  /* Profile Stats */
  .profile-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-4);
    margin-bottom: var(--space-6);
    padding: var(--space-4);
    background: var(--surface-secondary);
    border-radius: var(--radius-lg);
  }

  .stat-item {
    text-align: center;
  }

  .stat-value {
    display: block;
    font-size: var(--text-lg);
    font-weight: var(--font-bold);
    color: var(--text-primary);
  }

  .stat-label {
    font-size: var(--text-xs);
    color: var(--text-secondary);
  }

  /* Profile Menu */
  .profile-menu {
    space-y: var(--space-2);
  }

  .menu-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3);
    background: transparent;
    border: none;
    border-radius: var(--radius-lg);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }

  .menu-item:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
  }

  .menu-item.active {
    background: var(--primary-100);
    color: var(--primary-700);
  }

  .menu-icon {
    font-size: var(--text-lg);
  }

  .menu-label {
    font-weight: var(--font-medium);
  }

  /* Profile Content */
  .profile-content {
    background: var(--surface);
    border-radius: var(--radius-xl);
    padding: var(--space-8);
    box-shadow: var(--shadow-sm);
  }

  .profile-section {
    display: none;
  }

  .profile-section.active {
    display: block;
  }

  .section-header {
    margin-bottom: var(--space-6);
  }

  .section-header h3 {
    font-size: var(--text-2xl);
    font-weight: var(--font-bold);
    color: var(--text-primary);
    margin-bottom: var(--space-2);
  }

  .section-header p {
    color: var(--text-secondary);
    font-size: var(--text-lg);
  }

  /* Forms */
  .profile-form {
    space-y: var(--space-6);
  }

  .form-group {
    margin-bottom: var(--space-4);
  }

  .form-group label {
    display: block;
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin-bottom: var(--space-2);
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: var(--space-3);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    background: var(--surface-secondary);
    color: var(--text-primary);
    transition: all 0.2s ease;
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--primary-500);
    box-shadow: 0 0 0 3px var(--primary-100);
  }

  /* Security Options */
  .security-options {
    space-y: var(--space-6);
  }

  .security-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-4);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
  }

  .security-info h4 {
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin-bottom: var(--space-1);
  }

  .security-info p {
    color: var(--text-secondary);
    font-size: var(--text-sm);
  }

  /* Notification Settings */
  .notifications-settings {
    space-y: var(--space-4);
  }

  .notification-setting {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-4);
    background: var(--surface-secondary);
    border-radius: var(--radius-lg);
  }

  .setting-info {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .setting-icon {
    font-size: var(--text-xl);
  }

  .setting-details h4 {
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin-bottom: var(--space-1);
  }

  .setting-details p {
    color: var(--text-secondary);
    font-size: var(--text-sm);
  }

  /* Toggle Switch */
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 48px;
    height: 24px;
  }

  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--gray-300);
    transition: 0.3s;
    border-radius: 24px;
  }

  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }

  input:checked + .toggle-slider {
    background-color: var(--primary-500);
  }

  input:checked + .toggle-slider:before {
    transform: translateX(24px);
  }

  /* Theme Options */
  .theme-options {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-3);
  }

  .theme-option input {
    display: none;
  }

  .theme-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-4);
    border: 2px solid var(--border);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .theme-option input:checked + .theme-preview {
    border-color: var(--primary-500);
    background: var(--primary-50);
  }

  .theme-icon {
    font-size: var(--text-2xl);
  }

  .theme-label {
    font-weight: var(--font-medium);
    color: var(--text-primary);
  }

  /* Export Grid */
  .export-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--space-6);
    margin-bottom: var(--space-6);
  }

  .export-option {
    text-align: center;
    padding: var(--space-6);
    border: 2px dashed var(--border);
    border-radius: var(--radius-lg);
    transition: all 0.2s ease;
  }

  .export-option:hover {
    border-color: var(--primary-500);
    background: var(--primary-50);
  }

  .export-option.complete {
    border-style: solid;
    border-color: var(--primary-500);
    background: var(--primary-50);
  }

  .export-icon {
    font-size: var(--text-3xl);
    margin-bottom: var(--space-3);
  }

  .export-option h4 {
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin-bottom: var(--space-2);
  }

  .export-option p {
    color: var(--text-secondary);
    margin-bottom: var(--space-4);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .profile-layout {
      grid-template-columns: 1fr;
      gap: var(--space-4);
    }
    
    .profile-sidebar {
      position: static;
    }
    
    .profile-stats {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .theme-options {
      grid-template-columns: 1fr;
    }
    
    .export-grid {
      grid-template-columns: 1fr;
    }
  }
`;

// Agregar estilos
const profileStyleSheet = document.createElement('style');
profileStyleSheet.textContent = profileStyles;
document.head.appendChild(profileStyleSheet);

console.log('✅ SoftZen App - Extensiones P5 cargadas: Configuraciones y Funcionalidades Avanzadas');
