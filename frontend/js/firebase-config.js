// ===================================================================
// FIREBASE CONFIGURATION OPTIMIZADA - SOFTZEN V2.1 - COMPLETAMENTE CORREGIDA
// Enfoque: Rendimiento + Sostenibilidad + Escalabilidad + PRODUCCIÓN
// ===================================================================

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBJeqVMFusCntqBhA5RLlM5XSgsV_hOf38",
  authDomain: "pagina-yoga.firebaseapp.com",
  projectId: "pagina-yoga",
  storageBucket: "pagina-yoga.firebasestorage.app",
  messagingSenderId: "292008599562",
  appId: "1:292008599562:web:6b9a8e795306e32c7dbff3"
};

// ===================================================================
// CONSTANTES DE LA APLICACIÓN
// ===================================================================

export const COLLECTIONS = {
  USERS: 'users',
  PATIENTS: 'patients', 
  INSTRUCTORS: 'instructors',
  SESSIONS: 'sessions',
  SERIES: 'therapy_series',
  POSTURES: 'postures',
  ANALYTICS: 'analytics',
  NOTIFICATIONS: 'notifications'
};

export const STORAGE_PATHS = {
  PROFILE_IMAGES: 'profiles',
  SESSION_VIDEOS: 'sessions/videos',
  SESSION_IMAGES: 'sessions/images',
  POSTURE_IMAGES: 'postures',
  DOCUMENTS: 'documents'
};

export const USER_ROLES = {
  PATIENT: 'patient',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin'
};

export const SESSION_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  PAUSED: 'paused'
};

export const THERAPY_TYPES = {
  BACK_PAIN: 'back_pain',
  NECK_PAIN: 'neck_pain',
  STRESS_RELIEF: 'stress_relief',
  FLEXIBILITY: 'flexibility',
  STRENGTH: 'strength',
  BALANCE: 'balance',
  MEDITATION: 'meditation',
  BREATHING: 'breathing'
};

export const DIFFICULTY_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert'
};

export const CACHE_CONFIG = {
  USER_DATA_TTL: 5 * 60 * 1000, // 5 minutos
  THERAPY_DATA_TTL: 15 * 60 * 1000, // 15 minutos
  SESSION_DATA_TTL: 2 * 60 * 1000, // 2 minutos
  MAX_CACHE_SIZE: 100,
  CLEANUP_INTERVAL: 30 * 60 * 1000 // 30 minutos
};

export const PERFORMANCE_CONFIG = {
  LAZY_LOAD_THRESHOLD: '50px',
  IMAGE_QUALITY: 0.8,
  VIDEO_QUALITY: 'medium',
  BATCH_SIZE: 10,
  DEBOUNCE_DELAY: 300,
  RETRY_ATTEMPTS: 3,
  TIMEOUT: 5000
};

// ===================================================================
// ESTADO GLOBAL DE FIREBASE
// ===================================================================

// Servicios de Firebase
let firebaseApp = null;
let firebaseAuth = null;
let firebaseFirestore = null;
let firebaseStorage = null;
let firebasePerformance = null;

// Estado de inicialización
const initState = {
  initialized: false,
  initializing: false,
  promise: null,
  persistenceAttempted: false,
  firestoreConfigured: false,
  error: null
};

// ===================================================================
// INICIALIZACIÓN DE FIREBASE - COMPLETAMENTE CORREGIDA
// ===================================================================

