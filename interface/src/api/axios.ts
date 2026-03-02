import axios from 'axios';

const api = axios.create({
  baseURL: 'https://facility-booking-9u2i.onrender.com/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
