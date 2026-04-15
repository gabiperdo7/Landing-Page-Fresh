const db = require('../config/db');
const { clean } = require('../utils/sanitize');

async function getAbout(req, res) {
  const result = await db.query('SELECT * FROM about_content WHERE id = 1');
  if (result.rows.length === 0) {
    return res.json({
      titulo: 'Transformá tu cuerpo con entrenamiento personalizado',
      descripcion: 'Plan profesional, seguimiento real y objetivos medibles.',
      imagen_url: '/images/trainer-placeholder.jpg'
    });
  }
  return res.json(result.rows[0]);
}

async function createContact(req, res) {
  const nombre = clean(req.body.nombre);
  const email = clean(req.body.email);
  const mensaje = clean(req.body.mensaje);

  await db.query(
    'INSERT INTO contact_messages (nombre, email, mensaje) VALUES ($1,$2,$3)',
    [nombre, email, mensaje]
  );

  return res.status(201).json({ message: 'Mensaje enviado correctamente.' });
}

module.exports = { getAbout, createContact };
