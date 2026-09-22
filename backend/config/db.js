const mysql = require('mysql2/promise');
require('dotenv').config();

const getPoolConfig = () => {
  const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
  const isSsl = process.env.DB_SSL === 'true' || Boolean(dbUrl && (dbUrl.includes('ssl') || dbUrl.includes('aiven') || dbUrl.includes('railway') || dbUrl.includes('supabase') || dbUrl.includes('tidb')));

  const sslOption = isSsl ? { rejectUnauthorized: false } : undefined;

  if (dbUrl) {
    return {
      uri: dbUrl,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true,
      ssl: sslOption,
    };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'exam_seating_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true,
    ssl: sslOption,
  };
};

const pool = mysql.createPool(getPoolConfig());

const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ Please verify your DATABASE_URL, DB_HOST, DB_USER, and DB_PASSWORD environment variables.');
    }
    throw err;
  }
};

module.exports = { pool, testConnection, getPoolConfig };
