const db = require('../config/db');
const { clean } = require('../utils/sanitize');

async function getMe(req, res) {
  const result = await db.query(
    'SELECT id, username, nombre, apellido, email, telefono, rol, fecha_creacion FROM users WHERE id = $1',
    [req.user.id]
  );
  return res.json(result.rows[0]);
}

async function getMyCalendar(req, res) {
  const result = await db.query('SELECT * FROM calendar_events WHERE user_id = $1 ORDER BY fecha ASC', [req.user.id]);
  return res.json(result.rows);
}

async function getMyRoutine(req, res) {
  const result = await db.query('SELECT * FROM routines WHERE user_id = $1 ORDER BY dia, id', [req.user.id]);
  return res.json(result.rows);
}

async function getMyHistory(req, res) {
  const result = await db.query('SELECT * FROM history WHERE user_id = $1 ORDER BY fecha DESC', [req.user.id]);
  return res.json(result.rows);
}

async function getForum(req, res) {
  const announcements = await db.query(
    `SELECT ga.*, u.username AS admin_username
     FROM general_announcements ga
     JOIN users u ON u.id = ga.admin_id
     ORDER BY ga.fecha_publicacion DESC`
  );

  const topics = await db.query(
    `SELECT ft.*, u.username AS autor
     FROM forum_topics ft
     JOIN users u ON u.id = ft.user_id
     ORDER BY ft.fecha_creacion DESC`
  );

  return res.json({ announcements: announcements.rows, topics: topics.rows });
}

async function createTopic(req, res) {
  const titulo = clean(req.body.titulo);
  const contenido = clean(req.body.contenido);

  const result = await db.query(
    'INSERT INTO forum_topics (user_id, titulo, contenido) VALUES ($1, $2, $3) RETURNING *',
    [req.user.id, titulo, contenido]
  );

  return res.status(201).json(result.rows[0]);
}

async function listReplies(req, res) {
  const topicId = Number(req.params.topicId);
  const result = await db.query(
    `SELECT fr.*, u.username AS autor
     FROM forum_replies fr
     JOIN users u ON u.id = fr.user_id
     WHERE fr.topic_id = $1
     ORDER BY fr.fecha_respuesta ASC`,
    [topicId]
  );
  return res.json(result.rows);
}

async function createReply(req, res) {
  const topicId = Number(req.params.topicId);
  const contenido = clean(req.body.contenido);

  const result = await db.query(
    'INSERT INTO forum_replies (topic_id, user_id, contenido) VALUES ($1, $2, $3) RETURNING *',
    [topicId, req.user.id, contenido]
  );

  return res.status(201).json(result.rows[0]);
}

async function deleteMyTopic(req, res) {
  const topicId = Number(req.params.topicId);
  const result = await db.query('DELETE FROM forum_topics WHERE id = $1 AND user_id = $2 RETURNING id', [topicId, req.user.id]);

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Debate no encontrado o no te pertenece.' });
  }

  return res.json({ ok: true, deletedId: topicId });
}

async function deleteMyReply(req, res) {
  const replyId = Number(req.params.replyId);
  const result = await db.query('DELETE FROM forum_replies WHERE id = $1 AND user_id = $2 RETURNING id', [replyId, req.user.id]);

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Respuesta no encontrada o no te pertenece.' });
  }

  return res.json({ ok: true, deletedId: replyId });
}

module.exports = {
  getMe,
  getMyCalendar,
  getMyRoutine,
  getMyHistory,
  getForum,
  createTopic,
  listReplies,
  createReply,
  deleteMyTopic,
  deleteMyReply
};