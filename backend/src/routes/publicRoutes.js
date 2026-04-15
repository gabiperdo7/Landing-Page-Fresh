const express = require('express');
const { body } = require('express-validator');
const { getAbout, createContact } = require('../controllers/publicController');
const { handleValidation } = require('../middleware/validation');

const router = express.Router();

router.get('/about', getAbout);
router.post(
  '/contact',
  body('nombre').notEmpty(),
  body('email').isEmail(),
  body('mensaje').isLength({ min: 5, max: 1000 }),
  handleValidation,
  createContact
);

module.exports = router;
