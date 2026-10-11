const path = require('path');
const fs = require('fs');
const { query } = require('../config/db');

function removeFileSafe(relativeUrl) {
  if (!relativeUrl) return;
  const filePath = path.join(__dirname, '..', relativeUrl);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.warn('Failed to remove attachment file:', filePath, e.message);
    }
  }
}

// GET /api/pets/:petId/health-records
async function getHealthRecordsByPet(req, res) {
  try {
    const userId = req.user.id;
    const petId = req.params.petId;
    const { category, startDate, endDate, sort } = req.query;

    // Verify pet ownership
    const [pets] = await query('SELECT id, name FROM pets WHERE id = ? AND user_id = ?', [petId, userId]);
    if (pets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found or you do not have permission to view records.'
      });
    }

    let sql = `
      SELECT 
        hr.*,
        DATEDIFF(hr.next_due_date, CURDATE()) AS days_until_due,
        CASE
          WHEN hr.next_due_date IS NOT NULL AND hr.next_due_date < CURDATE() THEN 'overdue'
          WHEN hr.next_due_date IS NOT NULL AND DATEDIFF(hr.next_due_date, CURDATE()) BETWEEN 0 AND 30 THEN 'upcoming'
          ELSE 'normal'
        END AS due_status
      FROM health_records hr
      WHERE hr.pet_id = ?
    `;
    const params = [petId];

    if (category && category !== 'all') {
      sql += ' AND hr.category = ?';
      params.push(category);
    }

    if (startDate) {
      sql += ' AND (hr.date_administered >= ? OR hr.start_date >= ?)';
      params.push(startDate, startDate);
    }

    if (endDate) {
      sql += ' AND (hr.date_administered <= ? OR hr.start_date <= ?)';
      params.push(endDate, endDate);
    }

    if (sort === 'oldest') {
      sql += ' ORDER BY COALESCE(hr.date_administered, hr.start_date, hr.created_at) ASC';
    } else {
      sql += ' ORDER BY COALESCE(hr.date_administered, hr.start_date, hr.created_at) DESC';
    }

    const [records] = await query(sql, params);

    return res.status(200).json({
      success: true,
      pet: pets[0],
      count: records.length,
      records
    });
  } catch (error) {
    console.error('Get health records error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve health records.'
    });
  }
}

