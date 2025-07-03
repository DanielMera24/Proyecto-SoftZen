@echo off
echo.
echo ╔═══════════════════════════════════════════════════╗
echo ║         SOFTZEN - DESPLIEGUE OPTIMIZADO           ║
echo ║              SOLO AUTENTICACION                   ║
echo ╚═══════════════════════════════════════════════════╝
echo.

REM Verificar si estamos en el directorio correcto
if not exist "firebase.json" (
    echo ❌ Error: No se encontró firebase.json
    echo Asegúrate de estar en la carpeta del proyecto
    pause
    exit /b 1
)

echo 🔍 Verificando configuración...

REM Verificar configuración de Firebase
if not exist "frontend\js\firebase-config.js" (
    echo ❌ Error: No se encontró firebase-config.js
    echo Ejecuta primero: node setup-firebase-auth-only.js
    pause
    exit /b 1
)

echo ✅ Configuración encontrada
echo.

echo 🚀 Iniciando despliegue optimizado...
echo ⏱️  Esto puede tardar unos minutos...
echo.

REM Desplegar solo los servicios necesarios (evitar Storage y Data Connect)
echo 📊 Desplegando Firestore...
firebase deploy --only firestore

if errorlevel 1 (
    echo ❌ Error desplegando Firestore
    echo Verifica que tengas permisos y que el proyecto esté configurado
    pause
    exit /b 1
)

echo ✅ Firestore desplegado exitosamente
echo.

echo 🌐 Desplegando Hosting...
firebase deploy --only hosting

if errorlevel 1 (
    echo ❌ Error desplegando Hosting
    echo Verifica que la carpeta frontend tenga los archivos necesarios
    pause
    exit /b 1
)

echo ✅ Hosting desplegado exitosamente
echo.

echo 🎉 DESPLIEGUE COMPLETADO EXITOSAMENTE
echo.
echo 📋 Próximos pasos:
echo 1. Ve a Firebase Console
echo 2. Configura Authentication ^> Sign-in method ^> Email/Password
echo 3. Prueba tu aplicación en la URL proporcionada
echo.

REM Obtener la URL del proyecto
echo 🌐 Tu aplicación está disponible en:
echo https://%PROJECT_ID%.web.app
echo o https://%PROJECT_ID%.firebaseapp.com
echo.

echo 🔧 Para desarrollo local:
echo cd backend ^&^& npm run dev
echo http://localhost:3001
echo.

echo ✨ Configuración optimizada para:
echo   - ⚡ Rendimiento máximo
echo   - 🌱 Sostenibilidad
echo   - 📈 Escalabilidad
echo   - 🔐 Solo gestión de usuarios
echo.

pause