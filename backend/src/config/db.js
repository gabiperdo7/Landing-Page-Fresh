// Importamos Pool para gestionar conexiones eficientes a PostgreSQL.
const { Pool } = require('pg');
// Importamos variables de entorno normalizadas.
const env = require('./env');

// Creamos un pool con SSL opcional para producción.
const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.nodeEnv === 'production' ? { rejectUnauthorized: false } : false
});

// Exportamos query helper para usar consultas parametrizadas y evitar SQL Injection.
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
