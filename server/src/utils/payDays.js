// server/src/utils/payDays.js
const pad = (n) => String(n).padStart(2, '0');

/* ---- Adjust these to match your tables ---- */
const ATT = { table: 'attendance', emp: 'employee_id', date: 'work_date', status: 'status' };
const ATT_UNPAID = ['absent', 'lop', 'unpaid'];            // attendance statuses that are not paid
const LEAVE = { table: 'leaves', emp: 'employee_id', from: 'start_date', to: 'end_date',
                status: 'status', type: 'leave_type' };
const LEAVE_UNPAID_TYPE = /unpaid|lop|loss/i;              // leave types that are not paid

async function calcPayDays(employeeId, month, year, db) {
  month = Number(month);
  year = Number(year);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12)
    throw new Error(`calcPayDays: invalid month/year (${month}, ${year})`);

  const monthDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const prefix = `${year}-${pad(month)}-`;
  const startStr = `${prefix}01`;
  const endStr = `${prefix}${pad(monthDays)}`;

  const { rows: emp } = await db.query(
    `SELECT to_char(joining_date,'YYYY-MM-DD') AS joining_date,
            to_char(resignation_date,'YYYY-MM-DD') AS resignation_date
     FROM employees WHERE id=$1`, [employeeId]);
  const joining_date = emp[0]?.joining_date || null;
  const resignation_date = emp[0]?.resignation_date || null;

  const none = { monthDays, employedDays: 0, netPaidDays: 0, joining_date, resignation_date };
  let first = 1, last = monthDays;

  if (joining_date) {
    if (joining_date > endStr) return none;
    if (joining_date >= startStr) first = Number(joining_date.slice(8, 10));
  }
  if (resignation_date) {
    if (resignation_date < startStr) return none;
    if (resignation_date <= endStr) last = Number(resignation_date.slice(8, 10));
  }
  const employedDays = Math.max(0, last - first + 1);

  const absent = new Set();

  // Attendance rows marked absent / LOP
  const { rows: att } = await db.query(
    `SELECT to_char(${ATT.date},'YYYY-MM-DD') AS d, LOWER(${ATT.status}::text) AS s
     FROM ${ATT.table} WHERE ${ATT.emp}=$1 AND ${ATT.date} BETWEEN $2 AND $3`,
    [employeeId, startStr, endStr]);
  for (const a of att) if (ATT_UNPAID.includes(a.s)) absent.add(Number(a.d.slice(8, 10)));

  // Approved unpaid leaves
  const { rows: lv } = await db.query(
    `SELECT to_char(${LEAVE.from},'YYYY-MM-DD') AS f, to_char(${LEAVE.to},'YYYY-MM-DD') AS t,
            ${LEAVE.type}::text AS type
     FROM ${LEAVE.table}
     WHERE ${LEAVE.emp}=$1 AND ${LEAVE.status}='approved'
       AND ${LEAVE.from} <= $3 AND ${LEAVE.to} >= $2`,
    [employeeId, startStr, endStr]);
  for (const l of lv) {
    if (!LEAVE_UNPAID_TYPE.test(l.type || '')) continue;
    const from = l.f < startStr ? 1 : Number(l.f.slice(8, 10));
    const to = l.t > endStr ? monthDays : Number(l.t.slice(8, 10));
    for (let d = from; d <= to; d++) absent.add(d);
  }

  let absentInRange = 0;
  for (const d of absent) if (d >= first && d <= last) absentInRange++;

  return {
    monthDays,
    employedDays,
    netPaidDays: Math.max(0, employedDays - absentInRange),
    joining_date,
    resignation_date,
  };
}

module.exports = { calcPayDays };