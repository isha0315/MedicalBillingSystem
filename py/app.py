import os
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from functools import wraps

import mysql.connector
from flask import Flask, jsonify, request, session
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash

from config import CORS_ORIGINS, SECRET_KEY
from db import get_connection

app = Flask(__name__)

app.config["SECRET_KEY"] = SECRET_KEY
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = (
    os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true"
)

CORS(
    app,
    supports_credentials=True,
    origins=CORS_ORIGINS
)

PAYMENT_METHODS = {"Cash", "UPI", "Card", "Net Banking"}
MONEY = Decimal("0.01")


def error_response(message, status=400):
    return jsonify(success=False, message=message), status


def body():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        raise ValueError("A valid JSON request body is required.")

    return data


def text(value, field, required=True, limit=255):
    value = str(value or "").strip()

    if required and not value:
        raise ValueError(f"{field} is required.")

    if len(value) > limit:
        raise ValueError(f"{field} is too long.")

    return value


def integer(value, field, maximum=100000):
    try:
        value = int(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field} must be a whole number.")

    if not 1 <= value <= maximum:
        raise ValueError(f"{field} must be between 1 and {maximum}.")

    return value


def money(value, field, minimum=Decimal("0"), maximum=Decimal("10000000")):
    try:
        value = Decimal(str(value)).quantize(
            MONEY,
            rounding=ROUND_HALF_UP
        )
    except (InvalidOperation, TypeError, ValueError):
        raise ValueError(f"{field} must be a valid amount.")

    if not minimum <= value <= maximum:
        raise ValueError(f"{field} is outside the allowed range.")

    return value


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get("user_id"):
            return error_response("Please sign in first.", 401)

        return view(*args, **kwargs)

    return wrapped


def user_id():
    return int(session["user_id"])


def is_admin():
    return session.get("role") == "Admin"


def scope(alias):
    if is_admin():
        return "", ()

    return f" WHERE {alias}.created_by = %s", (user_id(),)


@app.get("/")
@app.get("/health")
def health():
    return jsonify(
        success=True,
        message="MediBill API is running."
    )


