import rateLimit from 'express-rate-limit';

// Rate limiting más estricto para producción
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 5 : 20, // 5 intentos en producción
  message: {
    error: 'Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: {
    error: 'Demasiadas peticiones. Intenta de nuevo más tarde.',
    code: 'API_RATE_LIMIT_EXCEEDED'
  }
});

// Middleware de validación de entrada
export function validateInput(req, res, next) {
  // Sanitizar inputs básicos
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  next();
}
