
from flask import Flask, render_template, request, redirect, session
import mysql.connector

app = Flask(__name__)
app.secret_key = "exam_secret_key"

db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Arjunsingh20@",
    database="exam_system"
)
cursor = db.cursor(dictionary=True)
@app.route("/", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form["email"]
        password = request.form["password"]

        print(email, password)   # DEBUG

        cursor.execute("SELECT * FROM users WHERE email=%s AND password=%s",(email,password))
        user = cursor.fetchone()

        print(user)  # DEBUG

        if user:
            session["user"] = user["name"]
            return redirect("/dashboard")

    return render_template("login.html")

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/students", methods=["GET","POST"])
def students():
    if request.method == "POST":
        cursor.execute("INSERT INTO students (roll_no,name,branch,semester,section) VALUES (%s,%s,%s,%s,%s)",
                       (request.form["roll"],request.form["name"],request.form["branch"],request.form["semester"],request.form["section"]))
        db.commit()
    cursor.execute("SELECT * FROM students ORDER BY roll_no")
    data = cursor.fetchall()
    return render_template("students.html", students=data)

@app.route("/rooms", methods=["GET","POST"])
def rooms():
    if request.method == "POST":
        cursor.execute("INSERT INTO rooms (room_no,capacity,building) VALUES (%s,%s,%s)",
                       (request.form["room"],request.form["capacity"],request.form["building"]))
        db.commit()
    cursor.execute("SELECT * FROM rooms")
    data = cursor.fetchall()
    return render_template("rooms.html", rooms=data)

@app.route("/generate_seating")
def generate_seating():
    cursor.execute("SELECT * FROM students ORDER BY roll_no")
    students = cursor.fetchall()
    cursor.execute("SELECT * FROM rooms")
    rooms = cursor.fetchall()

    student_index = 0
    for room in rooms:
        for i in range(room["capacity"]):
            if student_index < len(students):
                cursor.execute("INSERT INTO seating_allocation (exam_id,student_id,room_id) VALUES (1,%s,%s)",
                               (students[student_index]["id"], room["id"]))
                student_index += 1
    db.commit()
    return redirect("/dashboard")

if __name__ == "__main__":
    app.run(debug=True)
