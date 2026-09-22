# 🏛️ Apex Exam Sitting Planner — Backend API

Production REST API and headless PDF generation service for the Apex Exam Sitting Planner platform.

---

## 🛠️ Technology Stack
* **Runtime**: Node.js v18+ / v20 LTS
* **Framework**: Express.js
* **Database**: MySQL 8.0+ (`mysql2/promise` with SSL & connection pool)
* **Document Engine**: Puppeteer (Chromium) for pixel-perfect A4 examination rosters
* **Security**: JWT (`jsonwebtoken`), Bcrypt (`bcryptjs`), CORS
* **Validation**: Joi
* **File Processing**: Multer, CSV-Parser

---

## ⚙️ Environment Variables

Copy `backend/.env.example` to `backend/.env`:

```env
PORT=5000
NODE_ENV=development

# MySQL Database Configuration
# Supports either direct cloud URI or individual host/port parameters
DATABASE_URL=mysql://user:password@host:port/dbname?ssl={"rejectUnauthorized":false}
# Alternatively:
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=exam_seating_system

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Bcrypt Security
BCRYPT_ROUNDS=10

# Authorized Exam Planner / Administrator Account
ADMIN_NAME=Exam Controller
ADMIN_EMAIL=controller@apex.edu
ADMIN_PASSWORD=YourSecurePassword123!

# Cross-Origin Resource Sharing
CORS_ORIGIN=*
```

---

## 🏃 Running Locally

```bash
# Install dependencies
npm install

# Run in development mode (with auto-restart)
npm run dev

# Run in production mode
npm start
```

---

## 👤 Database Administrator CLI Utility

Seed or reset the single authorized administrator in your local or remote cloud MySQL database:

```bash
node scripts/seedAdmin.js <email> <password> [fullName]

# Example:
node scripts/seedAdmin.js controller@apex.edu SuperPass123! "Dr. Jane Doe"

# Or via npm script:
npm run seed:admin controller@apex.edu SuperPass123!
```

---

## 🐳 Docker Deployment

The included `Dockerfile` installs system Chromium and font packages required for headless Puppeteer PDF rendering:

```bash
docker build -t exam-backend .
docker run -p 5000:5000 --env-file .env exam-backend
```

---

## 📡 Core API Endpoints

### 🔐 Auth (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate administrator & get JWT token |
| `GET`  | `/api/auth/me` | Fetch active planner profile |
| `PUT`  | `/api/auth/profile` | Update planner name & email in MySQL database |
| `PUT`  | `/api/auth/change-password` | Update planner password with bcrypt hashing |

### 👨‍🎓 Students (`/api/students`)
| Method | Endpoint | Description |
|---|---|---|
| `GET`    | `/api/students` | List students (search, semester, program filter, pagination) |
| `GET`    | `/api/students/programs` | List unique registered academic programs |
| `POST`   | `/api/students` | Register individual student |
| `PUT`    | `/api/students/:id` | Update student details |
| `DELETE` | `/api/students/:id` | Delete student record |
| `DELETE` | `/api/students/clear` | Batch clear all students |
| `POST`   | `/api/students/upload-csv` | Bulk upload CSV file |

### 🏛️ Rooms (`/api/rooms`)
| Method | Endpoint | Description |
|---|---|---|
| `GET`    | `/api/rooms` | List all examination halls |
| `POST`   | `/api/rooms` | Create room with row/column grid dimensions |
| `PUT`    | `/api/rooms/:id` | Update room capacity & location |
| `DELETE` | `/api/rooms/:id` | Delete room |

### 📝 Exams (`/api/exams`)
| Method | Endpoint | Description |
|---|---|---|
| `GET`    | `/api/exams` | List all scheduled exams |
| `POST`   | `/api/exams` | Schedule examination course |
| `PUT`    | `/api/exams/:id` | Update exam date, time, and shift |
| `DELETE` | `/api/exams/:id` | Delete examination |

### 👨‍🏫 Teachers (`/api/teachers`)
| Method | Endpoint | Description |
|---|---|---|
| `GET`    | `/api/teachers` | List all faculty invigilators |
| `POST`   | `/api/teachers` | Add faculty member |
| `PUT`    | `/api/teachers/:id` | Update teacher details |
| `DELETE` | `/api/teachers/:id` | Delete teacher |

### 🪑 Seating Plan (`/api/seating`)
| Method | Endpoint | Description |
|---|---|---|
| `GET`    | `/api/seating?exam_id=:id` | Fetch seating allocations and room grids |
| `POST`   | `/api/seating/generate` | Generate conflict-free seating plan |
| `GET`    | `/api/seating/pdf?exam_id=:id` | Download official multi-room PDF document |
| `DELETE` | `/api/seating?exam_id=:id` | Delete allocation records for an exam |
