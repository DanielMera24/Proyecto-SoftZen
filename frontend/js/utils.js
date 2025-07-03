// ===================================================================
// UTILITIES - SOFTZEN V2.1 - OPTIMIZADO Y CORREGIDO
// Conjunto completo de utilidades para rendimiento y funcionalidad
// ===================================================================

// ========== GESTORES DE NOTIFICACIONES ==========
export class NotificationManager {
  static container = null;
  static notifications = new Map();
  static maxNotifications = 5;
  static defaultDuration = 4000;

  static init() {
    if (this.container) return;
    
    this.container = document.createElement('div');
    this.container.id = 'notifications-container';
    this.container.className = 'notifications-container';
    document.body.appendChild(this.container);
  }

  static show(message, type = 'info', duration = this.defaultDuration, options = {}) {
    this.init();
    
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const notification = document.createElement('div');
    notification.id = id;
    notification.className = `notification notification-${type} notification-enter`;
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${icons[type] || icons.info}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="NotificationManager.remove('${id}')">&times;</button>
      </div>
      ${duration > 0 ? `<div class="notification-progress"></div>` : ''}
    `;
    
    // Limitar número de notificaciones
    if (this.notifications.size >= this.maxNotifications) {
      const oldestId = this.notifications.keys().next().value;
      this.remove(oldestId);
    }
    
    this.container.appendChild(notification);
    this.notifications.set(id, notification);
    
    // Animación de entrada
    setTimeout(() => {
      notification.classList.add('notification-show');
    }, 10);
    
    // Auto-remove si tiene duración
    if (duration > 0) {
      const progressBar = notification.querySelector('.notification-progress');
      if (progressBar) {
        progressBar.style.animationDuration = `${duration}ms`;
        progressBar.classList.add('notification-progress-animate');
      }
      
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
    
    return id;
  }

  static remove(id) {
    const notification = this.notifications.get(id);
    if (!notification) return;
    
    notification.classList.remove('notification-show');
    notification.classList.add('notification-exit');
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      this.notifications.delete(id);
    }, 300);
  }

  static showSuccess(message, duration, options) {
    return this.show(message, 'success', duration, options);
  }

  static showError(message, duration = 6000, options) {
    return this.show(message, 'error', duration, options);
  }

  static showWarning(message, duration, options) {
    return this.show(message, 'warning', duration, options);
  }

  static showInfo(message, duration, options) {
    return this.show(message, 'info', duration, options);
  }

  static clear() {
    this.notifications.forEach((notification, id) => {
      this.remove(id);
    });
  }
}

// ========== GESTOR DE MODALES ==========
export class ModalManager {
  static activeModal = null;
  static modalStack = [];

  static alert(title, message, type = 'info') {
    return new Promise((resolve) => {
      const modal = this.createModal({
        title,
        message,
        type,
        buttons: [
          {
            text: 'Entendido',
            action: () => {
              this.close();
              resolve(true);
            },
            primary: true
          }
        ]
      });
      
      this.show(modal);
    });
  }

  static confirm(title, message, options = {}) {
    return new Promise((resolve) => {
      const modal = this.createModal({
        title,
        message,
        type: options.type || 'question',
        buttons: [
          {
            text: options.cancelText || 'Cancelar',
            action: () => {
              this.close();
              resolve(false);
            }
          },
          {
            text: options.confirmText || 'Confirmar',
            action: () => {
              this.close();
              resolve(true);
            },
            primary: true
          }
        ]
      });
      
      this.show(modal);
    });
  }

  static prompt(title, message, defaultValue = '') {
    return new Promise((resolve) => {
      const inputId = `modal-input-${Date.now()}`;
      
      const modal = this.createModal({
        title,
        message: `
          ${message}
          <input type="text" id="${inputId}" class="modal-input" value="${defaultValue}" placeholder="Ingresa tu respuesta...">
        `,
        type: 'question',
        buttons: [
          {
            text: 'Cancelar',
            action: () => {
              this.close();
              resolve(null);
            }
          },
          {
            text: 'Aceptar',
            action: () => {
              const input = document.getElementById(inputId);
              const value = input ? input.value.trim() : '';
              this.close();
              resolve(value);
            },
            primary: true
          }
        ]
      });
      
      this.show(modal);
      
      // Focus en el input después de mostrar
      setTimeout(() => {
        const input = document.getElementById(inputId);
        if (input) {
          input.focus();
          input.select();
        }
      }, 100);
    });
  }

  static createModal({ title, message, type, buttons = [] }) {
    const modalId = `modal-${Date.now()}`;
    
    const typeIcons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      question: '❓'
    };
    
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
      <div class="modal-container modal-${type}">
        <div class="modal-header">
          <div class="modal-icon">${typeIcons[type] || typeIcons.info}</div>
          <h3 class="modal-title">${title}</h3>
        </div>
        <div class="modal-body">
          <div class="modal-message">${message}</div>
        </div>
        <div class="modal-footer">
          ${buttons.map((button, index) => `
            <button class="modal-button ${button.primary ? 'modal-button-primary' : 'modal-button-secondary'}" 
                    data-action="${index}">
              ${button.text}
            </button>
          `).join('')}
        </div>
      </div>
    `;
    
    // Event listeners para botones
    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        // Cerrar al hacer click fuera del modal
        if (buttons.length > 0) {
          buttons[0].action(); // Ejecutar acción del primer botón (generalmente cancelar)
        }
      } else if (e.target.classList.contains('modal-button')) {
        const actionIndex = parseInt(e.target.dataset.action);
        if (buttons[actionIndex]) {
          buttons[actionIndex].action();
        }
      }
    });
    
    // Cerrar con Escape
    const handleEscape = (e) => {
      if (e.key === 'Escape' && this.activeModal === modal) {
        if (buttons.length > 0) {
          buttons[0].action();
        }
        document.removeEventListener('keydown', handleEscape);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    
    return modal;
  }

  static show(modal) {
    if (this.activeModal) {
      this.modalStack.push(this.activeModal);
      this.activeModal.style.zIndex = '9998';
    }
    
    this.activeModal = modal;
    document.body.appendChild(modal);
    
    // Animación de entrada
    setTimeout(() => {
      modal.classList.add('modal-show');
    }, 10);
  }

  static close() {
    if (!this.activeModal) return;
    
    this.activeModal.classList.remove('modal-show');
    
    setTimeout(() => {
      if (this.activeModal && this.activeModal.parentNode) {
        this.activeModal.parentNode.removeChild(this.activeModal);
      }
      
      // Restaurar modal anterior si existe
      if (this.modalStack.length > 0) {
        this.activeModal = this.modalStack.pop();
        this.activeModal.style.zIndex = '9999';
      } else {
        this.activeModal = null;
      }
    }, 300);
  }
}

