// Script de Diagnóstico y Corrección de Firebase Auth para SoftZen
// Este script verifica y corrige la configuración de Firebase

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.magenta}${msg}${colors.reset}\n`)
};

// Configuración de Firebase de ejemplo (REEMPLAZAR CON TUS CREDENCIALES)
const FIREBASE_CONFIG_TEMPLATE = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

async function checkFirebaseConfig() {
  log.title('🔍 VERIFICANDO CONFIGURACIÓN DE FIREBASE');
  
  const configPath = path.join(__dirname, '..', 'public', 'js', 'firebase-config.js');
  
  try {
    // Verificar si existe el archivo
    if (!fs.existsSync(configPath)) {
      log.error('No se encontró firebase-config.js');
      return false;
    }
    
    // Leer el archivo
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Verificar si tiene credenciales reales
    if (configContent.includes('YOUR_API_KEY') || 
        configContent.includes('YOUR_PROJECT_ID') ||
        !configContent.includes('apiKey:') ||
        !configContent.includes('projectId:')) {
      log.error('La configuración de Firebase tiene valores de placeholder o está incompleta');
      return false;
    }
    
    log.success('Archivo de configuración de Firebase encontrado');
    
    // Verificar formato correcto
    if (!configContent.includes('window.firebaseConfig')) {
      log.error('El archivo no expone firebaseConfig en window');
      return false;
    }
    
    log.success('Configuración de Firebase parece estar correcta');
    return true;
    
  } catch (error) {
    log.error(`Error verificando configuración: ${error.message}`);
    return false;
  }
}

async function createFirebaseConfigFile() {
  log.title('📝 CREANDO ARCHIVO DE CONFIGURACIÓN DE FIREBASE');
  
  const configPath = path.join(__dirname, '..', 'public', 'js', 'firebase-config.js');
  
  const configContent = `// Configuración de Firebase para SoftZen
// IMPORTANTE: Reemplaza estos valores con tus credenciales reales de Firebase

window.firebaseConfig = {
  apiKey: "${FIREBASE_CONFIG_TEMPLATE.apiKey}",
  authDomain: "${FIREBASE_CONFIG_TEMPLATE.authDomain}",
  projectId: "${FIREBASE_CONFIG_TEMPLATE.projectId}",
  storageBucket: "${FIREBASE_CONFIG_TEMPLATE.storageBucket}",
  messagingSenderId: "${FIREBASE_CONFIG_TEMPLATE.messagingSenderId}",
  appId: "${FIREBASE_CONFIG_TEMPLATE.appId}"
};

// Inicializar Firebase
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(window.firebaseConfig);
  console.log('✅ Firebase inicializado correctamente');
} else {
  console.error('❌ Firebase SDK no está cargado');
}
`;

  try {
    fs.writeFileSync(configPath, configContent);
    log.success('Archivo firebase-config.js creado');
    log.warning('IMPORTANTE: Debes actualizar las credenciales en este archivo');
    return true;
  } catch (error) {
    log.error(`Error creando archivo: ${error.message}`);
    return false;
  }
}

async function checkFirebaseService() {
  log.title('🔧 VERIFICANDO FIREBASE SERVICE');
  
  const servicePath = path.join(__dirname, '..', 'public', 'js', 'firebase-service.js');
  
  try {
    if (!fs.existsSync(servicePath)) {
      log.error('No se encontró firebase-service.js');
      return false;
    }
    
    const serviceContent = fs.readFileSync(servicePath, 'utf8');
    
    // Verificar métodos esenciales
    const requiredMethods = [
      'registerUser',
      'loginUser',
      'logoutUser',
      'getCurrentUser'
    ];
    
    let allMethodsPresent = true;
    for (const method of requiredMethods) {
      if (!serviceContent.includes(method)) {
        log.error(`Método faltante: ${method}`);
        allMethodsPresent = false;
      }
    }
    
    if (allMethodsPresent) {
      log.success('Todos los métodos de autenticación están presentes');
    }
    
    return allMethodsPresent;
    
  } catch (error) {
    log.error(`Error verificando service: ${error.message}`);
    return false;
  }
}

async function checkIndexHTML() {
  log.title('📄 VERIFICANDO INDEX.HTML');
  
  const indexPath = path.join(__dirname, '..', 'public', 'index.html');
  
  try {
    if (!fs.existsSync(indexPath)) {
      log.error('No se encontró index.html');
      return false;
    }
    
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Verificar scripts de Firebase
    const requiredScripts = [
      'firebase-app.js',
      'firebase-auth.js',
      'firebase-firestore.js',
      'firebase-config.js',
      'firebase-service.js'
    ];
    
    let allScriptsPresent = true;
    for (const script of requiredScripts) {
      if (!indexContent.includes(script)) {
        log.error(`Script faltante en index.html: ${script}`);
        allScriptsPresent = false;
      }
    }
    
    if (allScriptsPresent) {
      log.success('Todos los scripts de Firebase están incluidos');
    }
    
    // Verificar orden correcto
    const configIndex = indexContent.indexOf('firebase-config.js');
    const serviceIndex = indexContent.indexOf('firebase-service.js');
    
    if (configIndex > serviceIndex) {
      log.error('firebase-config.js debe cargarse antes que firebase-service.js');
      return false;
    }
    
    return allScriptsPresent;
    
  } catch (error) {
    log.error(`Error verificando index.html: ${error.message}`);
    return false;
  }
}

async function fixIndexHTML() {
  log.title('🔧 CORRIGIENDO INDEX.HTML');
  
  const indexPath = path.join(__dirname, '..', 'public', 'index.html');
  
  try {
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Buscar el cierre de head
    const headCloseIndex = indexContent.indexOf('</head>');
    
    if (headCloseIndex === -1) {
      log.error('No se encontró la etiqueta </head>');
      return false;
    }
    
    // Scripts de Firebase que deben estar presentes
    const firebaseScripts = `
    <!-- Firebase Scripts -->
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-storage-compat.js"></script>
    
    <!-- Firebase Configuration -->
    <script src="/js/firebase-config.js"></script>
    <script src="/js/firebase-service.js"></script>
