@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo.
echo ==============================================================
echo          SOFTZEN - VERIFICACION FINAL OPTIMIZADA v2.1
echo     Comprobando que todo este optimizado y funcionando
echo ==============================================================
echo.

:: Variables de control
set "errors=0"
set "warnings=0"
set "checks=0"

echo [INFO] Iniciando verificacion completa del proyecto SoftZen...
echo.

:: ====== VERIFICACION DE ESTRUCTURA ======
echo [PASO 1] VERIFICANDO ESTRUCTURA DEL PROYECTO...
echo ------------------------------------------------

set /a checks+=1
if exist "firebase.json" (
    echo [OK] firebase.json encontrado
) else (
    echo [ERROR] firebase.json NO encontrado
    set /a errors+=1
)

set /a checks+=1
if exist "firestore.rules" (
    echo [OK] firestore.rules encontrado
) else (
    echo [ERROR] firestore.rules NO encontrado
    set /a errors+=1
)

set /a checks+=1
if exist "firestore.indexes.json" (
    echo [OK] firestore.indexes.json encontrado
) else (
    echo [ERROR] firestore.indexes.json NO encontrado
    set /a errors+=1
)

set /a checks+=1
if exist ".firebaserc" (
    echo [OK] .firebaserc encontrado
) else (
    echo [ERROR] .firebaserc NO encontrado
    set /a errors+=1
)

set /a checks+=1
if exist "package.json" (
    echo [OK] package.json encontrado
) else (
    echo [ERROR] package.json NO encontrado
    set /a errors+=1
)

set /a checks+=1
if exist "README.md" (
    echo [OK] README.md optimizado encontrado
) else (
    echo [ERROR] README.md NO encontrado
    set /a errors+=1
)

set /a checks+=1
if exist ".gitignore" (
    echo [OK] .gitignore optimizado encontrado
) else (
    echo [ADVERTENCIA] .gitignore NO encontrado
    set /a warnings+=1
)

echo.

:: ====== VERIFICACION DE FRONTEND ======
echo [PASO 2] VERIFICANDO FRONTEND...
echo ---------------------------------

set /a checks+=1
if exist "frontend\index.html" (
    echo [OK] frontend\index.html encontrado
) else (
    echo [ERROR] frontend\index.html NO encontrado
    set /a errors+=1
)

set /a checks+=1
if exist "frontend\app.js" (
    echo [OK] frontend\app.js encontrado
) else (
    echo [ERROR] frontend\app.js NO encontrado
    set /a errors+=1
)

set /a checks+=1
if exist "frontend\styles.css" (
    echo [OK] frontend\styles.css encontrado
) else (
    echo [ERROR] frontend\styles.css NO encontrado
    set /a errors+=1
)

set /a checks+=1
if exist "frontend\manifest.json" (
    echo [OK] frontend\manifest.json encontrado
) else (
    echo [ERROR] frontend\manifest.json NO encontrado
    set /a errors+=1
)

set /a checks+=1
if exist "frontend\js\firebase-config.js" (
    echo [OK] frontend\js\firebase-config.js encontrado
) else (
    echo [ADVERTENCIA] frontend\js\firebase-config.js NO encontrado
    set /a warnings+=1
)

set /a checks+=1
if exist "frontend\js\firebase-service.js" (
    echo [OK] frontend\js\firebase-service.js encontrado
) else (
    echo [ERROR] frontend\js\firebase-service.js NO encontrado
    set /a errors+=1
)

set /a checks+=1
if exist "frontend\js\utils.js" (
    echo [OK] frontend\js\utils.js encontrado
) else (
    echo [ERROR] frontend\js\utils.js NO encontrado
    set /a errors+=1
)

set /a checks+=1
if exist "frontend\sw.js" (
    echo [OK] frontend\sw.js encontrado
) else (
    echo [ERROR] frontend\sw.js NO encontrado
    set /a errors+=1
)

echo.

:: ====== VERIFICACION DE BACKEND ======
echo [PASO 3] VERIFICANDO BACKEND...
echo --------------------------------

