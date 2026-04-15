// Librería para validar JWT.
const jwt = require('jsonwebtoken');
const env = require('../config/env');

// Middleware para requerir sesión válida.
function requireAuth(req, res, next) {
  // Leemos token de cookie httpOnly.
  const token = req.cookies?.token;
  // Si no hay token, rechazamos.
  if (!token) {
    return res.status(401).json({ message: 'No autenticado.' });
  }

  try {
    // Verificamos firma y expiración del token.
    const payload = jwt.verify(token, env.jwtSecret);
    // Guardamos payload en request para uso posterior.
    req.user = payload;
    return next();
  } catch (error) {
    // Error genérico para no filtrar detalles de seguridad.
    return res.status(401).json({ message: 'Sesión inválida o expirada.' });
  }
}

// Middleware para exigir rol admin.
function requireAdmin(req, res, next) {
  if (req.user?.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso solo para administrador.' });
  }
  return next();
}

module.exports = { requireAuth, requireAdmin };
