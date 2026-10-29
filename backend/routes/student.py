from flask import Blueprint, request, jsonify
from database import get_db_connection

student_bp = Blueprint("student", __name__)


# =========================
# CREATE STUDENT PROFILE
# =========================

@student_bp.route("/profile", methods=["POST"])
def create_profile():

    data = request.get_json()

    user_id = data.get("user_id")
    department = data.get("department")
    year = data.get("year")
    semester = data.get("semester")
    study_hours = data.get("study_hours")
    attendance = data.get("attendance")

    if not user_id:
        return jsonify({
            "message": "User ID is required"
        }), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:

        cursor.execute(
            "SELECT user_id FROM users WHERE user_id = %s",
            (user_id,)
        )

        if not cursor.fetchone():
            return jsonify({
                "message": "User not found"
            }), 404

        cursor.execute(
            "SELECT student_id FROM students WHERE user_id = %s",
            (user_id,)
        )

        if cursor.fetchone():
            return jsonify({
                "message": "Student profile already exists"
            }), 409

        cursor.execute(
            """
            INSERT INTO students
            (
                user_id,
                department,
                year,
                semester,
                study_hours,
                attendance
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING student_id
            """,
            (
                user_id,
                department,
                year,
                semester,
                study_hours,
                attendance
            )
        )

        student_id = cursor.fetchone()[0]

        conn.commit()

        return jsonify({
            "message": "Student profile created successfully",
            "student_id": student_id
        }), 201

    except Exception as e:

        conn.rollback()

        return jsonify({
            "message": "Failed to create student profile",
            "error": str(e)
        }), 500

    finally:

        cursor.close()
        conn.close()


# =========================
# GET STUDENT PROFILE
# =========================

@student_bp.route("/profile/<int:user_id>", methods=["GET"])
def get_profile(user_id):

    conn = get_db_connection()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT
                s.student_id,
                u.user_id,
                u.full_name,
                u.email,
                u.account_id,
                s.department,
                s.year,
                s.semester,
                s.study_hours,
                s.attendance
            FROM students s
            JOIN users u
                ON s.user_id = u.user_id
            WHERE s.user_id = %s
            """,
            (user_id,)
        )

        student = cursor.fetchone()

        if not student:
            return jsonify({
                "message": "Student profile not found"
            }), 404

        return jsonify({
            "student_id": student[0],
            "user_id": student[1],
            "full_name": student[2],
            "email": student[3],
            "account_id": student[4],
            "department": student[5],
            "year": student[6],
            "semester": student[7],
            "study_hours": float(student[8]) if student[8] is not None else None,
            "attendance": float(student[9]) if student[9] is not None else None
        }), 200

    finally:

        cursor.close()
        conn.close()