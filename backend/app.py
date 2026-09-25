import os
from flask import Flask,send_from_directory
from auth.routes import auth_bp
from employees.routes import bp as employees_bp
from payroll.routes import bp as payroll_bp
from payslips.routes import bp as payslips_bp

app=Flask(__name__,template_folder='templates')
app.secret_key=os.getenv('FLASK_SECRET_KEY','dev-only-change-me')
app.config['SESSION_COOKIE_SAMESITE']='Lax'
app.config['SESSION_COOKIE_HTTPONLY']=True
app.register_blueprint(auth_bp)
app.register_blueprint(employees_bp)
app.register_blueprint(payroll_bp)
app.register_blueprint(payslips_bp)

@app.get('/health')
def health():return {'ok':True}

if __name__=='__main__':app.run(host='0.0.0.0',port=int(os.getenv('PORT',5000)),debug=os.getenv('FLASK_DEBUG')=='1')
