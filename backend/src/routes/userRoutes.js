const express = require('express');
const { body, param } = require('express-validator');

const { requireAuth } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validation');
const ctrl = require('../controllers/userDataController');

const router = express.Router();

router.use(requireAuth);

router.get('/me', ctrl.getMe);
router.get('/calendar', ctrl.getMyCalendar);
router.get('/routine', ctrl.getMyRoutine);
router.get('/history', ctrl.getMyHistory);
router.get('/forum', ctrl.getForum);

router.post(
  '/forum/topics',
  body('titulo').notEmpty(),
  body('contenido').notEmpty(),
  handleValidation,
  ctrl.createTopic
);

router.delete(
  '/forum/topics/:topicId',
  param('topicId').isInt(),
  handleValidation,
  ctrl.deleteMyTopic
);

router.get(
  '/forum/topics/:topicId/replies',
  param('topicId').isInt(),
  handleValidation,
  ctrl.listReplies
);

router.post(
  '/forum/topics/:topicId/replies',
  param('topicId').isInt(),
  body('contenido').notEmpty(),
  handleValidation,
  ctrl.createReply
);

router.delete(
  '/forum/replies/:replyId',
  param('replyId').isInt(),
  handleValidation,
  ctrl.deleteMyReply
);

module.exports = router;