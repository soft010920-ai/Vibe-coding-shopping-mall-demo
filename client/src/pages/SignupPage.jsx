import { useState } from 'react'
import { validateSignupForm } from '../utils/signupValidation'
import { getApiUrl } from '../utils/api'

export default function SignupPage({ onNavigateToMain }) {
  const emptyForm = {
    user_type: 'customer', // customer or admin
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    phone: '',
    postcode: '',
    baseAddress: '',
    detailAddress: '',
  }

  const [formData, setFormData] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleAddressSearch = () => {
    if (!window?.daum?.Postcode) {
      setErrorMessage('주소검색 기능을 불러올 수 없습니다. (daum postcode 스크립트 확인 필요)')
      return
    }

    new window.daum.Postcode({
      oncomplete: function (data) {
        setFormData((prev) => ({
          ...prev,
          postcode: data.zonecode,
          baseAddress: data.address,
        }))
      },
    }).open()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    const newErrors = validateSignupForm(formData)
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setLoading(true)

    try {
      const fullAddress = formData.baseAddress
        ? `${formData.baseAddress} ${formData.detailAddress || ''}`.trim()
        : formData.detailAddress || ''

      // server/controllers/usersController.js 참고: email, name, password, user_type, address
      const userData = {
        email: formData.email.trim().toLowerCase(),
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        user_type: formData.user_type,
        address: fullAddress,
      }

      const response = await fetch(getApiUrl('/api/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })

      let data = null
      try {
        data = await response.json()
      } catch (e) {
        data = null
      }

      if (response.ok) {
        setSuccessMessage('회원가입이 완료되었습니다!')
        setFormData(emptyForm)
        setTimeout(() => onNavigateToMain(), 1200)
      } else {
        setErrorMessage(data?.error || '회원가입에 실패했습니다.')
      }
    } catch (error) {
      console.error('회원가입 오류:', error)
      setErrorMessage('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-header">
          <h2>회원가입</h2>
          <button className="btn-back" onClick={onNavigateToMain} type="button">
            ← 돌아가기
          </button>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          {errorMessage && (
            <div className="message message-error">
              {errorMessage}
              <button className="close-btn" onClick={() => setErrorMessage('')} type="button">
                ×
              </button>
            </div>
          )}
          {successMessage && <div className="message message-success">{successMessage}</div>}

          <div className="form-group">
            <label className="form-label required">회원구분</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="user_type"
                  value="customer"
                  checked={formData.user_type === 'customer'}
                  onChange={handleChange}
                  disabled={loading}
                />
                <span>일반회원</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="user_type"
                  value="admin"
                  checked={formData.user_type === 'admin'}
                  onChange={handleChange}
                  disabled={loading}
                />
                <span>어드민회원</span>
              </label>
            </div>
            <p className="form-hint">
              일반회원: 일반 쇼핑몰 이용 / 어드민회원: 관리자 권한으로 상품 관리 및 시스템 관리
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="name" className="form-label required">
              이름
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="이름을 입력하세요"
              disabled={loading}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label required">
              이메일
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="이메일을 입력하세요"
              disabled={loading}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label required">
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="비밀번호를 입력하세요 (최소 6자)"
              disabled={loading}
            />
            <p className="form-hint">(영문 대소문자/숫자/특수문자 중 2가지 이상 조합, 6자 이상)</p>
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="passwordConfirm" className="form-label required">
              비밀번호 확인
            </label>
            <input
              type="password"
              id="passwordConfirm"
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleChange}
              className={`form-input ${errors.passwordConfirm ? 'error' : ''}`}
              placeholder="비밀번호를 다시 입력하세요"
              disabled={loading}
            />
            {errors.passwordConfirm && <span className="error-text">{errors.passwordConfirm}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label required">
              전화번호
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`form-input ${errors.phone ? 'error' : ''}`}
              placeholder="전화번호를 입력하세요 (예: 010-1234-5678)"
              disabled={loading}
            />
            {errors.phone && <span className="error-text">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">주소</label>
            <div className="address-group">
              <div className="address-row">
                <input
                  type="text"
                  name="postcode"
                  value={formData.postcode}
                  readOnly
                  className="form-input form-input-postcode"
                  placeholder="우편번호"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAddressSearch}
                  disabled={loading}
                >
                  주소검색
                </button>
              </div>
              <input
                type="text"
                name="baseAddress"
                value={formData.baseAddress}
                readOnly
                className="form-input"
                placeholder="기본주소"
                disabled={loading}
              />
              <input
                type="text"
                name="detailAddress"
                value={formData.detailAddress}
                onChange={handleChange}
                className="form-input"
                placeholder="나머지 주소(선택 입력 가능)"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-large" disabled={loading}>
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

