-- CampusCare backend schema (MySQL).
-- Fresh setup: create the database, then run this file, e.g.
--   mysql -u root -p campuscare < backend/schema.sql
-- or paste it into phpMyAdmin / MySQL Workbench after selecting
-- the database. This file was missing before, so a fresh clone
-- could not run at all — the code queried tables that did not exist.
--
-- If you already have a database with data, do NOT run this blindly:
-- it creates tables (it does not drop existing ones), but the
-- UNIQUE key on ratings will fail if duplicate ratings already exist.

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  student_id VARCHAR(100) UNIQUE,
  reset_token VARCHAR(255) DEFAULT NULL,
  reset_token_expires DATETIME DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  category VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  status ENUM('pending', 'in_progress', 'resolved') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS complaint_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  complaint_id INT NOT NULL,
  user_id INT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  complaint_id INT NOT NULL,
  student_id INT NOT NULL,
  rating TINYINT NOT NULL,
  feedback TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_rating_range CHECK (rating BETWEEN 1 AND 5),
  -- One rating per student per complaint (enforced in the API too).
  UNIQUE KEY uq_rating_per_student_complaint (complaint_id, student_id),
  FOREIGN KEY (complaint_id) REFERENCES complaints (id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
);
