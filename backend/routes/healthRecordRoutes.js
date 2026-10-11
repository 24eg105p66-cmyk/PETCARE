const express = require('express');
const router = express.Router();
const healthRecordController = require('../controllers/healthRecordController');
const { requireAuth } = require('../middleware/authMiddleware');
const { uploadDocument } = require('../middleware/uploadMiddleware');

router.use(requireAuth);

router.put('/:id', uploadDocument.single('attachment'), healthRecordController.updateHealthRecord);
router.delete('/:id', healthRecordController.deleteHealthRecord);

module.exports = router;
