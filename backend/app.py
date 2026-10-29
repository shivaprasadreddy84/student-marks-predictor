import os
from flask import Flask, jsonify, send_from_directory

from database import get_db_connection

from routes.auth import auth_bp
from routes.student import student_bp
from routes.exam import exam_bp
from routes.performance import performance_bp
from routes.prediction import prediction_bp
from routes.admin import admin_bp


FRONTEND_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "frontend")
)

MODEL_FILE = os.path.join(
    os.path.dirname(__file__),
    "ml",
    "marks_prediction_model.pkl"
)

app = Flask(
    __name__,
    static_folder=FRONTEND_DIR,
    static_url_path=""
)

# Register existing APIs
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(student_bp, url_prefix="/api/student")
app.register_blueprint(exam_bp, url_prefix="/api/exam")
app.register_blueprint(performance_bp, url_prefix="/api/performance")
app.register_blueprint(prediction_bp, url_prefix="/api/prediction")
app.register_blueprint(admin_bp, url_prefix="/api/admin")


# Display the landing page
@app.route("/")
def home():
    return send_from_directory(FRONTEND_DIR, "index.html")


# Fetch real database statistics and sample records
@app.route("/api/public/overview", methods=["GET"])
def public_overview():
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM ml_training_data")
        training_records = cursor.fetchone()[0]

        cursor.execute(
            "SELECT COUNT(*) FROM users WHERE role = 'student'"
        )
        registered_students = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM exams")
        exams_count = cursor.fetchone()[0]

        cursor.execute("""
            SELECT id, study_time_level, failures, absences,
                   g1_marks, g2_marks, g3_marks
            FROM ml_training_data
            ORDER BY id
            LIMIT 5
        """)

        rows = cursor.fetchall()

        sample_records = [
            {
                "id": row[0],
                "study_time_level": row[1],
                "failures": row[2],
                "absences": row[3],
                "g1_marks": float(row[4]) if row[4] is not None else None,
                "g2_marks": float(row[5]) if row[5] is not None else None,
                "g3_marks": float(row[6]) if row[6] is not None else None
            }
            for row in rows
        ]

        return jsonify({
            "training_records": training_records,
            "registered_students": registered_students,
            "exams_count": exams_count,
            "model_available": os.path.exists(MODEL_FILE),
            "sample_records": sample_records
        }), 200

    except Exception:
        app.logger.exception("Could not load database overview")
        return jsonify({
            "message": "Unable to retrieve database overview"
        }), 500

    finally:
        if cursor is not None:
            cursor.close()

        if conn is not None:
            conn.close()


if __name__ == "__main__":
    app.run(debug=True)