@app.post("/register")
def register():
    connection = None
    cursor = None

    try:
        data = body()

        full_name = text(
            data.get("fullName"),
            "Full name",
            limit=100
        )

        email = text(
            data.get("email"),
            "Email",
            limit=100
        ).lower()

        username = text(
            data.get("username"),
            "Username",
            limit=50
        )

        password = str(data.get("password") or "")

        if "@" not in email or len(password) < 8:
            return error_response(
                "Enter a valid email and a password of at least 8 characters."
            )

        connection = get_connection()
        cursor = connection.cursor(
            dictionary=True,
            buffered=True
        )

        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE email = %s OR username = %s
            LIMIT 1
            """,
            (email, username)
        )

        if cursor.fetchone():
            return error_response(
                "An account already uses that email or username.",
                409
            )

        cursor.execute(
            """
            INSERT INTO users
            (full_name, email, username, password)
            VALUES (%s, %s, %s, %s)
            """,
            (
                full_name,
                email,
                username,
                generate_password_hash(password)
            )
        )

        connection.commit()

        return jsonify(
            success=True,
            message=(
                "Registration successful. "
                "Your account is a Receptionist account by default."
            )
        ), 201

    except ValueError as error:
        return error_response(str(error))

    except mysql.connector.Error as error:
        app.logger.exception(
            "Registration database error: %s",
            error
        )

        if connection:
            connection.rollback()

        return error_response("Unable to create the account.", 500)

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


@app.post("/login")
def login():
    connection = None
    cursor = None

    try:
        data = body()

        email = text(
            data.get("email"),
            "Email",
            limit=100
        ).lower()

        password = str(data.get("password") or "")

        if not password:
            return error_response("Password is required.")

        connection = get_connection()

        cursor = connection.cursor(
            dictionary=True,
            buffered=True
        )

        cursor.execute(
            """
            SELECT id, full_name, email, username, password, role
            FROM users
            WHERE email = %s
            LIMIT 1
            """,
            (email,)
        )

        user = cursor.fetchone()

        if not user:
            return error_response(
                "Invalid email or password.",
                401
            )

        saved_password = user["password"]

        try:
            password_ok = check_password_hash(
                saved_password,
                password
            )
        except ValueError:
            password_ok = False

        # Supports the original sample user once, then converts
        # its old plain-text password into a secure hash.
        if not password_ok and saved_password == password:
            cursor.execute(
                """
                UPDATE users
                SET password = %s
                WHERE id = %s
                """,
                (
                    generate_password_hash(password),
                    user["id"]
                )
            )

            connection.commit()
            password_ok = True

        if not password_ok:
            return error_response(
                "Invalid email or password.",
                401
            )

        session.clear()
        session["user_id"] = user["id"]
        session["role"] = user["role"]

        return jsonify(
            success=True,
            message="Login successful.",
            user={
                "id": user["id"],
                "fullName": user["full_name"],
                "email": user["email"],
                "username": user["username"],
                "role": user["role"]
            }
        )

    except ValueError as error:
        return error_response(str(error))

    except mysql.connector.Error as error:
        app.logger.exception(
            "Login database error: %s",
            error
        )

        return error_response(
            "Unable to sign in right now.",
            500
        )

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


@app.post("/logout")
def logout():
    session.clear()

    return jsonify(
        success=True,
        message="Signed out successfully."
    )


@app.post("/add_patient")
@login_required
def add_patient():
    connection = None
    cursor = None

    try:
        data = body()

        patient_name = text(
            data.get("patient_name"),
            "Patient name",
            limit=100
        )

        age = integer(
            data.get("age"),
            "Age",
            130
        )

        gender = text(
            data.get("gender"),
            "Gender",
            limit=10
        )

        if gender not in {"Male", "Female", "Other"}:
            return error_response("Select a valid gender.")

        phone = text(
            data.get("phone"),
            "Phone",
            False,
            15
        )

        disease = text(
            data.get("disease"),
            "Disease",
            False,
            100
        )

        address = text(
            data.get("address"),
            "Address",
            False,
            500
        )

        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO patients
            (patient_name, age, gender, phone, disease, address, created_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                patient_name,
                age,
                gender,
                phone,
                disease,
                address,
                user_id()
            )
        )

        patient_id = cursor.lastrowid
        connection.commit()

        return jsonify(
            success=True,
            message="Patient added successfully.",
            patient_id=patient_id
        ), 201

    except ValueError as error:
        return error_response(str(error))

    except mysql.connector.Error:
        if connection:
            connection.rollback()

        return error_response(
            "Unable to add the patient.",
            500
        )

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


@app.get("/patients")
@login_required
def patients():
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        if is_admin():
            cursor.execute(
                """
                SELECT
                    p.id,
                    p.patient_name,
                    p.age,
                    p.gender,
                    p.phone,
                    p.disease
                FROM patients p
                ORDER BY p.id DESC
                """
            )
        else:
            cursor.execute(
                """
                SELECT
                    p.id,
                    p.patient_name,
                    p.age,
                    p.gender,
                    p.phone,
                    p.disease
                FROM patients p
                WHERE p.created_by = %s OR p.created_by IS NULL
                ORDER BY p.id DESC
                """,
                (user_id(),)
            )

        return jsonify(
            success=True,
            patients=cursor.fetchall()
        )

    except mysql.connector.Error as error:
        app.logger.exception(
            "Patient list database error: %s",
            error
        )

        return error_response(
            "Unable to load patients.",
            500
        )

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


@app.get("/services")
@login_required
def services():
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT id, service_name, price
            FROM services
            ORDER BY service_name
            """
        )

        return jsonify(cursor.fetchall())

    except mysql.connector.Error:
        return error_response(
            "Unable to load services.",
            500
        )

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


