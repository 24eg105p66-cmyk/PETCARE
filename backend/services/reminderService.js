const { query } = require('../config/db');

async function getPetReminders(userId, petId = null) {
  let sql = `
    SELECT 
      hr.id,
      hr.pet_id,
      p.name AS pet_name,
      p.species AS pet_species,
      p.photo_url AS pet_photo_url,
      hr.category,
      hr.title,
      hr.date_administered,
      hr.next_due_date,
      hr.clinic_name,
      hr.veterinarian_name,
      hr.dosage,
      hr.instructions_notes,
      DATEDIFF(hr.next_due_date, CURDATE()) AS days_until_due,
      CASE 
        WHEN hr.next_due_date < CURDATE() THEN 'overdue'
        WHEN DATEDIFF(hr.next_due_date, CURDATE()) BETWEEN 0 AND 7 THEN 'due_soon'
        WHEN DATEDIFF(hr.next_due_date, CURDATE()) BETWEEN 8 AND 30 THEN 'upcoming'
        ELSE 'future'
      END AS reminder_status
    FROM health_records hr
    JOIN pets p ON hr.pet_id = p.id
    WHERE p.user_id = ?
      AND hr.next_due_date IS NOT NULL
      AND hr.category IN ('vaccination', 'deworming')
  `;

  const params = [userId];

  if (petId) {
    sql += ' AND hr.pet_id = ?';
    params.push(petId);
  }

  sql += ' ORDER BY hr.next_due_date ASC';

  const [records] = await query(sql, params);
  return records;
}

async function getDashboardStats(userId) {
  // Total pets
  const [[{ totalPets }]] = await query('SELECT COUNT(*) AS totalPets FROM pets WHERE user_id = ?', [userId]);

  // Overdue vaccinations count
  const [[{ overdueVaccinations }]] = await query(`
    SELECT COUNT(*) AS overdueVaccinations
    FROM health_records hr
    JOIN pets p ON hr.pet_id = p.id
    WHERE p.user_id = ?
      AND hr.category = 'vaccination'
      AND hr.next_due_date < CURDATE()
  `, [userId]);

  // Upcoming vaccinations count (within next 30 days)
  const [[{ upcomingVaccinations }]] = await query(`
    SELECT COUNT(*) AS upcomingVaccinations
    FROM health_records hr
    JOIN pets p ON hr.pet_id = p.id
    WHERE p.user_id = ?
      AND hr.category = 'vaccination'
      AND hr.next_due_date >= CURDATE()
      AND hr.next_due_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
  `, [userId]);

  // Upcoming dewormings count (within next 30 days)
  const [[{ upcomingDewormings }]] = await query(`
    SELECT COUNT(*) AS upcomingDewormings
    FROM health_records hr
    JOIN pets p ON hr.pet_id = p.id
    WHERE p.user_id = ?
      AND hr.category = 'deworming'
      AND hr.next_due_date >= CURDATE()
      AND hr.next_due_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
  `, [userId]);

  // Recent vet visits count (last 90 days)
  const [[{ recentVetVisits }]] = await query(`
    SELECT COUNT(*) AS recentVetVisits
    FROM health_records hr
    JOIN pets p ON hr.pet_id = p.id
    WHERE p.user_id = ?
      AND hr.category = 'vet_visit'
  `, [userId]);

  // Pending found-pet reports count
  const [[{ pendingFoundReports }]] = await query(`
    SELECT COUNT(*) AS pendingFoundReports
    FROM found_pet_reports fpr
    JOIN pets p ON fpr.pet_id = p.id
    WHERE p.user_id = ? AND fpr.status = 'pending'
  `, [userId]);

  return {
    totalPets,
    overdueVaccinations,
    upcomingVaccinations,
    upcomingDewormings,
    recentVetVisits,
    pendingFoundReports
  };
}

module.exports = {
  getPetReminders,
  getDashboardStats
};
