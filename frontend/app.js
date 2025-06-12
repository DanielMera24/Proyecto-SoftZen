class YogaTherapyApp {
    constructor() {
        this.currentUser = null;
        this.currentView = 'login';
        this.token = localStorage.getItem('yoga_therapy_token');
        this.API_BASE = '/api';
        this.currentSeries = null;
        this.currentSessionData = null;
        
        this.init();
    }

    async init() {
        this.hideLoading();
        
        // Verificar si hay token almacenado
        if (this.token) {
            try {
                await this.verifyToken();
            } catch (error) {
                console.error('Token inválido:', error);
                this.logout();
            }
        } else {
            this.showAuthScreen();
        }
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Auth tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchAuthTab(e.target.dataset.tab);
            });
        });

        // Auth forms
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Role change handler
        document.getElementById('register-role')?.addEventListener('change', (e) => {
            this.handleRoleChange(e.target.value);
        });

        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.showView(e.target.dataset.view);
            });
        });

        // CORREGIDO: Agregados event listeners faltantes
        this.setupOtherEventListeners();
    }

    setupOtherEventListeners() {
        // Logout buttons
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            this.logout();
        });

        document.getElementById('patient-logout-btn')?.addEventListener('click', () => {
            this.logout();
        });

        // Dashboard actions
        document.getElementById('refresh-dashboard-btn')?.addEventListener('click', () => {
            this.loadDashboard();
        });

        document.getElementById('add-patient-btn')?.addEventListener('click', () => {
            this.showPatientModal();
        });

        // CORREGIDO: Event listener para iniciar sesión (paciente)
        document.getElementById('start-session-btn')?.addEventListener('click', () => {
            this.startSession();
        });

        // CORREGIDO: Event listener para cambio de tipo de terapia
        document.getElementById('therapy-type')?.addEventListener('change', (e) => {
            this.loadTherapyPostures(e.target.value);
        });

        // CORREGIDO: Event listener para formulario de crear serie
        document.getElementById('create-series-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateSeries();
        });

        // CORREGIDO: Event listeners para botones de sesión
        document.getElementById('start-postures-btn')?.addEventListener('click', () => {
            this.startPostures();
        });

        document.getElementById('next-posture-btn')?.addEventListener('click', () => {
            this.nextPosture();
        });

        document.getElementById('complete-session-btn')?.addEventListener('click', () => {
            this.completeSession();
        });

        // Modal controls
        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideModal();
            });
        });

        // Pain scale updates
        document.getElementById('pain-before')?.addEventListener('input', (e) => {
            document.getElementById('pain-before-value').textContent = e.target.value;
        });

        document.getElementById('pain-after')?.addEventListener('input', (e) => {
            document.getElementById('pain-after-value').textContent = e.target.value;
        });
    }

    // Utility methods
    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    showAuthScreen() {
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('instructor-dashboard').classList.add('hidden');
        document.getElementById('patient-dashboard').classList.add('hidden');
        
        // Cargar instructores disponibles cuando se muestra la pantalla de auth
        this.loadAvailableInstructors();
    }

    switchAuthTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.add('hidden');
        });

        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}-form`).classList.remove('hidden');

        // Si es registro, cargar instructores
        if (tab === 'register') {
            this.loadAvailableInstructors();
        }
    }

    handleRoleChange(role) {
        const patientFields = document.getElementById('patient-fields');
        if (role === 'patient') {
            patientFields.classList.remove('hidden');
            this.loadAvailableInstructors();
        } else {
            patientFields.classList.add('hidden');
        }
    }

    async loadAvailableInstructors() {
        try {
            const response = await this.apiCall('/auth/instructors');
            const instructors = response.instructors || response;
            
            const select = document.getElementById('register-instructor');
            if (select) {
                select.innerHTML = '<option value="">Seleccionar instructor</option>';
                
                instructors.forEach(instructor => {
                    const option = document.createElement('option');
                    option.value = instructor.id;
                    option.textContent = `${instructor.name} - ${instructor.specialization}`;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error cargando instructores:', error);
        }
    }

    // API methods
    async apiCall(endpoint, options = {}) {
        const url = `${this.API_BASE}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }

    async verifyToken() {
        try {
            const response = await this.apiCall('/auth/verify');
            this.currentUser = response.user;
            this.showDashboard();
        } catch (error) {
            throw error;
        }
    }

    // Authentication methods
    async handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await this.apiCall('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            this.token = response.token;
            this.currentUser = response.user;
            localStorage.setItem('yoga_therapy_token', this.token);
            
            this.showSuccess(response.message);
            this.showDashboard();
        } catch (error) {
            this.showError(error.message);
        }
    }

    async handleRegister() {
        const role = document.getElementById('register-role').value;
        const formData = {
            name: document.getElementById('register-name').value,
            email: document.getElementById('register-email').value,
            password: document.getElementById('register-password').value,
            role: role
        };

        // Si es paciente, agregar campos adicionales
        if (role === 'patient') {
            const age = document.getElementById('register-age').value;
            const instructorId = document.getElementById('register-instructor').value;
            
            if (!age || !instructorId) {
                this.showError('Para pacientes, la edad e instructor son obligatorios');
                return;
            }
            
            formData.age = parseInt(age);
            formData.instructorId = parseInt(instructorId);
        }

        try {
            const response = await this.apiCall('/auth/register', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            this.token = response.token;
            this.currentUser = response.user;
            localStorage.setItem('yoga_therapy_token', this.token);
            
            this.showSuccess(response.message);
            this.showDashboard();
        } catch (error) {
            this.showError(error.message);
        }
    }

    logout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('yoga_therapy_token');
        this.showAuthScreen();
    }

    // Dashboard methods
    showDashboard() {
        document.getElementById('auth-screen').classList.add('hidden');
        
        if (this.currentUser.role === 'instructor') {
            document.getElementById('instructor-dashboard').classList.remove('hidden');
            document.getElementById('patient-dashboard').classList.add('hidden');
            document.getElementById('user-name').textContent = this.currentUser.name;
            this.showView('dashboard');
        } else {
            document.getElementById('patient-dashboard').classList.remove('hidden');
            document.getElementById('instructor-dashboard').classList.add('hidden');
            document.getElementById('patient-navbar-name').textContent = this.currentUser.name;
            this.loadPatientDashboard();
        }
    }

    // Utility methods for notifications
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Remover notificaciones existentes
        document.querySelectorAll('.notification').forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#667eea'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            max-width: 400px;
            word-wrap: break-word;
            font-weight: 500;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    showView(viewName) {
        if (this.currentUser.role !== 'instructor') return;

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelectorAll('.view').forEach(view => {
            view.classList.add('hidden');
        });

        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
        document.getElementById(`${viewName}-view`).classList.remove('hidden');

        this.currentView = viewName;

        // Load data for specific views
        switch (viewName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'patients':
                this.loadPatients();
                break;
            case 'series':
                this.loadSeries();
                break;
            case 'create-series':
                this.loadTherapyTypes();
                break;
        }
    }

    async loadDashboard() {
        try {
            const response = await this.apiCall('/dashboard/instructor');
            this.renderDashboard(response);
        } catch (error) {
            this.showError('Error cargando dashboard: ' + error.message);
        }
    }

    renderDashboard(data) {
        const container = document.getElementById('dashboard-content');
        
        container.innerHTML = `
            <div class="dashboard-grid">
                <div class="metric-card">
                    <div class="metric-icon">👥</div>
                    <div class="metric-content">
                        <h3>Total Pacientes</h3>
                        <div class="metric-value">${data.overview.total_patients}</div>
                        <div class="metric-subtitle">${data.overview.active_patients} activos</div>
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-icon">🧘‍♀️</div>
                    <div class="metric-content">
                        <h3>Series Creadas</h3>
                        <div class="metric-value">${data.overview.total_series}</div>
                        <div class="metric-subtitle">Series terapéuticas</div>
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-icon">📊</div>
                    <div class="metric-content">
                        <h3>Sesiones Totales</h3>
                        <div class="metric-value">${data.overview.total_sessions}</div>
                        <div class="metric-subtitle">Completadas</div>
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-icon">📈</div>
                    <div class="metric-content">
                        <h3>Mejora Promedio</h3>
                        <div class="metric-value">${data.overview.avg_pain_improvement || 0}</div>
                        <div class="metric-subtitle">Puntos de dolor</div>
                    </div>
                </div>
            </div>

            <div class="dashboard-charts">
                <div class="chart-container">
                    <h3>📊 Progreso de Pacientes</h3>
                    <div class="patients-progress">
                        ${data.patients_progress.map(patient => `
                            <div class="patient-progress-item">
                                <div class="patient-info">
                                    <span class="patient-name">${patient.name}</span>
                                    <span class="patient-sessions">${patient.current_session}/${patient.total_sessions} sesiones</span>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${patient.progress_percentage}%"></div>
                                </div>
                                <div class="progress-percentage">${patient.progress_percentage}%</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="chart-container">
                    <h3>🎯 Tipos de Terapia</h3>
                    <div class="therapy-distribution">
                        ${data.therapy_types.map(therapy => `
                            <div class="therapy-item">
                                <div class="therapy-label">${therapy.therapy_type_name}</div>
                                <div class="therapy-bar">
                                    <div class="therapy-fill" style="width: ${Math.max(therapy.patients_count * 10, 5)}%"></div>
                                </div>
                                <div class="therapy-count">${therapy.patients_count}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="chart-container">
                <h3>📈 Actividad Reciente</h3>
                <div class="recent-activity">
                    ${data.recent_activity.map(activity => `
                        <div class="session-item">
                            <div class="session-header-info">
                                <h4>${activity.patient_name}</h4>
                                <span class="session-date">${activity.date_formatted}</span>
                            </div>
                            <div class="pain-indicators">
                                <span class="pain-indicator pain-before">Dolor inicial: ${activity.pain_before}</span>
                                <span class="pain-indicator pain-after">Dolor final: ${activity.pain_after}</span>
                                <span class="pain-indicator">Mejora: ${activity.pain_improvement} puntos</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Patient methods
    async loadPatients() {
        try {
            const response = await this.apiCall('/patients');
            this.renderPatients(response);
        } catch (error) {
            this.showError('Error cargando pacientes: ' + error.message);
        }
    }

    renderPatients(patients) {
        const container = document.getElementById('patients-list');
        
        if (patients.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No hay pacientes registrados</h3>
                    <p>Haz clic en "Agregar Paciente" para comenzar</p>
                </div>
            `;
            return;
        }

        container.innerHTML = patients.map(patient => `
            <div class="card patient-card">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">${patient.name}</h3>
                        <p>${patient.email}</p>
                        <p>Edad: ${patient.age} años</p>
                    </div>
                </div>
                
                <div class="series-status ${patient.has_series ? 'assigned' : 'unassigned'}">
                    ${patient.has_series ? `
                        <div class="series-info">
                            <strong>Serie: ${patient.series_name}</strong>
                            <div class="progress-container">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${patient.progress_percentage}%"></div>
                                </div>
                                <span class="progress-text">${patient.progress_percentage}%</span>
                            </div>
                            <p>Sesiones: ${patient.current_session}/${patient.total_sessions}</p>
                        </div>
                    ` : `
                        <p>⚠️ Sin serie asignada</p>
                    `}
                </div>

                <div class="card-actions">
                    <button class="btn-small btn-primary" onclick="app.viewPatientDetails(${patient.id})">
                        Ver Detalles
                    </button>
                    <button class="btn-small btn-secondary" onclick="app.viewPatientSessions(${patient.id})">
                        Historial
                    </button>
                    ${!patient.has_series ? `
                        <button class="btn-small btn-primary" onclick="app.showAssignSeriesModal(${patient.id})">
                            Asignar Serie
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    showPatientModal(patient = null) {
        const modal = document.getElementById('patient-modal');
        const title = document.getElementById('patient-modal-title');
        const form = document.getElementById('patient-form');
        
        if (patient) {
            title.textContent = 'Editar Paciente';
            document.getElementById('patient-name').value = patient.name;
            document.getElementById('patient-email').value = patient.email;
            document.getElementById('patient-age').value = patient.age;
            document.getElementById('patient-condition').value = patient.condition || '';
        } else {
            title.textContent = 'Agregar Paciente';
            form.reset();
        }

        form.onsubmit = (e) => {
            e.preventDefault();
            this.handlePatientForm(patient?.id);
        };

        modal.classList.remove('hidden');
    }

    async handlePatientForm(patientId = null) {
        const formData = {
            name: document.getElementById('patient-name').value,
            email: document.getElementById('patient-email').value,
            age: parseInt(document.getElementById('patient-age').value),
            condition: document.getElementById('patient-condition').value
        };

        try {
            const endpoint = patientId ? `/patients/${patientId}` : '/patients';
            const method = patientId ? 'PUT' : 'POST';
            
            const response = await this.apiCall(endpoint, {
                method,
                body: JSON.stringify(formData)
            });

            this.showSuccess(response.message);
            this.hideModal();
            this.loadPatients();
        } catch (error) {
            this.showError(error.message);
        }
    }

    async viewPatientDetails(patientId) {
        try {
            const response = await this.apiCall(`/patients/${patientId}`);
            this.showPatientDetailsModal(response);
        } catch (error) {
            this.showError('Error cargando detalles del paciente: ' + error.message);
        }
    }

    showPatientDetailsModal(data) {
        const modal = document.getElementById('patient-details-modal');
        const content = document.getElementById('patient-details-content');
        
        content.innerHTML = `
            <div class="patient-details-header">
                <h3>${data.patient.name}</h3>
                <div class="patient-basic-info">
                    <p><strong>Email:</strong> ${data.patient.user_email || data.patient.email}</p>
                    <p><strong>Edad:</strong> ${data.patient.age} años</p>
                    <p><strong>Condición:</strong> ${data.patient.condition || 'No especificada'}</p>
                    <p><strong>Contacto de emergencia:</strong> ${data.patient.emergency_contact || 'No registrado'}</p>
                </div>
            </div>

            ${data.patient.series_name ? `
                <div class="patient-series-details">
                    <h4>📋 Serie Actual</h4>
                    <div class="current-series">
                        <div class="series-summary">
                            <p><strong>Serie:</strong> ${data.patient.series_name}</p>
                            <p><strong>Tipo:</strong> ${data.patient.therapy_type}</p>
                            <p><strong>Progreso:</strong> ${data.patient.current_session}/${data.patient.total_sessions} sesiones</p>
                        </div>
                        <div class="progress-circle">
                            ${Math.round((data.patient.current_session / data.patient.total_sessions) * 100)}%
                        </div>
                    </div>
                </div>
            ` : `
                <div class="no-series">
                    <h4>⚠️ Sin serie asignada</h4>
                    <p>Este paciente no tiene una serie terapéutica asignada.</p>
                </div>
            `}

            <div class="patient-stats">
                <h4>📊 Estadísticas</h4>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">Sesiones Totales</span>
                        <span class="stat-value">${data.stats.total_sessions}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Dolor Promedio Inicial</span>
                        <span class="stat-value">${data.stats.avg_pain_before}/10</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Dolor Promedio Final</span>
                        <span class="stat-value">${data.stats.avg_pain_after}/10</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Mejora Promedio</span>
                        <span class="stat-value ${data.stats.avg_improvement > 0 ? 'positive' : ''}">${data.stats.avg_improvement}</span>
                    </div>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    // Series methods
    async loadSeries() {
        try {
            const response = await this.apiCall('/series');
            this.renderSeries(response.data || response);
        } catch (error) {
            this.showError('Error cargando series: ' + error.message);
        }
    }

    renderSeries(series) {
        const container = document.getElementById('series-list');
        
        if (series.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No hay series creadas</h3>
                    <p>Haz clic en "Crear Nueva Serie" para comenzar</p>
                </div>
            `;
            return;
        }

        container.innerHTML = series.map(s => `
            <div class="card">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">${s.name}</h3>
                        <p><strong>Tipo:</strong> ${s.therapy_type_name}</p>
                        <p><strong>Sesiones:</strong> ${s.total_sessions}</p>
                        <p><strong>Posturas:</strong> ${s.postures.length}</p>
                        <p><strong>Duración estimada:</strong> ${s.estimated_duration} min</p>
                    </div>
                </div>
                
                <div class="series-info">
                    <p><strong>Pacientes asignados:</strong> ${s.assigned_patients_count}</p>
                    <p><strong>Sesiones completadas:</strong> ${s.total_sessions_count}</p>
                    ${s.avg_pain_improvement > 0 ? `
                        <p><strong>Mejora promedio:</strong> ${s.avg_pain_improvement} puntos</p>
                    ` : ''}
                </div>

                <div class="card-actions">
                    <button class="btn-small btn-primary" onclick="app.viewSeriesDetails(${s.id})">
                        Ver Detalles
                    </button>
                    <button class="btn-small btn-secondary" onclick="app.duplicateSeries(${s.id})">
                        Duplicar
                    </button>
                    ${s.assigned_patients_count === 0 ? `
                        <button class="btn-small btn-secondary" onclick="app.deleteSeries(${s.id})">
                            Eliminar
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    async loadTherapyTypes() {
        try {
            const response = await this.apiCall('/series/therapy-types');
            this.renderTherapyTypes(response.data || response);
        } catch (error) {
            this.showError('Error cargando tipos de terapia: ' + error.message);
        }
    }

    renderTherapyTypes(types) {
        const select = document.getElementById('therapy-type');
        select.innerHTML = '<option value="">Seleccionar tipo de terapia</option>';
        
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type.id;
            option.textContent = type.name;
            select.appendChild(option);
        });
    }

    async loadTherapyPostures(therapyType) {
        if (!therapyType) {
            document.getElementById('postures-section').classList.add('hidden');
            return;
        }

        try {
            const response = await this.apiCall('/series/therapy-types');
            const types = response.data || response;
            const selectedType = types.find(t => t.id === therapyType);
            
            if (selectedType) {
                this.renderTherapyPostures(selectedType.postures);
                document.getElementById('postures-section').classList.remove('hidden');
            }
        } catch (error) {
            this.showError('Error cargando posturas: ' + error.message);
        }
    }

    renderTherapyPostures(postures) {
        const container = document.getElementById('available-postures');
        
        container.innerHTML = postures.map(posture => `
            <div class="posture-card" data-posture-id="${posture.id}">
                <div class="contenedor-img">
                    <img src="${posture.image}" alt="${posture.name}" onerror="this.src='https://via.placeholder.com/300x200?text=Postura'">
                </div>
                <div class="card-content">
                    <h4>${posture.name}</h4>
                    <p class="sanskrit">${posture.sanskrit}</p>
                    <p class="posture-benefits">${posture.benefits.substring(0, 100)}...</p>
                    <p class="posture-duration">Duración sugerida: ${posture.defaultDuration} min</p>
                </div>
            </div>
        `).join('');

        // Add click listeners to posture cards
        container.querySelectorAll('.posture-card').forEach(card => {
            card.addEventListener('click', () => {
                this.togglePostureSelection(card, postures);
            });
        });
    }

    togglePostureSelection(card, allPostures) {
        const postureId = parseInt(card.dataset.postureId);
        const posture = allPostures.find(p => p.id === postureId);
        
        if (card.classList.contains('selected')) {
            card.classList.remove('selected');
            this.removeSelectedPosture(postureId);
        } else {
            card.classList.add('selected');
            this.addSelectedPosture(posture);
        }
    }

    addSelectedPosture(posture) {
        const container = document.getElementById('selected-postures');
        const existingPosture = container.querySelector(`[data-posture-id="${posture.id}"]`);
        
        if (existingPosture) return;

        const postureElement = document.createElement('div');
        postureElement.className = 'selected-posture';
        postureElement.dataset.postureId = posture.id;
        postureElement.innerHTML = `
            <div>
                <strong>${posture.name}</strong>
                <p>${posture.sanskrit}</p>
            </div>
            <div class="posture-duration">
                <label>Duración (min):</label>
                <input type="number" min="1" max="60" value="${posture.defaultDuration}" class="duration-input">
                <button type="button" class="btn-small btn-secondary" onclick="this.parentElement.parentElement.remove(); app.updatePostureSelection()">✕</button>
            </div>
        `;

        container.appendChild(postureElement);
        this.updatePostureSelection();
    }

    removeSelectedPosture(postureId) {
        const container = document.getElementById('selected-postures');
        const postureElement = container.querySelector(`[data-posture-id="${postureId}"]`);
        if (postureElement) {
            postureElement.remove();
            this.updatePostureSelection();
        }
    }

    updatePostureSelection() {
        const container = document.getElementById('selected-postures');
        const selectedPostures = container.querySelectorAll('.selected-posture');
        
        if (selectedPostures.length === 0) {
            container.innerHTML = '<p>Selecciona posturas de la lista anterior</p>';
        }
    }

    async handleCreateSeries() {
        const formData = {
            name: document.getElementById('series-name').value,
            therapyType: document.getElementById('therapy-type').value,
            totalSessions: parseInt(document.getElementById('total-sessions').value),
            postures: this.getSelectedPostures()
        };

        if (formData.postures.length === 0) {
            this.showError('Debe seleccionar al menos una postura');
            return;
        }

        try {
            const response = await this.apiCall('/series', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            this.showSuccess(response.message);
            this.showView('series');
            document.getElementById('create-series-form').reset();
            // CORREGIDO: Limpiar sección de posturas
            document.getElementById('postures-section').classList.add('hidden');
            document.getElementById('selected-postures').innerHTML = '<p>Selecciona posturas de la lista anterior</p>';
        } catch (error) {
            this.showError(error.message);
        }
    }

    getSelectedPostures() {
        const selectedPostures = [];
        const container = document.getElementById('selected-postures');
        
        container.querySelectorAll('.selected-posture').forEach(element => {
            const postureId = parseInt(element.dataset.postureId);
            const duration = parseInt(element.querySelector('.duration-input').value);
            const name = element.querySelector('strong').textContent;
            
            selectedPostures.push({
                id: postureId,
                name: name,
                duration: duration
            });
        });

        return selectedPostures;
    }

    // Patient Dashboard
    async loadPatientDashboard() {
        try {
            const response = await this.apiCall('/dashboard/patient');
            this.renderPatientDashboard(response);
        } catch (error) {
            this.showError('Error cargando dashboard: ' + error.message);
        }
    }

    renderPatientDashboard(data) {
        const seriesDetails = document.getElementById('series-details');
        const startButton = document.getElementById('start-session-btn');
        
        if (!data.series) {
            seriesDetails.innerHTML = `
                <div class="no-series">
                    <h3>📋 No hay serie asignada</h3>
                    <p>Tu instructor aún no te ha asignado una serie terapéutica. Contacta con tu instructor para más información.</p>
                    <div class="instructor-info">
                        <p><strong>Tu instructor:</strong> ${data.patient_info.instructor_name}</p>
                        <p><strong>Email:</strong> ${data.patient_info.instructor_email}</p>
                    </div>
                </div>
            `;
            startButton.style.display = 'none';
            return;
        }

        const series = data.series;
        this.currentSeries = series;

        seriesDetails.innerHTML = `
            <div class="series-card">
                <h3>${series.name}</h3>
                <p class="series-description">${series.description}</p>
                
                <div class="series-progress">
                    <div class="progress-info">
                        <p><strong>Progreso:</strong> ${series.current_session}/${series.total_sessions} sesiones</p>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${series.progress_percentage}%"></div>
                        </div>
                        <p class="progress-text">${series.progress_percentage}% completado</p>
                    </div>
                </div>

                <div class="series-info">
                    <p><strong>Tipo de terapia:</strong> ${series.therapy_type_name}</p>
                    <p><strong>Posturas en la serie:</strong> ${series.postures.length}</p>
                    <p><strong>Duración estimada:</strong> ${series.estimated_duration} minutos</p>
                    <p><strong>Sesiones completadas:</strong> ${data.patient_info.total_sessions_completed}</p>
                </div>

                ${data.stats ? `
                    <div class="patient-stats">
                        <h4>📊 Tus Estadísticas</h4>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <span class="stat-label">Sesiones Realizadas</span>
                                <span class="stat-value">${data.stats.total_completed}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Mejora Promedio</span>
                                <span class="stat-value ${data.stats.avg_improvement > 0 ? 'positive' : ''}">${data.stats.avg_improvement}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Calificación Promedio</span>
                                <span class="stat-value">${data.stats.avg_rating}/5</span>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        // Show/hide start button based on completion status
        if (series.is_completed) {
            startButton.textContent = '🎉 Serie Completada';
            startButton.disabled = true;
            startButton.classList.add('btn-secondary');
            startButton.classList.remove('btn-primary');
        } else {
            startButton.textContent = `▶️ Iniciar Sesión ${series.next_session || series.current_session + 1}`;
            startButton.disabled = false;
            startButton.classList.add('btn-primary');
            startButton.classList.remove('btn-secondary');
            startButton.style.display = 'block';
        }
    }

    // Session methods
    startSession() {
        if (!this.currentSeries || this.currentSeries.is_completed) {
            this.showError('No hay sesión disponible para iniciar');
            return;
        }

        this.currentSessionData = {
            postures: [...this.currentSeries.postures],
            currentPostureIndex: 0,
            painBefore: 0,
            painAfter: 0,
            startTime: new Date(),
            posturesCompleted: 0
        };

        document.getElementById('patient-home').classList.add('hidden');
        document.getElementById('session-view').classList.remove('hidden');
        
        // Show pre-session stage
        this.showSessionStage('pre-session');
    }

    showSessionStage(stage) {
        document.querySelectorAll('.session-stage').forEach(el => {
            el.classList.add('hidden');
        });
        
        document.getElementById(stage).classList.remove('hidden');
    }

    startPostures() {
        const painBefore = document.getElementById('pain-before').value;
        this.currentSessionData.painBefore = parseInt(painBefore);
        
        this.showSessionStage('posture-display');
        this.showCurrentPosture();
    }

    showCurrentPosture() {
        const posture = this.currentSessionData.postures[this.currentSessionData.currentPostureIndex];
        const currentIndex = this.currentSessionData.currentPostureIndex + 1;
        const totalPostures = this.currentSessionData.postures.length;

        // Update progress
        document.getElementById('current-posture').textContent = currentIndex;
        document.getElementById('total-postures').textContent = totalPostures;

        // Update posture info
        document.getElementById('posture-name').textContent = posture.name;
        document.getElementById('posture-sanskrit').textContent = posture.sanskrit || '';
        document.getElementById('posture-instructions').textContent = posture.instructions || '';
        document.getElementById('posture-benefits').textContent = posture.benefits || '';
        document.getElementById('posture-modifications').textContent = posture.modifications || '';

        // Update video
        if (posture.videoUrl) {
            const videoId = this.extractYouTubeVideoId(posture.videoUrl);
            if (videoId) {
                document.getElementById('posture-video').src = `https://www.youtube.com/embed/${videoId}`;
            }
        }

        // Start timer
        this.startPostureTimer(posture.duration * 60); // Convert minutes to seconds
    }

    extractYouTubeVideoId(url) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    startPostureTimer(durationSeconds) {
        this.timerInterval = setInterval(() => {
            if (durationSeconds <= 0) {
                clearInterval(this.timerInterval);
                this.nextPosture();
                return;
            }

            const minutes = Math.floor(durationSeconds / 60);
            const seconds = durationSeconds % 60;
            
            document.getElementById('timer-minutes').textContent = minutes.toString().padStart(2, '0');
            document.getElementById('timer-seconds').textContent = seconds.toString().padStart(2, '0');
            
            durationSeconds--;
        }, 1000);
    }

    nextPosture() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.currentSessionData.posturesCompleted++;
        this.currentSessionData.currentPostureIndex++;

        if (this.currentSessionData.currentPostureIndex >= this.currentSessionData.postures.length) {
            this.showSessionStage('post-session');
        } else {
            this.showCurrentPosture();
        }
    }

    async completeSession() {
        const painAfter = document.getElementById('pain-after').value;
        const comments = document.getElementById('session-comments').value;

        if (!comments || comments.trim().length < 10) {
            this.showError('Los comentarios deben tener al menos 10 caracteres');
            return;
        }

        const sessionData = {
            painBefore: this.currentSessionData.painBefore,
            painAfter: parseInt(painAfter),
            comments: comments.trim(),
            durationMinutes: Math.round((new Date() - this.currentSessionData.startTime) / 60000),
            posturesCompleted: this.currentSessionData.posturesCompleted,
            posturesSkipped: this.currentSessionData.postures.length - this.currentSessionData.posturesCompleted
        };

        try {
            const response = await this.apiCall('/sessions', {
                method: 'POST',
                body: JSON.stringify(sessionData)
            });

            this.showSuccess(response.message);
            
            // Return to patient home and refresh dashboard
            document.getElementById('session-view').classList.add('hidden');
            document.getElementById('patient-home').classList.remove('hidden');
            this.loadPatientDashboard();
            
        } catch (error) {
            this.showError('Error completando sesión: ' + error.message);
        }
    }

    // Modal methods
    hideModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    // Additional methods for missing functionality
    async showAssignSeriesModal(patientId) {
        try {
            const [seriesResponse] = await Promise.all([
                this.apiCall('/series')
            ]);

            const modal = document.getElementById('assign-series-modal');
            const select = document.getElementById('series-select');
            
            const series = seriesResponse.data || seriesResponse;
            select.innerHTML = '<option value="">Seleccionar serie</option>';
            
            series.forEach(s => {
                const option = document.createElement('option');
                option.value = s.id;
                option.textContent = `${s.name} (${s.therapy_type_name})`;
                select.appendChild(option);
            });

            document.getElementById('confirm-assign-btn').onclick = async () => {
                const seriesId = select.value;
                if (!seriesId) {
                    this.showError('Debe seleccionar una serie');
                    return;
                }

                try {
                    const response = await this.apiCall(`/patients/${patientId}/assign-series`, {
                        method: 'POST',
                        body: JSON.stringify({ seriesId: parseInt(seriesId) })
                    });

                    this.showSuccess(response.message);
                    this.hideModal();
                    this.loadPatients();
                } catch (error) {
                    this.showError(error.message);
                }
            };

            modal.classList.remove('hidden');
        } catch (error) {
            this.showError('Error cargando series: ' + error.message);
        }
    }

    async viewPatientSessions(patientId) {
        try {
            const response = await this.apiCall(`/sessions/patient/${patientId}`);
            this.showPatientSessionsModal(response);
        } catch (error) {
            this.showError('Error cargando sesiones: ' + error.message);
        }
    }

    showPatientSessionsModal(data) {
        const modal = document.getElementById('patient-sessions-modal');
        const content = document.getElementById('sessions-list');
        
        if (data.sessions.length === 0) {
            content.innerHTML = '<p>No hay sesiones registradas para este paciente.</p>';
        } else {
            content.innerHTML = `
                <div class="patient-stats">
                    <h4>📊 Resumen</h4>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-label">Total Sesiones</span>
                            <span class="stat-value">${data.stats.total_sessions}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Mejora Promedio</span>
                            <span class="stat-value ${data.stats.avg_improvement > 0 ? 'positive' : ''}">${data.stats.avg_improvement}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Duración Promedio</span>
                            <span class="stat-value">${data.stats.avg_duration} min</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Calificación Promedio</span>
                            <span class="stat-value">${data.stats.avg_rating}/5</span>
                        </div>
                    </div>
                </div>

                <h4>📋 Historial de Sesiones</h4>
                ${data.sessions.map(session => `
                    <div class="session-item">
                        <div class="session-header-info">
                            <h5>Sesión ${session.session_number}</h5>
                            <span class="session-date">${new Date(session.completed_at).toLocaleDateString('es-ES')}</span>
                        </div>
                        <div class="pain-indicators">
                            <span class="pain-indicator pain-before">Dolor inicial: ${session.pain_before}</span>
                            <span class="pain-indicator pain-after">Dolor final: ${session.pain_after}</span>
                            <span class="pain-indicator">Mejora: ${session.pain_before - session.pain_after} puntos</span>
                            ${session.rating ? `<span class="pain-indicator">Calificación: ${session.rating}/5</span>` : ''}
                        </div>
                        <p><strong>Comentarios:</strong> ${session.comments}</p>
                        ${session.duration_minutes ? `<p><strong>Duración:</strong> ${session.duration_minutes} minutos</p>` : ''}
                    </div>
                `).join('')}
            `;
        }

        modal.classList.remove('hidden');
    }

    async duplicateSeries(seriesId) {
        try {
            const response = await this.apiCall(`/series/${seriesId}/duplicate`, {
                method: 'POST'
            });

            this.showSuccess(response.message);
            this.loadSeries();
        } catch (error) {
            this.showError('Error duplicando serie: ' + error.message);
        }
    }

    async deleteSeries(seriesId) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta serie? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const response = await this.apiCall(`/series/${seriesId}`, {
                method: 'DELETE'
            });

            this.showSuccess(response.message);
            this.loadSeries();
        } catch (error) {
            this.showError('Error eliminando serie: ' + error.message);
        }
    }

    // CORREGIDO: Método faltante
    async viewSeriesDetails(seriesId) {
        try {
            const response = await this.apiCall(`/series/${seriesId}`);
            this.showSeriesDetailsModal(response.data);
        } catch (error) {
            this.showError('Error cargando detalles de la serie: ' + error.message);
        }
    }

    showSeriesDetailsModal(series) {
        // CORREGIDO: Implementar modal de detalles de serie si no existe
        this.showNotification(`Serie: ${series.name} - ${series.postures.length} posturas - ${series.total_sessions} sesiones`, 'info');
    }
}

// CSS for notifications
const notificationCSS = `
@keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}

.empty-state {
    text-align: center;
    padding: 3rem;
    background: white;
    border-radius: 16px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
}

.empty-state h3 {
    color: #333;
    margin-bottom: 1rem;
}

.empty-state p {
    color: #666;
}
`;

// Add CSS to document
const style = document.createElement('style');
style.textContent = notificationCSS;
document.head.appendChild(style);

// Inicializar app cuando DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new YogaTherapyApp();
});

// Make app globally available
window.app = null;