// ========== GESTOR DE LOADING ==========
export class LoadingManager {
  static overlay = null;
  static isVisible = false;
  static queue = [];

  static init() {
    if (this.overlay) return;
    
    this.overlay = document.createElement('div');
    this.overlay.id = 'loading-overlay';
    this.overlay.className = 'loading-overlay';
    this.overlay.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">Cargando...</div>
      </div>
    `;
    
    document.body.appendChild(this.overlay);
  }

  static show(message = 'Cargando...') {
    this.init();
    
    const textEl = this.overlay.querySelector('.loading-text');
    if (textEl) {
      textEl.textContent = message;
    }
    
    if (!this.isVisible) {
      this.overlay.style.display = 'flex';
      setTimeout(() => {
        this.overlay.classList.add('loading-show');
      }, 10);
      this.isVisible = true;
    }
    
    this.queue.push(message);
  }

  static hide() {
    if (this.queue.length > 0) {
      this.queue.pop();
    }
    
    if (this.queue.length === 0 && this.isVisible) {
      this.overlay.classList.remove('loading-show');
      
      setTimeout(() => {
        this.overlay.style.display = 'none';
        this.isVisible = false;
      }, 300);
    }
  }

  static hideAll() {
    this.queue = [];
    this.hide();
  }
}

// ========== EXPORTADOR DE DATOS ==========
export class DataExporter {
  static exportToCSV(data, filename = 'data.csv') {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Los datos deben ser un array no vacío');
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        // Escapar valores que contengan comas o comillas
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(','))
    ].join('\\n');
    
    this.downloadFile(csvContent, filename, 'text/csv');
  }

  static exportToJSON(data, filename = 'data.json') {
    const jsonContent = JSON.stringify(data, null, 2);
    this.downloadFile(jsonContent, filename, 'application/json');
  }

  static downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Limpiar URL objeto
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
}

// ========== VALIDADOR DE FORMULARIOS ==========
export class FormValidator {
  static validateEmail(email) {
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password) {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    const score = Object.values(checks).filter(Boolean).length;
    
    let strength = 'very-weak';
    if (score >= 5) strength = 'very-strong';
    else if (score >= 4) strength = 'strong';
    else if (score >= 3) strength = 'good';
    else if (score >= 2) strength = 'fair';
    else if (score >= 1) strength = 'weak';
    
    return {
      isValid: score >= 3,
      strength,
      score,
      checks
    };
  }

  static validatePhone(phone) {
    const phoneRegex = /^[\\+]?[0-9]{10,15}$/;
    return phoneRegex.test(phone.replace(/[\\s\\-\\(\\)]/g, ''));
  }

  static validateRequired(value) {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  }

  static validateNumber(value, min = null, max = null) {
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    if (min !== null && num < min) return false;
    if (max !== null && num > max) return false;
    return true;
  }
}

// ========== FORMATEADOR DE FECHAS ==========
export class DateFormatter {
  static format(date, format = 'dd/mm/yyyy') {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    
    return format
      .replace('dd', day)
      .replace('mm', month)
      .replace('yyyy', year)
      .replace('hh', hours)
      .replace('MM', minutes);
  }

  static relative(date) {
    if (!date) return '';
    
    const now = new Date();
    const d = new Date(date);
    const diffMs = now - d;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) return 'hace unos segundos';
    if (diffMins < 60) return `hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    
    return this.format(date, 'dd/mm/yyyy');
  }

