// Script de Instalación Rápida de Firebase para SoftZen
// Este script automatiza la configuración inicial

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  console.clear();
  console.log(`${colors.bright}${colors.cyan}
╔═══════════════════════════════════════════════════╗
║          SOFTZEN - CONFIGURACIÓN RÁPIDA           ║
║               FIREBASE AUTHENTICATION             ║
╚═══════════════════════════════════════════════════╝
${colors.reset}`);

  console.log(`${colors.yellow}Este asistente te ayudará a configurar Firebase en 2 minutos.${colors.reset}\n`);

  // Paso 1: Verificar si el usuario tiene las credenciales
  console.log(`${colors.bright}Paso 1: Obtener credenciales de Firebase${colors.reset}`);
  console.log('Si aún no tienes las credenciales, sigue estos pasos:');
  console.log(`1. Abre ${colors.cyan}https://console.firebase.google.com/${colors.reset}`);
  console.log('2. Crea un proyecto nuevo o usa uno existente');
  console.log('3. Ve a Configuración del proyecto > General');
  console.log('4. En "Tus apps" crea una app web y copia la configuración\n');

  const hasCredentials = await prompt(`${colors.yellow}¿Ya tienes las credenciales de Firebase? (s/n): ${colors.reset}`);

  if (hasCredentials.toLowerCase() !== 's') {
    console.log(`\n${colors.cyan}Abre el enlace anterior y obtén las credenciales.`);
    console.log(`Luego ejecuta este script nuevamente.${colors.reset}`);
    rl.close();
    return;
  }

  // Paso 2: Solicitar credenciales
  console.log(`\n${colors.bright}Paso 2: Ingresar credenciales${colors.reset}`);
  console.log('Copia y pega los valores de tu configuración de Firebase:\n');

  const apiKey = await prompt(`${colors.cyan}API Key: ${colors.reset}`);
  const authDomain = await prompt(`${colors.cyan}Auth Domain: ${colors.reset}`);
  const projectId = await prompt(`${colors.cyan}Project ID: ${colors.reset}`);
  const storageBucket = await prompt(`${colors.cyan}Storage Bucket: ${colors.reset}`);
  const messagingSenderId = await prompt(`${colors.cyan}Messaging Sender ID: ${colors.reset}`);
  const appId = await prompt(`${colors.cyan}App ID: ${colors.reset}`);

  // Paso 3: Crear archivo de configuración
  console.log(`\n${colors.bright}Paso 3: Creando configuración...${colors.reset}`);

  const configContent = `// Configuración de Firebase para SoftZen
// Generado automáticamente el ${new Date().toLocaleString()}

window.firebaseConfig = {
  apiKey: "${apiKey}",
  authDomain: "${authDomain}",
  projectId: "${projectId}",
  storageBucket: "${storageBucket}",
  messagingSenderId: "${messagingSenderId}",
  appId: "${appId}"
};

// Inicializar Firebase
if (typeof firebase !== 'undefined') {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(window.firebaseConfig);
      console.log('✅ Firebase inicializado correctamente');
    }
  } catch (error) {
    console.error('❌ Error inicializando Firebase:', error);
  }
} else {
  console.error('❌ Firebase SDK no está cargado');
}
`;

  const configPath = path.join(__dirname, '..', 'public', 'js', 'firebase-config.js');
  
  try {
    // Crear directorio si no existe
    const jsDir = path.dirname(configPath);
    if (!fs.existsSync(jsDir)) {
      fs.mkdirSync(jsDir, { recursive: true });
    }

    // Guardar configuración
    fs.writeFileSync(configPath, configContent);
    console.log(`${colors.green}✅ Archivo de configuración creado exitosamente${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}❌ Error creando archivo: ${error.message}${colors.reset}`);
    rl.close();
    return;
  }

  // Paso 4: Recordatorios finales
  console.log(`\n${colors.bright}${colors.green}¡Configuración completada!${colors.reset}`);
  console.log(`\n${colors.yellow}Últimos pasos:${colors.reset}`);
  console.log('1. Ve a Firebase Console > Authentication > Sign-in method');
  console.log('2. Habilita "Email/Password"');
  console.log('3. Ve a Firestore Database y crea la base de datos');
  console.log('4. Reinicia el servidor: npm run dev');
  console.log(`5. Prueba en: ${colors.cyan}http://localhost:3001${colors.reset}`);

  console.log(`\n${colors.green}¡Todo listo! Ya puedes usar la autenticación en SoftZen 🎉${colors.reset}`);

  rl.close();
}

main().catch(console.error);
