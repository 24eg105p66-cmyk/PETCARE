const { query } = require('../config/db');

async function requireAuth(req, res, next) {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to access this resource.'
      });
    }

    // Verify user still exists in database
    const [users] = await query('SELECT id, full_name, email, phone FROM users WHERE id = ?', [req.session.userId]);
    if (users.length === 0) {
      req.session.destroy();
      return res.status(401).json({
        success: false,
        message: 'Account not found or session expired. Please log in again.'
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while verifying session.'
    });
  }
}

module.exports = { requireAuth };
