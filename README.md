# 🧘‍♀️ SoftZen - Yoga Terapéutico Optimizado v2.1

[![Deploy Status](https://img.shields.io/badge/deploy-active-brightgreen)](https://pagina-yoga.web.app)
[![Version](https://img.shields.io/badge/version-2.1.0-blue)](https://github.com/softzen/proyecto)
[![Tech Stack](https://img.shields.io/badge/stack-PWA%20|%20Firebase%20|%20Express-orange)](https://github.com/softzen/proyecto)
[![Performance](https://img.shields.io/badge/performance-optimized-green)](https://pagina-yoga.web.app)

> **Plataforma de yoga terapéutico optimizada para instructores y pacientes**  
> *Enfoque en rendimiento, sostenibilidad y escalabilidad*

## 🌟 **Características Principales**

### ✨ **Para Instructores**
- 👥 **Gestión de Pacientes**: Administra pacientes y su progreso
- 📊 **Seguimiento de Sesiones**: Registra y analiza sesiones terapéuticas  
- 🎯 **Series Personalizadas**: Crea series adaptadas a cada necesidad
- 📈 **Analytics Avanzados**: Visualiza estadísticas en tiempo real
- 📱 **Acceso Móvil**: PWA optimizada para todos los dispositivos

### 🧘‍♀️ **Para Pacientes**
- 🎥 **Sesiones Guiadas**: Videos y instrucciones detalladas
- 📅 **Seguimiento Personal**: Registra dolor, estado de ánimo y progreso
- 📸 **Documentación Visual**: Fotos antes/después de sesiones
- ⭐ **Evaluaciones**: Sistema de rating y comentarios
- 🔔 **Notificaciones**: Recordatorios y motivación

### 🚀 **Tecnología Avanzada**
- ⚡ **PWA**: Funcionamiento offline, instalable como app
- 🔥 **Firebase**: Base de datos en tiempo real, autenticación segura
- 📱 **Responsive**: Diseño adaptativo para móvil, tablet y desktop
- 🎯 **Lazy Loading**: Carga optimizada de recursos
- 🔒 **Seguridad**: Autenticación Firebase + middleware de seguridad

---

## 🏗️ **Arquitectura del Sistema**

```
SoftZen/
├── 🎨 frontend/          # PWA - Progressive Web App
│   ├── index.html        # Entrada principal optimizada
│   ├── app.js           # Aplicación principal modular
│   ├── styles.css       # CSS optimizado con variables
│   ├── js/              # Módulos JavaScript
│   │   ├── firebase-service.js
│   │   ├── utils.js
│   │   └── app-extensions-*.js
│   └── icons/           # Iconos PWA optimizados
├── ⚙️ backend/           # API REST - Express.js
│   ├── server.js        # Servidor principal
│   ├── config/          # Configuraciones
│   ├── controllers/     # Lógica de negocio
│   ├── middleware/      # Seguridad y validaciones
│   ├── routes/          # Rutas de la API
│   └── database/        # SQLite local
├── 🔥 Firebase/          # Servicios cloud
│   ├── firestore.rules  # Reglas de seguridad
│   ├── firestore.indexes.json
│   └── firebase.json    # Configuración hosting
└── 🔧 Scripts/           # Automatización optimizada
    ├── deploy-optimizado-v2.bat
    ├── cleanup-optimize.bat
    └── dev-center.bat
```

---

## 🚀 **Inicio Rápido**

### 1. **Instalación Instantánea**
```bash
# Clonar el repositorio
git clone [tu-repo-url]
cd Proyecto-SoftZen

# Ejecutar centro de desarrollo
./dev-center.bat
```

### 2. **Configuración del Backend**
```bash
cd backend
npm install
npm start
# Servidor corriendo en http://localhost:3000
```

### 3. **Deploy en Firebase**
```bash
# Deploy optimizado (PowerShell compatible)
./deploy-optimizado-v2.bat

# O manual:
firebase deploy --only "firestore,hosting"
```

### 4. **Acceso a la Aplicación**
- 🌐 **Producción**: https://pagina-yoga.web.app
- 💻 **Local**: http://localhost:3000
- 📱 **PWA**: Instalar desde el navegador

---

## 🛠️ **Scripts de Automatización**

### 🎯 **Scripts Principales**
| Script | Función | Uso |
|--------|---------|-----|
| `dev-center.bat` | Centro de desarrollo completo | Gestión integral |
| `deploy-optimizado-v2.bat` | Deploy optimizado | Producción rápida |
| `cleanup-optimize.bat` | Limpieza y optimización | Mantenimiento |

### 🔧 **Centro de Desarrollo**
```bash
./dev-center.bat
```
**Funciones incluidas:**
- 🚀 Deploy (completo, hosting, firestore)
- 💻 Desarrollo (servidor, logs, configuración)
- 🧹 Mantenimiento (limpieza, backup, verificación)
- 📊 Información (estado, puertos, conectividad)

---

## 📊 **Credenciales de Demostración**

### 👨‍🏫 **Instructor**
- **Email**: `admin@softzen.com`
- **Contraseña**: `SoftZen2024!`
- **Acceso**: Panel completo de instructor

### 🧘‍♀️ **Paciente**
- Registro disponible desde la aplicación
- Demo automático de funcionalidades

---

## 🔒 **Seguridad y Configuración**

### 🛡️ **Seguridad Implementada**
- 🔐 **Firebase Auth**: Autenticación segura
- 🔒 **Helmet.js**: Headers de seguridad HTTP
- 🚦 **Rate Limiting**: Protección contra ataques
- 🛡️ **CORS**: Configuración de orígenes permitidos
- 📝 **Firestore Rules**: Reglas de acceso granulares

### ⚙️ **Variables de Entorno**
```bash
# backend/.env
NODE_ENV=production
PORT=3000
DATABASE_URL=./database/therapy.db
JWT_SECRET=tu_jwt_secret_seguro
```

### 🔥 **Configuración Firebase**
```javascript
// frontend/js/firebase-config.js
const firebaseConfig = {
  apiKey: "tu-api-key",
  authDomain: "pagina-yoga.firebaseapp.com",
  projectId: "pagina-yoga",
  // ... resto de configuración
};
```

---

## 📈 **Optimizaciones de Rendimiento**

### ⚡ **Características de Rendimiento**
- 🎯 **Lazy Loading**: Carga diferida de módulos
- 📦 **Code Splitting**: División inteligente del código
- 🖼️ **Image Optimization**: Imágenes optimizadas WebP
- 💾 **Service Worker**: Cache inteligente offline
- 📱 **Progressive Loading**: Carga progresiva por dispositivo

### 🎨 **CSS Optimizado**
- 🎨 **CSS Variables**: Sistema de tokens de diseño
- 📱 **Mobile First**: Diseño móvil primero
- 🎭 **Dark Mode**: Modo oscuro automático
- 🎯 **Critical CSS**: CSS crítico inline

### 🧠 **JavaScript Modular**
- 📦 **ES6 Modules**: Módulos nativos del navegador
- 🔄 **Async/Await**: Programación asíncrona moderna
- 💾 **Memory Management**: Gestión optimizada de memoria
- 🎯 **Tree Shaking**: Eliminación de código no usado

---

## 📱 **PWA - Progressive Web App**

### 🌟 **Características PWA**
- 📱 **Instalable**: Como app nativa en móvil/desktop
- 🔄 **Offline**: Funciona sin conexión
- 🔔 **Notificaciones**: Push notifications
- 🔄 **Background Sync**: Sincronización en segundo plano
- ⚡ **Fast Loading**: Carga instantánea

### 🎯 **Manifest Optimizado**
```json
{
  "name": "SoftZen - Yoga Terapéutico",
  "short_name": "SoftZen",
  "display": "standalone",
  "theme_color": "#667eea",
  "background_color": "#667eea",
  "start_url": "/",
  "scope": "/"
}
```

---

## 🗄️ **Base de Datos**

### 📊 **Estructura de Datos**
```
Firestore Collections:
├── users/           # Usuarios (instructores/pacientes)
├── patients/        # Datos de pacientes
├── sessions/        # Sesiones de yoga
├── therapy_series/  # Series terapéuticas
├── postures/        # Posturas de yoga
├── analytics/       # Métricas y estadísticas
└── notifications/   # Notificaciones del sistema
```

### 🔄 **SQLite Local (Backend)**
```sql
-- Estructura optimizada para rendimiento
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id TEXT NOT NULL,
  series_id TEXT,
  start_time DATETIME,
  end_time DATETIME,
  pain_before INTEGER,
  pain_after INTEGER,
  mood_before TEXT,
  mood_after TEXT,
  rating INTEGER,
  comments TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🎨 **Sistema de Diseño**

### 🎨 **Tokens de Diseño**
```css
:root {
  /* Colores principales */
  --primary-500: #667eea;
  --secondary-500: #d946ef;
  
  /* Espaciado consistente */
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  
  /* Tipografía */
  --font-family-base: 'Inter', sans-serif;
  --font-family-display: 'Poppins', sans-serif;
  
  /* Animaciones */
  --transition-base: 0.25s ease-out;
}
```

### 📱 **Responsive Design**
- 📱 **Mobile**: 320px - 767px
- 💻 **Tablet**: 768px - 1023px  
- 🖥️ **Desktop**: 1024px - 1439px
- 🖥️ **Large**: 1440px+

---

## 🧪 **Testing y Quality Assurance**

### ✅ **Verificaciones Automáticas**
- 🔍 **Linting**: ESLint + Prettier
- 🧪 **Testing**: Jest para lógica de negocio
- 📊 **Performance**: Lighthouse CI
- 🔒 **Security**: npm audit + OWASP

### 📊 **Métricas de Calidad**
- ⚡ **Performance Score**: 90+
- ♿ **Accessibility**: 95+
- 🎯 **Best Practices**: 100
- 🔍 **SEO**: 90+

---

## 🚀 **Deployment y DevOps**

### 🔄 **CI/CD Pipeline**
```yaml
# .github/workflows/deploy.yml
name: Deploy SoftZen
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Deploy to Firebase
        run: firebase deploy --only "firestore,hosting"
```

### 🌐 **Environments**
- 🧪 **Development**: http://localhost:3000
- 🚀 **Production**: https://pagina-yoga.web.app
- 📊 **Staging**: Disponible bajo demanda

---

## 📚 **API Documentation**

### 🔗 **Endpoints Principales**
```bash
# Autenticación
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout

# Pacientes (Requiere auth)
GET    /api/patients
POST   /api/patients
PUT    /api/patients/:id
DELETE /api/patients/:id

# Sesiones (Requiere auth)
GET    /api/sessions
POST   /api/sessions
PUT    /api/sessions/:id

# Series terapéuticas (Requiere auth)
GET    /api/series
POST   /api/series
PUT    /api/series/:id

# Dashboard y analytics (Requiere auth)
GET    /api/dashboard/stats
GET    /api/dashboard/recent-activity
```

### 📋 **Ejemplos de Uso**
```javascript
// Crear nueva sesión
const session = await fetch('/api/sessions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    patientId: 'patient-123',
    seriesId: 'series-456',
    painBefore: 7,
    mood: 'ansioso'
  })
});
```

---

## 🔧 **Resolución de Problemas**

### ❓ **Problemas Comunes**

#### 🔥 **Error de Deploy Firebase**
```bash
# Problema: Error sin comillas en PowerShell
❌ firebase deploy --only firestore,hosting

# Solución: Usar comillas
✅ firebase deploy --only "firestore,hosting"
# O usar el script optimizado
✅ ./deploy-optimizado-v2.bat
```

#### 🔐 **Error de Autenticación**
```bash
# Re-autenticar con Firebase
firebase logout
firebase login
firebase use pagina-yoga
```

#### 📦 **Error de Dependencias**
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Verificar versión de Node
node --version  # Requiere v18+
```

#### 🌐 **Error de Conexión**
```bash
# Verificar conectividad
ping firebase.google.com
ping pagina-yoga.web.app

# Verificar puertos
netstat -an | findstr ":3000"
```

### 🆘 **Soporte Rápido**
1. 🔧 Ejecutar `dev-center.bat` → Opción 5 (Verificar configuración)
2. 🧹 Ejecutar `cleanup-optimize.bat` para limpiar archivos
3. 📊 Verificar logs en `backend/logs/`
4. 🔄 Reiniciar servicios con `dev-center.bat`

---

## 🤝 **Contribución y Desarrollo**

### 🛠️ **Setup para Desarrolladores**
```bash
# 1. Fork y clone
git clone [tu-fork-url]
cd Proyecto-SoftZen

# 2. Instalar dependencias
cd backend && npm install && cd ..

# 3. Configurar variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env con tus valores

# 4. Configurar Firebase
cp frontend/js/firebase-config-example.js frontend/js/firebase-config.js
# Editar frontend/js/firebase-config.js

# 5. Iniciar desarrollo
./dev-center.bat
```

### 📝 **Convenciones de Código**
- 🎯 **JavaScript**: ES6+, async/await
- 🎨 **CSS**: Variables CSS, Mobile First
- 📁 **Archivos**: kebab-case
- 🔤 **Variables**: camelCase
- 📦 **Funciones**: verbNoun (getData, createUser)

### 🔄 **Git Workflow**
```bash
# Feature branch
git checkout -b feature/nueva-funcionalidad
git commit -m "feat: agregar nueva funcionalidad"
git push origin feature/nueva-funcionalidad

# Pull request
# Merge to main
# Deploy automático
```

---

## 📊 **Roadmap y Futuras Mejoras**

### 🎯 **V2.2 (Q2 2025)**
- 📊 **Dashboard Avanzado**: Métricas ML
- 🎥 **Video Calls**: Sesiones remotas
- 📱 **App Móvil Nativa**: React Native
- 🌍 **Internacionalización**: Multi-idioma

### 🚀 **V2.3 (Q3 2025)**
- 🤖 **IA Integrada**: Recomendaciones personalizadas
- 💬 **Chat en Tiempo Real**: Comunicación instructor-paciente
- 📈 **Analytics ML**: Predicción de progreso
- 🎮 **Gamificación**: Sistema de logros

### 🌟 **Visión a Largo Plazo**
- 🌐 **Marketplace**: Serie de otros instructores
- 🏥 **Integración Médica**: Historiales clínicos
- 🎓 **Certificaciones**: Cursos para instructores
- 🌍 **Global Scale**: Múltiples países

---

## 📞 **Contacto y Soporte**

### 🆘 **Soporte Técnico**
- 📧 **Email**: soporte@softzen.app
- 💬 **Discord**: [Servidor SoftZen](https://discord.gg/softzen)
- 📱 **WhatsApp**: +1 (555) 123-4567
- 🐛 **Issues**: [GitHub Issues](https://github.com/softzen/issues)

### 👥 **Equipo**
- 🧑‍💻 **Lead Developer**: [@tu-usuario](https://github.com/tu-usuario)
- 🎨 **UI/UX Designer**: [@designer](https://github.com/designer)
- 🧘‍♀️ **Yoga Expert**: [@yoga-expert](https://instagram.com/yoga-expert)

### 🌐 **Enlaces**
- 🌍 **Website**: https://softzen.app
- 📱 **App**: https://pagina-yoga.web.app
- 📊 **Status**: https://status.softzen.app
- 📚 **Docs**: https://docs.softzen.app

---

## 📄 **Licencia**

```
MIT License

Copyright (c) 2025 SoftZen Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

## 🎉 **Agradecimientos**

### 🙏 **Créditos**
- 🔥 **Firebase Team**: Por la plataforma increíble
- 🎨 **Lucide Icons**: Por los iconos hermosos
- 📚 **MDN Web Docs**: Por la documentación excelente
- 🧘‍♀️ **Yoga Community**: Por la inspiración y feedback

### ⭐ **Contributors**
¡Gracias a todos los que han contribuido a SoftZen!

<!-- Contributors serán agregados automáticamente -->

---

<div align="center">

### 🧘‍♀️ **¡Namaste!**

**Hecho con 💙 por el equipo SoftZen**

*"El yoga no es sobre tocar tus pies. Es sobre lo que aprendes en el camino hacia abajo."* 

[![⭐ Star en GitHub](https://img.shields.io/github/stars/softzen/proyecto?style=social)](https://github.com/softzen/proyecto)
[![🍴 Fork](https://img.shields.io/github/forks/softzen/proyecto?style=social)](https://github.com/softzen/proyecto/fork)
[![📱 Demo Live](https://img.shields.io/badge/demo-live-brightgreen)](https://pagina-yoga.web.app)

</div>
