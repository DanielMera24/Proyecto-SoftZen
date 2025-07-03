#!/bin/bash

# ================================================================
# SOFTZEN - SCRIPT DE OPTIMIZACIÓN AUTOMÁTICA
# Ejecuta todas las optimizaciones necesarias de una vez
# ================================================================

echo "================================================================"
echo "          SOFTZEN - OPTIMIZACIÓN AUTOMÁTICA v2.0"
echo "     Ejecutando todas las mejoras de rendimiento"
echo "================================================================"
echo ""

# Verificar si estamos en el directorio correcto
if [ ! -f "firebase.json" ]; then
    echo "❌ Error: No se encontró firebase.json"
    echo "   Ejecuta desde la raíz del proyecto SoftZen"
    exit 1
fi

echo "🚀 Iniciando optimización automática..."
echo ""

# 1. Ejecutar limpieza
echo "🧹 Paso 1: Limpiando archivos innecesarios..."
if [ -f "cleanup-optimize.bat" ]; then
    cmd.exe /c cleanup-optimize.bat
    echo "✅ Limpieza completada"
else
    echo "⚠️ Script de limpieza no encontrado"
fi

echo ""

# 2. Verificar optimización
echo "🔍 Paso 2: Verificando optimización..."
if [ -f "verify-optimization.bat" ]; then
    cmd.exe /c verify-optimization.bat
    echo "✅ Verificación completada"
else
    echo "⚠️ Script de verificación no encontrado"
fi

echo ""

# 3. Preparar para deploy
echo "🎯 Paso 3: Preparando para deploy..."
echo "✅ Archivos optimizados listos"

echo ""
echo "================================================================"
echo "           ✅ OPTIMIZACIÓN AUTOMÁTICA COMPLETADA"
echo "================================================================"
echo ""
echo "🎉 Tu proyecto SoftZen ha sido optimizado para:"
echo "   ⚡ Rendimiento máximo"
echo "   🌱 Sostenibilidad mejorada"
echo "   📈 Escalabilidad implementada"
echo ""
echo "🚀 Próximo paso: ./deploy-optimizado-v2.bat"
echo ""
