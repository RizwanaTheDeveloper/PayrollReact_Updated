import os
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
@app.before_request
def log_request():
    print("========== REQUEST ==========", flush=True)
    print("METHOD:", request.method, flush=True)
    print("PATH:", request.path, flush=True)
    print("URL:", request.url, flush=True)


@app.after_request
def log_response(response):
    print("========== RESPONSE ==========", flush=True)
    print("PATH:", request.path, flush=True)
    print("STATUS:", response.status, flush=True)
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