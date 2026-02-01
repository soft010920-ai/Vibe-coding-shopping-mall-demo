import { useState, useEffect, useCallback, useRef } from 'react'
import './OrderCompletePage.css'
import TopBanner from '../components/TopBanner'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { STORAGE_KEYS, clearAuthStorage } from '../utils/storage'
import { getApiUrl } from '../utils/api'

export default function OrderCompletePage({ 
  orderId,
  isFailure = false,
  errorMessage = '',
  onNavigateToMain,
  onNavigateToMyOrders
}) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState(null)
  const [orderLoading, setOrderLoading] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [cartCount, setCartCount] = useState(0)
  const dropdownRef = useRef(null)

  // 토큰으로 유저 정보 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      
      if (!token) {
        setLoading(false)
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
          }
        }
      } catch (error) {
        console.error('유저 정보 조회 오류:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserInfo()
  }, [])

  // 주문 정보 가져오기
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || isFailure) {
        setOrderLoading(false)
        return
      }

      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      if (!token) {
        setOrderLoading(false)
        return
      }

      setOrderLoading(true)
      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          setOrder(data.order)
        } else {
          console.error('주문 정보 조회 실패:', response.status)
        }
      } catch (error) {
        console.error('주문 정보 조회 오류:', error)
      } finally {
        setOrderLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, isFailure])

  // 장바구니 개수 업데이트
  useEffect(() => {
    const fetchCartCount = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      if (!token) {
        setCartCount(0)
        return
      }
      try {
        const response = await fetch(getApiUrl('/api/cart'), {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setCartCount(data.count || data.items?.length || 0)
        }
      } catch (error) {
        console.error('장바구니 개수 조회 오류:', error)
      }
    }

    if (user) {
      fetchCartCount()
    }
  }, [user])

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

  const handleLogout = useCallback(() => {
    clearAuthStorage()
    setUser(null)
    setIsDropdownOpen(false)
  }, [])

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

  const isAdmin = user && user.user_type === 'admin'

  if (loading || (orderLoading && !isFailure)) {
    return (
      <div className="order-complete-page">
        <div className="loading-container">
          <div className="loading-spinner">주문 정보를 불러오는 중...</div>
        </div>
      </div>
    )
  }

  // 주문 실패 페이지
  if (isFailure) {
    return (
      <div className="order-complete-page">
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
          onNavigateToMyOrders={onNavigateToMyOrders}
          cartCount={cartCount}
        />

        <main className="order-complete-main">
          <div className="order-complete-container">
            <div className="order-complete-icon failure">
              <span className="failure-icon">✕</span>
            </div>
            <h1 className="order-complete-title failure">주문이 실패했습니다</h1>
            <p className="order-complete-message">
              {errorMessage || '주문 처리 중 오류가 발생했습니다.'}
            </p>
            <div className="order-complete-actions">
              <button 
                className="btn-primary"
                onClick={() => onNavigateToMain && onNavigateToMain()}
              >
                메인으로 돌아가기
              </button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  // 주문 성공 페이지
  if (!order) {
    return (
      <div className="order-complete-page">
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
          onNavigateToMyOrders={onNavigateToMyOrders}
          cartCount={cartCount}
        />

        <main className="order-complete-main">
          <div className="order-complete-container">
            <div className="loading-spinner">주문 정보를 불러오는 중...</div>
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  // 주문 날짜 포맷팅
  const orderDate = order.createdAt 
    ? new Date(order.createdAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\./g, '.').replace(/\s/g, '')
    : new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\./g, '.').replace(/\s/g, '')

  // 총 상품 금액 계산
  const itemsTotal = order.items?.reduce((sum, item) => {
    const itemPrice = item.product?.price || 0
    return sum + (itemPrice * item.quantity)
  }, 0) || 0

  // 할인 금액
  const discountAmount = order.amounts?.discountAmount || 0

  // 배송비
  const shippingFee = order.shipping?.shippingFee || 0

  // 총 결제 금액
  const finalAmount = order.amounts?.finalAmount || order.payment?.amount || 0

  return (
    <div className="order-complete-page">
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
        onNavigateToMyOrders={onNavigateToMyOrders}
        cartCount={cartCount}
      />

      <main className="order-complete-main">
        <div className="order-complete-container">
          {/* 주문 완료 아이콘 및 메시지 */}
          <div className="order-complete-header">
            <div className="order-complete-icon">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M40 10L50 25H70L55 35L60 50L40 40L20 50L25 35L10 25H30L40 10Z" fill="#4A90E2" opacity="0.8"/>
                <path d="M40 15L48 27H65L53 35L58 47L40 38L22 47L27 35L15 27H32L40 15Z" fill="#4A90E2"/>
              </svg>
            </div>
            <h1 className="order-complete-title">주문이 완료되었습니다</h1>
            <p className="order-complete-order-info">
              {orderDate} 주문하신 상품의 주문번호는{' '}
              <span className="order-number">{order.orderNumber || orderId}</span> 입니다.
            </p>
          </div>

          <div className="order-complete-content">
            {/* 주문 상품 목록 */}
            <div className="order-complete-section">
              <h2 className="section-title">주문 상품</h2>
              <div className="order-items-table">
                <table>
                  <thead>
                    <tr>
                      <th>상품명</th>
                      <th>수량</th>
                      <th>할인금액</th>
                      <th>결제금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item, index) => {
                      const itemPrice = item.product?.price || 0
                      const itemTotal = itemPrice * item.quantity
                      return (
                        <tr key={index}>
                          <td className="product-cell">
                            <div className="product-info">
                              {item.product?.images && item.product.images.length > 0 ? (
                                <img 
                                  src={item.product.images[0]} 
                                  alt={item.product.name}
                                  className="product-image"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/80x80?text=No+Image'
                                  }}
                                />
                              ) : (
                                <div className="product-image-placeholder">이미지 없음</div>
                              )}
                              <span className="product-name">
                                {item.product?.name || '상품명 없음'}
                              </span>
                            </div>
                          </td>
                          <td className="quantity-cell">{item.quantity}</td>
                          <td className="discount-cell">0원</td>
                          <td className="price-cell">{itemTotal.toLocaleString()}원</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="order-complete-info-grid">
              {/* 배송지 정보 */}
              <div className="order-complete-section">
                <h2 className="section-title">배송지 정보</h2>
                <div className="info-content">
                  <div className="info-row">
                    <span className="info-label">이름</span>
                    <span className="info-value">{order.shipping?.recipientName || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">휴대폰번호</span>
                    <span className="info-value">{order.shipping?.recipientPhone || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">배송지 주소</span>
                    <span className="info-value">
                      {order.shipping?.postalCode && `(${order.shipping.postalCode}) `}
                      {order.shipping?.address || '-'}
                      {order.shipping?.addressDetail && ` ${order.shipping.addressDetail}`}
                    </span>
                  </div>
                  <button className="btn-change-address">배송지 변경</button>
                </div>
              </div>

              {/* 결제 정보 */}
              <div className="order-complete-section">
                <h2 className="section-title">결제 정보</h2>
                <div className="info-content">
                  <div className="info-row">
                    <span className="info-label">상품금액</span>
                    <span className="info-value">{itemsTotal.toLocaleString()}원</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">할인 금액</span>
                    <span className="info-value">{discountAmount.toLocaleString()}원</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">적립예정 포인트</span>
                    <span className="info-value">{Math.floor(itemsTotal * 0.01).toLocaleString()}P</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">배송비</span>
                    <span className="info-value">{shippingFee === 0 ? '0원 (무료)' : `${shippingFee.toLocaleString()}원`}</span>
                  </div>
                  <div className="info-row total">
                    <span className="info-label">총 결제 금액</span>
                    <span className="info-value">{finalAmount.toLocaleString()}원</span>
                  </div>
                  <div className="info-row payment-method">
                    <span className="info-label">결제 수단</span>
                    <span className="info-value">{order.payment?.method || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="order-complete-actions">
            <button 
              className="btn-secondary"
              onClick={() => onNavigateToMyOrders && onNavigateToMyOrders()}
            >
              주문 목록 보기
            </button>
            <button 
              className="btn-primary"
              onClick={() => onNavigateToMain && onNavigateToMain()}
            >
              쇼핑 계속하기
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
