import axios from 'axios';

// Get API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For cookie-based auth if needed
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', error.message);
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        isNetworkError: true,
      });
    }

    // Extract error message from API response
    // Backend returns errors as: { status: 406, data: "error message" } where data can be a string
    let errorMessage = 'An error occurred';
    if (error.response?.data) {
      if (typeof error.response.data === 'string') {
        // Backend returns error message directly as string
        errorMessage = error.response.data;
      } else if (error.response.data.message) {
        // Error object with message property
        errorMessage = error.response.data.message;
      } else if (error.response.data.error) {
        // Error object with error property
        errorMessage = error.response.data.error;
      } else {
        // Try to stringify if it's an object
        errorMessage = JSON.stringify(error.response.data);
      }
    }
    
    // Return error with message from API
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

export default api;