  static timeAgo(date) {
    return this.relative(date);
  }
}

// ========== GESTOR DE STORAGE ==========
export class StorageManager {
  static set(key, value, expiry = null) {
    try {
      const data = {
        value,
        timestamp: Date.now(),
        expiry
      };
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.warn('Error guardando en localStorage:', error);
      return false;
    }
  }

  static get(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      const data = JSON.parse(item);
      
      // Verificar expiración
      if (data.expiry && Date.now() > data.timestamp + data.expiry) {
        this.remove(key);
        return null;
      }
      
      return data.value;
    } catch (error) {
      console.warn('Error leyendo de localStorage:', error);
      return null;
    }
  }

  static remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('Error eliminando de localStorage:', error);
      return false;
    }
  }

  static clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('Error limpiando localStorage:', error);
      return false;
    }
  }

  static getSize() {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  }
}

// ========== GESTOR RESPONSIVE ==========
export class ResponsiveManager {
  static breakpoints = {
    mobile: 768,
    tablet: 1024,
    desktop: 1440
  };

  static getCurrentBreakpoint() {
    const width = window.innerWidth;
    
    if (width < this.breakpoints.mobile) return 'mobile';
    if (width < this.breakpoints.tablet) return 'tablet';
    if (width < this.breakpoints.desktop) return 'desktop';
    return 'large';
  }

  static isMobile() {
    return this.getCurrentBreakpoint() === 'mobile';
  }

  static isTablet() {
    return this.getCurrentBreakpoint() === 'tablet';
  }

