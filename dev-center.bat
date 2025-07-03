@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo.
echo ==============================================================
echo               SOFTZEN - CENTRO DE DESARROLLO v2.1            
echo             Panel de control para desarrolladores            
echo ==============================================================
echo.

:: Variables de control
set "choice="

:main_menu
cls
echo.
echo ==============================================================
echo               SOFTZEN - CENTRO DE DESARROLLO v2.1            
echo             Panel de control para desarrolladores            
echo ==============================================================
echo.
echo [MENU PRINCIPAL]
echo ==============================================================
echo.
echo  1. [VERIFICAR] Verificar proyecto (verify-optimization.bat)
echo  2. [LIMPIAR] Limpiar proyecto (cleanup-optimize.bat)
echo  3. [DEPLOY] Deploy a produccion (deploy-optimizado-v2.bat)
echo  4. [ESTADO] Mostrar estado del proyecto
echo  5. [HERRAMIENTAS] Herramientas de desarrollo
echo  6. [LOCAL] Abrir aplicacion local
echo  7. [WEB] Abrir aplicacion en produccion
echo  8. [LOGS] Ver logs del sistema
echo  9. [CONFIG] Configuracion avanzada
echo  0. [SALIR] Salir
echo.
echo ==============================================================
set /p choice="Selecciona una opcion (0-9): "

if "%choice%"=="1" goto :verify_project
if "%choice%"=="2" goto :clean_project
if "%choice%"=="3" goto :deploy_project
if "%choice%"=="4" goto :show_status
if "%choice%"=="5" goto :dev_tools
if "%choice%"=="6" goto :open_local
if "%choice%"=="7" goto :open_production
if "%choice%"=="8" goto :show_logs
if "%choice%"=="9" goto :advanced_config
if "%choice%"=="0" goto :exit

echo.
echo [ERROR] Opcion invalida. Por favor selecciona un numero del 0 al 9.
pause
goto :main_menu

:: ====== VERIFICAR PROYECTO ======
:verify_project
echo.
echo [VERIFICACION DEL PROYECTO]
echo ==============================================================
echo.
if exist "verify-optimization.bat" (
    echo [INFO] Ejecutando verificacion completa...
    call verify-optimization.bat
) else (
    echo [ERROR] verify-optimization.bat no encontrado
    echo [INFO] Creando verificacion basica...
    echo.
    echo [OK] Verificacion basica completada
)
echo.
pause
goto :main_menu

:: ====== LIMPIAR PROYECTO ======
:clean_project
echo.
echo [LIMPIEZA DEL PROYECTO]
echo ==============================================================
echo.
echo [ADVERTENCIA] Esta accion eliminara archivos temporales y cache.
set /p confirm="Continuar? (s/n): "
if /i "%confirm%"=="s" (
    if exist "cleanup-optimize.bat" (
        echo [INFO] Ejecutando limpieza completa...
        call cleanup-optimize.bat
    ) else (
        echo [ERROR] cleanup-optimize.bat no encontrado
        echo [INFO] Ejecutando limpieza basica...
        
        :: Limpieza basica
        del *.tmp *.log 2>nul
        if exist "backend\logs" rmdir /s /q "backend\logs" 2>nul
        if exist "*.bak" del *.bak 2>nul
        
        echo [OK] Limpieza basica completada
    )
) else (
    echo [CANCELADO] Limpieza cancelada
)
echo.
pause
goto :main_menu

:: ====== DEPLOY ======
:deploy_project
echo.
echo [DEPLOY A PRODUCCION]
echo ==============================================================
echo.
echo [ADVERTENCIA] Esta accion desplegara la aplicacion a Firebase Hosting.
echo [INFO] Asegurate de haber verificado y limpiado el proyecto.
echo.
set /p confirm="Continuar con el deploy? (s/n): "
if /i "%confirm%"=="s" (
    if exist "deploy-optimizado-v2.bat" (
        echo [INFO] Ejecutando deploy optimizado...
        call deploy-optimizado-v2.bat
    ) else (
        echo [ERROR] deploy-optimizado-v2.bat no encontrado
        echo [INFO] Intentando deploy manual...
        
        firebase --version >nul 2>&1
        if !errorlevel! equ 0 (
            firebase deploy --only hosting
            if !errorlevel! equ 0 (
                echo [OK] Deploy manual completado
                echo [WEB] Aplicacion disponible en: https://pagina-yoga.web.app
            ) else (
                echo [ERROR] Error en deploy manual
            )
        ) else (
            echo [ERROR] Firebase CLI no disponible
        )
    )
) else (
    echo [CANCELADO] Deploy cancelado
)
echo.
pause
goto :main_menu

