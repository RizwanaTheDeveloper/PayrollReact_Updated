import json
from datetime import date
from database import get_connection

def financial_year_bounds(d=None):
    d=d or date.today(); return (date(d.year,4,1),date(d.year+1,3,31)) if d.month>=4 else (date(d.year-1,4,1),date(d.year,3,31))
def fy_label(d=None):
    s,e=financial_year_bounds(d); return f'{s.year} - {e.year}'
def get_month_record(code,month,year):
    c=get_connection();cur=c.cursor()
    try:
        cur.execute('SELECT MonthlyTDS AS "MonthlyTDS" FROM PayrollHistory WHERE EmployeeCode=%s AND PayMonth=%s AND PayYear=%s',(code,month,year));r=cur.fetchone();return float(r.MonthlyTDS) if r else None
    finally:cur.close();c.close()
def record_month(code,month,year,monthly_tds,snapshot=None):
    c=get_connection();cur=c.cursor()
    try:
        
        cur.execute('INSERT INTO PayrollHistory (EmployeeCode,PayMonth,PayYear,MonthlyTDS,Snapshot) VALUES (%s,%s,%s,%s,%s)',(code,month,year,monthly_tds,json.dumps(snapshot) if snapshot is not None else None));c.commit()
    except Exception:c.rollback();raise
    finally:cur.close();c.close()
def get_month_snapshot(code,month,year):
    c=get_connection();cur=c.cursor()
    try:
        cur.execute('SELECT Snapshot AS "Snapshot" FROM PayrollHistory WHERE EmployeeCode=%s AND PayMonth=%s AND PayYear=%s',(code,month,year));r=cur.fetchone();return json.loads(r.Snapshot) if r and r.Snapshot else None
    finally:cur.close();c.close()
def list_payslip_periods(code,limit=36):
    c=get_connection();cur=c.cursor()
    try:
        cur.execute('SELECT PayMonth AS "PayMonth",PayYear AS "PayYear",MonthlyTDS AS "MonthlyTDS",Snapshot AS "Snapshot" FROM PayrollHistory WHERE EmployeeCode=%s ORDER BY PayYear DESC,PayMonth DESC LIMIT %s',(code,limit))
        return [{'month':r.PayMonth,'year':r.PayYear,'monthly_tds':float(r.MonthlyTDS),'has_snapshot':bool(r.Snapshot),'label':date(r.PayYear,r.PayMonth,1).strftime('%B %Y')} for r in cur.fetchall()]
    finally:cur.close();c.close()
def get_fy_summary(code,d=None):
    start,end=financial_year_bounds(d);c=get_connection();cur=c.cursor()
    try:
        cur.execute('''SELECT MonthlyTDS AS "MonthlyTDS" FROM PayrollHistory WHERE EmployeeCode=%s AND ((PayYear=%s AND PayMonth>=4) OR (PayYear=%s AND PayMonth<=3))''',(code,start.year,end.year));rows=cur.fetchall();done=len(rows);return round(sum(float(r.MonthlyTDS) for r in rows),2),done,max(12-done,0)
    finally:cur.close();c.close()
