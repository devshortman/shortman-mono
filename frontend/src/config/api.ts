// frontend/src/config/api.ts
// API 설정 관리

const isDevelopment = import.meta.env.MODE === 'development';
const isProduction = import.meta.env.MODE === 'production';

// 환경별 API URL
export const API_BASE_URL = isDevelopment
  ? 'http://localhost:8000'  // 로컬 개발
  : import.meta.env.VITE_API_BASE_URL || 'https://shortman-mono.onrender.com';  // 프로덕션

// API 엔드포인트
export const API_ENDPOINTS = {
  REGIONAL_SHORTS: `${API_BASE_URL}/api/v1/shorts/regional`,
  SHORTS: `${API_BASE_URL}/api/v1/shorts`,
  HEALTH: `${API_BASE_URL}/health`,
} as const;

// 디버그 로그
console.log(`[API Config] Environment: ${import.meta.env.MODE}`);
console.log(`[API Config] Base URL: ${API_BASE_URL}`);
