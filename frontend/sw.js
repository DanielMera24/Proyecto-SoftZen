// ===================================================================
// SERVICE WORKER SOFTZEN V2.1.2 - ERRORES HEAD CORREGIDOS
// Enfoque: Cache + Performance + Error Handling Mejorado
// ===================================================================

const VERSION = '2.1.2';
const CACHE_NAME = `softzen-v${VERSION}`;

// Caches específicos para diferentes tipos de contenido
const CACHE_NAMES = {
  STATIC: `${CACHE_NAME}-static`,
  FIREBASE: `${CACHE_NAME}-firebase`,
  DYNAMIC: `${CACHE_NAME}-dynamic`,
  IMAGES: `${CACHE_NAME}-images`
};

// Archivos estáticos para precachear
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/styles.css',
  '/manifest.json',
  '/js/firebase-service.js',
  '/js/firebase-config.js',
  '/js/diagnostic.js',
  '/js/utils.js'
];

// URLs de Firebase SDK para cachear
const FIREBASE_URLS = [
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js'
  // Nota: firebase-performance-compat.js se maneja de forma especial
];

// ===================================================================
// INSTALACIÓN DEL SERVICE WORKER
// ===================================================================

self.addEventListener('install', (event) => {
  console.log(`🔧 Service Worker SoftZen v${VERSION} cargado y listo`);
  
  event.waitUntil(
    (async () => {
      try {
        console.log(`🔧 Service Worker: Instalando v${VERSION}...`);
        
        // Pre-cachear recursos estáticos
        await precacheStaticAssets();
        
        // Pre-cachear Firebase
        await precacheFirebaseSDK();
        
        // Saltar espera y activar inmediatamente
        self.skipWaiting();
        
      } catch (error) {
        console.error('❌ Error durante instalación:', error);
      }
    })()
  );
});

// ===================================================================
// ACTIVACIÓN DEL SERVICE WORKER
// ===================================================================

self.addEventListener('activate', (event) => {
  console.log(`✅ Service Worker: Activando v${VERSION}...`);
  
  event.waitUntil(
    (async () => {
      try {
        // Limpiar caches antiguos
        await cleanupOldCaches();
        
        // Inicializar funcionalidades
        await initializeFeatures();
        
        // Tomar control de todas las pestañas
        self.clients.claim();
        
        console.log('✅ Service Worker: Inicialización completa');
        
      } catch (error) {
        console.error('❌ Error durante activación:', error);
      }
    })()
  );
});

// ===================================================================
// MANEJADOR DE REQUESTS - CORREGIDO PARA ERRORES HEAD
// ===================================================================

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // FILTRAR REQUESTS HEAD - SOLUCIÓN AL ERROR PRINCIPAL
  if (request.method === 'HEAD') {
    console.log('🔄 Request HEAD detectado, omitiendo cache:', url.pathname);
    // Para requests HEAD, siempre ir a la red sin cachear
    event.respondWith(fetch(request));
    return;
  }
  
  // Solo manejar requests GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Manejar diferentes tipos de requests
  event.respondWith(handleRequest(request));
});

// ===================================================================
// MANEJADOR PRINCIPAL DE REQUESTS
// ===================================================================

async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // 1. Firebase APIs - siempre red
    if (url.hostname.includes('firebase') || url.hostname.includes('googleapis')) {
      return await fetch(request);
    }
    
    // 2. Firebase CDN - cache only
    if (url.hostname === 'www.gstatic.com' && url.pathname.includes('firebasejs')) {
      return await cacheOnly(request);
    }
    
    // 3. Archivos estáticos de la app - cache first
    if (isStaticAsset(url.pathname)) {
      return await cacheFirst(request);
    }
    
    // 4. Imágenes - cache first con fallback
    if (isImageRequest(request)) {
      return await cacheFirst(request);
    }
    
    // 5. Archivos JS/CSS - stale while revalidate
    if (isAssetFile(url.pathname)) {
      return await staleWhileRevalidate(request);
    }
    
    // 6. Páginas HTML - network first
    if (request.headers.get('accept')?.includes('text/html')) {
      return await networkFirst(request);
    }
    
    // 7. Otros archivos - network + cache
    return await networkWithCache(request);
    
  } catch (error) {
    console.error('❌ Service Worker: Error manejando request:', error);
    return await handleRequestError(request, error);
  }
}

