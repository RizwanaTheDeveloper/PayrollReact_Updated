const API_BASE = import.meta.env.DEV
  ? ""
  : import.meta.env.VITE_API_URL;

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  return data;
};

export const api = {
  login: (username, password) =>
    request("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  getEmployees: () => request("/employees"),

  getEmployee: (code) => request(`/employees/${code}`),

  addEmployee: (payload) =>
    request("/employees", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateEmployee: (code, payload) =>
    request(`/employees/${code}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteEmployee: (code) =>
    request(`/employees/${code}`, {
      method: "DELETE",
    }),

  getPayslip: (code, month, year) => {
    const query = new URLSearchParams();
    if (month) query.set("month", month);
    if (year) query.set("year", year);

    return request(
      `/payslip/${code}${query.toString() ? `?${query.toString()}` : ""}`
    );
  },

  getPayslipHistory: (code) =>
    request(`/payslip-history/${code}`),

  getAttendance: (day) =>
    request(`/attendance?date=${encodeURIComponent(day)}`),

  saveAttendance: (day, records) =>
    request("/attendance", {
      method: "POST",
      body: JSON.stringify({ date: day, records }),
    }),

  updateAttendance: (id, payload) =>
    request(`/attendance/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteAttendance: (id) =>
    request(`/attendance/${id}`, {
      method: "DELETE",
    }),
};