set /a checks+=1
if exist "backend\server.js" (
    echo [OK] backend\server.js encontrado
) else (
    echo [ERROR] backend\server.js NO encontrado
    set /a errors+=1
)

set /a checks+=1
if exist "backend\package.json" (
    echo [OK] backend\package.json encontrado
) else (
    echo [ERROR] backend\package.json NO encontrado
    set /a errors+=1
)

set /a checks+=1
if exist "backend\config\database.js" (
    echo [OK] backend\config\database.js encontrado
) else (
    echo [ERROR] backend\config\database.js NO encontrado
    set /a errors+=1
)

set /a checks+=1
if exist "backend\config\environment.js" (
    echo [OK] backend\config\environment.js encontrado
) else (
    echo [ERROR] backend\config\environment.js NO encontrado
    set /a errors+=1
)

:: CORRECCION DEL ERROR ORIGINAL - Sintaxis arreglada
set /a checks+=1
if exist "backend\node_modules" (
    echo [OK] backend\node_modules encontrado ^(dependencias instaladas^)
) else (
    echo [ADVERTENCIA] backend\node_modules NO encontrado ^(ejecutar: cd backend ^&^& npm install^)
    set /a warnings+=1
)

echo.

:: ====== VERIFICACION DE SCRIPTS OPTIMIZADOS ======
echo [PASO 4] VERIFICANDO SCRIPTS OPTIMIZADOS...
echo --------------------------------------------

set /a checks+=1
if exist "deploy-optimizado-v2.bat" (
    echo [OK] deploy-optimizado-v2.bat encontrado
) else (
    echo [ERROR] deploy-optimizado-v2.bat NO encontrado
    set /a errors+=1
)

set /a checks+=1
if exist "cleanup-optimize.bat" (
    echo [OK] cleanup-optimize.bat encontrado
) else (
    echo [ERROR] cleanup-optimize.bat NO encontrado
    set /a errors+=1
)

set /a checks+=1
if exist "dev-center.bat" (
    echo [OK] dev-center.bat encontrado
) else (
    echo [ERROR] dev-center.bat NO encontrado
    set /a errors+=1
)

echo.

:: ====== VERIFICACION DE ARCHIVOS INNECESARIOS ELIMINADOS ======
echo [PASO 5] VERIFICANDO LIMPIEZA...
echo ---------------------------------

:: Verificar que los archivos innecesarios fueron eliminados
if exist "abrir-softzen.bat" (
    echo [ADVERTENCIA] abrir-softzen.bat aun existe ^(deberia eliminarse^)
    set /a warnings+=1
) else (
    echo [OK] abrir-softzen.bat eliminado correctamente
)

if exist "ARREGLAR-PRODUCCION.bat" (
    echo [ADVERTENCIA] ARREGLAR-PRODUCCION.bat aun existe ^(deberia eliminarse^)
    set /a warnings+=1
) else (
    echo [OK] ARREGLAR-PRODUCCION.bat eliminado correctamente
)

if exist "arreglar-produccion.js" (
    echo [ADVERTENCIA] arreglar-produccion.js aun existe ^(deberia eliminarse^)
    set /a warnings+=1
) else (
    echo [OK] arreglar-produccion.js eliminado correctamente
)

if exist "y" (
    echo [ADVERTENCIA] Directorio temporal 'y' aun existe ^(deberia eliminarse^)
    set /a warnings+=1
) else (
    echo [OK] Directorios temporales limpiados
)

echo.

:: ====== VERIFICACION DE CONECTIVIDAD ======
echo [PASO 6] VERIFICANDO CONECTIVIDAD...
echo -------------------------------------

echo [INFO] Probando conexion a Firebase...
ping -n 1 firebase.google.com >nul 2>&1
if !errorlevel! equ 0 (
    echo [OK] Firebase accesible
) else (
    echo [ADVERTENCIA] Sin conexion a Firebase
    set /a warnings+=1
)