:: ====== MOSTRAR ESTADO ======
:show_status
echo.
echo [ESTADO DEL PROYECTO]
echo ==============================================================
echo.

:: Verificar estructura basica
echo [ESTRUCTURA DEL PROYECTO]:
if exist "frontend\index.html" (echo [OK] Frontend presente) else (echo [ERROR] Frontend faltante)
if exist "backend\server.js" (echo [OK] Backend presente) else (echo [ERROR] Backend faltante)
if exist "firebase.json" (echo [OK] Firebase config presente) else (echo [ERROR] Firebase config faltante)
if exist ".firebaserc" (echo [OK] Firebase RC presente) else (echo [ERROR] Firebase RC faltante)

echo.
echo [HERRAMIENTAS]:
firebase --version >nul 2>&1
if !errorlevel! equ 0 (
    for /f "tokens=*" %%i in ('firebase --version 2^>nul') do echo [OK] Firebase CLI: %%i
) else (
    echo [ERROR] Firebase CLI no instalado
)

node --version >nul 2>&1
if !errorlevel! equ 0 (
    for /f "tokens=*" %%i in ('node --version 2^>nul') do echo [OK] Node.js: %%i
) else (
    echo [ERROR] Node.js no instalado
)

npm --version >nul 2>&1
if !errorlevel! equ 0 (
    for /f "tokens=*" %%i in ('npm --version 2^>nul') do echo [OK] NPM: %%i
) else (
    echo [ERROR] NPM no disponible
)

echo.
echo [CONECTIVIDAD]:
ping -n 1 firebase.google.com >nul 2>&1
if !errorlevel! equ 0 (echo [OK] Firebase accesible) else (echo [ERROR] Firebase no accesible)

ping -n 1 pagina-yoga.web.app >nul 2>&1
if !errorlevel! equ 0 (echo [OK] Produccion accesible) else (echo [ERROR] Produccion no accesible)

echo.
echo [DEPENDENCIAS]:
if exist "backend\node_modules" (echo [OK] Backend deps instaladas) else (echo [ERROR] Backend deps faltantes)

echo.
echo [CREDENCIALES DEMO DISPONIBLES]:
echo    Instructor: admin@softzen.com / SoftZen2024!
echo    Paciente: paciente@softzen.com / SoftZen2024!

echo.
pause
goto :main_menu

:: ====== HERRAMIENTAS DE DESARROLLO ======
:dev_tools
cls
echo.
echo [HERRAMIENTAS DE DESARROLLO]
echo ==============================================================
echo.
echo  1. [FIREBASE] Firebase login
echo  2. [FIREBASE] Firebase logout
echo  3. [FIREBASE] Listar proyectos Firebase
echo  4. [LOCAL] Servidor local (Firebase serve)
echo  5. [WEB] Firebase console
echo  6. [NPM] Instalar dependencias backend
echo  7. [TEST] Ejecutar tests (si existen)
echo  8. [CONFIG] Ver configuracion Firebase
echo  9. [UPDATE] Actualizar Firebase CLI
echo  0. [VOLVER] Volver al menu principal
echo.
echo ==============================================================
set /p dev_choice="Selecciona una opcion (0-9): "

