# PetCare Passport 🐾

### Secure Digital Pet Health Records & QR-Based Emergency Identification System

PetCare Passport is a production-grade full-stack web application designed for pet owners, veterinary clinics, and good Samaritans. It bridges everyday pet healthcare management (vaccination tracking, deworming, medication logs, and clinical records) with instant, non-invasive emergency identification via smart QR collar tags.

---

## 🌟 Key Features

### 1. Digital Pet Health Passport
* **Complete Identification**: Pet profile with photo, species, breed, date of birth, age calculation, sex, color markings, microchip number, blood group, weight, and sterilization status.
* **Master Health Records**: Chronological tracking across six medical categories:
  * **Vaccinations** (booster dates, administration site, batch numbers, clinics)
  * **Deworming Treatments** (preventative schedules, parasite targets, dosages)
  * **Prescribed Medications** (active courses, start/end dates, veterinarian notes)
  * **Veterinary Visits** (clinical findings, exams, diagnoses, follow-up dates)
  * **Allergies & Conditions** (severity classification, trigger factors)
  * **Medical Documents** (veterinary certificates, lab reports, prescriptions with private file storage)
* **Veterinary Clinical Notice**: Prominent reminders that the passport serves record management purposes and does not replace licensed veterinary advice.

### 2. Intelligent Reminders System
* **Automated Status Calculation**: Calculates real-time schedule statuses directly from the database `next_due_date` against the current date (`CURDATE()`).
* **Categorized Alerts**:
  * **Overdue**: Critical boosters past their scheduled date.
  * **Due Soon**: Approaching within 7 days.
  * **Upcoming**: Due within 8–30 days.
  * **Future**: Scheduled appointments further out.
* **Dashboard Notifications**: Real-time notification bell with unread badge indicators and direct links.

### 3. QR-Based Emergency Identification System
* **Unique Un-guessable Tokens**: Each pet receives a cryptographically secure, stable public identifier (e.g. `pet_4f89...`).
* **No App or Account Required**: Finders scan the collar tag with any standard smartphone camera to open the emergency profile in mobile browsers.
* **Printable Collar Tags & Wallet ID Cards**:
  * Downloadable high-resolution PNG QR tags.
  * Circular tag format for collar charms.
  * Print-ready stylesheet (`window.print()`) for pocket cards.

### 4. Granular Owner Privacy Shield
* **Owner-Controlled Visibility Matrix**: Owners toggle individual fields visible on the public QR scan:
  * Pet photograph
  * Pet name (or generic fallback "Beloved Pet")
  * Species and breed
  * Critical medical alerts & medications
  * Known allergies (food triggers to avoid)
  * Special care and hydration instructions
  * Direct emergency phone number (default: shielded)
  * Protected contact form
* **Zero Private Data Leakage**: Home addresses, account passwords, and medical document files are never exposed publicly.
* **Live Simulator**: Real-time mobile preview pane updates dynamically as privacy toggles are switched.

### 5. Found-Pet Incident Reporting
* **Direct Finder Incident Submissions**: Finders can submit their name, contact phone, email, location found, message, and a photo of the pet.
* **Real-Time Owner Alerts**: Generates high-priority in-app alerts on the owner's dashboard.
* **Incident Lifecycle Management**: Owners review submitted reports and track status from `Pending` → `In Contact` → `Reunited / Resolved`.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | Responsive mobile-first interface, modern CSS variables, zero heavy framework overhead |
| **UI Framework** | Bootstrap 5.3.3 & Bootstrap Icons | Modern cards, modals, dropdowns, and accessible iconography |
| **Backend Runtime** | Node.js (v18+) & Express.js (v4.21+) | RESTful modular architecture with centralized error handling |
| **Database** | MySQL (8.0+) / MariaDB | Normalized relational schema with foreign key cascades & indexes |
| **Database Client** | `mysql2/promise` | Connection pooling with parameterized queries preventing SQL injection |
| **Security & Auth** | `bcryptjs` (salt 10) & `express-session` | Secure session cookies (`httpOnly`, `sameSite: 'lax'`, 24-hr TTL) |
| **Rate Limiting** | `express-rate-limit` | Sensitive endpoint protection against brute-force & spam |
| **QR Code Engine** | `qrcode` (v1.5+) | High-density vector & PNG QR generation |
| **File Uploads** | `multer` (v1.4+) | Secure disk storage with strict MIME type and file size limits (5MB images, 10MB docs) |

