
const request = async (path, options = {}) => {
  const response = await fetch(`/api${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || `Request failed (${response.status})`
    );
  }

  return data;
};

export const api = {
  login: (username, password) =>
    request("/login", {
      method: "POST",
      body: JSON.stringify({
        username,
        password,
      }),
    }),

  getEmployees: () =>
    request("/employees"),

  getEmployee: (code) =>
    request(`/employees/${code}`),

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
      `/payslip/${code}${
        query.toString()
          ? `?${query.toString()}`
          : ""
      }`
    );
  },

  getPayslipHistory: (code) =>
    request(`/payslip-history/${code}`),
};

