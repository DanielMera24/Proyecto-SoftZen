// ===================================================================
// FIREBASE SERVICE CORREGIDO - SOFTZEN V2.1.2 - SOLUCIONES APLICADAS
// Enfoque: Conectividad + Credenciales + Error 503 Fix
// ===================================================================

import { 
  initializeFirebase, 
  getFirebaseServices, 
  handleFirebaseError,
  COLLECTIONS,
  USER_ROLES,
  createTimestamp 
} from './firebase-config.js';

// ===================================================================
// CREDENCIALES DE DEMOSTRACIÓN CORREGIDAS
// ===================================================================

const DEMO_CREDENTIALS = {
  instructor: {
    email: 'admin@softzen.com',
    password: 'SoftZen2024!',
    userData: {
      name: 'Dr. SoftZen Admin',
      role: 'instructor',
      specialty: 'therapeutic',
      verified: true,
      experience: '10+ años',
      bio: 'Instructor especializado en yoga terapéutico'
    }
  },
  patient: {
    email: 'paciente@softzen.com', 
    password: 'SoftZen2024!',
    userData: {
      name: 'Usuario Demo',
      role: 'patient',
      verified: true,
      joinDate: new Date(),
      preferences: {
        difficulty: 'beginner',
        focus: ['stress_relief', 'flexibility']
      }
    }
  }
};

// ===================================================================
// CLASE FIREBASE SERVICE OPTIMIZADA
// ===================================================================

class OptimizedFirebaseService {
  constructor() {
    this.services = null;
    this.currentUser = null;
    this.isInitialized = false;
    this.isInitializing = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.connectionState = 'disconnected';
    this.listeners = new Map();
    
    // Cache para reducir llamadas a Firebase
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
    
    // Configuración para manejo de errores 503
    this.offlineMode = false;
    this.pendingOperations = [];
    
    this.setupConnectionListener();
    this.setupRetryMechanism();
  }

  // ===================================================================
  // INICIALIZACIÓN CORREGIDA
  // ===================================================================

  async init() {
    if (this.isInitialized) {
      return this.services;
    }

    if (this.isInitializing) {
      // Esperar a que termine la inicialización en curso
      return new Promise((resolve) => {
        const checkInit = () => {
          if (this.isInitialized) {
            resolve(this.services);
          } else if (!this.isInitializing) {
            resolve(null);
          } else {
            setTimeout(checkInit, 100);
          }
        };
        checkInit();
      });
    }

    this.isInitializing = true;

    try {
      console.log('🔥 Inicializando Firebase Service optimizado...');
      
      // Usar función de inicialización corregida
      this.services = await this.initializeWithRetry();
      
      if (this.services?.auth) {
        // Configurar listener de auth con manejo mejorado
        this.setupAuthListener();
        
        // Verificar si hay usuario previamente autenticado
        await this.checkExistingAuth();
      }

      this.isInitialized = true;
      this.isInitializing = false;
      
      console.log('✅ Firebase Service inicializado correctamente');
      
      // Crear usuarios demo si no existen
      await this.ensureDemoUsers();
      
      return this.services;

    } catch (error) {
      console.error('❌ Error inicializando Firebase Service:', error);
      this.isInitializing = false;
      throw error;
    }
  }

  // ===================================================================
  // INICIALIZACIÓN CON RETRY PARA ERRORES 503
  // ===================================================================

