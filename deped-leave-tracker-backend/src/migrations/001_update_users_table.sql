-- Migration: Add firstName and lastName, Update users table
-- This is for MySQL database
-- Run this if your users table needs to be updated
-- @ts-nocheck
-- sql-language-mode: mysql

-- Add new columns
ALTER TABLE users ADD firstName VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE users ADD lastName VARCHAR(255) NOT NULL DEFAULT '';

-- Modify email to be unique (skip if already unique)
ALTER TABLE users MODIFY email VARCHAR(255) UNIQUE;

-- Drop username column if it exists
-- Note: MySQL 8.0+ supports IF EXISTS, for older versions comment this out and run manually if needed
ALTER TABLE users DROP COLUMN IF EXISTS username;

-- If you need to create the users table from scratch:
-- CREATE TABLE users (
--   id INT PRIMARY KEY AUTO_INCREMENT,
--   firstName VARCHAR(255) NOT NULL,
--   lastName VARCHAR(255) NOT NULL,
--   email VARCHAR(255) UNIQUE NOT NULL,
--   password VARCHAR(255) NOT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
