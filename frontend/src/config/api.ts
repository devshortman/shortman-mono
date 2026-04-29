// frontend/src/config/api.ts
// API 설정 관리

const isDevelopment = import.meta.env.MODE === 'development';

export const API_BASE_URL = isDevelopment
  ? 'http://localhost:8000'
  : import.meta.env.VITE_API_BASE_URL || 'https://shortman-mono.onrender.com';

export const API_ENDPOINTS = {
  // Public
  REGIONAL_SHORTS:        `${API_BASE_URL}/api/v1/shorts/regional`,
  SHORTS:                 `${API_BASE_URL}/api/v1/shorts`,
  AD:                     `${API_BASE_URL}/api/v0/ad`,
  HEALTH:                 `${API_BASE_URL}/health`,
  PUBLIC_INITIATIVES:     `${API_BASE_URL}/api/v1/initiatives`,

  // Admin - Auth
  ADMIN_LOGIN:            `${API_BASE_URL}/admin/login`,
  ADMIN_ME:               `${API_BASE_URL}/admin/me`,

  // Admin - Keywords
  ADMIN_KEYWORDS:         `${API_BASE_URL}/admin/keywords`,

  // Admin - Schedule
  ADMIN_SCHEDULES:        `${API_BASE_URL}/admin/schedules`,

  // Admin - Shorts
  ADMIN_SHORTS:           `${API_BASE_URL}/admin/shorts`,
  ADMIN_SHORTS_BULK_HIDE: `${API_BASE_URL}/admin/shorts/bulk_hide`,
  ADMIN_SHORTS_BULK_DEL:  `${API_BASE_URL}/admin/shorts/bulk_delete`,

  // Admin - Initiative
  ADMIN_INITIATIVES:      `${API_BASE_URL}/admin/initiatives`,
  ADMIN_DEMOS:            `${API_BASE_URL}/admin/demos`,
  ADMIN_NOTICES:          `${API_BASE_URL}/admin/notices`,
  ADMIN_SUBMISSIONS:      `${API_BASE_URL}/admin/submissions`,

  // Admin - Users
  ADMIN_USERS:            `${API_BASE_URL}/admin/users`,
} as const;

// debug
console.log(`[API] mode=${import.meta.env.MODE} base=${API_BASE_URL}`);