export async function initializeFirebase() {
  // Si ya está inicializado, retornar servicios existentes
  if (initState.initialized && firebaseApp) {
    console.log('✅ Firebase ya inicializado, retornando servicios existentes');
    return getFirebaseServices();
  }

  // Si ya se está inicializando, esperar
  if (initState.initializing && initState.promise) {
    console.log('⏳ Esperando inicialización en progreso...');
    return initState.promise;
  }

  // Marcar como inicializando
  initState.initializing = true;

  // Crear promesa de inicialización
  initState.promise = new Promise(async (resolve, reject) => {
    try {
      console.log('🔥 Iniciando configuración de Firebase...');

      // PASO 1: Verificar SDK de Firebase
      await waitForFirebaseSDK();

      // PASO 2: Inicializar o reutilizar app
      if (firebase.apps && firebase.apps.length > 0) {
        firebaseApp = firebase.app();
        console.log('♻️ Reutilizando app Firebase existente');
      } else {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        console.log('🆕 Nueva app Firebase inicializada');
      }

      // PASO 3: Obtener servicios básicos
      firebaseAuth = firebase.auth();
      firebaseStorage = firebase.storage();
      
      // PASO 4: Configurar Firestore con manejo especial
      await setupFirestore();

      // PASO 5: Configurar Performance (opcional)
      setupPerformanceMonitoring();

      // PASO 6: Marcar como inicializado
      initState.initialized = true;
      initState.initializing = false;
      initState.error = null;

      console.log('✅ Firebase completamente inicializado y listo');

      // Disparar evento
      window.dispatchEvent(new CustomEvent('firebaseReady', {
        detail: { 
          app: firebaseApp,
          services: getFirebaseServices() 
        }
      }));

      resolve(getFirebaseServices());

    } catch (error) {
      console.error('❌ Error crítico inicializando Firebase:', error);
      initState.error = error;
      initState.initializing = false;
      reject(error);
    }
  });

  return initState.promise;
}

// ===================================================================
// CONFIGURACIÓN DE FIRESTORE CON MANEJO ESPECIAL
// ===================================================================

async function setupFirestore() {
  console.log('⚙️ Configurando Firestore...');
  
  // Obtener instancia de Firestore
  firebaseFirestore = firebase.firestore();
  
  // Aplicar configuración solo si no se ha hecho antes
  if (!initState.firestoreConfigured) {
    try {
      // Configuración básica
      const settings = {
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
      };
      
      // Solo aplicar settings si Firestore no ha sido usado aún
      firebaseFirestore.settings(settings);
      initState.firestoreConfigured = true;
      console.log('✅ Configuración de Firestore aplicada');
      
    } catch (error) {
      if (error.code === 'failed-precondition') {
        console.log('⚠️ Firestore ya configurado, continuando...');
        initState.firestoreConfigured = true;
      } else {
        console.warn('⚠️ Error configurando Firestore:', error.message);
      }
    }
  }
  
  // Intentar habilitar persistencia solo una vez
  if (!initState.persistenceAttempted) {
    await enablePersistence();
  }
}

// ===================================================================
// HABILITACIÓN DE PERSISTENCIA MEJORADA
// ===================================================================

async function enablePersistence() {
  initState.persistenceAttempted = true;
  
  try {
    console.log('💾 Intentando habilitar persistencia offline...');
    
    await firebaseFirestore.enablePersistence({
      synchronizeTabs: true
    });
    
    console.log('✅ Persistencia offline habilitada exitosamente');
    
  } catch (error) {
    // Manejar todos los casos de error sin fallar
    switch (error.code) {
      case 'failed-precondition':
        // Múltiples pestañas abiertas
        console.log('ℹ️ Persistencia no habilitada: múltiples pestañas activas');
        break;
        
      case 'unimplemented':
        // Navegador no soporta persistencia
        console.log('ℹ️ Persistencia no soportada en este navegador');
        break;
        
      case 'already-enabled':
        // Ya está habilitada
        console.log('ℹ️ Persistencia ya estaba habilitada');
        break;
        
      default:
        // Otro error, pero no crítico
        console.warn('⚠️ Error habilitando persistencia:', error.message);
    }
  }
}

// ===================================================================
// CONFIGURACIÓN DE PERFORMANCE MONITORING
// ===================================================================

function setupPerformanceMonitoring() {
  try {
    if (firebase.performance && typeof firebase.performance === 'function') {
      firebasePerformance = firebase.performance();
      console.log('📊 Performance Monitoring habilitado');
    }
  } catch (error) {
    console.log('ℹ️ Performance Monitoring no disponible');
  }
}

// ===================================================================
// FUNCIÓN DE ESPERA DEL SDK
// ===================================================================

function waitForFirebaseSDK() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 50; // 5 segundos

    const checkFirebase = () => {
      if (typeof firebase !== 'undefined' && 
          firebase.apps !== undefined &&
          firebase.auth !== undefined &&
          firebase.firestore !== undefined) {
        resolve();
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(checkFirebase, 100);
      } else {
        reject(new Error('Firebase SDK no se cargó en el tiempo esperado'));
      }
    };

    checkFirebase();
  });
}

