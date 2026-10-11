const { query } = require('../config/db');

// GET /api/notifications
async function getNotifications(req, res) {
  try {
    const userId = req.user.id;

    const [notifications] = await query(`
      SELECT 
        n.*,
        p.name AS pet_name,
        p.photo_url AS pet_photo_url
      FROM notifications n
      LEFT JOIN pets p ON n.pet_id = p.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 30
    `, [userId]);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return res.status(200).json({
      success: true,
      unreadCount,
      notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications.'
    });
  }
}

// PATCH /api/notifications/:id/read
async function markAsRead(req, res) {
  try {
    const userId = req.user.id;
    const notifId = req.params.id;

    await query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [notifId, userId]);

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification.'
    });
  }
}

// PATCH /api/notifications/read-all
async function markAllAsRead(req, res) {
  try {
    const userId = req.user.id;

    await query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    console.error('Mark all notifications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update notifications.'
    });
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
