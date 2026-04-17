# Exam Seating Management System — Backend

## Tech Stack
- **Node.js** + **Express.js**
- **MySQL** (mysql2/promise)
- **Puppeteer** (PDF generation)
- **JWT** (authentication)
- **Joi** (validation)
- **Morgan** (logging)
- **Multer** (CSV upload)

## Setup

### 1. Configure environment variables
Edit `backend/.env`:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=exam_seating_system
JWT_SECRET=your_secret
```

### 2. Install dependencies
```bash
cd backend
npm install
```

### 3. Start the server
```bash
npm run dev     # development (nodemon)
npm start       # production
```
The database schema is **auto-created** on first startup.

---

## Default Admin Credentials
| Email | Password |
|---|---|
| admin@exam.edu | password |

> ⚠️ Change the password immediately after first login.

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET  | `/api/auth/me` | Get current user |

### Students
| Method | Endpoint | Description |
|---|---|---|
| GET    | `/api/students` | List all (paginated, filterable) |
| GET    | `/api/students/:id` | Get by ID |
| POST   | `/api/students` | Create student |
| PUT    | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Delete student |
| POST   | `/api/students/upload/csv` | Bulk upload via CSV |
| GET    | `/api/students/departments` | Get unique departments |

### Rooms
| Method | Endpoint | Description |
|---|---|---|
| GET    | `/api/rooms` | List all rooms |
| GET    | `/api/rooms/:id` | Get by ID |
| POST   | `/api/rooms` | Create room |
| PUT    | `/api/rooms/:id` | Update room |
| DELETE | `/api/rooms/:id` | Delete room |

### Exams
| Method | Endpoint | Description |
|---|---|---|
| GET    | `/api/exams` | List all exams |
| GET    | `/api/exams/:id` | Get by ID |
| POST   | `/api/exams` | Create exam |
| PUT    | `/api/exams/:id` | Update exam |
| DELETE | `/api/exams/:id` | Delete exam |

### Seating
| Method | Endpoint | Description |
|---|---|---|
| GET    | `/api/seating` | Get seating (filter: exam_id, date, shift) |
| POST   | `/api/seating/generate` | Generate seating plan |
| GET    | `/api/seating/pdf` | Download PDF (filter: exam_id, date, shift) |
| GET    | `/api/seating/student/:id` | Get student's seating |
| DELETE | `/api/seating/:id` | Delete a seat record |

---

## Seating Algorithm
1. Students are grouped by **department**
2. Departments are **interleaved** cyclically so no two students from the same department sit adjacent
3. Rooms are filled sequentially respecting **capacity**
4. Seat format: `R{row}-C{col}` (e.g., `R1-C3`)
5. Unique constraint prevents **duplicate seat** assignments per exam+room

## CSV Upload Format
See `sample_students.csv` for column reference:
```
name, roll_no, enrollment_no, department, program, specialization,
year, semester, section, email, contact, exam_type
```
