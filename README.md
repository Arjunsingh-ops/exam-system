# 🏛️ Apex Exam Sitting Planner

A production-grade, full-stack examination seating and hall planning platform. Built to automate conflict-free student seat distribution, provide real-time seating matrix visualizations, allow planners to create accounts and manage examinations, and produce multi-room A4 print-ready PDF rosters.

[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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
- **Puppeteer Headless Engine**: Produces official university seating plan documents complete with header crests, invigilator signature blocks, summary statistics, and room rosters.
- **Zero-Defect Browser Print**: Dedicated `@media print` rules ensure clean page breaks between halls with zero trailing blank sheets when printing via browser (`Ctrl + P`).

### 🔒 Enterprise Single-Planner Authentication
- **Secure by Design**: Eliminates public signup attack surfaces; access is granted exclusively to the authorized University Examination Controller.
- **Bcrypt & JWT Security**: 10-round salted password hashing with signed JSON Web Tokens (7-day validity).
- **In-App Database Account Management**: Administrators can update their official login email and reset their password directly in the production MySQL database from the sidebar modal.
- **CLI Provisioning Utility**: Seed or reset administrator credentials anytime via terminal or automated CI/CD pipeline.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Framer Motion, Lucide Icons, Axios |
| **Backend** | Node.js, Express.js, Puppeteer (Chromium), Joi, Multer, Morgan |
| **Database** | MySQL 8.0+ (`mysql2/promise` with SSL & connection pooling) |
| **Containerization** | Docker, Docker Compose, Debian Slim + Chromium |
| **Deployment** | Vercel (Frontend), Render / Railway (Backend API), Aiven (Cloud MySQL) |

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

# Local MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=exam_seating_system

# Authentication
JWT_SECRET=super_secret_jwt_key_for_development
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10

# Authorized Exam Planner
ADMIN_EMAIL=controller@apex.edu
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_NAME=Exam Controller
CORS_ORIGIN=*
```

Start the backend server:
```bash
npm run dev
```
> Database schema and the authorized planner account will be automatically created on first boot!

### 3. Configure & Start the Frontend
In a new terminal window:
```bash
# In the repository root
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🌐 Production Cloud Hosting Guide

For complete, detailed instructions, see **[`HOSTING_GUIDE.md`](HOSTING_GUIDE.md)**.

### Architecture Recommendation (100% Free / Low-Cost)
1. **Frontend**: Hosted on **Vercel** as a Vite Single Page Application.
2. **Backend**: Hosted on **Render.com** (or Railway) as a Docker Web Service using the provided `backend/Dockerfile` (includes pre-installed Chromium for Puppeteer).
3. **Database**: Hosted on **Aiven.io** or **Railway.app** (Free Cloud MySQL).

### 1. Cloud Database Connection
In your backend environment variables, provide your cloud database URI:
```env
DATABASE_URL=mysql://user:password@host:port/dbname?ssl={"rejectUnauthorized":false}
```

### 2. Deploying Backend to Render
1. Connect your repository to [Render.com](https://render.com) as a **Web Service**.
2. Set Root Directory to `backend` and Environment to **Docker**.
3. Set environment variables: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

### 3. Deploying Frontend to Vercel
1. Import the repository into [Vercel.com](https://vercel.com).
2. Framework Preset: **Vite** | Root Directory: `./`.
3. Add Environment Variable:
   ```env
   VITE_API_URL=https://your-render-backend.onrender.com/api
   ```
4. Click **Deploy**.

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
* `POST /api/auth/login` — Authenticate planner and receive JWT.
* `GET  /api/auth/me` — Retrieve current authenticated session.
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