  async initializeWithRetry() {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Intento de inicialización ${attempt}/${this.maxRetries}`);
        
        const services = await initializeFirebase();
        
        if (services?.db) {
          // Test de conectividad básico
          await this.testFirestoreConnection(services.db);
        }
        
        console.log('✅ Firebase inicializado exitosamente');
        return services;
        
      } catch (error) {
        console.warn(`⚠️ Intento ${attempt} fallido:`, error.message);
        
        if (attempt === this.maxRetries) {
          // En el último intento, activar modo offline
          console.log('🔌 Activando modo offline');
          this.offlineMode = true;
          
          // Intentar obtener servicios básicos sin conexión
          try {
            return await initializeFirebase();
          } catch (finalError) {
            throw new Error(`Firebase initialization failed after ${this.maxRetries} attempts: ${finalError.message}`);
          }
        }
        
        // Esperar antes del siguiente intento
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
  }

  // ===================================================================
  // TEST DE CONECTIVIDAD FIRESTORE MEJORADO
  // ===================================================================

  async testFirestoreConnection(db) {
    try {
      console.log('🔍 Probando conectividad con Firestore...');
      
      // Test simple que no requiere permisos especiales
      const testDoc = db.collection('system').doc('connectivity-test');
      
      // Intentar escribir (fallará silenciosamente si no hay permisos)
      await testDoc.set({
        timestamp: createTimestamp(),
        test: true
      }, { merge: true });
      
      console.log('✅ Conectividad con Firestore confirmada');
      this.connectionState = 'connected';
      
    } catch (error) {
      // Si falla, no es crítico - solo registrar y continuar
      console.log('⚠️ Test de conectividad falló (modo offline):', error.message);
      this.connectionState = 'offline';
      this.offlineMode = true;
    }
  }

  // ===================================================================
  // CONFIGURACIÓN DE LISTENERS MEJORADA
  // ===================================================================

  setupConnectionListener() {
    // Listener de conexión de red
    window.addEventListener('online', () => {
      console.log('🌐 Conexión restaurada');
      this.connectionState = 'connected';
      this.offlineMode = false;
      this.processPendingOperations();
    });

    window.addEventListener('offline', () => {
      console.log('📱 Sin conexión - modo offline');
      this.connectionState = 'offline';
      this.offlineMode = true;
    });

    // Listener específico para Firestore
    this.setupFirestoreConnectionListener();
  }

  setupFirestoreConnectionListener() {
    if (!this.services?.db) return;

    // Monitorear estado de conexión de Firestore
    const intervalId = setInterval(async () => {
      if (!this.services?.db) {
        clearInterval(intervalId);
        return;
      }

      try {
        // Ping simple a Firestore
        await this.services.db.collection('system').limit(1).get();
        
        if (this.connectionState !== 'connected') {
          console.log('🔄 Reconectado a Firestore');
          this.connectionState = 'connected';
          this.offlineMode = false;
          this.processPendingOperations();
        }
        
      } catch (error) {
        if (error.code === 'unavailable' || error.message.includes('503')) {
          if (this.connectionState !== 'offline') {
            console.log('⚠️ Problema de conectividad con Firestore');
            this.connectionState = 'offline';
            this.offlineMode = true;
          }
        }
      }
    }, 10000); // Cada 10 segundos

    // Limpiar interval al cerrar
    window.addEventListener('beforeunload', () => {
      clearInterval(intervalId);
    });
  }

  // ===================================================================
  // AUTENTICACIÓN CON CREDENCIALES DEMO
  // ===================================================================

  async signInWithEmailAndPassword(email, password) {
    try {
      await this.ensureInitialized();
      
      console.log('🔐 Intentando autenticación:', email);
      
      // Verificar si son credenciales demo
      const demoType = this.getDemoUserType(email, password);
      if (demoType) {
        console.log(`👤 Usando credenciales demo: ${demoType}`);
        return await this.signInDemoUser(demoType, email, password);
      }
      
      // Autenticación normal
      const result = await this.services.auth.signInWithEmailAndPassword(email, password);
      
      if (result.user) {
        await this.loadUserData(result.user.uid);
        console.log('✅ Autenticación exitosa');
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Error en autenticación:', error);
      throw this.handleAuthError(error);
    }
  }

  // ===================================================================
  // MANEJO DE USUARIOS DEMO CORREGIDO
  // ===================================================================

  getDemoUserType(email, password) {
    for (const [type, creds] of Object.entries(DEMO_CREDENTIALS)) {
      if (creds.email === email && creds.password === password) {
        return type;
      }
    }
    return null;
  }

  async signInDemoUser(demoType, email, password) {
    try {
      // Intentar autenticación normal primero
      let userCredential;
      
      try {
        userCredential = await this.services.auth.signInWithEmailAndPassword(email, password);
        console.log('✅ Usuario demo autenticado desde Firebase');
      } catch (authError) {
        // Si el usuario no existe, crearlo
        if (authError.code === 'auth/user-not-found') {
          console.log('👤 Creando usuario demo:', email);
          userCredential = await this.createDemoUser(demoType, email, password);
        } else {
          throw authError;
        }
      }
      
      // Cargar o crear datos del usuario
      await this.ensureDemoUserData(userCredential.user.uid, demoType);
      
      return userCredential;
      
    } catch (error) {
      console.error('❌ Error con usuario demo:', error);
      throw error;
    }
  }

  async createDemoUser(demoType, email, password) {
    try {
      console.log(`🔨 Creando usuario demo ${demoType}:`, email);
      
      const userCredential = await this.services.auth.createUserWithEmailAndPassword(email, password);
      
      if (userCredential.user) {
        // Actualizar perfil
        await userCredential.user.updateProfile({
          displayName: DEMO_CREDENTIALS[demoType].userData.name
        });
        
        console.log('✅ Usuario demo creado exitosamente');
      }
      
      return userCredential;
      
    } catch (error) {
      console.error('❌ Error creando usuario demo:', error);
      throw error;
    }
  }

  async ensureDemoUserData(userId, demoType) {
    try {
      const userData = DEMO_CREDENTIALS[demoType].userData;
      const userDoc = this.services.db.collection(COLLECTIONS.USERS).doc(userId);
      
      // Verificar si ya existe
      const docSnap = await userDoc.get();
      
      if (!docSnap.exists) {
        // Crear documento del usuario
        await userDoc.set({
          ...userData,
          uid: userId,
          email: DEMO_CREDENTIALS[demoType].email,
          createdAt: createTimestamp(),
          lastLoginAt: createTimestamp(),
          isDemo: true
        });
        
        console.log(`✅ Datos de usuario demo ${demoType} creados`);
      } else {
        // Actualizar último login
        await userDoc.update({
          lastLoginAt: createTimestamp()
        });
      }
      
      // Cargar datos del usuario
      await this.loadUserData(userId);
      
    } catch (error) {
      console.error('❌ Error asegurando datos de usuario demo:', error);
      // No fallar la autenticación por esto
    }
  }

  async ensureDemoUsers() {
    if (this.offlineMode) {
      console.log('📱 Modo offline - omitiendo verificación de usuarios demo');
      return;
    }

    try {
      console.log('👥 Verificando usuarios demo...');
      
      for (const [type, creds] of Object.entries(DEMO_CREDENTIALS)) {
        try {
          // Verificar si el usuario existe en Auth
          const methods = await this.services.auth.fetchSignInMethodsForEmail(creds.email);
          
          if (methods.length === 0) {
            console.log(`🔨 Creando usuario demo faltante: ${type}`);
            await this.createDemoUser(type, creds.email, creds.password);
          }
          
        } catch (error) {
          if (error.code !== 'auth/user-not-found') {
            console.warn(`⚠️ Error verificando usuario demo ${type}:`, error.message);
          }
        }
      }
      
    } catch (error) {
      console.warn('⚠️ Error verificando usuarios demo:', error.message);
      // No es crítico, continuar
    }
  }

  // ===================================================================
  // UTILIDADES Y HELPERS
  // ===================================================================

  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.init();
    }
    return this.services;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  setupRetryMechanism() {
    // Auto-retry para operaciones fallidas
    this.retryQueue = [];
    this.retryTimer = null;
  }

  processPendingOperations() {
    // Procesar operaciones pendientes cuando se restaure la conexión
    if (this.pendingOperations.length > 0) {
      console.log(`🔄 Procesando ${this.pendingOperations.length} operaciones pendientes`);
      
      const operations = [...this.pendingOperations];
      this.pendingOperations = [];
      
      operations.forEach(async (operation) => {
        try {
          await operation();
        } catch (error) {
          console.warn('⚠️ Error procesando operación pendiente:', error);
        }
      });
    }
  }

  setupAuthListener() {
    this.services.auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log('👤 Usuario autenticado:', user.email);
        this.currentUser = user;
        await this.loadUserData(user.uid);
      } else {
        console.log('👤 Usuario desconectado');
        this.currentUser = null;
        this.clearUserData();
      }
    });
  }

  async checkExistingAuth() {
    const user = this.services.auth.currentUser;
    if (user) {
      console.log('👤 Usuario ya autenticado:', user.email);
      this.currentUser = user;
      await this.loadUserData(user.uid);
    }
  }

  async loadUserData(userId) {
    try {
      const userDoc = await this.services.db.collection(COLLECTIONS.USERS).doc(userId).get();
      
      if (userDoc.exists) {
        window.currentUserData = userDoc.data();
        console.log('📄 Datos de usuario cargados');
      }
      
    } catch (error) {
      console.warn('⚠️ Error cargando datos de usuario:', error);
    }
  }

  clearUserData() {
    window.currentUserData = null;
    this.cache.clear();
  }

  handleAuthError(error) {
    const errorInfo = handleFirebaseError(error);
    console.error('🔐 Error de autenticación:', errorInfo);
    return errorInfo;
  }

  // ===================================================================
  // MÉTODOS PÚBLICOS
  // ===================================================================

  async signOut() {
    try {
      if (this.services?.auth) {
        await this.services.auth.signOut();
        console.log('👋 Sesión cerrada');
      }
    } catch (error) {
      console.error('❌ Error cerrando sesión:', error);
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getConnectionState() {
    return this.connectionState;
  }

  isOffline() {
    return this.offlineMode;
  }

  getServices() {
    return this.services;
  }
}

// ===================================================================
// INSTANCIA GLOBAL Y EXPORT
// ===================================================================

const firebaseService = new OptimizedFirebaseService();

// Hacer disponible globalmente para el debugging
window.FirebaseService = firebaseService;
window.DEMO_CREDENTIALS = DEMO_CREDENTIALS;

// Auto-inicializar
firebaseService.init().catch(error => {
  console.error('❌ Error en auto-inicialización del servicio:', error);
});

export default firebaseService;