const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const initDatabase = async () => {
  const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
  const dbName = process.env.DB_NAME || 'exam_seating_system';
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@exam.edu').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const adminName = process.env.ADMIN_NAME || 'Exam Controller / Administrator';
  const isSsl = process.env.DB_SSL === 'true' || Boolean(dbUrl && (dbUrl.includes('ssl') || dbUrl.includes('aiven') || dbUrl.includes('railway') || dbUrl.includes('supabase') || dbUrl.includes('tidb')));
  const sslOption = isSsl ? { rejectUnauthorized: false } : undefined;

  let conn;

  try {
    if (dbUrl) {
      // Connect directly to the cloud-provided database connection string
      conn = await mysql.createConnection({
        uri: dbUrl,
        multipleStatements: true,
        ssl: sslOption,
      });
    } else {
      // Local development without connection string: ensure database exists first
      const rootConn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true,
      });

      await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      await rootConn.end();

      conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: dbName,
        multipleStatements: true,
        ssl: sslOption,
      });
    }

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await conn.query(schema);
    console.log('✅ Database schema initialized successfully');

    // Query existing admin accounts from database
    const [existingAdmins] = await conn.query(
      'SELECT id, email, password FROM users WHERE role = "admin"'
    );

    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    if (existingAdmins.length === 0) {
      await conn.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "admin")',
        [adminName, adminEmail, hashedPassword]
      );
      console.log(`👤 Initial authorized administrator seeded into database: ${adminEmail}`);
    } else {
      const primaryAdmin = existingAdmins.find(a => a.email.toLowerCase() === adminEmail) || existingAdmins[0];

      // Only reset password if explicitly commanded via RESET_ADMIN_ON_BOOT environment variable
      if (process.env.RESET_ADMIN_ON_BOOT === 'true') {
        await conn.query(
          'UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?',
          [adminName, adminEmail, hashedPassword, primaryAdmin.id]
        );
        console.log(`🔄 Admin credentials reset from environment: ${adminEmail}`);
      } else {
        console.log(`👤 Active administrator loaded from database: ${primaryAdmin.email}`);
      }

      // Enforce single-admin policy: purge any extraneous admin records
      await conn.query(
        'DELETE FROM users WHERE role = "admin" AND id != ?',
        [primaryAdmin.id]
      );
      console.log(`🔒 Enforced single admin database policy.`);
    }
  } catch (err) {
    console.error('❌ Database schema/user initialization failed:', err.message);
    throw err;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
};

module.exports = initDatabase;
