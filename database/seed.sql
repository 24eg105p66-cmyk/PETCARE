-- ============================================================================
-- PetCare Passport — Seed Data
-- ============================================================================

USE `petcare_passport`;

-- Insert Demo Pet Owner
-- Password is 'Password@123'
INSERT INTO `users` (`id`, `full_name`, `email`, `phone`, `password_hash`)
VALUES (
  1,
  'Sarah Jenkins',
  'sarah@petcare.com',
  '+1 (555) 234-5678',
  '$2a$10$Ok5rRvHv6VoQVvPRKfXxuuQeMPpF34yU63W5Ord8.X/0lm1M7BNr.'
) ON DUPLICATE KEY UPDATE `email`=`email`;

-- Insert Demo Pets
INSERT INTO `pets` (
  `id`, `user_id`, `public_id`, `name`, `species`, `breed`, `dob`, `gender`,
  `color_markings`, `microchip_number`, `blood_group`, `current_weight`,
  `sterilization_status`, `allergies`, `medical_conditions`, `current_medications`,
  `special_care_instructions`, `identification_notes`, `photo_url`, `qr_code_url`
) VALUES
(
  1,
  1,
  'pet_max_golden_2026_demo',
  'Max',
  'Dog',
  'Golden Retriever',
  '2021-04-12',
  'Male',
  'Honey gold coat with white chest star',
  '985141002345678',
  'DEA 1.1 Positive',
  31.50,
  'Neutered/Spayed',
  'Beef protein allergy, Chicken byproducts (causes severe hives)',
  'Mild seasonal atopic dermatitis',
  'Apoquel 16mg as needed during seasonal flare-ups',
  'Friendly with children and other dogs. DO NOT feed beef or chicken treats! Keep hydrated.',
  'Wearing a blue reflective nylon collar with brass bell and PetCare Passport QR tag.',
  '/uploads/pets/demo-max.jpg',
  '/uploads/qrcodes/qr-pet_max_golden_2026_demo.png'
),
(
  2,
  1,
  'pet_luna_cat_2026_demo',
  'Luna',
  'Cat',
  'British Shorthair',
  '2022-08-20',
  'Female',
  'Solid blue-grey coat with copper-orange eyes',
  '985141009876543',
  'Type A',
  4.30,
  'Neutered/Spayed',
  'No known drug or dietary allergies',
  'None diagnosed',
  'None currently prescribed',
  'Indoor-only feline. Extremely timid around loud noises or barking dogs. Please secure gently in a carrier.',
  'Wearing a pink breakaway collar with silver identification charm.',
  '/uploads/pets/demo-luna.jpg',
  '/uploads/qrcodes/qr-pet_luna_cat_2026_demo.png'
) ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Insert Emergency Privacy Settings
INSERT INTO `emergency_privacy_settings` (
  `pet_id`, `show_photo`, `show_name`, `show_species_breed`,
  `show_medical_alerts`, `show_allergies`, `show_special_care`,
  `show_emergency_phone`, `show_contact_form`, `custom_emergency_instructions`
) VALUES
(
  1,
  1, 1, 1, 1, 1, 1, 1, 1,
  'Max is a cherished family dog. He is microchipped and gentle. Please keep him in a secure, shaded area and call or message Sarah immediately!'
),
(
  2,
  1, 1, 1, 1, 0, 1, 0, 1,
  'Luna is an indoor cat who slipped outdoors. Please do not chase her. Secure her in a quiet room and message through the form.'
) ON DUPLICATE KEY UPDATE `custom_emergency_instructions`=VALUES(`custom_emergency_instructions`);

