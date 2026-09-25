from functools import wraps
from flask import Blueprint,request,jsonify,session
from auth.service import verify_login

auth_bp=Blueprint('auth',__name__,url_prefix='/api')

def api_login_required(fn):
    @wraps(fn)
    def wrapped(*a,**kw):
        if 'user_id' not in session:return jsonify(error='Not signed in.'),401
        return fn(*a,**kw)
    return wrapped

def api_role_required(*roles):
    def dec(fn):
        @wraps(fn)
        def wrapped(*a,**kw):
            if 'user_id' not in session:return jsonify(error='Not signed in.'),401
            if session.get('role') not in roles:return jsonify(error="You don't have permission to do that."),403
            return fn(*a,**kw)
        return wrapped
    return dec

@auth_bp.get('/me')
def me():
    if 'user_id' not in session:return jsonify(user=None)
    return jsonify(user={'username':session.get('username'),'role':session.get('role'),'employee_code':session.get('employee_code')})

@auth_bp.post('/login')
def login():
    data=request.get_json(silent=True) or {};u=verify_login((data.get('username') or '').strip(),data.get('password') or '')
    if not u:return jsonify(error='Invalid username or password.'),401
    session.clear();session.update(user_id=u.UserId,username=u.Username,role=u.Role,employee_code=u.EmployeeCode)
    return jsonify(user={'username':u.Username,'role':u.Role,'employee_code':u.EmployeeCode})

@auth_bp.post('/logout')
def logout():session.clear();return jsonify(ok=True)