`;
    
    // Verificar si ya existen los scripts
    if (!indexContent.includes('firebase-app-compat.js')) {
      // Insertar antes del cierre de head
      indexContent = indexContent.slice(0, headCloseIndex) + firebaseScripts + indexContent.slice(headCloseIndex);
      
      fs.writeFileSync(indexPath, indexContent);
      log.success('Scripts de Firebase agregados a index.html');
    } else {
      log.info('Scripts de Firebase ya están presentes');
    }
    
    return true;
    
  } catch (error) {
    log.error(`Error corrigiendo index.html: ${error.message}`);
    return false;
  }
}

async function createEnvFile() {
  log.title('🔐 CREANDO ARCHIVO .env');
  
  const envPath = path.join(__dirname, '..', 'backend', '.env');
  
  if (fs.existsSync(envPath)) {
    log.info('Archivo .env ya existe');
    return true;
  }
  
  const envContent = `# Configuración del servidor
PORT=3001
NODE_ENV=development

# Firebase Admin SDK
# Descargar desde: https://console.firebase.google.com/project/YOUR_PROJECT_ID/settings/serviceaccounts/adminsdk
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-admin-key.json

# Configuración de JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Configuración de base de datos (SQLite)
DATABASE_URL=./database/softzen.db
`;

  try {
    fs.writeFileSync(envPath, envContent);
    log.success('Archivo .env creado');
    log.warning('IMPORTANTE: Debes actualizar las credenciales en .env');
    return true;
  } catch (error) {
    log.error(`Error creando .env: ${error.message}`);
    return false;
  }
}

async function showInstructions() {
  log.title('📋 INSTRUCCIONES PARA CONFIGURAR FIREBASE');
  
  console.log(`
${colors.cyan}1. Ve a Firebase Console:${colors.reset}
   https://console.firebase.google.com/

${colors.cyan}2. Crea un nuevo proyecto o selecciona uno existente${colors.reset}

${colors.cyan}3. En la configuración del proyecto, obtén las credenciales:${colors.reset}
   - Ve a Configuración del proyecto > General
   - En "Tus apps", crea una nueva app web
   - Copia la configuración de Firebase

${colors.cyan}4. Actualiza firebase-config.js con tus credenciales:${colors.reset}
   Archivo: ${colors.yellow}public/js/firebase-config.js${colors.reset}
   
   window.firebaseConfig = {
     apiKey: "tu-api-key",
     authDomain: "tu-proyecto.firebaseapp.com",
     projectId: "tu-proyecto",
     storageBucket: "tu-proyecto.appspot.com",
     messagingSenderId: "123456789",
     appId: "tu-app-id"
   };

${colors.cyan}5. Habilita Authentication en Firebase:${colors.reset}
   - Ve a Authentication > Sign-in method
   - Habilita "Correo electrónico/contraseña"

${colors.cyan}6. Configura Firestore:${colors.reset}
   - Ve a Firestore Database
   - Crea la base de datos en modo producción
   - Configura las reglas de seguridad

${colors.cyan}7. Para el backend (opcional):${colors.reset}
   - Descarga la clave de servicio desde:
     Configuración > Cuentas de servicio > Generar nueva clave privada
   - Guárdala como: ${colors.yellow}backend/firebase-admin-key.json${colors.reset}

