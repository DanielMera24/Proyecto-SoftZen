class TherapeuticYogaApp {
    constructor() {
        this.currentUser = null;
        this.token = localStorage.getItem('token');
        this.therapyTypes = [];
        this.patients = [];
        this.series = [];
        this.currentPatient = null;
        this.currentSeries = null;
        this.currentSessionData = {};
        this.sessionTimer = null;
        this.currentPostureIndex = 0;
        
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupEventListeners();
        this.hideLoading();
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    async checkAuth() {
        if (this.token) {
            try {
                // Verify token by making a request
                const response = await this.fetchWithAuth('/api/therapy-types');
                if (response.ok) {
                    const userStr = localStorage.getItem('user');
                    if (userStr) {
                        this.currentUser = JSON.parse(userStr);
                        this.showDashboard();
                        return;
                    }
                }
            } catch (error) {
                console.error('Auth check failed:', error);
            }
        }
        this.showAuth();
    }

    showAuth() {
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('instructor-dashboard').classList.add('hidden');
        document.getElementById('patient-dashboard').classList.add('hidden');
    }

    showDashboard() {
        document.getElementById('auth-screen').classList.add('hidden');
        
        if (this.currentUser.role === 'instructor') {
            document.getElementById('instructor-dashboard').classList.remove('hidden');
            document.getElementById('user-name').textContent = this.currentUser.name;
            this.loadInstructorData();
        } else {
            document.getElementById('patient-dashboard').classList.remove('hidden');
            document.getElementById('patient-name').textContent = this.currentUser.name;
            this.loadPatientData();
        }
    }

    setupEventListeners() {
        // Auth tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const tab = e.target.dataset.tab;
                document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
                document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
            });
        });

        // Auth forms
        document.getElementById('login-form').addEventListener('submit', this.handleLogin.bind(this));
        document.getElementById('register-form').addEventListener('submit', this.handleRegister.bind(this));

        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const view = e.target.dataset.view;
                this.showView(view);
            });
        });

        // Logout
        document.getElementById('logout-btn')?.addEventListener('click', this.logout.bind(this));
        document.getElementById('patient-logout-btn')?.addEventListener('click', this.logout.bind(this));

        // Patient management
        document.getElementById('add-patient-btn')?.addEventListener('click', () => {
            this.showPatientModal();
        });

        document.getElementById('patient-form').addEventListener('submit', this.handlePatientForm.bind(this));

        // Series creation
        document.getElementById('create-series-form').addEventListener('submit', this.handleCreateSeries.bind(this));
        document.getElementById('therapy-type').addEventListener('change', this.loadPostures.bind(this));

        // Session management
        document.getElementById('start-session-btn')?.addEventListener('click', this.startSession.bind(this));
        document.getElementById('start-postures-btn')?.addEventListener('click', this.startPostures.bind(this));
        document.getElementById('next-posture-btn')?.addEventListener('click', this.nextPosture.bind(this));
        document.getElementById('complete-session-btn')?.addEventListener('click', this.completeSession.bind(this));

        // Pain scale updates
        document.getElementById('pain-before')?.addEventListener('input', (e) => {
            document.getElementById('pain-before-value').textContent = e.target.value;
        });
        document.getElementById('pain-after')?.addEventListener('input', (e) => {
            document.getElementById('pain-after-value').textContent = e.target.value;
        });

        // Modal controls
        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', this.closeModals.bind(this));
        });

        document.getElementById('confirm-assign-btn')?.addEventListener('click', this.confirmAssignSeries.bind(this));
    }

    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email') || document.getElementById('login-email').value;
        const password = formData.get('password') || document.getElementById('login-password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (response.ok) {
                this.token = data.token;
                this.currentUser = data.user;
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.currentUser));
                this.showDashboard();
            } else {
                alert(data.error || 'Error al iniciar sesión');
            }
        } catch (error) {
            alert('Error de conexión');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const role = document.getElementById('register-role').value;

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role })
            });

            const data = await response.json();
            if (response.ok) {
                // NO guardar token ni usuario
                // NO ir al dashboard
                
                // Mostrar mensaje de éxito
                alert('Registro exitoso. Por favor, inicia sesión con tus credenciales.');
                
                // Limpiar el formulario de registro
                document.getElementById('register-form').reset();
                
                // Cambiar a la pestaña de login
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelector('.tab-btn[data-tab="login"]').classList.add('active');
                
                // Mostrar formulario de login y ocultar registro
                document.getElementById('login-form').classList.remove('hidden');
                document.getElementById('register-form').classList.add('hidden');
                
                // Opcional: pre-llenar el email en el formulario de login
                document.getElementById('login-email').value = email;
                
            } else {
                alert(data.error || 'Error al registrarse');
            }
        } catch (error) {
            alert('Error de conexión');
        }
    }

    logout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.showAuth();
    }

    async fetchWithAuth(url, options = {}) {
        return fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        });
    }

    showView(view) {
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        document.getElementById(`${view}-view`).classList.remove('hidden');
        
        if (view === 'patients') {
            this.loadPatients();
        } else if (view === 'series') {
            this.loadSeries();
        } else if (view === 'create-series') {
            this.loadTherapyTypes();
        }
    }

    async loadInstructorData() {
        await this.loadTherapyTypes();
        await this.loadPatients();
        await this.loadSeries();
    }

    async loadTherapyTypes() {
        try {
            const response = await this.fetchWithAuth('/api/therapy-types');
            if (response.ok) {
                this.therapyTypes = await response.json();
            }
        } catch (error) {
            console.error('Error loading therapy types:', error);
        }
    }

    async loadPatients() {
        try {
            const response = await this.fetchWithAuth('/api/patients');
            if (response.ok) {
                this.patients = await response.json();
                this.renderPatients();
            }
        } catch (error) {
            console.error('Error loading patients:', error);
        }
    }

    async loadSeries() {
        try {
            const response = await this.fetchWithAuth('/api/therapy-series');
            if (response.ok) {
                this.series = await response.json();
                this.renderSeries();
            }
        } catch (error) {
            console.error('Error loading series:', error);
        }
    }

    renderPatients() {
        const container = document.getElementById('patients-list');
        container.innerHTML = '';

        this.patients.forEach(patient => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-header">
                    <div>
                        <div class="card-title"> <!--${patient.name} --!>Información Paciente</div>
                        <p>${patient.email}</p>
                        <p>Edad: ${patient.age} años</p>
                        ${patient.condition ? `<p><strong>Condición:</strong> ${patient.condition}</p>` : ''}
                    </div>
                </div>
                ${patient.assignedSeries ? `
                    <div style="background: #e8f5e8; padding: 0.5rem; border-radius: 6px; margin: 1rem 0;">
                        <strong>Serie asignada:</strong> ${patient.assignedSeries.name}
                    </div>
                ` : ''}
                <div class="card-actions">
                    <button class="btn-primary btn-small" onclick="app.editPatient(${patient.id})">Editar</button>
                    <button class="btn-secondary btn-small" onclick="app.assignSeries(${patient.id})">Asignar Serie</button>
                    <button class="btn-secondary btn-small" onclick="app.viewPatientSessions(${patient.id})">Ver Sesiones</button>
                    <button class="btn-secondary btn-small" onclick="app.deletePatient(${patient.id})">Eliminar</button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    renderSeries() {
        const container = document.getElementById('series-list');
        container.innerHTML = '';

        this.series.forEach(series => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-header">
                    <div>
                        <div class="card-title">${series.name}</div>
                        <p><strong>Tipo:</strong> ${series.therapyType.replace('_', ' ')}</p>
                        <p><strong>Posturas:</strong> ${series.postures.length}</p>
                        <p><strong>Sesiones totales:</strong> ${series.totalSessions}</p>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    showPatientModal(patient = null) {
        this.currentPatient = patient;
        const modal = document.getElementById('patient-modal');
        const form = document.getElementById('patient-form');
        const title = document.getElementById('patient-modal-title');

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

        modal.classList.remove('hidden');
    }

    async handlePatientForm(e) {
        e.preventDefault();
        const name = document.getElementById('patient-name').value;
        const email = document.getElementById('patient-email').value;
        const age = parseInt(document.getElementById('patient-age').value);
        const condition = document.getElementById('patient-condition').value;

        try {
            let response;
            if (this.currentPatient) {
                response = await this.fetchWithAuth(`/api/patients/${this.currentPatient.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ name, email, age, condition })
                });
            } else {
                response = await this.fetchWithAuth('/api/patients', {
                    method: 'POST',
                    body: JSON.stringify({ name, email, age, condition })
                });
            }

            if (response.ok) {
                this.closeModals();
                this.loadPatients();
            } else {
                const data = await response.json();
                alert(data.error || 'Error al guardar paciente');
            }
        } catch (error) {
            alert('Error de conexión');
        }
    }

    editPatient(patientId) {
        const patient = this.patients.find(p => p.id === patientId);
        if (patient) {
            this.showPatientModal(patient);
        }
    }

    async deletePatient(patientId) {
        if (confirm('¿Estás seguro de que quieres eliminar este paciente?')) {
            try {
                const response = await this.fetchWithAuth(`/api/patients/${patientId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    this.loadPatients();
                } else {
                    const data = await response.json();
                    alert(data.error || 'Error al eliminar paciente');
                }
            } catch (error) {
                alert('Error de conexión');
            }
        }
    }

    async assignSeries(patientId) {
        this.currentPatient = this.patients.find(p => p.id === patientId);
        const modal = document.getElementById('assign-series-modal');
        const select = document.getElementById('series-select');

        // Load series in select
        select.innerHTML = '<option value="">Seleccionar serie</option>';
        this.series.forEach(series => {
            const option = document.createElement('option');
            option.value = series.id;
            option.textContent = `${series.name} (${series.therapyType.replace('_', ' ')})`;
            select.appendChild(option);
        });

        modal.classList.remove('hidden');
    }

    async confirmAssignSeries() {
        const seriesId = parseInt(document.getElementById('series-select').value);
        if (!seriesId || !this.currentPatient) return;

        try {
            const response = await this.fetchWithAuth(`/api/patients/${this.currentPatient.id}/assign-series`, {
                method: 'POST',
                body: JSON.stringify({ seriesId })
            });

            if (response.ok) {
                this.closeModals();
                this.loadPatients();
            } else {
                const data = await response.json();
                alert(data.error || 'Error al asignar serie');
            }
        } catch (error) {
            alert('Error de conexión');
        }
    }

    async viewPatientSessions(patientId) {
        try {
            const response = await this.fetchWithAuth(`/api/patients/${patientId}/sessions`);
            if (response.ok) {
                const sessions = await response.json();
                this.renderPatientSessions(sessions);
                document.getElementById('patient-sessions-modal').classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error loading patient sessions:', error);
        }
    }

    renderPatientSessions(sessions) {
        const container = document.getElementById('sessions-list');
        container.innerHTML = '';

        if (sessions.length === 0) {
            container.innerHTML = '<p>No hay sesiones registradas para este paciente.</p>';
            return;
        }

        sessions.forEach(session => {
            const sessionDiv = document.createElement('div');
            sessionDiv.className = 'session-item';
            sessionDiv.innerHTML = `
                <div class="session-header-info">
                    <strong>Sesión ${session.sessionNumber}</strong>
                    <span>${new Date(session.completedAt).toLocaleDateString()}</span>
                </div>
                <div class="pain-indicators">
                    <span class="pain-indicator pain-before">Dolor antes: ${session.painBefore}/10</span>
                    <span class="pain-indicator pain-after">Dolor después: ${session.painAfter}/10</span>
                </div>
                <p><strong>Comentarios:</strong> ${session.comments}</p>
            `;
            container.appendChild(sessionDiv);
        });
    }

    loadPostures() {
        const therapyType = document.getElementById('therapy-type').value;
        const posturesSection = document.getElementById('postures-section');
        
        if (!therapyType) {
            posturesSection.classList.add('hidden');
            return;
        }

        const type = this.therapyTypes.find(t => t.id === therapyType);
        if (!type) return;

        posturesSection.classList.remove('hidden');
        const container = document.getElementById('available-postures');
        container.innerHTML = '';

        type.postures.forEach(posture => {
            const card = document.createElement('div');
            card.className = 'posture-card';
            card.dataset.postureId = posture.id;
            card.innerHTML = `
                <div class="card-content">
                <h4>${posture.name}</h4>
                <div class="contenedor-img">
                <img src="${posture.image}" alt="${posture.name}">
                </div>
                <p class="sanskrit">${posture.sanskrit}</p>
                </div>
            `;
            card.addEventListener('click', () => this.togglePostureSelection(card, posture));
            container.appendChild(card);
        });
    }

    togglePostureSelection(card, posture) {
        card.classList.toggle('selected');
        this.updateSelectedPostures();
    }

    updateSelectedPostures() {
        const selectedCards = document.querySelectorAll('.posture-card.selected');
        const container = document.getElementById('selected-postures');
        container.innerHTML = '';

        if (selectedCards.length === 0) {
            container.innerHTML = '<p>Selecciona posturas de la lista anterior</p>';
            return;
        }

        selectedCards.forEach((card, index) => {
            const postureId = parseInt(card.dataset.postureId);
            const therapyType = document.getElementById('therapy-type').value;
            const type = this.therapyTypes.find(t => t.id === therapyType);
            const posture = type.postures.find(p => p.id === postureId);

            const div = document.createElement('div');
            div.className = 'selected-posture';
            div.innerHTML = `
                <span>${index + 1}. ${posture.name}</span>
                <div class="posture-duration">
                    <label>Duración:</label>
                    <input type="number" min="1" max="60" value="5" data-posture-id="${postureId}"> min
                </div>
            `;
            container.appendChild(div);
        });
    }

    async handleCreateSeries(e) {
        e.preventDefault();
        const name = document.getElementById('series-name').value;
        const therapyType = document.getElementById('therapy-type').value;
        const totalSessions = parseInt(document.getElementById('total-sessions').value);

        // Get selected postures with durations
        const selectedCards = document.querySelectorAll('.posture-card.selected');
        const postures = [];

        selectedCards.forEach(card => {
            const postureId = parseInt(card.dataset.postureId);
            const durationInput = document.querySelector(`input[data-posture-id="${postureId}"]`);
            const duration = parseInt(durationInput.value);
            
            const type = this.therapyTypes.find(t => t.id === therapyType);
            const posture = type.postures.find(p => p.id === postureId);
            
            postures.push({
                ...posture,
                duration
            });
        });

        if (postures.length === 0) {
            alert('Selecciona al menos una postura');
            return;
        }

        try {
            const response = await this.fetchWithAuth('/api/therapy-series', {
                method: 'POST',
                body: JSON.stringify({ name, therapyType, postures, totalSessions })
            });

            if (response.ok) {
                alert('Serie creada exitosamente');
                document.getElementById('create-series-form').reset();
                document.getElementById('postures-section').classList.add('hidden');
                this.loadSeries();
            } else {
                const data = await response.json();
                alert(data.error || 'Error al crear serie');
            }
        } catch (error) {
            alert('Error de conexión');
        }
    }

    // Patient methods
    async loadPatientData() {
        try {
            const response = await this.fetchWithAuth('/api/my-series');
            if (response.ok) {
                const data = await response.json();
                this.renderPatientSeries(data);
            } else {
                document.getElementById('series-details').innerHTML = '<p>No tienes una serie asignada aún.</p>';
                document.getElementById('start-session-btn').style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading patient data:', error);
        }
    }

    renderPatientSeries(data) {
        const container = document.getElementById('series-details');
        const { series, currentSession } = data;
        
        container.innerHTML = `
            <div class="series-card">
                <h3>${series.name}</h3>
                <p><strong>Tipo de terapia:</strong> ${series.therapyType.replace('_', ' ')}</p>
                <p><strong>Posturas:</strong> ${series.postures.length}</p>
                <p><strong>Progreso:</strong> ${currentSession}/${series.totalSessions} sesiones</p>
                ${currentSession < series.totalSessions ? 
                    `<p>Próxima sesión: ${currentSession + 1}</p>` : 
                    '<p style="color: green;">¡Serie completada!</p>'
                }
            </div>
        `;

        this.currentSeries = series;
        document.getElementById('start-session-btn').style.display = 
            currentSession < series.totalSessions ? 'block' : 'none';
    }

    startSession() {
        document.getElementById('patient-home').classList.add('hidden');
        document.getElementById('session-view').classList.remove('hidden');
        document.getElementById('pre-session').classList.remove('hidden');
        document.getElementById('posture-display').classList.add('hidden');
        document.getElementById('post-session').classList.add('hidden');
    }

    startPostures() {
        this.currentSessionData.painBefore = parseInt(document.getElementById('pain-before').value);
        this.currentPostureIndex = 0;
        
        document.getElementById('pre-session').classList.add('hidden');
        document.getElementById('posture-display').classList.remove('hidden');
        
        document.getElementById('total-postures').textContent = this.currentSeries.postures.length;
        this.showCurrentPosture();
    }

    showCurrentPosture() {
        const posture = this.currentSeries.postures[this.currentPostureIndex];
        
        document.getElementById('current-posture').textContent = this.currentPostureIndex + 1;
        document.getElementById('posture-image').src = posture.image;
        document.getElementById('posture-name').textContent = posture.name;
        document.getElementById('posture-sanskrit').textContent = posture.sanskrit ? `(${posture.sanskrit})` : '';
        document.getElementById('posture-instructions').innerHTML = `<strong>Instrucciones:</strong> ${posture.instructions}`;
        document.getElementById('posture-benefits').innerHTML = `<strong>Beneficios:</strong> ${posture.benefits}`;
        document.getElementById('posture-modifications').innerHTML = `<strong>Modificaciones:</strong> ${posture.modifications}`;
        
        this.startPostureTimer(posture.duration);
    }

    startPostureTimer(durationMinutes) {
        let totalSeconds = durationMinutes * 60;
        
        const updateTimer = () => {
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            
            document.getElementById('timer-minutes').textContent = minutes.toString().padStart(2, '0');
            document.getElementById('timer-seconds').textContent = seconds.toString().padStart(2, '0');
            
            if (totalSeconds <= 0) {
                clearInterval(this.sessionTimer);
                document.getElementById('next-posture-btn').textContent = 'Siguiente Postura';
                document.getElementById('next-posture-btn').disabled = false;
            } else {
                totalSeconds--;
            }
        };
        
        updateTimer();
        this.sessionTimer = setInterval(updateTimer, 1000);
    }

    nextPosture() {
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
        }
        
        this.currentPostureIndex++;
        
        if (this.currentPostureIndex >= this.currentSeries.postures.length) {
            // Session complete
            document.getElementById('posture-display').classList.add('hidden');
            document.getElementById('post-session').classList.remove('hidden');
        } else {
            this.showCurrentPosture();
        }
    }

    async completeSession() {
        const painAfter = parseInt(document.getElementById('pain-after').value);
        const comments = document.getElementById('session-comments').value;
        
        if (!comments.trim()) {
            alert('Por favor, escribe un comentario sobre la sesión');
            return;
        }

        try {
            const response = await this.fetchWithAuth('/api/sessions', {
                method: 'POST',
                body: JSON.stringify({
                    painBefore: this.currentSessionData.painBefore,
                    painAfter,
                    comments
                })
            });

            if (response.ok) {
                alert('¡Sesión completada exitosamente!');
                document.getElementById('session-view').classList.add('hidden');
                document.getElementById('patient-home').classList.remove('hidden');
                this.loadPatientData();
            } else {
                const data = await response.json();
                alert(data.error || 'Error al completar sesión');
            }
        } catch (error) {
            alert('Error de conexión');
        }
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }
}

// Initialize app
const app = new TherapeuticYogaApp();

// Make app globally available for onclick handlers
window.app = app;