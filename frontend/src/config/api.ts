// frontend/src/config/api.ts
// API 설정 관리

const isDevelopment = import.meta.env.MODE === 'development';

export const API_BASE_URL = isDevelopment
  ? 'http://localhost:8000'
  : import.meta.env.VITE_API_BASE_URL || 'https://shortman-mono.onrender.com';

export const API_ENDPOINTS = {
  REGIONAL_SHORTS:  `${API_BASE_URL}/api/v1/shorts/regional`,
  SHORTS:           `${API_BASE_URL}/api/v1/shorts`,
  AD:               `${API_BASE_URL}/api/v0/ad`,
  HEALTH:           `${API_BASE_URL}/health`,

  // Admin
  ADMIN_LOGIN:      `${API_BASE_URL}/admin/login`,
  ADMIN_ME:         `${API_BASE_URL}/admin/me`,
  ADMIN_KEYWORDS:   `${API_BASE_URL}/admin/keywords`,
  ADMIN_SCHEDULES:  `${API_BASE_URL}/admin/schedules`,
} as const;

// debug
console.log(`[API] mode=${import.meta.env.MODE} base=${API_BASE_URL}`);