// ===================================================================
// FUNCIONES PÚBLICAS
// ===================================================================

export function getFirebaseServices() {
  if (!initState.initialized) {
    console.warn('⚠️ Firebase no está inicializado aún');
    return null;
  }

  return {
    app: firebaseApp,
    auth: firebaseAuth,
    db: firebaseFirestore,
    storage: firebaseStorage,
    performance: firebasePerformance,
    initialized: true
  };
}

export function isFirebaseInitialized() {
  return initState.initialized && firebaseApp !== null;
}

export function getConnectionStatus() {
  if (!firebaseFirestore) return 'disconnected';
  return navigator.onLine ? 'connected' : 'disconnected';
}

export function handleFirebaseError(error) {
  const errorMap = {
    'auth/user-not-found': 'Usuario no encontrado',
    'auth/wrong-password': 'Contraseña incorrecta',
    'auth/email-already-in-use': 'El email ya está registrado',
    'auth/weak-password': 'La contraseña es muy débil (mínimo 6 caracteres)',
    'auth/invalid-email': 'Email inválido',
    'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
    'auth/network-request-failed': 'Error de conexión',
    'permission-denied': 'Sin permisos para esta operación',
    'unavailable': 'Servicio no disponible temporalmente',
    'deadline-exceeded': 'Tiempo de espera agotado',
    'resource-exhausted': 'Cuota excedida'
  };

  const userMessage = errorMap[error.code] || error.message || 'Error desconocido';
  
  return {
    code: error.code || 'unknown',
    message: userMessage,
    originalError: error
  };
}

// ===================================================================
// FUNCIONES DE UTILIDAD PARA FIRESTORE
// ===================================================================

export function createTimestamp() {
  return firebase.firestore.FieldValue.serverTimestamp();
}

export function createBatch() {
  const services = getFirebaseServices();
  if (!services?.db) {
    throw new Error('Firestore no está inicializado');
  }
  return services.db.batch();
}

export function arrayUnion(...elements) {
  return firebase.firestore.FieldValue.arrayUnion(...elements);
}

export function arrayRemove(...elements) {
  return firebase.firestore.FieldValue.arrayRemove(...elements);
}

export function increment(n) {
  return firebase.firestore.FieldValue.increment(n);
}

export function deleteField() {
  return firebase.firestore.FieldValue.delete();
}

// ===================================================================
// INICIALIZACIÓN AUTOMÁTICA SEGURA
// ===================================================================

async function safeAutoInitialize() {
  try {
    // Esperar un momento para que todo esté listo
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Solo inicializar si no se ha hecho
    if (!initState.initialized && !initState.initializing) {
      console.log('🚀 Auto-inicializando Firebase...');
      await initializeFirebase();
    }
  } catch (error) {
    console.error('❌ Error en auto-inicialización:', error);
    window.FIREBASE_AUTO_INIT_ERROR = error;
  }
}

// ===================================================================
// CONFIGURACIÓN GLOBAL Y EXPORTS
// ===================================================================

// Actualizar loader si existe
if (window.SOFTZEN_LOADER) {
  window.SOFTZEN_LOADER.nextStage();
}

// Hacer configuración disponible globalmente
window.firebaseConfig = firebaseConfig;

// Exportar API global
window.FirebaseConfig = {
  // Constantes
  COLLECTIONS,
  STORAGE_PATHS,
  USER_ROLES,
  SESSION_STATUS,
  THERAPY_TYPES,
  DIFFICULTY_LEVELS,
  CACHE_CONFIG,
  PERFORMANCE_CONFIG,
  
  // Funciones
  initializeFirebase,
  getFirebaseServices,
  isFirebaseInitialized,
  getConnectionStatus,
  handleFirebaseError,
  
  // Field Values
  createTimestamp,
  createBatch,
  arrayUnion,
  arrayRemove,
  increment,
  deleteField
};

// Hacer función de inicialización disponible globalmente
window.initializeFirebase = initializeFirebase;

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', safeAutoInitialize);
} else {
  safeAutoInitialize();
}

// Limpiar al cerrar/recargar
window.addEventListener('beforeunload', () => {
  console.log('🧹 Limpiando estado de Firebase...');
});

console.log('🔧 Firebase Config v2.1 cargado - Listo para inicialización segura');