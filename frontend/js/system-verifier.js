// ===================================================================
// SOFTZEN SYSTEM VERIFIER v2.1.2 - VERIFICACIÓN COMPLETA DEL SISTEMA
// ===================================================================

(function() {
  'use strict';
  
  console.log('🔍 Iniciando verificación completa del sistema SoftZen v2.1.2...');
  
  // Variables globales para tracking
  window.SOFTZEN_VERIFICATION = {
    startTime: performance.now(),
    errors: [],
    warnings: [],
    passed: [],
    results: {},
    version: '2.1.2'
  };

  // ===================================================================
  // FUNCIONES DE VERIFICACIÓN MEJORADAS
  // ===================================================================

  async function runCompleteVerification() {
    console.log('🧪 Ejecutando verificación completa...');
    
    const tests = [
      verifyFirebaseInit,
      verifyServiceWorker,
      verifyManifest,
      verifyUtilities,
      verifyAppInit,
      verifyFirebaseConnection,
      verifyCacheSystem,
      verifyPerformance,
      verifyFileSystem,
      verifyDependencies
    ];
    
    for (const test of tests) {
      try {
        await test();
        await delay(100); // Pequeña pausa entre tests
      } catch (error) {
        console.warn(`⚠️ Error en ${test.name}:`, error);
        window.SOFTZEN_VERIFICATION.errors.push({
          test: test.name,
          error: error.message,
          stack: error.stack
        });
      }
    }
    
    // Generar reporte
    generateReport();
  }

  async function verifyFirebaseInit() {
    console.log('🔥 Verificando inicialización de Firebase...');
    
    // Verificar que Firebase SDK esté cargado
    if (typeof firebase === 'undefined') {
      throw new Error('Firebase SDK no está cargado');
    }
    window.SOFTZEN_VERIFICATION.passed.push('Firebase SDK disponible');
    
    // Verificar servicios Firebase con manejo de errores mejorado
    const requiredServices = ['auth', 'firestore', 'storage'];
    requiredServices.forEach(service => {
      try {
        if (firebase[service] && typeof firebase[service] === 'function') {
          window.SOFTZEN_VERIFICATION.passed.push(`Firebase ${service} disponible`);
        } else {
          window.SOFTZEN_VERIFICATION.warnings.push(`Firebase ${service} no disponible o no es función`);
        }
      } catch (error) {
        window.SOFTZEN_VERIFICATION.warnings.push(`Error verificando Firebase ${service}: ${error.message}`);
      }
    });
    
    // Verificar configuración
    if (!window.firebaseConfig && !window.FirebaseConfig) {
      throw new Error('Firebase config no encontrada');
    }
    window.SOFTZEN_VERIFICATION.passed.push('Firebase Config disponible');
    
    // Verificar inicialización de Firebase
    try {
      if (firebase.apps && firebase.apps.length > 0) {
        window.SOFTZEN_VERIFICATION.passed.push('Firebase correctamente inicializado');
      } else {
        window.SOFTZEN_VERIFICATION.warnings.push('Firebase no tiene apps inicializadas');
      }
    } catch (error) {
      window.SOFTZEN_VERIFICATION.warnings.push(`Error verificando apps Firebase: ${error.message}`);
    }
    
    // Verificar Firebase Service con manejo de errores mejorado
    if (window.FirebaseService) {
      window.SOFTZEN_VERIFICATION.passed.push('Firebase Service disponible');
      
      try {
        if (window.FirebaseService.isInitialized && window.FirebaseService.isInitialized()) {
          window.SOFTZEN_VERIFICATION.passed.push('Firebase Service completamente inicializado');
        } else if (window.FirebaseService.getServices && window.FirebaseService.getServices()) {
          window.SOFTZEN_VERIFICATION.passed.push('Firebase Service funcionando');
        } else {
          window.SOFTZEN_VERIFICATION.warnings.push('Firebase Service no completamente inicializado');
        }
      } catch (error) {
        window.SOFTZEN_VERIFICATION.warnings.push(`Error verificando Firebase Service: ${error.message}`);
      }
    } else {
      window.SOFTZEN_VERIFICATION.warnings.push('Firebase Service no disponible');
    }
  }

  async function verifyServiceWorker() {
    console.log('⚙️ Verificando Service Worker...');
    
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length > 0) {
          window.SOFTZEN_VERIFICATION.passed.push(`Service Worker registrado (${registrations.length})`);
          
          // Verificar estado con manejo de errores
          registrations.forEach(reg => {
            if (reg.active) {
              window.SOFTZEN_VERIFICATION.passed.push('Service Worker activo');
            } else if (reg.installing) {
              window.SOFTZEN_VERIFICATION.warnings.push('Service Worker instalando');
            } else if (reg.waiting) {
              window.SOFTZEN_VERIFICATION.warnings.push('Service Worker esperando');
            }
          });
          
          // Verificar cache con manejo de errores mejorado
          if ('caches' in window) {
            try {
              const cacheNames = await caches.keys();
              window.SOFTZEN_VERIFICATION.passed.push(`Cache del Service Worker activo (${cacheNames.length} caches)`);
              
              // Verificar caches específicos de SoftZen
              const softzenCaches = cacheNames.filter(name => name.includes('softzen'));
              if (softzenCaches.length > 0) {
                window.SOFTZEN_VERIFICATION.passed.push(`Caches SoftZen encontrados: ${softzenCaches.length}`);
              }
            } catch (cacheError) {
              window.SOFTZEN_VERIFICATION.warnings.push(`Error verificando caches: ${cacheError.message}`);
            }
          }
        } else {
          window.SOFTZEN_VERIFICATION.warnings.push('Service Worker no registrado');
        }
      } catch (error) {
        window.SOFTZEN_VERIFICATION.warnings.push(`Error verificando Service Worker: ${error.message}`);
      }
    } else {
      window.SOFTZEN_VERIFICATION.warnings.push('Service Worker no soportado');
    }
  }

  async function verifyManifest() {
    console.log('📋 Verificando Manifest...');
    
    try {
      const response = await fetch('/manifest.json');
      if (response.ok) {
        const manifest = await response.json();
        window.SOFTZEN_VERIFICATION.passed.push(`Manifest cargado: ${manifest.name || 'Sin nombre'}`);
        
        // Verificar campos críticos con manejo detallado
        const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
        const missingFields = [];
        const presentFields = [];
        
        requiredFields.forEach(field => {
          if (manifest[field]) {
            presentFields.push(field);
          } else {
            missingFields.push(field);
          }
        });
        
        if (presentFields.length > 0) {
          window.SOFTZEN_VERIFICATION.passed.push(`Campos presentes en manifest: ${presentFields.join(', ')}`);
        }
        
        if (missingFields.length > 0) {
          window.SOFTZEN_VERIFICATION.warnings.push(`Campos faltantes en manifest: ${missingFields.join(', ')}`);
        }
        
        // Verificar iconos
        if (manifest.icons && manifest.icons.length > 0) {
          window.SOFTZEN_VERIFICATION.passed.push(`Iconos configurados: ${manifest.icons.length}`);
        } else {
          window.SOFTZEN_VERIFICATION.warnings.push('No se encontraron iconos en el manifest');
        }
      } else {
        throw new Error(`Manifest no disponible (${response.status})`);
      }
    } catch (error) {
      window.SOFTZEN_VERIFICATION.errors.push({
        test: 'Manifest',
        error: error.message
      });
    }
  }

  async function verifyUtilities() {
    console.log('🛠️ Verificando utilidades...');
    
    const utilities = [
      { name: 'NotificationManager', global: 'NotificationManager' },
      { name: 'ModalManager', global: 'ModalManager' },
      { name: 'LoadingManager', global: 'LoadingManager' },
      { name: 'FormValidator', global: 'FormValidator' },
      { name: 'ResponsiveManager', global: 'ResponsiveManager' }
    ];
    
    utilities.forEach(util => {
      try {
        const isAvailable = window[util.global] || 
                          (window.SoftZenUtils && window.SoftZenUtils[util.name]) ||
                          (window.Utils && window.Utils[util.name]);
        
        if (isAvailable) {
          window.SOFTZEN_VERIFICATION.passed.push(`${util.name} disponible`);
          
          // Verificar funcionalidad básica si es posible
          if (window[util.global] && typeof window[util.global].show === 'function') {
            window.SOFTZEN_VERIFICATION.passed.push(`${util.name} funcionando`);
          }
        } else {
          window.SOFTZEN_VERIFICATION.warnings.push(`${util.name} no disponible`);
        }
      } catch (error) {
        window.SOFTZEN_VERIFICATION.warnings.push(`Error verificando ${util.name}: ${error.message}`);
      }
    });
  }

  async function verifyAppInit() {
    console.log('📱 Verificando inicialización de la app...');
    
    // Verificar múltiples formas de inicialización de la app
    const appSources = [
      { name: 'window.app', source: () => window.app },
      { name: 'window.SoftZenApp', source: () => window.SoftZenApp },
      { name: 'window.Application', source: () => window.Application }
    ];
    
    let appFound = false;
    
    for (const appSource of appSources) {
      try {
        const app = appSource.source();
        if (app) {
          window.SOFTZEN_VERIFICATION.passed.push(`${appSource.name} disponible`);
          appFound = true;
          
          // Verificar propiedades de inicialización
          if (app.isInitialized || app.initialized) {
            window.SOFTZEN_VERIFICATION.passed.push('App principal inicializada');
          }
          
          if (app.isFullyInitialized) {
            window.SOFTZEN_VERIFICATION.passed.push('App completamente inicializada');
          }
          
          break;
        }
      } catch (error) {
        window.SOFTZEN_VERIFICATION.warnings.push(`Error verificando ${appSource.name}: ${error.message}`);
      }
    }
    
    if (!appFound) {
      window.SOFTZEN_VERIFICATION.warnings.push('No se encontró instancia de la aplicación');
    }
    
    // Verificar loader con manejo de errores mejorado
    if (window.SOFTZEN_LOADER) {
      window.SOFTZEN_VERIFICATION.passed.push('Sistema de carga disponible');
      
      try {
        if (window.SOFTZEN_LOADER.isCompleted) {
          window.SOFTZEN_VERIFICATION.passed.push('Carga completada');
        } else if (window.SOFTZEN_LOADER.progress) {
          window.SOFTZEN_VERIFICATION.warnings.push(`Carga en progreso: ${window.SOFTZEN_LOADER.progress}%`);
        }
      } catch (error) {
        window.SOFTZEN_VERIFICATION.warnings.push(`Error verificando loader: ${error.message}`);
      }
    }
  }

  async function verifyFirebaseConnection() {
    console.log('🌐 Verificando conexión a Firebase...');
    
    try {
      // Método 1: Verificar a través de FirebaseConfig
      if (window.FirebaseConfig && window.FirebaseConfig.getFirebaseServices) {
        const services = window.FirebaseConfig.getFirebaseServices();
        if (services && services.db) {
          try {
            // Test de conectividad muy básico
            await services.db.enableNetwork();
            window.SOFTZEN_VERIFICATION.passed.push('Conexión a Firebase exitosa');
          } catch (netError) {
            if (netError.code === 'failed-precondition') {
              window.SOFTZEN_VERIFICATION.passed.push('Firebase ya conectado');
            } else {
              window.SOFTZEN_VERIFICATION.warnings.push(`Problema de red con Firebase: ${netError.message}`);
            }
          }
        }
      }
      
      // Método 2: Verificar a través de FirebaseService
      if (window.FirebaseService) {
        try {
          const connectionState = window.FirebaseService.getConnectionState ? 
                                 window.FirebaseService.getConnectionState() : 'unknown';
          
          if (connectionState === 'connected') {
            window.SOFTZEN_VERIFICATION.passed.push('Firebase Service conectado');
          } else if (connectionState === 'offline') {
            window.SOFTZEN_VERIFICATION.warnings.push('Firebase Service en modo offline');
          } else {
            window.SOFTZEN_VERIFICATION.warnings.push(`Firebase Service estado: ${connectionState}`);
          }
        } catch (error) {
          window.SOFTZEN_VERIFICATION.warnings.push(`Error verificando estado Firebase Service: ${error.message}`);
        }
      }
      
      // Método 3: Verificar Firebase apps directamente
      if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
        window.SOFTZEN_VERIFICATION.passed.push('Firebase apps activas');
        
        // Verificar auth state
        try {
          const auth = firebase.auth();
          if (auth) {
            const user = auth.currentUser;
            if (user) {
              window.SOFTZEN_VERIFICATION.passed.push(`Usuario autenticado: ${user.email}`);
            } else {
              window.SOFTZEN_VERIFICATION.passed.push('Firebase Auth disponible (no autenticado)');
            }
          }
        } catch (authError) {
          window.SOFTZEN_VERIFICATION.warnings.push(`Error verificando Firebase Auth: ${authError.message}`);
        }
      }
      
    } catch (error) {
      window.SOFTZEN_VERIFICATION.warnings.push(`Error general verificando Firebase: ${error.message}`);
    }
  }

  async function verifyCacheSystem() {
    console.log('💾 Verificando sistema de cache...');
    
    // Verificar localStorage con manejo de errores
    try {
      const testKey = 'softzen_test_' + Date.now();
      localStorage.setItem(testKey, 'test');
      const value = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (value === 'test') {
        window.SOFTZEN_VERIFICATION.passed.push('localStorage funcionando');
      } else {
        window.SOFTZEN_VERIFICATION.warnings.push('localStorage no retorna valores correctos');
      }
    } catch (error) {
      window.SOFTZEN_VERIFICATION.warnings.push(`localStorage no disponible: ${error.message}`);
    }
    
    // Verificar sessionStorage con manejo de errores
    try {
      const testKey = 'softzen_test_' + Date.now();
      sessionStorage.setItem(testKey, 'test');
      const value = sessionStorage.getItem(testKey);
      sessionStorage.removeItem(testKey);
      
      if (value === 'test') {
        window.SOFTZEN_VERIFICATION.passed.push('sessionStorage funcionando');
      } else {
        window.SOFTZEN_VERIFICATION.warnings.push('sessionStorage no retorna valores correctos');
      }
    } catch (error) {
      window.SOFTZEN_VERIFICATION.warnings.push(`sessionStorage no disponible: ${error.message}`);
    }
    
    // Verificar cache de Service Worker con detalles
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        if (cacheNames.length > 0) {
          window.SOFTZEN_VERIFICATION.passed.push(`Sistema de cache activo (${cacheNames.length} caches)`);
          
          // Verificar contenido de caches
          let totalCachedItems = 0;
          for (const cacheName of cacheNames) {
            try {
              const cache = await caches.open(cacheName);
              const keys = await cache.keys();
              totalCachedItems += keys.length;
            } catch (cacheError) {
              window.SOFTZEN_VERIFICATION.warnings.push(`Error accediendo cache ${cacheName}: ${cacheError.message}`);
            }
          }
          
          if (totalCachedItems > 0) {
            window.SOFTZEN_VERIFICATION.passed.push(`Total de elementos cacheados: ${totalCachedItems}`);
          }
        } else {
          window.SOFTZEN_VERIFICATION.warnings.push('No hay caches disponibles');
        }
      } catch (error) {
        window.SOFTZEN_VERIFICATION.warnings.push(`Error verificando caches: ${error.message}`);
      }
    } else {
      window.SOFTZEN_VERIFICATION.warnings.push('API Cache no disponible');
    }
  }

  async function verifyPerformance() {
    console.log('⚡ Verificando rendimiento...');
    
    const loadTime = performance.now() - window.SOFTZEN_VERIFICATION.startTime;
    
    // Categorizar tiempo de carga
    if (loadTime < 100) {
      window.SOFTZEN_VERIFICATION.passed.push(`Verificación muy rápida: ${loadTime.toFixed(2)}ms`);
    } else if (loadTime < 500) {
      window.SOFTZEN_VERIFICATION.passed.push(`Verificación rápida: ${loadTime.toFixed(2)}ms`);
    } else if (loadTime < 2000) {
      window.SOFTZEN_VERIFICATION.warnings.push(`Verificación lenta: ${loadTime.toFixed(2)}ms`);
    } else {
      window.SOFTZEN_VERIFICATION.warnings.push(`Verificación muy lenta: ${loadTime.toFixed(2)}ms`);
    }
    
    // Verificar memoria si está disponible
    if (performance.memory) {
      const usedMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
      const totalMB = Math.round(performance.memory.totalJSHeapSize / 1024 / 1024);
      
      if (usedMB < 50) {
        window.SOFTZEN_VERIFICATION.passed.push(`Uso de memoria eficiente: ${usedMB}MB`);
      } else if (usedMB < 100) {
        window.SOFTZEN_VERIFICATION.warnings.push(`Uso de memoria moderado: ${usedMB}MB`);
      } else {
        window.SOFTZEN_VERIFICATION.warnings.push(`Alto uso de memoria: ${usedMB}MB`);
      }
      
      window.SOFTZEN_VERIFICATION.passed.push(`Memoria total disponible: ${totalMB}MB`);
    }
    
    // Verificar responsive
    try {
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1
      };
      
      let deviceType = 'unknown';
      if (viewport.width < 768) deviceType = 'mobile';
      else if (viewport.width < 1024) deviceType = 'tablet';
      else deviceType = 'desktop';
      
      window.SOFTZEN_VERIFICATION.passed.push(`Sistema responsive funcionando: ${deviceType}`);
      
      if (window.ResponsiveManager && typeof window.ResponsiveManager.getCurrentBreakpoint === 'function') {
        const breakpoint = window.ResponsiveManager.getCurrentBreakpoint();
        window.SOFTZEN_VERIFICATION.passed.push(`Breakpoint detectado: ${breakpoint}`);
      }
    } catch (error) {
      window.SOFTZEN_VERIFICATION.warnings.push(`Error verificando responsive: ${error.message}`);
    }
  }

  async function verifyFileSystem() {
    console.log('📁 Verificando archivos críticos...');
    
    const criticalFiles = [
      '/app.js',
      '/styles.css',
      '/sw.js',
      '/js/firebase-config.js',
      '/js/firebase-service.js',
      '/js/utils.js'
    ];
    
    const fileResults = {
      available: [],
      unavailable: [],
      errors: []
    };
    
    for (const file of criticalFiles) {
      try {
        const response = await fetch(file, { method: 'HEAD' });
        if (response.ok) {
          fileResults.available.push(file);
          window.SOFTZEN_VERIFICATION.passed.push(`${file} disponible`);
        } else {
          fileResults.unavailable.push(file);
          window.SOFTZEN_VERIFICATION.errors.push({
            test: 'File System',
            error: `${file} no disponible (${response.status})`
          });
        }
      } catch (error) {
        fileResults.errors.push(file);
        window.SOFTZEN_VERIFICATION.errors.push({
          test: 'File System',
          error: `Error verificando ${file}: ${error.message}`
        });
      }
    }
    
    // Resumen de archivos
    const totalFiles = criticalFiles.length;
    const availableCount = fileResults.available.length;
    const successRate = ((availableCount / totalFiles) * 100).toFixed(1);
    
    if (availableCount === totalFiles) {
      window.SOFTZEN_VERIFICATION.passed.push('Todos los archivos críticos disponibles');
    } else {
      window.SOFTZEN_VERIFICATION.warnings.push(`${availableCount}/${totalFiles} archivos disponibles (${successRate}%)`);
    }
  }

  async function verifyDependencies() {
    console.log('📦 Verificando dependencias...');
    
    // Verificar si todas las dependencias críticas están cargadas
    const dependencies = {
      'Firebase App': () => typeof firebase !== 'undefined' && firebase.apps,
      'Firebase Auth': () => typeof firebase !== 'undefined' && firebase.auth,
      'Firebase Firestore': () => typeof firebase !== 'undefined' && firebase.firestore,
      'Firebase Storage': () => typeof firebase !== 'undefined' && firebase.storage,
      'SoftZen App': () => window.SoftZenApp || window.app,
      'SoftZen Utils': () => window.SoftZenUtils || window.NotificationManager
    };
    
    let totalDeps = 0;
    let loadedDeps = 0;
    
    for (const [name, check] of Object.entries(dependencies)) {
      totalDeps++;
      try {
        if (check()) {
          loadedDeps++;
          window.SOFTZEN_VERIFICATION.passed.push(`${name} cargado correctamente`);
        } else {
          window.SOFTZEN_VERIFICATION.warnings.push(`${name} no cargado`);
        }
      } catch (error) {
        window.SOFTZEN_VERIFICATION.errors.push({
          test: 'Dependencies',
          error: `Error verificando ${name}: ${error.message}`
        });
      }
    }
    
    const depSuccessRate = ((loadedDeps / totalDeps) * 100).toFixed(1);
    window.SOFTZEN_VERIFICATION.passed.push(`Dependencias cargadas: ${loadedDeps}/${totalDeps} (${depSuccessRate}%)`);
  }

  function generateReport() {
    const verification = window.SOFTZEN_VERIFICATION;
    const totalTime = performance.now() - verification.startTime;
    
    console.log('\n============================================================');
    console.log('📊 REPORTE DE VERIFICACIÓN COMPLETA - SOFTZEN V2.1');
    console.log('============================================================');
    
    if (verification.passed.length > 0) {
      console.log('\n✅ TESTS PASADOS (' + verification.passed.length + '):');
      verification.passed.forEach(test => console.log('  ✅ ' + test));
    }
    
    if (verification.warnings.length > 0) {
      console.log('\n⚠️ ADVERTENCIAS (' + verification.warnings.length + '):');
      verification.warnings.forEach(warning => console.log('  ⚠️ ' + warning));
    }
    
    if (verification.errors.length > 0) {
      console.log('\n❌ ERRORES (' + verification.errors.length + '):');
      verification.errors.forEach(error => {
        if (typeof error === 'object' && error.test) {
          console.log('  ❌ ' + error.test + ': ' + error.error);
        } else {
          console.log('  ❌ ' + error);
        }
      });
    }
    
    const totalTests = verification.passed.length + verification.warnings.length + verification.errors.length;
    const successRate = totalTests > 0 ? ((verification.passed.length / totalTests) * 100).toFixed(1) : '0.0';
    
    console.log('\n📈 RESUMEN:');
    console.log(`  • Total de verificaciones: ${totalTests}`);
    console.log(`  • Éxito: ${successRate}%`);
    console.log(`  • Tiempo total: ${totalTime.toFixed(2)}ms`);
    
    if (verification.errors.length === 0) {
      console.log('\n🎉 ¡Sistema funcionando correctamente!');
      
      // Si todo está bien, aplicar correcciones automáticas
      if (verification.warnings.length > 0) {
        console.log('\n🔧 Aplicando correcciones automáticas para advertencias...');
        applyAutoFixes();
      }
    } else {
      console.log('\n⚠️ Se encontraron problemas que requieren atención.');
      console.log('🔧 Intentando aplicar correcciones automáticas...');
      applyAutoFixes();
    }
    
    console.log('============================================================\n');
    
    // Guardar resultados
    verification.results = {
      passed: verification.passed.length,
      warnings: verification.warnings.length,
      errors: verification.errors.length,
      successRate: parseFloat(successRate),
      totalTime: totalTime,
      timestamp: new Date().toISOString()
    };
    
    // Retornar resultados
    return verification.results;
  }

  function applyAutoFixes() {
    const fixes = [];
    
    try {
      // Fix: Firebase no inicializado completamente
      if (!window.FirebaseConfig?.isFirebaseInitialized || !window.FirebaseConfig.isFirebaseInitialized()) {
        if (window.initializeFirebase) {
          console.log('🔧 Reiniciando Firebase...');
          window.initializeFirebase().catch(console.error);
          fixes.push('Firebase reiniciado');
        }
      }
      
      // Fix: App no inicializada
      if (!window.app && window.SoftZenApp) {
        console.log('🔧 Intentando reiniciar la aplicación...');
        try {
          if (typeof window.SoftZenApp === 'function') {
            window.app = new window.SoftZenApp();
            fixes.push('App reiniciada');
          } else if (window.SoftZenApp.init) {
            window.SoftZenApp.init();
            fixes.push('App inicializada');
          }
        } catch (appError) {
          console.warn('⚠️ Error reiniciando app:', appError);
        }
      }
      
      // Fix: Service Worker no registrado
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
          if (regs.length === 0) {
            console.log('🔧 Registrando Service Worker...');
            navigator.serviceWorker.register('/sw.js').then(() => {
              fixes.push('Service Worker registrado');
            }).catch(swError => {
              console.warn('⚠️ Error registrando Service Worker:', swError);
            });
          }
        }).catch(console.warn);
      }
      
      // Fix: Loader incompleto
      if (window.SOFTZEN_LOADER && !window.SOFTZEN_LOADER.isCompleted) {
        console.log('🔧 Completando carga forzada...');
        try {
          if (typeof window.SOFTZEN_LOADER.complete === 'function') {
            window.SOFTZEN_LOADER.complete();
            fixes.push('Carga completada forzadamente');
          }
        } catch (loaderError) {
          console.warn('⚠️ Error completando loader:', loaderError);
        }
      }
      
    } catch (fixError) {
      console.warn('⚠️ Error aplicando correcciones automáticas:', fixError);
    }
    
    if (fixes.length > 0) {
      console.log(`✅ ${fixes.length} correcciones aplicadas:`, fixes);
    } else {
      console.log('ℹ️ No se encontraron correcciones automáticas aplicables');
    }
  }

  // Función de utilidad para delays
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ===================================================================
  // API PÚBLICA
  // ===================================================================

  window.runSoftZenVerification = async function() {
    console.clear();
    console.log(`
    ╔═══════════════════════════════════════════════════════════╗
    ║          SOFTZEN SYSTEM VERIFIER v2.1                     ║
    ║          Verificación Completa del Sistema                ║
    ╚═══════════════════════════════════════════════════════════╝
    `);
    
    try {
      await runCompleteVerification();
      return window.SOFTZEN_VERIFICATION.results;
    } catch (error) {
      console.error('❌ Error en verificación:', error);
      return {
        passed: 0,
        warnings: 0,
        errors: 1,
        successRate: 0,
        totalTime: performance.now() - window.SOFTZEN_VERIFICATION.startTime,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  };
  
  // Auto-ejecutar si se solicita
  if (window.location.search.includes('verify=true')) {
    setTimeout(() => runSoftZenVerification(), 2000);
  }

  // Si el sistema no está completamente cargado, verificar después de la carga
  if (document.readyState !== 'complete') {
    window.addEventListener('load', () => {
      setTimeout(() => {
        if (window.SOFTZEN_VERIFICATION.errors.length > 0) {
          console.log('🔄 Re-verificando después de la carga completa...');
          runSoftZenVerification();
        }
      }, 3000);
    });
  }

  console.log('🔍 Sistema de verificación SoftZen v2.1.2 cargado');
  console.log('💡 Ejecuta "runSoftZenVerification()" para verificación manual');

})();