-- Insert Health Records
INSERT INTO `health_records` (
  `pet_id`, `category`, `title`, `date_administered`, `next_due_date`,
  `clinic_name`, `veterinarian_name`, `dosage`, `start_date`, `end_date`,
  `severity`, `instructions_notes`, `attachment_name`, `attachment_type`
) VALUES
-- Max Records
(
  1, 'vaccination', 'Rabies 3-Year Booster',
  DATE_SUB(CURDATE(), INTERVAL 350 DAY),
  DATE_ADD(CURDATE(), INTERVAL 14 DAY), -- Upcoming in 14 days!
  'Oakwood Veterinary Hospital', 'Dr. Emily Vance, DVM',
  '1.0 mL Subcutaneous', NULL, NULL, 'None',
  'Administered in right rear limb. Pet tolerated well with no adverse reaction. Lot: #RB-2024-X9.',
  'rabies_certificate_max.pdf', 'document'
),
(
  1, 'vaccination', 'DHPP Core Combination (Distemper/Parvo)',
  DATE_SUB(CURDATE(), INTERVAL 380 DAY),
  DATE_SUB(CURDATE(), INTERVAL 15 DAY), -- Overdue by 15 days!
  'Oakwood Veterinary Hospital', 'Dr. Emily Vance, DVM',
  '1.0 mL Subcutaneous', NULL, NULL, 'None',
  'Covers Canine Distemper, Adenovirus Type 2, Parainfluenza, and Parvovirus.',
  NULL, NULL
),
(
  1, 'deworming', 'NexGard Spectra (Heartworm & Flea/Tick)',
  DATE_SUB(CURDATE(), INTERVAL 25 DAY),
  DATE_ADD(CURDATE(), INTERVAL 5 DAY), -- Upcoming in 5 days!
  'Oakwood Veterinary Hospital', 'Dr. Emily Vance, DVM',
  'Chewable tablet (30.1 - 60 kg)', NULL, NULL, 'None',
  'Monthly preventative tablet given with meal.',
  NULL, NULL
),
(
  1, 'medication', 'Apoquel Allergy Relief',
  DATE_SUB(CURDATE(), INTERVAL 60 DAY), NULL,
  'Oakwood Veterinary Hospital', 'Dr. Emily Vance, DVM',
  '16 mg tablet once daily', DATE_SUB(CURDATE(), INTERVAL 60 DAY), DATE_ADD(CURDATE(), INTERVAL 30 DAY),
  'Moderate', 'Give with morning meal during high pollen counts or if paw licking is observed.',
  'apoquel_prescription.pdf', 'prescription'
),
(
  1, 'vet_visit', 'Annual Comprehensive Wellness Checkup',
  DATE_SUB(CURDATE(), INTERVAL 180 DAY),
  DATE_ADD(CURDATE(), INTERVAL 185 DAY),
  'City Animal Health Center', 'Dr. Marcus Bell, DVM',
  NULL, NULL, NULL, 'None',
  'Body condition score: 5/9 ideal. Dental grade 1 (clean teeth). Abdominal palpation unremarkable. Weight stable at 31.5 kg.',
  NULL, NULL
),
(
  1, 'allergy_condition', 'Severe Beef & Poultry Protein Allergy',
  '2022-06-15', NULL,
  'Veterinary Dermatology Clinic', 'Dr. Rachel Green, DVM',
  NULL, NULL, NULL, 'High',
  'Ingestion causes acute facial angioedema and hives. Requires strict fish/lamb limited ingredient diet.',
  NULL, NULL
),

-- Luna Records
(
  2, 'vaccination', 'FVRCP Feline Core (Rhinotracheitis, Calici, Panleukopenia)',
  DATE_SUB(CURDATE(), INTERVAL 300 DAY),
  DATE_ADD(CURDATE(), INTERVAL 65 DAY),
  'Feline Care Specialist Clinic', 'Dr. Clara Oswald, DVM',
  '1.0 mL Subcutaneous', NULL, NULL, 'None',
  'Administered right forelimb without complications.',
  NULL, NULL
),
(
  2, 'deworming', 'Profender Topical Dewormer',
  DATE_SUB(CURDATE(), INTERVAL 85 DAY),
  DATE_ADD(CURDATE(), INTERVAL 5 DAY), -- Upcoming in 5 days!
  'Feline Care Specialist Clinic', 'Dr. Clara Oswald, DVM',
  'Topical spot-on tube (2.5 - 5 kg)', NULL, NULL, 'None',
  'Applied between shoulder blades on skin.',
  NULL, NULL
),
(
  2, 'vet_visit', 'Routine Dental Examination',
  DATE_SUB(CURDATE(), INTERVAL 90 DAY),
  DATE_ADD(CURDATE(), INTERVAL 275 DAY),
  'Feline Care Specialist Clinic', 'Dr. Clara Oswald, DVM',
  NULL, NULL, NULL, 'None',
  'Gingiva healthy. Minimal tartar. Recommended continued use of enzymatic feline dental treats.',
  NULL, NULL
);

-- Insert Sample Found Pet Report for Max
INSERT INTO `found_pet_reports` (
  `id`, `pet_id`, `finder_name`, `finder_phone`, `finder_email`,
  `found_location`, `found_date`, `message`, `status`
) VALUES (
  1,
  1,
  'David Miller',
  '+1 (555) 987-6543',
  'david.m@example.com',
  'Near Riverside Park Agility Track, North Entrance',
  DATE_SUB(NOW(), INTERVAL 3 HOUR),
  'Found Max sitting near the trail bench. Scanned the tag on his collar. He has fresh water and is safe with me on my porch. Please call or message!',
  'pending'
) ON DUPLICATE KEY UPDATE `finder_name`=VALUES(`finder_name`);

-- Insert Sample Notifications
INSERT INTO `notifications` (`user_id`, `pet_id`, `title`, `message`, `type`, `link_url`, `is_read`)
VALUES
(
  1, 1,
  '🚨 Found Pet Alert: Max',
  'A finder named David Miller submitted a found-pet report for Max near Riverside Park.',
  'found_report',
  '/found-reports.html',
  0
),
(
  1, 1,
  '⚠️ Overdue Vaccination: DHPP',
  'Max is overdue for DHPP Core Combination vaccine. Please schedule a veterinary visit.',
  'reminder',
  '/reminders.html',
  0
),
(
  1, 1,
  'Upcoming Vaccination: Rabies Booster',
  'Max has an upcoming Rabies 3-Year Booster due in 14 days.',
  'reminder',
  '/reminders.html',
  0
),
(
  1, 2,
  'Upcoming Deworming: Luna',
  'Luna is due for Profender Topical Dewormer in 5 days.',
  'reminder',
  '/reminders.html',
  1
);