---

## 📁 Project Directory Structure

```text
petcare-passport/
├── package.json                    # Root package script runner
├── .gitignore                      # Git exclusion rules
├── README.md                       # Comprehensive documentation
│
├── database/
│   ├── schema.sql                  # Normalized MySQL DDL tables & indexes
│   └── seed.sql                    # Realistic demo records & accounts
│
├── backend/
│   ├── server.js                   # Express application entry point
│   ├── package.json                # Backend dependencies & scripts
│   ├── .env.example                # Environment variables template
│   ├── .env                        # Local configuration (ignored by Git)
│   ├── test-workflows.js           # 12-workflow automated test suite
│   │
│   ├── config/
│   │   └── db.js                   # MySQL connection pool
│   │
│   ├── controllers/
│   │   ├── authController.js       # Register, login, logout, profile
│   │   ├── petController.js        # Pet CRUD, photo upload, cascades
│   │   ├── healthRecordController.js # Medical records CRUD
│   │   ├── reminderController.js   # Schedule calculations & dashboard stats
│   │   ├── qrController.js         # QR code generation & privacy settings
│   │   ├── emergencyController.js  # Public profile with privacy filters
│   │   ├── foundReportController.js# Public found reports & owner actions
│   │   └── notificationController.js# In-app notifications
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── petRoutes.js
│   │   ├── healthRecordRoutes.js
│   │   ├── reminderRoutes.js
│   │   ├── emergencyRoutes.js
│   │   ├── foundReportRoutes.js
│   │   ├── notificationRoutes.js
│   │   └── dashboardRoutes.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js       # Session verification
│   │   ├── uploadMiddleware.js     # Multer file size/type validation
│   │   └── rateLimiter.js          # Rate limiters for auth & reporting
│   │
│   ├── services/
│   │   ├── qrService.js            # QR generator & token creation
│   │   └── reminderService.js      # Date difference queries
│   │
│   ├── utils/
│   │   └── initAssets.js           # Demo asset & placeholder generator
│   │
│   └── uploads/                    # Persistent storage directories
│       ├── pets/                   # Uploaded pet photos
│       ├── documents/              # Uploaded prescriptions/certificates
│       ├── reports/                # Uploaded found-pet photos
│       └── qrcodes/                # Generated PNG QR codes
│
└── frontend/
    ├── index.html                  # Landing page (Hero, 3-step guide, features)
    ├── login.html                  # Login page (with demo credentials helper)
    ├── register.html               # Registration page
    ├── dashboard.html              # Owner dashboard
    ├── pets.html                   # My Pets directory & filters
    ├── add-pet.html                # Add new pet profile
    ├── pet-details.html            # Pet health passport & medical timeline
    ├── edit-pet.html               # Edit pet profile
    ├── health-records.html         # Master health records history
    ├── add-health-record.html      # Dynamic category health record form
    ├── reminders.html              # Vaccination & deworming reminders
    ├── qr-code.html                # QR code viewer & printable collar tag
    ├── emergency-settings.html     # Emergency privacy controls & simulator
    ├── emergency.html              # Public emergency profile & found report
    ├── found-reports.html          # Found-pet reports dashboard
    ├── profile.html                # Owner account profile & password change
    ├── 404.html                    # Pet-themed 404 error page
    ├── css/
    │   └── style.css               # Main design system
    ├── js/
    │   ├── api.js                  # Fetch wrapper, toasts, formatters
    │   ├── navbar.js               # Shared sidebar, topbar, notifications
    │   ├── dashboard.js
    │   ├── pets.js
    │   ├── add-pet.js
    │   ├── pet-details.js
    │   ├── edit-pet.js
    │   ├── health-records.js
    │   ├── add-health-record.js
    │   ├── reminders.js
    │   ├── qr-code.js
    │   ├── emergency-settings.js
    │   ├── emergency.js
    │   ├── found-reports.js
    │   └── profile.js
    └── assets/
        └── images/                 # Default pet & QR fallbacks
```

