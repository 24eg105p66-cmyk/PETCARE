const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const { testConnection } = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');
const { initAssets } = require('./utils/initAssets');

// Route imports
const authRoutes = require('./routes/authRoutes');
const petRoutes = require('./routes/petRoutes');
const healthRecordRoutes = require('./routes/healthRecordRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const foundReportRoutes = require('./routes/foundReportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middlewares
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Express Session Configuration
app.use(session({
  name: 'petcare_session',
  secret: process.env.SESSION_SECRET || 'fallback_petcare_secret_2026_xyz',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Apply general API rate limiter
app.use('/api', apiLimiter);

// Serve Uploaded Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve Frontend Static Directories
const frontendDir = path.join(__dirname, '..', 'frontend');
app.use('/css', express.static(path.join(frontendDir, 'css')));
app.use('/js', express.static(path.join(frontendDir, 'js')));
app.use('/assets', express.static(path.join(frontendDir, 'assets')));
app.use(express.static(frontendDir));

// Clean URL Route for QR Emergency Scans: /emergency/:publicId
// Directs smartphone browser straight to the emergency page with the publicId
app.get('/emergency/:publicId', (req, res) => {
  res.sendFile(path.join(frontendDir, 'emergency.html'));
});

// REST API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/health-records', healthRecordRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/found-reports', foundReportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health-check endpoint for deployment monitoring
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 Route handling
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: `API endpoint '${req.originalUrl}' not found.`
    });
  }
  res.status(404).sendFile(path.join(frontendDir, '404.html'));
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'The uploaded file exceeds the allowed file size limit (5MB for images, 10MB for documents).'
      });
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`
    });
  }

  // Handle Custom File Filter Errors
  if (err.message && err.message.includes('Invalid')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  const statusCode = err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred. Please try again later.'
    : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message
  });
});

// Server Initialization
async function startServer() {
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error('⚠️ Warning: Starting server without active database connection. Some features may not work.');
  }

  // Ensure default demo assets and upload folders exist
  await initAssets().catch(err => console.warn('Asset init warning:', err.message));

  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 PetCare Passport Server running at: http://localhost:${PORT}`);
    console.log(`   Health Check: http://localhost:${PORT}/api/health`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=======================================================`);
  });
}

startServer();
