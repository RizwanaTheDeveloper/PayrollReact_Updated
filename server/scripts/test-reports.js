// Verify the reporting API and client calculations against isolated real records.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { Client } = require('pg');
const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../src/config/db');

async function main() {
  const { buildReports, reportCsv, reportPreview } = await import(pathToFileURL(path.resolve(__dirname, '../../client/src/utils/reportData.js')));
  const schema = `report_test_${process.pid}_${Date.now()}`;
  assert.match(schema, /^report_test_\d+_\d+$/);
  const admin = new Client({ ...pool.options, connectionTimeoutMillis: 5000 });
  let server, schemaCreated = false;
  try {
    await admin.connect();
    await admin.query(`CREATE SCHEMA "${schema}"`);
    schemaCreated = true;
    pool.options.options = `-c search_path=${schema}`;
    await pool.query(fs.readFileSync(path.join(__dirname, '../src/schema.sql'), 'utf8'));
    const employee = (await pool.query(`INSERT INTO employees
      (emp_code,name,email,password_hash,role,department,designation,basic,joining_date)
      VALUES ('TEST-E','Employee A','employee@test.invalid','unused','employee','IT','Developer',25000,'2020-01-01') RETURNING id`)).rows[0].id;
    const administrator = (await pool.query(`INSERT INTO employees
      (emp_code,name,email,password_hash,role)
      VALUES ('TEST-A','Admin','admin@test.invalid','unused','admin') RETURNING id`)).rows[0].id;
    const newJoiner = (await pool.query(`INSERT INTO employees
      (emp_code,name,email,password_hash,role,department,joining_date)
      VALUES ('TEST-E2','=Formula','second@test.invalid','unused','employee','HR','2026-09-10') RETURNING id`)).rows[0].id;
    await pool.query(`INSERT INTO employees (emp_code,name,email,password_hash,department,joining_date,resignation_date,is_active)
      VALUES ('TEST-E3','Exit','exit@test.invalid','unused','HR','2020-01-01','2026-09-20',false),
      ('TEST-E4','Future','future@test.invalid','unused','IT','2026-10-01',NULL,true)`);
    const septemberSlip = (await pool.query(`INSERT INTO payslips
      (employee_id,month,year,basic,hra,epf,professional_tax,deductions,net_pay)
      VALUES ($1,9,2026,25000,8000,1800,200,1500,29500) RETURNING id`, [employee])).rows[0].id;
    await pool.query(`INSERT INTO payslips (employee_id,month,year,basic,net_pay)
      VALUES ($1,8,2026,30000,30000),($1,10,2026,40000,40000)`, [employee]);
    await pool.query(`INSERT INTO attendance (employee_id,work_date,status,check_in,check_out,day_type)
      VALUES ($1,'2026-09-01','leave',NULL,NULL,'full'),($1,'2026-09-02','paid_leave',NULL,NULL,'full'),
      ($1,'2026-09-03','leave',NULL,NULL,'full'),($1,'2026-09-04','present','2026-09-04 09:00','2026-09-04 18:00','full'),
      ($1,'2026-09-05','present','2026-09-05 09:00',NULL,'half'),
      ($1,'2026-09-06','present','2026-09-06 18:00','2026-09-06 09:00','full'),
      ($1,'2026-10-01','present',NULL,NULL,'full')`, [employee]);
    await pool.query(`INSERT INTO leaves (employee_id,leave_type,start_date,end_date,reason,status)
      VALUES ($1,'casual','2026-08-30','2026-09-03','Spanning request','approved'),
      ($1,'sick','2026-09-10','2026-09-11','Pending','pending'),
      ($1,'paid','2026-09-12','2026-09-12','Rejected','rejected')`, [employee]);
    const loan = (await pool.query(`INSERT INTO advances
      (employee_id,amount,instalment,first_recovery,reason,status,interest_percentage,instalment_count,created_at)
      VALUES ($1,10000,1200,'2026-08-01','Test','approved',2,10,'2026-08-01') RETURNING id`, [employee])).rows[0].id;
    await pool.query(`INSERT INTO advance_recoveries (advance_id,payslip_id,amount)
      SELECT $1,id,1200 FROM payslips WHERE employee_id=$2`, [loan, employee]);
    await pool.query(`UPDATE payslips SET advance=1200,net_pay=net_pay-1200 WHERE employee_id=$1`, [employee]);
    await pool.query(`INSERT INTO advance_events (advance_id,actor_id,action,note,created_at)
      VALUES ($1,$2,'approved','Test approval','2026-09-15'),($1,$2,'requested','Earlier request','2026-08-01')`, [loan, administrator]);
    const secret = process.env.JWT_SECRET || 'isolated-report-test-secret';
    process.env.JWT_SECRET = secret;
    const token = jwt.sign({ id: administrator, role: 'admin' }, secret);
    const employeeToken = jwt.sign({ id: employee, role: 'employee' }, secret);
    const app = express();
    app.use('/reports', require('../src/routes/reports'));
    app.use((err, req, res, next) => res.status(500).json({ message: err.message }));
    server = await new Promise((resolve) => {
      const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
    });
    async function request(query, auth = token, expected = 200) {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/reports${query}`, {
        headers: auth ? { Authorization: `Bearer ${auth}` } : {},
      });
      const data = await response.json();
      assert.equal(response.status, expected, JSON.stringify(data));
      return data;
    }
    await request('?period=2026-09', null, 401);
    await request('?period=2026-09', employeeToken, 403);
    for (const query of ['', '?period=2026-13', '?period=2026-00', '?period=1900-01', '?period=2026-09%27']) {
      await request(query, token, 400);
    }
    const data = await request('?period=2026-09');
    assert.equal(data.payslips.length, 2, 'Only selected and previous month salaries are returned');
    assert.equal(data.employees.length, 4, 'Administrators are excluded');
    assert.ok(data.employees.every((e) => !('password_hash' in e) && !('account_number' in e)), 'No sensitive employee fields');
    assert.equal(data.attendance.length, 6);
    assert.equal(data.attendance[2].status, 'absent', 'Third leave day is unpaid');
    assert.equal(data.leaves[0].period_days, 3, 'Cross-month requests are clipped');
    assert.equal(Number(data.loans[0].recovered), 2400, 'Future repayments are excluded');
    assert.equal(Number(data.loans[0].period_recovered), 1200);
    assert.equal(data.audit.length, 1);
    const reports = buildReports(data, { period: '2026-09' });
    const report = (id) => reports.find((r) => r.id === id);
    assert.deepEqual(report('monthly-payroll').rows[0], { employees: 1, gross: 33000, total_deductions: 4700, net: 28300 });
    assert.equal(report('register').rows[0].total_allowances, 8000);
    assert.equal(report('variance').rows[0].difference, 3000);
    assert.equal(report('variance').rows[0].change, 10);
    assert.match(reportPreview(report('register')), /Net pay:.*28,300/);
    assert.deepEqual(report('attendance-summary').rows[0], { present: 2.5, unpaid: 1, leave: 2, worked: 9, missing: 1 });
    assert.equal(report('worked-hours').rows[0].invalid, 1);
    assert.equal(report('balance').rows.find((r) => r.id === employee).balance, 0);
    const utilization = report('utilization').rows.find((r) => r.id === employee);
    assert.deepEqual([utilization.requested, utilization.approved, utilization.pending, utilization.rejected], [6, 3, 2, 1]);
    assert.equal(report('deduction-summary').rows[0].loan_recovery, '1200.00');
    assert.equal(report('deduction-summary').rows[0].salary_advance, 0);
    assert.deepEqual(report('headcount').rows[0], { opening: 2, joiners: 1, exits: 1, closing: 2 });
    assert.equal(report('employee-register').rows.length, 3);
    assert.equal(report('payslip-summary').rows[0].pending, 2);
    assert.equal(report('loan-register').rows[0].outstanding, 9600);
    assert.equal(report('loan-summary').rows[0].recovered, 1200);
    assert.equal(report('loan-audit').rows[0].actor, 'Admin');
    assert.ok(report('esi').unavailable && report('payment-summary').unavailable);
    const filtered = buildReports(data, { period: '2026-09', department: 'HR', employeeId: String(newJoiner) });
    assert.equal(filtered.find((r) => r.id === 'register').rows.length, 0);
    assert.equal(filtered.find((r) => r.id === 'employee-register').rows.length, 1);
    const csv = reportCsv(filtered.find((r) => r.id === 'employee-register'), { Period: 'September 2026' });
    assert.match(csv, /"'=Formula"/, 'CSV neutralizes formula text');
    const empty = buildReports({}, { period: '2026-01' });
    assert.equal(empty.find((r) => r.id === 'payroll-analytics').rows[0].average, 0);
    const rollover = buildReports({ ...data, payslips: [
      { employee_id: employee, year: 2025, month: 12, basic: 100 },
      { employee_id: employee, year: 2026, month: 1, basic: 110 },
    ] }, { period: '2026-01' });
    assert.equal(rollover.find((r) => r.id === 'variance').rows[0].change, 10);
    console.log(`Passed: report access controls, validation, period boundaries, ${reports.filter((r) => !r.unavailable).length} live reports, filters, payroll and attendance totals, leave balances, loan snapshots, headcount, variance, empty states and CSV safety.`);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await pool.end();
    if (schemaCreated) await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
    await admin.end();
  }
}
main().catch((err) => { console.error(err.stack); process.exitCode = 1; });
