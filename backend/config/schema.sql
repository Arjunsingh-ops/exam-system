-- Create database if not exists
CREATE DATABASE IF NOT EXISTS exam_seating_system;
USE exam_seating_system;

-- Users table (Admin auth)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin') NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table (populated via CSV)
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  roll_no VARCHAR(50) NOT NULL UNIQUE,
  enrollment_no VARCHAR(50) NOT NULL UNIQUE,
  course VARCHAR(100) NOT NULL,
  batch VARCHAR(50),
  specialization VARCHAR(100),
  semester INT NOT NULL DEFAULT 1,
  email VARCHAR(150),
  contact VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_no VARCHAR(50) NOT NULL UNIQUE,
  capacity INT NOT NULL DEFAULT 30,
  rows_count INT NOT NULL DEFAULT 5,
  cols_count INT NOT NULL DEFAULT 6,
  floor VARCHAR(20),
  block VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teachers / Invigilators table
CREATE TABLE IF NOT EXISTS teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  department VARCHAR(100),
  email VARCHAR(150),
  contact VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exams table
CREATE TABLE IF NOT EXISTS exams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  subject VARCHAR(150),
  course VARCHAR(100) NOT NULL,
  semester INT NOT NULL,
  exam_type ENUM('End Sem', 'Mid Sem', 'Back Exam') NOT NULL DEFAULT 'End Sem',
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seating plan table
CREATE TABLE IF NOT EXISTS seating (
  id INT AUTO_INCREMENT PRIMARY KEY,
  exam_id INT NOT NULL,
  student_id INT NOT NULL,
  room_id INT NOT NULL,
  teacher_id INT,
  seat_no VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_seat (exam_id, room_id, seat_no),
  UNIQUE KEY uq_student_exam (exam_id, student_id),
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
);

-- Default admin user (password: Admin@123)
INSERT IGNORE INTO users (name, email, password, role) VALUES 
('Admin', 'admin@exam.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'admin');
