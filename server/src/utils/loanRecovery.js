// Serialize payroll and loan changes so balances cannot be recovered twice.
const LOCK = 'SELECT pg_advisory_xact_lock(5261901)';

async function planRecoveries(client, employeeId, month, year) {
  await client.query(`CREATE TEMP TABLE payroll_loan_plan ON COMMIT DROP AS
    SELECT a.id AS advance_id, a.employee_id,
      COALESCE(current_recovery.amount,
        CASE WHEN a.instalment_count IS NOT NULL AND totals.paid_count >= a.instalment_count - 1
          THEN a.amount + ROUND(a.amount * a.interest_percentage / 100, 2) * a.instalment_count - COALESCE(totals.recovered, 0)
          ELSE LEAST(a.instalment, a.amount + ROUND(a.amount * a.interest_percentage / 100, 2) * COALESCE(a.instalment_count, 1) - COALESCE(totals.recovered, 0)) END) AS amount
    FROM advances a
    LEFT JOIN LATERAL (
      SELECT SUM(r.amount) AS recovered, COUNT(*) AS paid_count FROM advance_recoveries r WHERE r.advance_id = a.id
    ) totals ON TRUE
    LEFT JOIN LATERAL (
      SELECT r.amount FROM advance_recoveries r JOIN payslips p ON p.id = r.payslip_id
      WHERE r.advance_id = a.id AND p.month = $2 AND p.year = $3
    ) current_recovery ON TRUE
    WHERE ($1::int IS NULL OR a.employee_id = $1)
      AND (current_recovery.amount IS NOT NULL OR (
        a.status IN ('approved', 'active') AND a.first_recovery <= make_date($3, $2, 1)
        AND (a.status = 'approved' OR a.disbursed_on < make_date($3, $2, 1) + INTERVAL '1 month')
        AND a.amount + ROUND(a.amount * a.interest_percentage / 100, 2) * COALESCE(a.instalment_count, 1) > COALESCE(totals.recovered, 0)))`, [employeeId, month, year]);
}

async function saveRecoveries(client, payslipIds) {
  await client.query(`INSERT INTO advance_recoveries (advance_id, payslip_id, amount)
    SELECT plan.advance_id, p.id, plan.amount FROM payroll_loan_plan plan
    JOIN payslips p ON p.employee_id = plan.employee_id
    WHERE p.id = ANY($1::int[])
    ON CONFLICT (advance_id, payslip_id) DO NOTHING`, [payslipIds]);
}

module.exports = { LOCK, planRecoveries, saveRecoveries };
