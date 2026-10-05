const num = (value) => Number(value) || 0;

export function scheduledLoanDeductions(loans, employeeId, period, existing) {
  return loans.filter((loan) => String(loan.employee_id) === String(employeeId)).flatMap((loan) => {
    const recorded = existing?.advance_recoveries?.find((entry) => String(entry.advance_id) === String(loan.id));
    if (recorded) return [{ advance_id: loan.id, amount: num(recorded.amount) }];
    const eligible = loan.status === 'approved'
      || (loan.status === 'active' && loan.disbursed_on?.slice(0, 7) <= period);
    if (!eligible || loan.first_recovery.slice(0, 7) > period || num(loan.outstanding) <= 0) return [];
    const finalInstalment = loan.instalment_count != null
      && (loan.period_recoveries?.length || 0) >= num(loan.instalment_count) - 1;
    const amount = finalInstalment ? num(loan.outstanding) : Math.min(num(loan.instalment), num(loan.outstanding));
    return [{ advance_id: loan.id, amount }];
  });
}

export function loanDeductionItems(payslip) {
  const loans = (payslip.advance_recoveries || []).map((entry) => ({
    label: `Loan LOAN-${entry.advance_id} (incl. interest)`, amount: num(entry.amount), id: entry.advance_id,
  }));
  const remaining = Math.round((num(payslip.advance) - loans.reduce((sum, entry) => sum + entry.amount, 0)) * 100) / 100;
  if (remaining > 0) loans.push({ label: loans.length ? 'Salary advance' : 'Loan / salary advance', amount: remaining, id: 'advance' });
  return loans;
}
