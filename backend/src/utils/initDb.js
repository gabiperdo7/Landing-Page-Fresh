const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function run() {
  try {
    const schemaPath = path.join(__dirname, '../../sql/schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf-8');
    await db.pool.query(sql);
    console.log('Base de datos inicializada correctamente.');
  } catch (error) {
    console.error('Error al inicializar DB:', error.message);
  } finally {
    await db.pool.end();
  }
}

run();
