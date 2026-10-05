// Real API checks in a disposable schema; existing employee data is untouched.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');
const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../src/config/db');
const { calcPayDays } = require('../src/utils/payDays');

async function main() {
  const schema = `leave_test_${process.pid}_${Date.now()}`;
  assert.match(schema, /^leave_test_\d+_\d+$/);
  const admin = new Client({ ...pool.options, connectionTimeoutMillis: 5000 });
  let server, schemaCreated = false;
  try {
    await admin.connect();
    await admin.query(`CREATE SCHEMA "${schema}"`);
    schemaCreated = true;
    pool.options.options = `-c search_path=${schema}`;
    await pool.query(fs.readFileSync(path.join(__dirname, '../src/schema.sql'), 'utf8'));
    const employee = (await pool.query(`INSERT INTO employees
      (emp_code,name,email,password_hash,role,basic,joining_date)
      VALUES ('TEST-E','Employee','employee@test.invalid','unused','employee',31000,'2020-01-01') RETURNING id`)).rows[0].id;
    const administrator = (await pool.query(`INSERT INTO employees
      (emp_code,name,email,password_hash,role)
      VALUES ('TEST-A','Admin','admin@test.invalid','unused','admin') RETURNING id`)).rows[0].id;
    const secret = process.env.JWT_SECRET || 'isolated-leave-test-secret';
    process.env.JWT_SECRET = secret;
    const token = jwt.sign({ id: administrator, role: 'admin' }, secret);
    const employeeToken = jwt.sign({ id: employee, role: 'employee' }, secret);
    const app = express();
    app.use(express.json());
    app.use('/attendance', require('../src/routes/attendance'));
    app.use('/leaves', require('../src/routes/leaves'));
    app.use('/payslips', require('../src/routes/payslips'));
    app.use((err, req, res, next) => res.status(500).json({ message: err.message }));
    server = await new Promise((resolve) => {
      const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
    });
    async function request(url, method = 'GET', body, auth = token, expected = 200) {
      const response = await fetch(`http://127.0.0.1:${server.address().port}${url}`, {
        method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}` },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const data = await response.json();
      assert.equal(response.status, expected, `${method} ${url}: ${JSON.stringify(data)}`);
      return data;
    }
    async function mark(day, status) {
      await request('/attendance/bulk', 'PUT', { work_date: `2026-01-${day}`,
        records: [{ employee_id: employee, status, day_type: 'full' }] });
    }
    // Pending requests do not consume the allowance; approved days do.
    const leave = await request('/leaves', 'POST', { leave_type: 'paid',
      start_date: '2026-01-10', end_date: '2026-01-12', reason: 'Test' }, employeeToken, 201);
    assert.equal((await calcPayDays(employee, 1, 2026, pool)).netPaidDays, 31);
    await request(`/leaves/${leave.id}/status`, 'PATCH', { status: 'approved' });
    const rows = await request('/attendance?month=1&year=2026');
    assert.deepEqual(rows.map((row) => row.status), ['absent', 'paid_leave', 'paid_leave']);
    assert.equal((await request('/attendance/my', 'GET', null, employeeToken))[0].status, 'absent');
    const day = (await request('/attendance/day?date=2026-01-12'))[0];
    assert.equal(day.status, 'absent');
    assert.equal(day.recorded_status, 'paid_leave', 'Saving unchanged attendance preserves its original leave mark');
    assert.equal((await calcPayDays(employee, 1, 2026, pool)).unpaidLeaveDays, 1);
    await request('/payslips/generate', 'POST', { employee_id: employee, month: 1, year: 2026 }, token, 201);
    let payslip = (await request('/payslips?month=1&year=2026'))[0];
    assert.equal(Number(payslip.deductions), 1000);
    assert.equal(Number(payslip.net_pay), 30000);
    await mark('05', 'leave');
    assert.equal((await calcPayDays(employee, 1, 2026, pool)).unpaidLeaveDays, 2, 'Backdated leave recalculates chronological allowance');
    await request('/payslips/generate', 'POST', { employee_id: employee, month: 1, year: 2026,
      mode: 'update', deductions: 50 }, token, 201);
    payslip = (await request('/payslips?month=1&year=2026'))[0];
    assert.equal(Number(payslip.deductions), 2050);
    assert.equal(Number(payslip.net_pay), 28950);
    await mark('05', 'present');
    await mark('10', 'present');
    assert.equal((await calcPayDays(employee, 1, 2026, pool)).unpaidLeaveDays, 0, 'Corrected attendance restores paid leave');
    const spanning = await request('/leaves', 'POST', { leave_type: 'casual',
      start_date: '2026-01-30', end_date: '2026-02-03', reason: 'Cross month' }, employeeToken, 201);
    await request(`/leaves/${spanning.id}/status`, 'PATCH', { status: 'approved' });
    assert.equal((await calcPayDays(employee, 2, 2026, pool)).unpaidLeaveDays, 1, 'Allowance resets each month');
    assert.equal((await calcPayDays(employee, 1, 2026, pool)).unpaidLeaveDays, 2);
    await mark('29', 'absent');
    assert.equal((await calcPayDays(employee, 1, 2026, pool)).unpaidLeaveDays, 3, 'Explicit unpaid days do not consume paid allowance');
    console.log('Passed: approval, two paid days, excess unpaid days, all attendance views, backdated edits, payroll deductions and updates, monthly reset and cross-month requests.');
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await pool.end();
    if (schemaCreated) await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
    await admin.end();
  }
}
main().catch((err) => { console.error(err.message); process.exitCode = 1; });
