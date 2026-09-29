from database import get_connection

STATUSES = {"Present", "Absent", "Paid Leave", "Unpaid Leave", "Half Day"}

CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS attendance (
    attendance_id BIGSERIAL PRIMARY KEY,
    employee_code TEXT NOT NULL,
    attendance_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (
        status IN ('Present', 'Absent', 'Paid Leave', 'Unpaid Leave', 'Half Day')
    ),
    notes TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (employee_code, attendance_date)
)
"""


def _ensure_table(cur):
    cur.execute(CREATE_TABLE)


def get_daily_attendance(day):
    conn = get_connection()
    cur = conn.cursor()
    try:
        _ensure_table(cur)
        conn.commit()
        cur.execute(
            """
            SELECT e.EmployeeCode AS "EmployeeCode",
                   e.FullName AS "FullName",
                   e.Department AS "Department",
                   a.attendance_id AS "AttendanceId",
                   a.status AS "Status",
                   a.notes AS "Notes"
              FROM Employees e
              LEFT JOIN attendance a
                ON a.employee_code = e.EmployeeCode
               AND a.attendance_date = %s
             WHERE e.IsActive = 1
             ORDER BY e.EmployeeCode
            """,
            (day,),
        )
        return [
            {
                "employee_code": row.EmployeeCode,
                "full_name": row.FullName,
                "department": row.Department,
                "attendance_id": row.AttendanceId,
                "status": row.Status,
                "notes": row.Notes or "",
            }
            for row in cur.fetchall()
        ]
    finally:
        cur.close()
        conn.close()


def save_daily_attendance(day, records):
    conn = get_connection()
    cur = conn.cursor()
    try:
        _ensure_table(cur)
        conn.commit()

        for record in records:
            code = str(record.get("employee_code", "")).strip()
            status = record.get("status")
            notes = str(record.get("notes", "")).strip()

            if not code or status not in STATUSES:
                raise ValueError("Each record needs an employee code and valid status.")

            cur.execute(
                "SELECT EmployeeCode FROM Employees WHERE EmployeeCode = %s AND IsActive = 1",
                (code,),
            )
            if not cur.fetchone():
                raise ValueError(f"Active employee not found: {code}")

            cur.execute(
                """
                INSERT INTO attendance (employee_code, attendance_date, status, notes)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (employee_code, attendance_date)
                DO UPDATE SET status = EXCLUDED.status,
                              notes = EXCLUDED.notes,
                              updated_at = NOW()
                """,
                (code, day, status, notes),
            )

        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


def update_attendance(attendance_id, status, notes=""):
    if status not in STATUSES:
        raise ValueError("Invalid attendance status.")

    conn = get_connection()
    cur = conn.cursor()
    try:
        _ensure_table(cur)
        conn.commit()
        cur.execute(
            """
            UPDATE attendance
               SET status = %s, notes = %s, updated_at = NOW()
             WHERE attendance_id = %s
            """,
            (status, str(notes).strip(), attendance_id),
        )
        conn.commit()
        return cur.rowcount > 0
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


def delete_attendance(attendance_id):
    conn = get_connection()
    cur = conn.cursor()
    try:
        _ensure_table(cur)
        conn.commit()
        cur.execute(
            "DELETE FROM attendance WHERE attendance_id = %s",
            (attendance_id,),
        )
        conn.commit()
        return cur.rowcount > 0
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


def get_monthly_payable_days(employee_code, month, year):
    conn = get_connection()
    cur = conn.cursor()
    try:
        _ensure_table(cur)
        conn.commit()
        cur.execute(
            """
            SELECT COUNT(*) AS "RecordCount",
                   COALESCE(SUM(CASE
                       WHEN status IN ('Present', 'Paid Leave') THEN 1
                       WHEN status = 'Half Day' THEN 0.5
                       ELSE 0
                   END), 0) AS "PayableDays"
              FROM attendance
             WHERE employee_code = %s
               AND EXTRACT(MONTH FROM attendance_date) = %s
               AND EXTRACT(YEAR FROM attendance_date) = %s
            """,
            (employee_code, month, year),
        )
        row = cur.fetchone()
        return int(row.RecordCount), float(row.PayableDays)
    finally:
        cur.close()
        conn.close()