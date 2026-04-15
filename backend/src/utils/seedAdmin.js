const bcrypt = require('bcrypt');
const db = require('../config/db');

async function run() {
  const username = process.env.ADMIN_USERNAME; // CAMBIAR AQUÍ: usuario admin inicial.
  const email = process.env.ADMIN_EMAIL; // CAMBIAR AQUÍ: mail admin inicial.
  const password = process.env.ADMIN_PASSWORD; // CAMBIAR AQUÍ: password admin inicial.
  const nombre = process.env.ADMIN_NOMBRE || 'Admin';
  const apellido = process.env.ADMIN_APELLIDO || 'Principal';
  const telefono = process.env.ADMIN_TELEFONO || '000000000';

  try {
    const exists = await db.query('SELECT id FROM users WHERE rol = $1 LIMIT 1', ['admin']);
    if (exists.rows.length > 0) {
      console.log('Ya existe un administrador, no se crea otro.');
      return;
    }

    const hash = await bcrypt.hash(password, 12);
    await db.query(
      `INSERT INTO users (username, nombre, apellido, email, telefono, password_hash, rol)
       VALUES ($1,$2,$3,$4,$5,$6,'admin')`,
      [username, nombre, apellido, email, telefono, hash]
    );
    console.log('Administrador creado correctamente.');
  } catch (error) {
    console.error('Error creando admin:', error.message);
  } finally {
    await db.pool.end();
  }
}

run();
