from flask import Blueprint, request, jsonify

from auth.service import verify_login


auth_bp = Blueprint(
    "auth",
    __name__,
    url_prefix="/api"
)


@auth_bp.get("/me")
def me():
    return jsonify(user=None)


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}

    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    user = verify_login(
        username,
        password
    )

    if not user:
        return jsonify(
            error="Invalid username or password."
        ), 401

    return jsonify(
        user={
            "username": user.Username,
            "role": user.Role,
            "employee_code": user.EmployeeCode
        }
    )


@auth_bp.post("/logout")
def logout():
    return jsonify(ok=True)