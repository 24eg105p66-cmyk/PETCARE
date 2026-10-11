const { query } = require('../config/db');
const path = require('path');
const fs = require('fs');

function removeFileSafe(relativeUrl) {
  if (!relativeUrl) return;
  const filePath = path.join(__dirname, '..', relativeUrl);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.warn('Failed to remove report image:', filePath, e.message);
    }
  }
}

// POST /api/emergency/:publicId/found-reports (PUBLIC)
async function submitFoundReport(req, res) {
  try {
    const publicId = req.params.publicId;
    const {
      finder_name,
      finder_phone,
      finder_email,
      found_location,
      found_date,
      message
    } = req.body;

    // Validate inputs
    if (!finder_name || !finder_phone || !found_location) {
      if (req.file) removeFileSafe(`/uploads/reports/${req.file.filename}`);
      return res.status(400).json({
        success: false,
        message: 'Finder name, contact phone number, and found location are required.'
      });
    }

    // Lookup pet by public_id
    const [pets] = await query('SELECT id, name, user_id FROM pets WHERE public_id = ? AND is_active = 1', [publicId]);
    if (pets.length === 0) {
      if (req.file) removeFileSafe(`/uploads/reports/${req.file.filename}`);
      return res.status(404).json({
        success: false,
        message: 'Pet not found or emergency profile is inactive.'
      });
    }

    const pet = pets[0];
    let photoUrl = null;
    if (req.file) {
      photoUrl = `/uploads/reports/${req.file.filename}`;
    }

    const reportedDate = found_date ? new Date(found_date) : new Date();

    // Insert found report
    const [result] = await query(`
      INSERT INTO found_pet_reports (
        pet_id, finder_name, finder_phone, finder_email,
        found_location, found_date, message, photo_url, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      pet.id,
      finder_name.trim(),
      finder_phone.trim(),
      finder_email ? finder_email.trim() : null,
      found_location.trim(),
      reportedDate,
      message ? message.trim() : null,
      photoUrl
    ]);

    // Create high-priority notification for the owner
    await query(`
      INSERT INTO notifications (user_id, pet_id, title, message, type, link_url)
      VALUES (?, ?, ?, ?, 'found_report', ?)
    `, [
      pet.user_id,
      pet.id,
      `🚨 Found Pet Report Received for ${pet.name}!`,
      `A finder (${finder_name.trim()}, Phone: ${finder_phone.trim()}) reported finding ${pet.name} at "${found_location.trim()}". Check your reports dashboard immediately.`,
      '/found-reports.html'
    ]);

    return res.status(201).json({
      success: true,
      message: `Thank you! Your report has been delivered to ${pet.name}'s owner. They have been alerted on their dashboard.`
    });
  } catch (error) {
    console.error('Submit found report error:', error);
    if (req.file) removeFileSafe(`/uploads/reports/${req.file.filename}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit report. Please try again or reach out directly.'
    });
  }
}

// GET /api/found-reports (OWNER ONLY)
async function getOwnerFoundReports(req, res) {
  try {
    const userId = req.user.id;
    const petId = req.query.petId;

    let sql = `
      SELECT 
        fpr.*,
        p.name AS pet_name,
        p.species AS pet_species,
        p.breed AS pet_breed,
        p.photo_url AS pet_photo_url
      FROM found_pet_reports fpr
      JOIN pets p ON fpr.pet_id = p.id
      WHERE p.user_id = ?
    `;
    const params = [userId];

    if (petId) {
      sql += ' AND p.id = ?';
      params.push(petId);
    }

    sql += ' ORDER BY fpr.created_at DESC';

    const [reports] = await query(sql, params);

    return res.status(200).json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error) {
    console.error('Get found reports error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve found pet reports.'
    });
  }
}

// PATCH /api/found-reports/:id/status (OWNER ONLY)
async function updateReportStatus(req, res) {
  try {
    const userId = req.user.id;
    const reportId = req.params.id;
    const { status } = req.body;

    const validStatuses = ['pending', 'contacted', 'resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed values: pending, contacted, resolved.'
      });
    }

    // Verify ownership
    const [reports] = await query(`
      SELECT fpr.*, p.user_id 
      FROM found_pet_reports fpr
      JOIN pets p ON fpr.pet_id = p.id
      WHERE fpr.id = ? AND p.user_id = ?
    `, [reportId, userId]);

    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found or unauthorized.'
      });
    }

    const resolvedAt = status === 'resolved' ? new Date() : null;

    await query(`
      UPDATE found_pet_reports 
      SET status = ?, resolved_at = ?
      WHERE id = ?
    `, [status, resolvedAt, reportId]);

    return res.status(200).json({
      success: true,
      message: `Report status updated to "${status}".`
    });
  } catch (error) {
    console.error('Update report status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update report status.'
    });
  }
}

module.exports = {
  submitFoundReport,
  getOwnerFoundReports,
  updateReportStatus
};
