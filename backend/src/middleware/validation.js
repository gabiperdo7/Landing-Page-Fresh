// Helpers de validación.
const { validationResult } = require('express-validator');

// Middleware para devolver errores de validación de forma uniforme.
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Datos inválidos.', errors: errors.array() });
  }
  return next();
}

module.exports = { handleValidation };
