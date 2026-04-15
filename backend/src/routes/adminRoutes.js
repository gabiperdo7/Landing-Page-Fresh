const express = require('express');
const { body, param } = require('express-validator');

const { requireAuth, requireAdmin } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validation');
const ctrl = require('../controllers/adminController');

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get('/users', ctrl.listUsers);

router.put(
  '/about',
  body('titulo').notEmpty(),
  body('descripcion').notEmpty(),
  handleValidation,
  ctrl.upsertAbout
);

router.post(
  '/calendar',
  body('user_id').isInt(),
  body('titulo').notEmpty(),
  body('fecha').isISO8601(),
  handleValidation,
  ctrl.createCalendarEvent
);

router.post(
  '/routines',
  body('user_id').isInt(),
  body('ejercicio').notEmpty(),
  handleValidation,
  ctrl.createRoutine
);

router.post(
  '/history',
  body('user_id').isInt(),
  body('fecha').isISO8601(),
  body('actividad').notEmpty(),
  handleValidation,
  ctrl.createHistory
);

router.post(
  '/announcements',
  body('titulo').notEmpty(),
  body('contenido').notEmpty(),
  handleValidation,
  ctrl.createAnnouncement
);

router.delete(
  '/announcements/:announcementId',
  param('announcementId').isInt(),
  handleValidation,
  ctrl.deleteAnnouncement
);

router.delete(
  '/forum/topics/:topicId',
  param('topicId').isInt(),
  handleValidation,
  ctrl.deleteTopic
);

router.delete(
  '/forum/replies/:replyId',
  param('replyId').isInt(),
  handleValidation,
  ctrl.deleteReply
);

module.exports = router;