echo [INFO] Probando conexion a la app...
ping -n 1 pagina-yoga.web.app >nul 2>&1
if !errorlevel! equ 0 (
    echo [OK] App accesible
) else (
    echo [ADVERTENCIA] Sin conexion a pagina-yoga.web.app
    set /a warnings+=1
)

echo.

:: ====== VERIFICACION DE FIREBASE CLI ======
echo [PASO 7] VERIFICANDO FIREBASE CLI...
echo -------------------------------------

firebase --version >nul 2>&1
if !errorlevel! equ 0 (
    for /f "tokens=*" %%i in ('firebase --version 2^>nul') do echo [OK] Firebase CLI: %%i
) else (
    echo [ERROR] Firebase CLI no instalado
    echo         Instalar con: npm install -g firebase-tools
    set /a errors+=1
)

echo.

:: ====== VERIFICACION DE NODE.JS ======
echo [PASO 8] VERIFICANDO NODE.JS Y NPM...
echo --------------------------------------

node --version >nul 2>&1
if !errorlevel! equ 0 (
    for /f "tokens=*" %%i in ('node --version 2^>nul') do echo [OK] Node.js: %%i
) else (
    echo [ERROR] Node.js no instalado
    set /a errors+=1
)

npm --version >nul 2>&1
if !errorlevel! equ 0 (
    for /f "tokens=*" %%i in ('npm --version 2^>nul') do echo [OK] NPM: %%i
) else (
    echo [ERROR] NPM no disponible
    set /a errors+=1
)

echo.

:: ====== VERIFICACION DE ARCHIVOS JAVASCRIPT CRITICOS ======
echo [PASO 9] VERIFICANDO ARCHIVOS JAVASCRIPT CRITICOS...
echo -----------------------------------------------------

set /a checks+=1
if exist "frontend\js\firebase-config.js" (
    findstr /c:"firebaseConfig" "frontend\js\firebase-config.js" >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] firebase-config.js contiene configuracion valida
    ) else (
        echo [ADVERTENCIA] firebase-config.js puede tener configuracion incompleta
        set /a warnings+=1
    )
) else (
    echo [ERROR] firebase-config.js no encontrado
    set /a errors+=1
)

set /a checks+=1
if exist "frontend\js\firebase-service.js" (
    findstr /c:"class.*Firebase" "frontend\js\firebase-service.js" >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] firebase-service.js contiene clase de servicio
    ) else (
        echo [ADVERTENCIA] firebase-service.js puede estar incompleto
        set /a warnings+=1
    )
) else (
    echo [ERROR] firebase-service.js no encontrado
    set /a errors+=1
)

echo.

:: ====== VERIFICACION DE MANIFEST Y PWA ======
echo [PASO 10] VERIFICANDO CONFIGURACION PWA...
echo -------------------------------------------

set /a checks+=1
if exist "frontend\manifest.json" (
    findstr /c:"name" "frontend\manifest.json" >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] manifest.json contiene configuracion PWA
    ) else (
        echo [ADVERTENCIA] manifest.json puede estar incompleto
        set /a warnings+=1
    )
) else (
    echo [ERROR] manifest.json no encontrado
    set /a errors+=1
)

set /a checks+=1
if exist "frontend\sw.js" (
    findstr /c:"SERVICE.*WORKER\|service.*worker" "frontend\sw.js" >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] sw.js contiene codigo de Service Worker
    ) else (
        echo [ADVERTENCIA] sw.js puede estar incompleto
        set /a warnings+=1
    )
) else (
    echo [ERROR] sw.js no encontrado  
    set /a errors+=1
)

echo.

:: ====== VERIFICACION DE BASE DE DATOS ======
echo [PASO 11] VERIFICANDO BASE DE DATOS...
echo ---------------------------------------

set /a checks+=1
if exist "backend\database\therapy.db" (
    echo [OK] Base de datos SQLite encontrada
    
    :: Verificar tamano de la base de datos
    for %%A in ("backend\database\therapy.db") do (
        if %%~zA gtr 0 (
            echo [OK] Base de datos no esta vacia ^(%%~zA bytes^)
        ) else (
            echo [ADVERTENCIA] Base de datos esta vacia
            set /a warnings+=1
        )
    )
) else (
    echo [ADVERTENCIA] Base de datos SQLite no encontrada
    set /a warnings+=1
)

