const PAID_LEAVE_DAYS_PER_MONTH = 2;

// Keep the original marks so editing an earlier day can restore the allowance.
// Rank the entire month before applying any attendance endpoint filters.
const attendanceWithLeavePolicy = `
  WITH ranked_attendance AS (
    SELECT a.*,
      COUNT(*) FILTER (WHERE a.status IN ('leave', 'paid_leave')
        AND (e.joining_date IS NULL OR a.work_date >= e.joining_date)
        AND (e.resignation_date IS NULL OR a.work_date <= e.resignation_date)) OVER (
        PARTITION BY a.employee_id, date_trunc('month', a.work_date)
        ORDER BY a.work_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ) AS leave_day_number
    FROM attendance a
    JOIN employees e ON e.id = a.employee_id
  ), policy_attendance AS (
    SELECT id, employee_id, work_date, status AS recorded_status,
      CASE WHEN status IN ('leave', 'paid_leave')
                  AND leave_day_number > ${PAID_LEAVE_DAYS_PER_MONTH}
           THEN 'absent' ELSE status END AS status,
      day_type, note, check_in, check_out
    FROM ranked_attendance
  )
`;

module.exports = { PAID_LEAVE_DAYS_PER_MONTH, attendanceWithLeavePolicy };
