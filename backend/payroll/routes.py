from flask import Blueprint,request,jsonify
from auth.routes import api_login_required
from employees.service import get_employee
from payslips.service import build_payslip_view,serialize_payslip
from payslips.routes import can_view
bp=Blueprint('payroll',__name__,url_prefix='/api')
@bp.get('/payslip/<code>')
@api_login_required
def payslip(code):
    if not can_view(code):return jsonify(error="You don't have permission to view this payslip."),403
    e=get_employee(code)
    if not e:return jsonify(error='Employee not found.'),404
    from datetime import date
    today=date.today();month=request.args.get('month',type=int) or today.month;year=request.args.get('year',type=int) or today.year
    if not 1<=month<=12:return jsonify(error='Month must be between 1 and 12.'),400
    v=build_payslip_view(e,month,year)
    if v is None:return jsonify(error=f'No payslip is on record for {date(year,month,1).strftime("%B %Y")}.',),404
    return jsonify(serialize_payslip(v,'5Gen Educon Private Limited'))
