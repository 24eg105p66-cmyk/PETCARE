const { getPetReminders, getDashboardStats } = require('../services/reminderService');
const { query } = require('../config/db');

// GET /api/reminders
async function getReminders(req, res) {
  try {
    const userId = req.user.id;
    const petId = req.query.petId || null;

    const allReminders = await getPetReminders(userId, petId);

    const overdue = allReminders.filter(r => r.reminder_status === 'overdue');
    const dueSoon = allReminders.filter(r => r.reminder_status === 'due_soon');
    const upcoming = allReminders.filter(r => r.reminder_status === 'upcoming');
    const future = allReminders.filter(r => r.reminder_status === 'future');

    return res.status(200).json({
      success: true,
      counts: {
        total: allReminders.length,
        overdue: overdue.length,
        dueSoon: dueSoon.length,
        upcoming: upcoming.length,
        future: future.length
      },
      overdue,
      dueSoon,
      upcoming,
      future,
      allReminders
    });
  } catch (error) {
    console.error('Get reminders error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve reminders.'
    });
  }
}

// GET /api/dashboard/summary
async function getDashboardSummary(req, res) {
  try {
    const userId = req.user.id;

    const stats = await getDashboardStats(userId);

    // Get list of pets with essential badges
    const [pets] = await query(`
      SELECT 
        p.id, p.public_id, p.name, p.species, p.breed, p.photo_url, p.gender,
        p.dob, p.current_weight,
        (SELECT COUNT(*) FROM health_records hr WHERE hr.pet_id = p.id) AS record_count,
        (SELECT COUNT(*) FROM health_records hr WHERE hr.pet_id = p.id AND hr.category = 'vaccination' AND hr.next_due_date < CURDATE()) AS overdue_count
      FROM pets p
      WHERE p.user_id = ? AND p.is_active = 1
      ORDER BY p.created_at DESC
    `, [userId]);

    // Get 5 most recent health records across all user pets
    const [recentRecords] = await query(`
      SELECT 
        hr.id, hr.pet_id, p.name AS pet_name, hr.category, hr.title,
        hr.date_administered, hr.clinic_name, hr.created_at
      FROM health_records hr
      JOIN pets p ON hr.pet_id = p.id
      WHERE p.user_id = ?
      ORDER BY hr.created_at DESC
      LIMIT 5
    `, [userId]);

    // Get upcoming alerts (top 4 overdue or due soon)
    const [urgentReminders] = await query(`
      SELECT 
        hr.id, hr.pet_id, p.name AS pet_name, hr.category, hr.title,
        hr.next_due_date,
        DATEDIFF(hr.next_due_date, CURDATE()) AS days_left
      FROM health_records hr
      JOIN pets p ON hr.pet_id = p.id
      WHERE p.user_id = ?
        AND hr.next_due_date IS NOT NULL
        AND hr.next_due_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      ORDER BY hr.next_due_date ASC
      LIMIT 4
    `, [userId]);

    return res.status(200).json({
      success: true,
      stats,
      pets,
      recentRecords,
      urgentReminders
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard summary.'
    });
  }
}

module.exports = {
  getReminders,
  getDashboardSummary
};
