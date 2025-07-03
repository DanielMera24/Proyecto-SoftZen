// Script de Diagnóstico Rápido - SoftZen Firebase Auth
// Ejecuta este script para ver exactamente qué está fallando

const fs = require('fs');
const path = require('path');

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

console.clear();
console.log(`${colors.bright}${colors.magenta}
╔═══════════════════════════════════════════════════╗
║        DIAGNÓSTICO RÁPIDO - SOFTZEN AUTH         ║
╚═══════════════════════════════════════════════════╝
${colors.reset}`);

let errors = [];
let warnings = [];
let success = [];

// 1. Verificar estructura de archivos
console.log(`\n${colors.cyan}1. Verificando estructura de archivos...${colors.reset}`);

const requiredFiles = [
  { path: 'public/index.html', critical: true },
  { path: 'public/js/firebase-config.js', critical: true },
  { path: 'public/js/firebase-service.js', critical: true },
  { path: 'public/js/app.js', critical: true },
  { path: 'backend/.env', critical: false },
  { path: 'backend/server.js', critical: true }
];

requiredFiles.forEach(file => {
  const fullPath = path.join(__dirname, '..', file.path);
  if (fs.existsSync(fullPath)) {
    success.push(`✅ ${file.path}`);
  } else {
    if (file.critical) {
      errors.push(`❌ FALTA: ${file.path}`);
    } else {
      warnings.push(`⚠️  OPCIONAL: ${file.path}`);
    }
  }
});

// 2. Verificar configuración de Firebase
console.log(`\n${colors.cyan}2. Verificando configuración de Firebase...${colors.reset}`);

const configPath = path.join(__dirname, '..', 'public', 'js', 'firebase-config.js');
if (fs.existsSync(configPath)) {
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  if (configContent.includes('YOUR_API_KEY') || configContent.includes('YOUR_PROJECT_ID')) {
    errors.push('❌ firebase-config.js contiene valores de placeholder');
  } else if (!configContent.includes('apiKey:') || !configContent.includes('projectId:')) {
    errors.push('❌ firebase-config.js no tiene el formato correcto');
  } else {
    success.push('✅ firebase-config.js parece estar configurado');
  }
}

// 3. Verificar index.html
console.log(`\n${colors.cyan}3. Verificando index.html...${colors.reset}`);

const indexPath = path.join(__dirname, '..', 'public', 'index.html');
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  const requiredScripts = [
    'firebase-app',
    'firebase-auth',
    'firebase-firestore',
    'firebase-config.js',
    'firebase-service.js'
  ];
  
  requiredScripts.forEach(script => {
    if (!indexContent.includes(script)) {
      errors.push(`❌ index.html no incluye: ${script}`);
    }
  });
  
  if (errors.filter(e => e.includes('index.html')).length === 0) {
    success.push('✅ index.html incluye todos los scripts necesarios');
  }
}

// 4. Mostrar resultados
console.log(`\n${colors.bright}${colors.yellow}═══ RESULTADOS DEL DIAGNÓSTICO ═══${colors.reset}\n`);

if (success.length > 0) {
  console.log(`${colors.green}CORRECTOS:${colors.reset}`);
  success.forEach(s => console.log(`  ${s}`));
}

if (warnings.length > 0) {
  console.log(`\n${colors.yellow}ADVERTENCIAS:${colors.reset}`);
  warnings.forEach(w => console.log(`  ${w}`));
}

if (errors.length > 0) {
  console.log(`\n${colors.red}ERRORES ENCONTRADOS:${colors.reset}`);
  errors.forEach(e => console.log(`  ${e}`));
}

// 5. Diagnóstico y solución
console.log(`\n${colors.bright}${colors.cyan}═══ DIAGNÓSTICO ═══${colors.reset}\n`);

if (errors.length === 0) {
  console.log(`${colors.green}✅ La configuración parece correcta.${colors.reset}`);
  console.log('\nSi aún no funciona, verifica:');
  console.log('1. Que hayas habilitado Authentication en Firebase Console');
  console.log('2. Que las credenciales sean correctas');
  console.log('3. Los errores en la consola del navegador (F12)');
} else {
  console.log(`${colors.red}❌ Se encontraron ${errors.length} errores que debes corregir.${colors.reset}`);
  
  // Soluciones específicas
  console.log(`\n${colors.yellow}SOLUCIONES:${colors.reset}\n`);
  
  if (errors.some(e => e.includes('firebase-config.js'))) {
    console.log(`${colors.bright}Para configurar Firebase:${colors.reset}`);
    console.log(`1. Ejecuta: ${colors.cyan}node scripts/setup-firebase-quick.js${colors.reset}`);
    console.log('   O manualmente:');
    console.log('2. Ve a https://console.firebase.google.com/');
    console.log('3. Copia tus credenciales a public/js/firebase-config.js');
  }
  
  if (errors.some(e => e.includes('FALTA:'))) {
    console.log(`\n${colors.bright}Para corregir archivos faltantes:${colors.reset}`);
    console.log(`Ejecuta: ${colors.cyan}node scripts/fix-firebase-auth.js${colors.reset}`);
  }
  
  if (errors.some(e => e.includes('index.html'))) {
    console.log(`\n${colors.bright}Para corregir index.html:${colors.reset}`);
    console.log(`Ejecuta: ${colors.cyan}node scripts/fix-firebase-auth.js${colors.reset}`);
    console.log('Esto agregará automáticamente los scripts de Firebase');
  }
}

// 6. Comandos rápidos
console.log(`\n${colors.bright}${colors.magenta}═══ COMANDOS RÁPIDOS ═══${colors.reset}\n`);
console.log(`${colors.cyan}# Configuración guiada:${colors.reset}`);
console.log('node scripts/setup-firebase-quick.js\n');
console.log(`${colors.cyan}# Corrección automática:${colors.reset}`);
console.log('node scripts/fix-firebase-auth.js\n');
console.log(`${colors.cyan}# Ver guía completa:${colors.reset}`);
console.log('type CONFIGURAR_FIREBASE_RAPIDO.md\n');

console.log(`${colors.green}¡Ejecuta el comando apropiado según tu situación!${colors.reset}\n`);
