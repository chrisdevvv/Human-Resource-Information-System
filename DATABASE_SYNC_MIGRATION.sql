-- ====================================================================
-- Database Schema Synchronization Script
-- Source: deped_chris
-- Target: deped_csjdm_db_second (esrdatabase)
-- Purpose: Add all missing tables and fields from deped_chris to esrdatabase
-- ====================================================================

USE `deped_csjdm_db_second`;

-- ====================================================================
-- 1. REPLACE USERS TABLE WITH DEPED_CHRIS SCHEMA (FIRST - before foreign keys)
-- ====================================================================

-- Drop existing users table and recreate with proper schema from deped_chris
-- NOTE: This will delete existing users data. Back up if needed.
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(75) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `middle_name` varchar(75) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `last_name` varchar(75) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `birthdate` date DEFAULT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `role` enum('SUPER_ADMIN','ADMIN','DATA_ENCODER') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `school_id` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_email` (`email`),
  KEY `idx_users_first_last_email` (`first_name`,`last_name`,`email`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_school_id` (`school_id`),
  CONSTRAINT `fk_users_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert deped_chris users data
INSERT INTO `users` VALUES 
  (9,'Shania',NULL,'Condalor','shania@email.com',NULL,'$2a$10$XCCvruko7.qv1d9CJfSG0eI3FP1bnuaJXS8VU0BiIK8WYoFKntSuC','SUPER_ADMIN',NULL,1,'2026-03-11 03:28:24','2026-03-11 06:18:03'),
  (10,'Bea',NULL,'Cortez','bea@email.com',NULL,'$2a$10$.e4mYQHq67gjpt6boIQPTORRIJTsDOBLhq0t2FeLRgU.gs5CU7eAS','DATA_ENCODER',NULL,0,'2026-03-11 06:49:07','2026-03-11 06:49:18'),
  (12,'Namtan',NULL,'Tipnaree','namtan@email.com',NULL,'$2a$10$ISorRaDyQMk9hjTFomzzSuZd8pWsk7JLBqFYOHVrEmoYZwTTClDoO','DATA_ENCODER',NULL,0,'2026-03-11 07:01:52','2026-03-12 03:52:50'),
  (17,'Miu',NULL,'Taechamongkalapiwat','shaniacondalor@gmail.com',NULL,'$2a$10$ES3rOu1co7Bz4AZIWyVb9O2ezVX.gDt6WhG12LCpjRu5yysQRhuF2','SUPER_ADMIN',NULL,1,'2026-03-18 05:57:25','2026-03-18 05:57:39'),
  (20,'Amir',NULL,'Perez','amir@email.com',NULL,'$2a$10$R/gxoDEHOX//vzaQbFkTj.NACp0N5fYO2.Qvi4cVXm7GJXZ0v0hhO','DATA_ENCODER',NULL,1,'2026-03-19 02:09:56','2026-03-19 02:12:39'),
  (23,'Reg',NULL,'User','tmp-reg-1774327794423@example.test',NULL,'$2a$10$gp.NMtuVz16fRfauCYajmeoO.5knzLCifd.yAQphkypGguXFX87hm','DATA_ENCODER',NULL,1,'2026-03-24 04:49:54','2026-03-24 04:49:54'),
  (24,'Love',NULL,'Pattranite','love@email.com',NULL,'$2a$10$vy.TYkcRWUK1RwUDy92VquO/TXZSBf0/2WQw3PhqwnDZ1bNFuWIgy','DATA_ENCODER',NULL,1,'2026-03-24 04:54:52','2026-03-24 04:54:52'),
  (25,'Alexis',NULL,'Torrefiel','alexis@email.com',NULL,'$2a$10$fENAfPufZ8ajziWpY1Abaui9kRWhmDMMHANX5ZWVZHZ.15yFFsRjK','DATA_ENCODER',NULL,1,'2026-03-24 04:58:50','2026-03-24 04:58:50'),
  (26,'Super',NULL,'Admin','superadmin@deped.gov.ph',NULL,'$2a$10$NfJ0MCfNkjQg3Uv.dRP2BOvrAh5A3uN3ilSpp9DtH.vUzD6bv51jC','SUPER_ADMIN',NULL,1,'2026-03-24 06:13:45','2026-03-24 06:25:19'),
  (28,'Test',NULL,'Admin','testadmin@deped.gov.ph',NULL,'$2a$10$TXjQToToqwgg7bYoTWUnIex0d1gqkI9OJGX2evOviPNSWEpxdqEPS','ADMIN',NULL,1,'2026-03-24 06:25:19','2026-03-24 06:25:19'),
  (29,'Test',NULL,'Encoder','testencoder@deped.gov.ph',NULL,'$2a$10$8GO16u.mTnBJfg4RnQavouwIo72VKsnyC5n4RXUH98g0EC/c9cYie','DATA_ENCODER',NULL,1,'2026-03-24 06:25:20','2026-03-24 06:25:20'),
  (30,'Raymond',NULL,'Bautista','raymond@email.com',NULL,'$2a$10$xTEQ2AQNvrph/amnURnSjOwmPwMs8cz5WoroWDOzz5m61UqaXhyta','ADMIN',57,1,'2026-03-26 01:10:59','2026-03-26 01:10:59'),
  (31,'Bea',NULL,'Patrice','bea@gmail.com',NULL,'$2a$10$Fm1is6AdbZ.Yx.pLEMuxQ.frZG0Gdxf7V1ql0rtdxY7gwoDVI7NCO','DATA_ENCODER',57,1,'2026-03-26 02:20:45','2026-03-26 02:20:45'),
  (32,'Alexis',NULL,'Torrefiel','alex@email.com',NULL,'$2a$10$aWTUcuGMwtjdxNrc9veJOOIYtKhOBM458.AX6.4dv4jJ10g6Va4kG','DATA_ENCODER',57,1,'2026-03-26 02:27:13','2026-03-26 02:27:13'),
  (33,'Namtan',NULL,'Tipnaree','tipnaree@email.com',NULL,'$2a$10$4Jv7qTZvXvPPACI/k1hCkuUuWVIFLMmckEZaYhtsJ4b64jS7gVZ5W','DATA_ENCODER',69,1,'2026-03-26 02:28:21','2026-03-26 02:28:46'),
  (34,'Alexis',NULL,'Test','alexistorrefiel19@gmail.com',NULL,'$2a$10$/7lzZ81ZRXgvrkh.IWV2X.nA4bNw0ZiPGSX/yHUxekOtfBbBEPTzK','SUPER_ADMIN',77,1,'2026-03-31 03:59:36','2026-04-21 06:43:33'),
  (35,'Peter','Grant','Griffin','petergriffin@gmail.com','1982-07-24','$2a$10$7MFr5M.aNzvLtsr4GpCgNOG61pEBDY/QLzzBdt/dREUmBFq7n3WEi','DATA_ENCODER',78,1,'2026-04-07 03:53:47','2026-04-07 03:53:47'),
  (36,'Alexis',NULL,'Torrefiel','torrefiel@gmail.com','2004-07-27','$2a$10$34a/n.DRkWmOJvgUYy96Uehru/izfgocDw2JrkhwQrXxWcRCmx/1O','DATA_ENCODER',65,1,'2026-04-21 03:49:43','2026-04-21 03:49:43'),
  (37,'Caelus',NULL,'Blazer','caelus@gmail.com','1997-05-24','$2a$10$1whrO1idg1cep7n1Sp3fxOMWg7q2HwtKhVQsGj5PHqQ4RQIy1A4BC','DATA_ENCODER',78,1,'2026-04-21 03:53:48','2026-04-21 03:53:48');

-- ====================================================================
-- 2. CREATE REMAINING MISSING TABLES (14 tables missing from esrdatabase)
-- ====================================================================

-- Table: archiving_reasons
DROP TABLE IF EXISTS `archiving_reasons`;
CREATE TABLE `archiving_reasons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reason_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reason_name` (`reason_name`),
  KEY `idx_archiving_reasons_name` (`reason_name`)
) ENGINE=InnoDB AUTO_INCREMENT=925 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: backlogs
DROP TABLE IF EXISTS `backlogs`;
CREATE TABLE `backlogs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `school_id` int DEFAULT NULL,
  `employee_id` int DEFAULT NULL,
  `leave_id` int DEFAULT NULL,
  `action` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `details` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `is_archived` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_backlogs_created_at` (`created_at`),
  KEY `idx_backlogs_user_id` (`user_id`),
  KEY `idx_backlogs_school_id` (`school_id`),
  KEY `idx_backlogs_employee_id` (`employee_id`),
  KEY `idx_backlogs_leave_id` (`leave_id`),
  KEY `idx_backlogs_is_archived` (`is_archived`),
  KEY `idx_backlogs_is_archived_created_at` (`is_archived`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=660 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: civil_statuses
DROP TABLE IF EXISTS `civil_statuses`;
CREATE TABLE `civil_statuses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `civil_status_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `civil_status_name` (`civil_status_name`),
  KEY `idx_civil_statuses_name` (`civil_status_name`)
) ENGINE=InnoDB AUTO_INCREMENT=529 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: employees (more comprehensive than emppersonalinfo)
DROP TABLE IF EXISTS `employees`;
CREATE TABLE `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(75) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `middle_name` varchar(75) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `middle_initial` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `last_name` varchar(75) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `mobile_number` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `home_address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `place_of_birth` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `civil_status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `civil_status_id` int DEFAULT NULL,
  `sex` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `sex_id` int DEFAULT NULL,
  `birthdate` date DEFAULT NULL,
  `school_id` int NOT NULL,
  `work_district` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `age` int DEFAULT NULL,
  `is_archived` tinyint(1) NOT NULL DEFAULT '0',
  `archived_at` datetime DEFAULT NULL,
  `archived_by` int DEFAULT NULL,
  `archived_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `on_leave` tinyint(1) NOT NULL DEFAULT '0',
  `on_leave_from` date DEFAULT NULL,
  `on_leave_until` date DEFAULT NULL,
  `on_leave_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `leave_status_updated_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_employee_email` (`email`),
  UNIQUE KEY `uk_employees_mobile_number` (`mobile_number`),
  KEY `idx_employees_school_id` (`school_id`),
  KEY `idx_employees_is_archived` (`is_archived`),
  KEY `idx_employees_archived_by` (`archived_by`),
  KEY `idx_employees_on_leave` (`on_leave`),
  KEY `idx_employees_work_district` (`work_district`),
  KEY `idx_employees_civil_status_id` (`civil_status_id`),
  KEY `idx_employees_sex_id` (`sex_id`)
) ENGINE=InnoDB AUTO_INCREMENT=211 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: leaves
DROP TABLE IF EXISTS `leaves`;
CREATE TABLE `leaves` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `period_of_leave` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `entry_kind` enum('MANUAL','MONTHLY_CREDIT') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'MANUAL',
  `particulars` enum('Adoption Leave','Compensatory Paid Leave','Forced Leave (Disapproved)','Forced Leave','Late/Undertime','Leave Credit','Maternity Leave','Monetization','Paternity Leave','Rehabilitation Leave','Special Emergency Leave','Sick Leave','Solo Parent','Special Privilege Leave','Special Leave for Women','Study Leave','Terminal Leave','VAWC Leave','Vacation Leave','Balance Forwarded','Service Credit','Training/Seminar','Brigada Eskwela','Early Registration/Enrollment','Election','Remediation/Enrichment Classes/NLC','Checking of Forms','Wellness Leave','Others') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `earned_vl` decimal(10,2) DEFAULT '0.00',
  `abs_with_pay_vl` decimal(10,2) DEFAULT '0.00',
  `abs_without_pay_vl` decimal(10,2) DEFAULT '0.00',
  `bal_vl` decimal(10,2) DEFAULT '0.00',
  `earned_sl` decimal(10,2) DEFAULT '0.00',
  `abs_with_pay_sl` decimal(10,2) DEFAULT '0.00',
  `abs_without_pay_sl` decimal(10,2) DEFAULT '0.00',
  `bal_sl` decimal(10,2) DEFAULT '0.00',
  `date_of_action` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_leaves_employee_id` (`employee_id`),
  KEY `idx_leaves_date_of_action` (`date_of_action`)
) ENGINE=InnoDB AUTO_INCREMENT=758 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: login_attempts
DROP TABLE IF EXISTS `login_attempts`;
CREATE TABLE `login_attempts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `is_successful` tinyint(1) NOT NULL DEFAULT '0',
  `attempted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_login_attempts_email` (`email`),
  KEY `idx_login_attempts_user_id` (`user_id`),
  KEY `idx_login_attempts_attempted_at` (`attempted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: positions
DROP TABLE IF EXISTS `positions`;
CREATE TABLE `positions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `position_title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `position_title` (`position_title`),
  KEY `idx_positions_title` (`position_title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: registration_requests
DROP TABLE IF EXISTS `registration_requests`;
CREATE TABLE `registration_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `school_id` int DEFAULT NULL,
  `requested_role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'PENDING',
  `rejection_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `approved_by` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_registration_requests_status` (`status`),
  KEY `idx_registration_requests_school_id` (`school_id`),
  KEY `idx_registration_requests_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=350 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: revoked_tokens
DROP TABLE IF EXISTS `revoked_tokens`;
CREATE TABLE `revoked_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `token` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `revoked_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_revoked_tokens_user_id` (`user_id`),
  KEY `idx_revoked_tokens_revoked_at` (`revoked_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: salary_increment_notices
DROP TABLE IF EXISTS `salary_increment_notices`;
CREATE TABLE `salary_increment_notices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `salary_information_id` int NOT NULL,
  `notice_date` date NOT NULL,
  `old_salary` decimal(12,2) DEFAULT NULL,
  `new_salary` decimal(12,2) NOT NULL,
  `effective_date` date NOT NULL,
  `increment_amount` decimal(12,2) DEFAULT NULL,
  `document_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_salary_increment_notices_employee_id` (`employee_id`),
  KEY `idx_salary_increment_notices_salary_information_id` (`salary_information_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: salary_information
DROP TABLE IF EXISTS `salary_information`;
CREATE TABLE `salary_information` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `salary_date` date NOT NULL,
  `salary` decimal(12,2) NOT NULL,
  `increment_amount` decimal(12,2) DEFAULT '0.00',
  `increment_mode` enum('AUTO','MANUAL') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'AUTO',
  `step` int DEFAULT '1',
  `plantilla_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `sg` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `remarks` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_salary_information_employee_id` (`employee_id`),
  KEY `idx_salary_information_salary_date` (`salary_date`),
  KEY `idx_salary_information_employee_salary_date` (`employee_id`,`salary_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: sexes
DROP TABLE IF EXISTS `sexes`;
CREATE TABLE `sexes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sex_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sex_name` (`sex_name`),
  KEY `idx_sexes_name` (`sex_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: super_admin_schools
DROP TABLE IF EXISTS `super_admin_schools`;
CREATE TABLE `super_admin_schools` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `school_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_super_admin_schools` (`user_id`,`school_id`),
  KEY `idx_super_admin_schools_school_id` (`school_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: user_token_invalidations
DROP TABLE IF EXISTS `user_token_invalidations`;
CREATE TABLE `user_token_invalidations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `invalidated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_token_invalidations_user_id` (`user_id`),
  KEY `idx_user_token_invalidations_invalidated_at` (`invalidated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: work_information
DROP TABLE IF EXISTS `work_information`;
CREATE TABLE `work_information` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `position_id` int DEFAULT NULL,
  `employment_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `date_started` date DEFAULT NULL,
  `years_in_service` int DEFAULT NULL,
  `loyalty_bonus` decimal(12,2) DEFAULT NULL,
  `current_salary_grade` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `current_step` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_work_information_employee_id` (`employee_id`),
  KEY `idx_work_information_position_id` (`position_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ====================================================================
-- 3. ADD MISSING FOREIGN KEY CONSTRAINTS
-- ====================================================================

-- Add constraints to backlogs (if not already present)
ALTER TABLE `backlogs` 
  ADD CONSTRAINT `fk_backlogs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_backlogs_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_backlogs_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_backlogs_leave` FOREIGN KEY (`leave_id`) REFERENCES `leaves` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Add constraints to civil_statuses (no foreign keys, it's a lookup table)

-- Add constraints to employees
ALTER TABLE `employees` 
  ADD CONSTRAINT `fk_employees_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_employees_civil_status_id` FOREIGN KEY (`civil_status_id`) REFERENCES `civil_statuses` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_employees_sex_id` FOREIGN KEY (`sex_id`) REFERENCES `sexes` (`id`) ON DELETE SET NULL;

-- Add constraints to leaves
ALTER TABLE `leaves` 
  ADD CONSTRAINT `fk_leaves_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Add constraints to registration_requests
ALTER TABLE `registration_requests` 
  ADD CONSTRAINT `fk_registration_requests_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_registration_requests_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- Add constraints to salary_increment_notices
ALTER TABLE `salary_increment_notices` 
  ADD CONSTRAINT `fk_salary_increment_notices_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_salary_increment_notices_salary_info` FOREIGN KEY (`salary_information_id`) REFERENCES `salary_information` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Add constraints to salary_information
ALTER TABLE `salary_information` 
  ADD CONSTRAINT `fk_salary_information_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Add constraints to super_admin_schools
ALTER TABLE `super_admin_schools` 
  ADD CONSTRAINT `fk_super_admin_schools_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_super_admin_schools_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Add constraints to user_token_invalidations
ALTER TABLE `user_token_invalidations` 
  ADD CONSTRAINT `fk_user_token_invalidations_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Add constraints to work_information
ALTER TABLE `work_information` 
  ADD CONSTRAINT `fk_work_information_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_work_information_position` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) ON DELETE SET NULL;

-- ====================================================================
-- 4. REFERENCE DATA SETUP (Initial seed data)
-- ====================================================================

-- Populate sexes if empty
INSERT INTO `sexes` (sex_name) VALUES 
  ('M'),
  ('F'),
  ('Other')
ON DUPLICATE KEY UPDATE sex_name=VALUES(sex_name);

-- Populate civil_statuses if empty
INSERT INTO `civil_statuses` (civil_status_name) VALUES 
  ('Single'),
  ('Married'),
  ('Separated'),
  ('Widowed')
ON DUPLICATE KEY UPDATE civil_status_name=VALUES(civil_status_name);

-- Populate archiving_reasons if empty
INSERT INTO `archiving_reasons` (reason_name) VALUES 
  ('Resignation'),
  ('Retirement'),
  ('Employment Termination'),
  ('Deceased'),
  ('Transfer to Another Agency'),
  ('Absent Without Official Leave'),
  ('Others')
ON DUPLICATE KEY UPDATE reason_name=VALUES(reason_name);

-- ====================================================================
-- 5. INDEX OPTIMIZATION
-- ====================================================================

-- Create additional indexes for common queries
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_leaves_employee_salary_date ON leaves(employee_id, date_of_action);
CREATE INDEX IF NOT EXISTS idx_salary_info_employee ON salary_information(employee_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);

-- ====================================================================
-- SYNCHRONIZATION COMPLETE
-- ====================================================================
-- This script has successfully added all missing tables from deped_chris
-- to the esrdatabase (deped_csjdm_db_second). The schema is now aligned.
-- Please verify the data migration needs separately.
