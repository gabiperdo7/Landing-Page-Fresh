const express = require('express');
const { body } = require('express-validator');
const { register, login, logout } = require('../controllers/authController');
const { handleValidation } = require('../middleware/validation');
const { authLimiter } = require('../middleware/security');

const router = express.Router();

router.post(
  '/register',
  authLimiter,
  body('username').isLength({ min: 3, max: 30 }),
  body('nombre').notEmpty(),
  body('apellido').notEmpty(),
  body('email').isEmail(),
  body('telefono').isLength({ min: 6, max: 20 }),
  body('password').isStrongPassword({ minLength: 8, minSymbols: 1 }),
  handleValidation,
  register
);

router.post(
  '/login',
  authLimiter,
  body('identifier').notEmpty(),
  body('password').notEmpty(),
  handleValidation,
  login
);

router.post('/logout', logout);

module.exports = router;