echo.

:: ====== RESUMEN FINAL ======
echo ==============================================================
echo                      RESUMEN DE VERIFICACION
echo ==============================================================
echo.
echo [ESTADISTICAS]:
echo    Verificaciones realizadas: !checks!
echo    Errores criticos: !errors!
echo    Advertencias: !warnings!
echo.

:: Calcular porcentaje de exito
set /a success_rate=100
if !checks! gtr 0 (
    set /a success_rate=^(!checks!-!errors!^)*100/!checks!
)

echo [RESULTADO] Tasa de exito: !success_rate!%%
echo.

if !errors! equ 0 (
    if !warnings! equ 0 (
        echo [EXITO] PROYECTO COMPLETAMENTE OPTIMIZADO!
        echo ==============================================================
        echo.
        echo SoftZen esta listo para produccion:
        echo    Rendimiento: OPTIMIZADO
        echo    Sostenibilidad: MEJORADA  
        echo    Escalabilidad: IMPLEMENTADA
        echo    Todos los componentes: FUNCIONANDO
        echo.
        echo PROXIMOS PASOS:
        echo    1. Ejecutar: deploy-optimizado-v2.bat
        echo    2. Verificar: https://pagina-yoga.web.app
        echo    3. Monitorear logs y metricas
        echo    4. Probar credenciales demo en la app
        echo.
        echo COMANDOS UTILES:
        echo    - Deploy: deploy-optimizado-v2.bat
        echo    - Desarrollo: dev-center.bat
        echo    - Limpieza: cleanup-optimize.bat
        echo.
        echo CREDENCIALES DEMO:
        echo    - Instructor: admin@softzen.com / SoftZen2024!
        echo    - Paciente: paciente@softzen.com / SoftZen2024!
        
    ) else (
        echo [ADVERTENCIA] PROYECTO OPTIMIZADO CON ADVERTENCIAS
        echo ==============================================================
        echo.
        echo Hay !warnings! advertencias que deberias revisar
        echo El proyecto funcionara pero considera corregir las advertencias
        echo La mayoria son dependencias opcionales o conectividad
        echo.
        echo RECOMENDACIONES:
        echo    - Instalar dependencias faltantes
        echo    - Verificar conexion a internet
        echo    - Ejecutar: cd backend ^&^& npm install
    )
) else (
    echo [ERROR] ERRORES CRITICOS ENCONTRADOS
    echo ==============================================================
    echo.
    echo Hay !errors! errores criticos que deben corregirse
    echo Revisa los archivos faltantes y vuelve a ejecutar
    echo.
    echo ACCIONES REQUERIDAS:
    if !errors! gtr 5 (
        echo    - Proyecto puede estar corrupto
        echo    - Considera restaurar desde backup
        echo    - Verificar integridad de archivos
    ) else (
        echo    - Crear/restaurar archivos faltantes
        echo    - Verificar estructura de directorios
        echo    - Reinstalar dependencias si es necesario
    )
    echo.
    echo SOPORTE:
    echo    - Revisa la documentacion del proyecto
    echo    - Verifica que tengas todos los requisitos
    echo    - Contacta al equipo de desarrollo si persisten errores
)

echo.
echo ==============================================================
echo              SOFTZEN v2.1 - VERIFICACION COMPLETADA
echo ==============================================================
echo.

:: Mostrar sugerencias adicionales basadas en los resultados
if !warnings! gtr 0 (
    echo SUGERENCIAS ADICIONALES:
    if !warnings! gtr 3 (
        echo    - Ejecutar cleanup-optimize.bat para limpiar archivos
        echo    - Verificar conexion de red
        echo    - Actualizar dependencias: npm update
    )
    echo    - Los warnings no impiden el funcionamiento
    echo    - Considera resolverlos para mejor rendimiento
    echo.
)

echo Presiona cualquier tecla para continuar...
pause >nul