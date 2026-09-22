# 🏛️ Apex Exam Sitting Planner

A production-grade, full-stack examination seating and hall planning platform. Built to automate conflict-free student seat distribution, provide real-time seating matrix visualizations, allow planners to register their ID and manage examinations, and produce multi-room A4 print-ready PDF rosters.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-success?style=for-the-badge&logo=vercel)](https://exam-system-gamma-smoky.vercel.app/login)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

> 🚀 **Live Production Deployment**:  
> **Web Portal**: [https://exam-system-gamma-smoky.vercel.app/login](https://exam-system-gamma-smoky.vercel.app/login)  
> Anyone can register an account at **`/register`** to plan examination halls and generate seating arrangements!

---

## 🌟 Key Capabilities & System Features

### 🏛️ Executive Academic UI/UX
- **Modern Academic Theme**: Clean, responsive layout with custom typography (`Outfit` & `Inter`), curated dark glassmorphism, fluid micro-animations, and full desktop & mobile compatibility.
- **Executive Dashboard**: Real-time KPIs for total registered students, active examination halls, scheduled examinations, invigilators on duty, and allocation progress.
- **Dual Matrix & Roster Seating Views**: Live visual classroom grid preview with color-coded program badges alongside searchable, printable tabular rosters.

### 🧠 Anti-Conflict Seating Engine
- **Cyclic Column-Based Interleaving**: Automatically interleaves students enrolled in differing courses across hall columns ($R_x - C_y$) to prevent adjacent student academic conflicts.
- **Pre-Execution Capacity Validation**: Calculates total available capacity across selected examination halls and warns planners before allocation if capacity is exceeded.
- **Atomic Database Transactions**: Generation runs inside ACID-compliant MySQL transactions with auto-rollback on conflict or failure.

### 📄 Multi-Room A4 PDF Export & Browser Print
- **Puppeteer Headless Engine**: Produces official examination seating plan documents complete with header crests, invigilator signature blocks, summary statistics, and room rosters.
- **Zero-Defect Browser Print**: Dedicated `@media print` rules ensure clean page breaks between halls with zero trailing blank sheets when printing via browser (`Ctrl + P`).

### 🔒 User Registration & Database Security
- **Self-Service Planner ID Creation**: Planners and faculty can create an account directly at [`/register`](https://exam-system-gamma-smoky.vercel.app/register) with instant cloud database sync.
- **Bcrypt & JWT Security**: 10-round salted password hashing with signed JSON Web Tokens (7-day validity).
- **In-App Account & Password Management**: Users can update their name, email, and password directly in the production MySQL database from the sidebar modal.
- **Dual Route Compatibility**: API routes are mapped to both `/api/*` and `/*` to prevent path mismatch errors across different hosting setups.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Framer Motion, Lucide Icons, Axios |
| **Backend** | Node.js, Express.js, Puppeteer (Chromium), Joi, Multer, Morgan |
| **Database** | MySQL 8.0+ (`mysql2/promise` with SSL & connection pooling) |
| **Containerization** | Docker, Docker Compose, Debian Bookworm + Chromium |
| **Live Hosting** | Frontend on **Vercel**, Backend on **Render (Docker)**, Database on **Aiven Cloud MySQL** |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
* [Node.js](https://nodejs.org/) v18+
* [MySQL](https://www.mysql.com/) v8.0+

### 1. Clone the Repository
```bash
git clone https://github.com/Arjunsingh-ops/exam-system.git
cd exam-system
```

### 2. Configure & Start the Backend
```bash
cd backend
npm install
```

Create `backend/.env` (or copy from `backend/.env.example`):
```env
PORT=5000
NODE_ENV=development

# MySQL Database (Supports cloud URI or individual parameters)
DATABASE_URL=mysql://user:password@host:port/dbname?ssl={"rejectUnauthorized":false}

# Authentication
JWT_SECRET=super_secret_jwt_key_for_development
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10

# Authorized Initial Planner
ADMIN_EMAIL=controller@apex.edu
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_NAME=Exam Controller
CORS_ORIGIN=*
```

Start the backend server:
```bash
npm run dev
```

### 3. Configure & Start the Frontend
In a new terminal window:
```bash
# In the repository root
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🌐 Production Cloud Hosting Setup

### 1. Live Deployment Architecture
* **Frontend**: Hosted on [Vercel](https://exam-system-gamma-smoky.vercel.app/login).
* **Backend API**: Hosted on **Render.com** using the `backend/Dockerfile` with Debian Bookworm and headless Chromium.
* **Database**: Hosted on **Aiven Cloud MySQL** with SSL/TLS encryption.

### 2. Environment Variables Configuration

#### Backend (Render / VPS):
| Key | Example Value | Description |
|---|---|---|
| `PORT` | `5000` | Server listening port |
| `NODE_ENV` | `production` | Production mode |
| `DATABASE_URL` | `mysql://avnadmin:pass@host:port/defaultdb` | Cloud MySQL URI |
| `JWT_SECRET` | `apex_exam_planner_super_secret_jwt_key` | Secret key for signing JWTs |
| `CORS_ORIGIN` | `https://exam-system-gamma-smoky.vercel.app` | Allowed frontend origin |
| `ADMIN_EMAIL` | `controller@apex.edu` | Initial admin account |
| `ADMIN_PASSWORD` | `AdminPassword123!` | Initial admin password |

#### Frontend (Vercel):
| Key | Example Value | Description |
|---|---|---|
| `VITE_API_URL` | `https://apex-exam-backend.onrender.com/api` | Backend API URL |

---

## 🐳 Self-Hosted Deployment (Docker Compose)

Deploy the entire stack (MySQL 8.0 + Backend API + Headless Chromium) on any Linux VPS with a single command:

```bash
docker compose up -d --build
```
Verify backend health:
```bash
curl http://localhost:5000/api/health
```

---

## 🔑 CLI Administrator Provisioning

Provision or reset administrator credentials in any local or remote database:
```bash
cd backend
node scripts/seedAdmin.js controller@apex.edu NewPassword123! "Dr. Jane Doe"
# Or with npm:
npm run seed:admin controller@apex.edu NewPassword123!
```

---

## 📡 API Reference Summary

### Authentication & Account
* `POST /api/auth/register` — Create a new planner ID.
* `POST /api/auth/login` — Authenticate and receive JWT.
* `GET  /api/auth/me` — Retrieve active session profile.
* `PUT  /api/auth/profile` — Update planner name and email in MySQL database.
* `PUT  /api/auth/change-password` — Change password with bcrypt hashing.

### Examinations & Halls
* `GET, POST, PUT, DELETE /api/rooms` — Examination hall CRUD with row/column grid capacities.
* `GET, POST, PUT, DELETE /api/exams` — Exam schedules, shifts, and course mappings.
* `GET, POST, PUT, DELETE /api/teachers` — Faculty invigilator duties.
* `GET, POST, PUT, DELETE /api/students` — Student registry and batch CSV import.
* `POST /api/students/upload-csv` — Bulk upload student enrollments.

### Seating Plan Engine
* `GET  /api/seating?exam_id=:id` — Fetch complete hall allocations and matrices.
* `POST /api/seating/generate` — Generate conflict-free seating plan.
* `GET  /api/seating/pdf?exam_id=:id` — Download official multi-room PDF document.
* `DELETE /api/seating?exam_id=:id` — Clear allocations for an exam.

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
