import axios from 'axios';
import type { ScanResult } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 5 minutes for scanning operations
  withCredentials: false,
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.data);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('API Error Response:', error.response.data);
      console.error('Status:', error.response.status);
    } else if (error.request) {
      console.error('Network Error - No Response:', error.request);
    } else {
      console.error('Request Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Define error interface for better type safety
interface ApiError {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
    status?: number;
  };
  message?: string;
}

// Utility to check if a string is a likely scan ID (MongoDB ObjectId or UUID)
const isLikelyScanId = (value?: string) => {
  return !!value && (/^[a-f\d]{24}$/i.test(value) || /^[\w\d-]{36}$/.test(value));
};

export const scanWebsite = async (url: string): Promise<ScanResult> => {
  try {
    console.log('Scanning URL:', url);
    // Fixed: Added /api prefix to match Flask backend
    const response = await api.post('/scan', { url });
    console.log('Scan Response:', response.data);
    return response.data;
  } catch (error: unknown) {
    console.error('Scan Error:', error);
    const apiError = error as ApiError;
    const errorMessage = 
      apiError.response?.data?.error || 
      apiError.response?.data?.message || 
      'Failed to scan website. Please try again later.';
    throw new Error(errorMessage);
  }
};

export const getReport = async (id: string): Promise<ScanResult> => {
  if (!isLikelyScanId(id)) {
    throw new Error('Invalid scan ID provided to getReport.');
  }
  try {
    console.log('Fetching report for ID:', id);
    const response = await api.get(`/reports/${id}`);
    return response.data;
  } catch (error: unknown) {
    console.error('Get Report Error:', error);
    const apiError = error as ApiError;
    const errorMessage = 
      apiError.response?.data?.error || 
      apiError.response?.data?.message || 
      'Failed to fetch report. Please try again later.';
    throw new Error(errorMessage);
  }
};

export const getReports = async (limit = 10, skip = 0): Promise<ScanResult[]> => {
  try {
    const response = await api.get(`/reports?limit=${limit}&skip=${skip}`);
    return response.data;
  } catch (error: unknown) {
    console.error('Get Reports Error:', error);
    const apiError = error as ApiError;
    const errorMessage = 
      apiError.response?.data?.error || 
      apiError.response?.data?.message || 
      'Failed to fetch reports. Please try again later.';
    throw new Error(errorMessage);
  }
};

export const getRecentScans = async (limit = 10): Promise<ScanResult[]> => {
  try {
    const response = await api.get(`/recent-scans?limit=${limit}`);
    return response.data;
  } catch (error: unknown) {
    console.error('Get Recent Scans Error:', error);
    const apiError = error as ApiError;
    const errorMessage = 
      apiError.response?.data?.error || 
      apiError.response?.data?.message || 
      'Failed to fetch recent scans. Please try again later.';
    throw new Error(errorMessage);
  }
};

// Alternative endpoint for getting scan reports
export const getScanReport = async (id: string): Promise<ScanResult> => {
  if (!isLikelyScanId(id)) {
    throw new Error('Invalid scan ID provided to getScanReport.');
  }
  try {
    const response = await api.get(`/scan-report/${id}`);
    return response.data;
  } catch (error: unknown) {
    console.error('Get Scan Report Error:', error);
    const apiError = error as ApiError;
    const errorMessage = 
      apiError.response?.data?.error || 
      apiError.response?.data?.message || 
      'Failed to fetch scan report. Please try again later.';
    throw new Error(errorMessage);
  }
};

export const deleteScans = async (ids: string[]): Promise<{ deleted: number }> => {
  try {
    const response = await api.delete('/scans/delete', { data: { ids } });
    return response.data;
  } catch (error: unknown) {
    console.error('Delete Scans Error:', error);
    const apiError = error as ApiError;
    const errorMessage = 
      apiError.response?.data?.error || 
      apiError.response?.data?.message || 
      'Failed to delete scans. Please try again later.';
    throw new Error(errorMessage);
  }
};

// Health check function
export const checkHealth = async (): Promise<boolean> => {
  try {
    const response = await api.get('/health');
    return response.status === 200;
  } catch (error) {
    console.error('Health Check Failed:', error);
    return false;
  }
};

// Additional utility functions for better error handling
export const testConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.get('/health');
    return {
      success: true,
      message: `Connected to API. Status: ${response.data.status}`
    };
  } catch (error) {
    const apiError = error as ApiError;
    return {
      success: false,
      message: `Connection failed: ${apiError.message || 'Unknown error'}`
    };
  }
};