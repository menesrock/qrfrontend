import axios from 'axios';

// For Expo web, we need to use hardcoded values or Constants
// Use environment variable in production, fallback to localhost for development
const API_URL = process.env.REACT_APP_API_URL || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true, // Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any request modifications here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let canAttemptRefresh = false;

export const setRefreshAuthEnabled = (enabled: boolean) => {
  canAttemptRefresh = enabled;
};

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    const status = error.response?.status;
    const requestUrl: string = originalRequest?.url || '';

    // Avoid infinite retry loops on refresh endpoint or when no original request
    const isRefreshRequest = requestUrl.includes('/auth/refresh');

    // Handle 401 Unauthorized - try to refresh token once
    if (status === 401 && canAttemptRefresh && !originalRequest._retry && !isRefreshRequest) {
      originalRequest._retry = true;

      try {
        await api.post('/auth/refresh');
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        // This will be handled by the auth context
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
