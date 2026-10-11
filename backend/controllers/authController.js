const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

// POST /api/auth/register
async function register(req, res) {
  try {
    const { full_name, email, phone, password, confirm_password } = req.body;

    // Server-side validation
    if (!full_name || !email || !phone || !password || !confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required. Please fill out the entire registration form.'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    if (password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match. Please re-enter identical passwords.'
      });
    }

    // Check duplicate email
    const [existing] = await query('SELECT id FROM users WHERE email = ?', [trimmedEmail]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please log in instead.'
      });
    }

    // Hash password with bcrypt (salt rounds = 10)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user into database
    const [result] = await query(
      'INSERT INTO users (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
      [full_name.trim(), trimmedEmail, phone.trim(), passwordHash]
    );

    const newUserId = result.insertId;

    // Create session
    req.session.userId = newUserId;
    req.session.userEmail = trimmedEmail;
    req.session.userName = full_name.trim();

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully! Welcome to PetCare Passport.',
      user: {
        id: newUserId,
        full_name: full_name.trim(),
        email: trimmedEmail,
        phone: phone.trim()
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'A database error occurred during registration. Please try again.'
    });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password, remember_me } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email address and password are required.'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Find user by email
    const [users] = await query(
      'SELECT id, full_name, email, phone, password_hash FROM users WHERE email = ?',
      [trimmedEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please verify your credentials.'
      });
    }

    const user = users[0];

    // Verify password hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please verify your credentials.'
      });
    }

    // Configure session duration based on remember_me
    if (remember_me) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    } else {
      req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 1 day
    }

    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userName = user.full_name;

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again.'
    });
  }
}

// POST /api/auth/logout
async function logout(req, res) {
  try {
    req.session.destroy(err => {
      if (err) {
        console.error('Logout session destruction error:', err);
        return res.status(500).json({
          success: false,
          message: 'Unable to log out at this moment.'
        });
      }
      res.clearCookie('petcare_session');
      return res.status(200).json({
        success: true,
        message: 'You have been logged out safely.'
      });
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error during logout.'
    });
  }
}

// GET /api/auth/me
async function getMe(req, res) {
  try {
    const userId = req.session.userId;
    const [users] = await query(
      'SELECT id, full_name, email, phone, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    return res.status(200).json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving user profile.'
    });
  }
}

// PUT /api/auth/profile
async function updateProfile(req, res) {
  try {
    const userId = req.session.userId;
    const { full_name, phone, current_password, new_password } = req.body;

    if (!full_name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Full name and phone number are required.'
      });
    }

    if (new_password) {
      if (!current_password) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to change password.'
        });
      }

      if (new_password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters.'
        });
      }

      const [users] = await query('SELECT password_hash FROM users WHERE id = ?', [userId]);
      const valid = await bcrypt.compare(current_password, users[0].password_hash);
      if (!valid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect.'
        });
      }

      const newHash = await bcrypt.hash(new_password, 10);
      await query(
        'UPDATE users SET full_name = ?, phone = ?, password_hash = ? WHERE id = ?',
        [full_name.trim(), phone.trim(), newHash, userId]
      );
    } else {
      await query(
        'UPDATE users SET full_name = ?, phone = ? WHERE id = ?',
        [full_name.trim(), phone.trim(), userId]
      );
    }

    req.session.userName = full_name.trim();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.'
    });
  }
}

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile
};
