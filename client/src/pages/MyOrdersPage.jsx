import { useState, useEffect, useCallback, useRef } from 'react'
import './MyOrdersPage.css'
import TopBanner from '../components/TopBanner'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { STORAGE_KEYS, clearAuthStorage } from '../utils/storage'
import { getApiUrl } from '../utils/api'

export default function MyOrdersPage({ 
  onNavigateToMain,
  onNavigateToLogin,
  onNavigateToOrderDetail
}) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [cartCount, setCartCount] = useState(0)
  const dropdownRef = useRef(null)

  // 필터 상태
  const [activeTab, setActiveTab] = useState('orders') // 'orders', 'cancel', 'past'
  const [statusFilter, setStatusFilter] = useState('all') // 'all', '주문접수', '결제완료', '배송준비', '배송중', '배송완료', '주문취소'
  const [dateRange, setDateRange] = useState('3months') // 'today', '1week', '1month', '3months', '6months', 'custom'
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

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
          }
        } else if (response.status === 401) {
          clearAuthStorage()
          if (onNavigateToLogin) onNavigateToLogin()
        }
      } catch (error) {
        console.error('유저 정보 조회 오류:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserInfo()
  }, [onNavigateToLogin])

  // 주문 목록 가져오기
  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      if (!token || !user) {
        setOrdersLoading(false)
        return
      }

      setOrdersLoading(true)
      try {
        // 날짜 범위 계산
        let dateFrom = ''
        let dateTo = new Date().toISOString().split('T')[0]

        if (dateRange === 'today') {
          dateFrom = new Date().toISOString().split('T')[0]
        } else if (dateRange === '1week') {
          const date = new Date()
          date.setDate(date.getDate() - 7)
          dateFrom = date.toISOString().split('T')[0]
        } else if (dateRange === '1month') {
          const date = new Date()
          date.setMonth(date.getMonth() - 1)
          dateFrom = date.toISOString().split('T')[0]
        } else if (dateRange === '3months') {
          const date = new Date()
          date.setMonth(date.getMonth() - 3)
          dateFrom = date.toISOString().split('T')[0]
        } else if (dateRange === '6months') {
          const date = new Date()
          date.setMonth(date.getMonth() - 6)
          dateFrom = date.toISOString().split('T')[0]
        } else if (dateRange === 'custom' && startDate && endDate) {
          dateFrom = startDate
          dateTo = endDate
        } else {
          // 기본값: 3개월
          const date = new Date()
          date.setMonth(date.getMonth() - 3)
          dateFrom = date.toISOString().split('T')[0]
        }

        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: '10',
          ...(statusFilter !== 'all' && { status: statusFilter }),
          ...(dateFrom && { dateFrom }),
          ...(dateTo && { dateTo })
        })

        const response = await fetch(getApiUrl(`/api/orders?${queryParams}`), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          setOrders(data.orders || [])
          setTotalPages(data.totalPages || 1)
        } else {
          console.error('주문 목록 조회 실패:', response.status)
        }
      } catch (error) {
        console.error('주문 목록 조회 오류:', error)
      } finally {
        setOrdersLoading(false)
      }
    }

    if (user) {
      fetchOrders()
    }
  }, [user, statusFilter, dateRange, startDate, endDate, currentPage])

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
    if (onNavigateToLogin) onNavigateToLogin()
  }, [onNavigateToLogin])

  const handleMyPageClick = useCallback(() => {
    setIsDropdownOpen(false)
  }, [])

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value)
  }, [])

  const handleSearch = useCallback(() => {
    if (onNavigateToMain) onNavigateToMain()
  }, [onNavigateToMain])

  const handleSearchClick = useCallback(() => {
    setCurrentPage(1) // 검색 시 첫 페이지로
  }, [])

  const handleDateRangeChange = useCallback((range) => {
    setDateRange(range)
    setCurrentPage(1)
  }, [])

  const isAdmin = user && user.user_type === 'admin'

  if (loading) {
    return (
      <div className="my-orders-page">
        <div className="loading-container">
          <div className="loading-spinner">로딩 중...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // 주문 그룹화 (같은 주문번호끼리)
  const groupedOrders = orders.reduce((acc, order) => {
    const orderNumber = order.orderNumber || order._id
    if (!acc[orderNumber]) {
      acc[orderNumber] = {
        orderNumber,
        orderDate: order.createdAt,
        status: order.status,
        tracking: order.tracking,
        orderId: order._id,
        items: []
      }
    }
    acc[orderNumber].items.push(...(order.items || []))
    return acc
  }, {})

  const orderGroups = Object.values(groupedOrders)

  return (
    <div className="my-orders-page">
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
        onNavigateToMyOrders={() => {}}
        cartCount={cartCount}
      />

      <main className="my-orders-main">
        <div className="my-orders-container">
          <h1 className="page-title">주문조회</h1>

          {/* 탭 메뉴 */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              주문내역조회 ({orderGroups.length})
            </button>
            <button
              className={`tab ${activeTab === 'cancel' ? 'active' : ''}`}
              onClick={() => setActiveTab('cancel')}
            >
              취소/반품/교환 내역 (0)
            </button>
            <button
              className={`tab ${activeTab === 'past' ? 'active' : ''}`}
              onClick={() => setActiveTab('past')}
            >
              과거주문내역 (0)
            </button>
          </div>

          {/* 검색 및 필터 */}
          <div className="search-filter-section">
            <div className="filter-row">
              <select
                className="status-filter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="all">전체 주문처리상태</option>
                <option value="주문접수">주문접수</option>
                <option value="결제완료">결제완료</option>
                <option value="배송준비">배송준비</option>
                <option value="배송중">배송중</option>
                <option value="배송완료">배송완료</option>
                <option value="주문취소">주문취소</option>
              </select>

              <div className="date-range-buttons">
                <button
                  className={dateRange === 'today' ? 'active' : ''}
                  onClick={() => handleDateRangeChange('today')}
                >
                  오늘
                </button>
                <button
                  className={dateRange === '1week' ? 'active' : ''}
                  onClick={() => handleDateRangeChange('1week')}
                >
                  1주일
                </button>
                <button
                  className={dateRange === '1month' ? 'active' : ''}
                  onClick={() => handleDateRangeChange('1month')}
                >
                  1개월
                </button>
                <button
                  className={dateRange === '3months' ? 'active' : ''}
                  onClick={() => handleDateRangeChange('3months')}
                >
                  3개월
                </button>
                <button
                  className={dateRange === '6months' ? 'active' : ''}
                  onClick={() => handleDateRangeChange('6months')}
                >
                  6개월
                </button>
              </div>

              <div className="date-inputs">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    setDateRange('custom')
                  }}
                />
                <span>~</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    setDateRange('custom')
                  }}
                />
              </div>

              <button className="btn-search" onClick={handleSearchClick}>
                조회
              </button>
            </div>
          </div>

          {/* 안내 문구 */}
          <div className="info-section">
            <p>기본적으로 최근 3개월간의 자료가 조회되며, 기간 검색시 주문처리완료 후 36개월 이내의 주문내역을 조회하실 수 있습니다.</p>
            <p>완료 후 36개월 이상 경과한 주문은 [과거주문내역]에서 확인할 수 있습니다.</p>
            <p>주문번호를 클릭하시면 해당 주문에 대한 상세내역을 확인하실 수 있습니다.</p>
            <p>교환/반품 신청은 배송완료일 기준 7일까지 가능합니다.</p>
          </div>

          {/* 주문 목록 테이블 */}
          <div className="orders-table-section">
            <h2 className="table-title">주문 상품 정보</h2>
            {ordersLoading ? (
              <div className="loading-container">
                <div className="loading-spinner">주문 목록을 불러오는 중...</div>
              </div>
            ) : orderGroups.length === 0 ? (
              <div className="no-orders">
                <p>주문 내역이 없습니다.</p>
              </div>
            ) : (
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>주문일자 [주문번호]</th>
                    <th>이미지</th>
                    <th>상품정보</th>
                    <th>수량</th>
                    <th>상품구매금액</th>
                    <th>주문처리상태</th>
                    <th>취소/교환/반품</th>
                  </tr>
                </thead>
                <tbody>
                  {orderGroups.map((group, groupIndex) => {
                    const orderDate = group.orderDate
                      ? new Date(group.orderDate).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        }).replace(/\./g, '-').replace(/\s/g, '')
                      : '-'
                    
                    return group.items.map((item, itemIndex) => {
                      const isFirstItem = itemIndex === 0
                      const itemPrice = item.product?.price || 0
                      const itemTotal = itemPrice * item.quantity
                      
                      return (
                        <tr key={`${group.orderNumber}-${itemIndex}`}>
                          {isFirstItem && (
                            <td 
                              className="order-date-cell" 
                              rowSpan={group.items.length}
                              onClick={() => onNavigateToOrderDetail && onNavigateToOrderDetail(group.orderNumber)}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="order-date-number">
                                {orderDate}
                                <br />
                                <span className="order-number-link">[{group.orderNumber}]</span>
                              </div>
                            </td>
                          )}
                          <td className="product-image-cell">
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
                          </td>
                          <td className="product-info-cell">
                            <div className="product-name">{item.product?.name || '상품명 없음'}</div>
                            {item.options && Object.keys(item.options).length > 0 && (
                              <div className="product-options">
                                옵션: {Object.entries(item.options)
                                  .filter(([key, value]) => value)
                                  .map(([key, value]) => `${key}: ${value}`)
                                  .join(', ') || '옵션 없음'}
                              </div>
                            )}
                          </td>
                          <td className="quantity-cell">{item.quantity}</td>
                          <td className="price-cell">{itemTotal.toLocaleString()}원</td>
                          {isFirstItem && (
                            <td className="status-cell" rowSpan={group.items.length}>
                              <div className="status-info">
                                <span className={`status-badge status-${group.status}`}>
                                  {group.status}
                                </span>
                                {group.status === '배송완료' && (
                                  <div className="tracking-info">
                                    <span>우체국택배</span>
                                    {group.tracking?.trackingNumber && (
                                      <span className="tracking-number">
                                        [{group.tracking.trackingNumber}]
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          )}
                          {isFirstItem && (
                            <td className="action-cell" rowSpan={group.items.length}>
                              {group.status === '배송완료' && (
                                <button className="btn-review">구매후기</button>
                              )}
                            </td>
                          )}
                        </tr>
                      )
                    })
                  })}
                </tbody>
              </table>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  &lt;&lt;
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  &gt;
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  &gt;&gt;
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
