const { query } = require('../config/db');

// GET /api/emergency/:publicId
async function getPublicEmergencyProfile(req, res) {
  try {
    const publicId = req.params.publicId;

    if (!publicId || publicId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Invalid emergency identifier.'
      });
    }

    // Lookup pet by public_id and joined owner details
    const [pets] = await query(`
      SELECT 
        p.id,
        p.public_id,
        p.name,
        p.species,
        p.breed,
        p.dob,
        p.gender,
        p.color_markings,
        p.microchip_number,
        p.allergies,
        p.medical_conditions,
        p.current_medications,
        p.special_care_instructions,
        p.photo_url,
        p.is_active,
        u.full_name AS owner_name,
        u.phone AS owner_phone,
        eps.show_photo,
        eps.show_name,
        eps.show_species_breed,
        eps.show_medical_alerts,
        eps.show_allergies,
        eps.show_special_care,
        eps.show_emergency_phone,
        eps.show_contact_form,
        eps.custom_emergency_instructions
      FROM pets p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN emergency_privacy_settings eps ON eps.pet_id = p.id
      WHERE p.public_id = ?
    `, [publicId]);

    if (pets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pet profile not found or QR tag has been deactivated.'
      });
    }

    const row = pets[0];

    if (!row.is_active) {
      return res.status(403).json({
        success: false,
        message: 'This pet emergency profile is currently inactive.'
      });
    }

    // Default privacy rules if null
    const settings = {
      show_photo: row.show_photo !== null ? !!row.show_photo : true,
      show_name: row.show_name !== null ? !!row.show_name : true,
      show_species_breed: row.show_species_breed !== null ? !!row.show_species_breed : true,
      show_medical_alerts: row.show_medical_alerts !== null ? !!row.show_medical_alerts : true,
      show_allergies: row.show_allergies !== null ? !!row.show_allergies : true,
      show_special_care: row.show_special_care !== null ? !!row.show_special_care : true,
      show_emergency_phone: row.show_emergency_phone !== null ? !!row.show_emergency_phone : false,
      show_contact_form: row.show_contact_form !== null ? !!row.show_contact_form : true
    };

    // Filter public response strictly according to privacy settings
    const publicProfile = {
      public_id: row.public_id,
      name: settings.show_name ? row.name : 'Beloved Pet',
      photo_url: settings.show_photo ? row.photo_url : null,
      species: settings.show_species_breed ? row.species : null,
      breed: settings.show_species_breed ? row.breed : null,
      color_markings: row.color_markings,
      microchip_number: row.microchip_number,
      medical_conditions: settings.show_medical_alerts ? row.medical_conditions : null,
      current_medications: settings.show_medical_alerts ? row.current_medications : null,
      allergies: settings.show_allergies ? row.allergies : null,
      special_care_instructions: settings.show_special_care ? row.special_care_instructions : null,
      custom_emergency_instructions: row.custom_emergency_instructions,
      owner_name: row.owner_name,
      owner_phone: settings.show_emergency_phone ? row.owner_phone : null,
      allow_contact_form: settings.show_contact_form,
      privacy: {
        show_phone: settings.show_emergency_phone,
        show_contact_form: settings.show_contact_form
      }
    };

    return res.status(200).json({
      success: true,
      profile: publicProfile
    });
  } catch (error) {
    console.error('Get emergency profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load emergency profile.'
    });
  }
}

module.exports = {
  getPublicEmergencyProfile
};
