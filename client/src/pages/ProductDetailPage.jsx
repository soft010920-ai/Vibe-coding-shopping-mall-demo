import { useState, useEffect, useCallback, useRef } from 'react'
import './ProductDetailPage.css'
import TopBanner from '../components/TopBanner'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { STORAGE_KEYS, clearAuthStorage } from '../utils/storage'

export default function ProductDetailPage({ productId, onNavigateToMain, onNavigateToLogin, onNavigateToCart, onNavigateToMyOrders }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState(null)
  const [productLoading, setProductLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('info') // 'info', 'reviews', 'qa', 'shipping'
  const [cartCount, setCartCount] = useState(0)
  const dropdownRef = useRef(null)
  
  // 상품 옵션 상태
  const [options, setOptions] = useState({
    color: '',
    pleats: '',
    width: '',
    height: '',
    quantity: 1,
    additional: '',
    installation: '',
    rod: ''
  })

  // 토큰으로 유저 정보 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/auth/me', {
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

  // 장바구니 개수 가져오기
  useEffect(() => {
    const fetchCartCount = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      if (!token || !user) {
        setCartCount(0)
        return
      }

      try {
        const response = await fetch('/api/cart', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          setCartCount(data.count || 0)
        } else {
          if (response.status === 401) {
            setCartCount(0)
          }
        }
      } catch (error) {
        console.error('장바구니 개수 조회 오류:', error)
        setCartCount(0)
      }
    }

    if (user) {
      fetchCartCount()
    } else {
      setCartCount(0)
    }
  }, [user])

  // 상품 정보 가져오기
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return
      
      setProductLoading(true)
      try {
        const response = await fetch(`/api/products/${productId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          console.log('상품 정보 로드 성공:', data.product)
          if (data.product && data.product._id) {
            setProduct(data.product)
          } else {
            console.error('상품 데이터 형식 오류:', data)
            alert('상품 정보 형식이 올바르지 않습니다.')
            if (onNavigateToMain) onNavigateToMain()
          }
        } else {
          console.error('상품 정보 조회 실패:', response.status)
          const errorData = await response.json().catch(() => ({}))
          console.error('에러 데이터:', errorData)
          alert('상품 정보를 불러올 수 없습니다.')
          if (onNavigateToMain) onNavigateToMain()
        }
      } catch (error) {
        console.error('상품 정보 조회 오류:', error)
        alert('상품 정보를 불러오는 중 오류가 발생했습니다.')
        if (onNavigateToMain) onNavigateToMain()
      } finally {
        setProductLoading(false)
      }
    }

    fetchProduct()
  }, [productId, onNavigateToMain])

  // 드롭다운 토글
  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev)
  }, [])

  // 로그아웃 함수
  const handleLogout = useCallback(() => {
    clearAuthStorage()
    setUser(null)
    setIsDropdownOpen(false)
  }, [])

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
    // 검색 기능은 메인 페이지에서 처리
    if (onNavigateToMain) onNavigateToMain()
  }, [onNavigateToMain])

  // 옵션 변경 핸들러
  const handleOptionChange = useCallback((key, value) => {
    setOptions(prev => ({ ...prev, [key]: value }))
  }, [])

  const [addingToCart, setAddingToCart] = useState(false)

  // 수량 변경 핸들러
  const handleQuantityChange = useCallback((delta) => {
    setOptions(prev => ({
      ...prev,
      quantity: Math.max(1, prev.quantity + delta)
    }))
  }, [])

  // 장바구니에 추가
  const handleAddToCart = useCallback(async () => {
    if (!user) {
      if (onNavigateToLogin) {
        alert('로그인이 필요합니다.')
        onNavigateToLogin()
      }
      return
    }

    if (!product) return

    // 필수 옵션 확인 (선택사항이지만 사용자에게 알림)
    const hasRequiredOptions = options.color && options.width && options.height
    if (!hasRequiredOptions) {
      if (!confirm('일부 옵션이 선택되지 않았습니다. 계속하시겠습니까?')) {
        return
      }
    }

    setAddingToCart(true)
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      if (!token) {
        alert('로그인이 필요합니다.')
        if (onNavigateToLogin) onNavigateToLogin()
        return
      }

      if (!product || !product._id) {
        alert('상품 정보가 올바르지 않습니다.')
        setAddingToCart(false)
        return
      }

      if (!product._id) {
        console.error('상품 ID가 없습니다:', product)
        alert('상품 정보가 올바르지 않습니다. 페이지를 새로고침해주세요.')
        setAddingToCart(false)
        return
      }

      const requestBody = {
        productId: product._id,
        quantity: options.quantity,
        options: {
          color: options.color || '',
          pleats: options.pleats || '',
          width: options.width || '',
          height: options.height || '',
          additional: options.additional || '',
          installation: options.installation || '',
          rod: options.rod || ''
        }
      }

      console.log('장바구니 추가 요청:', requestBody)
      console.log('상품 정보:', { id: product._id, name: product.name, price: product.price })

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const data = await response.json()
        // 장바구니 개수 업데이트
        const countResponse = await fetch('/api/cart', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        if (countResponse.ok) {
          const countData = await countResponse.json()
          setCartCount(countData.count || 0)
        }
        
        alert('장바구니에 상품이 추가되었습니다.')
        // 장바구니 페이지로 이동할지 물어보기
        if (onNavigateToCart && confirm('장바구니로 이동하시겠습니까?')) {
          onNavigateToCart()
        }
      } else {
        let errorData
        try {
          errorData = await response.json()
        } catch (e) {
          errorData = { error: `서버 오류 (${response.status})` }
        }
        
        console.error('장바구니 추가 실패:', response.status, errorData)
        
        if (response.status === 401) {
          alert('로그인이 필요합니다.')
          clearAuthStorage()
          if (onNavigateToLogin) onNavigateToLogin()
        } else if (response.status === 400) {
          alert(errorData.error || errorData.details || '장바구니 추가에 실패했습니다.')
        } else if (response.status === 404) {
          alert('상품을 찾을 수 없습니다.')
        } else if (response.status === 500) {
          alert(errorData.error || errorData.details || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        } else {
          alert(errorData.error || errorData.details || `오류가 발생했습니다. (${response.status})`)
        }
      }
    } catch (error) {
      console.error('장바구니 추가 오류:', error)
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        alert('네트워크 오류가 발생했습니다. 서버 연결을 확인해주세요.')
      } else {
        alert(`장바구니 추가 중 오류가 발생했습니다: ${error.message}`)
      }
    } finally {
      setAddingToCart(false)
    }
  }, [user, product, options, onNavigateToLogin, onNavigateToCart])

  // 총 상품금액 계산
  const totalPrice = product ? product.price * options.quantity : 0

  // 어드민 권한 확인
  const isAdmin = user && user.user_type === 'admin'

  // 상품 이미지 배열
  const productImages = product?.images && product.images.length > 0 
    ? product.images 
    : ['https://via.placeholder.com/500x500?text=No+Image']

  if (productLoading) {
    return (
      <div className="product-detail-page">
        <div className="loading-container">
          <div className="loading-spinner">상품 정보를 불러오는 중...</div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="product-detail-page">
        <div className="error-container">
          <p>상품을 찾을 수 없습니다.</p>
          <button onClick={onNavigateToMain} className="btn-back">메인으로 돌아가기</button>
        </div>
      </div>
    )
  }

  return (
    <div className="product-detail-page">
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
        onNavigateToLogin={() => {}}
        onNavigateToSignup={() => {}}
        onNavigateToAdmin={() => {}}
        onNavigateToMyOrders={onNavigateToMyOrders}
        cartCount={cartCount}
      />

      <main className="product-detail-main">
        <div className="product-detail-container">
          {/* 상품 정보 섹션 */}
          <div className="product-detail-section">
            {/* 왼쪽: 상품 이미지 */}
            <div className="product-images">
              <div className="main-image">
                <img 
                  src={productImages[selectedImageIndex]} 
                  alt={product.name}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/500x500?text=No+Image'
                  }}
                />
              </div>
              <div className="thumbnail-images">
                {productImages.map((img, index) => (
                  <div
                    key={index}
                    className={`thumbnail ${selectedImageIndex === index ? 'active' : ''}`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img 
                      src={img} 
                      alt={`${product.name} ${index + 1}`}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/100x100?text=No+Image'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 오른쪽: 상품 정보 및 옵션 */}
            <div className="product-info-section">
              <h1 className="product-title">{product.name}</h1>
              <div className="product-price">
                <span className="price">{Number(product.price).toLocaleString()}원</span>
              </div>

              {/* 옵션 선택 */}
              <div className="product-options">
                <div className="option-group">
                  <label>색상</label>
                  <select 
                    value={options.color} 
                    onChange={(e) => handleOptionChange('color', e.target.value)}
                    className="option-select"
                  >
                    <option value="">색상 선택</option>
                    <option value="아이보리">아이보리</option>
                    <option value="베이지">베이지</option>
                    <option value="화이트">화이트</option>
                    <option value="그레이">그레이</option>
                  </select>
                </div>

                <div className="option-group">
                  <label>주름</label>
                  <select 
                    value={options.pleats} 
                    onChange={(e) => handleOptionChange('pleats', e.target.value)}
                    className="option-select"
                  >
                    <option value="">주름 선택</option>
                    <option value="나비주름">나비주름</option>
                    <option value="핀형">핀형</option>
                    <option value="봉집형">봉집형</option>
                  </select>
                </div>

                <div className="option-group">
                  <label>가로사이즈</label>
                  <select 
                    value={options.width} 
                    onChange={(e) => handleOptionChange('width', e.target.value)}
                    className="option-select"
                  >
                    <option value="">가로사이즈 선택</option>
                    <option value="140cm">140cm</option>
                    <option value="160cm">160cm</option>
                    <option value="180cm">180cm</option>
                    <option value="200cm">200cm</option>
                  </select>
                </div>

                <div className="option-group">
                  <label>세로사이즈</label>
                  <select 
                    value={options.height} 
                    onChange={(e) => handleOptionChange('height', e.target.value)}
                    className="option-select"
                  >
                    <option value="">세로사이즈 선택</option>
                    <option value="140cm">140cm</option>
                    <option value="160cm">160cm</option>
                    <option value="180cm">180cm</option>
                    <option value="200cm">200cm</option>
                  </select>
                </div>

                <div className="option-group">
                  <label>수량</label>
                  <div className="quantity-control">
                    <button 
                      type="button"
                      onClick={() => handleQuantityChange(-1)}
                      className="quantity-btn"
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      value={options.quantity} 
                      onChange={(e) => handleOptionChange('quantity', parseInt(e.target.value) || 1)}
                      min="1"
                      className="quantity-input"
                    />
                    <button 
                      type="button"
                      onClick={() => handleQuantityChange(1)}
                      className="quantity-btn"
                    >
                      +
                    </button>
                    <span className="point-badge">P</span>
                  </div>
                </div>

                <div className="option-group">
                  <label>추가구성</label>
                  <select 
                    value={options.additional} 
                    onChange={(e) => handleOptionChange('additional', e.target.value)}
                    className="option-select"
                  >
                    <option value="">추가구성 선택</option>
                    <option value="커튼링">커튼링</option>
                    <option value="커튼핀">커튼핀</option>
                  </select>
                </div>

                <div className="option-group">
                  <label>설치방법</label>
                  <select 
                    value={options.installation} 
                    onChange={(e) => handleOptionChange('installation', e.target.value)}
                    className="option-select"
                  >
                    <option value="">설치방법 선택</option>
                    <option value="핀형">핀형</option>
                    <option value="봉집형">봉집형</option>
                    <option value="고리형">고리형</option>
                  </select>
                </div>

                <div className="option-group">
                  <label>커튼봉/레일</label>
                  <select 
                    value={options.rod} 
                    onChange={(e) => handleOptionChange('rod', e.target.value)}
                    className="option-select"
                  >
                    <option value="">커튼봉/레일 선택</option>
                    <option value="일반봉">일반봉</option>
                    <option value="이중레일">이중레일</option>
                  </select>
                </div>
              </div>

              {/* 총 상품금액 */}
              <div className="total-price-row">
                <span className="total-label">총 상품금액:</span>
                <span className="total-amount">{totalPrice.toLocaleString()}원</span>
              </div>

              {/* 액션 버튼 */}
              <div className="product-actions">
                <button 
                  className="btn-cart" 
                  type="button"
                  onClick={handleAddToCart}
                  disabled={addingToCart || !product}
                >
                  {addingToCart ? '추가 중...' : '장바구니'}
                </button>
                <button className="btn-buy" type="button">바로구매</button>
                <div className="wishlist-container">
                  <button className="btn-wishlist" type="button" title="찜">
                    ♥
                  </button>
                </div>
                <button className="btn-share" type="button" title="공유">
                  공유
                </button>
              </div>
            </div>
          </div>

          {/* Membership Benefit 섹션 */}
          <div className="membership-benefit-section">
            <h2>Membership Benefit</h2>
            <div className="benefit-grid">
              <div className="benefit-item">
                <div className="benefit-icon">🎁</div>
                <p>회원가입 혜택</p>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">⭐</div>
                <p>등급별 혜택</p>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">🎂</div>
                <p>생일 쿠폰</p>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">🎉</div>
                <p>첫 구매 혜택</p>
              </div>
            </div>
            <button className="btn-benefit" type="button">회원가입하고 혜택받기</button>
          </div>

          {/* 탭 메뉴 */}
          <div className="product-tabs">
            <button 
              className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
              type="button"
            >
              상품정보
            </button>
            <button 
              className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
              type="button"
            >
              리뷰
            </button>
            <button 
              className={`tab-btn ${activeTab === 'qa' ? 'active' : ''}`}
              onClick={() => setActiveTab('qa')}
              type="button"
            >
              Q&A
            </button>
            <button 
              className={`tab-btn ${activeTab === 'shipping' ? 'active' : ''}`}
              onClick={() => setActiveTab('shipping')}
              type="button"
            >
              배송/교환/반품
            </button>
          </div>

          {/* 탭 컨텐츠 */}
          <div className="tab-content">
            {activeTab === 'info' && (
              <div className="product-description">
                <h3>상품 상세 정보</h3>
                <div className="description-text">
                  {product.description || '상품 설명이 없습니다.'}
                </div>
                <div className="product-specs">
                  <h4>상품 정보</h4>
                  <ul>
                    <li>카테고리: {product.category}</li>
                    <li>SKU: {product.sku}</li>
                    <li>재고: {product.stock}개</li>
                    <li>상태: {product.status}</li>
                  </ul>
                </div>
              </div>
            )}
            {activeTab === 'reviews' && (
              <div className="reviews-section">
                <h3>리뷰</h3>
                <p>리뷰 기능은 준비 중입니다.</p>
              </div>
            )}
            {activeTab === 'qa' && (
              <div className="qa-section">
                <h3>Q&A</h3>
                <p>Q&A 기능은 준비 중입니다.</p>
              </div>
            )}
            {activeTab === 'shipping' && (
              <div className="shipping-section">
                <h3>배송/교환/반품 안내</h3>
                <div className="shipping-info">
                  <h4>배송 안내</h4>
                  <p>• 배송비: 3,000원 (50,000원 이상 구매 시 무료배송)</p>
                  <p>• 배송 기간: 주문 후 2-3일 소요</p>
                  <p>• 제주 및 도서산간 지역은 추가 배송비가 발생할 수 있습니다.</p>
                  
                  <h4>교환/반품 안내</h4>
                  <p>• 상품 수령 후 7일 이내 교환/반품 가능</p>
                  <p>• 상품의 하자 또는 오배송의 경우 배송비 무료</p>
                  <p>• 고객 변심의 경우 배송비는 고객 부담</p>
                  
                  <h4>고객센터</h4>
                  <p>• 전화: 1661-7772</p>
                  <p>• 운영시간: 월-금 AM 09:00 ~ PM 18:00</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
