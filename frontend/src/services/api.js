import axios from 'axios';
const baseURL = import.meta.env.VITE_API_URL || 'https://live-customer-churn-risk-assessment.onrender.com/api';
const api = axios.create({ baseURL });
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('xeno_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
export default api;
