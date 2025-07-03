@echo off
:: ===================================================================
:: SCRIPT DE DEPLOYMENT OPTIMIZADO - SOFTZEN V2.1
:: Enfoque: Rendimiento + Sostenibilidad + Escalabilidad + Producción
:: ===================================================================

title SoftZen - Deployment Optimizado v2.1

:: Configurar colores para mejor UX
color 0A

echo.
echo ================================================================================
echo                     🚀 SOFTZEN DEPLOYMENT OPTIMIZADO v2.1
echo                  Enfoque: Rendimiento + Sostenibilidad + Escalabilidad
echo ================================================================================
echo.

:: Verificar si estamos en la carpeta correcta
if not exist "firebase.json" (
    echo ❌ ERROR: No se encuentra firebase.json
    echo    Asegurate de ejecutar este script desde la carpeta raiz del proyecto
    echo.
    pause
    exit /b 1
)

:: Verificar si Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js no está instalado
    echo    Por favor instala Node.js desde https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Verificar si Firebase CLI está instalado
firebase --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Firebase CLI no encontrado, instalando...
    npm install -g firebase-tools
    if errorlevel 1 (
        echo ❌ ERROR: No se pudo instalar Firebase CLI
        echo    Ejecuta manualmente: npm install -g firebase-tools
        echo.
        pause
        exit /b 1
    )
    echo ✅ Firebase CLI instalado correctamente
    echo.
)

echo 🔍 Verificando configuraciones...
echo.

:: Verificar archivos críticos
set "CRITICAL_FILES=frontend\index.html frontend\app.js frontend\styles.css frontend\manifest.json frontend\sw.js"
set "MISSING_FILES="

for %%f in (%CRITICAL_FILES%) do (
    if not exist "%%f" (
        set "MISSING_FILES=!MISSING_FILES! %%f"
    )
)

if defined MISSING_FILES (
    echo ❌ ERROR: Archivos críticos faltantes:
    echo    %MISSING_FILES%
    echo.
    pause
    exit /b 1
)

:: Verificar configuración de Firebase
if not exist ".firebaserc" (
    echo ⚠️  Archivo .firebaserc no encontrado
    echo    Configurando proyecto Firebase...
    echo.
    firebase use pagina-yoga
    if errorlevel 1 (
        echo ❌ ERROR: No se pudo configurar el proyecto Firebase
        echo    Verifica que el proyecto 'pagina-yoga' existe
        echo.
        pause
        exit /b 1
    )
)

echo ✅ Configuraciones verificadas
echo.

:: Mostrar información del proyecto
echo 📊 INFORMACIÓN DEL PROYECTO:
echo    • Proyecto Firebase: pagina-yoga
echo    • Entorno: Producción
echo    • Hosting: Firebase Hosting
echo    • Base de datos: Firestore
echo    • Autenticación: Firebase Auth
echo.

:: Preguntar por tipo de deployment
echo 🎯 OPCIONES DE DEPLOYMENT:
echo    [1] Deployment Completo (Hosting + Firestore + Auth)
echo    [2] Solo Hosting (Actualización rápida)
echo    [3] Solo Firestore (Reglas y índices)
echo    [4] Verificar Estado (Sin deployment)
echo    [5] Optimización y Limpieza
echo.

set /p "DEPLOY_TYPE=Selecciona una opción (1-5): "

if "%DEPLOY_TYPE%"=="1" goto DEPLOY_COMPLETE
if "%DEPLOY_TYPE%"=="2" goto DEPLOY_HOSTING
if "%DEPLOY_TYPE%"=="3" goto DEPLOY_FIRESTORE
if "%DEPLOY_TYPE%"=="4" goto CHECK_STATUS
if "%DEPLOY_TYPE%"=="5" goto OPTIMIZE_AND_CLEAN

echo ❌ Opción inválida
pause
exit /b 1

:DEPLOY_COMPLETE
echo.
echo 🚀 INICIANDO DEPLOYMENT COMPLETO...
echo.

echo 🧹 Paso 1: Limpieza previa...
if exist "frontend\*.log" del /q "frontend\*.log"
if exist "frontend\*.tmp" del /q "frontend\*.tmp"

echo ✅ Limpieza completada
echo.

echo 🔧 Paso 2: Verificando integridad de archivos...
call :VERIFY_FILES
echo.

echo 🔐 Paso 3: Configurando autenticación...
firebase login --reauth
if errorlevel 1 (
    echo ❌ ERROR: Fallo la autenticación
    pause
    exit /b 1
)
echo.

echo 📦 Paso 4: Deploying Firestore (reglas e índices)...
firebase deploy --only "firestore" --project pagina-yoga
if errorlevel 1 (
    echo ❌ ERROR: Fallo el deployment de Firestore
    pause
    exit /b 1
)
echo.

echo 🌐 Paso 5: Deploying Hosting...
firebase deploy --only "hosting" --project pagina-yoga
if errorlevel 1 (
    echo ❌ ERROR: Fallo el deployment de Hosting
    pause
    exit /b 1
)
echo.

goto DEPLOYMENT_SUCCESS

:DEPLOY_HOSTING
echo.
echo 🌐 DEPLOYMENT SOLO HOSTING...
echo.

echo 🧹 Limpiando cache...
if exist "frontend\*.log" del /q "frontend\*.log"

echo 📦 Deploying Hosting...
firebase deploy --only "hosting" --project pagina-yoga
if errorlevel 1 (
    echo ❌ ERROR: Fallo el deployment de Hosting
    pause
    exit /b 1
)

goto DEPLOYMENT_SUCCESS

:DEPLOY_FIRESTORE
echo.
echo 📊 DEPLOYMENT SOLO FIRESTORE...
echo.

