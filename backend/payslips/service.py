from datetime import date
from payroll.service import calculate_payroll,current_ist_str
from payroll.tax_engine import calculate_annual_tax
from payroll.history import get_month_record,record_month,get_fy_summary,fy_label,get_month_snapshot

def build_payslip_view(employee,month,year):
    today=date.today(); current=(month==today.month and year==today.year); period=date(year,month,1)
    if current:
        payroll=calculate_payroll(employee); tax=calculate_annual_tax(payroll['gross_earnings_full']*12,getattr(employee,'RegimeOpted',None) or 'New')
        existing=get_month_record(employee.EmployeeCode,month,year)
        if existing is not None: tds=existing
        else:
            deducted,_,left=get_fy_summary(employee.EmployeeCode,today); tds=round(max(tax['net_tax']-deducted,0)/max(left,1),2)
        available=max(payroll['gross_earnings']-payroll['professional_tax']-payroll['epf'],0);tds=round(min(tds,available),2)
        payroll['tds']=tds;payroll['total_deductions']=payroll['professional_tax']+payroll['epf']+tds;payroll['net_salary']=payroll['gross_earnings']-payroll['total_deductions']
        deducted,_,left=get_fy_summary(employee.EmployeeCode,today);generated=current_ist_str();label=fy_label(today)
        if existing is None: record_month(employee.EmployeeCode,month,year,tds,{'payroll':payroll,'tax':tax,'generated_at':generated,'fy_label':label,'tax_deducted_till_date':deducted,'executions_left':left})
        display=employee
    else:
        snap=get_month_snapshot(employee.EmployeeCode,month,year)
        if not snap:return None
        payroll=snap['payroll'];tax=snap['tax'];generated=snap.get('generated_at',period.strftime('%d %b %Y'));label=snap.get('fy_label',fy_label(period));deducted=snap.get('tax_deducted_till_date',0);left=snap.get('executions_left',0)
        display=employee._replace(WorkingDays=payroll.get('working_days',employee.WorkingDays),RegimeOpted=tax.get('regime',employee.RegimeOpted))
    return {'employee':display,'payroll':payroll,'tax':tax,'generated_at':generated,'fy_label':label,'tax_deducted_till_date':deducted,'executions_left':left,'is_current_period':current,'period_label':period.strftime('%B %Y'),'month':month,'year':year}

def serialize_payslip(view,company_name):
    e=view['employee'];return {'company_name':company_name,'employee':{'EmployeeCode':e.EmployeeCode,'FullName':e.FullName,'Designation':e.Designation,'PAN':e.PAN,'PFUAN':e.PFUAN,'AccountNumber':e.AccountNumber,'IFSCCode':e.IFSCCode,'JoiningDate':e.JoiningDate.isoformat() if e.JoiningDate else None,'WorkingDays':e.WorkingDays,'RegimeOpted':e.RegimeOpted or 'New'},'payroll':view['payroll'],'tax':view['tax'],'generated_at':view['generated_at'],'fy_label':view['fy_label'],'tax_deducted_till_date':view['tax_deducted_till_date'],'executions_left':view['executions_left'],'is_current_period':view['is_current_period'],'period_label':view['period_label'],'month':view['month'],'year':view['year']}
