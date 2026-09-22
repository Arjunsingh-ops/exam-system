# 🚀 Apex University Exam Seating System - Production Hosting & Deployment Guide

This guide provides step-by-step instructions to host the Exam Seating Management System in production with a live database, secure administrator authentication, and automated PDF export.

---

## 🏗️ Architecture Overview

The system consists of three production components:
1. **Frontend**: React + Vite SPA (Vercel, Netlify, Cloudflare Pages, or Render Static).
2. **Backend**: Node.js + Express API + Puppeteer PDF generator (Render, Railway, Fly.io, or VPS Docker).
3. **Database**: MySQL 8.0+ (Aiven, Railway, PlanetScale, Supabase, TiDB Cloud, or Self-hosted).

---

## 🗄️ Step 1: Provision a Cloud MySQL Database

You can use any cloud MySQL provider. Here are recommended options:

### Option A: Aiven (Free Tier)
1. Sign up at [aiven.io](https://aiven.io).
2. Create a **Free MySQL** service.
3. Copy the **Service URI** (e.g., `mysql://avnadmin:password@host:port/defaultdb?ssl-mode=REQUIRED`).
4. In your backend environment variables, set:
   ```env
   DATABASE_URL=mysql://avnadmin:password@host:port/defaultdb?ssl={"rejectUnauthorized":false}
   ```

### Option B: Railway MySQL
1. Sign up at [railway.app](https://railway.app).
2. Click **New Project** → **Provision MySQL**.
3. Under the database **Variables** tab, copy `MYSQL_URL`.
4. In your backend environment variables, set:
   ```env
   DATABASE_URL=${{MYSQL_URL}}
   ```

### Option C: TiDB Cloud / PlanetScale / Self-Hosted MySQL
- Provide standard MySQL credentials: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

---

## 🖥️ Step 2: Deploy the Backend API

Because the backend generates pixel-perfect multi-room A4 seating plan PDFs using Puppeteer (Chromium), deploying using the included **`backend/Dockerfile`** ensures all required Linux rendering libraries are pre-installed.

### Recommended: Render.com (Web Service)
1. Push your repository to GitHub / GitLab.
2. Log in to [render.com](https://render.com) and click **New** → **Web Service**.
3. Connect your repository.
4. Set the following configuration:
   - **Root Directory**: `backend`
   - **Environment**: `Docker` (Render will automatically detect `backend/Dockerfile`)
   - **Instance Type**: Starter or Free
5. Under **Environment Variables**, add:
   | Key | Value | Description |
   |-----|-------|-------------|
   | `PORT` | `5000` | Port for the backend |
   | `NODE_ENV` | `production` | Production environment |
   | `DATABASE_URL` | *Your cloud MySQL URI* | Cloud database connection string |
   | `JWT_SECRET` | *32+ character random secret* | Used for cryptographic JWT signing |
   | `CORS_ORIGIN` | `https://your-frontend-app.vercel.app` | URL of your deployed frontend |
   | `ADMIN_EMAIL` | `controller@apex.edu` | Initial admin login email |
   | `ADMIN_PASSWORD` | `YourSecurePassword123!` | Initial admin login password |
   | `ADMIN_NAME` | `Exam Controller` | Display name for the administrator |
6. Click **Deploy Web Service**.
7. Note down your backend URL (e.g., `https://exam-backend.onrender.com`).

---

## 🌐 Step 3: Deploy the Frontend (Vercel or Netlify)

### Recommended: Vercel
1. Log in to [vercel.com](https://vercel.com) and click **Add New Project**.
2. Import your GitHub repository.
3. Configure build settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (workspace root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add the **Environment Variable**:
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://exam-backend.onrender.com/api` |
5. Click **Deploy**.
6. Vercel will build and assign you an HTTPS URL (e.g., `https://apex-exam-system.vercel.app`).
7. Update `CORS_ORIGIN` on your Render backend to match your Vercel URL.

---

## 🔐 Step 4: Administrator Database Login & Management

### Initial Login
1. Open your live frontend URL.
2. The login screen is completely free of demo credentials.
3. Enter the email and password you configured in `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
4. Click **Sign In as Exam Planner**.

### Managing Credentials directly in the Database
- Once logged in, click the **Security** button in the bottom-left profile card of the sidebar.
- In the **Administrator Database Account** modal:
  - **Profile Details**: Update your name and email stored in the MySQL `users` table.
  - **Change Password**: Provide your current password and set a new password. It will be re-hashed using 10 bcrypt rounds directly into the database.

### CLI Admin Provisioning / Password Reset
If you ever lose access to your database admin password or want to reset it directly from the terminal or CI/CD:
```bash
cd backend
node scripts/seedAdmin.js controller@apex.edu NewStrongPassword123! "Controller Name"
```
Or with `npm`:
```bash
npm run seed:admin controller@apex.edu NewStrongPassword123!
```

---

## 🐳 Step 5 (Alternative): Self-Hosted One-Click Docker Setup

If you have a Linux VPS (Ubuntu, Debian, CentOS on AWS, DigitalOcean, or Hetzner):
1. Clone the repository onto your server:
   ```bash
   git clone <your-repo-url>
   cd "exam system"
   ```
2. Create and edit your environment variables in `docker-compose.yml` or `.env`.
3. Launch MySQL, Backend, and Chromium:
   ```bash
   docker compose up -d --build
   ```
4. Verify backend health:
   ```bash
   curl http://localhost:5000/api/health
   ```

---

## 🛡️ Production Security Checklist

- [x] **No hardcoded demo passwords**: Form inputs start empty with clear placeholders.
- [x] **Bcrypt Password Encryption**: All admin passwords are salted and hashed with 10 rounds.
- [x] **JWT Token Expiration**: Sessions expire in 7 days or upon signing out.
- [x] **CORS Protection**: Restricted to trusted frontend domain via `CORS_ORIGIN`.
- [x] **Single-Admin Database Policy**: Multi-account takeover attacks are prevented by database constraints and automated enforcement.
- [x] **SQL Injection Defense**: All database queries use parameterized SQL prepared statements.
- [x] **Centralized Error Masking**: Database schema and internal stack traces are hidden from API responses in production mode.
