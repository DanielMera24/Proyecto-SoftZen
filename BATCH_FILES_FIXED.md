# CORRECCIONES DE ARCHIVOS BATCH - SOFTZEN

## Resumen de Problemas Encontrados

Los archivos batch tenían los siguientes problemas:
1. **Problemas de codificación**: Comandos mal escritos (ej: 'cho' en lugar de 'echo')
2. **Caracteres especiales no soportados**: Emojis y caracteres Unicode que Windows no interpreta
3. **Sintaxis incorrecta**: Falta de comillas y estructuras mal formadas

## Archivos Corregidos

### 1. cleanup-optimize.bat
- Reemplazados todos los emojis por indicadores de texto simples ([OK], [ERROR], [INFO])
- Corregidos todos los comandos 'echo'
- Mejorada la estructura de líneas decorativas con caracteres ASCII estándar

### 2. deploy-optimizado-v2.bat
- Mismas correcciones que cleanup-optimize.bat
- Mantenida toda la funcionalidad original
- Mejorados los mensajes de estado

### 3. dev-center.bat
- Convertido el menú principal a formato más simple y legible
- Reemplazados todos los caracteres especiales
- Mantenidas todas las opciones del menú

## Cómo Usar

1. **Para el panel principal**:
   ```
   dev-center.bat
   ```

2. **Para limpiar el proyecto**:
   ```
   cleanup-optimize.bat
   ```

3. **Para hacer deploy**:
   ```
   deploy-optimizado-v2.bat
   ```

## Verificación

Ejecuta `test-batch-files.bat` para verificar que los archivos están correctamente instalados.

## Notas Importantes

- Los archivos ahora usan solo caracteres ASCII estándar
- Los mensajes de estado usan prefijos como [OK], [ERROR], [INFO] en lugar de emojis
- Las líneas decorativas usan caracteres = y - en lugar de caracteres Unicode
- Toda la funcionalidad original se mantiene intacta

## Credenciales Demo

- **Instructor**: admin@softzen.com / SoftZen2024!
- **Paciente**: paciente@softzen.com / SoftZen2024!

## URL de Producción

https://pagina-yoga.web.app