import axios from 'axios';

// 환경 변수에서 API URL 가져오기
const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  console.error('⚠️ VITE_API_URL 환경 변수가 설정되지 않았습니다!');
  console.error('Vercel Dashboard에서 VITE_API_URL을 설정해주세요.');
  console.error('예: https://fornerds-icon-backend.vercel.app');
}

const client = axios.create({
  baseURL: (API_BASE_URL || 'https://fornerds-icon-backend.vercel.app') + '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// JWT 토큰이 있다면 헤더에 추가
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 401/403 에러 시 자동 로그아웃
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // 인증 에러 시 토큰 삭제 및 로그인 페이지로 리다이렉트
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;

