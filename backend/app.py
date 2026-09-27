import os
import logging
from flask import Flask, request
from flask_cors import CORS

from auth.routes import auth_bp
from employees.routes import bp as employees_bp
from payroll.routes import bp as payroll_bp
from payslips.routes import bp as payslips_bp


app = Flask(
    __name__,
    template_folder="templates"
)

frontend_url = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173"
)

CORS(
    app,
    origins=[frontend_url],
    supports_credentials=False
)

app.register_blueprint(auth_bp)
app.register_blueprint(employees_bp)
app.register_blueprint(payroll_bp)
app.register_blueprint(payslips_bp)


# BASIC REQUEST DEBUGGING
# Use Flask/Gunicorn logging so the messages appear in Render Runtime Logs.
logging.basicConfig(level=logging.INFO)


@app.before_request
def log_request():
    app.logger.warning(
        "========== REQUEST =========="
    )
    app.logger.warning(
        "METHOD=%s PATH=%s URL=%s",
        request.method,
        request.path,
        request.url,
    )


@app.after_request
def log_response(response):
    app.logger.warning(
        "========== RESPONSE =========="
    )
    app.logger.warning(
        "METHOD=%s PATH=%s STATUS=%s",
        request.method,
        request.path,
        response.status,
    )
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