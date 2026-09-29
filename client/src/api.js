import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('token');

  if (t) {
    cfg.headers.Authorization = `Bearer ${t}`;
  }

  return cfg;
});

export async function downloadPayslip(id) {
  const res = await api.get(`/payslips/${id}/download`, {
    responseType: 'blob',
  });

  const url = URL.createObjectURL(res.data);

  const a = document.createElement('a');
  a.href = url;
  a.download = `payslip-${id}.pdf`;
  a.click();

  URL.revokeObjectURL(url);
}

export default api; 