  static isDesktop() {
    const bp = this.getCurrentBreakpoint();
    return bp === 'desktop' || bp === 'large';
  }

  static addBreakpointListener(callback) {
    let currentBp = this.getCurrentBreakpoint();
    
    const handler = () => {
      const newBp = this.getCurrentBreakpoint();
      if (newBp !== currentBp) {
        currentBp = newBp;
        callback(newBp);
      }
    };
    
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }
}

// ========== MONITOR DE RENDIMIENTO ==========
export class PerformanceMonitor {
  static marks = new Map();
  static measures = new Map();
  static isMonitoring = false;

  static mark(name) {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
      this.marks.set(name, performance.now());
    }
  }

  static measure(name, startMark, endMark) {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        
        const entries = performance.getEntriesByName(name);
        if (entries.length > 0) {
          const duration = entries[entries.length - 1].duration;
          this.measures.set(name, duration);
          
          if (this.isMonitoring) {
            console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
          }
          
          return duration;
        }
      } catch (error) {
        console.warn('Error en performance.measure:', error);
      }
    }
    return null;
  }

  static startMonitoring() {
    this.isMonitoring = true;
    
    // Monitorear métricas básicas
    if (typeof performance !== 'undefined') {
      setTimeout(() => {
        this.logNavigationTiming();
      }, 1000);
    }
  }

  static stopMonitoring() {
    this.isMonitoring = false;
  }

  static logNavigationTiming() {
    if (!performance.getEntriesByType) return;
    
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      console.log('📊 Métricas de navegación:', {
        'DNS Lookup': `${(navigation.domainLookupEnd - navigation.domainLookupStart).toFixed(2)}ms`,
        'Connection': `${(navigation.connectEnd - navigation.connectStart).toFixed(2)}ms`,
        'Request/Response': `${(navigation.responseEnd - navigation.requestStart).toFixed(2)}ms`,
        'DOM Processing': `${(navigation.domContentLoadedEventEnd - navigation.responseEnd).toFixed(2)}ms`,
        'Load Complete': `${(navigation.loadEventEnd - navigation.navigationStart).toFixed(2)}ms`
      });
    }
  }

  static getStats() {
    return {
      marks: Object.fromEntries(this.marks),
      measures: Object.fromEntries(this.measures),
      memory: this.getMemoryInfo()
    };
  }

  static getMemoryInfo() {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }
    return null;
  }
}

// ========== FUNCIONES DE DEBOUNCE Y THROTTLE ==========
export function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ========== FUNCIONES DE UTILIDAD GENERAL ==========
export function generateId(prefix = '') {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

export function isObjectEmpty(obj) {
  return Object.keys(obj).length === 0;
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function truncate(str, length = 100, suffix = '...') {
  if (str.length <= length) return str;
  return str.substring(0, length) + suffix;
}

// ========== INICIALIZACIÓN AUTOMÁTICA ==========
// Hacer disponibles globalmente para compatibilidad
if (typeof window !== 'undefined') {
  window.NotificationManager = NotificationManager;
  window.ModalManager = ModalManager;
  window.LoadingManager = LoadingManager;
  window.DataExporter = DataExporter;
  window.FormValidator = FormValidator;
  window.DateFormatter = DateFormatter;
  window.StorageManager = StorageManager;
  window.ResponsiveManager = ResponsiveManager;
  window.PerformanceMonitor = PerformanceMonitor;
  
  // Agregar funciones utilitarias al namespace global SoftZenUtils
  window.SoftZenUtils = {
    NotificationManager,
    ModalManager,
    LoadingManager,
    DataExporter,
    FormValidator,
    DateFormatter,
    StorageManager,
    ResponsiveManager,
    PerformanceMonitor,
    debounce,
    throttle,
    generateId,
    formatBytes,
    clamp,
    randomBetween,
    deepClone,
    isObjectEmpty,
    capitalize,
    truncate
  };
}

console.log('🛠️ SoftZen Utils - Todas las utilidades cargadas correctamente');