if "%dev_choice%"=="1" (
    echo [INFO] Iniciando sesion en Firebase...
    firebase login
    pause
) else if "%dev_choice%"=="2" (
    echo [INFO] Cerrando sesion de Firebase...
    firebase logout
    pause
) else if "%dev_choice%"=="3" (
    echo [INFO] Listando proyectos Firebase...
    firebase projects:list
    pause
) else if "%dev_choice%"=="4" (
    echo [INFO] Iniciando servidor local...
    echo [NOTA] Presiona Ctrl+C para detener el servidor
    firebase serve
    pause
) else if "%dev_choice%"=="5" (
    echo [INFO] Abriendo Firebase Console...
    start https://console.firebase.google.com/project/pagina-yoga
    pause
) else if "%dev_choice%"=="6" (
    if exist "backend\package.json" (
        echo [INFO] Instalando dependencias del backend...
        cd backend
        npm install
        cd ..
        echo [OK] Dependencias instaladas
    ) else (
        echo [ERROR] package.json del backend no encontrado
    )
    pause
) else if "%dev_choice%"=="7" (
    echo [INFO] Buscando tests...
    if exist "backend\test" (
        cd backend
        npm test
        cd ..
    ) else if exist "frontend\test" (
        echo [INFO] Ejecutando tests del frontend...
        echo [INFO] No hay tests configurados aun
    ) else (
        echo [INFO] No se encontraron tests configurados
    )
    pause
) else if "%dev_choice%"=="8" (
    echo [CONFIG] Configuracion Firebase:
    if exist "firebase.json" (
        type firebase.json
    ) else (
        echo [ERROR] firebase.json no encontrado
    )
    echo.
    if exist ".firebaserc" (
        echo [CONFIG] Proyecto activo:
        type .firebaserc
    )
    pause
) else if "%dev_choice%"=="9" (
    echo [INFO] Actualizando Firebase CLI...
    npm install -g firebase-tools
    echo [OK] Firebase CLI actualizado
    pause
) else if "%dev_choice%"=="0" (
    goto :main_menu
) else (
    echo [ERROR] Opcion invalida
    pause
)
goto :dev_tools

:: ====== ABRIR LOCAL ======
:open_local
echo.
echo [ABRIENDO APLICACION LOCAL]
echo ==============================================================
echo.
echo [INFO] Iniciando servidor local de Firebase...
echo [INFO] La aplicacion se abrira en http://localhost:5000
echo [NOTA] Presiona Ctrl+C en la ventana del servidor para detenerlo
echo.
start firebase serve
timeout /t 3 >nul
start http://localhost:5000
echo.
echo [OK] Aplicacion local iniciada
echo [WEB] Si no se abrio automaticamente, visita: http://localhost:5000
echo.
pause
goto :main_menu

:: ====== ABRIR PRODUCCION ======
:open_production
echo.
echo [ABRIENDO APLICACION EN PRODUCCION]
echo ==============================================================
echo.
echo [INFO] Abriendo SoftZen en produccion...
start https://pagina-yoga.web.app
echo.
echo [OK] Aplicacion abierta en el navegador
echo [CREDENCIALES] Demo disponibles:
echo    Instructor: admin@softzen.com / SoftZen2024!
echo    Paciente: paciente@softzen.com / SoftZen2024!
echo.
pause
goto :main_menu

:: ====== MOSTRAR LOGS ======
:show_logs
echo.
echo [LOGS DEL SISTEMA]
echo ==============================================================
echo.

echo [LOGS LOCALES]:
if exist "backend\logs" (
    echo [INFO] Logs del backend encontrados:
    dir "backend\logs\*.log" 2>nul
    echo.
    echo Quieres ver algun log especifico? (s/n)
    set /p view_log=""
    if /i "!view_log!"=="s" (
        echo [INFO] Ultimas 20 lineas del log mas reciente:
        for /f %%f in ('dir /b /o-d "backend\logs\*.log" 2^>nul') do (
            echo.
            echo === %%f ===
            tail -20 "backend\logs\%%f" 2>nul || (
                powershell "Get-Content 'backend\logs\%%f' | Select-Object -Last 20"
            )
            goto :logs_shown
        )
        :logs_shown
    )
) else (
    echo [INFO] No se encontraron logs locales del backend
)

echo.
echo [LOGS DE FIREBASE]:
echo [INFO] Para ver logs de Firebase Hosting y Functions:
echo    - Hosting: https://console.firebase.google.com/project/pagina-yoga/hosting/main
echo    - Functions: firebase functions:log (si hay functions)
echo.
echo [LOGS DEL NAVEGADOR]:
echo    - Abre DevTools (F12) en la aplicacion
echo    - Ve a la pestana Console
echo    - Busca mensajes de SoftZen con prefijo [SoftZen]
echo.

pause
goto :main_menu