// POST /api/pets/:petId/health-records
async function addHealthRecord(req, res) {
  try {
    const userId = req.user.id;
    const petId = req.params.petId;

    // Verify pet ownership
    const [pets] = await query('SELECT id, name FROM pets WHERE id = ? AND user_id = ?', [petId, userId]);
    if (pets.length === 0) {
      if (req.file) removeFileSafe(`/uploads/documents/${req.file.filename}`);
      return res.status(404).json({
        success: false,
        message: 'Pet not found or you do not have permission to add records.'
      });
    }

    const {
      category,
      title,
      date_administered,
      next_due_date,
      clinic_name,
      veterinarian_name,
      dosage,
      start_date,
      end_date,
      severity,
      instructions_notes,
      attachment_type
    } = req.body;

    const validCategories = [
      'vaccination',
      'deworming',
      'medication',
      'vet_visit',
      'allergy_condition',
      'document'
    ];

    if (!category || !validCategories.includes(category)) {
      if (req.file) removeFileSafe(`/uploads/documents/${req.file.filename}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid record category. Please select an allowed category.'
      });
    }

    if (!title || title.trim() === '') {
      if (req.file) removeFileSafe(`/uploads/documents/${req.file.filename}`);
      return res.status(400).json({
        success: false,
        message: 'Record title or medication name is required.'
      });
    }

    let attachmentUrl = null;
    let attachmentName = null;
    if (req.file) {
      attachmentUrl = `/uploads/documents/${req.file.filename}`;
      attachmentName = req.file.originalname;
    }

    const [result] = await query(`
      INSERT INTO health_records (
        pet_id, category, title, date_administered, next_due_date,
        clinic_name, veterinarian_name, dosage, start_date, end_date,
        severity, instructions_notes, attachment_url, attachment_name, attachment_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      petId,
      category,
      title.trim(),
      date_administered || null,
      next_due_date || null,
      clinic_name ? clinic_name.trim() : null,
      veterinarian_name ? veterinarian_name.trim() : null,
      dosage ? dosage.trim() : null,
      start_date || null,
      end_date || null,
      severity || 'None',
      instructions_notes ? instructions_notes.trim() : null,
      attachmentUrl,
      attachmentName,
      attachment_type || (req.file ? 'document' : null)
    ]);

    // If next_due_date is provided and within 30 days, notify owner
    if (next_due_date) {
      const nextDate = new Date(next_due_date);
      const today = new Date();
      const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
      if (diffDays <= 30 && diffDays >= 0) {
        await query(`
          INSERT INTO notifications (user_id, pet_id, title, message, type, link_url)
          VALUES (?, ?, ?, ?, 'reminder', ?)
        `, [
          userId,
          petId,
          `Upcoming ${category.toUpperCase()}: ${title.trim()}`,
          `${pets[0].name} has an upcoming ${category} (${title.trim()}) due on ${next_due_date}.`,
          `/reminders.html`
        ]);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Health record added successfully.',
      recordId: result.insertId
    });
  } catch (error) {
    console.error('Add health record error:', error);
    if (req.file) removeFileSafe(`/uploads/documents/${req.file.filename}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to add health record.'
    });
  }
}

// PUT /api/health-records/:id
async function updateHealthRecord(req, res) {
  try {
    const userId = req.user.id;
    const recordId = req.params.id;

    // Verify record ownership via pet ownership
    const [records] = await query(`
      SELECT hr.*, p.user_id 
      FROM health_records hr
      JOIN pets p ON hr.pet_id = p.id
      WHERE hr.id = ? AND p.user_id = ?
    `, [recordId, userId]);

    if (records.length === 0) {
      if (req.file) removeFileSafe(`/uploads/documents/${req.file.filename}`);
      return res.status(404).json({
        success: false,
        message: 'Health record not found or access denied.'
      });
    }

    const currentRecord = records[0];
    const {
      category,
      title,
      date_administered,
      next_due_date,
      clinic_name,
      veterinarian_name,
      dosage,
      start_date,
      end_date,
      severity,
      instructions_notes,
      attachment_type
    } = req.body;

    if (!title || title.trim() === '') {
      if (req.file) removeFileSafe(`/uploads/documents/${req.file.filename}`);
      return res.status(400).json({
        success: false,
        message: 'Record title is required.'
      });
    }

    let attachmentUrl = currentRecord.attachment_url;
    let attachmentName = currentRecord.attachment_name;

    if (req.file) {
      removeFileSafe(currentRecord.attachment_url);
      attachmentUrl = `/uploads/documents/${req.file.filename}`;
      attachmentName = req.file.originalname;
    }

    await query(`
      UPDATE health_records SET
        category = ?,
        title = ?,
        date_administered = ?,
        next_due_date = ?,
        clinic_name = ?,
        veterinarian_name = ?,
        dosage = ?,
        start_date = ?,
        end_date = ?,
        severity = ?,
        instructions_notes = ?,
        attachment_url = ?,
        attachment_name = ?,
        attachment_type = ?
      WHERE id = ?
    `, [
      category || currentRecord.category,
      title.trim(),
      date_administered || null,
      next_due_date || null,
      clinic_name ? clinic_name.trim() : null,
      veterinarian_name ? veterinarian_name.trim() : null,
      dosage ? dosage.trim() : null,
      start_date || null,
      end_date || null,
      severity || 'None',
      instructions_notes ? instructions_notes.trim() : null,
      attachmentUrl,
      attachmentName,
      attachment_type || currentRecord.attachment_type,
      recordId
    ]);

    return res.status(200).json({
      success: true,
      message: 'Health record updated successfully.'
    });
  } catch (error) {
    console.error('Update health record error:', error);
    if (req.file) removeFileSafe(`/uploads/documents/${req.file.filename}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to update health record.'
    });
  }
}

// DELETE /api/health-records/:id
async function deleteHealthRecord(req, res) {
  try {
    const userId = req.user.id;
    const recordId = req.params.id;

    // Verify ownership
    const [records] = await query(`
      SELECT hr.* 
      FROM health_records hr
      JOIN pets p ON hr.pet_id = p.id
      WHERE hr.id = ? AND p.user_id = ?
    `, [recordId, userId]);

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Health record not found or access denied.'
      });
    }

    // Clean up attachment
    if (records[0].attachment_url) {
      removeFileSafe(records[0].attachment_url);
    }

    await query('DELETE FROM health_records WHERE id = ?', [recordId]);

    return res.status(200).json({
      success: true,
      message: 'Health record deleted successfully.'
    });
  } catch (error) {
    console.error('Delete health record error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete health record.'
    });
  }
}

module.exports = {
  getHealthRecordsByPet,
  addHealthRecord,
  updateHealthRecord,
  deleteHealthRecord
};
