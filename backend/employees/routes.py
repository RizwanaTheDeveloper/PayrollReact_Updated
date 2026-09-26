from flask import Blueprint,request,jsonify,session
from auth.routes import api_login_required,api_role_required
from auth.service import get_user_by_employee_code,upsert_employee_login
from employees.service import get_employees,get_employee,add_employee,update_employee,delete_employee
from utils.validators import parse_employee_payload

bp=Blueprint('employees',__name__,url_prefix='/api/employees')
def ser(e):return {'EmployeeCode':e.EmployeeCode,'FullName':e.FullName,'Department':e.Department,'Designation':e.Designation,'JoiningDate':e.JoiningDate.isoformat() if e.JoiningDate else None,'CTC':float(e.CTC) if e.CTC is not None else 0,'PAN':e.PAN,'PFUAN':e.PFUAN,'AccountNumber':e.AccountNumber,'IFSCCode':e.IFSCCode,'RegimeOpted':e.RegimeOpted,'WorkingDays':e.WorkingDays}
def can_view(code):return session.get('role')!='client' or not session.get('employee_code') or session.get('employee_code')==code

@bp.get('')
@api_login_required
def all_employees():
    if session.get('role')=='client' and session.get('employee_code'):
        e=get_employee(session['employee_code']); items=[e] if e else []
    else:items=get_employees()
    return jsonify(employees=[ser(e) for e in items])

@bp.get('/<code>')
@api_login_required
def one(code):
    if not can_view(code):return jsonify(error="You don't have permission to view this employee."),403
    e=get_employee(code)
    if not e:return jsonify(error='Employee not found.'),404
    u=get_user_by_employee_code(code)
    return jsonify(employee=ser(e),login_username=u.Username if u else None)

@bp.post('')
@api_role_required('admin')
def create():
    body = request.get_json(silent=True) or {}

    d, error = parse_employee_payload(body)

    if error:
        return jsonify(error=error), 400

    try:
        code = add_employee(**d)
    except ValueError as e:
        return jsonify(error=str(e)), 400
    except Exception as e:
        print("CREATE EMPLOYEE ERROR:", repr(e))
        return jsonify(error="Failed to create employee."), 500

    warning = None

    try:
        if body.get('login_username') or body.get('login_password'):
            _, warning = upsert_employee_login(
                code,
                body.get('login_username'),
                body.get('login_password')
            )
    except Exception as e:
        print("EMPLOYEE LOGIN ERROR:", repr(e))
        warning = "Employee was created, but login credentials could not be saved."

    return jsonify(
        employee_code=code,
        warning=warning
    ), 201
    
    
    
@bp.put('/<code>')
@api_role_required('admin')
def edit(code):
    if not get_employee(code):return jsonify(error='Employee not found.'),404
    body=request.get_json(silent=True) or {};d,error=parse_employee_payload(body)
    if error:return jsonify(error=error),400
    update_employee(code,**d);warning=None
    if body.get('login_username') or body.get('login_password'):_,warning=upsert_employee_login(code,body.get('login_username'),body.get('login_password'))
    return jsonify(ok=True,warning=warning)

@bp.delete('/<code>')
@api_role_required('admin')
def remove(code):
    if not get_employee(code):return jsonify(error='Employee not found.'),404
    delete_employee(code);return jsonify(ok=True)
