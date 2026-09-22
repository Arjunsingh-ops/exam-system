const mysql = require('mysql2/promise');
require('dotenv').config();

const sanitizeDbUri = (uri) => {
  if (!uri) return uri;
  try {
    const parsed = new URL(uri);
    parsed.searchParams.delete('ssl-mode');
    parsed.searchParams.delete('sslmode');
    return parsed.toString();
  } catch {
    return uri.replace(/[?&]ssl-mode=[^&]*/, '');
  }
};

const fs = require('fs');
const path = require('path');

const getSslOption = () => {
  const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
  const isSsl = process.env.DB_SSL === 'true' || Boolean(dbUrl && (dbUrl.includes('ssl') || dbUrl.includes('aiven') || dbUrl.includes('railway') || dbUrl.includes('supabase') || dbUrl.includes('tidb')));

  let caContent = process.env.DB_CA_CERT;
  if (!caContent) {
    const caPath = path.join(__dirname, '..', 'ca.pem');
    if (fs.existsSync(caPath)) {
      try { caContent = fs.readFileSync(caPath, 'utf8'); } catch (_) {}
    }
  }

  if (caContent) {
    return {
      ca: caContent,
      rejectUnauthorized: true,
    };
  }

  return isSsl ? { rejectUnauthorized: false } : undefined;
};

const getPoolConfig = () => {
  const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
  const sslOption = getSslOption();

  if (dbUrl) {
    return {
      uri: sanitizeDbUri(dbUrl),
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
