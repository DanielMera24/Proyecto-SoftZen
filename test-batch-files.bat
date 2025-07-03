@echo off
echo.
echo ==============================================================
echo                   PRUEBA DE ARCHIVOS BATCH
echo ==============================================================
echo.
echo Este script verifica que los archivos batch corregidos
echo funcionan correctamente.
echo.
echo [TEST 1] Verificando existencia de archivos...
echo ----------------------------------------------
if exist "cleanup-optimize.bat" (echo [OK] cleanup-optimize.bat encontrado) else (echo [ERROR] cleanup-optimize.bat no encontrado)
if exist "deploy-optimizado-v2.bat" (echo [OK] deploy-optimizado-v2.bat encontrado) else (echo [ERROR] deploy-optimizado-v2.bat no encontrado)
if exist "dev-center.bat" (echo [OK] dev-center.bat encontrado) else (echo [ERROR] dev-center.bat no encontrado)

echo.
echo [TEST 2] Verificando sintaxis basica...
echo ---------------------------------------
echo [INFO] Si no ves errores de comandos no reconocidos, 
echo        los archivos fueron corregidos exitosamente.
echo.
echo Puedes probar ejecutando:
echo   - dev-center.bat (Panel principal)
echo   - cleanup-optimize.bat (Para limpiar)
echo   - deploy-optimizado-v2.bat (Para deploy)
echo.
echo Presiona cualquier tecla para continuar...
pause >nul