// ===================================================================
// ESTRATEGIAS DE CACHE CORREGIDAS
// ===================================================================

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAMES.STATIC);
  const cached = await cache.match(request);
  
  if (cached) {
    console.log('📦 Cache hit:', request.url);
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Solo cachear si la respuesta es exitosa
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.warn('⚠️ Network failed, no cache available:', request.url);
    throw error;
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAMES.DYNAMIC);
      await cache.put(request, response.clone());
    }
    
    return response;
    
  } catch (error) {
    console.warn('⚠️ Network failed, trying cache:', request.url);
    const cache = await caches.open(CACHE_NAMES.DYNAMIC);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAMES.STATIC);
  const cached = await cache.match(request);
  
  // Siempre intentar actualizar en background
  const fetchPromise = fetch(request).then(async (response) => {
    if (response.ok && response.status < 400) {
      // SOLUCIÓN AL ERROR HEAD: Verificar que no sea HEAD antes de cachear
      if (request.method === 'GET') {
        await cache.put(request, response.clone());
        console.log('🔄 Background update:', request.url);
      }
    }
    return response;
  }).catch(error => {
    console.warn('⚠️ Background update failed:', request.url, error.message);
    return null;
  });
  
  if (cached) {
    console.log('📦 Stale cache:', request.url);
    return cached;
  }
  
  // Si no hay cache, esperar la red
  return await fetchPromise;
}

async function cacheOnly(request) {
  const cache = await caches.open(CACHE_NAMES.FIREBASE);
  const cached = await cache.match(request);
  
  if (cached) {
    console.log('📦 Cache only:', request.url);
    return cached;
  }
  
  // Si no está en cache, generar error específico
  throw new Error(`No cache available for: ${request.url}`);
}

async function networkWithCache(request) {
  const cache = await caches.open(CACHE_NAMES.DYNAMIC);
  
  try {
    const response = await fetch(request);
    
    if (response.ok && request.method === 'GET') {
      await cache.put(request, response.clone());
    }
    
    console.log('🌐 Network + Cache:', request.url);
    return response;
    
  } catch (error) {
    const cached = await cache.match(request);
    
    if (cached) {
      console.log('📦 Fallback to cache:', request.url);
      return cached;
    }
    
    throw error;
  }
}

// ===================================================================
// FUNCIONES DE PRECARGA
// ===================================================================

async function precacheStaticAssets() {
  console.log('📦 Service Worker: Precacheando recursos estáticos...');
  
  const cache = await caches.open(CACHE_NAMES.STATIC);
  
  const cachePromises = STATIC_ASSETS.map(async (asset) => {
    try {
      const response = await fetch(asset);
      if (response.ok) {
        await cache.put(asset, response);
        console.log('✅ Cacheado:', asset);
      }
    } catch (error) {
      console.warn('⚠️ Error cacheando:', asset, error.message);
    }
  });
  
  await Promise.allSettled(cachePromises);
  console.log('✅ Service Worker: Recursos estáticos precacheados');
}

async function precacheFirebaseSDK() {
  console.log('🔥 Service Worker: Precacheando Firebase...');
  
  const cache = await caches.open(CACHE_NAMES.FIREBASE);
  
  const cachePromises = FIREBASE_URLS.map(async (url) => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
        console.log('🔥 Firebase cacheado:', url);
      }
    } catch (error) {
      console.warn('⚠️ Error cacheando Firebase:', url, error.message);
    }
  });
  
  await Promise.allSettled(cachePromises);
  console.log('✅ Service Worker: Firebase precacheado');
}

