
import os

from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_db_connection

auth_bp = Blueprint("auth", __name__)

# For your local project, set this environment variable before running Flask
# or use the temporary fallback code below.
ADMIN_REGISTRATION_CODE = os.environ.get(
    "MARKSENSE_ADMIN_CODE",
    "MSADMIN2026"
)


# =========================
# REGISTRATION
# =========================

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}

    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role = data.get("role", "student").strip().lower()
    admin_code = data.get("admin_code", "")

    if not full_name or not email or not password:
        return jsonify({"message": "All fields are required"}), 400

    if len(password) < 8:
        return jsonify({
            "message": "Password must contain at least 8 characters"
        }), 400

    if role not in ("student", "admin"):
        return jsonify({"message": "Invalid account type"}), 400

    # Admin registration requires an authorization code.
    if role == "admin" and admin_code != ADMIN_REGISTRATION_CODE:
        return jsonify({
            "message": "Invalid admin authorization code"
        }), 403

    password_hash = generate_password_hash(password)

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT user_id FROM users WHERE LOWER(email) = %s",
            (email,)
        )

        if cursor.fetchone():
            return jsonify({
                "message": "Email already registered"
            }), 409

        # Generate an account ID based on the selected role.
        prefix = "ADM" if role == "admin" else "STU"

        cursor.execute(
            "SELECT COUNT(*) FROM users WHERE role = %s",
            (role,)
        )
        count = cursor.fetchone()[0] + 1
        account_id = f"{prefix}{count:03d}"

        cursor.execute(
            """
            INSERT INTO users
                (full_name, email, password_hash, role, account_id)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING user_id, account_id
            """,
            (full_name, email, password_hash, role, account_id)
        )

        user_id, account_id = cursor.fetchone()
        conn.commit()

        return jsonify({
            "message": "Registration successful",
            "user_id": user_id,
            "account_id": account_id,
            "role": role
        }), 201

    except Exception:
        conn.rollback()
        return jsonify({
            "message": "Registration failed. Please check the server logs."
        }), 500

    finally:
        cursor.close()
        conn.close()


# =========================
# LOGIN
# =========================

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "message": "Email and password are required"
        }), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT user_id, full_name, password_hash, role, account_id
            FROM users
            WHERE LOWER(email) = %s
            """,
            (email,)
        )

        user = cursor.fetchone()

        if not user:
            return jsonify({
                "message": "Invalid email or password"
            }), 401

        user_id, full_name, password_hash, role, account_id = user

        if not check_password_hash(password_hash, password):
            return jsonify({
                "message": "Invalid email or password"
            }), 401

        return jsonify({
            "message": "Login successful",
            "user_id": user_id,
            "full_name": full_name,
            "email": email,
            "role": role,
            "account_id": account_id
        }), 200

    finally:
        cursor.close()
        conn.close()
