// Cargamos variables de entorno desde .env
require('dotenv').config();

// Exportamos la configuración centralizada para no repetir process.env en todos lados.
module.exports = {
  // Puerto del servidor Express.
  port: process.env.PORT || 4000,
  // URL de conexión a PostgreSQL.
  databaseUrl: process.env.DATABASE_URL,
  // Secreto para firmar JWT.
  jwtSecret: process.env.JWT_SECRET,
  // Duración del token.
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
  // Entorno actual.
  nodeEnv: process.env.NODE_ENV || 'development',
  // Origen permitido para CORS.
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000'
};
