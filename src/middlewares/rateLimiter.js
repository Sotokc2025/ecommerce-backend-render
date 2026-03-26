// @ts-check
import rateLimit from "express-rate-limit";

// Rate limiter para autenticación (login/register)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'development' ? 100 : 5, // Aumentado en desarrollo para pruebas
  message: {
    message: "Too many authentication attempts, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter general para API
export const apiLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutos
  max: 10000, // Máximo 10000 requests por ventana
  message: {
    message: "Too many requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter estricto para operaciones sensibles
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 100, // Máximo 3 intentos por hora
  message: {
    message: "Too many attempts, please try again after 1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
