from database import get_connection

def get_user_by_username(username):
    c=get_connection(); cur=c.cursor()
    try:
        cur.execute('''SELECT UserId AS "UserId",Username AS "Username",Password AS "Password",Role AS "Role",EmployeeCode AS "EmployeeCode",IsActive AS "IsActive" FROM AppUsers WHERE LOWER(Username)=LOWER(%s)''',(username,)); return cur.fetchone()
    finally: cur.close(); c.close()

def get_user_by_employee_code(code):
    c=get_connection(); cur=c.cursor()
    try:
        cur.execute('''SELECT UserId AS "UserId",Username AS "Username",Password AS "Password",Role AS "Role",EmployeeCode AS "EmployeeCode",IsActive AS "IsActive" FROM AppUsers WHERE EmployeeCode=%s''',(code,)); return cur.fetchone()
    finally: cur.close(); c.close()

def verify_login(username,password):
    u=get_user_by_username(username)
    return u if u and u.IsActive and u.Password == password else None

def upsert_employee_login(employee_code, username, password):
    username=(username or '').strip(); password=password or ''
    if not username and not password: return True,None
    c=get_connection(); cur=c.cursor()
    try:
        cur.execute('SELECT UserId AS "UserId",Username AS "Username",Password AS "Password" FROM AppUsers WHERE EmployeeCode=%s',(employee_code,)); existing=cur.fetchone()
        if not existing and (not username or not password): return False,'A username and a password are both needed to create a login for this employee.'
        if username:
            cur.execute('SELECT UserId AS "UserId" FROM AppUsers WHERE LOWER(Username)=LOWER(%s) AND EmployeeCode IS DISTINCT FROM %s',(username,employee_code))
            if cur.fetchone(): return False,f'The username “{username}” is already taken by another account.'
        if existing:
            cur.execute('UPDATE AppUsers SET Username=%s,Password=%s,IsActive=1 WHERE UserId=%s',(username or existing.Username,password or existing.Password,existing.UserId))
        else:
            cur.execute("INSERT INTO AppUsers (Username,Password,Role,EmployeeCode,IsActive) VALUES (%s,%s,'client',%s,1)",(username,password,employee_code))
        c.commit(); return True,None
    except Exception: c.rollback(); raise
    finally: cur.close(); c.close()
