import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import './MainPage.css'
import TopBanner from '../components/TopBanner'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { STORAGE_KEYS, clearAuthStorage } from '../utils/storage'

export default function MainPage({ onNavigateToSignup, onNavigateToLogin, onNavigateToAdmin, onNavigateToProductDetail, onNavigateToCart, onNavigateToMyOrders }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('popular') // 'popular', 'new', 'lowPrice', 'highPrice', 'reviews'
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
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

  // 드롭다운 토글 (메모이제이션)
  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev)
  }, [])

  // 로그아웃 함수 (메모이제이션)
  const handleLogout = useCallback(() => {
    clearAuthStorage()
    setUser(null)
    setIsDropdownOpen(false)
  }, [])

  // 마이페이지 클릭 핸들러 (메모이제이션)
  const handleMyPageClick = useCallback(() => {
    setIsDropdownOpen(false)
    // 마이페이지로 이동 (추후 구현)
    alert('마이페이지 기능은 준비 중입니다.')
  }, [])

  // 검색 입력 핸들러 (메모이제이션)
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value)
  }, [])

  // 상품 목록 가져오기
  const fetchProducts = useCallback(async (category = '', search = '', page = 1, sort = 'popular') => {
    setProductsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12' // 페이지당 12개 상품
      })
      
      if (category) params.append('category', category)
      if (search && search.trim()) params.append('search', search.trim())
      // 판매중인 상품만 표시
      params.append('status', '판매중')

      const response = await fetch(`/api/products?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        let sortedProducts = [...(data.products || [])]
        
        // 정렬 적용
        switch (sort) {
          case 'new':
            // 최신순 (이미 서버에서 createdAt -1로 정렬됨)
            break
          case 'lowPrice':
            sortedProducts.sort((a, b) => a.price - b.price)
            break
          case 'highPrice':
            sortedProducts.sort((a, b) => b.price - a.price)
            break
          case 'popular':
          default:
            // 인기순 (기본값, 서버 정렬 유지)
            break
        }
        
        setProducts(sortedProducts)
        setTotalPages(data.totalPages || 1)
        setCurrentPage(data.page || 1)
      } else {
        console.error('상품 목록 조회 실패:', response.status)
      }
    } catch (error) {
      console.error('상품 목록 조회 오류:', error)
    } finally {
      setProductsLoading(false)
    }
  }, [])

  // 컴포넌트 마운트 시 상품 목록 가져오기
  useEffect(() => {
    fetchProducts(selectedCategory, searchQuery, currentPage, sortBy)
  }, [selectedCategory, searchQuery, currentPage, sortBy, fetchProducts])

  // 검색 실행 핸들러 (메모이제이션)
  const handleSearch = useCallback(() => {
    setCurrentPage(1)
    fetchProducts(selectedCategory, searchQuery, 1, sortBy)
  }, [searchQuery, selectedCategory, sortBy, fetchProducts])

  // 카테고리 변경 핸들러
  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category)
    setCurrentPage(1)
    fetchProducts(category, searchQuery, 1, sortBy)
  }, [searchQuery, sortBy, fetchProducts])

  // 정렬 변경 핸들러
  const handleSortChange = useCallback((sort) => {
    setSortBy(sort)
    setCurrentPage(1)
    fetchProducts(selectedCategory, searchQuery, 1, sort)
  }, [selectedCategory, searchQuery, fetchProducts])

  // 페이지 변경 핸들러
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // 어드민 권한 확인 (메모이제이션)
  const isAdmin = useMemo(() => {
    if (!user) return false
    return user.user_type === 'admin'
  }, [user])

  return (
    <div className="main-page">
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
        onNavigateToCart={onNavigateToCart}
        onNavigateToMyOrders={onNavigateToMyOrders}
        cartCount={cartCount}
      />

      {/* 메인 콘텐츠 */}
      <main className="main-content-area">
        <div className="content-container">
          <div className="main-header">
            <h2>쇼핑몰에 오신 것을 환영합니다!</h2>
            <p>다양한 상품을 만나보세요.</p>
          </div>

          {/* 카테고리 필터 */}
          <div className="category-filter">
            <button
              className={`category-filter-btn ${selectedCategory === '' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('')}
              type="button"
            >
              전체
            </button>
            <button
              className={`category-filter-btn ${selectedCategory === '커튼' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('커튼')}
              type="button"
            >
              커튼
            </button>
            <button
              className={`category-filter-btn ${selectedCategory === '블라인드' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('블라인드')}
              type="button"
            >
              블라인드
            </button>
            <button
              className={`category-filter-btn ${selectedCategory === '롤스크린' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('롤스크린')}
              type="button"
            >
              롤스크린
            </button>
            <button
              className={`category-filter-btn ${selectedCategory === '부자재' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('부자재')}
              type="button"
            >
              부자재
            </button>
          </div>

          {/* 정렬 필터 */}
          <div className="sort-filter">
            <button
              className={`sort-btn ${sortBy === 'popular' ? 'active' : ''}`}
              onClick={() => handleSortChange('popular')}
              type="button"
            >
              인기상품
            </button>
            <button
              className={`sort-btn ${sortBy === 'new' ? 'active' : ''}`}
              onClick={() => handleSortChange('new')}
              type="button"
            >
              신상품
            </button>
            <button
              className={`sort-btn ${sortBy === 'lowPrice' ? 'active' : ''}`}
              onClick={() => handleSortChange('lowPrice')}
              type="button"
            >
              낮은가격
            </button>
            <button
              className={`sort-btn ${sortBy === 'highPrice' ? 'active' : ''}`}
              onClick={() => handleSortChange('highPrice')}
              type="button"
            >
              높은가격
            </button>
          </div>

          {/* 상품 목록 */}
          {productsLoading ? (
            <div className="products-loading">상품을 불러오는 중...</div>
          ) : products.length === 0 ? (
            <div className="products-empty">등록된 상품이 없습니다.</div>
          ) : (
            <>
              <div className="products-grid">
                {products.map((product) => (
                  <div 
                    key={product._id} 
                    className="product-card"
                    onClick={() => onNavigateToProductDetail && onNavigateToProductDetail(product._id)}
                  >
                    <div className="product-image">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300?text=No+Image'
                          }}
                        />
                      ) : (
                        <div className="product-image-placeholder">
                          <span>이미지 없음</span>
                        </div>
                      )}
                      {product.status === '품절' && (
                        <div className="product-soldout">품절</div>
                      )}
                    </div>
                    <div className="product-info">
                      <div className="product-category">{product.category}</div>
                      <h3 className="product-name">{product.name}</h3>
                      <div className="product-price-section">
                        <span className="product-original-price">
                          {Number(product.price * 1.1).toLocaleString()}원
                        </span>
                        <span className="product-discount-price">
                          {Number(product.price).toLocaleString()}원
                        </span>
                      </div>
                      <div className="product-reviews">
                        리뷰 {Math.floor(Math.random() * 1000)} {/* 임시 리뷰 수 */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="products-pagination">
                  <button
                    className="page-btn"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    type="button"
                  >
                    &lt;&lt;
                  </button>
                  <button
                    className="page-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    type="button"
                  >
                    &lt;
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                        onClick={() => handlePageChange(pageNum)}
                        type="button"
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    className="page-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    type="button"
                  >
                    &gt;
                  </button>
                  <button
                    className="page-btn"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage >= totalPages}
                    type="button"
                  >
                    &gt;&gt;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
