#!/usr/bin/env node
/**
 * CLI script to seed or reset the single authorized admin user in the MySQL database.
 * Usage:
 *   node scripts/seedAdmin.js <email> <password> [fullName]
 *
 * Example:
 *   node scripts/seedAdmin.js controller@university.edu MySecurePassword123 "Dr. Alan Turing"
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seedAdmin() {
  const args = process.argv.slice(2);
  const email = (args[0] || process.env.ADMIN_EMAIL || 'admin@exam.edu').trim().toLowerCase();
  const password = args[1] || process.env.ADMIN_PASSWORD || 'Admin@123';
  const name = args[2] || process.env.ADMIN_NAME || 'Exam Controller / Administrator';

  if (!email || !password) {
    console.error('Usage: node scripts/seedAdmin.js <email> <password> [fullName]');
    process.exit(1);
  }

  console.log(`\n⚙️  Configuring single administrator in database...`);
  console.log(`   Email: ${email}`);
  console.log(`   Name:  ${name}`);

  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const [existing] = await pool.query('SELECT id, email FROM users WHERE role = "admin"');

    if (existing.length === 0) {
      await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "admin")',
        [name, email, hashedPassword]
      );
      console.log(`✅ Administrator account created successfully.`);
    } else {
      const primaryId = existing[0].id;
      await pool.query(
        'UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?',
        [name, email, hashedPassword, primaryId]
      );
      // Remove any extra admin accounts
      await pool.query('DELETE FROM users WHERE role = "admin" AND id != ?', [primaryId]);
      console.log(`✅ Administrator credentials updated and single-admin policy enforced.`);
    }

    console.log(`🎉 Database ready for production login.\n`);
    process.exit(0);
  } catch (err) {
    console.error(`❌ Failed to seed administrator:`, err.message);
    process.exit(1);
  }
}

seedAdmin();
