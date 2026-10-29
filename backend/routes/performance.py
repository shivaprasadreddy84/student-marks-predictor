
from flask import Blueprint, request, jsonify
from database import get_db_connection

performance_bp = Blueprint("performance", __name__)


# =====================================
# HELPER FUNCTIONS
# =====================================

def close_database(conn, cursor):
    if cursor:
        cursor.close()
    if conn:
        conn.close()


def number_or_none(value):
    return float(value) if value is not None else None


def parse_number(value, field, maximum=None):
    if value is None or value == "":
        return None

    number = float(value)

    if number < 0:
        raise ValueError(f"{field} cannot be negative")

    if maximum is not None and number > maximum:
        raise ValueError(f"{field} cannot exceed {maximum}")

    return number


def calculate_final_marks(assignment1, assignment2, external):
    # Do not calculate a final score if any marks are missing.
    if assignment1 is None or assignment2 is None or external is None:
        return None

    external_scaled = external * 0.6
    return round(assignment1 + assignment2 + external_scaled, 2)


def parse_performance_fields(data):
    return {
        "previous_marks": parse_number(
            data.get("previous_marks"), "Previous marks", 100
        ),
        "assignment1_marks": parse_number(
            data.get("assignment1_marks"), "Assignment 1 marks", 20
        ),
        "assignment2_marks": parse_number(
            data.get("assignment2_marks"), "Assignment 2 marks", 20
        ),
        "actual_marks": parse_number(
            data.get("actual_marks"), "External marks", 100
        ),
        "attendance": parse_number(
            data.get("attendance"), "Attendance", 100
        ),
        "study_hours": parse_number(
            data.get("study_hours"), "Study hours", 168
        ),
    }


# =====================================
# GET STUDENTS BY DEPARTMENT
# =====================================

