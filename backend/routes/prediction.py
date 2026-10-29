from flask import Blueprint, request, jsonify
from database import get_db_connection

import pickle
import os


prediction_bp = Blueprint("prediction", __name__)


MODEL_FILE = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "ml",
    "marks_prediction_model.pkl"
)


def load_model():
    with open(MODEL_FILE, "rb") as file:
        return pickle.load(file)


# =========================
# CREATE PREDICTION
# =========================

@prediction_bp.route("/predict", methods=["POST"])
def predict_marks():

    data = request.get_json()

    student_id = data.get("student_id")
    exam_id = data.get("exam_id")

    study_time_level = data.get("study_time_level")
    failures = data.get("failures")
    absences = data.get("absences")
    g1_marks = data.get("g1_marks")
    g2_marks = data.get("g2_marks")

    if (
        student_id is None
        or exam_id is None
        or study_time_level is None
        or failures is None
        or absences is None
        or g1_marks is None
        or g2_marks is None
    ):
        return jsonify({
            "message": "All prediction fields are required"
        }), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:

        # Check student
        cursor.execute(
            """
            SELECT student_id
            FROM students
            WHERE student_id = %s
            """,
            (student_id,)
        )

        if not cursor.fetchone():
            return jsonify({
                "message": "Student not found"
            }), 404

        # Get exam information
        cursor.execute(
            """
            SELECT exam_id, difficulty
            FROM exams
            WHERE exam_id = %s
            """,
            (exam_id,)
        )

        exam = cursor.fetchone()

        if not exam:
            return jsonify({
                "message": "Exam not found"
            }), 404

        exam_difficulty = exam[1]

        # Load trained model
        model = load_model()

        # Prepare ML input
        features = [[
            study_time_level,
            failures,
            absences,
            g1_marks,
            g2_marks
        ]]

        # Predict on UCI 0-20 scale
        prediction_20 = model.predict(features)[0]

        prediction_20 = max(0, min(20, float(prediction_20)))

        # Convert 0-20 to 0-100
        prediction_100 = (prediction_20 / 20) * 100

        prediction_100 = round(prediction_100, 2)

        # Performance level based on 100 marks
        if prediction_100 >= 80:
            performance_level = "Excellent"
        elif prediction_100 >= 60:
            performance_level = "Good"
        elif prediction_100 >= 50:
            performance_level = "Average"
        else:
            performance_level = "Needs Improvement"

        # Save prediction
        cursor.execute(
            """
            INSERT INTO predictions
            (
                student_id,
                exam_id,
                previous_marks,
                assessment_marks,
                failures,
                absences,
                study_time_level,
                exam_difficulty,
                predicted_marks,
                performance_level
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING prediction_id
            """,
            (
                student_id,
                exam_id,
                g1_marks,
                g2_marks,
                failures,
                absences,
                study_time_level,
                exam_difficulty,
                prediction_100,
                performance_level
            )
        )

        prediction_id = cursor.fetchone()[0]

        conn.commit()

        return jsonify({
            "message": "Prediction successful",
            "prediction_id": prediction_id,
            "predicted_marks": prediction_100,
            "performance_level": performance_level,
            "exam_difficulty": exam_difficulty
        }), 200

    except Exception as e:

        conn.rollback()

        return jsonify({
            "message": "Prediction failed",
            "error": str(e)
        }), 500

    finally:

        cursor.close()
        conn.close()


# =========================
# GET PREDICTION HISTORY
# =========================

@prediction_bp.route("/student/<int:student_id>", methods=["GET"])
def get_prediction_history(student_id):

    conn = get_db_connection()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT
                p.prediction_id,
                p.exam_id,
                e.exam_name,
                e.subject,
                p.previous_marks,
                p.assessment_marks,
                p.failures,
                p.absences,
                p.study_time_level,
                p.exam_difficulty,
                p.predicted_marks,
                p.performance_level,
                p.created_at
            FROM predictions p
            JOIN exams e
                ON p.exam_id = e.exam_id
            WHERE p.student_id = %s
            ORDER BY p.prediction_id DESC
            """,
            (student_id,)
        )

        records = cursor.fetchall()

        result = []

        for record in records:

            result.append({
                "prediction_id": record[0],
                "exam_id": record[1],
                "exam_name": record[2],
                "subject": record[3],
                "previous_marks": float(record[4]) if record[4] is not None else None,
                "assessment_marks": float(record[5]) if record[5] is not None else None,
                "failures": record[6],
                "absences": record[7],
                "study_time_level": record[8],
                "exam_difficulty": record[9],
                "predicted_marks": float(record[10]) if record[10] is not None else None,
                "performance_level": record[11],
                "created_at": str(record[12])
            })

        return jsonify(result), 200

    finally:

        cursor.close()
        conn.close()