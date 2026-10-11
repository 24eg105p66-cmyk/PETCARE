const { query } = require('../config/db');
const { generatePetQRCode, getQRCodeDataUrl, getAppUrl } = require('../services/qrService');

// GET /api/pets/:id/qr - Get QR details for owner view/download
async function getPetQR(req, res) {
  try {
    const userId = req.user.id;
    const petId = req.params.id;

    const [pets] = await query('SELECT * FROM pets WHERE id = ? AND user_id = ?', [petId, userId]);
    if (pets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found or unauthorized.'
      });
    }

    const pet = pets[0];
    const appUrl = getAppUrl();
    const emergencyUrl = `${appUrl}/emergency/${pet.public_id}`;

    // Ensure QR code image exists or regenerate
    let qrCodeUrl = pet.qr_code_url;
    if (!qrCodeUrl) {
      const qrGen = await generatePetQRCode(pet.public_id);
      qrCodeUrl = qrGen.qrCodeUrl;
      await query('UPDATE pets SET qr_code_url = ? WHERE id = ?', [qrCodeUrl, pet.id]);
    }

    const qrDataUrl = await getQRCodeDataUrl(pet.public_id);

    return res.status(200).json({
      success: true,
      pet: {
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        photo_url: pet.photo_url,
        public_id: pet.public_id,
        microchip_number: pet.microchip_number
      },
      qrCodeUrl,
      qrDataUrl,
      emergencyUrl
    });
  } catch (error) {
    console.error('Get pet QR error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve QR code information.'
    });
  }
}

// POST /api/pets/:id/qr - Regenerate QR code image
async function regenerateQR(req, res) {
  try {
    const userId = req.user.id;
    const petId = req.params.id;

    const [pets] = await query('SELECT * FROM pets WHERE id = ? AND user_id = ?', [petId, userId]);
    if (pets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found or unauthorized.'
      });
    }

    const pet = pets[0];
    const qrGen = await generatePetQRCode(pet.public_id);

    await query('UPDATE pets SET qr_code_url = ? WHERE id = ?', [qrGen.qrCodeUrl, pet.id]);

    return res.status(200).json({
      success: true,
      message: 'QR code regenerated successfully.',
      qrCodeUrl: qrGen.qrCodeUrl,
      emergencyUrl: qrGen.emergencyUrl
    });
  } catch (error) {
    console.error('Regenerate QR error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to regenerate QR code.'
    });
  }
}

// GET /api/pets/:id/emergency-settings
async function getEmergencySettings(req, res) {
  try {
    const userId = req.user.id;
    const petId = req.params.id;

    const [pets] = await query('SELECT id, name, species, breed, photo_url, public_id FROM pets WHERE id = ? AND user_id = ?', [petId, userId]);
    if (pets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found or unauthorized.'
      });
    }

    let [settings] = await query('SELECT * FROM emergency_privacy_settings WHERE pet_id = ?', [petId]);
    if (settings.length === 0) {
      await query(`
        INSERT INTO emergency_privacy_settings (pet_id, show_photo, show_name, show_species_breed, show_medical_alerts, show_allergies, show_special_care, show_emergency_phone, show_contact_form)
        VALUES (?, 1, 1, 1, 1, 1, 1, 0, 1)
      `, [petId]);
      const [newSettings] = await query('SELECT * FROM emergency_privacy_settings WHERE pet_id = ?', [petId]);
      settings = newSettings;
    }

    return res.status(200).json({
      success: true,
      pet: pets[0],
      settings: settings[0]
    });
  } catch (error) {
    console.error('Get emergency settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve emergency settings.'
    });
  }
}

// PUT /api/pets/:id/emergency-settings
async function updateEmergencySettings(req, res) {
  try {
    const userId = req.user.id;
    const petId = req.params.id;

    // Verify ownership
    const [pets] = await query('SELECT id FROM pets WHERE id = ? AND user_id = ?', [petId, userId]);
    if (pets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found or unauthorized.'
      });
    }

    const {
      show_photo,
      show_name,
      show_species_breed,
      show_medical_alerts,
      show_allergies,
      show_special_care,
      show_emergency_phone,
      show_contact_form,
      custom_emergency_instructions
    } = req.body;

    await query(`
      INSERT INTO emergency_privacy_settings (
        pet_id, show_photo, show_name, show_species_breed,
        show_medical_alerts, show_allergies, show_special_care,
        show_emergency_phone, show_contact_form, custom_emergency_instructions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        show_photo = VALUES(show_photo),
        show_name = VALUES(show_name),
        show_species_breed = VALUES(show_species_breed),
        show_medical_alerts = VALUES(show_medical_alerts),
        show_allergies = VALUES(show_allergies),
        show_special_care = VALUES(show_special_care),
        show_emergency_phone = VALUES(show_emergency_phone),
        show_contact_form = VALUES(show_contact_form),
        custom_emergency_instructions = VALUES(custom_emergency_instructions)
    `, [
      petId,
      show_photo ? 1 : 0,
      show_name ? 1 : 0,
      show_species_breed ? 1 : 0,
      show_medical_alerts ? 1 : 0,
      show_allergies ? 1 : 0,
      show_special_care ? 1 : 0,
      show_emergency_phone ? 1 : 0,
      show_contact_form ? 1 : 0,
      custom_emergency_instructions ? custom_emergency_instructions.trim() : null
    ]);

    return res.status(200).json({
      success: true,
      message: 'Emergency privacy settings updated successfully. Changes are live immediately on the public QR profile.'
    });
  } catch (error) {
    console.error('Update emergency settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update emergency settings.'
    });
  }
}

module.exports = {
  getPetQR,
  regenerateQR,
  getEmergencySettings,
  updateEmergencySettings
};
