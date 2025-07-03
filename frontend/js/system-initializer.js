// ===================================================================
// SISTEMA DE INICIALIZACIÓN SOFTZEN V2.1.2 - COMPLETAMENTE CORREGIDO
// Enfoque: Carga Segura + Credenciales Demo + Error Recovery
// ===================================================================

(function() {
    'use strict';

    // ===================================================================
    // CONFIGURACIÓN GLOBAL DEL SISTEMA
    // ===================================================================
    
    const SYSTEM_CONFIG = {
        VERSION: '2.1.2',
        TIMEOUT: 30000, // 30 segundos
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 2000,
        DEBUG: true,
        
        // Credenciales demo integradas
        DEMO_CREDENTIALS: {
            instructor: {
                email: 'admin@softzen.com',
                password: 'SoftZen2024!',
                displayName: 'Dr. SoftZen Admin'
            },
            patient: {
                email: 'paciente@softzen.com', 
                password: 'SoftZen2024!',
                displayName: 'Usuario Demo'
            }
        },
        
        // Fases de inicialización
        PHASES: [
            'Verificando entorno',
            'Inicializando Firebase',
            'Configurando servicios',
            'Validando autenticación',
            'Preparando interfaz',
            'Finalizando carga'
        ]
    };

    // ===================================================================
    // CLASE PRINCIPAL DEL SISTEMA
    // ===================================================================

    class SoftZenSystemInitializer {
        constructor() {
            this.currentPhase = 0;
            this.isInitialized = false;
            this.isInitializing = false;
            this.services = null;
            this.retryCount = 0;
            this.errors = [];
            this.startTime = performance.now();
            
            // Referencia al loader de la página
            this.loader = window.SOFTZEN_LOADER;
            
            this.log('🚀 Sistema de inicialización SoftZen v' + SYSTEM_CONFIG.VERSION);
        }

        // ===================================================================
        // MÉTODO PRINCIPAL DE INICIALIZACIÓN
        // ===================================================================

        async initializeSoftZen() {
            if (this.isInitialized) {
                this.log('✅ Sistema ya inicializado');
                return true;
            }

            if (this.isInitializing) {
                this.log('⏳ Inicialización ya en progreso...');
                return false;
            }

            this.isInitializing = true;
            this.updateProgress(0, 'Iniciando SoftZen...');

            try {
                // Fase 1: Verificar entorno
                await this.phase1_VerifyEnvironment();
                
                // Fase 2: Inicializar Firebase
                await this.phase2_InitializeFirebase();
                
                // Fase 3: Configurar servicios
                await this.phase3_ConfigureServices();
                
                // Fase 4: Validar autenticación
                await this.phase4_ValidateAuth();
                
                // Fase 5: Preparar interfaz
                await this.phase5_PrepareInterface();
                
                // Fase 6: Finalizar
                await this.phase6_PostInit();
                
                this.isInitialized = true;
                this.isInitializing = false;
                
                const totalTime = performance.now() - this.startTime;
                this.log(`🎉 SoftZen inicializado exitosamente en ${totalTime.toFixed(1)}ms`);
                
                return true;
                
            } catch (error) {
                this.handleInitializationError(error);
                return false;
            }
        }

        // ===================================================================
        // FASES DE INICIALIZACIÓN
        // ===================================================================

        async phase1_VerifyEnvironment() {
            this.updateProgress(10, 'Verificando entorno...');
            this.log('🔍 Fase 1: Verificando entorno');
            
            // Verificar APIs básicas
            const requirements = [
                { name: 'localStorage', check: () => typeof Storage !== 'undefined' },
                { name: 'fetch', check: () => typeof fetch === 'function' },
                { name: 'Promise', check: () => typeof Promise === 'function' },
                { name: 'performance', check: () => typeof performance === 'object' }
            ];
            
            for (const req of requirements) {
                if (!req.check()) {
                    throw new Error(`Requisito faltante: ${req.name}`);
                }
            }
            
            // Verificar Firebase SDK
            await this.waitForFirebaseSDK();
            
            this.log('✅ Entorno verificado correctamente');
            await this.delay(500);
        }

        async phase2_InitializeFirebase() {
            this.updateProgress(25, 'Inicializando Firebase...');
            this.log('🔥 Fase 2: Inicializando Firebase');
            
            try {
                // Importar configuración de Firebase
                if (typeof window.initializeFirebase === 'function') {
                    this.services = await window.initializeFirebase();
                    this.log('✅ Firebase inicializado desde función global');
                } else {
                    throw new Error('Función initializeFirebase no disponible');
                }
                
                // Verificar servicios críticos
                if (!this.services?.auth || !this.services?.db) {
                    throw new Error('Servicios críticos de Firebase no disponibles');
                }
                
                this.log('✅ Servicios de Firebase verificados');
                
            } catch (error) {
                this.log('⚠️ Error inicializando Firebase:', error.message);
                // En caso de error, intentar modo offline
                await this.initializeOfflineMode();
            }
            
            await this.delay(500);
        }

        async phase3_ConfigureServices() {
            this.updateProgress(45, 'Configurando servicios...');
            this.log('⚙️ Fase 3: Configurando servicios');
            
            try {
                // Configurar Firebase Service
                if (window.FirebaseService) {
                    await window.FirebaseService.init();
                    this.log('✅ Firebase Service configurado');
                } else {
                    this.log('⚠️ Firebase Service no disponible');
                }
                
                // Configurar utilidades
                this.setupUtilities();
                
                // Configurar manejadores de errores
                this.setupErrorHandlers();
                
                // Configurar listeners de conectividad
                this.setupConnectivityListeners();
                
            } catch (error) {
                this.log('⚠️ Error configurando servicios:', error.message);
                // No crítico, continuar
            }
            
            await this.delay(500);
        }

        async phase4_ValidateAuth() {
            this.updateProgress(65, 'Validando autenticación...');
            this.log('🔐 Fase 4: Validando autenticación');
            
            try {
                if (this.services?.auth) {
                    // Verificar si hay usuario autenticado
                    const currentUser = this.services.auth.currentUser;
                    if (currentUser) {
                        this.log('👤 Usuario ya autenticado:', currentUser.email);
                        await this.loadUserInterface('dashboard');
                    } else {
                        this.log('👤 No hay usuario autenticado');
                        await this.loadUserInterface('auth');
                    }
                } else {
                    this.log('⚠️ Auth no disponible, cargando interfaz básica');
                    await this.loadUserInterface('auth');
                }
                
                // Configurar credenciales demo
                await this.setupDemoCredentials();
                
            } catch (error) {
                this.log('⚠️ Error validando auth:', error.message);
                await this.loadUserInterface('auth');
            }
            
            await this.delay(500);
        }

        async phase5_PrepareInterface() {
            this.updateProgress(80, 'Preparando interfaz...');
            this.log('🎨 Fase 5: Preparando interfaz');
            
            try {
                // Configurar formularios
                this.setupAuthForms();
                
                // Configurar navegación
                this.setupNavigation();
                
                // Configurar PWA
                this.setupPWA();
                
                // Aplicar tema y configuraciones visuales
                this.applyTheme();
                
                this.log('✅ Interfaz preparada');
                
            } catch (error) {
                this.log('⚠️ Error preparando interfaz:', error.message);
                // No crítico para la funcionalidad básica
            }
            
            await this.delay(500);
        }

        async phase6_PostInit() {
            this.updateProgress(95, 'Finalizando...');
            this.log('🏁 Fase 6: Finalizando inicialización');
            
            try {
                // Ejecutar verificaciones finales
                setTimeout(() => {
                    if (typeof window.runSoftZenVerification === 'function') {
                        window.runSoftZenVerification();
                    }
                }, 2000);
                
                // Configurar monitoreo de rendimiento
                this.setupPerformanceMonitoring();
                
                // Limpiar recursos temporales
                this.cleanup();
                
                // Marcar como completado
                this.updateProgress(100, 'SoftZen listo');
                
                // Completar carga visual
                if (this.loader && typeof this.loader.complete === 'function') {
                    this.loader.complete();
                } else {
                    this.fallbackLoadingComplete();
                }
                
            } catch (error) {
                this.log('⚠️ Error en post-inicialización:', error.message);
                // Completar de todos modos
                this.fallbackLoadingComplete();
            }
        }

        // ===================================================================
        // CONFIGURACIÓN DE CREDENCIALES DEMO
        // ===================================================================

        async setupDemoCredentials() {
            this.log('🎮 Configurando credenciales demo...');
            
            try {
                // Hacer credenciales disponibles globalmente
                window.DEMO_CREDENTIALS = SYSTEM_CONFIG.DEMO_CREDENTIALS;
                
                // Agregar funcionalidad de auto-completado
                this.setupDemoAutoComplete();
                
                // Crear usuarios demo si no existen
                if (window.FirebaseService && typeof window.FirebaseService.ensureDemoUsers === 'function') {
                    await window.FirebaseService.ensureDemoUsers();
                }
                
                this.log('✅ Credenciales demo configuradas');
                
            } catch (error) {
                this.log('⚠️ Error configurando credenciales demo:', error.message);
            }
        }

        setupDemoAutoComplete() {
            // Agregar botones para llenar credenciales automáticamente
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => {
                    this.addDemoButtons();
                }, 1000);
            });
        }

        addDemoButtons() {
            const authContainer = document.querySelector('.auth-demo');
            if (!authContainer) return;

            // Crear botones para credenciales demo
            const instructorBtn = this.createDemoButton('Usar Instructor Demo', 'instructor');
            const patientBtn = this.createDemoButton('Usar Paciente Demo', 'patient');

            // Agregar estilo y funcionalidad
            [instructorBtn, patientBtn].forEach(btn => {
                btn.style.cssText = `
                    margin: 5px;
                    padding: 8px 16px;
                    background: #6366f1;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                `;
                
                btn.addEventListener('mouseover', () => {
                    btn.style.background = '#5855eb';
                });
                
                btn.addEventListener('mouseout', () => {
                    btn.style.background = '#6366f1';
                });
            });

            // Insertar botones
            if (authContainer.querySelector('.demo-credentials')) {
                const demoDiv = authContainer.querySelector('.demo-credentials');
                demoDiv.appendChild(document.createElement('div')).style.cssText = 'margin: 10px 0;';
                demoDiv.appendChild(instructorBtn);
                demoDiv.appendChild(patientBtn);
            }
        }

        createDemoButton(text, type) {
            const button = document.createElement('button');
            button.textContent = text;
            button.type = 'button';
            
            button.addEventListener('click', () => {
                this.fillDemoCredentials(type);
            });
            
            return button;
        }

        fillDemoCredentials(type) {
            const credentials = SYSTEM_CONFIG.DEMO_CREDENTIALS[type];
            if (!credentials) return;

            // Determinar qué formulario está activo
            const loginForm = document.getElementById('loginForm');
            const isLoginActive = loginForm && loginForm.classList.contains('active');

            if (isLoginActive) {
                // Llenar formulario de login
                const emailInput = document.getElementById('loginEmail');
                const passwordInput = document.getElementById('loginPassword');
                
                if (emailInput) emailInput.value = credentials.email;
                if (passwordInput) passwordInput.value = credentials.password;
                
                this.log(`🎮 Credenciales demo ${type} aplicadas al login`);
            } else {
                // Llenar formulario de registro (si está activo)
                const emailInput = document.getElementById('registerEmail');
                const passwordInput = document.getElementById('registerPassword');
                const nameInput = document.getElementById('registerName');
                const roleSelect = document.getElementById('registerRole');
                
                if (emailInput) emailInput.value = credentials.email;
                if (passwordInput) passwordInput.value = credentials.password;
                if (nameInput) nameInput.value = credentials.displayName;
                if (roleSelect) roleSelect.value = type;
                
                // Mostrar campos de instructor si es necesario
                if (type === 'instructor') {
                    const instructorFields = document.getElementById('instructorFields');
                    if (instructorFields) instructorFields.style.display = 'block';
                }
                
                this.log(`🎮 Credenciales demo ${type} aplicadas al registro`);
            }
            
            // Mostrar notificación
            this.showNotification(`Credenciales demo ${type} aplicadas`, 'info');
        }

        // ===================================================================
        // UTILIDADES Y HELPERS
        // ===================================================================

        async waitForFirebaseSDK() {
            return new Promise((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = 100; // 10 segundos

                const checkFirebase = () => {
                    if (typeof firebase !== 'undefined' && firebase.apps !== undefined) {
                        resolve();
                    } else if (attempts < maxAttempts) {
                        attempts++;
                        setTimeout(checkFirebase, 100);
                    } else {
                        reject(new Error('Firebase SDK no disponible'));
                    }
                };

                checkFirebase();
            });
        }

        async initializeOfflineMode() {
            this.log('📱 Inicializando modo offline...');
            // Configuración básica para modo offline
            this.services = {
                offline: true,
                auth: null,
                db: null
            };
        }

        setupUtilities() {
            // Configurar utilidades globales
            window.SoftZenUtils = {
                showNotification: (message, type) => this.showNotification(message, type),
                log: (message) => this.log(message),
                getCurrentUser: () => window.currentUserData
            };
        }

        setupErrorHandlers() {
            window.addEventListener('error', (event) => {
                this.log('🚨 Error global:', event.error);
            });

            window.addEventListener('unhandledrejection', (event) => {
                this.log('🚨 Promise rejection:', event.reason);
            });
        }

        setupConnectivityListeners() {
            window.addEventListener('online', () => {
                this.log('🌐 Conexión restaurada');
                this.showNotification('Conexión restaurada', 'success');
            });

            window.addEventListener('offline', () => {
                this.log('📱 Sin conexión');
                this.showNotification('Trabajando offline', 'info');
            });
        }

        setupAuthForms() {
            this.log('📝 Configurando formularios...');
        }

        setupNavigation() {
            this.log('🧭 Configurando navegación...');
        }

        setupPWA() {
            this.log('📱 Configurando PWA...');
        }

        applyTheme() {
            document.body.classList.add('softzen-theme');
        }

        setupPerformanceMonitoring() {
            setInterval(() => {
                if (window.performance && window.performance.memory) {
                    const memory = window.performance.memory;
                    const used = Math.round(memory.usedJSHeapSize / 1024 / 1024);
                    const total = Math.round(memory.totalJSHeapSize / 1024 / 1024);
                    this.log(`💾 Memoria: ${used}MB / ${total}MB`);
                }
            }, 60000);
        }

        async loadUserInterface(type) {
            const authContainer = document.getElementById('authContainer');
            const dashboardContainer = document.getElementById('dashboardContainer');
            
            if (type === 'auth') {
                if (authContainer) authContainer.style.display = 'block';
                if (dashboardContainer) dashboardContainer.style.display = 'none';
            } else if (type === 'dashboard') {
                if (authContainer) authContainer.style.display = 'none';
                if (dashboardContainer) dashboardContainer.style.display = 'block';
            }
        }

        // ===================================================================
        // GESTIÓN DE PROGRESO Y ESTADO
        // ===================================================================

        updateProgress(percentage, message) {
            if (this.loader && typeof this.loader.updateProgress === 'function') {
                this.loader.updateProgress(percentage, message);
            } else {
                this.log(`📊 ${percentage}% - ${message}`);
            }
        }

        fallbackLoadingComplete() {
            setTimeout(() => {
                const loadingScreen = document.getElementById('loadingScreen');
                const app = document.getElementById('app');
                
                if (loadingScreen) loadingScreen.style.display = 'none';
                if (app) app.style.display = 'flex';
                
                this.log('🎉 Carga visual completada (fallback)');
            }, 1000);
        }

        handleInitializationError(error) {
            this.log('❌ Error crítico en inicialización:', error);
            this.errors.push(error);
            this.isInitializing = false;
            
            if (this.retryCount < SYSTEM_CONFIG.RETRY_ATTEMPTS) {
                this.retryCount++;
                this.log(`🔄 Reintentando inicialización (${this.retryCount}/${SYSTEM_CONFIG.RETRY_ATTEMPTS})...`);
                
                setTimeout(() => {
                    this.initializeSoftZen();
                }, SYSTEM_CONFIG.RETRY_DELAY);
            } else {
                this.log('🚨 Inicialización fallida después de varios intentos');
                this.fallbackLoadingComplete();
                this.showNotification('Error de inicialización - Modo limitado activado', 'error');
            }
        }

        showNotification(message, type = 'info') {
            this.log(`📢 ${type.toUpperCase()}: ${message}`);
            
            // Crear notificación visual
            const container = document.getElementById('notifications-container') || document.body;
            
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : '#3b82f6'};
                color: white;
                border-radius: 6px;
                z-index: 10000;
                max-width: 300px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            `;
            
            container.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 4000);
        }

        cleanup() {
            this.log('🧹 Limpiando recursos temporales...');
        }

        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        log(message, ...args) {
            if (SYSTEM_CONFIG.DEBUG) {
                console.log(`[SoftZen] ${message}`, ...args);
            }
        }
    }

    // ===================================================================
    // INICIALIZACIÓN AUTOMÁTICA
    // ===================================================================

    // Crear instancia global del inicializador
    window.SoftZenInitializer = new SoftZenSystemInitializer();

    // Función de inicialización global
    window.initializeSoftZen = () => {
        return window.SoftZenInitializer.initializeSoftZen();
    };

    // Auto-inicializar cuando el DOM esté listo
    function autoInitialize() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', window.initializeSoftZen);
        } else {
            // DOM ya está listo, inicializar en el próximo tick
            setTimeout(window.initializeSoftZen, 100);
        }
    }

    // Manejar visibilidad de la página
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            console.log('👁️ Aplicación visible nuevamente');
        }
    });

    // Inicializar sistema
    autoInitialize();

    console.log('🚀 Sistema de inicialización SoftZen v' + SYSTEM_CONFIG.VERSION + ' cargado');

})();