@performance_bp.route("/department-students", methods=["GET"])
def get_department_students():
    department = (request.args.get("department") or "").strip()

    if not department:
        return jsonify({"message": "Department is required"}), 400

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT
                s.student_id,
                s.user_id,
                u.full_name,
                u.email,
                s.department
            FROM students s
            JOIN users u ON u.user_id = s.user_id
            WHERE LOWER(TRIM(s.department)) = LOWER(TRIM(%s))
            ORDER BY u.full_name
            """,
            (department,)
        )

        rows = cursor.fetchall()

        return jsonify([
            {
                "student_id": row[0],
                "user_id": row[1],
                "full_name": row[2],
                "email": row[3],
                "department": row[4]
            }
            for row in rows
        ]), 200

    except Exception as error:
        print("Get department students error:", error)
        return jsonify({"message": "Unable to retrieve students"}), 500

    finally:
        close_database(conn, cursor)


# =====================================
# SAVE OR UPDATE ONE PERFORMANCE RECORD
# =====================================

@performance_bp.route("/create", methods=["POST"])
def create_performance():
    data = request.get_json(silent=True) or {}

    try:
        student_id = int(data.get("student_id"))
        exam_id = int(data.get("exam_id"))

        if student_id <= 0 or exam_id <= 0:
            raise ValueError("Invalid student or exam ID")

        fields = parse_performance_fields(data)

    except (ValueError, TypeError) as error:
        return jsonify({"message": str(error) or "Invalid input values"}), 400

    final_marks = calculate_final_marks(
        fields["assignment1_marks"],
        fields["assignment2_marks"],
        fields["actual_marks"]
    )

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT student_id FROM students WHERE student_id = %s",
            (student_id,)
        )
        if not cursor.fetchone():
            return jsonify({"message": "Student not found"}), 404

        cursor.execute(
            "SELECT exam_id FROM exams WHERE exam_id = %s",
            (exam_id,)
        )
        if not cursor.fetchone():
            return jsonify({"message": "Exam not found"}), 404

        cursor.execute(
            """
            SELECT performance_id
            FROM performance_records
            WHERE student_id = %s AND exam_id = %s
            ORDER BY performance_id DESC
            LIMIT 1
            """,
            (student_id, exam_id)
        )
        existing = cursor.fetchone()

        values = (
            fields["previous_marks"],
            fields["assignment1_marks"],
            fields["assignment2_marks"],
            fields["actual_marks"],
            final_marks,
            fields["attendance"],
            fields["study_hours"]
        )

        if existing:
            performance_id = existing[0]

            cursor.execute(
                """
                UPDATE performance_records
                SET previous_marks = %s,
                    assignment1_marks = %s,
                    assignment2_marks = %s,
                    actual_marks = %s,
                    final_marks = %s,
                    attendance = %s,
                    study_hours = %s
                WHERE performance_id = %s
                """,
                values + (performance_id,)
            )
            message = "Performance record updated successfully"

        else:
            cursor.execute(
                """
                INSERT INTO performance_records
                (
                    student_id, exam_id, previous_marks,
                    assignment1_marks, assignment2_marks,
                    actual_marks, final_marks, attendance, study_hours
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING performance_id
                """,
                (student_id, exam_id) + values
            )
            performance_id = cursor.fetchone()[0]
            message = "Performance record created successfully"

        conn.commit()

        return jsonify({
            "message": message,
            "performance_id": performance_id,
            "final_marks": final_marks
        }), 200

    except Exception as error:
        if conn:
            conn.rollback()

        print("Save performance error:", error)
        return jsonify({"message": "Failed to save performance record"}), 500

    finally:
        close_database(conn, cursor)


# =====================================
# SAVE PERFORMANCE FOR MULTIPLE STUDENTS
# =====================================

@performance_bp.route("/bulk-save", methods=["POST"])
def bulk_save_performance():
    data = request.get_json(silent=True) or {}

    try:
        exam_id = int(data.get("exam_id"))
        records = data.get("records")

        if exam_id <= 0:
            raise ValueError("Invalid exam ID")

        if not isinstance(records, list) or not records:
            return jsonify({
                "message": "Exam ID and at least one student record are required"
            }), 400

        if len(records) > 500:
            return jsonify({
                "message": "Save at most 500 student records at a time"
            }), 400

        validated_records = []

        for item in records:
            if not isinstance(item, dict):
                raise ValueError("Invalid student record")

            student_id = int(item.get("student_id"))

            if student_id <= 0:
                raise ValueError("Invalid student ID")

            fields = parse_performance_fields(item)

            validated_records.append({
                "student_id": student_id,
                **fields
            })

    except (ValueError, TypeError) as error:
        return jsonify({
            "message": str(error) or "Invalid performance values"
        }), 400

    student_ids = [record["student_id"] for record in validated_records]

    if len(student_ids) != len(set(student_ids)):
        return jsonify({"message": "Duplicate student IDs were provided"}), 400

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT exam_id FROM exams WHERE exam_id = %s",
            (exam_id,)
        )

        if not cursor.fetchone():
            return jsonify({"message": "Exam not found"}), 404

        cursor.execute(
            """
            SELECT student_id
            FROM students
            WHERE student_id = ANY(%s)
            """,
            (student_ids,)
        )

        existing_ids = {row[0] for row in cursor.fetchall()}

        if existing_ids != set(student_ids):
            return jsonify({
                "message": "One or more students were not found"
            }), 404

        saved_count = 0

        for record in validated_records:
            student_id = record["student_id"]

            final_marks = calculate_final_marks(
                record["assignment1_marks"],
                record["assignment2_marks"],
                record["actual_marks"]
            )

            values = (
                record["previous_marks"],
                record["assignment1_marks"],
                record["assignment2_marks"],
                record["actual_marks"],
                final_marks,
                record["attendance"],
                record["study_hours"]
            )

            cursor.execute(
                """
                SELECT performance_id
                FROM performance_records
                WHERE student_id = %s AND exam_id = %s
                ORDER BY performance_id DESC
                LIMIT 1
                """,
                (student_id, exam_id)
            )

            existing = cursor.fetchone()

            if existing:
                cursor.execute(
                    """
                    UPDATE performance_records
                    SET previous_marks = %s,
                        assignment1_marks = %s,
                        assignment2_marks = %s,
                        actual_marks = %s,
                        final_marks = %s,
                        attendance = %s,
                        study_hours = %s
                    WHERE performance_id = %s
                    """,
                    values + (existing[0],)
                )
            else:
                cursor.execute(
                    """
                    INSERT INTO performance_records
                    (
                        student_id, exam_id, previous_marks,
                        assignment1_marks, assignment2_marks,
                        actual_marks, final_marks, attendance, study_hours
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (student_id, exam_id) + values
                )

            saved_count += 1

        conn.commit()

        return jsonify({
            "message": "Student performance saved successfully",
            "saved_count": saved_count
        }), 200

    except Exception as error:
        if conn:
            conn.rollback()

        print("Bulk performance save error:", error)
        return jsonify({
            "message": "Failed to save student performance"
        }), 500

    finally:
        close_database(conn, cursor)


# =====================================
# GET STUDENT PERFORMANCE
# =====================================

@performance_bp.route("/student/<int:student_id>", methods=["GET"])
def get_student_performance(student_id):
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT
                p.performance_id,
                p.student_id,
                p.exam_id,
                e.exam_name,
                e.subject,
                e.difficulty,
                p.previous_marks,
                p.assignment1_marks,
                p.assignment2_marks,
                p.actual_marks,
                p.final_marks,
                p.attendance,
                p.study_hours,
                p.recorded_at
            FROM performance_records p
            JOIN exams e ON p.exam_id = e.exam_id
            WHERE p.student_id = %s
            ORDER BY p.performance_id DESC
            """,
            (student_id,)
        )

        rows = cursor.fetchall()
        result = []

        for row in rows:
            result.append({
                "performance_id": row[0],
                "student_id": row[1],
                "exam_id": row[2],
                "exam_name": row[3],
                "subject": row[4],
                "difficulty": row[5],
                "previous_marks": number_or_none(row[6]),
                "assignment1_marks": number_or_none(row[7]),
                "assignment2_marks": number_or_none(row[8]),
                "actual_marks": number_or_none(row[9]),
                "final_marks": number_or_none(row[10]),
                "attendance": number_or_none(row[11]),
                "study_hours": number_or_none(row[12]),
                "recorded_at": row[13].isoformat() if row[13] else None
            })

        return jsonify(result), 200

    except Exception as error:
        print("Get student performance error:", error)
        return jsonify({
            "message": "Unable to retrieve student performance"
        }), 500

    finally:
        close_database(conn, cursor)
