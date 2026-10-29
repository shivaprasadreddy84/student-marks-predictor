from flask import Blueprint, jsonify
from database import get_db_connection

admin_bp = Blueprint("admin", __name__)


# =========================
# GET ALL STUDENTS
# =========================

@admin_bp.route("/students", methods=["GET"])
def get_all_students():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT
                s.student_id,
                u.account_id,
                u.full_name,
                u.email,
                s.department,
                s.year,
                s.semester,
                s.study_hours,
                s.attendance
            FROM students s
            JOIN users u ON s.user_id = u.user_id
            ORDER BY s.student_id
        """)

        rows = cursor.fetchall()

        students = [{
            "student_id": row[0],
            "account_id": row[1],
            "full_name": row[2],
            "email": row[3],
            "department": row[4],
            "year": row[5],
            "semester": row[6],
            "study_hours": float(row[7]) if row[7] is not None else None,
            "attendance": float(row[8]) if row[8] is not None else None
        } for row in rows]

        return jsonify(students), 200

    finally:
        cursor.close()
        conn.close()


# =========================
# GET ALL PERFORMANCE
# =========================

@admin_bp.route("/performance", methods=["GET"])
def get_all_performance():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT
                p.performance_id,
                u.account_id,
                u.full_name,
                e.exam_name,
                e.subject,
                p.assignment1_marks,
                p.assignment2_marks,
                p.actual_marks,
                p.final_marks,
                p.attendance,
                p.study_hours
            FROM performance_records p
            JOIN students s
                ON p.student_id = s.student_id
            JOIN users u
                ON s.user_id = u.user_id
            JOIN exams e
                ON p.exam_id = e.exam_id
            ORDER BY p.performance_id DESC
        """)

        rows = cursor.fetchall()
        performance = []

        for row in rows:
            assignment1 = (
                float(row[5]) if row[5] is not None else None
            )
            assignment2 = (
                float(row[6]) if row[6] is not None else None
            )
            external = (
                float(row[7]) if row[7] is not None else None
            )

            # Calculate scaled external marks out of 60.
            external_scaled = (
                round(external * 0.6, 2)
                if external is not None else None
            )

            # Calculate final marks only when all three marks exist.
            if (
                assignment1 is not None
                and assignment2 is not None
                and external is not None
            ):
                calculated_final = round(
                    assignment1 + assignment2 + external * 0.6, 2
                )
            else:
                calculated_final = None

            # Prefer the saved final marks, if available.
            saved_final = (
                float(row[8]) if row[8] is not None else None
            )
            final = (
                saved_final
                if saved_final is not None
                else calculated_final
            )

            performance.append({
                "performance_id": row[0],
                "account_id": row[1],
                "student_name": row[2],
                "exam_name": row[3],
                "subject": row[4],
                "assignment1_marks": assignment1,
                "assignment2_marks": assignment2,
                "actual_marks": external,
                "external_scaled": external_scaled,
                "final_marks": final,
                "attendance": (
                    float(row[9]) if row[9] is not None else None
                ),
                "study_hours": (
                    float(row[10]) if row[10] is not None else None
                )
            })

        return jsonify(performance), 200

    finally:
        cursor.close()
        conn.close()


# =========================
# GET ALL PREDICTIONS
# =========================

@admin_bp.route("/predictions", methods=["GET"])
def get_all_predictions():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT
                p.prediction_id,
                u.account_id,
                u.full_name,
                e.exam_name,
                e.subject,
                p.predicted_marks,
                p.performance_level,
                p.exam_difficulty,
                p.created_at
            FROM predictions p
            JOIN students s ON p.student_id = s.student_id
            JOIN users u ON s.user_id = u.user_id
            JOIN exams e ON p.exam_id = e.exam_id
            ORDER BY p.prediction_id DESC
        """)

        rows = cursor.fetchall()

        predictions = [{
            "prediction_id": row[0],
            "account_id": row[1],
            "student_name": row[2],
            "exam_name": row[3],
            "subject": row[4],
            "predicted_marks": (
                float(row[5]) if row[5] is not None else None
            ),
            "performance_level": row[6],
            "exam_difficulty": row[7],
            "created_at": str(row[8]) if row[8] is not None else None
        } for row in rows]

        return jsonify(predictions), 200

    finally:
        cursor.close()
        conn.close()


# =========================
# DASHBOARD STATISTICS
# =========================

@admin_bp.route("/statistics", methods=["GET"])
def get_statistics():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT COUNT(*) FROM users WHERE role = 'student'"
        )
        total_students = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM exams")
        total_exams = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM predictions")
        total_predictions = cursor.fetchone()[0]

        cursor.execute("""
            SELECT AVG(predicted_marks)
            FROM predictions
        """)
        average_prediction = cursor.fetchone()[0]

        return jsonify({
            "total_students": total_students,
            "total_exams": total_exams,
            "total_predictions": total_predictions,
            "average_prediction": (
                round(float(average_prediction), 2)
                if average_prediction is not None else 0
            )
        }), 200

    finally:
        cursor.close()
        conn.close()