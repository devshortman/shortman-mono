// frontend/src/config/api.ts
// API 설정 관리

const isDevelopment = import.meta.env.MODE === 'development';

export const API_BASE_URL = isDevelopment
  ? 'http://localhost:8000'
  : import.meta.env.VITE_API_BASE_URL || 'https://short-man-backend.onrender.com';

export const API_ENDPOINTS = {
  REGIONAL_SHORTS: `${API_BASE_URL}/api/v1/shorts/regional`,
  SHORTS:          `${API_BASE_URL}/api/v1/shorts`,
  AD:              `${API_BASE_URL}/api/v0/ad`,
  HEALTH:          `${API_BASE_URL}/health`,
} as const;

// debug
console.log(`[API] mode=${import.meta.env.MODE} base=${API_BASE_URL}`);
