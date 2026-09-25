from flask import Blueprint,request,jsonify,send_file,url_for,render_template,session,abort
from io import BytesIO
from datetime import date
from auth.routes import api_login_required
from employees.service import get_employee
from payroll.history import list_payslip_periods
from payslips.service import build_payslip_view,serialize_payslip

def can_view(code):return session.get('role')!='client' or not session.get('employee_code') or session.get('employee_code')==code
bp=Blueprint('payslips',__name__)

@bp.get('/api/payslip-history/<code>')
@api_login_required
def history(code):
    if not can_view(code):return jsonify(error="You don't have permission to view this history."),403
    e=get_employee(code)
    if not e:return jsonify(error='Employee not found.'),404
    today=date.today();periods=list_payslip_periods(code)
    if not any(p['month']==today.month and p['year']==today.year for p in periods):periods.insert(0,{'month':today.month,'year':today.year,'monthly_tds':None,'has_snapshot':True,'label':today.strftime('%B %Y')})
    return jsonify(employee={'EmployeeCode':e.EmployeeCode,'FullName':e.FullName},periods=periods)

@bp.get('/generate-payroll/<code>')
@api_login_required
def html_payslip(code):
    if not can_view(code):abort(403)
    e=get_employee(code)
    if not e:abort(404)
    today=date.today();month=request.args.get('month',type=int) or today.month;year=request.args.get('year',type=int) or today.year
    v=build_payslip_view(e,month,year)
    if not v:abort(404)
    return render_template('payroll.html',**v,company_name='5Gen Educon Private Limited')

@bp.get('/download-payslip/<code>')
@api_login_required
def download(code):
    if not can_view(code):abort(403)
    e=get_employee(code)
    if not e:abort(404)
    # HTML fallback is intentionally used when Playwright is unavailable.
    # Set PLAYWRIGHT_PDF=1 and install Chromium to enable real PDF output.
    from os import getenv
    if getenv('PLAYWRIGHT_PDF','0')!='1':
        return jsonify(error='PDF rendering is disabled. Set PLAYWRIGHT_PDF=1 and run playwright install chromium.'),503
    from playwright.sync_api import sync_playwright
    today=date.today();month=request.args.get('month',type=int) or today.month;year=request.args.get('year',type=int) or today.year
    view=build_payslip_view(e,month,year)
    if not view: abort(404)
    html=render_template('payroll.html', **view, company_name='5Gen Educon Private Limited')
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True);page=browser.new_page();page.set_content(html,wait_until='networkidle');pdf=page.pdf(format='A4',print_background=True);browser.close()
    return send_file(BytesIO(pdf),mimetype='application/pdf',as_attachment=True,download_name=f'Payslip-{code}-{date(year,month,1).strftime("%b-%Y")}.pdf')
