import axios from 'axios';

// 환경 변수에서 API URL 가져오기
const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  console.warn('⚠️ VITE_API_URL 환경 변수가 설정되지 않았습니다!');
  console.warn('Vercel Dashboard에서 VITE_API_URL을 설정해주세요.');
  console.warn('예: https://fornerds-icon-backend.vercel.app');
}

const client = axios.create({
  baseURL: (API_BASE_URL || 'https://fornerds-icon-backend.vercel.app') + '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default client;

