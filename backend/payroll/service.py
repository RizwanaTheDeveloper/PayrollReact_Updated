import calendar
from datetime import date, datetime
from zoneinfo import ZoneInfo

HRA_RATE=.25; SPECIAL_ALLOWANCE_RATE=.10; LTA_RATE=.05; BONUS_RATE=.05; EPF_RATE=.12; PROFESSIONAL_TAX=200
RATE_MULTIPLIER=1+HRA_RATE+SPECIAL_ALLOWANCE_RATE+LTA_RATE+BONUS_RATE

def current_ist_str(): return datetime.now(ZoneInfo('Asia/Kolkata')).strftime('%d %b %Y, %I:%M %p IST')

def calculate_payroll(employee):
    today=date.today(); days=calendar.monthrange(today.year,today.month)[1]
    working=max(0,min(int(employee.WorkingDays if employee.WorkingDays is not None else days),days))
    factor=working/days if days else 1.0
    annual_ctc=float(employee.CTC); monthly=annual_ctc/12; basic_full=monthly/RATE_MULTIPLIER
    hra_full=basic_full*HRA_RATE; special_full=basic_full*SPECIAL_ALLOWANCE_RATE; lta_full=basic_full*LTA_RATE; bonus_full=basic_full*BONUS_RATE
    gross_full=basic_full+hra_full+special_full+lta_full+bonus_full
    per_day=gross_full/days if days else 0; worked=per_day*working
    basic=basic_full*factor; hra=hra_full*factor; special=special_full*factor; lta=lta_full*factor; bonus=bonus_full*factor
    gross=basic+hra+special+lta+bonus; epf=basic*EPF_RATE; pt=PROFESSIONAL_TAX if working>0 else 0
    total=pt+epf; net=gross-total
    return {'basic_full':basic_full,'hra_full':hra_full,'special_allowance_full':special_full,'lta_full':lta_full,'bonus_full':bonus_full,'gross_earnings_full':gross_full,'basic':basic,'hra':hra,'special_allowance':special,'lta':lta,'bonus':bonus,'gross_earnings':gross,'professional_tax':pt,'epf':epf,'tds':0,'total_deductions':total,'net_salary':net,'working_days':working,'days_in_month':days,'proration_factor':factor,'per_day_salary':per_day,'worked_days_salary':worked}
