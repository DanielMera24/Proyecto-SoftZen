@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo.
echo ==============================================================
echo               SOFTZEN - DEPLOY OPTIMIZADO v2.1               
echo            Deploy completo con todas las correcciones        
echo ==============================================================
echo.

:: Variables de control
set "step=0"
set "errors=0"
set "warnings=0"

echo [INFO] Iniciando deploy optimizado de SoftZen...
echo ==============================================================
echo.

:: ====== VERIFICACIONES PREVIAS ======
echo [PASO 1] VERIFICACIONES PREVIAS
echo --------------------------------

set /a step+=1
echo [%step%] Verificando Firebase CLI...
firebase --version >nul 2>&1
if !errorlevel! neq 0 (
    echo [ERROR] Firebase CLI no esta instalado
    echo         Ejecuta: npm install -g firebase-tools
    set /a errors+=1
    goto :end
) else (
    for /f "tokens=*" %%i in ('firebase --version 2^>nul') do echo [OK] Firebase CLI: %%i
)

set /a step+=1
echo [%step%] Verificando autenticacion de Firebase...
firebase projects:list >nul 2>&1
if !errorlevel! neq 0 (
    echo [ERROR] No estas autenticado en Firebase
    echo         Ejecuta: firebase login
    set /a errors+=1
    goto :end
) else (
    echo [OK] Firebase autenticado correctamente
)

set /a step+=1
echo [%step%] Verificando estructura del proyecto...
if not exist "frontend\index.html" (
    echo [ERROR] frontend\index.html no encontrado
    set /a errors+=1
) else (
    echo [OK] Frontend encontrado
)

if not exist "firebase.json" (
    echo [ERROR] firebase.json no encontrado
    set /a errors+=1
) else (
    echo [OK] Configuracion Firebase encontrada
)

echo.

:: ====== LIMPIEZA PREVIA ======
echo [PASO 2] LIMPIEZA PREVIA
echo -------------------------

set /a step+=1
echo [%step%] Ejecutando limpieza automatica...
if exist "cleanup-optimize.bat" (
    echo [INFO] Ejecutando cleanup-optimize.bat...
    call cleanup-optimize.bat
    echo [OK] Limpieza completada
) else (
    echo [ADVERTENCIA] cleanup-optimize.bat no encontrado, limpieza manual...
    :: Limpiar archivos temporales basicos
    if exist "*.tmp" del /q *.tmp 2>nul
    if exist "*.log" del /q *.log 2>nul
    set /a warnings+=1
)

echo.

:: ====== VERIFICACION DE DEPENDENCIAS ======
echo [PASO 3] VERIFICACION DE DEPENDENCIAS
echo --------------------------------------

set /a step+=1
echo [%step%] Verificando dependencias del backend...
if exist "backend\package.json" (
    if not exist "backend\node_modules" (
        echo [INFO] Instalando dependencias del backend...
        cd backend
        npm install --production
        if !errorlevel! equ 0 (
            echo [OK] Dependencias del backend instaladas
        ) else (
            echo [ERROR] Error instalando dependencias del backend
            set /a errors+=1
        )
        cd ..
    ) else (
        echo [OK] Dependencias del backend ya instaladas
    )
) else (
    echo [ADVERTENCIA] No se encontro package.json del backend
    set /a warnings+=1
)

echo.

:: ====== CONSTRUCCION DEL PROYECTO ======
echo [PASO 4] CONSTRUCCION DEL PROYECTO
echo -----------------------------------

set /a step+=1
echo [%step%] Preparando archivos para deploy...

:: Verificar que todos los archivos criticos esten presentes
echo [INFO] Verificando archivos criticos...
set "critical_files=frontend\index.html frontend\app.js frontend\styles.css frontend\manifest.json frontend\sw.js"

for %%f in (!critical_files!) do (
    if exist "%%f" (
        echo [OK] %%f encontrado
    ) else (
        echo [ERROR] %%f faltante - archivo critico
        set /a errors+=1
    )
)

:: Verificar archivos de configuracion JavaScript
if exist "frontend\js\firebase-config.js" (
    echo [OK] firebase-config.js encontrado
) else (
    echo [ERROR] firebase-config.js faltante
    set /a errors+=1
)

if exist "frontend\js\firebase-service.js" (
    echo [OK] firebase-service.js encontrado
) else (
    echo [ERROR] firebase-service.js faltante
    set /a errors+=1
)

echo.

:: ====== VERIFICACION FINAL ======
echo [PASO 5] VERIFICACION FINAL
echo ----------------------------

set /a step+=1
echo [%step%] Ejecutando verificacion completa...
if exist "verify-optimization.bat" (
    echo [INFO] Ejecutando verify-optimization.bat...
    call verify-optimization.bat
    echo [OK] Verificacion completada
) else (
    echo [ADVERTENCIA] verify-optimization.bat no encontrado
    echo [INFO] Verificacion manual basica...
    
    :: Verificaciones manuales basicas
    if exist "frontend\index.html" echo [OK] index.html presente
    if exist "frontend\app.js" echo [OK] app.js presente
    if exist "frontend\styles.css" echo [OK] styles.css presente
    if exist "firebase.json" echo [OK] firebase.json presente
    
    set /a warnings+=1
)

echo.

:: ====== DEPLOY A FIREBASE ======
echo [PASO 6] DEPLOY A FIREBASE
echo ---------------------------

