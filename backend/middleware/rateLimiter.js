import rateLimit from 'express-rate-limit';

// Rate limiter para API general
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por ventana
  message: 'Demasiadas solicitudes desde esta IP, por favor intente de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter estricto para auth
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // límite de 5 intentos de login
  message: 'Demasiados intentos de login, por favor intente de nuevo más tarde.',
  skipSuccessfulRequests: true,
});

// Rate limiter para creación de contenido
export const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 30, // límite de 30 creaciones por hora
  message: 'Límite de creación excedido, por favor intente más tarde.',
});

export default apiLimiter;
