const express = require('express');
const path = require('path');
const morgan = require('morgan');
const csurf = require('csurf');
const { applySecurity } = require('./middleware/security');

const authRoutes = require('./routes/authRoutes');
const publicRoutes = require('./routes/publicRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

applySecurity(app);

// Aumentamos límite por si hay payloads algo más grandes.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(morgan('dev'));

// Servir carpeta de uploads (para ver imágenes/videos subidos).
// Queda accesible como: http://localhost:4000/uploads/archivo.ext
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(
  csurf({
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    }
  })
);

app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((error, req, res, next) => {
  if (error.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ message: 'Token CSRF inválido.' });
  }

  // Error típico de multer (archivo muy grande, tipo inválido, etc).
  if (error.name === 'MulterError') {
    return res.status(400).json({ message: `Error de archivo: ${error.message}` });
  }

  // Error custom de fileFilter en multer.
  if (error.message && error.message.includes('Solo se permiten archivos')) {
    return res.status(400).json({ message: error.message });
  }

  console.error(error);
  return res.status(500).json({ message: 'Error interno del servidor.' });
});

module.exports = app;