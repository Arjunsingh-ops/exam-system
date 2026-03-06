
# 🎓 ExamPro Plus - Modern Exam Management System

ExamPro Plus is a sleek, modern, and attractive web-based Exam Management System built with Python, Flask, and MySQL. It features a premium "glassmorphism" UI with deep gradient backgrounds and smooth micro-animations.

## ✨ Features

- **Modern Glassmorphism UI:** A visually stunning interface with frosted glass effects, modern typography (Outfit font), and deep gradient backgrounds.
- **Responsive Layout:** Includes a fixed sidebar navigation and a fully responsive card-based layout.
- **Admin Dashboard:** An overview displaying quick actions and metrics.
- **Student Management:** Add and view students with full details (Roll No, Name, Branch, Semester, Section).
- **Room Management:** Manage examination rooms, defining their capacity and building location.
- **Automated Seating Allocation:** A one-click feature to instantly allocate registered students to available rooms based on room capacities.

## 🛠️ Technology Stack

- **Backend:** Python 3.x, Flask
- **Database:** MySQL
- **Frontend:** HTML5, CSS3 (Custom Design System), Jinja2 Templating
- **Fonts & Icons:** Google Fonts (Outfit), FontAwesome 6

## 🚀 Installation & Setup

### 1. Prerequisites
- Python 3.7+ installed.
- MySQL Server installed and running locally.

### 2. Install Dependencies
Install the required Python packages using pip:
```bash
pip install -r requirements.txt
```
*(Make sure `Flask` and `mysql-connector-python` are in your `requirements.txt`)*

### 3. Database Setup
Create the MySQL database and tables required for the application. Run the following queries in your MySQL client:

```sql
CREATE DATABASE IF NOT EXISTS exam_system;
USE exam_system;

-- Create Users Table (for login)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- Insert a default admin user
INSERT INTO users (name, email, password) VALUES ('Admin', 'admin@example.com', 'password');

-- Create Students Table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roll_no VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    branch VARCHAR(50) NOT NULL,
    semester INT NOT NULL,
    section VARCHAR(10) NOT NULL
);

-- Create Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_no VARCHAR(50) NOT NULL UNIQUE,
    capacity INT NOT NULL,
    building VARCHAR(100) NOT NULL
);

-- Create Seating Allocation Table
CREATE TABLE IF NOT EXISTS seating_allocation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    student_id INT NOT NULL,
    room_id INT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);
```

*Note: Update the database credentials in `app.py` if your local MySQL username/password is different from the default (root / Arjunsingh20@).*

### 4. Run the Application
Start the Flask development server:
```bash
python app.py
```

### 5. Access the System
Open your web browser and navigate to:
```
http://127.0.0.1:5000
```
Login with the credentials you inserted in the database (e.g., `admin@example.com` / `password`).

---
*Styled with ❤️ using CSS variables and modern web aesthetics.*
