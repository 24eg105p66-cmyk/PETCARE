const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.get('/summary', reminderController.getDashboardSummary);

module.exports = router;