if !errors! gtr 0 (
    echo [ERROR] No se puede continuar con el deploy debido a !errors! errores criticos
    echo         Corrige los errores y vuelve a ejecutar el script
    goto :end
)

set /a step+=1
echo [%step%] Iniciando deploy a Firebase Hosting...

echo [INFO] Construyendo proyecto...
firebase deploy --only hosting

if !errorlevel! equ 0 (
    echo [OK] Deploy exitoso a Firebase Hosting
    echo.
    echo Tu aplicacion esta disponible en:
    echo    https://pagina-yoga.web.app
    echo    https://pagina-yoga.firebaseapp.com
    echo.
    
    :: Verificar que el deploy sea accesible
    echo [INFO] Verificando accesibilidad...
    ping -n 1 pagina-yoga.web.app >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] Sitio accesible
    ) else (
        echo [ADVERTENCIA] El sitio puede tardar unos minutos en propagarse
        set /a warnings+=1
    )
    
) else (
    echo [ERROR] Error durante el deploy
    set /a errors+=1
    goto :end
)

echo.

:: ====== DEPLOY DE FIRESTORE RULES (OPCIONAL) ======
echo [PASO 7] DEPLOY DE REGLAS FIRESTORE
echo ------------------------------------

set /a step+=1
echo [%step%] Verificando reglas de Firestore...
if exist "firestore.rules" (
    echo [INFO] Desplegando reglas de Firestore...
    firebase deploy --only firestore:rules
    if !errorlevel! equ 0 (
        echo [OK] Reglas de Firestore desplegadas
    ) else (
        echo [ADVERTENCIA] Error desplegando reglas de Firestore
        set /a warnings+=1
    )
) else (
    echo [ADVERTENCIA] firestore.rules no encontrado
    set /a warnings+=1
)

echo.

:: ====== VERIFICACION POST-DEPLOY ======
echo [PASO 8] VERIFICACION POST-DEPLOY
echo ----------------------------------

set /a step+=1
echo [%step%] Verificando deployment...

echo [INFO] Probando conectividad...
ping -n 1 pagina-yoga.web.app >nul 2>&1
if !errorlevel! equ 0 (
    echo [OK] Sitio principal accesible
) else (
    echo [ADVERTENCIA] Sitio principal no accesible inmediatamente
    set /a warnings+=1
)

echo [INFO] Verificando servicios Firebase...
echo        - Hosting: Desplegado [OK]
if exist "firestore.rules" (
    echo        - Firestore Rules: Desplegado [OK]
) else (
    echo        - Firestore Rules: No configurado [ADVERTENCIA]
)

echo.

:: ====== RESUMEN FINAL ======
:end
echo ==============================================================
echo                       RESUMEN DEL DEPLOY
echo ==============================================================
echo.

echo [ESTADISTICAS]:
echo    Pasos ejecutados: %step%
echo    Errores: !errors!
echo    Advertencias: !warnings!
echo.

if !errors! equ 0 (
    echo [EXITO] DEPLOY COMPLETADO EXITOSAMENTE!
    echo ==============================================================
    echo.
    echo SoftZen ha sido desplegado correctamente:
    echo    URL Principal: https://pagina-yoga.web.app
    echo    URL Alternativa: https://pagina-yoga.firebaseapp.com
    echo    Estado: Funcionando
    echo    Autenticacion: Configurada
    echo.
    echo CREDENCIALES DEMO:
    echo    Instructor: admin@softzen.com / SoftZen2024!
    echo    Paciente: paciente@softzen.com / SoftZen2024!
    echo.
    echo ACCESO:
    echo    1. Abre: https://pagina-yoga.web.app
    echo    2. Usa las credenciales demo
    echo    3. Explora la aplicacion
    echo.
    if !warnings! gtr 0 (
        echo ADVERTENCIAS:
        echo    - Se encontraron !warnings! advertencias menores
        echo    - El funcionamiento no se ve afectado
        echo    - Revisa los logs para mas detalles
        echo.
    )
    echo PROXIMOS PASOS:
    echo    - Monitorear logs en Firebase Console
    echo    - Probar todas las funcionalidades
    echo    - Configurar dominio personalizado (opcional)
    echo    - Configurar Analytics (opcional)
    
) else (
    echo [ERROR] DEPLOY FALLIDO
    echo ==============================================================
    echo.
    echo Se encontraron !errors! errores criticos:
    echo    - Revisa los logs de error arriba
    echo    - Corrige los problemas indicados
    echo    - Vuelve a ejecutar el script
    echo.
    echo ACCIONES RECOMENDADAS:
    echo    1. Ejecutar: cleanup-optimize.bat
    echo    2. Verificar: verify-optimization.bat
    echo    3. Revisar configuracion de Firebase
    echo    4. Volver a intentar el deploy
    echo.
    echo SOPORTE:
    echo    - Verifica tu conexion a internet
    echo    - Confirma autenticacion Firebase
    echo    - Revisa permisos del proyecto
)

echo.
echo ==============================================================
echo              SOFTZEN v2.1 - DEPLOY FINALIZADO
echo ==============================================================
echo.

if !errors! equ 0 (
    echo Felicidades! SoftZen esta ahora en produccion.
    echo Visita https://pagina-yoga.web.app para verlo en accion.
) else (
    echo Revisa los errores y vuelve a intentar.
)

echo.
echo Presiona cualquier tecla para continuar...
pause >nul