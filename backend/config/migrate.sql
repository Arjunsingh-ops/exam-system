-- ============================================================
-- Migration: Rename course → program, add year, course fields
-- Run this ONCE on an existing database to migrate the schema.
-- ============================================================

USE exam_seating_system;

-- ── Students table ───────────────────────────────────────────
-- Rename 'course' column to 'program'
ALTER TABLE students CHANGE COLUMN course program VARCHAR(100) NOT NULL;

-- Add 'year' column
ALTER TABLE students ADD COLUMN year INT DEFAULT 1 AFTER specialization;

-- ── Exams table ──────────────────────────────────────────────
-- Add new columns first
ALTER TABLE exams ADD COLUMN course_name VARCHAR(150) NOT NULL DEFAULT '' AFTER title;
ALTER TABLE exams ADD COLUMN course_code VARCHAR(50) AFTER course_name;
ALTER TABLE exams ADD COLUMN programs VARCHAR(500) NOT NULL DEFAULT '' AFTER course_code;

-- Migrate existing data: copy subject → course_name, course → programs
UPDATE exams SET course_name = COALESCE(subject, title), programs = course WHERE course_name = '';

-- Drop old columns
ALTER TABLE exams DROP COLUMN subject;
ALTER TABLE exams DROP COLUMN course;

-- Done!
SELECT 'Migration completed successfully!' AS status;
