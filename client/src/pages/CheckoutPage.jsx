import { useState, useEffect, useCallback, useRef } from 'react'
import './OrderPage.css' // OrderPage와 동일한 스타일 사용
import TopBanner from '../components/TopBanner'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { STORAGE_KEYS, clearAuthStorage } from '../utils/storage'
import { getApiUrl } from '../utils/api'

export default function CheckoutPage({ 
  cartItemIds, 
  onNavigateToMain, 
  onNavigateToLogin, 
  onNavigateToSignup, 
  onNavigateToAdmin,
  onNavigateToOrderComplete,
  onNavigateToOrderFailed,
  onNavigateToMyOrders
}) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cartItems, setCartItems] = useState([])
  const [cartLoading, setCartLoading] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [cartCount, setCartCount] = useState(0)
  const dropdownRef = useRef(null)

  // 배송지 정보
  const [shipping, setShipping] = useState({
    recipientName: '',
    recipientPhone: '',
    phonePrefix: '010',
    phoneMiddle: '',
    phoneLast: '',
    address: '',
    addressDetail: '',
    postalCode: '',
    deliveryRequest: '',
    email: '',
    emailDomain: '',
    emailCustom: ''
  })

  // 결제 정보
  const [payment, setPayment] = useState({
    method: '무통장입금',
    bank: '',
    depositorName: '',
    cashReceipt: '신청안함'
  })

  // 약관 동의
  const [agreements, setAgreements] = useState({
    all: false,
    terms: false,
    privacy: false,
    purchase: false
  })

  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // 포트원(아임포트) 초기화
  useEffect(() => {
    if (window.IMP) {
      window.IMP.init('imp11374677')
      console.log('포트원 초기화 완료')
    } else {
      console.error('포트원 스크립트가 로드되지 않았습니다.')
    }
  }, [])

  // 토큰으로 유저 정보 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      
      if (!token) {
        setLoading(false)
        if (onNavigateToLogin) onNavigateToLogin()
        return
      }

      try {
        const response = await fetch(getApiUrl('/api/auth/me'), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setUser(data.user)
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user))
            
            // 사용자 정보로 배송지 정보 초기화
            setShipping(prev => ({
              ...prev,
              recipientName: data.user.name || '',
              recipientPhone: data.user.phone || '',
              email: data.user.email || '',
              address: data.user.address || ''
            }))
          }
        } else {
          if (response.status === 401) {
            clearAuthStorage()
            if (onNavigateToLogin) onNavigateToLogin()
          }
        }
      } catch (error) {
        console.error('유저 정보 조회 오류:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserInfo()
  }, [onNavigateToLogin])

  // 장바구니 항목 가져오기
  useEffect(() => {
    const fetchCartItems = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      if (!token) {
        setCartLoading(false)
        return
      }

      setCartLoading(true)
      try {
        const response = await fetch(getApiUrl('/api/cart'), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          const items = data.items || []
          
          // cartItemIds가 있으면 해당 항목만 필터링, 없으면 전체
          if (cartItemIds && cartItemIds.length > 0) {
            setCartItems(items.filter(item => cartItemIds.includes(item._id)))
          } else {
            setCartItems(items)
          }
        } else {
          if (response.status === 401) {
            clearAuthStorage()
            if (onNavigateToLogin) onNavigateToLogin()
          }
        }
      } catch (error) {
        console.error('장바구니 조회 오류:', error)
      } finally {
        setCartLoading(false)
      }
    }

    if (user) {
      fetchCartItems()
    }
  }, [user, cartItemIds, onNavigateToLogin])

  // 장바구니 개수 업데이트
  useEffect(() => {
    if (cartItems.length >= 0) {
      setCartCount(cartItems.length)
    }
  }, [cartItems])

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev)
  }, [])

  // 로그아웃 함수
  const handleLogout = useCallback(() => {
    clearAuthStorage()
    setUser(null)
    setIsDropdownOpen(false)
    if (onNavigateToLogin) {
      onNavigateToLogin()
    }
  }, [onNavigateToLogin])

  const handleMyPageClick = useCallback(() => {
    setIsDropdownOpen(false)
    alert('마이페이지 기능은 준비 중입니다.')
  }, [])

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value)
  }, [])

  const handleSearch = useCallback(() => {
    if (onNavigateToMain) onNavigateToMain()
  }, [onNavigateToMain])

  // 배송지 정보 변경 핸들러
  const handleShippingChange = (field, value) => {
    setShipping(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // 결제 수단 변경
  const handlePaymentMethodChange = (method) => {
    setPayment(prev => ({ ...prev, method }))
  }

  // 약관 동의 변경
  const handleAgreementChange = (field) => {
    if (field === 'all') {
      const newValue = !agreements.all
      setAgreements({
        all: newValue,
        terms: newValue,
        privacy: newValue,
        purchase: newValue
      })
    } else {
      const newValue = !agreements[field]
      setAgreements(prev => {
        const updated = { ...prev, [field]: newValue }
        updated.all = updated.terms && updated.privacy && updated.purchase
        return updated
      })
    }
  }

  // 총 금액 계산
  const itemsTotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0)
  const shippingFee = itemsTotal >= 50000 ? 0 : 3000
  const discountAmount = 0
  const finalAmount = itemsTotal + shippingFee - discountAmount

  // 주문 생성 (무통장입금의 경우)
  const createOrder = async (transactionId = '') => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (!token) {
      alert('로그인이 필요합니다.')
      if (onNavigateToLogin) onNavigateToLogin()
      return false
    }

    // 전화번호 조합 (빈 값 체크)
    const phoneMiddle = shipping.phoneMiddle?.trim() || ''
    const phoneLast = shipping.phoneLast?.trim() || ''
    let phone = ''
    
    if (phoneMiddle && phoneLast) {
      phone = `${shipping.phonePrefix}-${phoneMiddle}-${phoneLast}`
    } else if (shipping.recipientPhone && shipping.recipientPhone.trim()) {
      phone = shipping.recipientPhone.trim()
    } else {
      // 전화번호가 없으면 에러 반환
      alert('휴대전화 번호를 입력해주세요.')
      setSubmitting(false)
      return false
    }
    
    // 전화번호 유효성 검사
    if (!phone || phone.trim().length === 0) {
      alert('휴대전화 번호를 입력해주세요.')
      setSubmitting(false)
      return false
    }

    // 필수 필드 최종 검증
    if (!shipping.recipientName || !shipping.recipientName.trim()) {
      alert('받는사람 이름을 입력해주세요.')
      setSubmitting(false)
      return false
    }
    
    if (!shipping.address || !shipping.address.trim()) {
      alert('배송 주소를 입력해주세요.')
      setSubmitting(false)
      return false
    }
    
    if (!phone || !phone.trim()) {
      alert('휴대전화 번호를 입력해주세요.')
      setSubmitting(false)
      return false
    }

    const orderData = {
      cartItemIds: cartItems.map(item => item._id),
      shipping: {
        recipientName: shipping.recipientName.trim(),
        recipientPhone: phone.trim(),
        address: shipping.address.trim(),
        addressDetail: shipping.addressDetail?.trim() || '',
        postalCode: shipping.postalCode?.trim() || '',
        deliveryRequest: shipping.deliveryRequest?.trim() || '',
        shippingFee: Number(shippingFee) || 0
      },
      payment: {
        method: payment.method,
        status: transactionId ? '결제완료' : '결제대기',
        amount: Number(finalAmount),
        transactionId: transactionId || ''
      },
      amounts: {
        discountAmount: Number(discountAmount) || 0,
        finalAmount: Number(finalAmount)
      }
    }

    console.log('주문 데이터:', orderData)

    try {
      console.log('주문 요청 데이터:', JSON.stringify(orderData, null, 2))
      
      const response = await fetch(getApiUrl('/api/orders'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })

      const responseText = await response.text()
      console.log('=== 서버 응답 정보 ===')
      console.log('상태 코드:', response.status, response.statusText)
      console.log('응답 본문:', responseText)
      console.log('==================')

      if (response.ok) {
        const data = JSON.parse(responseText)
        setSubmitting(false)
        if (onNavigateToOrderComplete) {
          onNavigateToOrderComplete(data.order._id)
        } else {
          alert('주문이 완료되었습니다.')
          if (onNavigateToMain) onNavigateToMain()
        }
        return true
      } else {
        let errorData = {}
        try {
          errorData = JSON.parse(responseText)
        } catch (e) {
          console.error('응답 파싱 오류:', e, responseText)
          errorData = { error: '서버 응답을 파싱할 수 없습니다.', details: responseText }
        }
        
        const errorMessage = errorData.error || '주문 생성에 실패했습니다.'
        const errorDetails = errorData.details 
          ? (Array.isArray(errorData.details) ? errorData.details.join('\n') : String(errorData.details))
          : ''
        
        console.error('=== 주문 생성 실패 상세 ===')
        console.error('요청 데이터:', JSON.stringify(orderData, null, 2))
        console.error('에러 정보:', errorData)
        console.error('상태:', response.status, response.statusText)
        console.error('========================')
        
        // 주문 실패 페이지로 이동
        const fullErrorMessage = errorDetails 
          ? `${errorMessage}\n\n${errorDetails}`
          : errorMessage
        
        setSubmitting(false)
        
        // 주문 실패 페이지로 이동
        if (onNavigateToOrderFailed) {
          onNavigateToOrderFailed(fullErrorMessage)
        } else {
          alert(fullErrorMessage)
          if (onNavigateToMain) onNavigateToMain()
        }
        return false
      }
    } catch (error) {
      console.error('주문 생성 오류:', error)
      alert('주문 생성 중 오류가 발생했습니다.')
      return false
    }
  }

  // 포트원 결제 요청
  const requestPayment = () => {
    if (!window.IMP) {
      alert('결제 모듈을 불러올 수 없습니다. 페이지를 새로고침해주세요.')
      setSubmitting(false)
      return
    }

    // 전화번호 조합
    const phoneMiddle = shipping.phoneMiddle?.trim() || ''
    const phoneLast = shipping.phoneLast?.trim() || ''
    const phone = phoneMiddle && phoneLast 
      ? `${shipping.phonePrefix}-${phoneMiddle}-${phoneLast}`
      : shipping.recipientPhone || ''

    // 이메일 조합
    const email = shipping.emailDomain && shipping.emailDomain !== 'custom'
      ? `${shipping.email}@${shipping.emailDomain}`
      : shipping.emailDomain === 'custom' && shipping.emailCustom
        ? `${shipping.email}@${shipping.emailCustom}`
        : shipping.email || ''

    // merchant_uid 생성 (상점에서 관리하는 주문 번호)
    const merchantUid = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 결제 수단에 따른 pg 설정
    let pg = ''
    let payMethod = ''
    
    switch (payment.method) {
      case '카드결제':
        pg = 'html5_inicis'
        payMethod = 'card'
        break
      case '실시간 계좌이체':
        pg = 'html5_inicis'
        payMethod = 'trans'
        break
      case '가상계좌':
        pg = 'html5_inicis'
        payMethod = 'vbank'
        break
      case '간편결제':
        pg = 'kakaopay'
        payMethod = 'kakaopay'
        break
      default:
        pg = 'html5_inicis'
        payMethod = 'card'
    }

    // 상품명 생성
    const productName = cartItems.length === 1 
      ? cartItems[0].product?.name || '상품'
      : `${cartItems[0].product?.name || '상품'} 외 ${cartItems.length - 1}개`

    const IMP = window.IMP
    IMP.request_pay({
      pg : pg,
      pay_method : payMethod,
      merchant_uid: merchantUid, // 상점에서 관리하는 주문 번호
      name : `주문명:${productName}`,
      amount : finalAmount,
      buyer_email : email,
      buyer_name : shipping.recipientName,
      buyer_tel : phone,
      buyer_addr : shipping.address,
      buyer_postcode : shipping.postalCode || '',
      m_redirect_url : `${window.location.origin}/order-complete` // 모바일에서 결제 완료 후 리디렉션 될 URL
    }, async function(rsp) { // callback 로직
      if (rsp.success) {
        // 결제 성공 시 주문 생성
        console.log('결제 성공:', rsp)
        const success = await createOrder(rsp.imp_uid)
        if (success) {
          // submitting 상태는 createOrder 내부에서 처리됨
        } else {
          setSubmitting(false)
        }
      } else {
        // 결제 실패
        console.error('결제 실패:', rsp)
        alert(`결제에 실패했습니다.\n에러 메시지: ${rsp.error_msg || '알 수 없는 오류'}`)
        setSubmitting(false)
      }
    })
  }

  // 주문 생성
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    // 유효성 검사
    const newErrors = {}
    
    if (!shipping.recipientName.trim()) {
      newErrors.recipientName = '받는사람을 입력해주세요.'
    }
    
    if (!shipping.postalCode.trim()) {
      newErrors.postalCode = '우편번호를 입력해주세요.'
    }
    
    if (!shipping.address.trim()) {
      newErrors.address = '주소를 입력해주세요.'
    }
    
    const phone = `${shipping.phonePrefix}-${shipping.phoneMiddle}-${shipping.phoneLast}`
    if (!shipping.phoneMiddle || !shipping.phoneLast) {
      newErrors.recipientPhone = '휴대전화 번호를 입력해주세요.'
    }

    if (payment.method === '무통장입금') {
      if (!payment.bank) {
        newErrors.bank = '입금은행을 선택해주세요.'
      }
      if (!payment.depositorName.trim()) {
        newErrors.depositorName = '입금자명을 입력해주세요.'
      }
    }

    if (!agreements.terms || !agreements.privacy) {
      newErrors.agreements = '필수 약관에 동의해주세요.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    if (cartItems.length === 0) {
      alert('주문할 상품이 없습니다.')
      return
    }

    setSubmitting(true)

    try {
      // 전화번호 최종 확인 (createOrder에서도 사용)
      const finalPhone = phone || (phoneMiddle && phoneLast 
        ? `${shipping.phonePrefix}-${phoneMiddle}-${phoneLast}`
        : shipping.recipientPhone || '')
      
      if (!finalPhone || !finalPhone.trim()) {
        alert('휴대전화 번호를 입력해주세요.')
        setSubmitting(false)
        return
      }

      // 무통장입금은 포트원 없이 바로 주문 생성
      if (payment.method === '무통장입금') {
        await createOrder()
      } else {
        // 카드결제, 계좌이체, 가상계좌, 간편결제는 포트원 사용
        requestPayment()
        // 포트원은 비동기 콜백으로 처리되므로 여기서는 submitting을 false로 하지 않음
        return
      }
    } catch (error) {
      console.error('주문 생성 오류:', error)
      alert('주문 생성 중 오류가 발생했습니다.')
      setSubmitting(false)
    }
  }

  const isAdmin = user && user.user_type === 'admin'

  if (loading || cartLoading) {
    return (
      <div className="order-page">
        <div className="loading-container">
          <div className="loading-spinner">주문 정보를 불러오는 중...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="order-page">
      <TopBanner />
      
      <Navbar
        user={user}
        isAdmin={isAdmin}
        searchQuery={searchQuery}
        isDropdownOpen={isDropdownOpen}
        dropdownRef={dropdownRef}
        onSearchChange={handleSearchChange}
        onSearch={handleSearch}
        onToggleDropdown={toggleDropdown}
        onLogout={handleLogout}
        onMyPageClick={handleMyPageClick}
        onNavigateToLogin={onNavigateToLogin}
        onNavigateToSignup={onNavigateToSignup}
        onNavigateToAdmin={onNavigateToAdmin}
        onNavigateToMyOrders={onNavigateToMyOrders}
        cartCount={cartCount}
      />

      <main className="order-main">
        <div className="order-container">
          <h1 className="order-title">주문/결제</h1>

          {/* 진행 단계 */}
          <div className="order-steps">
            <div className="step completed">장바구니</div>
            <div className="step active">주문/결제</div>
            <div className="step">주문완료</div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* 배송지 정보 */}
            <div className="order-section">
              <h2 className="section-title">배송지</h2>
              <div className="form-group">
                <label>받는사람 *</label>
                <input
                  type="text"
                  value={shipping.recipientName}
                  onChange={(e) => handleShippingChange('recipientName', e.target.value)}
                  className={errors.recipientName ? 'error' : ''}
                />
                {errors.recipientName && <span className="error-message">{errors.recipientName}</span>}
              </div>

              <div className="form-group">
                <label>주소 *</label>
                <div className="address-row">
                  <input
                    type="text"
                    placeholder="우편번호"
                    value={shipping.postalCode}
                    onChange={(e) => handleShippingChange('postalCode', e.target.value)}
                    className={errors.postalCode ? 'error' : ''}
                  />
                  <button type="button" className="btn-address-search">주소검색</button>
                </div>
                {errors.postalCode && <span className="error-message">{errors.postalCode}</span>}
                <input
                  type="text"
                  placeholder="기본주소"
                  value={shipping.address}
                  onChange={(e) => handleShippingChange('address', e.target.value)}
                  className={errors.address ? 'error' : ''}
                  style={{ marginTop: '8px' }}
                />
                {errors.address && <span className="error-message">{errors.address}</span>}
                <input
                  type="text"
                  placeholder="나머지 주소"
                  value={shipping.addressDetail}
                  onChange={(e) => handleShippingChange('addressDetail', e.target.value)}
                  style={{ marginTop: '8px' }}
                />
              </div>

              <div className="form-group">
                <label>휴대전화 *</label>
                <div className="phone-row">
                  <select
                    value={shipping.phonePrefix}
                    onChange={(e) => handleShippingChange('phonePrefix', e.target.value)}
                  >
                    <option value="010">010</option>
                    <option value="011">011</option>
                    <option value="016">016</option>
                    <option value="017">017</option>
                    <option value="018">018</option>
                    <option value="019">019</option>
                  </select>
                  <span>-</span>
                  <input
                    type="text"
                    maxLength="4"
                    value={shipping.phoneMiddle}
                    onChange={(e) => handleShippingChange('phoneMiddle', e.target.value.replace(/\D/g, ''))}
                  />
                  <span>-</span>
                  <input
                    type="text"
                    maxLength="4"
                    value={shipping.phoneLast}
                    onChange={(e) => handleShippingChange('phoneLast', e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                {errors.recipientPhone && <span className="error-message">{errors.recipientPhone}</span>}
              </div>

              <div className="form-group">
                <label>이메일</label>
                <div className="email-row">
                  <input
                    type="text"
                    value={shipping.email}
                    onChange={(e) => handleShippingChange('email', e.target.value)}
                  />
                  <span>@</span>
                  <select
                    value={shipping.emailDomain}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        handleShippingChange('emailDomain', 'custom')
                      } else {
                        handleShippingChange('emailDomain', e.target.value)
                        handleShippingChange('emailCustom', '')
                      }
                    }}
                  >
                    <option value="">선택</option>
                    <option value="naver.com">naver.com</option>
                    <option value="gmail.com">gmail.com</option>
                    <option value="daum.net">daum.net</option>
                    <option value="custom">직접입력</option>
                  </select>
                  {shipping.emailDomain === 'custom' && (
                    <input
                      type="text"
                      placeholder="직접입력"
                      value={shipping.emailCustom}
                      onChange={(e) => handleShippingChange('emailCustom', e.target.value)}
                    />
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>메시지 선택</label>
                <select
                  value={shipping.deliveryRequest}
                  onChange={(e) => handleShippingChange('deliveryRequest', e.target.value)}
                >
                  <option value="">-- 메시지 선택 (선택사항) --</option>
                  <option value="문 앞에 놔주세요">문 앞에 놔주세요</option>
                  <option value="부재 시 경비실에 맡겨주세요">부재 시 경비실에 맡겨주세요</option>
                  <option value="배송 전 연락 부탁드립니다">배송 전 연락 부탁드립니다</option>
                </select>
              </div>
            </div>

            {/* 주문 상품 */}
            <div className="order-section">
              <h2 className="section-title">주문상품</h2>
              <div className="order-items">
                {cartItems.map((item) => (
                  <div key={item._id} className="order-item">
                    <div className="order-item-image">
                      {item.product?.images && item.product.images.length > 0 ? (
                        <img 
                          src={item.product.images[0]} 
                          alt={item.product.name}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/80x80?text=No+Image'
                          }}
                        />
                      ) : (
                        <div className="no-image">이미지 없음</div>
                      )}
                    </div>
                    <div className="order-item-info">
                      <div className="order-item-name">{item.product?.name || '상품명 없음'}</div>
                      <div className="order-item-options">
                        옵션: {[
                          item.options.color && `색상: ${item.options.color}`,
                          item.options.width && `가로: ${item.options.width}`,
                          item.options.height && `세로: ${item.options.height}`,
                          item.options.installation && `설치방법: ${item.options.installation}`
                        ].filter(Boolean).join(' / ') || '옵션 없음'}
                      </div>
                      <div className="order-item-quantity">수량: {item.quantity}개</div>
                      <div className="order-item-price">{Number(item.product?.price || 0).toLocaleString()}원</div>
                      <div className="order-item-shipping">배송비: 0(무료)원</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 결제 정보 */}
            <div className="order-section">
              <h2 className="section-title">결제정보</h2>
              <div className="payment-summary">
                <div className="summary-row">
                  <span>주문상품</span>
                  <span>{itemsTotal.toLocaleString()}원</span>
                </div>
                <div className="summary-row">
                  <span>배송비</span>
                  <span>+{shippingFee.toLocaleString()}원</span>
                </div>
                <div className="summary-row">
                  <span>할인/부가결제</span>
                  <span>-{discountAmount.toLocaleString()}원</span>
                </div>
                <div className="summary-row total">
                  <span>최종 결제 금액</span>
                  <span>{finalAmount.toLocaleString()}원</span>
                </div>
              </div>
            </div>

            {/* 결제 수단 */}
            <div className="order-section">
              <h2 className="section-title">결제수단</h2>
              <div className="payment-methods">
                <label className="payment-method">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="무통장입금"
                    checked={payment.method === '무통장입금'}
                    onChange={(e) => handlePaymentMethodChange(e.target.value)}
                  />
                  무통장입금
                </label>
                <label className="payment-method">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="카드결제"
                    checked={payment.method === '카드결제'}
                    onChange={(e) => handlePaymentMethodChange(e.target.value)}
                  />
                  카드결제
                </label>
                <label className="payment-method">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="가상계좌"
                    checked={payment.method === '가상계좌'}
                    onChange={(e) => handlePaymentMethodChange(e.target.value)}
                  />
                  가상계좌
                </label>
                <label className="payment-method">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="실시간 계좌이체"
                    checked={payment.method === '실시간 계좌이체'}
                    onChange={(e) => handlePaymentMethodChange(e.target.value)}
                  />
                  실시간 계좌이체
                </label>
                <label className="payment-method">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="간편결제"
                    checked={payment.method === '간편결제'}
                    onChange={(e) => handlePaymentMethodChange(e.target.value)}
                  />
                  N pay
                </label>
              </div>

              {payment.method === '무통장입금' && (
                <div className="bank-transfer-fields">
                  <div className="form-group">
                    <label>입금은행 *</label>
                    <select
                      value={payment.bank}
                      onChange={(e) => setPayment(prev => ({ ...prev, bank: e.target.value }))}
                      className={errors.bank ? 'error' : ''}
                    >
                      <option value="">= 선택해 주세요. =</option>
                      <option value="국민은행">국민은행</option>
                      <option value="신한은행">신한은행</option>
                      <option value="우리은행">우리은행</option>
                      <option value="하나은행">하나은행</option>
                      <option value="카카오뱅크">카카오뱅크</option>
                    </select>
                    {errors.bank && <span className="error-message">{errors.bank}</span>}
                  </div>
                  <div className="form-group">
                    <label>입금자명 *</label>
                    <input
                      type="text"
                      value={payment.depositorName}
                      onChange={(e) => setPayment(prev => ({ ...prev, depositorName: e.target.value }))}
                      className={errors.depositorName ? 'error' : ''}
                    />
                    {errors.depositorName && <span className="error-message">{errors.depositorName}</span>}
                  </div>
                  <div className="cash-receipt">
                    <label className="cash-receipt-label">
                      <input
                        type="radio"
                        name="cashReceipt"
                        value="신청"
                        checked={payment.cashReceipt === '신청'}
                        onChange={(e) => setPayment(prev => ({ ...prev, cashReceipt: e.target.value }))}
                      />
                      현금영수증 신청
                    </label>
                    <label className="cash-receipt-label">
                      <input
                        type="radio"
                        name="cashReceipt"
                        value="신청안함"
                        checked={payment.cashReceipt === '신청안함'}
                        onChange={(e) => setPayment(prev => ({ ...prev, cashReceipt: e.target.value }))}
                      />
                      신청안함
                    </label>
                  </div>
                  <p className="cash-receipt-note">
                    세금계산서 발행 및 입금자명 불일치 시 주문 확인이 지연될 수 있습니다.
                  </p>
                </div>
              )}
            </div>

            {/* 약관 동의 */}
            <div className="order-section">
              <h2 className="section-title">모든 약관 동의</h2>
              <div className="agreements">
                <label className="agreement-all">
                  <input
                    type="checkbox"
                    checked={agreements.all}
                    onChange={() => handleAgreementChange('all')}
                  />
                  모든 약관 동의
                </label>
                <label className="agreement-item">
                  <input
                    type="checkbox"
                    checked={agreements.terms}
                    onChange={() => handleAgreementChange('terms')}
                  />
                  [필수] 쇼핑몰 이용약관 동의
                </label>
                <label className="agreement-item">
                  <input
                    type="checkbox"
                    checked={agreements.privacy}
                    onChange={() => handleAgreementChange('privacy')}
                  />
                  [필수] 개인정보 수집 및 이용 동의
                </label>
                <p className="agreement-note">
                  구매조건 확인 및 결제진행 동의
                </p>
                <a href="#" className="agreement-link">청약철회방침 동의 자세히&gt;</a>
                {errors.agreements && <span className="error-message">{errors.agreements}</span>}
              </div>
            </div>

            {/* 결제 버튼 */}
            <div className="order-submit">
              <button 
                type="submit" 
                className="btn-submit-order"
                disabled={submitting}
              >
                {submitting ? '결제 중...' : `${finalAmount.toLocaleString()}원 결제하기`}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
