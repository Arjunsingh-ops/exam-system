const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function loadData() {
  const filePath = path.join(__dirname, 'sample_students.csv');
  const results = [];
  if (!fs.existsSync(filePath)) {
    console.error('CSV file not found at', filePath);
    return;
  }

  // Parse CSV and load manually since LOAD DATA INFILE requires MySQL configuration tweaks (secure_file_priv)
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'exam_seating_system',
      });

      const params = results.map(row => [
        row.name, row.roll_no, row.enrollment_no, row.program || row.course, 
        row.batch, row.specialization, row.year || 1, row.semester, row.email, row.contact
      ]);

      try {
        const [result] = await db.query(
          "INSERT IGNORE INTO students (name, roll_no, enrollment_no, program, batch, specialization, year, semester, email, contact) VALUES ?",
          [params]
        );
        console.log(`✅ Success! Inserted ${result.affectedRows} students into the database.`);
      } catch (err) {
        console.error('❌ Error inserting data:', err.message);
      } finally {
        await db.end();
      }
    });
}

loadData();
