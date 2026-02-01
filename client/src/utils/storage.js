// localStorage 관련 상수 및 헬퍼 함수

export const STORAGE_KEYS = {
  TOKEN: 'token',
  TOKEN_EXPIRES_IN: 'tokenExpiresIn',
  TOKEN_EXPIRES_AT: 'tokenExpiresAt',
  USER: 'user',
  SAVED_EMAIL: 'savedEmail'
}

// 인증 관련 localStorage 정리
export const clearAuthStorage = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
}
