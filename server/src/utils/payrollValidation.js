function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function amount(value, label, fallback = 0) {
  if (value === undefined || value === null || value === '') return fallback;
  if (!['number', 'string'].includes(typeof value) || !/^\d+(\.\d{1,2})?$/.test(String(value).trim())) {
    fail(`${label} must be a non-negative amount with at most two decimal places.`);
  }
  const result = Number(value);
  if (!Number.isFinite(result) || result > 999999999.99) fail(`${label} is outside the supported amount range.`);
  return result;
}

function date(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number(value.slice(0, 4)) >= 2000 && Number(value.slice(0, 4)) <= 2100
    && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
    && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

function period(body) {
  for (const key of ['month', 'year']) {
    if (!['number', 'string'].includes(typeof body?.[key]) || !/^\d+$/.test(String(body[key]))) fail('A valid integer month and year are required.');
  }
  const month = Number(body?.month), year = Number(body?.year);
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000 || year > 2100) {
    fail('An integer month (1–12) and year (2000–2100) are required.');
  }
  const employeeId = body?.employee_id == null || body.employee_id === '' ? null : Number(body.employee_id);
  if (employeeId !== null && (!['number', 'string'].includes(typeof body.employee_id) || !/^\d+$/.test(String(body.employee_id)))) fail('A valid employee is required.');
  if (employeeId !== null && (!Number.isInteger(employeeId) || employeeId <= 0)) fail('A valid employee is required.');
  return { month, year, employeeId };
}

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
module.exports = { fail, amount, date, period, today };
