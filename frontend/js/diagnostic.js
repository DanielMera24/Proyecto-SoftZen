// ===================================================================
// SOFTZEN DIAGNOSTIC SYSTEM v2.1 - SISTEMA DE DIAGNÓSTICO COMPLETO
// ===================================================================

(function() {
  'use strict';
  
  console.log('🔧 Iniciando diagnóstico de SoftZen...');
  
  // Variables globales para diagnóstico
  window.SOFTZEN_DIAGNOSTIC = {
    startTime: performance.now(),
    tests: [],
    errors: [],
    warnings: [],
    fixes: [],
    status: 'running'
  };

  // ===================================================================
  // SISTEMA DE DIAGNÓSTICO PRINCIPAL
  // ===================================================================

  async function runSoftZenDiagnostic() {
    console.log('🔍 Ejecutando diagnóstico completo...');
    
    // Limpiar resultados anteriores
    window.SOFTZEN_DIAGNOSTIC.tests = [];
    window.SOFTZEN_DIAGNOSTIC.errors = [];
    window.SOFTZEN_DIAGNOSTIC.warnings = [];
    window.SOFTZEN_DIAGNOSTIC.fixes = [];
    window.SOFTZEN_DIAGNOSTIC.status = 'running';
    
    // Ejecutar todas las pruebas
    await testBrowserFeatures();
    await testFirebaseAvailability();
    await testLocalStorage();
    await testServiceWorker();
    await testResourcesAvailability();
    await testConnectionStatus();
    await testMemoryUsage();
    
    // Generar reporte
    generateDiagnosticReport();
    
    // Aplicar correcciones automáticas
    await applyAutoFixes();
    
    window.SOFTZEN_DIAGNOSTIC.status = 'completed';
    
    return window.SOFTZEN_DIAGNOSTIC;
  }

  // ===================================================================
  // PRUEBAS DE DIAGNÓSTICO
  // ===================================================================

  async function testBrowserFeatures() {
    console.log('🌐 Verificando características del navegador...');
    
    const features = {
      'ES6 Modules': typeof import !== 'undefined',
      'Fetch API': typeof fetch !== 'undefined',
      'Local Storage': typeof localStorage !== 'undefined',
      'Service Worker': 'serviceWorker' in navigator,
      'Intersection Observer': typeof IntersectionObserver !== 'undefined',
      'CSS Grid': CSS.supports('display', 'grid'),
      'CSS Custom Properties': CSS.supports('--test', 'value'),
      'Web Workers': typeof Worker !== 'undefined',
      'IndexedDB': 'indexedDB' in window,
      'WebP Support': await checkWebPSupport()
    };
    
    for (const [feature, supported] of Object.entries(features)) {
      if (supported) {
        window.SOFTZEN_DIAGNOSTIC.tests.push(`✅ ${feature} soportado`);
      } else {
        window.SOFTZEN_DIAGNOSTIC.warnings.push(`⚠️ ${feature} no soportado`);
      }
    }
  }

  async function testFirebaseAvailability() {
    console.log('🔥 Verificando Firebase...');
    
    // Verificar SDK
    if (typeof firebase !== 'undefined') {
      window.SOFTZEN_DIAGNOSTIC.tests.push('✅ Firebase SDK disponible');
      
      // Verificar servicios
      const services = ['auth', 'firestore', 'storage'];
      services.forEach(service => {
        if (firebase[service]) {
          window.SOFTZEN_DIAGNOSTIC.tests.push(`✅ Firebase ${service} disponible`);
        } else {
          window.SOFTZEN_DIAGNOSTIC.errors.push(`❌ Firebase ${service} no disponible`);
        }
      });
      
      // Verificar configuración
      if (window.firebaseConfig) {
        window.SOFTZEN_DIAGNOSTIC.tests.push('✅ Firebase config presente');
      } else {
        window.SOFTZEN_DIAGNOSTIC.errors.push('❌ Firebase config no encontrada');
      }
      
      // Verificar inicialización
      if (window.FirebaseConfig && window.FirebaseConfig.isFirebaseInitialized) {
        if (window.FirebaseConfig.isFirebaseInitialized()) {
          window.SOFTZEN_DIAGNOSTIC.tests.push('✅ Firebase inicializado correctamente');
        } else {
          window.SOFTZEN_DIAGNOSTIC.warnings.push('⚠️ Firebase no completamente inicializado');
        }
      }
      
    } else {
      window.SOFTZEN_DIAGNOSTIC.errors.push('❌ Firebase SDK no cargado');
    }
  }

  async function testLocalStorage() {
    console.log('💾 Verificando almacenamiento local...');
    
    try {
      const testKey = 'softzen_diagnostic_test';
      localStorage.setItem(testKey, 'test');
      const value = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (value === 'test') {
        window.SOFTZEN_DIAGNOSTIC.tests.push('✅ Local Storage funcionando');
      } else {
        window.SOFTZEN_DIAGNOSTIC.errors.push('❌ Local Storage error de lectura');
      }
    } catch (error) {
      window.SOFTZEN_DIAGNOSTIC.errors.push('❌ Local Storage no disponible: ' + error.message);
    }
    
    // Verificar espacio disponible
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const percentUsed = (estimate.usage / estimate.quota * 100).toFixed(2);
        window.SOFTZEN_DIAGNOSTIC.tests.push(`✅ Almacenamiento: ${percentUsed}% usado`);
      }
    } catch (error) {
      console.warn('No se pudo estimar el almacenamiento:', error);
    }
  }

  async function testServiceWorker() {
    console.log('⚙️ Verificando Service Worker...');
    
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        
        if (registrations.length > 0) {
          window.SOFTZEN_DIAGNOSTIC.tests.push(`✅ Service Worker registrado (${registrations.length})`);
          
          // Verificar estado
          registrations.forEach(reg => {
            if (reg.active) {
              window.SOFTZEN_DIAGNOSTIC.tests.push('✅ Service Worker activo');
            }
            if (reg.waiting) {
              window.SOFTZEN_DIAGNOSTIC.warnings.push('⚠️ Service Worker esperando actualización');
            }
          });
        } else {
          window.SOFTZEN_DIAGNOSTIC.warnings.push('⚠️ Service Worker no registrado');
        }
        
      } catch (error) {
        window.SOFTZEN_DIAGNOSTIC.errors.push('❌ Error verificando Service Worker: ' + error.message);
      }
    } else {
      window.SOFTZEN_DIAGNOSTIC.warnings.push('⚠️ Service Worker no soportado en este navegador');
    }
  }

  async function testResourcesAvailability() {
    console.log('📁 Verificando recursos...');
    
    const criticalResources = [
      { url: '/manifest.json', name: 'Manifest' },
      { url: '/styles.css', name: 'Estilos' },
      { url: '/app.js', name: 'App principal' },
      { url: '/js/firebase-config.js', name: 'Firebase Config' },
      { url: '/js/firebase-service.js', name: 'Firebase Service' },
      { url: '/js/utils.js', name: 'Utilidades' },
      { url: '/sw.js', name: 'Service Worker' }
    ];
    
    for (const resource of criticalResources) {
      try {
        const response = await fetch(resource.url, { method: 'HEAD' });
        if (response.ok) {
          window.SOFTZEN_DIAGNOSTIC.tests.push(`✅ ${resource.url} disponible`);
        } else {
          window.SOFTZEN_DIAGNOSTIC.errors.push(`❌ ${resource.name} no disponible (${response.status})`);
        }
      } catch (error) {
        window.SOFTZEN_DIAGNOSTIC.errors.push(`❌ Error verificando ${resource.name}: ${error.message}`);
      }
    }
  }

  async function testConnectionStatus() {
    console.log('🌐 Verificando conexión...');
    
    if (navigator.onLine) {
      window.SOFTZEN_DIAGNOSTIC.tests.push('✅ Conexión a internet disponible');
      
      // Test de latencia
      try {
        const start = performance.now();
        await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' });
        const latency = performance.now() - start;
        
        if (latency < 500) {
          window.SOFTZEN_DIAGNOSTIC.tests.push(`✅ Latencia buena: ${latency.toFixed(0)}ms`);
        } else if (latency < 1000) {
          window.SOFTZEN_DIAGNOSTIC.warnings.push(`⚠️ Latencia moderada: ${latency.toFixed(0)}ms`);
        } else {
          window.SOFTZEN_DIAGNOSTIC.warnings.push(`⚠️ Latencia alta: ${latency.toFixed(0)}ms`);
        }
      } catch (error) {
        console.warn('No se pudo medir latencia:', error);
      }
      
    } else {
      window.SOFTZEN_DIAGNOSTIC.warnings.push('⚠️ Sin conexión a internet');
    }
    
    // Información de conexión
    if ('connection' in navigator) {
      const conn = navigator.connection;
      window.SOFTZEN_DIAGNOSTIC.tests.push(`✅ Tipo de conexión: ${conn.effectiveType || 'desconocido'}`);
    }
  }

  async function testMemoryUsage() {
    console.log('💾 Verificando uso de memoria...');
    
    if ('memory' in performance) {
      const memory = performance.memory;
      const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
      const totalMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
      const limitMB = (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2);
      
      window.SOFTZEN_DIAGNOSTIC.tests.push(`✅ Memoria: ${usedMB}MB / ${totalMB}MB (límite: ${limitMB}MB)`);
      
      const percentUsed = (memory.usedJSHeapSize / memory.jsHeapSizeLimit * 100);
      if (percentUsed > 90) {
        window.SOFTZEN_DIAGNOSTIC.errors.push('❌ Uso crítico de memoria (>90%)');
      } else if (percentUsed > 70) {
        window.SOFTZEN_DIAGNOSTIC.warnings.push('⚠️ Uso alto de memoria (>70%)');
      }
    }
  }

  // ===================================================================
  // UTILIDADES
  // ===================================================================

  async function checkWebPSupport() {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = function () {
        resolve(webP.height === 2);
      };
      webP.src = "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA";
    });
  }

  // ===================================================================
  // GENERACIÓN DE REPORTE
  // ===================================================================

  function generateDiagnosticReport() {
    const diag = window.SOFTZEN_DIAGNOSTIC;
    const totalTime = performance.now() - diag.startTime;
    
    console.log('\n📊 REPORTE DE DIAGNÓSTICO');
    console.log('========================');
    
    if (diag.errors.length > 0) {
      console.log('\n❌ PROBLEMAS CRÍTICOS:');
      diag.errors.forEach(error => console.log('  ' + error));
    }
    
    if (diag.warnings.length > 0) {
      console.log('\n⚠️ ADVERTENCIAS:');
      diag.warnings.forEach(warning => console.log('  ' + warning));
    }
    
    if (diag.tests.length > 0) {
      console.log('\n✅ PRUEBAS EXITOSAS:');
      diag.tests.forEach(test => console.log('  ' + test));
    }
    
    const totalTests = diag.tests.length + diag.warnings.length + diag.errors.length;
    const successRate = ((diag.tests.length / totalTests) * 100).toFixed(1);
    
    console.log('\n📈 RESUMEN:');
    console.log(`  • Total de pruebas: ${totalTests}`);
    console.log(`  • Éxito: ${successRate}%`);
    console.log(`  • Tiempo de diagnóstico: ${totalTime.toFixed(2)}ms`);
    
    if (diag.errors.length === 0 && diag.warnings.length === 0) {
      console.log('\n🎉 ¡Sistema funcionando perfectamente!');
    } else if (diag.errors.length === 0) {
      console.log('\n✅ Sistema funcional con advertencias menores');
    } else {
      console.log('\n⚠️ Se requiere atención para resolver problemas críticos');
    }
  }

  // ===================================================================
  // CORRECCIONES AUTOMÁTICAS
  // ===================================================================

  async function applyAutoFixes() {
    console.log('\n🔧 Aplicando correcciones automáticas...');
    
    const fixes = window.SOFTZEN_DIAGNOSTIC.fixes;
    
    // Fix: Service Worker no registrado
    if (window.SOFTZEN_DIAGNOSTIC.warnings.some(w => w.includes('Service Worker no registrado'))) {
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.register('/sw.js');
          fixes.push('✅ Service Worker registrado automáticamente');
        }
      } catch (error) {
        console.error('Error registrando Service Worker:', error);
      }
    }
    
    // Fix: Firebase no inicializado
    if (window.SOFTZEN_DIAGNOSTIC.warnings.some(w => w.includes('Firebase no completamente inicializado'))) {
      try {
        if (window.initializeFirebase) {
          await window.initializeFirebase();
          fixes.push('✅ Firebase reinicializado');
        }
      } catch (error) {
        console.error('Error reinicializando Firebase:', error);
      }
    }
    
    // Fix: Configurar manejo de errores global
    if (!window.onerror) {
      window.onerror = function(msg, url, lineNo, columnNo, error) {
        console.error('Error global:', msg, 'en', url, 'línea', lineNo);
        return true;
      };
      fixes.push('✅ Manejo de errores global configurado');
    }
    
    // Fix: Configurar modo offline si no hay conexión
    if (!navigator.onLine) {
      if (window.app && window.app.enableOfflineMode) {
        window.app.enableOfflineMode();
        fixes.push('✅ Modo offline activado');
      }
    }
    
    if (fixes.length > 0) {
      console.log('\n✅ Correcciones aplicadas:');
      fixes.forEach(fix => console.log('  ' + fix));
    } else {
      console.log('ℹ️ No se requirieron correcciones automáticas');
    }
  }

  // ===================================================================
  // FUNCIONES DE REPORTE
  // ===================================================================

  window.reportSoftZenIssue = function(description) {
    const report = {
      timestamp: new Date().toISOString(),
      description: description,
      userAgent: navigator.userAgent,
      url: window.location.href,
      diagnostic: window.SOFTZEN_DIAGNOSTIC,
      errors: [],
      performance: {}
    };
    
    // Capturar errores recientes
    if (window.SOFTZEN_ERROR_LOG) {
      report.errors = window.SOFTZEN_ERROR_LOG.slice(-10);
    }
    
    // Capturar métricas de rendimiento
    if (performance.getEntriesByType) {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        report.performance = {
          loadTime: navigation.loadEventEnd - navigation.fetchStart,
          domReady: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          firstPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime
        };
      }
    }
    
    // Mostrar reporte
    console.log('\n📋 REPORTE DE PROBLEMA GENERADO');
    console.log('================================');
    console.log(JSON.stringify(report, null, 2));
    console.log('\n💡 Copia este reporte y envíalo al soporte técnico.');
    
    return report;
  };

  // ===================================================================
  // MONITOREO CONTINUO
  // ===================================================================

  function setupContinuousMonitoring() {
    // Monitorear errores
    if (!window.SOFTZEN_ERROR_LOG) {
      window.SOFTZEN_ERROR_LOG = [];
    }
    
    window.addEventListener('error', (event) => {
      window.SOFTZEN_ERROR_LOG.push({
        timestamp: new Date().toISOString(),
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error?.stack
      });
      
      // Mantener solo los últimos 50 errores
      if (window.SOFTZEN_ERROR_LOG.length > 50) {
        window.SOFTZEN_ERROR_LOG.shift();
      }
    });
    
    // Monitorear promesas rechazadas
    window.addEventListener('unhandledrejection', (event) => {
      window.SOFTZEN_ERROR_LOG.push({
        timestamp: new Date().toISOString(),
        type: 'unhandledRejection',
        reason: event.reason
      });
    });
    
    console.log('🔧 Monitoreo continuo configurado');
  }

  // ===================================================================
  // INICIALIZACIÓN
  // ===================================================================

  // Configurar monitoreo continuo
  setupContinuousMonitoring();
  
  // Hacer funciones disponibles globalmente
  window.runSoftZenDiagnostic = runSoftZenDiagnostic;
  
  // Auto-ejecutar diagnóstico si se solicita
  if (window.location.search.includes('diagnostic=true')) {
    setTimeout(runSoftZenDiagnostic, 2000);
  }
  
  console.log(`
🔧 HERRAMIENTAS DE DIAGNÓSTICO SOFTZEN

Funciones disponibles:
• runSoftZenDiagnostic() - Ejecutar diagnóstico completo
• reportSoftZenIssue("descripción") - Reportar un problema específico

Comandos útiles:
• console.clear() - Limpiar consola
• localStorage.clear() - Limpiar datos locales
• location.reload(true) - Recargar forzado

Para soporte técnico, ejecuta reportSoftZenIssue() y envía el resultado.
  `);
  
  console.log('🔧 Sistema de diagnóstico SoftZen cargado y listo');

})();