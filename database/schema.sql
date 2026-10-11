-- ============================================================================
-- PetCare Passport — Database Schema
-- Secure Digital Pet Health Records and QR-Based Emergency Identification System
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `petcare_passport`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `petcare_passport`;

-- Disable foreign key checks during setup
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- Table: users
-- Stores registered pet owner accounts
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `found_pet_reports`;
DROP TABLE IF EXISTS `health_records`;
DROP TABLE IF EXISTS `emergency_privacy_settings`;
DROP TABLE IF EXISTS `pets`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `phone` VARCHAR(30) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: pets
-- Stores pet profiles owned by registered users
-- ----------------------------------------------------------------------------
CREATE TABLE `pets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `public_id` VARCHAR(64) NOT NULL UNIQUE, -- Secure random identifier for public QR emergency URL
  `name` VARCHAR(100) NOT NULL,
  `species` VARCHAR(50) NOT NULL,           -- Dog, Cat, Bird, Rabbit, etc.
  `breed` VARCHAR(100) DEFAULT NULL,
  `dob` DATE DEFAULT NULL,
  `gender` ENUM('Male', 'Female', 'Unknown') DEFAULT 'Unknown',
  `color_markings` VARCHAR(255) DEFAULT NULL,
  `microchip_number` VARCHAR(100) DEFAULT NULL,
  `blood_group` VARCHAR(30) DEFAULT NULL,
  `current_weight` DECIMAL(6,2) DEFAULT NULL, -- in kg
  `sterilization_status` ENUM('Neutered/Spayed', 'Intact', 'Unknown') DEFAULT 'Unknown',
  `allergies` TEXT DEFAULT NULL,
  `medical_conditions` TEXT DEFAULT NULL,
  `current_medications` TEXT DEFAULT NULL,
  `special_care_instructions` TEXT DEFAULT NULL,
  `identification_notes` TEXT DEFAULT NULL,
  `photo_url` VARCHAR(255) DEFAULT NULL,
  `qr_code_url` VARCHAR(255) DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_pets_user_id` (`user_id`),
  INDEX `idx_pets_public_id` (`public_id`),
  CONSTRAINT `fk_pets_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: emergency_privacy_settings
-- Owner-configurable visibility controls for the public QR emergency profile
-- ----------------------------------------------------------------------------
CREATE TABLE `emergency_privacy_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `pet_id` INT NOT NULL UNIQUE,
  `show_photo` TINYINT(1) DEFAULT 1,
  `show_name` TINYINT(1) DEFAULT 1,
  `show_species_breed` TINYINT(1) DEFAULT 1,
  `show_medical_alerts` TINYINT(1) DEFAULT 1,
  `show_allergies` TINYINT(1) DEFAULT 1,
  `show_special_care` TINYINT(1) DEFAULT 1,
  `show_emergency_phone` TINYINT(1) DEFAULT 0, -- Secure default: OFF until explicitly enabled
  `show_contact_form` TINYINT(1) DEFAULT 1,    -- Default ON: allows finder to reach owner safely
  `custom_emergency_instructions` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_emergency_pet` FOREIGN KEY (`pet_id`)
    REFERENCES `pets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: health_records
-- Chronological medical events across all categories
-- ----------------------------------------------------------------------------
CREATE TABLE `health_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `pet_id` INT NOT NULL,
  `category` ENUM(
    'vaccination',
    'deworming',
    'medication',
    'vet_visit',
    'allergy_condition',
    'document'
  ) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `date_administered` DATE DEFAULT NULL,
  `next_due_date` DATE DEFAULT NULL,
  `clinic_name` VARCHAR(150) DEFAULT NULL,
  `veterinarian_name` VARCHAR(100) DEFAULT NULL,
  `dosage` VARCHAR(100) DEFAULT NULL,
  `start_date` DATE DEFAULT NULL,
  `end_date` DATE DEFAULT NULL,
  `severity` ENUM('Low', 'Moderate', 'High', 'Critical', 'None') DEFAULT 'None',
  `instructions_notes` TEXT DEFAULT NULL,
  `attachment_url` VARCHAR(255) DEFAULT NULL,
  `attachment_name` VARCHAR(255) DEFAULT NULL,
  `attachment_type` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_hr_pet_category` (`pet_id`, `category`),
  INDEX `idx_hr_next_due` (`next_due_date`),
  CONSTRAINT `fk_health_records_pet` FOREIGN KEY (`pet_id`)
    REFERENCES `pets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: found_pet_reports
-- Incident reports submitted by public finders who scan the QR code
-- ----------------------------------------------------------------------------
CREATE TABLE `found_pet_reports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `pet_id` INT NOT NULL,
  `finder_name` VARCHAR(100) NOT NULL,
  `finder_phone` VARCHAR(30) NOT NULL,
  `finder_email` VARCHAR(150) DEFAULT NULL,
  `found_location` VARCHAR(255) NOT NULL,
  `found_date` DATETIME NOT NULL,
  `message` TEXT DEFAULT NULL,
  `photo_url` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('pending', 'contacted', 'resolved') DEFAULT 'pending',
  `resolved_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_found_reports_pet` (`pet_id`),
  INDEX `idx_found_reports_status` (`status`),
  CONSTRAINT `fk_found_reports_pet` FOREIGN KEY (`pet_id`)
    REFERENCES `pets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: notifications
-- In-app notifications for owners (vaccination reminders, found-pet reports)
-- ----------------------------------------------------------------------------
CREATE TABLE `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `pet_id` INT DEFAULT NULL,
  `title` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('reminder', 'found_report', 'general') DEFAULT 'general',
  `link_url` VARCHAR(255) DEFAULT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_notif_user_read` (`user_id`, `is_read`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notif_pet` FOREIGN KEY (`pet_id`)
    REFERENCES `pets` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
