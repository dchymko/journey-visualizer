import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      window.location.href = '/';
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  initiateOAuth: () => {
    window.location.href = `${API_BASE_URL}/auth/kit`;
  },
};

// Account API
export const accountAPI = {
  getInfo: () => api.get('/api/account'),
  sync: () => api.post('/api/sync'),
  getSyncStatus: () => api.get('/api/sync/status'),
};

// Journey API
export const journeyAPI = {
  getFlows: () => api.get('/api/journey/flows'),
  analyze: () => api.post('/api/journey/analyze'),
};

// Dashboard API
export const dashboardAPI = {
  getMetrics: () => api.get('/api/dashboard/metrics'),
};

export default api;
