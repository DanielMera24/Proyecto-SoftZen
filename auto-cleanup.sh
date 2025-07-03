#!/bin/bash

# ================================================================
# SOFTZEN - LIMPIEZA AUTOMÁTICA DE ARCHIVOS INNECESARIOS
# ================================================================

echo "🧹 Eliminando archivos innecesarios de SoftZen..."

# Eliminar archivos .bat obsoletos
files_to_delete=(
    "abrir-softzen.bat"
    "ARREGLAR-PRODUCCION.bat" 
    "ARREGLAR_FIREBASE.bat"
    "check-port.bat"
    "deploy-optimizado.bat"
    "deploy-optimizado-final.bat"
    "restart-server.bat"
)

# Eliminar archivos .js obsoletos
files_to_delete+=(
    "arreglar-produccion.js"
    "setup-firebase-auth-only.js"
)

# Eliminar documentación redundante
files_to_delete+=(
    "ACCESO_SISTEMA.md"
    "CONFIGURAR_FIREBASE_RAPIDO.md"
    "CORRECCIONES-COMPLETADAS.md"
    "CORRECCIONES_APLICADAS.md"
    "GUIA_RAPIDA_ACCESO.md"
    "INICIO_RAPIDO.md"
    "INSTRUCCIONES_FINALES.md"
    "LISTO-PARA-USAR.md"
    "SOLUCION_PROBLEMAS.md"
    "SOLUCION_RAPIDA.md"
)

echo "Archivos a eliminar:"
for file in "${files_to_delete[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
        rm "$file"
    else
        echo "  ⚪ $file (no existe)"
    fi
done

# Eliminar directorio temporal 'y' si existe
if [ -d "y" ]; then
    echo "  ✅ Directorio 'y' (temporal)"
    rm -rf "y"
fi

# Eliminar directorio scripts si está vacío
if [ -d "scripts" ]; then
    if [ -z "$(ls -A scripts)" ]; then
        echo "  ✅ Directorio 'scripts' (vacío)"
        rmdir "scripts"
    fi
fi

echo ""
echo "✅ Limpieza completada - Proyecto SoftZen optimizado"
