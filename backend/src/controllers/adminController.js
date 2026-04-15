const db = require('../config/db');
const { clean } = require('../utils/sanitize');

async function listUsers(req, res) {
  const result = await db.query(
    "SELECT id, username, nombre, apellido, email, telefono, rol, fecha_creacion FROM users WHERE rol = 'alumno' ORDER BY id"
  );
  return res.json(result.rows);
}

async function upsertAbout(req, res) {
  const titulo = clean(req.body.titulo);
  const descripcion = clean(req.body.descripcion);
  const imagen_url = clean(req.body.imagen_url);

  const result = await db.query(
    `INSERT INTO about_content (id, titulo, descripcion, imagen_url, actualizado_por)
     VALUES (1, $1, $2, $3, $4)
     ON CONFLICT (id)
     DO UPDATE SET
       titulo = EXCLUDED.titulo,
       descripcion = EXCLUDED.descripcion,
       imagen_url = EXCLUDED.imagen_url,
       actualizado_por = EXCLUDED.actualizado_por,
       actualizado_en = NOW()
     RETURNING *`,
    [titulo, descripcion, imagen_url, req.user.id]
  );

  return res.json(result.rows[0]);
}

async function createCalendarEvent(req, res) {
  const { user_id, titulo, descripcion, fecha, tipo_evento } = req.body;
  const result = await db.query(
    `INSERT INTO calendar_events (user_id, titulo, descripcion, fecha, tipo_evento, creado_por_admin)
     VALUES ($1, $2, $3, $4, $5, true)
     RETURNING *`,
    [Number(user_id), clean(titulo), clean(descripcion), fecha, clean(tipo_evento)]
  );
  return res.status(201).json(result.rows[0]);
}

async function createRoutine(req, res) {
  const { user_id, ejercicio, series, repeticiones, observaciones, dia } = req.body;
  const result = await db.query(
    `INSERT INTO routines (user_id, ejercicio, series, repeticiones, observaciones, dia)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      Number(user_id),
      clean(ejercicio),
      clean(series),
      clean(repeticiones),
      clean(observaciones),
      clean(dia)
    ]
  );
  return res.status(201).json(result.rows[0]);
}

async function createHistory(req, res) {
  const { user_id, fecha, actividad, observaciones, evolucion } = req.body;
  const result = await db.query(
    `INSERT INTO history (user_id, fecha, actividad, observaciones, evolucion)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [Number(user_id), fecha, clean(actividad), clean(observaciones), clean(evolucion)]
  );
  return res.status(201).json(result.rows[0]);
}

function normalizeMediaUrl(value) {
  const v = clean(value);
  return v === '' ? null : v;
}

function inferMediaTypeFromUrl(mediaUrl) {
  if (!mediaUrl) return null;
  const lower = mediaUrl.toLowerCase();

  if (lower.includes('youtube.com/watch') || lower.includes('youtu.be/')) return 'youtube';
  if (lower.includes('drive.google.com/')) return 'drive';
  if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(lower)) return 'imagen';
  if (/\.(mp4|webm|ogg|mov|m4v)$/i.test(lower)) return 'video';
  return 'link';
}

async function createAnnouncement(req, res) {
  const titulo = clean(req.body.titulo);
  const subtitulo = clean(req.body.subtitulo);
  const contenido = clean(req.body.contenido);
  const link = clean(req.body.link);
  const mediaUrl = normalizeMediaUrl(req.body.media_url);
  const tipoMedia = inferMediaTypeFromUrl(mediaUrl);

  const result = await db.query(
    `INSERT INTO general_announcements (titulo, subtitulo, contenido, link, media_url, tipo_media, admin_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [titulo, subtitulo, contenido, link, mediaUrl, tipoMedia, req.user.id]
  );

  return res.status(201).json(result.rows[0]);
}

async function deleteAnnouncement(req, res) {
  const announcementId = Number(req.params.announcementId);
  const result = await db.query('DELETE FROM general_announcements WHERE id = $1 RETURNING id', [announcementId]);

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Aviso no encontrado.' });
  }

  return res.json({ ok: true, deletedId: announcementId });
}

async function deleteTopic(req, res) {
  const topicId = Number(req.params.topicId);
  const result = await db.query('DELETE FROM forum_topics WHERE id = $1 RETURNING id', [topicId]);

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Debate no encontrado.' });
  }

  return res.json({ ok: true, deletedId: topicId });
}

async function deleteReply(req, res) {
  const replyId = Number(req.params.replyId);
  const result = await db.query('DELETE FROM forum_replies WHERE id = $1 RETURNING id', [replyId]);

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Respuesta no encontrada.' });
  }

  return res.json({ ok: true, deletedId: replyId });
}

module.exports = {
  listUsers,
  upsertAbout,
  createCalendarEvent,
  createRoutine,
  createHistory,
  createAnnouncement,
  deleteAnnouncement,
  deleteTopic,
  deleteReply
};