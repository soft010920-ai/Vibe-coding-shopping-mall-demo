import { useState, useEffect } from 'react'
import './LoginPage.css'
import { getApiUrl } from '../utils/api'

export default function LoginPage({ onNavigateToMain, onNavigateToSignup }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberId: false
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
    if (errorMessage) {
      setErrorMessage('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setErrors({})

    // 클라이언트 측 기본 검증 (서버와 동일한 검증 로직)
    const newErrors = {}
    if (!formData.email || formData.email.trim() === '') {
      newErrors.email = '이메일(email)은 필수입니다.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '유효한 이메일 주소를 입력해주세요.'
    }

    if (!formData.password || formData.password.trim() === '') {
      newErrors.password = '비밀번호(password)는 필수입니다.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)

    try {
      // 서버의 /api/auth/login 엔드포인트 호출
      const response = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      })

      let data = null
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('응답 파싱 오류:', parseError)
        data = null
      }

      if (response.ok) {
        // 서버 응답 형식: { message, token, tokenExpiresIn, tokenExpiresAt, user }
        
        // JWT 토큰 저장
        if (data.token) {
          localStorage.setItem('token', data.token)
          if (data.tokenExpiresIn) {
            localStorage.setItem('tokenExpiresIn', data.tokenExpiresIn)
          }
          if (data.tokenExpiresAt) {
            localStorage.setItem('tokenExpiresAt', data.tokenExpiresAt)
          }
        }

        // 아이디 저장 기능
        if (formData.rememberId) {
          localStorage.setItem('savedEmail', formData.email.trim().toLowerCase())
        } else {
          localStorage.removeItem('savedEmail')
        }

        // 사용자 정보 저장
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user))
        }

        // 성공 메시지 표시
        setSuccessMessage(data.message || '로그인에 성공했습니다.')
        
        // 1초 후 메인 페이지로 이동
        setTimeout(() => {
          if (onNavigateToMain) {
            onNavigateToMain()
          }
        }, 1000)
      } else {
        // 서버 에러 응답 형식: { error, details? }
        const errorMsg = data?.error || '로그인에 실패했습니다.'
        const errorDetails = data?.details ? ` (${data.details})` : ''
        setErrorMessage(errorMsg + errorDetails)
        
        // 특정 필드 에러가 있는 경우 표시
        if (data?.details) {
          console.error('로그인 실패 상세:', data.details)
        }
      }
    } catch (error) {
      console.error('로그인 네트워크 오류:', error)
      setErrorMessage('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.')
    } finally {
      setLoading(false)
    }
  }

  // 토큰 확인 및 유효성 검증
  useEffect(() => {
    const checkTokenAndRedirect = async () => {
      const token = localStorage.getItem('token')
      
      if (!token) {
        // 토큰이 없으면 저장된 아이디만 불러오기
        const savedEmail = localStorage.getItem('savedEmail')
        if (savedEmail) {
          setFormData((prev) => ({
            ...prev,
            email: savedEmail,
            rememberId: true,
          }))
        }
        return
      }

      // 토큰이 있으면 유효성 검증
      try {
        const response = await fetch(getApiUrl('/api/auth/me'), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          // 토큰이 유효하고 유저 정보를 가져올 수 있으면 메인 페이지로 리다이렉트
          const data = await response.json()
          if (data.user) {
            // 유저 정보를 localStorage에 업데이트
            localStorage.setItem('user', JSON.stringify(data.user))
            // 메인 페이지로 이동
            if (onNavigateToMain) {
              onNavigateToMain()
            }
            return
          }
        } else {
          // 토큰이 만료되었거나 유효하지 않은 경우
          if (response.status === 401) {
            // 만료된 토큰 제거
            localStorage.removeItem('token')
            localStorage.removeItem('tokenExpiresIn')
            localStorage.removeItem('tokenExpiresAt')
            localStorage.removeItem('user')
          }
        }
      } catch (error) {
        console.error('토큰 검증 오류:', error)
        // 네트워크 오류 등으로 검증 실패 시 토큰 제거하지 않고 로그인 페이지 유지
      }

      // 토큰이 없거나 유효하지 않으면 저장된 아이디 불러오기
      const savedEmail = localStorage.getItem('savedEmail')
      if (savedEmail) {
        setFormData((prev) => ({
          ...prev,
          email: savedEmail,
          rememberId: true,
        }))
      }
    }

    checkTokenAndRedirect()
  }, [onNavigateToMain])

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">로그인</h1>

        <form onSubmit={handleSubmit} className="login-form">
          {errorMessage && (
            <div className="message message-error">
              {errorMessage}
              <button
                className="close-btn"
                onClick={() => setErrorMessage('')}
                type="button"
              >
                ×
              </button>
            </div>
          )}
          {successMessage && (
            <div className="message message-success">
              {successMessage}
            </div>
          )}

          <div className="login-input-group">
            <div className="input-row">
              <label htmlFor="email" className="input-label">
                아이디
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`login-input ${errors.email ? 'error' : ''}`}
                placeholder="이메일을 입력하세요"
                disabled={loading}
              />
            </div>

            <div className="input-row">
              <label htmlFor="password" className="input-label">
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`login-input ${errors.password ? 'error' : ''}`}
                placeholder="비밀번호를 입력하세요"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn-login"
              disabled={loading}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </div>

          <div className="login-options">
            <div className="login-links">
              <button
                type="button"
                className="link-btn"
                onClick={() => alert('아이디 찾기 기능은 준비 중입니다.')}
              >
                아이디찾기
              </button>
              <span className="divider">|</span>
              <button
                type="button"
                className="link-btn"
                onClick={() => alert('비밀번호 찾기 기능은 준비 중입니다.')}
              >
                비밀번호찾기
              </button>
            </div>
            <div className="login-checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rememberId"
                  checked={formData.rememberId}
                  onChange={handleChange}
                  disabled={loading}
                />
                <span>아이디 저장</span>
              </label>
              <div className="secure-connection">
                <span className="secure-icon">🔒</span>
                <span>보안접속</span>
              </div>
            </div>
          </div>
        </form>

        <div className="sns-login-section">
          <h3 className="sns-title">SNS 계정 로그인</h3>
          <div className="sns-buttons">
            <button
              type="button"
              className="sns-btn sns-naver"
              onClick={() => alert('네이버 로그인은 준비 중입니다.')}
            >
              <span className="sns-icon">N</span>
              <span>네이버</span>
            </button>
            <button
              type="button"
              className="sns-btn sns-kakao"
              onClick={() => alert('카카오 로그인은 준비 중입니다.')}
            >
              <span className="sns-icon">K</span>
              <span>카카오</span>
            </button>
            <button
              type="button"
              className="sns-btn sns-facebook"
              onClick={() => alert('페이스북 로그인은 준비 중입니다.')}
            >
              <span className="sns-icon">f</span>
              <span>페이스북</span>
            </button>
          </div>
        </div>

        <div className="membership-section">
          <p className="membership-question">
            아직 회원이 아니신가요?
          </p>
          <p className="membership-description">
            회원가입하고 다양한 혜택과 서비스를 이용하세요.
          </p>
          <div className="membership-buttons">
            <button
              type="button"
              className="btn-membership btn-signup"
              onClick={onNavigateToSignup}
            >
              회원가입
            </button>
            <button
              type="button"
              className="btn-membership btn-nonmember"
              onClick={() => alert('비회원 주문조회 기능은 준비 중입니다.')}
            >
              비회원 주문조회
            </button>
          </div>
          <div className="benefits-cards">
            <div className="benefit-card">
              <div className="benefit-icon">🎁</div>
              <div className="benefit-text">
                신규회원 웰컴혜택
                <br />
                <strong>3,000P</strong>
              </div>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">💰</div>
              <div className="benefit-text">
                구매후기 적립금
                <br />
                <strong>1%</strong>
              </div>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">📦</div>
              <div className="benefit-text">
                원단 샘플 발송
                <br />
                <strong>FREE</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
