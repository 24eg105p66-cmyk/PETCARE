const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergencyController');
const foundReportController = require('../controllers/foundReportController');
const { uploadReportPhoto } = require('../middleware/uploadMiddleware');
const { reportLimiter } = require('../middleware/rateLimiter');

// Public route to view pet emergency profile via QR scan
router.get('/:publicId', emergencyController.getPublicEmergencyProfile);

// Public route for finder to submit a found-pet report
router.post(
  '/:publicId/found-reports',
  reportLimiter,
  uploadReportPhoto.single('photo'),
  foundReportController.submitFoundReport
);

module.exports = router;
