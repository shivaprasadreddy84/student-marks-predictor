from flask import Blueprint, request, jsonify
from database import get_db_connection

exam_bp = Blueprint("exam", __name__)


# =====================================
# CREATE EXAM
# =====================================
@exam_bp.route("/create", methods=["POST"])
def create_exam():
    data = request.get_json(silent=True) or {}

    exam_name = (data.get("exam_name") or "").strip()
    subject = (data.get("subject") or "").strip()
    department = (data.get("department") or "").strip()
    exam_date = data.get("exam_date") or None
    difficulty = (data.get("difficulty") or "").strip().lower()
    max_marks = data.get("max_marks", 100)

    if not exam_name or not subject or not department or not difficulty:
        return jsonify({
            "message": "Exam name, subject, department, and difficulty are required."
        }), 400

    if difficulty not in ("easy", "medium", "hard"):
        return jsonify({
            "message": "Difficulty must be easy, medium, or hard."
        }), 400

    try:
        max_marks = float(max_marks)

        if max_marks <= 0:
            raise ValueError()

    except (TypeError, ValueError):
        return jsonify({
            "message": "Maximum marks must be a positive number."
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()

        if connection is None:
            raise Exception("Database connection failed.")

        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO exams
                (exam_name, subject, department, exam_date,
                 difficulty, max_marks)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING exam_id
            """,
            (
                exam_name,
                subject,
                department,
                exam_date,
                difficulty,
                max_marks
            )
        )

        exam_id = cursor.fetchone()[0]
        connection.commit()

        return jsonify({
            "message": "Exam created successfully.",
            "exam_id": exam_id
        }), 201

    except Exception as error:
        if connection:
            connection.rollback()

        print("Create exam error:", error)

        return jsonify({
            "message": "Unable to create exam. Check the backend console."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =====================================
# GET ALL EXAMS, INCLUDING DEPARTMENT
# =====================================
@exam_bp.route("/all", methods=["GET"])
def get_all_exams():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()

        if connection is None:
            raise Exception("Database connection failed.")

        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                exam_id,
                exam_name,
                subject,
                exam_date,
                difficulty,
                max_marks,
                department
            FROM exams
            ORDER BY exam_id
            """
        )

        rows = cursor.fetchall()

        exams = []

        for row in rows:
            exams.append({
                "exam_id": row[0],
                "exam_name": row[1],
                "subject": row[2],
                "exam_date": (
                    row[3].isoformat() if row[3] else None
                ),
                "difficulty": row[4],
                "max_marks": float(row[5]) if row[5] is not None else None,
                "department": row[6]
            })

        return jsonify(exams), 200

    except Exception as error:
        print("Get exams error:", error)

        return jsonify({
            "message": "Unable to retrieve exams. Check the backend console."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()