${colors.cyan}8. Reinicia el servidor y prueba de nuevo${colors.reset}
`);
}

async function testFirebaseConnection() {
  log.title('🌐 PROBANDO CONEXIÓN CON FIREBASE');
  
  const testPath = path.join(__dirname, '..', 'public', 'test-firebase.html');
  
  const testHTML = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Test Firebase - SoftZen</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .status { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
        .info { background: #d1ecf1; color: #0c5460; }
        button { padding: 10px 20px; margin: 5px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>Test de Conexión Firebase - SoftZen</h1>
    <div id="status"></div>
    
    <h2>Test de Registro</h2>
    <input type="email" id="testEmail" placeholder="test@example.com" value="test@softzen.com">
    <input type="password" id="testPassword" placeholder="password123" value="password123">
    <button onclick="testRegister()">Probar Registro</button>
    <button onclick="testLogin()">Probar Login</button>
    
    <div id="results"></div>

    <!-- Firebase Scripts -->
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>
    
    <script src="/js/firebase-config.js"></script>
    <script src="/js/firebase-service.js"></script>
    
    <script>
        const statusDiv = document.getElementById('status');
        const resultsDiv = document.getElementById('results');
        
        // Verificar configuración
        if (window.firebaseConfig) {
            statusDiv.innerHTML = '<div class="status success">✅ Configuración de Firebase cargada</div>';
            
            // Verificar si Firebase está inicializado
            if (firebase.apps.length > 0) {
                statusDiv.innerHTML += '<div class="status success">✅ Firebase inicializado</div>';
            } else {
                statusDiv.innerHTML += '<div class="status error">❌ Firebase no está inicializado</div>';
            }
        } else {
            statusDiv.innerHTML = '<div class="status error">❌ No se encontró configuración de Firebase</div>';
        }
        
        async function testRegister() {
            const email = document.getElementById('testEmail').value;
            const password = document.getElementById('testPassword').value;
            
            resultsDiv.innerHTML = '<div class="status info">Probando registro...</div>';
            
            try {
                const result = await window.firebaseService.registerUser({
                    email: email,
                    password: password,
                    name: 'Test User',
                    role: 'patient'
                });
                
                if (result.success) {
                    resultsDiv.innerHTML = '<div class="status success">✅ Registro exitoso: ' + result.user.email + '</div>';
                } else {
                    resultsDiv.innerHTML = '<div class="status error">❌ Error en registro: ' + result.error + '</div>';
                }
            } catch (error) {
                resultsDiv.innerHTML = '<div class="status error">❌ Error: ' + error.message + '</div>';
            }
        }
        
        async function testLogin() {
            const email = document.getElementById('testEmail').value;
            const password = document.getElementById('testPassword').value;
            
            resultsDiv.innerHTML = '<div class="status info">Probando login...</div>';
            
            try {
                const result = await window.firebaseService.loginUser(email, password);
                
                if (result.success) {
                    resultsDiv.innerHTML = '<div class="status success">✅ Login exitoso: ' + result.user.email + '</div>';
                } else {
                    resultsDiv.innerHTML = '<div class="status error">❌ Error en login: ' + result.error + '</div>';
                }
            } catch (error) {
                resultsDiv.innerHTML = '<div class="status error">❌ Error: ' + error.message + '</div>';
            }
        }
    </script>
</body>
</html>`;

  try {
    fs.writeFileSync(testPath, testHTML);
    log.success('Página de prueba creada: test-firebase.html');
    log.info('Abre http://localhost:3001/test-firebase.html para probar la conexión');
    return true;
  } catch (error) {
    log.error(`Error creando página de prueba: ${error.message}`);
    return false;
  }
}

// Función principal
async function main() {
  console.clear();
  log.title('🔧 DIAGNÓSTICO Y CORRECCIÓN DE FIREBASE AUTH - SOFTZEN');
  
  let hasErrors = false;
  
  // 1. Verificar configuración de Firebase
  const configExists = await checkFirebaseConfig();
  if (!configExists) {
    hasErrors = true;
    await createFirebaseConfigFile();
  }
  
  // 2. Verificar Firebase Service
  const serviceOk = await checkFirebaseService();
  if (!serviceOk) {
    hasErrors = true;
  }
  
  // 3. Verificar y corregir index.html
  const indexOk = await checkIndexHTML();
  if (!indexOk) {
    await fixIndexHTML();
  }
  
  // 4. Crear archivo .env si no existe
  await createEnvFile();
  
  // 5. Crear página de prueba
  await testFirebaseConnection();
  
  // 6. Mostrar instrucciones
  if (hasErrors) {
    await showInstructions();
  }
  
  log.title('📊 RESUMEN DEL DIAGNÓSTICO');
  
  if (hasErrors) {
    log.warning('Se encontraron problemas que requieren configuración manual');
    log.info('Sigue las instrucciones anteriores para completar la configuración');
  } else {
    log.success('La configuración parece estar correcta');
    log.info('Si aún tienes problemas, verifica las credenciales de Firebase');
  }
  
  console.log(`
${colors.bright}Próximos pasos:${colors.reset}
1. Configura tus credenciales de Firebase en firebase-config.js
2. Reinicia el servidor: ${colors.yellow}npm run dev${colors.reset}
3. Prueba en: ${colors.cyan}http://localhost:3001/test-firebase.html${colors.reset}
4. Si todo funciona, prueba la app principal
`);
}

// Ejecutar
main().catch(console.error);
