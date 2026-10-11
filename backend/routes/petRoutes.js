const express = require('express');
const router = express.Router();
const petController = require('../controllers/petController');
const healthRecordController = require('../controllers/healthRecordController');
const qrController = require('../controllers/qrController');
const { requireAuth } = require('../middleware/authMiddleware');
const { uploadPetPhoto, uploadDocument } = require('../middleware/uploadMiddleware');

// All pet routes require authentication
router.use(requireAuth);

// Core Pet CRUD
router.get('/', petController.getAllPets);
router.post('/', uploadPetPhoto.single('photo'), petController.createPet);
router.get('/:id', petController.getPetById);
router.put('/:id', uploadPetPhoto.single('photo'), petController.updatePet);
router.delete('/:id', petController.deletePet);

// Health Records for Pet
router.get('/:petId/health-records', healthRecordController.getHealthRecordsByPet);
router.post('/:petId/health-records', uploadDocument.single('attachment'), healthRecordController.addHealthRecord);

// QR Code Management
router.get('/:id/qr', qrController.getPetQR);
router.post('/:id/qr', qrController.regenerateQR);

// Emergency Privacy Settings
router.get('/:id/emergency-settings', qrController.getEmergencySettings);
router.put('/:id/emergency-settings', qrController.updateEmergencySettings);

module.exports = router;
