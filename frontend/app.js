// ===================================================================
// APLICACIÓN PRINCIPAL SOFTZEN V2.1.2 - CREDENCIALES DEMO FUNCIONANDO
// Enfoque: Integración Completa + Credenciales Demo + Error Handling
// ===================================================================

import firebaseService from './js/firebase-service.js';

// ===================================================================
// CLASE PRINCIPAL DE LA APLICACIÓN
// ===================================================================

class SoftZenApp {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
        this.currentView = 'auth';
        this.services = null;
        
        // Referencias a elementos DOM
        this.elements = {};
        
        // Estado de la aplicación
        this.state = {
            isLoading: false,
            isOnline: navigator.onLine,
            theme: 'default',
            notifications: []
        };
        
        console.log('🚀 SoftZen App v2.1.2 inicializando...');
    }

    // ===================================================================
    // INICIALIZACIÓN PRINCIPAL
    // ===================================================================

    async init() {
        if (this.isInitialized) {
            console.log('✅ App ya inicializada');
            return;
        }

        try {
            console.log('🔧 Inicializando aplicación SoftZen...');
            
            // Paso 1: Configurar elementos DOM
            this.setupDOMReferences();
            
            // Paso 2: Inicializar servicios
            await this.initializeServices();
            
            // Paso 3: Configurar listeners
            this.setupEventListeners();
            
            // Paso 4: Configurar autenticación
            this.setupAuthentication();
            
            // Paso 5: Configurar credenciales demo
            this.setupDemoCredentials();
            
            // Paso 6: Configurar interfaz inicial
            this.setupInitialInterface();
            
            // Paso 7: Verificar estado de auth
            await this.checkAuthState();
            
            this.isInitialized = true;
            console.log('✅ SoftZen App inicializada correctamente');
            
            // Disparar evento de app lista
            this.dispatchEvent('appReady', { timestamp: new Date() });
            
        } catch (error) {
            console.error('❌ Error inicializando app:', error);
            this.handleInitializationError(error);
        }
    }

    // ===================================================================
    // CONFIGURACIÓN DE SERVICIOS
    // ===================================================================

    async initializeServices() {
        console.log('🔥 Inicializando servicios...');
        
        try {
            // Inicializar Firebase Service
            this.services = await firebaseService.init();
            console.log('✅ Firebase Service inicializado');
            
            // Configurar listeners de Firebase
            this.setupFirebaseListeners();
            
        } catch (error) {
            console.warn('⚠️ Error inicializando servicios:', error);
            // Continuar en modo limitado
            this.services = null;
        }
    }

    setupFirebaseListeners() {
        if (!this.services?.auth) return;

        // Listener de cambios de autenticación
        this.services.auth.onAuthStateChanged(async (user) => {
            console.log('🔐 Estado de auth cambió:', user ? user.email : 'no autenticado');
            
            this.currentUser = user;
            
            if (user) {
                await this.handleUserSignedIn(user);
            } else {
                await this.handleUserSignedOut();
            }
        });
    }

    // ===================================================================
    // CONFIGURACIÓN DOM Y EVENTOS
    // ===================================================================

    setupDOMReferences() {
        console.log('📄 Configurando referencias DOM...');
        
        // Contenedores principales
        this.elements.authContainer = document.getElementById('authContainer');
        this.elements.dashboardContainer = document.getElementById('dashboardContainer');
        
        // Formularios
        this.elements.loginForm = document.getElementById('loginFormElement');
        this.elements.registerForm = document.getElementById('registerFormElement');
        
        // Botones
        this.elements.loginBtn = document.getElementById('btnLogin');
        this.elements.registerBtn = document.getElementById('btnRegister');
        this.elements.logoutBtn = document.getElementById('btnLogout');
        
        // Campos de formulario
        this.elements.loginEmail = document.getElementById('loginEmail');
        this.elements.loginPassword = document.getElementById('loginPassword');
        this.elements.registerEmail = document.getElementById('registerEmail');
        this.elements.registerPassword = document.getElementById('registerPassword');
        this.elements.registerName = document.getElementById('registerName');
        this.elements.registerRole = document.getElementById('registerRole');
        
        // Tabs de auth
        this.elements.authTabs = document.querySelectorAll('.auth-tab');
        
        // Información de usuario
        this.elements.userDisplayName = document.getElementById('userDisplayName');
        this.elements.userRole = document.getElementById('userRole');
        this.elements.navUserInfo = document.getElementById('navUserInfo');
    }

    setupEventListeners() {
        console.log('👂 Configurando listeners de eventos...');
        
        // Formularios
        if (this.elements.loginForm) {
            this.elements.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        if (this.elements.registerForm) {
            this.elements.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
        
        // Botón de logout
        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        
        // Tabs de autenticación
        this.elements.authTabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.handleTabSwitch(e));
        });
        
        // Campo de rol para mostrar/ocultar campos de instructor
        if (this.elements.registerRole) {
            this.elements.registerRole.addEventListener('change', (e) => this.handleRoleChange(e));
        }
        
        // Eventos globales
        window.addEventListener('online', () => this.handleConnectivityChange(true));
        window.addEventListener('offline', () => this.handleConnectivityChange(false));
        
        // Evento personalizado de app lista
        window.addEventListener('appReady', (e) => this.handleAppReady(e));
    }

    // ===================================================================
    // CREDENCIALES DEMO MEJORADAS
    // ===================================================================

    setupDemoCredentials() {
        console.log('🎮 Configurando credenciales demo...');
        
        // Credenciales disponibles
        const demoCredentials = {
            instructor: {
                email: 'admin@softzen.com',
                password: 'SoftZen2024!',
                displayName: 'Dr. SoftZen Admin',
                role: 'instructor'
            },
            patient: {
                email: 'paciente@softzen.com',
                password: 'SoftZen2024!', 
                displayName: 'Usuario Demo',
                role: 'patient'
            }
        };
        
        // Hacer disponible globalmente
        window.SOFTZEN_DEMO_CREDENTIALS = demoCredentials;
        
        // Agregar botones de autocompletado
        setTimeout(() => {
            this.addDemoButtons(demoCredentials);
        }, 1000);
        
        // Detectar y manejar credenciales demo en formularios
        this.setupDemoDetection(demoCredentials);
    }

    addDemoButtons(credentials) {
        const demoSection = document.querySelector('.auth-demo');
        if (!demoSection) return;

        // Crear contenedor de botones si no existe
        let buttonContainer = demoSection.querySelector('.demo-buttons');
        if (!buttonContainer) {
            buttonContainer = document.createElement('div');
            buttonContainer.className = 'demo-buttons';
            buttonContainer.style.cssText = `
                margin-top: 15px;
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
                justify-content: center;
            `;
            demoSection.appendChild(buttonContainer);
        }

        // Crear botones para cada tipo de usuario
        Object.entries(credentials).forEach(([type, creds]) => {
            const button = document.createElement('button');
            button.className = `demo-btn demo-btn-${type}`;
            button.type = 'button';
            button.innerHTML = `
                <span style="margin-right: 5px;">${type === 'instructor' ? '👨‍⚕️' : '🧘‍♀️'}</span>
                Usar ${type === 'instructor' ? 'Instructor' : 'Paciente'}
            `;
            
            button.style.cssText = `
                padding: 8px 16px;
                background: ${type === 'instructor' ? '#7c3aed' : '#06b6d4'};
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                min-width: 120px;
                justify-content: center;
            `;
            
            // Efectos hover
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-1px)';
                button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                button.style.background = type === 'instructor' ? '#6d28d9' : '#0891b2';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = 'none';
                button.style.background = type === 'instructor' ? '#7c3aed' : '#06b6d4';
            });
            
            // Evento click
            button.addEventListener('click', () => {
                this.fillDemoCredentials(type, creds);
            });
            
            buttonContainer.appendChild(button);
        });

        console.log('✅ Botones demo agregados');
    }

    fillDemoCredentials(type, credentials) {
        console.log(`🎮 Llenando credenciales demo: ${type}`);
        
        // Determinar formulario activo
        const loginFormActive = this.elements.loginForm?.closest('.auth-form')?.classList.contains('active');
        
        if (loginFormActive) {
            // Llenar formulario de login
            if (this.elements.loginEmail) {
                this.elements.loginEmail.value = credentials.email;
                this.elements.loginEmail.dispatchEvent(new Event('input', { bubbles: true }));
            }
            
            if (this.elements.loginPassword) {
                this.elements.loginPassword.value = credentials.password;
                this.elements.loginPassword.dispatchEvent(new Event('input', { bubbles: true }));
            }
            
            this.showNotification(`Credenciales ${type} aplicadas al login`, 'success');
            
        } else {
            // Llenar formulario de registro
            if (this.elements.registerEmail) {
                this.elements.registerEmail.value = credentials.email;
                this.elements.registerEmail.dispatchEvent(new Event('input', { bubbles: true }));
            }
            
            if (this.elements.registerPassword) {
                this.elements.registerPassword.value = credentials.password;
                this.elements.registerPassword.dispatchEvent(new Event('input', { bubbles: true }));
            }
            
            if (this.elements.registerName) {
                this.elements.registerName.value = credentials.displayName;
                this.elements.registerName.dispatchEvent(new Event('input', { bubbles: true }));
            }
            
            if (this.elements.registerRole) {
                this.elements.registerRole.value = credentials.role;
                this.elements.registerRole.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            this.showNotification(`Credenciales ${type} aplicadas al registro`, 'success');
        }
        
        // Animar los campos
        this.animateFields([
            this.elements.loginEmail || this.elements.registerEmail,
            this.elements.loginPassword || this.elements.registerPassword,
            this.elements.registerName,
            this.elements.registerRole
        ].filter(Boolean));
    }

    setupDemoDetection(credentials) {
        // Detectar cuando se escriben credenciales demo manualmente
        const emailFields = [this.elements.loginEmail, this.elements.registerEmail].filter(Boolean);
        
        emailFields.forEach(field => {
            field.addEventListener('input', (e) => {
                const email = e.target.value.trim();
                const demoType = this.detectDemoEmail(email, credentials);
                
                if (demoType) {
                    this.highlightDemoField(field, true);
                } else {
                    this.highlightDemoField(field, false);
                }
            });
        });
    }

    detectDemoEmail(email, credentials) {
        for (const [type, creds] of Object.entries(credentials)) {
            if (creds.email === email) {
                return type;
            }
        }
        return null;
    }

    highlightDemoField(field, isDemo) {
        if (isDemo) {
            field.style.borderColor = '#22c55e';
            field.style.boxShadow = '0 0 0 1px #22c55e';
        } else {
            field.style.borderColor = '';
            field.style.boxShadow = '';
        }
    }

    animateFields(fields) {
        fields.forEach((field, index) => {
            if (field) {
                setTimeout(() => {
                    field.style.transition = 'transform 0.3s, box-shadow 0.3s';
                    field.style.transform = 'scale(1.02)';
                    field.style.boxShadow = '0 4px 8px rgba(99, 102, 241, 0.3)';
                    
                    setTimeout(() => {
                        field.style.transform = 'scale(1)';
                        field.style.boxShadow = '';
                    }, 300);
                }, index * 100);
            }
        });
    }

    // ===================================================================
    // MANEJO DE AUTENTICACIÓN
    // ===================================================================

    async handleLogin(event) {
        event.preventDefault();
        
        const email = this.elements.loginEmail?.value.trim();
        const password = this.elements.loginPassword?.value;
        
        if (!email || !password) {
            this.showNotification('Por favor completa todos los campos', 'error');
            return;
        }
        
        console.log('🔐 Intentando login con:', email);
        
        this.setButtonLoading(this.elements.loginBtn, true);
        
        try {
            // Usar el servicio de Firebase
            const result = await firebaseService.signInWithEmailAndPassword(email, password);
            
            if (result?.user) {
                console.log('✅ Login exitoso:', result.user.email);
                this.showNotification('¡Bienvenido a SoftZen!', 'success');
                
                // El listener de auth state se encarga del resto
            } else {
                throw new Error('No se pudo autenticar el usuario');
            }
            
        } catch (error) {
            console.error('❌ Error en login:', error);
            
            let errorMessage = 'Error de autenticación';
            
            if (error.code) {
                switch (error.code) {
                    case 'auth/user-not-found':
                        errorMessage = 'Usuario no encontrado';
                        break;
                    case 'auth/wrong-password':
                        errorMessage = 'Contraseña incorrecta';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Email inválido';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Demasiados intentos. Intenta más tarde';
                        break;
                    default:
                        errorMessage = error.message || 'Error desconocido';
                }
            }
            
            this.showNotification(errorMessage, 'error');
            
        } finally {
            this.setButtonLoading(this.elements.loginBtn, false);
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        
        const email = this.elements.registerEmail?.value.trim();
        const password = this.elements.registerPassword?.value;
        const name = this.elements.registerName?.value.trim();
        const role = this.elements.registerRole?.value;
        
        if (!email || !password || !name || !role) {
            this.showNotification('Por favor completa todos los campos', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
        
        console.log('📝 Intentando registro con:', email);
        
        this.setButtonLoading(this.elements.registerBtn, true);
        
        try {
            if (!this.services?.auth) {
                throw new Error('Servicio de autenticación no disponible');
            }
            
            // Crear usuario
            const result = await this.services.auth.createUserWithEmailAndPassword(email, password);
            
            if (result?.user) {
                // Actualizar perfil
                await result.user.updateProfile({
                    displayName: name
                });
                
                // Crear documento del usuario
                if (this.services.db) {
                    await this.services.db.collection('users').doc(result.user.uid).set({
                        uid: result.user.uid,
                        email: email,
                        name: name,
                        role: role,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
                
                console.log('✅ Registro exitoso:', result.user.email);
                this.showNotification('¡Cuenta creada exitosamente!', 'success');
                
                // El listener de auth state se encarga del resto
            }
            
        } catch (error) {
            console.error('❌ Error en registro:', error);
            
            let errorMessage = 'Error creando cuenta';
            
            if (error.code) {
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        errorMessage = 'El email ya está registrado';
                        break;
                    case 'auth/weak-password':
                        errorMessage = 'La contraseña es muy débil';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Email inválido';
                        break;
                    default:
                        errorMessage = error.message || 'Error desconocido';
                }
            }
            
            this.showNotification(errorMessage, 'error');
            
        } finally {
            this.setButtonLoading(this.elements.registerBtn, false);
        }
    }

    async handleLogout() {
        console.log('👋 Cerrando sesión...');
        
        try {
            await firebaseService.signOut();
            
            this.showNotification('Sesión cerrada', 'info');
            
            // El listener de auth state se encarga del resto
            
        } catch (error) {
            console.error('❌ Error en logout:', error);
            this.showNotification('Error cerrando sesión', 'error');
        }
    }

    // ===================================================================
    // MANEJO DE ESTADO DE USUARIO
    // ===================================================================

    async handleUserSignedIn(user) {
        console.log('👤 Usuario logueado:', user.email);
        
        this.currentUser = user;
        
        // Cargar datos del usuario
        await this.loadUserData(user.uid);
        
        // Actualizar interfaz
        this.updateUserInterface(user);
        
        // Cambiar a vista de dashboard
        this.switchView('dashboard');
    }

    async handleUserSignedOut() {
        console.log('👤 Usuario deslogueado');
        
        this.currentUser = null;
        
        // Limpiar datos
        window.currentUserData = null;
        
        // Actualizar interfaz
        this.updateUserInterface(null);
        
        // Cambiar a vista de auth
        this.switchView('auth');
    }

    async loadUserData(userId) {
        try {
            if (this.services?.db) {
                const userDoc = await this.services.db.collection('users').doc(userId).get();
                
                if (userDoc.exists) {
                    window.currentUserData = userDoc.data();
                    console.log('📄 Datos de usuario cargados');
                } else {
                    console.log('📄 Documento de usuario no encontrado');
                }
            }
        } catch (error) {
            console.warn('⚠️ Error cargando datos de usuario:', error);
        }
    }

    updateUserInterface(user) {
        if (user) {
            // Mostrar información del usuario
            if (this.elements.userDisplayName) {
                this.elements.userDisplayName.textContent = user.displayName || user.email;
            }
            
            if (this.elements.userRole && window.currentUserData?.role) {
                this.elements.userRole.textContent = window.currentUserData.role === 'instructor' ? 'Instructor' : 'Paciente';
            }
            
            if (this.elements.navUserInfo) {
                this.elements.navUserInfo.style.display = 'flex';
            }
            
        } else {
            // Ocultar información del usuario
            if (this.elements.navUserInfo) {
                this.elements.navUserInfo.style.display = 'none';
            }
        }
    }

    // ===================================================================
    // GESTIÓN DE VISTAS
    // ===================================================================

    switchView(viewName) {
        console.log(`🔄 Cambiando a vista: ${viewName}`);
        
        this.currentView = viewName;
        
        if (viewName === 'auth') {
            if (this.elements.authContainer) {
                this.elements.authContainer.style.display = 'block';
            }
            if (this.elements.dashboardContainer) {
                this.elements.dashboardContainer.style.display = 'none';
            }
        } else if (viewName === 'dashboard') {
            if (this.elements.authContainer) {
                this.elements.authContainer.style.display = 'none';
            }
            if (this.elements.dashboardContainer) {
                this.elements.dashboardContainer.style.display = 'block';
            }
            
            // Cargar contenido del dashboard
            this.loadDashboardContent();
        }
    }

    loadDashboardContent() {
        const dashboardContent = document.getElementById('dashboard-content');
        if (!dashboardContent) return;
        
        const user = this.currentUser;
        const userData = window.currentUserData;
        
        dashboardContent.innerHTML = `
            <div class="dashboard-welcome">
                <div class="welcome-header">
                    <h2>¡Bienvenido a SoftZen!</h2>
                    <p>Hola ${user?.displayName || user?.email || 'Usuario'}, tu plataforma de yoga terapéutico está lista.</p>
                </div>
                
                <div class="dashboard-stats">
                    <div class="stat-card">
                        <h3>👤 Perfil</h3>
                        <p><strong>Rol:</strong> ${userData?.role === 'instructor' ? 'Instructor' : 'Paciente'}</p>
                        <p><strong>Email:</strong> ${user?.email}</p>
                        ${userData?.isDemo ? '<p><span style="color: #f59e0b;">🎮 Usuario Demo</span></p>' : ''}
                    </div>
                    
                    <div class="stat-card">
                        <h3>🔧 Estado</h3>
                        <p><strong>Sistema:</strong> Funcionando</p>
                        <p><strong>Conexión:</strong> ${this.state.isOnline ? 'Online' : 'Offline'}</p>
                        <p><strong>Firebase:</strong> ${this.services ? 'Conectado' : 'Desconectado'}</p>
                    </div>
                    
                    <div class="stat-card">
                        <h3>📊 Información</h3>
                        <p><strong>Sesiones:</strong> Próximamente</p>
                        <p><strong>Progreso:</strong> En desarrollo</p>
                        <p><strong>Última conexión:</strong> Ahora</p>
                    </div>
                </div>
                
                <div class="dashboard-actions">
                    <h3>🎯 Acciones rápidas</h3>
                    <div class="action-buttons">
                        <button class="action-btn" onclick="alert('Función en desarrollo')">
                            <span>📅</span> Ver Calendario
                        </button>
                        <button class="action-btn" onclick="alert('Función en desarrollo')">
                            <span>🧘‍♀️</span> Nueva Sesión
                        </button>
                        <button class="action-btn" onclick="alert('Función en desarrollo')">
                            <span>📈</span> Ver Progreso
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar estilos inline si no existen
        if (!document.getElementById('dashboard-styles')) {
            const styles = document.createElement('style');
            styles.id = 'dashboard-styles';
            styles.textContent = `
                .dashboard-welcome {
                    padding: 20px;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                
                .welcome-header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                
                .welcome-header h2 {
                    color: #6366f1;
                    margin-bottom: 10px;
                }
                
                .dashboard-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                
                .stat-card {
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    border: 1px solid #e5e7eb;
                }
                
                .stat-card h3 {
                    margin: 0 0 15px 0;
                    color: #374151;
                    font-size: 18px;
                }
                
                .stat-card p {
                    margin: 8px 0;
                    color: #6b7280;
                }
                
                .dashboard-actions {
                    text-align: center;
                }
                
                .action-buttons {
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                    flex-wrap: wrap;
                    margin-top: 20px;
                }
                
                .action-btn {
                    padding: 12px 24px;
                    background: #6366f1;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: background 0.2s;
                }
                
                .action-btn:hover {
                    background: #5855eb;
                }
                
                @media (max-width: 768px) {
                    .dashboard-stats {
                        grid-template-columns: 1fr;
                    }
                    
                    .action-buttons {
                        flex-direction: column;
                        align-items: center;
                    }
                    
                    .action-btn {
                        width: 200px;
                        justify-content: center;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
    }

    // ===================================================================
    // MANEJO DE EVENTOS DE INTERFAZ
    // ===================================================================

    handleTabSwitch(event) {
        const tab = event.target.closest('.auth-tab');
        if (!tab) return;
        
        const tabType = tab.dataset.tab;
        if (!tabType) return;
        
        console.log(`🔄 Cambiando tab a: ${tabType}`);
        
        // Actualizar tabs activos
        this.elements.authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Mostrar formulario correspondiente
        const authForms = document.querySelectorAll('.auth-form');
        authForms.forEach(form => {
            const shouldShow = form.id === `${tabType}Form`;
            form.classList.toggle('active', shouldShow);
        });
        
        // Focus en primer campo del formulario activo
        setTimeout(() => {
            const activeForm = document.querySelector('.auth-form.active');
            if (activeForm) {
                const firstInput = activeForm.querySelector('input:not([type="hidden"])');
                if (firstInput) {
                    firstInput.focus();
                }
            }
        }, 100);
    }

    handleRoleChange(event) {
        const role = event.target.value;
        const instructorFields = document.getElementById('instructorFields');
        
        if (instructorFields) {
            const shouldShow = role === 'instructor';
            instructorFields.style.display = shouldShow ? 'block' : 'none';
            
            // Actualizar required del campo specialty
            const specialtySelect = document.getElementById('registerSpecialty');
            if (specialtySelect) {
                specialtySelect.required = shouldShow;
            }
        }
    }

    handleConnectivityChange(isOnline) {
        console.log(`🌐 Conectividad: ${isOnline ? 'Online' : 'Offline'}`);
        
        this.state.isOnline = isOnline;
        
        if (isOnline) {
            this.showNotification('Conexión restaurada', 'success');
        } else {
            this.showNotification('Sin conexión - Trabajando offline', 'warning');
        }
    }

    handleAppReady(event) {
        console.log('🎉 App completamente lista:', event.detail);
    }

    // ===================================================================
    // UTILIDADES
    // ===================================================================

    async checkAuthState() {
        console.log('🔍 Verificando estado de autenticación...');
        
        if (this.services?.auth?.currentUser) {
            await this.handleUserSignedIn(this.services.auth.currentUser);
        } else {
            await this.handleUserSignedOut();
        }
    }

    setupAuthentication() {
        console.log('🔐 Configurando sistema de autenticación...');
    }

    setupInitialInterface() {
        console.log('🎨 Configurando interfaz inicial...');
        
        // Asegurar que la vista correcta esté visible
        this.switchView('auth');
        
        // Configurar tema
        document.body.classList.add('softzen-theme');
    }

    setButtonLoading(button, loading) {
        if (!button) return;
        
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');
        
        if (loading) {
            button.disabled = true;
            if (btnText) btnText.style.display = 'none';
            if (btnLoading) btnLoading.style.display = 'flex';
            button.style.opacity = '0.7';
        } else {
            button.disabled = false;
            if (btnText) btnText.style.display = 'inline';
            if (btnLoading) btnLoading.style.display = 'none';
            button.style.opacity = '1';
        }
    }

    showNotification(message, type = 'info') {
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
        
        // Crear notificación visual
        this.createVisualNotification(message, type);
        
        // Agregar a estado
        this.state.notifications.unshift({
            id: Date.now(),
            message,
            type,
            timestamp: new Date()
        });
        
        // Mantener solo las últimas 10 notificaciones
        if (this.state.notifications.length > 10) {
            this.state.notifications = this.state.notifications.slice(0, 10);
        }
    }

    createVisualNotification(message, type) {
        const container = document.getElementById('notifications-container') || document.body;
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const colors = {
            success: '#22c55e',
            error: '#ef4444', 
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        notification.innerHTML = `
            <span style="margin-right: 8px;">${icons[type] || icons.info}</span>
            ${message}
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${colors[type] || colors.info};
            color: white;
            border-radius: 8px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-weight: 500;
            display: flex;
            align-items: center;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        container.appendChild(notification);
        
        // Animación de entrada
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });
        
        // Auto-remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    handleInitializationError(error) {
        console.error('🚨 Error crítico de inicialización:', error);
        
        this.showNotification('Error de inicialización - Funcionalidad limitada', 'error');
        
        // Intentar cargar interfaz básica
        setTimeout(() => {
            this.setupInitialInterface();
        }, 1000);
    }

    dispatchEvent(eventName, detail) {
        const event = new CustomEvent(eventName, { detail });
        window.dispatchEvent(event);
    }

    // ===================================================================
    // API PÚBLICA
    // ===================================================================

    getCurrentUser() {
        return this.currentUser;
    }

    getCurrentView() {
        return this.currentView;
    }

    getState() {
        return { ...this.state };
    }

    isAuthenticated() {
        return !!this.currentUser;
    }
}

// ===================================================================
// INICIALIZACIÓN Y EXPORT GLOBAL
// ===================================================================

// Crear instancia global de la aplicación
const softZenApp = new SoftZenApp();

// Hacer disponible globalmente
window.SoftZenApp = softZenApp;

// Auto-inicializar cuando esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => softZenApp.init(), 500);
    });
} else {
    setTimeout(() => softZenApp.init(), 500);
}

// Manejar evento de app lista
window.addEventListener('appReady', () => {
    console.log('🎉 SoftZen completamente inicializado y listo');
});

console.log('📱 SoftZen App v2.1.2 módulo cargado');

export default softZenApp;