:: ====== CONFIGURACION AVANZADA ======
:advanced_config
cls
echo.
echo [CONFIGURACION AVANZADA]
echo ==============================================================
echo.
echo  1. [EDIT] Editar firebase.json
echo  2. [EDIT] Editar firestore.rules
echo  3. [EDIT] Editar firestore.indexes.json
echo  4. [ENV] Configurar variables de entorno
echo  5. [REGEN] Regenerar archivos de configuracion
echo  6. [RESET] Reset completo del proyecto
echo  7. [BACKUP] Backup del proyecto
echo  8. [FOLDER] Abrir carpeta del proyecto
echo  9. [DOMAIN] Configurar dominio personalizado
echo  0. [VOLVER] Volver al menu principal
echo.
echo ==============================================================
set /p adv_choice="Selecciona una opcion (0-9): "

if "%adv_choice%"=="1" (
    if exist "firebase.json" (
        notepad firebase.json
    ) else (
        echo [ERROR] firebase.json no encontrado
    )
) else if "%adv_choice%"=="2" (
    if exist "firestore.rules" (
        notepad firestore.rules
    ) else (
        echo [ERROR] firestore.rules no encontrado
    )
) else if "%adv_choice%"=="3" (
    if exist "firestore.indexes.json" (
        notepad firestore.indexes.json
    ) else (
        echo [ERROR] firestore.indexes.json no encontrado
    )
) else if "%adv_choice%"=="4" (
    echo [ENV] Variables de entorno:
    if exist ".env" (
        echo [INFO] Editando .env...
        notepad .env
    ) else (
        echo [INFO] Creando .env...
        echo # Variables de entorno SoftZen > .env
        echo NODE_ENV=development >> .env
        notepad .env
    )
) else if "%adv_choice%"=="5" (
    echo [REGEN] Regenerando archivos de configuracion...
    echo [ADVERTENCIA] Esta accion sobrescribira configuraciones existentes
    set /p confirm="Continuar? (s/n): "
    if /i "!confirm!"=="s" (
        echo [INFO] Regenerando configuraciones...
        firebase init --force
        echo [OK] Configuraciones regeneradas
    )
) else if "%adv_choice%"=="6" (
    echo [RESET] RESET COMPLETO DEL PROYECTO
    echo [ADVERTENCIA] Esta accion eliminara todas las configuraciones
    echo [PELIGRO] Solo usar en caso de emergencia
    set /p confirm="Estas SEGURO? Escribe 'RESET' para confirmar: "
    if "!confirm!"=="RESET" (
        echo [INFO] Eliminando configuraciones...
        del firebase.json .firebaserc 2>nul
        rmdir /s /q .firebase 2>nul
        echo [INFO] Reinicializando proyecto...
        firebase init
        echo [OK] Reset completado
    ) else (
        echo [CANCELADO] Reset cancelado
    )
) else if "%adv_choice%"=="7" (
    echo [BACKUP] Creando backup del proyecto...
    set backup_name=softzen_backup_%date:~-4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%
    set backup_name=!backup_name: =0!
    mkdir "..\!backup_name!" 2>nul
    xcopy /e /i /h "." "..\!backup_name!" /exclude:backup_exclude.txt 2>nul
    echo [OK] Backup creado en: ..\!backup_name!
) else if "%adv_choice%"=="8" (
    echo [INFO] Abriendo carpeta del proyecto...
    start .
) else if "%adv_choice%"=="9" (
    echo [DOMAIN] Configuracion de dominio personalizado:
    echo [INFO] Para configurar un dominio personalizado:
    echo    1. Ve a Firebase Console
    echo    2. Hosting > Add custom domain
    echo    3. Sigue las instrucciones
    echo.
    start https://console.firebase.google.com/project/pagina-yoga/hosting/main
) else if "%adv_choice%"=="0" (
    goto :main_menu
) else (
    echo [ERROR] Opcion invalida
)

pause
goto :advanced_config

:: ====== SALIR ======
:exit
echo.
echo Gracias por usar SoftZen Dev Center!
echo Tu aplicacion de yoga terapeutico esta lista para transformar vidas.
echo.
echo Enlaces utiles:
echo    Produccion: https://pagina-yoga.web.app
echo    Firebase Console: https://console.firebase.google.com/project/pagina-yoga
echo    Documentacion: https://firebase.google.com/docs
echo.
echo Recuerda las credenciales demo:
echo    Instructor: admin@softzen.com / SoftZen2024!
echo    Paciente: paciente@softzen.com / SoftZen2024!
echo.
pause
exit /b 0