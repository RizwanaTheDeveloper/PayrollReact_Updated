import os
import logging
from flask import Flask, request
from flask_cors import CORS

from auth.routes import auth_bp
from employees.routes import bp as employees_bp
from payroll.routes import bp as payroll_bp
from payslips.routes import bp as payslips_bp

from attendance.routes import bp as attendance_bp


app.register_blueprint(attendance_bp) # type: ignore


app = Flask(
    __name__,
    template_folder="templates"
)

configured_origins = os.getenv(
    "FRONTEND_URL",
    ""
)

allowed_origins = [
    origin.strip().rstrip("/")
    for origin in configured_origins.split(",")
    if origin.strip()
]

# Keep the known production frontend origins allowed while Render
# environment variables are being migrated between deployments.
allowed_origins.extend([
    "https://payroll-est9.onrender.com",
    "https://payrollreact-updated-1.onrender.com",
])

# Local development.
allowed_origins.append("http://localhost:5173")

allowed_origins = list(dict.fromkeys(allowed_origins))

CORS(
    app,
    origins=allowed_origins,
    methods=[
        "GET",
        "HEAD",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=[
        "Content-Type",
        "Authorization",
    ],
    supports_credentials=False,
)

app.register_blueprint(auth_bp)
app.register_blueprint(employees_bp)
app.register_blueprint(payroll_bp)
app.register_blueprint(payslips_bp)


# BASIC REQUEST DEBUGGING
# Print directly to stdout and also send through Flask logger.
logging.basicConfig(level=logging.INFO)


@app.before_request
def log_request():
    message = (
        "========== REQUEST ==========\n"
        f"METHOD={request.method}\n"
        f"PATH={request.path}\n"
        f"URL={request.url}"
    )

    print(message, flush=True)
    app.logger.warning(message)


@app.after_request
def log_response(response):
    message = (
        "========== RESPONSE ==========\n"
        f"METHOD={request.method}\n"
        f"PATH={request.path}\n"
        f"STATUS={response.status}"
    )

    print(message, flush=True)
    app.logger.warning(message)

    return response


@app.get("/health")
def health():
    return {"ok": True}


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", 5000)),
        debug=os.getenv("FLASK_DEBUG") == "1"
    )