const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const env = require('../config/env');
const { clean } = require('../utils/sanitize');

async function register(req, res) {
  const username = clean(req.body.username);
  const nombre = clean(req.body.nombre);
  const apellido = clean(req.body.apellido);
  const email = clean(req.body.email?.toLowerCase());
  const telefono = clean(req.body.telefono);
  const password = req.body.password;

  const exists = await db.query(
    'SELECT id FROM users WHERE username = $1 OR email = $2 LIMIT 1',
    [username, email]
  );

  if (exists.rows.length > 0) {
    return res.status(409).json({ message: 'Usuario o mail ya existe.' });
  }

  const hash = await bcrypt.hash(password, 12);

  const result = await db.query(
    `INSERT INTO users (username, nombre, apellido, email, telefono, password_hash, rol)
     VALUES ($1,$2,$3,$4,$5,$6,'alumno')
     RETURNING id, username, nombre, apellido, email, rol`,
    [username, nombre, apellido, email, telefono, hash]
  );

  return res.status(201).json({ message: 'Registro exitoso.', user: result.rows[0] });
}

async function login(req, res) {
  const identifier = clean(req.body.identifier?.toLowerCase());
  const password = req.body.password;

  const result = await db.query(
    'SELECT id, username, nombre, apellido, email, password_hash, rol FROM users WHERE username = $1 OR email = $1 LIMIT 1',
    [identifier]
  );

  if (result.rows.length === 0) {
    return res.status(401).json({ message: 'Credenciales inválidas.' });
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return res.status(401).json({ message: 'Credenciales inválidas.' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, rol: user.rol },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 2
  });

  return res.json({
    message: 'Login correcto.',
    user: {
      id: user.id,
      username: user.username,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      rol: user.rol
    }
  });
}

function logout(req, res) {
  res.clearCookie('token');
  return res.json({ message: 'Sesión cerrada.' });
}

module.exports = { register, login, logout };
