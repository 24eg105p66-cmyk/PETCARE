const fs = require('fs');
const path = require('path');
const { query } = require('../config/db');
const { generatePublicId, generatePetQRCode, getAppUrl } = require('../services/qrService');

// Helper to remove uploaded file if exists
function removeFileSafe(relativeUrl) {
  if (!relativeUrl) return;
  const filePath = path.join(__dirname, '..', relativeUrl);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.warn('Failed to delete file:', filePath, e.message);
    }
  }
}

// GET /api/pets - Get all pets for authenticated user
async function getAllPets(req, res) {
  try {
    const userId = req.user.id;
    const [pets] = await query(`
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM health_records hr WHERE hr.pet_id = p.id) AS total_health_records,
        (SELECT COUNT(*) FROM health_records hr 
         WHERE hr.pet_id = p.id 
           AND hr.category = 'vaccination' 
           AND hr.next_due_date < CURDATE()) AS overdue_vaccinations_count,
        (SELECT COUNT(*) FROM health_records hr 
         WHERE hr.pet_id = p.id 
           AND hr.next_due_date >= CURDATE() 
           AND hr.next_due_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)) AS upcoming_reminders_count,
        (SELECT COUNT(*) FROM found_pet_reports fpr WHERE fpr.pet_id = p.id AND fpr.status = 'pending') AS pending_reports_count
      FROM pets p
      WHERE p.user_id = ? AND p.is_active = 1
      ORDER BY p.created_at DESC
    `, [userId]);

    return res.status(200).json({
      success: true,
      count: pets.length,
      pets
    });
  } catch (error) {
    console.error('Get all pets error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve pets.'
    });
  }
}

// GET /api/pets/:id - Get single pet with privacy settings and health record summary
async function getPetById(req, res) {
  try {
    const userId = req.user.id;
    const petId = req.params.id;

    const [pets] = await query(
      'SELECT * FROM pets WHERE id = ? AND user_id = ? AND is_active = 1',
      [petId, userId]
    );

    if (pets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found or you do not have permission to view this profile.'
      });
    }

    const pet = pets[0];

    // Fetch privacy settings
    let [privacySettings] = await query(
      'SELECT * FROM emergency_privacy_settings WHERE pet_id = ?',
      [pet.id]
    );

    // If privacy settings row is missing, initialize default row
    if (privacySettings.length === 0) {
      await query(`
        INSERT INTO emergency_privacy_settings (pet_id, show_photo, show_name, show_species_breed, show_medical_alerts, show_allergies, show_special_care, show_emergency_phone, show_contact_form)
        VALUES (?, 1, 1, 1, 1, 1, 1, 0, 1)
      `, [pet.id]);
      const [newSettings] = await query('SELECT * FROM emergency_privacy_settings WHERE pet_id = ?', [pet.id]);
      privacySettings = newSettings;
    }

    // Attach complete public emergency URL
    const appUrl = getAppUrl();
    pet.public_emergency_url = `${appUrl}/emergency/${pet.public_id}`;

    return res.status(200).json({
      success: true,
      pet,
      privacySettings: privacySettings[0]
    });
  } catch (error) {
    console.error('Get pet by id error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve pet details.'
    });
  }
}

