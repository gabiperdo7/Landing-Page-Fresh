// Middleware de seguridad base.
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const env = require('../config/env');

// Configuración de rate limit para login/registro.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos, probá más tarde.' }
});

// Función que aplica todos los middlewares de seguridad al app.
function applySecurity(app) {
  app.use(helmet());
  app.use(cors({
    origin: env.frontendOrigin,
    credentials: true
  }));
  app.use(cookieParser());
}

module.exports = { applySecurity, authLimiter };