---

## 🗄️ Database Setup (MySQL)

### 1. Create Database & Run Schema
Open MySQL Command Line Client or MySQL Workbench:

```sql
CREATE DATABASE IF NOT EXISTS petcare_passport CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE petcare_passport;
```

Import the schema:
```bash
# Windows PowerShell
Get-Content -Raw database/schema.sql | & mysql -u root -p petcare_passport

# Linux / macOS
mysql -u root -p petcare_passport < database/schema.sql
```

### 2. (Optional) Load Seed Demo Records
To populate realistic demo pets (Max the Golden Retriever, Luna the British Shorthair, vaccinations, and sample found report):

```bash
# Windows PowerShell
Get-Content -Raw database/seed.sql | & mysql -u root -p petcare_passport

# Linux / macOS
mysql -u root -p petcare_passport < database/seed.sql
```

#### Demo Login Credentials
* **Email:** `sarah@petcare.com`
* **Password:** `Password@123`

---

## ⚙️ Environment Configuration

In the `backend/` folder, create a `.env` file (copied from `.env.example`):

```env
PORT=5000
NODE_ENV=development

# MySQL Database Credentials
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=petcare_passport

# Express Session Secret
SESSION_SECRET=your_super_secret_session_key_min_32_characters

# Application Base URL (Used for generating absolute QR links)
# Local: http://localhost:5000
# Production: https://petcarepassport.yourdomain.com
APP_URL=http://localhost:5000
```

---

## 🚀 Installation & Running Locally

### Step 1: Install Dependencies
From the project root:
```bash
npm run install:all
```
*(Or navigate to `cd backend && npm install`)*

### Step 2: Start the Server
```bash
npm start
```
*(Or navigate to `cd backend && npm run dev` for nodemon development mode)*