// POST /api/pets - Create a new pet profile
async function createPet(req, res) {
  try {
    const userId = req.user.id;
    const {
      name,
      species,
      breed,
      dob,
      gender,
      color_markings,
      microchip_number,
      blood_group,
      current_weight,
      sterilization_status,
      allergies,
      medical_conditions,
      current_medications,
      special_care_instructions,
      identification_notes
    } = req.body;

    // Validation
    if (!name || !species) {
      if (req.file) removeFileSafe(`/uploads/pets/${req.file.filename}`);
      return res.status(400).json({
        success: false,
        message: 'Pet name and species are required fields.'
      });
    }

    // Generate secure random public_id
    const publicId = generatePublicId();

    // Generate QR code pointing to public emergency profile
    const qrResult = await generatePetQRCode(publicId);

    // Determine photo URL
    let photoUrl = null;
    if (req.file) {
      photoUrl = `/uploads/pets/${req.file.filename}`;
    }

    // Insert pet record
    const [result] = await query(`
      INSERT INTO pets (
        user_id, public_id, name, species, breed, dob, gender,
        color_markings, microchip_number, blood_group, current_weight,
        sterilization_status, allergies, medical_conditions, current_medications,
        special_care_instructions, identification_notes, photo_url, qr_code_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      publicId,
      name.trim(),
      species.trim(),
      breed ? breed.trim() : null,
      dob || null,
      gender || 'Unknown',
      color_markings ? color_markings.trim() : null,
      microchip_number ? microchip_number.trim() : null,
      blood_group ? blood_group.trim() : null,
      current_weight ? parseFloat(current_weight) : null,
      sterilization_status || 'Unknown',
      allergies ? allergies.trim() : null,
      medical_conditions ? medical_conditions.trim() : null,
      current_medications ? current_medications.trim() : null,
      special_care_instructions ? special_care_instructions.trim() : null,
      identification_notes ? identification_notes.trim() : null,
      photoUrl,
      qrResult.qrCodeUrl
    ]);

    const newPetId = result.insertId;

    // Create default emergency privacy settings
    await query(`
      INSERT INTO emergency_privacy_settings (
        pet_id, show_photo, show_name, show_species_breed, show_medical_alerts,
        show_allergies, show_special_care, show_emergency_phone, show_contact_form,
        custom_emergency_instructions
      ) VALUES (?, 1, 1, 1, 1, 1, 1, 0, 1, ?)
    `, [newPetId, `If you have found ${name.trim()}, please treat with gentle care and reach out immediately!`]);

    // Send a welcoming in-app notification
    await query(`
      INSERT INTO notifications (user_id, pet_id, title, message, type, link_url)
      VALUES (?, ?, ?, ?, 'general', ?)
    `, [
      userId,
      newPetId,
      `🐾 Welcome ${name.trim()}!`,
      `${name.trim()}'s profile and secure QR code have been created. You can now add health records and print their collar tag.`,
      `/pet-details.html?id=${newPetId}`
    ]);

    return res.status(201).json({
      success: true,
      message: `${name.trim()} has been registered successfully!`,
      petId: newPetId,
      publicId,
      qrCodeUrl: qrResult.qrCodeUrl
    });
  } catch (error) {
    console.error('Create pet error:', error);
    if (req.file) removeFileSafe(`/uploads/pets/${req.file.filename}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to create pet profile. Please try again.'
    });
  }
}

// PUT /api/pets/:id - Update existing pet profile
async function updatePet(req, res) {
  try {
    const userId = req.user.id;
    const petId = req.params.id;

    // Verify ownership
    const [pets] = await query('SELECT * FROM pets WHERE id = ? AND user_id = ?', [petId, userId]);
    if (pets.length === 0) {
      if (req.file) removeFileSafe(`/uploads/pets/${req.file.filename}`);
      return res.status(404).json({
        success: false,
        message: 'Pet not found or you do not have permission to edit this profile.'
      });
    }

    const currentPet = pets[0];
    const {
      name,
      species,
      breed,
      dob,
      gender,
      color_markings,
      microchip_number,
      blood_group,
      current_weight,
      sterilization_status,
      allergies,
      medical_conditions,
      current_medications,
      special_care_instructions,
      identification_notes
    } = req.body;

    if (!name || !species) {
      if (req.file) removeFileSafe(`/uploads/pets/${req.file.filename}`);
      return res.status(400).json({
        success: false,
        message: 'Pet name and species are required fields.'
      });
    }

    let photoUrl = currentPet.photo_url;
    if (req.file) {
      // Remove old photo if uploaded (and not the default svg)
      if (currentPet.photo_url && !currentPet.photo_url.includes('demo-')) {
        removeFileSafe(currentPet.photo_url);
      }
      photoUrl = `/uploads/pets/${req.file.filename}`;
    }

    await query(`
      UPDATE pets SET
        name = ?,
        species = ?,
        breed = ?,
        dob = ?,
        gender = ?,
        color_markings = ?,
        microchip_number = ?,
        blood_group = ?,
        current_weight = ?,
        sterilization_status = ?,
        allergies = ?,
        medical_conditions = ?,
        current_medications = ?,
        special_care_instructions = ?,
        identification_notes = ?,
        photo_url = ?
      WHERE id = ? AND user_id = ?
    `, [
      name.trim(),
      species.trim(),
      breed ? breed.trim() : null,
      dob || null,
      gender || 'Unknown',
      color_markings ? color_markings.trim() : null,
      microchip_number ? microchip_number.trim() : null,
      blood_group ? blood_group.trim() : null,
      current_weight ? parseFloat(current_weight) : null,
      sterilization_status || 'Unknown',
      allergies ? allergies.trim() : null,
      medical_conditions ? medical_conditions.trim() : null,
      current_medications ? current_medications.trim() : null,
      special_care_instructions ? special_care_instructions.trim() : null,
      identification_notes ? identification_notes.trim() : null,
      photoUrl,
      petId,
      userId
    ]);

    return res.status(200).json({
      success: true,
      message: `${name.trim()}'s profile updated successfully.`
    });
  } catch (error) {
    console.error('Update pet error:', error);
    if (req.file) removeFileSafe(`/uploads/pets/${req.file.filename}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to update pet profile.'
    });
  }
}

// DELETE /api/pets/:id - Delete pet and cascade cleanup
async function deletePet(req, res) {
  try {
    const userId = req.user.id;
    const petId = req.params.id;

    // Verify ownership
    const [pets] = await query('SELECT * FROM pets WHERE id = ? AND user_id = ?', [petId, userId]);
    if (pets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found or you do not have permission to delete this profile.'
      });
    }

    const pet = pets[0];

    // Clean up uploaded files
    if (pet.photo_url && !pet.photo_url.includes('demo-')) {
      removeFileSafe(pet.photo_url);
    }
    if (pet.qr_code_url) {
      removeFileSafe(pet.qr_code_url);
    }

    // Clean up any health record document attachments
    const [records] = await query('SELECT attachment_url FROM health_records WHERE pet_id = ?', [petId]);
    for (const r of records) {
      if (r.attachment_url) removeFileSafe(r.attachment_url);
    }

    // Delete pet (foreign keys CASCADE will delete emergency_privacy_settings, health_records, found_pet_reports)
    await query('DELETE FROM pets WHERE id = ? AND user_id = ?', [petId, userId]);

    return res.status(200).json({
      success: true,
      message: `Profile for ${pet.name} and all related health records have been permanently deleted.`
    });
  } catch (error) {
    console.error('Delete pet error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete pet profile.'
    });
  }
}

module.exports = {
  getAllPets,
  getPetById,
  createPet,
  updatePet,
  deletePet
};
