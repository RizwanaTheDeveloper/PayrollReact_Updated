from database import get_connection

EMPLOYEE_COLUMNS = '''
    EmployeeCode AS "EmployeeCode", FullName AS "FullName",
    Department AS "Department", Designation AS "Designation",
    JoiningDate AS "JoiningDate", CTC AS "CTC", PAN AS "PAN",
    PFUAN AS "PFUAN", AccountNumber AS "AccountNumber",
    IFSCCode AS "IFSCCode", RegimeOpted AS "RegimeOpted",
    WorkingDays AS "WorkingDays", IsActive AS "IsActive"
'''

def get_employees():
    c = get_connection(); cur = c.cursor()
    try:
        cur.execute(f'SELECT {EMPLOYEE_COLUMNS} FROM Employees WHERE IsActive = 1 ORDER BY EmployeeCode')
        return cur.fetchall()
    finally: cur.close(); c.close()

def get_employee(code):
    c = get_connection(); cur = c.cursor()
    try:
        cur.execute(f'SELECT {EMPLOYEE_COLUMNS} FROM Employees WHERE EmployeeCode = %s', (code,))
        return cur.fetchone()
    finally: cur.close(); c.close()

def add_employee(**d):
    c = get_connection(); cur = c.cursor()
    try:
        cur.execute("""SELECT COALESCE(MAX(CASE WHEN EmployeeCode ~ '^EMP[0-9]+$' THEN CAST(SUBSTRING(EmployeeCode FROM 4) AS INTEGER) ELSE NULL END),0) FROM Employees""")
        n = (cur.fetchone()[0] or 0) + 1
        code = f'EMP{n:03d}'
        cur.execute('''INSERT INTO Employees
            (EmployeeCode,FullName,Department,Designation,JoiningDate,CTC,PAN,PFUAN,AccountNumber,IFSCCode,RegimeOpted,WorkingDays,IsActive)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,1)''',
            (code,d['full_name'],d['department'],d['designation'],d['joining_date'],d['ctc'],d['pan'],d['pf_uan'],d['account_number'],d['ifsc_code'],d['regime_opted'],d['working_days']))
        c.commit(); return code
    except Exception: c.rollback(); raise
    finally: cur.close(); c.close()

def update_employee(code, **d):
    c = get_connection(); cur = c.cursor()
    try:
        cur.execute('''UPDATE Employees SET FullName=%s,Department=%s,Designation=%s,JoiningDate=%s,CTC=%s,PAN=%s,PFUAN=%s,AccountNumber=%s,IFSCCode=%s,RegimeOpted=%s,WorkingDays=%s WHERE EmployeeCode=%s''',
            (d['full_name'],d['department'],d['designation'],d['joining_date'],d['ctc'],d['pan'],d['pf_uan'],d['account_number'],d['ifsc_code'],d['regime_opted'],d['working_days'],code))
        c.commit(); return cur.rowcount > 0
    except Exception: c.rollback(); raise
    finally: cur.close(); c.close()

def delete_employee(code):
    c = get_connection(); cur = c.cursor()
    try:
        cur.execute('DELETE FROM Employees WHERE EmployeeCode=%s', (code,)); c.commit(); return cur.rowcount > 0
    except Exception: c.rollback(); raise
    finally: cur.close(); c.close()