@app.get("/inventory")
@login_required
def inventory():
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT id, medicine_name, unit_price, stock
            FROM inventory
            ORDER BY medicine_name
            """
        )

        return jsonify(cursor.fetchall())

    except mysql.connector.Error:
        return error_response(
            "Unable to load inventory.",
            500
        )

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


@app.post("/generate_bill")
@login_required
def generate_bill():
    connection = None
    cursor = None

    try:
        data = body()

        bill_number = text(
            data.get("bill_number"),
            "Bill number",
            limit=30
        )

        patient_id = integer(
            data.get("patient_id"),
            "Patient"
        )

        gst = money(
            data.get("gst", 0),
            "GST",
            Decimal("0"),
            Decimal("100")
        )

        payment_method = text(
            data.get("payment_method"),
            "Payment method",
            limit=30
        )

        if payment_method not in PAYMENT_METHODS:
            return error_response(
                "Select a valid payment method."
            )

        requested_items = data.get("items")

        if not isinstance(requested_items, list) or not requested_items:
            return error_response(
                "Add at least one bill item."
            )

        connection = get_connection()

        cursor = connection.cursor(
            dictionary=True,
            buffered=True
        )

        if is_admin():
            cursor.execute(
                "SELECT id FROM patients WHERE id = %s",
                (patient_id,)
            )
        else:
            cursor.execute(
                """
                SELECT id
                FROM patients
                WHERE id = %s
                  AND (created_by = %s OR created_by IS NULL)
                """,
                (patient_id, user_id())
            )

        if not cursor.fetchone():
            return error_response(
                "Selected patient does not exist or is not assigned to you.",
                404
            )

        bill_items = []
        subtotal = Decimal("0.00")

        for item in requested_items:
            name = text(
                item.get("item_name"),
                "Item name",
                limit=100
            )

            item_type = text(
                item.get("item_type"),
                "Item type",
                limit=20
            )

            quantity = integer(
                item.get("quantity"),
                "Quantity"
            )

            if item_type == "Consultation":
                cursor.execute(
                    """
                    SELECT service_name, price
                    FROM services
                    WHERE service_name = %s
                    LIMIT 1
                    """,
                    (name,)
                )

                product = cursor.fetchone()

                if not product:
                    return error_response(
                        f"Service '{name}' was not found.",
                        404
                    )

                actual_name = product["service_name"]
                price = money(
                    product["price"],
                    "Service price"
                )

            elif item_type == "Medicine":
                cursor.execute(
                    """
                    SELECT medicine_name, unit_price, stock
                    FROM inventory
                    WHERE medicine_name = %s
                    FOR UPDATE
                    """,
                    (name,)
                )

                product = cursor.fetchone()

                if not product:
                    return error_response(
                        f"Medicine '{name}' was not found.",
                        404
                    )

                if int(product["stock"]) < quantity:
                    return error_response(
                        f"Only {product['stock']} unit(s) of "
                        f"{product['medicine_name']} are available."
                    )

                actual_name = product["medicine_name"]
                price = money(
                    product["unit_price"],
                    "Medicine price"
                )

                cursor.execute(
                    """
                    UPDATE inventory
                    SET stock = stock - %s
                    WHERE medicine_name = %s
                    """,
                    (quantity, actual_name)
                )

            else:
                return error_response(
                    "Item type must be Consultation or Medicine."
                )

            amount = (price * quantity).quantize(
                MONEY,
                rounding=ROUND_HALF_UP
            )

            subtotal += amount

            bill_items.append(
                (
                    actual_name,
                    item_type,
                    quantity,
                    price,
                    amount
                )
            )

        subtotal = subtotal.quantize(
            MONEY,
            rounding=ROUND_HALF_UP
        )

        total = (
            subtotal + subtotal * gst / Decimal("100")
        ).quantize(
            MONEY,
            rounding=ROUND_HALF_UP
        )

        cursor.execute(
            """
            INSERT INTO bills
            (
                bill_number,
                patient_id,
                created_by,
                subtotal,
                gst,
                total_amount,
                payment_method
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                bill_number,
                patient_id,
                user_id(),
                subtotal,
                gst,
                total,
                payment_method
            )
        )

        bill_id = cursor.lastrowid

        cursor.executemany(
            """
            INSERT INTO bill_items
            (
                bill_id,
                item_name,
                item_type,
                quantity,
                unit_price,
                amount
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            [
                (bill_id, *item)
                for item in bill_items
            ]
        )

        connection.commit()

        return jsonify(
            success=True,
            message="Bill generated successfully.",
            bill_number=bill_number,
            bill_id=bill_id
        ), 201

    except ValueError as error:
        if connection:
            connection.rollback()

        return error_response(str(error))

    except mysql.connector.IntegrityError:
        if connection:
            connection.rollback()

        return error_response(
            "That bill number already exists.",
            409
        )

    except mysql.connector.Error:
        if connection:
            connection.rollback()

        return error_response(
            "Unable to generate the bill.",
            500
        )

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


@app.get("/bills")
@login_required
def bills():
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        where, params = scope("b")

        cursor.execute(
            """
            SELECT
                b.bill_number,
                b.patient_id,
                p.patient_name,
                b.total_amount,
                b.payment_method,
                b.created_at
            FROM bills b
            JOIN patients p ON p.id = b.patient_id
            """
            + where
            + " ORDER BY b.created_at DESC, b.id DESC",
            params
        )

        return jsonify(cursor.fetchall())

    except mysql.connector.Error:
        return error_response(
            "Unable to load billing history.",
            500
        )

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


@app.get("/bill/<bill_number>")
@login_required
def bill(bill_number):
    connection = None
    cursor = None

    try:
        connection = get_connection()

        cursor = connection.cursor(
            dictionary=True,
            buffered=True
        )

        where = "b.bill_number = %s"
        params = [bill_number]

        if not is_admin():
            where += " AND b.created_by = %s"
            params.append(user_id())

        cursor.execute(
            """
            SELECT
                b.id,
                b.bill_number,
                p.patient_name,
                b.patient_id,
                b.subtotal,
                b.gst,
                b.total_amount,
                b.payment_method,
                b.created_at
            FROM bills b
            JOIN patients p ON p.id = b.patient_id
            WHERE
            """
            + where,
            tuple(params)
        )

        record = cursor.fetchone()

        if not record:
            return error_response(
                "Bill not found.",
                404
            )

        cursor.execute(
            """
            SELECT
                item_name,
                item_type,
                quantity,
                unit_price,
                amount
            FROM bill_items
            WHERE bill_id = %s
            ORDER BY id
            """,
            (record["id"],)
        )

        record["items"] = cursor.fetchall()

        return jsonify(record)

    except mysql.connector.Error:
        return error_response(
            "Unable to load this bill.",
            500
        )

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


@app.get("/dashboard")
@login_required
def dashboard():
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        patient_where, patient_params = scope("p")
        bill_where, bill_params = scope("b")

        cursor.execute(
            """
            SELECT COUNT(*) AS total_patients
            FROM patients p
            """
            + patient_where,
            patient_params
        )

        patient_total = cursor.fetchone()["total_patients"]

        cursor.execute(
            """
            SELECT
                COUNT(*) AS total_bills,
                COALESCE(SUM(total_amount), 0) AS total_revenue
            FROM bills b
            """
            + bill_where,
            bill_params
        )

        totals = cursor.fetchone()

        cursor.execute(
            """
            SELECT
                p.patient_name,
                p.age,
                p.gender,
                p.disease
            FROM patients p
            """
            + patient_where
            + " ORDER BY p.id DESC LIMIT 5",
            patient_params
        )

        recent_patients = cursor.fetchall()

        cursor.execute(
            """
            SELECT
                b.bill_number,
                p.patient_name,
                b.total_amount,
                b.payment_method,
                b.created_at
            FROM bills b
            JOIN patients p ON p.id = b.patient_id
            """
            + bill_where
            + " ORDER BY b.created_at DESC, b.id DESC LIMIT 5",
            bill_params
        )

        recent_bills = cursor.fetchall()

        return jsonify(
            success=True,
            total_patients=patient_total,
            total_bills=totals["total_bills"],
            total_revenue=totals["total_revenue"],
            pending_bills=0,
            recent_patients=recent_patients,
            recent_bills=recent_bills,
            role=session["role"]
        )

    except mysql.connector.Error:
        return error_response(
            "Unable to load dashboard data.",
            500
        )

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


if __name__ == "__main__":
    app.run(
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "5000")),
        debug=os.getenv("FLASK_DEBUG", "false").lower() == "true"
    )
