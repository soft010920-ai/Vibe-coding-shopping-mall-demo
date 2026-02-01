import { useState, useEffect, useCallback, useRef } from 'react'
import './CartPage.css'
import TopBanner from '../components/TopBanner'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { STORAGE_KEYS, clearAuthStorage } from '../utils/storage'
import { getApiUrl } from '../utils/api'

export default function CartPage({ onNavigateToMain, onNavigateToLogin, onNavigateToSignup, onNavigateToAdmin, onNavigateToOrder, onNavigateToMyOrders }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cartItems, setCartItems] = useState([])
  const [cartLoading, setCartLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUsageGuide, setShowUsageGuide] = useState(false)
  const [showInstallmentGuide, setShowInstallmentGuide] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const dropdownRef = useRef(null)

  // 토큰으로 유저 정보 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      
      if (!token) {
        setLoading(false)
        // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
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

  // 장바구니 목록 가져오기
  const fetchCartItems = useCallback(async () => {
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
        setCartItems(data.items || [])
        // 모든 항목 선택
        setSelectedItems((data.items || []).map(item => item._id))
      } else {
        if (response.status === 401) {
          clearAuthStorage()
          if (onNavigateToLogin) onNavigateToLogin()
        }
        console.error('장바구니 조회 실패:', response.status)
      }
    } catch (error) {
      console.error('장바구니 조회 오류:', error)
    } finally {
      setCartLoading(false)
    }
  }, [onNavigateToLogin])

  useEffect(() => {
    if (user) {
      fetchCartItems()
    }
  }, [user, fetchCartItems])

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

  // 드롭다운 토글
  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev)
  }, [])

  // 로그아웃 함수
  const handleLogout = useCallback(() => {
    clearAuthStorage()
    setUser(null)
    setIsDropdownOpen(false)
    if (onNavigateToLogin) onNavigateToLogin()
  }, [onNavigateToLogin])

  // 마이페이지 클릭 핸들러
  const handleMyPageClick = useCallback(() => {
    setIsDropdownOpen(false)
    alert('마이페이지 기능은 준비 중입니다.')
  }, [])

  // 검색 입력 핸들러
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value)
  }, [])

  // 검색 실행 핸들러
  const handleSearch = useCallback(() => {
    if (onNavigateToMain) onNavigateToMain()
  }, [onNavigateToMain])

  // 항목 선택/해제
  const handleItemSelect = useCallback((itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }, [])

  // 전체 선택/해제
  const handleSelectAll = useCallback(() => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(cartItems.map(item => item._id))
    }
  }, [selectedItems.length, cartItems])

  // 수량 변경
  const handleQuantityChange = useCallback(async (itemId, newQuantity) => {
    if (newQuantity < 1) return

    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (!token) return

    try {
      const response = await fetch(getApiUrl(`/api/cart/${itemId}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: newQuantity })
      })

      if (response.ok) {
        await fetchCartItems()
      } else {
        alert('수량 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('수량 변경 오류:', error)
      alert('수량 변경 중 오류가 발생했습니다.')
    }
  }, [fetchCartItems])

  // 장바구니 항목 삭제
  const handleDeleteItem = useCallback(async (itemId) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (!token) return

    try {
      const response = await fetch(getApiUrl(`/api/cart/${itemId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        await fetchCartItems()
      } else {
        alert('삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('삭제 오류:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }, [fetchCartItems])

  // 선택 항목 삭제
  const handleDeleteSelected = useCallback(async () => {
    if (selectedItems.length === 0) {
      alert('삭제할 항목을 선택해주세요.')
      return
    }

    if (!confirm(`선택한 ${selectedItems.length}개 항목을 삭제하시겠습니까?`)) return

    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (!token) return

    try {
      const deletePromises = selectedItems.map(itemId =>
        fetch(`/api/cart/${itemId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      )

      await Promise.all(deletePromises)
      await fetchCartItems()
      setSelectedItems([])
    } catch (error) {
      console.error('선택 항목 삭제 오류:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }, [selectedItems, fetchCartItems])

  // 선택된 항목들의 총 금액 계산
  const selectedTotalAmount = cartItems
    .filter(item => selectedItems.includes(item._id))
    .reduce((sum, item) => sum + item.totalPrice, 0)

  // 배송비 계산 (50,000원 이상 무료배송)
  const shippingFee = selectedTotalAmount >= 50000 ? 0 : 3000
  const totalAmount = selectedTotalAmount + shippingFee

  // 어드민 권한 확인
  const isAdmin = user && user.user_type === 'admin'

  if (loading || cartLoading) {
    return (
      <div className="cart-page">
        <div className="loading-container">
          <div className="loading-spinner">장바구니를 불러오는 중...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // 로그인 페이지로 리다이렉트됨
  }

  return (
    <div className="cart-page">
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
        cartCount={cartCount}
      />

      <main className="cart-main">
        <div className="cart-container">
          <h1 className="cart-title">장바구니</h1>

          {cartItems.length === 0 ? (
            <div className="cart-empty">
              <p>장바구니가 비어있습니다.</p>
              <div className="cart-empty-actions">
                <button 
                  className="btn-continue-shopping"
                  onClick={onNavigateToMain}
                  type="button"
                >
                  쇼핑 계속하기
                </button>
                <button 
                  className="btn-view-orders"
                  onClick={() => onNavigateToMyOrders && onNavigateToMyOrders()}
                  type="button"
                >
                  주문 목록 보기
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 상품 목록 */}
              <div className="cart-section">
                <div className="section-header">
                  <h2>일반상품 ({cartItems.length})</h2>
                </div>

                <div className="cart-items">
                  {cartItems.map((item) => (
                    <div key={item._id} className="cart-item">
                      <div className="item-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item._id)}
                          onChange={() => handleItemSelect(item._id)}
                        />
                      </div>

                      <div className="item-image">
                        {item.product?.images && item.product.images.length > 0 ? (
                          <img 
                            src={item.product.images[0]} 
                            alt={item.product.name}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/120x120?text=No+Image'
                            }}
                          />
                        ) : (
                          <div className="no-image">이미지 없음</div>
                        )}
                      </div>

                      <div className="item-info">
                        <h3 className="item-name">{item.product?.name || '상품명 없음'}</h3>
                        <div className="item-options">
                          옵션: {[
                            item.options.color && `색상: ${item.options.color}`,
                            item.options.pleats && `주름: ${item.options.pleats}`,
                            item.options.width && `가로: ${item.options.width}`,
                            item.options.height && `세로: ${item.options.height}`,
                            item.options.installation && `설치방법: ${item.options.installation}`,
                            item.options.rod && `커튼봉/레일: ${item.options.rod}`
                          ].filter(Boolean).join(' / ') || '옵션 없음'}
                        </div>
                        <div className="item-price">{Number(item.product?.price || 0).toLocaleString()}원</div>
                      </div>

                      <div className="item-quantity">
                        <div className="quantity-control">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                            className="quantity-btn"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item._id, parseInt(e.target.value) || 1)}
                            min="1"
                            className="quantity-input"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                            className="quantity-btn"
                          >
                            +
                          </button>
                        </div>
                        <button 
                          className="btn-change"
                          onClick={() => alert('옵션 변경 기능은 준비 중입니다.')}
                          type="button"
                        >
                          변경
                        </button>
                      </div>

                      <div className="item-shipping">
                        <div className="shipping-type">기본배송</div>
                        <div className="shipping-fee">
                          {shippingFee === 0 ? '무료' : '3,000원'}
                        </div>
                      </div>

                      <div className="item-total">
                        {Number(item.totalPrice).toLocaleString()}원
                      </div>

                      <div className="item-actions">
                        <button 
                          className="btn-order-item"
                          onClick={() => {
                            if (onNavigateToOrder) {
                              onNavigateToOrder([item._id])
                            }
                          }}
                          type="button"
                        >
                          주문하기
                        </button>
                        <button 
                          className="btn-wishlist"
                          onClick={() => alert('찜 기능은 준비 중입니다.')}
                          type="button"
                          title="찜"
                        >
                          ♥
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteItem(item._id)}
                          type="button"
                          title="삭제"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-actions">
                  <button 
                    className="btn-delete-selected"
                    onClick={handleDeleteSelected}
                    type="button"
                  >
                    선택상품 삭제
                  </button>
                </div>
              </div>

              {/* 주문 요약 */}
              <div className="order-summary">
                <div className="summary-header">
                  <div className="summary-line">
                    <span>총 상품 금액</span>
                    <span className="amount">{selectedTotalAmount.toLocaleString()}원</span>
                  </div>
                  <div className="summary-line">
                    <span>+</span>
                  </div>
                  <div className="summary-line">
                    <span>총 배송비</span>
                    <span className="amount">{shippingFee.toLocaleString()}원</span>
                  </div>
                </div>
                <div className="summary-total">
                  <span>결제 예정 금액</span>
                  <span className="total-amount">{totalAmount.toLocaleString()}원</span>
                </div>
                <div className="summary-buttons">
                  <button 
                    className="btn-order-all"
                    onClick={() => {
                      if (cartItems.length === 0) {
                        alert('주문할 상품이 없습니다.')
                        return
                      }
                      if (onNavigateToOrder) {
                        onNavigateToOrder(cartItems.map(item => item._id))
                      }
                    }}
                    type="button"
                  >
                    전체상품주문
                  </button>
                  <button 
                    className="btn-order-selected"
                    onClick={() => {
                      if (selectedItems.length === 0) {
                        alert('주문할 상품을 선택해주세요.')
                        return
                      }
                      if (onNavigateToOrder) {
                        onNavigateToOrder(selectedItems)
                      }
                    }}
                    type="button"
                  >
                    선택상품주문
                  </button>
                  <button 
                    className="btn-view-orders"
                    onClick={() => onNavigateToMyOrders && onNavigateToMyOrders()}
                    type="button"
                  >
                    주문 목록 보기
                  </button>
                </div>
              </div>

              {/* 이용안내 */}
              <div className="usage-guide-section">
                <div 
                  className="guide-header"
                  onClick={() => setShowUsageGuide(!showUsageGuide)}
                >
                  <h3>장바구니 이용안내</h3>
                  <span className="toggle-icon">{showUsageGuide ? '▼' : '▶'}</span>
                </div>
                {showUsageGuide && (
                  <div className="guide-content">
                    <ul>
                      <li>해외배송 상품과 국내배송 상품은 함께 주문하실 수 없습니다. 별도로 주문해 주시기 바랍니다.</li>
                      <li>상품의 수량을 변경하시려면 수량변경 후 [변경] 버튼을 누르시면 됩니다.</li>
                      <li>[쇼핑계속하기] 버튼을 누르시면 쇼핑을 계속 하실 수 있습니다.</li>
                      <li>장바구니와 관심상품을 이용하여 원하시는 상품만 주문하거나 관심상품으로 보관할 수 있습니다.</li>
                      <li>파일첨부 옵션은 주문완료 후 수정이 불가능합니다.</li>
                      <li>배송비는 상품에 따라 상이할 수 있습니다.</li>
                    </ul>
                  </div>
                )}

                <div 
                  className="guide-header"
                  onClick={() => setShowInstallmentGuide(!showInstallmentGuide)}
                >
                  <h3>무이자할부 이용안내</h3>
                  <span className="toggle-icon">{showInstallmentGuide ? '▼' : '▶'}</span>
                </div>
                {showInstallmentGuide && (
                  <div className="guide-content">
                    <ul>
                      <li>상품별 무이자할부 혜택을 받으시려면 무이자할부가 가능한 상품을 선택하여 주문시 적용하실 수 있습니다.</li>
                      <li>상품금액에 따라 무이자할부가 적용되지 않을 수 있습니다.</li>
                      <li>무이자할부는 신용카드만 이용 가능하며, 일부 상품의 경우 무이자할부가 적용되지 않을 수 있습니다.</li>
                      <li>무이자할부 혜택은 상품별로 다를 수 있으니 주문 시 확인해주시기 바랍니다.</li>
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
