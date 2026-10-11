const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'petcare_passport',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// Test connection helper
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`✅ MySQL Connected successfully to database: ${process.env.DB_NAME || 'petcare_passport'}`);
    connection.release();
    return true;
  } catch (err) {
    console.error('❌ MySQL Connection Failed:', err.message);
    return false;
  }
}

module.exports = {
  pool,
  query: (sql, params) => pool.query(sql, params),
  testConnection
};