// ===================================================================
// LIMPIEZA DE CACHES ANTIGUOS
// ===================================================================

async function cleanupOldCaches() {
  console.log('🧹 Service Worker: Limpiando caches antiguos...');
  
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => {
    return name.startsWith('softzen-') && !Object.values(CACHE_NAMES).includes(name);
  });
  
  const deletePromises = oldCaches.map(async (cacheName) => {
    await caches.delete(cacheName);
    console.log('🗑️ Eliminando cache antiguo:', cacheName);
  });
  
  await Promise.all(deletePromises);
  console.log('✅ Service Worker: Caches antiguos limpiados');
}

// ===================================================================
// INICIALIZACIÓN DE FUNCIONALIDADES
// ===================================================================

async function initializeFeatures() {
  console.log('🚀 Service Worker: Inicializando funcionalidades...');
  
  // Verificar soporte de Background Sync
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    console.log('✅ Background Sync soportado');
  }
  
  // Verificar soporte de Push Notifications
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    console.log('✅ Push Notifications soportadas');
  }
}

// ===================================================================
// FUNCIONES DE UTILIDAD
// ===================================================================

function isStaticAsset(pathname) {
  const staticPaths = ['/', '/index.html', '/manifest.json'];
  return staticPaths.includes(pathname);
}

function isImageRequest(request) {
  return request.headers.get('accept')?.includes('image/') ||
         /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(new URL(request.url).pathname);
}

function isAssetFile(pathname) {
  return /\.(js|css)$/i.test(pathname);
}

async function handleRequestError(request, error) {
  console.error('❌ Error manejando request:', request.url, error.message);
  
  // Intentar fallback desde cache
  const cacheNames = [CACHE_NAMES.STATIC, CACHE_NAMES.DYNAMIC, CACHE_NAMES.FIREBASE];
  
  for (const cacheName of cacheNames) {
    try {
      const cache = await caches.open(cacheName);
      const cached = await cache.match(request);
      
      if (cached) {
        console.log('🔄 Fallback desde cache:', cacheName);
        return cached;
      }
    } catch (cacheError) {
      console.warn('⚠️ Error accediendo cache:', cacheName);
    }
  }
  
  // Si nada funciona, generar respuesta de error
  return new Response('Service Worker: Recurso no disponible', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain' }
  });
}

// ===================================================================
// MANEJO DE MENSAJES
// ===================================================================

self.addEventListener('message', (event) => {
  console.log('🔔 Service Worker: Mensaje recibido:', event.data);
  
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0]?.postMessage({ version: VERSION });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0]?.postMessage({ success: true });
      });
      break;
      
    case 'UPDATE_CACHE':
      updateCache(payload?.urls).then(() => {
        event.ports[0]?.postMessage({ success: true });
      });
      break;
      
    default:
      console.log('🔔 Service Worker: Tipo de mensaje no reconocido:', type);
  }
});

// ===================================================================
// FUNCIONES DE GESTIÓN DE CACHE
// ===================================================================

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  const deletePromises = cacheNames.map(name => caches.delete(name));
  await Promise.all(deletePromises);
  console.log('🧹 Todos los caches limpiados');
}

async function updateCache(urls = []) {
  if (urls.length === 0) {
    urls = [...STATIC_ASSETS, ...FIREBASE_URLS];
  }
  
  const cache = await caches.open(CACHE_NAMES.STATIC);
  
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
        console.log('🔄 Cache actualizado:', url);
      }
    } catch (error) {
      console.warn('⚠️ Error actualizando cache:', url);
    }
  }
}

// ===================================================================
// LOGGING Y DEBUGGING
// ===================================================================

console.log(`🔧 Service Worker SoftZen v${VERSION} inicializado`);
console.log('📋 Configuración:', {
  version: VERSION,
  caches: CACHE_NAMES,
  staticAssets: STATIC_ASSETS.length,
  firebaseUrls: FIREBASE_URLS.length
});