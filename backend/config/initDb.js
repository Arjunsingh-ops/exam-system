const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const initDatabase = async () => {
  // First connect without specifying a database to create it
  const rootConn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await rootConn.query(schema);
    console.log('✅ Database schema initialized successfully');
  } catch (err) {
    console.error('❌ Schema initialization failed:', err.message);
    throw err;
  } finally {
    await rootConn.end();
  }
};

module.exports = initDatabase;
