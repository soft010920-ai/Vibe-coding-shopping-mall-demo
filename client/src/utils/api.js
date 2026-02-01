/**
 * API 유틸리티 함수
 * 프로덕션 환경에서는 VITE_API_URL 환경변수를 사용하여 API 서버 URL을 설정합니다.
 * 개발 환경에서는 상대 경로를 사용합니다 (Vite proxy 사용).
 */

// API 기본 URL 설정
// 프로덕션: VITE_API_URL 환경변수 값 사용
// 개발: 빈 문자열 (상대 경로 사용, Vite proxy가 처리)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * API URL 생성 함수
 * @param {string} endpoint - API 엔드포인트 (예: '/api/auth/login')
 * @returns {string} - 전체 API URL
 */
export const getApiUrl = (endpoint) => {
  // endpoint가 이미 전체 URL인 경우 그대로 반환
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  
  // endpoint가 '/'로 시작하지 않으면 추가
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // API_BASE_URL이 있으면 사용, 없으면 상대 경로 반환
  return API_BASE_URL ? `${API_BASE_URL}${normalizedEndpoint}` : normalizedEndpoint;
};

/**
 * API 요청 헬퍼 함수
 * @param {string} endpoint - API 엔드포인트
 * @param {RequestInit} options - fetch 옵션
 * @returns {Promise<Response>} - fetch 응답
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  
  // 기본 헤더 설정
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  // Authorization 헤더 추가 (토큰이 있는 경우)
  const token = localStorage.getItem('token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  // 옵션의 헤더와 기본 헤더 병합
  const headers = {
    ...defaultHeaders,
    ...options.headers,
  };
  
  return fetch(url, {
    ...options,
    headers,
  });
};

/**
 * GET 요청 헬퍼 함수
 * @param {string} endpoint - API 엔드포인트
 * @param {RequestInit} options - 추가 fetch 옵션
 * @returns {Promise<Response>} - fetch 응답
 */
export const apiGet = async (endpoint, options = {}) => {
  return apiRequest(endpoint, {
    method: 'GET',
    ...options,
  });
};

/**
 * POST 요청 헬퍼 함수
 * @param {string} endpoint - API 엔드포인트
 * @param {object} data - 요청 본문 데이터
 * @param {RequestInit} options - 추가 fetch 옵션
 * @returns {Promise<Response>} - fetch 응답
 */
export const apiPost = async (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });
};

/**
 * PUT 요청 헬퍼 함수
 * @param {string} endpoint - API 엔드포인트
 * @param {object} data - 요청 본문 데이터
 * @param {RequestInit} options - 추가 fetch 옵션
 * @returns {Promise<Response>} - fetch 응답
 */
export const apiPut = async (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options,
  });
};

/**
 * DELETE 요청 헬퍼 함수
 * @param {string} endpoint - API 엔드포인트
 * @param {RequestInit} options - 추가 fetch 옵션
 * @returns {Promise<Response>} - fetch 응답
 */
export const apiDelete = async (endpoint, options = {}) => {
  return apiRequest(endpoint, {
    method: 'DELETE',
    ...options,
  });
};

/**
 * 응답 JSON 파싱 헬퍼 함수
 * @param {Response} response - fetch 응답
 * @returns {Promise<object>} - 파싱된 JSON 데이터
 */
export const parseJsonResponse = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error('JSON 파싱 오류:', error, '응답 텍스트:', text);
    throw new Error('서버 응답을 파싱할 수 없습니다.');
  }
};