### Step 3: Access the Application
Open your browser and navigate to:
* **Application Home:** [http://localhost:5000](http://localhost:5000)
* **Owner Login:** [http://localhost:5000/login.html](http://localhost:5000/login.html)
* **System Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
* **Demo Public Emergency QR Scan:** [http://localhost:5000/emergency/pet_max_golden_2026_demo](http://localhost:5000/emergency/pet_max_golden_2026_demo)

---

## 🧪 Testing the 12 Core Workflows

An automated test suite covering all 12 functional workflows specified in the requirements is included:

```bash
cd backend
node test-workflows.js
```

### Verified Test Cases:
1. **User Registration:** Validates fields, password hashing, and prevents duplicate emails.
2. **User Authentication:** Compares bcrypt hash, sets secure session cookies, accesses dashboard.
3. **Pet Profile Creation:** Uploads data, creates database record, automatically initializes emergency settings and unique QR identifier.
4. **Health Record Management:** Adds vaccination boosters with past and future dates.
5. **Reminder Calculation:** Verifies overdue calculation and upcoming notification triggers.
6. **QR Generation:** Generates valid PNG images pointing to stable `/emergency/:publicId` URLs.
7. **Logged-out Public Access:** Loads emergency profile without session cookies, verifying default privacy shielding (e.g. phone hidden).
8. **Privacy Settings Updates:** Toggles emergency phone number visibility on, verifying immediate reflection on public scan.
9. **Found-Pet Reporting:** Submits report without logging in (finder contact, location, message).
10. **Owner Incident Review:** Verifies report appears on owner dashboard and status can be marked as `Resolved`.
11. **IDOR & Authorization Security:** Blocks User B from viewing, modifying, or deleting User A's private pet records.
12. **Session Logout:** Invalidation of authenticated session and verification that protected endpoints return `401 Unauthorized`.

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new owner account | No (Rate limited) |
| `POST` | `/api/auth/login` | Authenticate owner & initiate session | No (Rate limited) |
| `POST` | `/api/auth/logout` | Destroy session & clear cookie | Yes |
| `GET` | `/api/auth/me` | Get currently authenticated profile | Yes |
| `PUT` | `/api/auth/profile` | Update owner name, phone, or password | Yes |

### Pet Management (`/api/pets`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/pets` | List all pets owned by user | Yes |
| `POST` | `/api/pets` | Create pet profile with photo upload | Yes |
| `GET` | `/api/pets/:id` | Get pet details with privacy settings | Yes (Owner only) |
| `PUT` | `/api/pets/:id` | Update pet details & photo | Yes (Owner only) |
| `DELETE` | `/api/pets/:id` | Delete pet profile (cascades records & QR) | Yes (Owner only) |

### Health Records (`/api/pets/:petId/health-records` & `/api/health-records`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/pets/:petId/health-records` | Get records for a pet (filters by category/date) | Yes (Owner only) |
| `POST` | `/api/pets/:petId/health-records` | Log new health record with attachment | Yes (Owner only) |
| `PUT` | `/api/health-records/:id` | Update existing medical record | Yes (Owner only) |
| `DELETE` | `/api/health-records/:id` | Delete medical record & attachment | Yes (Owner only) |

### Reminders & Dashboard (`/api/reminders` & `/api/dashboard`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/reminders` | Categorized overdue and upcoming reminders | Yes |
| `GET` | `/api/dashboard/summary` | Real-time counts, urgent alerts, and recent records | Yes |

### QR & Emergency Identification
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/pets/:id/qr` | Get QR image URLs & printable card data | Yes (Owner only) |
| `POST` | `/api/pets/:id/qr` | Regenerate QR code image file | Yes (Owner only) |
| `GET` | `/api/pets/:id/emergency-settings` | View current privacy visibility flags | Yes (Owner only) |
| `PUT` | `/api/pets/:id/emergency-settings` | Update privacy toggles & custom instructions | Yes (Owner only) |
| `GET` | `/api/emergency/:publicId` | Public emergency profile for QR scans | **Public (No auth)** |

### Found-Pet Reports (`/api/found-reports` & `/api/emergency/:publicId/found-reports`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/emergency/:publicId/found-reports` | Public report submission by finder | **Public (Rate limited)** |
| `GET` | `/api/found-reports` | List reports received for owner's pets | Yes (Owner only) |
| `PATCH` | `/api/found-reports/:id/status` | Update status (pending, contacted, resolved) | Yes (Owner only) |

### Notifications & System
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/notifications` | List owner notifications | Yes |
| `PATCH` | `/api/notifications/:id/read` | Mark individual notification as read | Yes |
| `PATCH` | `/api/notifications/read-all` | Mark all notifications as read | Yes |
| `GET` | `/api/health` | Deployment uptime & status monitor | **Public** |

---

## 🌐 Production Deployment Guide

### 1. Environment Variables in Production
* Set `NODE_ENV=production` (enables secure cookies and hides stack traces).
* Set `APP_URL=https://your-domain.com` so that QR codes embed the production domain instead of `localhost`.
* Generate a strong `SESSION_SECRET` (e.g., `openssl rand -hex 32`).

### 2. Managed Database (MySQL)
* Provision a managed MySQL database on AWS RDS, PlanetScale, Railway, or DigitalOcean.
* Import `database/schema.sql`.
* Configure `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` in production environment settings.

### 3. Persistent File Storage
* For multi-instance cloud deployments (e.g. AWS ECS, Heroku, Render), mount persistent block storage (such as AWS EFS or Render Persistent Disks) to `backend/uploads/` so user-uploaded pet photographs and medical documents persist across redeployments. Alternatively, configure AWS S3 / Cloudflare R2 in `uploadMiddleware.js`.

### 4. Reverse Proxy & HTTPS
* Deploy behind Nginx or Cloudflare with SSL/TLS termination. Ensure `trust proxy` is enabled in Express if running behind reverse proxies (`app.set('trust proxy', 1)`).

---

## 📜 Academic Integrity & Demonstration Notice

PetCare Passport was designed as a complete, scalable digital pet healthcare solution. Every form, button, and navigation route executes actual parameterized database transactions without mock data or dummy endpoints.
