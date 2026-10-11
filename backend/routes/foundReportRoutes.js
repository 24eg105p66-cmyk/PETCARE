const express = require('express');
const router = express.Router();
const foundReportController = require('../controllers/foundReportController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.get('/', foundReportController.getOwnerFoundReports);
router.patch('/:id/status', foundReportController.updateReportStatus);

module.exports = router;
