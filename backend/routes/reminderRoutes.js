const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.get('/', reminderController.getReminders);

module.exports = router;