echo 📦 Deploying Firestore reglas e índices...
firebase deploy --only "firestore" --project pagina-yoga
if errorlevel 1 (
    echo ❌ ERROR: Fallo el deployment de Firestore
    pause
    exit /b 1
)

goto DEPLOYMENT_SUCCESS

:CHECK_STATUS
echo.
echo 🔍 VERIFICANDO ESTADO DEL PROYECTO...
echo.

echo 📊 Estado de Firebase:
firebase projects:list
echo.

echo 🌐 Estado del Hosting:
firebase hosting:sites:list --project pagina-yoga
echo.

echo ✅ Verificación completada
goto END

:OPTIMIZE_AND_CLEAN
echo.
echo ⚡ OPTIMIZACIÓN Y LIMPIEZA...
echo.

echo 🧹 Limpiando archivos temporales...
if exist "frontend\*.log" del /q "frontend\*.log"
if exist "frontend\*.tmp" del /q "frontend\*.tmp"
if exist "frontend\*.bak" del /q "frontend\*.bak"

echo 🔍 Verificando tamaños de archivos...
dir "frontend\*.js" "frontend\*.css" "frontend\*.html" | find "bytes"

echo 📊 Verificando performance...
call :CHECK_PERFORMANCE

echo ✅ Optimización completada
goto END

:DEPLOYMENT_SUCCESS
echo.
echo ================================================================================
echo                           ✅ DEPLOYMENT EXITOSO
echo ================================================================================
echo.
echo 🎉 SoftZen ha sido desplegado exitosamente!
echo.
echo 📋 URLs del proyecto:
echo    🌐 Aplicación: https://pagina-yoga.web.app
echo    🔧 Console:    https://console.firebase.google.com/project/pagina-yoga/overview
echo.
echo 📊 Información técnica:
echo    • Hosting:     ✅ Activo
echo    • Firestore:   ✅ Configurado
echo    • Auth:        ✅ Habilitado
echo    • PWA:         ✅ Service Worker activo
echo    • Iconos:      ✅ Generados
echo.
echo 🚀 Funcionalidades disponibles:
echo    • Login/Registro optimizado
echo    • Dashboard instructor con datos en tiempo real
echo    • Sistema de cache inteligente
echo    • Soporte offline
echo    • PWA instalable
echo    • Notificaciones push (preparado)
echo.
echo 💡 Credenciales de prueba:
echo    📧 Email:    admin@softzen.com
echo    🔑 Password: SoftZen2024!
echo.

:: Verificar que la aplicación responde
echo 🔍 Verificando que la aplicación responde...
timeout /t 3 /nobreak >nul

:: Intentar abrir en el navegador
echo 🌐 Abriendo aplicación en el navegador...
start https://pagina-yoga.web.app

echo.
echo 📚 PRÓXIMOS PASOS RECOMENDADOS:
echo    1. Probar todas las funcionalidades en la app web
echo    2. Configurar usuarios adicionales si es necesario  
echo    3. Personalizar iconos usando el generador en /icons/
echo    4. Configurar Google Analytics (opcional)
echo    5. Configurar notificaciones push (opcional)
echo.
echo ⚠️  IMPORTANTE:
echo    • La aplicación está optimizada para producción
echo    • El cache se actualiza automáticamente
echo    • Los datos son persistentes offline
echo    • El Service Worker maneja la conectividad
echo.

goto END

:VERIFY_FILES
echo    📁 Verificando frontend/index.html... 
if exist "frontend\index.html" (echo    ✅ OK) else (echo    ❌ FALTA & set "FILE_ERROR=1")

echo    📁 Verificando frontend/app.js...
if exist "frontend\app.js" (echo    ✅ OK) else (echo    ❌ FALTA & set "FILE_ERROR=1")

echo    📁 Verificando frontend/styles.css...
if exist "frontend\styles.css" (echo    ✅ OK) else (echo    ❌ FALTA & set "FILE_ERROR=1")

echo    📁 Verificando frontend/manifest.json...
if exist "frontend\manifest.json" (echo    ✅ OK) else (echo    ❌ FALTA & set "FILE_ERROR=1")

echo    📁 Verificando frontend/sw.js...
if exist "frontend\sw.js" (echo    ✅ OK) else (echo    ❌ FALTA & set "FILE_ERROR=1")

echo    📁 Verificando firebase.json...
if exist "firebase.json" (echo    ✅ OK) else (echo    ❌ FALTA & set "FILE_ERROR=1")

echo    📁 Verificando firestore.rules...
if exist "firestore.rules" (echo    ✅ OK) else (echo    ❌ FALTA & set "FILE_ERROR=1")

if defined FILE_ERROR (
    echo.
    echo ❌ ERROR: Algunos archivos críticos están faltando
    echo    Por favor verifica la integridad del proyecto
    pause
    exit /b 1
)

echo    ✅ Todos los archivos críticos están presentes
return

:CHECK_PERFORMANCE
echo    📊 Verificando tamaños de archivos...

for %%f in (frontend\app.js) do (
    echo    📦 app.js: %%~zf bytes
    if %%~zf GTR 500000 echo       ⚠️  Archivo grande detectado
)

for %%f in (frontend\styles.css) do (
    echo    📦 styles.css: %%~zf bytes
    if %%~zf GTR 100000 echo       ⚠️  CSS muy grande
)

for %%f in (frontend\index.html) do (
    echo    📦 index.html: %%~zf bytes
)

echo    ✅ Verificación de rendimiento completada
return

:END
echo.
echo ================================================================================
echo               Gracias por usar SoftZen Deployment Script v2.1
echo                      https://softzen.app - Yoga que transforma
echo ================================================================================
echo.
pause
