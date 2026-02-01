import { useState, useEffect, useCallback, useMemo } from 'react'
import './AdminPage.css'
import { STORAGE_KEYS, clearAuthStorage } from '../../utils/storage'
import { getApiUrl } from '../../utils/api'

export default function AdminPage({ onNavigateToMain, onNavigateToProductRegister, onNavigateToProductEdit }) {
  const [user, setUser] = useState(null)
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [activeTab, setActiveTab] = useState('upcoming')
  
  // 상품 관리 관련 상태
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [productFilters, setProductFilters] = useState({
    category: '',
    status: '',
    search: ''
  })
  const [productPagination, setProductPagination] = useState({
    page: 1,
    limit: 2,
    total: 0,
    totalPages: 0
  })
  const [selectedProduct, setSelectedProduct] = useState(null) // 선택된 상품 상세 정보
  const [showProductDetail, setShowProductDetail] = useState(false) // 상품 상세 모달 표시 여부

  // 주문 관리 관련 상태
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [orderFilters, setOrderFilters] = useState({
    status: '',
    paymentMethod: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  })
  const [orderPagination, setOrderPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [selectedOrderDate, setSelectedOrderDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate()
  })
  const [selectedOrderForStatus, setSelectedOrderForStatus] = useState(null) // 상태 변경할 주문
  const [showStatusDropdown, setShowStatusDropdown] = useState(false) // 상태 변경 드롭다운 표시 여부

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      if (!token) {
        if (onNavigateToMain) onNavigateToMain()
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
            if (data.user.user_type !== 'admin') {
              if (onNavigateToMain) onNavigateToMain()
              return
            }
            setUser(data.user)
          }
        } else {
          if (response.status === 401) {
            clearAuthStorage()
            if (onNavigateToMain) onNavigateToMain()
          }
        }
      } catch (error) {
        console.error('유저 정보 조회 오류:', error)
      }
    }

    fetchUserInfo()
  }, [onNavigateToMain])

  // 로그아웃
  const handleLogout = useCallback(() => {
    clearAuthStorage()
    if (onNavigateToMain) onNavigateToMain()
  }, [onNavigateToMain])

  // 상품 목록 가져오기
  const fetchProducts = useCallback(async () => {
    setProductsLoading(true)
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      const params = new URLSearchParams({
        page: productPagination.page.toString(),
        limit: productPagination.limit.toString()
      })
      
      if (productFilters.category) params.append('category', productFilters.category)
      if (productFilters.status) params.append('status', productFilters.status)
      if (productFilters.search) params.append('search', productFilters.search)

      const response = await fetch(getApiUrl(`/api/products?${params.toString()}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
        setProductPagination(prev => ({
          ...prev,
          total: data.total || 0,
          totalPages: data.totalPages || 0
        }))
      } else {
        console.error('상품 목록 조회 실패:', response.status)
      }
    } catch (error) {
      console.error('상품 목록 조회 오류:', error)
    } finally {
      setProductsLoading(false)
    }
  }, [productFilters, productPagination.page, productPagination.limit])

  // 상품 메뉴 활성화 시 상품 목록 가져오기
  useEffect(() => {
    if (activeMenu === 'products' && user) {
      fetchProducts()
    }
  }, [activeMenu, user, fetchProducts])

  // 주문 목록 가져오기
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true)
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      const params = new URLSearchParams({
        page: orderPagination.page.toString(),
        limit: orderPagination.limit.toString()
      })
      
      if (orderFilters.status) params.append('status', orderFilters.status)
      if (orderFilters.paymentMethod) params.append('paymentMethod', orderFilters.paymentMethod)
      if (orderFilters.dateFrom) params.append('dateFrom', orderFilters.dateFrom)
      if (orderFilters.dateTo) params.append('dateTo', orderFilters.dateTo)

      const response = await fetch(getApiUrl(`/api/orders?${params.toString()}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
        setOrderPagination(prev => ({
          ...prev,
          total: data.total || 0,
          totalPages: data.totalPages || 0
        }))
      } else {
        console.error('주문 목록 조회 실패:', response.status)
      }
    } catch (error) {
      console.error('주문 목록 조회 오류:', error)
    } finally {
      setOrdersLoading(false)
    }
  }, [orderFilters, orderPagination.page, orderPagination.limit])

  // 주문 메뉴 활성화 시 주문 목록 가져오기
  useEffect(() => {
    if (activeMenu === 'orders' && user) {
      fetchOrders()
    }
  }, [activeMenu, user, fetchOrders])

  // 주문 필터 변경
  const handleOrderFilterChange = useCallback((key, value) => {
    setOrderFilters(prev => ({ ...prev, [key]: value }))
    setOrderPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  // 주문 페이지 변경
  const handleOrderPageChange = useCallback((newPage) => {
    setOrderPagination(prev => ({ ...prev, page: newPage }))
  }, [])

  // 주문 검색
  const handleOrderSearch = useCallback(() => {
    // 검색어로 주문번호나 고객명 검색
    // 서버에서 검색 기능이 구현되어 있지 않으면 클라이언트에서 필터링
    setOrderPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  // 날짜 변경 핸들러
  const handleDateChange = useCallback((type, value) => {
    setSelectedOrderDate(prev => {
      const newDate = { ...prev, [type]: value }
      // 날짜가 변경되면 필터에 적용
      const dateStr = `${newDate.year}-${String(newDate.month).padStart(2, '0')}-${String(newDate.day).padStart(2, '0')}`
      setOrderFilters(prevFilters => ({
        ...prevFilters,
        dateFrom: dateStr,
        dateTo: dateStr
      }))
      return newDate
    })
  }, [])

  // 주문 상태 변경
  const handleStatusChange = useCallback(async (orderId, newStatus) => {
    if (!confirm(`주문 상태를 "${newStatus}"로 변경하시겠습니까?`)) {
      return
    }

    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      const response = await fetch(getApiUrl(`/api/orders/${orderId}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus
        })
      })

      if (response.ok) {
        alert('주문 상태가 변경되었습니다.')
        setSelectedOrderForStatus(null)
        setShowStatusDropdown(false)
        fetchOrders() // 주문 목록 다시 불러오기
      } else {
        const data = await response.json()
        alert(data.error || '주문 상태 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('주문 상태 변경 오류:', error)
      alert('주문 상태 변경 중 오류가 발생했습니다.')
    }
  }, [fetchOrders])

  // 상태 변경 드롭다운 토글
  const toggleStatusDropdown = useCallback((orderId, event) => {
    event.stopPropagation()
    if (selectedOrderForStatus === orderId && showStatusDropdown) {
      setSelectedOrderForStatus(null)
      setShowStatusDropdown(false)
    } else {
      setSelectedOrderForStatus(orderId)
      setShowStatusDropdown(true)
    }
  }, [selectedOrderForStatus, showStatusDropdown])

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showStatusDropdown && !event.target.closest('.status-dropdown-container')) {
        setShowStatusDropdown(false)
        setSelectedOrderForStatus(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showStatusDropdown])

  // 상품 선택/해제
  const handleProductSelect = useCallback((productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }, [])

  // 전체 선택/해제
  const handleSelectAll = useCallback(() => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map(p => p._id))
    }
  }, [products, selectedProducts.length])

  // 상품 삭제
  const handleDeleteProducts = useCallback(async () => {
    if (selectedProducts.length === 0) {
      alert('삭제할 상품을 선택해주세요.')
      return
    }

    if (!confirm(`선택한 ${selectedProducts.length}개의 상품을 삭제하시겠습니까?`)) {
      return
    }

    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      const deletePromises = selectedProducts.map(productId =>
        fetch(`/api/products/${productId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      )

      const results = await Promise.all(deletePromises)
      const failed = results.filter(r => !r.ok)
      
      if (failed.length === 0) {
        alert('선택한 상품이 삭제되었습니다.')
        setSelectedProducts([])
        fetchProducts()
      } else {
        alert(`${failed.length}개의 상품 삭제에 실패했습니다.`)
      }
    } catch (error) {
      console.error('상품 삭제 오류:', error)
      alert('상품 삭제 중 오류가 발생했습니다.')
    }
  }, [selectedProducts, fetchProducts])

  // 필터 변경
  const handleFilterChange = useCallback((key, value) => {
    setProductFilters(prev => ({ ...prev, [key]: value }))
    setProductPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  // 페이지 변경
  const handlePageChange = useCallback((newPage) => {
    setProductPagination(prev => ({ ...prev, page: newPage }))
  }, [])

  // 상품 상세 정보 가져오기
  const fetchProductDetail = useCallback(async (productId) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      const response = await fetch(`/api/products/${productId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedProduct(data.product)
        setShowProductDetail(true)
      } else {
        alert('상품 정보를 불러올 수 없습니다.')
      }
    } catch (error) {
      console.error('상품 상세 조회 오류:', error)
      alert('상품 정보를 불러오는 중 오류가 발생했습니다.')
    }
  }, [])

  // 상품 클릭 핸들러
  const handleProductClick = useCallback((product) => {
    fetchProductDetail(product._id)
  }, [fetchProductDetail])

  // 상품 수정 페이지로 이동
  const handleEditProduct = useCallback((product) => {
    if (onNavigateToProductRegister) {
      // 상품 ID를 전달하여 수정 모드로 이동
      onNavigateToProductRegister(product._id)
    }
  }, [onNavigateToProductRegister])

  // 메뉴 아이템
  const menuItems = [
    { id: 'dashboard', label: '대시보드', icon: '📊' },
    { id: 'categories', label: '상품 카테고리', icon: '📁' },
    { id: 'products', label: '상품', icon: '🛍️' },
    { id: 'orders', label: '주문', icon: '📦' },
    { id: 'customers', label: '고객', icon: '👥' },
    { id: 'admins', label: '관리자', icon: '👤' },
    { id: 'schedule', label: '일정', icon: '📅' }
  ]

  // 지표 데이터 (실제로는 API에서 가져와야 함)
  const stats = useMemo(() => ({
    totalCustomers: 24,
    totalProducts: 156,
    activeOrders: 12,
    totalRevenue: 1250000
  }), [])

  // 차트 데이터 (실제로는 API에서 가져와야 함)
  const revenueData = useMemo(() => [
    { month: '1월', value: 850000 },
    { month: '2월', value: 920000 },
    { month: '3월', value: 1100000 },
    { month: '4월', value: 980000 },
    { month: '5월', value: 1050000 },
    { month: '6월', value: 1200000 },
    { month: '7월', value: 1372100 },
    { month: '8월', value: 1250000 },
    { month: '9월', value: 1180000 },
    { month: '10월', value: 1300000 },
    { month: '11월', value: 1450000 },
    { month: '12월', value: 1500000 }
  ], [])

  const customerAgeData = useMemo(() => [
    { label: '00-35세', value: 22, color: '#8B5CF6' },
    { label: '36-55세', value: 31, color: '#EC4899' },
    { label: '56-70세', value: 47, color: '#F97316' }
  ], [])

  // 대시보드용 주문 데이터 (실제로는 API에서 가져와야 함)
  const dashboardOrders = useMemo(() => [
    { id: 1, startTime: '10:00', product: '상품 A', endTime: '10:20', customer: '홍길동', admin: '관리자1' },
    { id: 2, startTime: '10:25', product: '상품 B', endTime: '10:40', customer: '김철수', admin: '관리자2' },
    { id: 3, startTime: '10:45', product: '상품 C', endTime: '10:55', customer: '이영희', admin: '관리자1' },
    { id: 4, startTime: '11:00', product: '상품 D', endTime: '11:20', customer: '박민수', admin: '관리자2' }
  ], [])

  const maxRevenue = Math.max(...revenueData.map(d => d.value))

  if (!user) {
    return <div className="admin-loading">로딩 중...</div>
  }

  return (
    <div className="admin-page">
      {/* 사이드바 */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-logo">
            <span className="logo-icon">🛒</span>
            쇼핑몰
          </h1>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
              onClick={() => setActiveMenu(item.id)}
              type="button"
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={() => setActiveMenu('settings')} type="button">
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">설정</span>
          </button>
          <button className="nav-item" onClick={handleLogout} type="button">
            <span className="nav-icon">🚪</span>
            <span className="nav-label">로그아웃</span>
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="admin-main">
        {/* 헤더 */}
        <header className="admin-header">
          <div className="header-search">
            <input
              type="text"
              placeholder="검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>

          <div className="header-user">
            <button className="notification-btn" type="button">
              🔔
            </button>
            <div className="user-profile">
              <div className="user-avatar">
                {user.name?.[0] || 'A'}
              </div>
              <div className="user-info">
                <div className="user-name">{user.name || '관리자'}</div>
                <div className="user-role">관리자</div>
              </div>
              <span className="dropdown-arrow">▼</span>
            </div>
          </div>
        </header>

        {/* 대시보드 콘텐츠 */}
        {activeMenu === 'dashboard' && (
          <div className="dashboard-content">
            {/* 지표 카드 */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <div className="stat-label">총 고객</div>
                  <div className="stat-value">{stats.totalCustomers}</div>
                </div>
                <button className="stat-expand" type="button">↗</button>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🛍️</div>
                <div className="stat-info">
                  <div className="stat-label">총 상품</div>
                  <div className="stat-value">{stats.totalProducts}</div>
                </div>
                <button className="stat-expand" type="button">↗</button>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-info">
                  <div className="stat-label">활성 주문</div>
                  <div className="stat-value">{stats.activeOrders}</div>
                </div>
                <button className="stat-expand" type="button">↗</button>
              </div>

              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-info">
                  <div className="stat-label">총 매출</div>
                  <div className="stat-value">{(stats.totalRevenue / 10000).toFixed(0)}만원</div>
                </div>
                <button className="stat-expand" type="button">↗</button>
              </div>
            </div>

            {/* 차트 섹션 */}
            <div className="charts-grid">
              {/* 연간 매출 차트 */}
              <div className="chart-card">
                <div className="chart-header">
                  <h3 className="chart-title">연간 매출 차트</h3>
                  <div className="chart-controls">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="chart-select"
                    >
                      <option value={2024}>2024년</option>
                      <option value={2023}>2023년</option>
                    </select>
                    <button className="chart-refresh" type="button">🔄</button>
                  </div>
                </div>
                <div className="chart-content">
                  <div className="line-chart">
                    <div className="chart-y-axis">
                      {[0, 5, 10, 15, 20, 25].map((val) => (
                        <div key={val} className="y-tick">
                          {val}만원
                        </div>
                      ))}
                    </div>
                    <div className="chart-area">
                      <svg className="chart-svg" viewBox="0 0 800 200">
                        <polyline
                          points={revenueData.map((d, i) => 
                            `${(i * 800) / 11},${200 - (d.value / maxRevenue) * 200}`
                          ).join(' ')}
                          fill="none"
                          stroke="#8B5CF6"
                          strokeWidth="3"
                        />
                        {revenueData.map((d, i) => (
                          <circle
                            key={i}
                            cx={(i * 800) / 11}
                            cy={200 - (d.value / maxRevenue) * 200}
                            r="4"
                            fill="#8B5CF6"
                          />
                        ))}
                      </svg>
                      <div className="chart-x-axis">
                        {revenueData.map((d) => (
                          <div key={d.month} className="x-tick">
                            {d.month.replace('월', '')}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 고객 연령대 차트 */}
              <div className="chart-card">
                <div className="chart-header">
                  <h3 className="chart-title">고객 연령대 차트</h3>
                  <div className="chart-controls">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="chart-select"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>{m}월</option>
                      ))}
                    </select>
                    <button className="chart-refresh" type="button">🔄</button>
                  </div>
                </div>
                <div className="chart-content">
                  <div className="donut-chart">
                    <div className="donut-center">
                      <div className="donut-percentage">100%</div>
                    </div>
                    <svg className="donut-svg" viewBox="0 0 200 200">
                      {(() => {
                        let currentAngle = -90
                        return customerAgeData.map((item, index) => {
                          const angle = (item.value / 100) * 360
                          const startAngle = currentAngle
                          const endAngle = currentAngle + angle
                          currentAngle = endAngle

                          const x1 = 100 + 80 * Math.cos((startAngle * Math.PI) / 180)
                          const y1 = 100 + 80 * Math.sin((startAngle * Math.PI) / 180)
                          const x2 = 100 + 80 * Math.cos((endAngle * Math.PI) / 180)
                          const y2 = 100 + 80 * Math.sin((endAngle * Math.PI) / 180)
                          const largeArc = angle > 180 ? 1 : 0

                          return (
                            <path
                              key={index}
                              d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                              fill={item.color}
                            />
                          )
                        })
                      })()}
                    </svg>
                    <div className="donut-legend">
                      {customerAgeData.map((item, index) => (
                        <div key={index} className="legend-item">
                          <div
                            className="legend-color"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="legend-text">
                            {item.value}% {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 주문 테이블 */}
            <div className="orders-table-card">
              <div className="table-header">
                <div className="table-tabs">
                  <button
                    className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
                    onClick={() => setActiveTab('upcoming')}
                    type="button"
                  >
                    예정된 주문
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                    type="button"
                  >
                    전체 주문
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'canceled' ? 'active' : ''}`}
                    onClick={() => setActiveTab('canceled')}
                    type="button"
                  >
                    취소된 주문
                  </button>
                </div>
                <div className="table-controls">
                  <button className="filter-btn" type="button">
                    🔽 필터
                  </button>
                  <button className="see-all-btn" type="button">
                    모두 보기 &gt;
                  </button>
                </div>
              </div>

              <table className="orders-table">
                <thead>
                  <tr>
                    <th>주문 시간</th>
                    <th>주문 상품</th>
                    <th>예상 완료</th>
                    <th>고객</th>
                    <th>담당자</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardOrders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.startTime}</td>
                      <td>{order.product}</td>
                      <td>{order.endTime}</td>
                      <td>{order.customer}</td>
                      <td>{order.admin}</td>
                      <td>
                        <button className="action-btn" type="button">
                          ⋮
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 상품 메뉴 */}
        {activeMenu === 'products' && (
          <div className="admin-content">
            <div className="content-header">
              <h2>상품 관리</h2>
              <button
                className="btn-primary"
                onClick={() => onNavigateToProductRegister && onNavigateToProductRegister()}
                type="button"
              >
                + 새 상품 등록하기
              </button>
            </div>

            {/* 필터 섹션 */}
            <div className="products-filters">
              <div className="filter-group">
                <label>카테고리</label>
                <select
                  value={productFilters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="filter-select"
                >
                  <option value="">전체</option>
                  <option value="커튼">커튼</option>
                  <option value="블라인드">블라인드</option>
                  <option value="롤스크린">롤스크린</option>
                  <option value="부자재">부자재</option>
                </select>
              </div>
              <div className="filter-group">
                <label>상태</label>
                <select
                  value={productFilters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="filter-select"
                >
                  <option value="">전체</option>
                  <option value="판매중">판매중</option>
                  <option value="품절">품절</option>
                  <option value="판매중지">판매중지</option>
                </select>
              </div>
              <div className="filter-group">
                <label>검색</label>
                <input
                  type="text"
                  value={productFilters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="상품명 또는 설명 검색"
                  className="filter-input"
                />
              </div>
            </div>

            {/* 상품 목록 테이블 */}
            <div className="products-table-section">
              <div className="table-header-actions">
                <div className="table-info">
                  <span>총 {productPagination.total}개</span>
                  {selectedProducts.length > 0 && (
                    <span className="selected-count">({selectedProducts.length}개 선택됨)</span>
                  )}
                </div>
                <div className="table-actions">
                  {selectedProducts.length > 0 && (
                    <button
                      className="btn-delete"
                      onClick={handleDeleteProducts}
                      type="button"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>

              {productsLoading ? (
                <div className="loading-state">로딩 중...</div>
              ) : products.length === 0 ? (
                <div className="empty-state">등록된 상품이 없습니다.</div>
              ) : (
                <>
                  <table className="products-table">
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={selectedProducts.length === products.length && products.length > 0}
                            onChange={handleSelectAll}
                          />
                        </th>
                        <th>상품코드(SKU)</th>
                        <th>상품명</th>
                        <th>카테고리</th>
                        <th>상태</th>
                        <th>판매가</th>
                        <th>재고</th>
                        <th>작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product._id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(product._id)}
                              onChange={() => handleProductSelect(product._id)}
                            />
                          </td>
                          <td>{product.sku}</td>
                          <td>
                            <div className="product-name-cell">
                              {product.images && product.images.length > 0 && (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="product-thumbnail"
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                  }}
                                />
                              )}
                              <span>{product.name}</span>
                            </div>
                          </td>
                          <td>{product.category}</td>
                          <td>
                            <span className={`status-badge status-${product.status === '판매중' ? 'active' : product.status === '품절' ? 'out' : 'stop'}`}>
                              {product.status}
                            </span>
                          </td>
                          <td>{Number(product.price).toLocaleString()}원</td>
                          <td>{product.stock || 0}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="action-btn view-btn"
                                onClick={() => handleProductClick(product)}
                                type="button"
                                title="상세보기"
                              >
                                👁️
                              </button>
                              <button
                                className="action-btn edit-btn"
                                onClick={() => handleEditProduct(product)}
                                type="button"
                                title="수정"
                              >
                                ✏️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* 페이지네이션 */}
                  {productPagination.totalPages > 1 && (
                    <div className="pagination">
                      <button
                        className="page-btn"
                        onClick={() => handlePageChange(1)}
                        disabled={productPagination.page === 1}
                        type="button"
                      >
                        처음
                      </button>
                      <button
                        className="page-btn"
                        onClick={() => handlePageChange(productPagination.page - 1)}
                        disabled={productPagination.page === 1}
                        type="button"
                      >
                        이전
                      </button>
                      <div className="page-numbers">
                        {Array.from({ length: productPagination.totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            const current = productPagination.page
                            const total = productPagination.totalPages
                            // 현재 페이지 주변 2페이지씩 표시
                            return page === 1 || 
                                   page === total || 
                                   (page >= current - 1 && page <= current + 1)
                          })
                          .map((page, index, array) => {
                            // 이전 페이지와의 간격이 2 이상이면 ... 표시
                            const prevPage = array[index - 1]
                            const showEllipsis = prevPage && page - prevPage > 1
                            
                            return (
                              <span key={page} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                {showEllipsis && <span className="page-ellipsis">...</span>}
                                <button
                                  className={`page-number ${productPagination.page === page ? 'active' : ''}`}
                                  onClick={() => handlePageChange(page)}
                                  type="button"
                                >
                                  {page}
                                </button>
                              </span>
                            )
                          })}
                      </div>
                      <button
                        className="page-btn"
                        onClick={() => handlePageChange(productPagination.page + 1)}
                        disabled={productPagination.page >= productPagination.totalPages}
                        type="button"
                      >
                        다음
                      </button>
                      <button
                        className="page-btn"
                        onClick={() => handlePageChange(productPagination.totalPages)}
                        disabled={productPagination.page >= productPagination.totalPages}
                        type="button"
                      >
                        마지막
                      </button>
                      <span className="page-info">
                        {productPagination.page} / {productPagination.totalPages} 페이지
                        ({productPagination.total}개 상품)
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* 상품 상세 모달 */}
        {showProductDetail && selectedProduct && (
          <div className="product-detail-modal" onClick={() => setShowProductDetail(false)}>
            <div className="product-detail-content" onClick={(e) => e.stopPropagation()}>
              <div className="product-detail-header">
                <h2>상품 상세 정보</h2>
                <button
                  className="close-modal-btn"
                  onClick={() => setShowProductDetail(false)}
                  type="button"
                >
                  ×
                </button>
              </div>
              
              <div className="product-detail-body">
                <div className="product-detail-section">
                  <h3>기본 정보</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>상품명</label>
                      <div>{selectedProduct.name}</div>
                    </div>
                    <div className="detail-item">
                      <label>SKU</label>
                      <div>{selectedProduct.sku}</div>
                    </div>
                    <div className="detail-item">
                      <label>카테고리</label>
                      <div>{selectedProduct.category}</div>
                    </div>
                    <div className="detail-item">
                      <label>판매가</label>
                      <div>{Number(selectedProduct.price).toLocaleString()}원</div>
                    </div>
                    <div className="detail-item">
                      <label>상태</label>
                      <div>
                        <span className={`status-badge status-${selectedProduct.status === '판매중' ? 'active' : selectedProduct.status === '품절' ? 'out' : 'stop'}`}>
                          {selectedProduct.status}
                        </span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <label>재고</label>
                      <div>{selectedProduct.stock || 0}개</div>
                    </div>
                  </div>
                </div>

                {selectedProduct.description && (
                  <div className="product-detail-section">
                    <h3>상품 설명</h3>
                    <div className="detail-description">{selectedProduct.description}</div>
                  </div>
                )}

                {selectedProduct.images && selectedProduct.images.length > 0 && (
                  <div className="product-detail-section">
                    <h3>상품 이미지</h3>
                    <div className="detail-images">
                      {selectedProduct.images.map((img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt={`상품 이미지 ${index + 1}`}
                          className="detail-image"
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="product-detail-section">
                  <h3>등록 정보</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>등록일</label>
                      <div>{selectedProduct.createdAt ? new Date(selectedProduct.createdAt).toLocaleString('ko-KR') : '-'}</div>
                    </div>
                    <div className="detail-item">
                      <label>수정일</label>
                      <div>{selectedProduct.updatedAt ? new Date(selectedProduct.updatedAt).toLocaleString('ko-KR') : '-'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="product-detail-footer">
                <button
                  className="btn-secondary"
                  onClick={() => setShowProductDetail(false)}
                  type="button"
                >
                  닫기
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setShowProductDetail(false)
                    handleEditProduct(selectedProduct)
                  }}
                  type="button"
                >
                  수정하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 주문 관리 메뉴 */}
        {activeMenu === 'orders' && (
          <div className="admin-content">
            <div className="orders-management-header">
              <div className="orders-header-left">
                <div className="orders-icon">🪟</div>
                <div>
                  <h2 className="orders-title">주문 관리</h2>
                  <p className="orders-subtitle">전체 주문 내역을 관리합니다</p>
                </div>
              </div>
              <div className="orders-header-right">
                <div className="date-selectors">
                  <input
                    type="number"
                    value={selectedOrderDate.year}
                    onChange={(e) => handleDateChange('year', parseInt(e.target.value))}
                    className="date-input"
                    placeholder="연도"
                    min="2020"
                    max="2030"
                  />
                  <span className="date-separator">-</span>
                  <input
                    type="number"
                    value={selectedOrderDate.month}
                    onChange={(e) => handleDateChange('month', parseInt(e.target.value))}
                    className="date-input"
                    placeholder="월"
                    min="1"
                    max="12"
                  />
                  <span className="date-separator">-</span>
                  <input
                    type="number"
                    value={selectedOrderDate.day}
                    onChange={(e) => handleDateChange('day', parseInt(e.target.value))}
                    className="date-input"
                    placeholder="일"
                    min="1"
                    max="31"
                  />
                </div>
                <div className="orders-search-bar">
                  <input
                    type="text"
                    placeholder="Q 주문번호, 고객명 검색"
                    value={orderFilters.search}
                    onChange={(e) => handleOrderFilterChange('search', e.target.value)}
                    className="orders-search-input"
                    onKeyPress={(e) => e.key === 'Enter' && handleOrderSearch()}
                  />
                  <button 
                    className="orders-search-btn"
                    onClick={handleOrderSearch}
                    type="button"
                  >
                    검색
                  </button>
                </div>
              </div>
            </div>

            {/* 필터 섹션 */}
            <div className="orders-filters">
              <div className="filter-group">
                <label>주문 상태</label>
                <select
                  value={orderFilters.status}
                  onChange={(e) => handleOrderFilterChange('status', e.target.value)}
                  className="filter-select"
                >
                  <option value="">전체</option>
                  <option value="주문접수">주문접수</option>
                  <option value="결제완료">결제완료</option>
                  <option value="배송준비">배송준비</option>
                  <option value="배송중">배송중</option>
                  <option value="배송완료">배송완료</option>
                  <option value="주문취소">주문취소</option>
                  <option value="환불">환불</option>
                  <option value="교환">교환</option>
                  <option value="환불처리중">환불처리중</option>
                  <option value="환불완료">환불완료</option>
                </select>
              </div>
              <div className="filter-group">
                <label>결제 수단</label>
                <select
                  value={orderFilters.paymentMethod}
                  onChange={(e) => handleOrderFilterChange('paymentMethod', e.target.value)}
                  className="filter-select"
                >
                  <option value="">전체</option>
                  <option value="카드결제">카드결제</option>
                  <option value="계좌이체">계좌이체</option>
                  <option value="무통장입금">무통장입금</option>
                  <option value="휴대폰결제">휴대폰결제</option>
                  <option value="간편결제">간편결제</option>
                  <option value="실시간 계좌이체">실시간 계좌이체</option>
                  <option value="가상계좌">가상계좌</option>
                </select>
              </div>
              <div className="orders-count">
                총 {orderPagination.total}건
              </div>
            </div>

            {/* 주문 목록 테이블 */}
            <div className="orders-table-section">
              {ordersLoading ? (
                <div className="loading-state">로딩 중...</div>
              ) : orders.length === 0 ? (
                <div className="empty-state">주문 내역이 없습니다.</div>
              ) : (
                <>
                  <table className="orders-management-table">
                    <thead>
                      <tr>
                        <th>주문일자</th>
                        <th>주문번호</th>
                        <th>고객명</th>
                        <th>상품정보</th>
                        <th>수량</th>
                        <th>결제금액</th>
                        <th>결제상태</th>
                        <th>배송상태</th>
                        <th>관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const orderDate = order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            }).replace(/\./g, '.').replace(/\s/g, '')
                          : '-'
                        
                        return order.items?.map((item, itemIndex) => {
                          const isFirstItem = itemIndex === 0
                          const itemPrice = item.product?.price || 0
                          const itemTotal = itemPrice * item.quantity
                          
                          return (
                            <tr key={`${order._id}-${itemIndex}`}>
                              {isFirstItem && (
                                <td className="order-date-cell" rowSpan={order.items.length}>
                                  {orderDate}
                                </td>
                              )}
                              {isFirstItem && (
                                <td className="order-number-cell" rowSpan={order.items.length}>
                                  {order.orderNumber || order._id}
                                </td>
                              )}
                              {isFirstItem && (
                                <td className="customer-name-cell" rowSpan={order.items.length}>
                                  {order.user?.name || '-'}
                                </td>
                              )}
                              <td className="product-info-cell">
                                <div className="product-info-row">
                                  {item.product?.images && item.product.images.length > 0 ? (
                                    <img
                                      src={item.product.images[0]}
                                      alt={item.product.name}
                                      className="order-product-image"
                                      onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/60x60?text=No+Image'
                                      }}
                                    />
                                  ) : (
                                    <div className="order-product-image-placeholder">이미지 없음</div>
                                  )}
                                  <div className="product-info-text">
                                    <div className="product-name-text">{item.product?.name || '상품명 없음'}</div>
                                    {item.options && Object.keys(item.options).length > 0 && (
                                      <div className="product-options-text">
                                        {Object.entries(item.options)
                                          .filter(([key, value]) => value)
                                          .map(([key, value]) => `${key}: ${value}`)
                                          .join(' / ') || '옵션 없음'}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="quantity-cell">{item.quantity}</td>
                              <td className="price-cell">{itemTotal.toLocaleString()}원</td>
                              {isFirstItem && (
                                <td className="payment-status-cell" rowSpan={order.items.length}>
                                  <span className={`status-badge payment-status-${order.payment?.status || 'default'}`}>
                                    {order.payment?.status || '-'}
                                  </span>
                                </td>
                              )}
                              {isFirstItem && (
                                <td className="delivery-status-cell" rowSpan={order.items.length}>
                                  <span className={`status-badge delivery-status-${order.status || 'default'}`}>
                                    {order.status || '-'}
                                  </span>
                                </td>
                              )}
                              {isFirstItem && (
                                <td className="management-cell" rowSpan={order.items.length}>
                                  <div className="management-buttons">
                                    <button
                                      className="view-btn"
                                      onClick={() => {
                                        // 주문 상세 보기
                                        alert(`주문 상세: ${order.orderNumber}`)
                                      }}
                                      type="button"
                                      title="상세보기"
                                    >
                                      👁️
                                    </button>
                                    <div className="status-dropdown-container" style={{ position: 'relative' }}>
                                      <button
                                        className="settings-btn"
                                        onClick={(e) => toggleStatusDropdown(order._id, e)}
                                        type="button"
                                        title="상태 변경"
                                      >
                                        ⚙️
                                      </button>
                                      {selectedOrderForStatus === order._id && showStatusDropdown && (
                                        <div className="status-dropdown">
                                          <div className="status-dropdown-header">주문 상태 변경</div>
                                          <div className="status-dropdown-options">
                                            <button
                                              className={`status-option ${order.status === '주문접수' ? 'active' : ''}`}
                                              onClick={() => handleStatusChange(order._id, '주문접수')}
                                              type="button"
                                            >
                                              주문접수
                                            </button>
                                            <button
                                              className={`status-option ${order.status === '배송중' ? 'active' : ''}`}
                                              onClick={() => handleStatusChange(order._id, '배송중')}
                                              type="button"
                                            >
                                              배송중
                                            </button>
                                            <button
                                              className={`status-option ${order.status === '배송완료' ? 'active' : ''}`}
                                              onClick={() => handleStatusChange(order._id, '배송완료')}
                                              type="button"
                                            >
                                              배송완료
                                            </button>
                                            <button
                                              className={`status-option ${order.status === '환불' ? 'active' : ''}`}
                                              onClick={() => handleStatusChange(order._id, '환불')}
                                              type="button"
                                            >
                                              환불
                                            </button>
                                            <button
                                              className={`status-option ${order.status === '교환' ? 'active' : ''}`}
                                              onClick={() => handleStatusChange(order._id, '교환')}
                                              type="button"
                                            >
                                              교환
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              )}
                            </tr>
                          )
                        })
                      })}
                    </tbody>
                  </table>

                  {/* 페이지네이션 */}
                  {orderPagination.totalPages > 1 && (
                    <div className="pagination">
                      <button
                        className="page-btn"
                        onClick={() => handleOrderPageChange(1)}
                        disabled={orderPagination.page === 1}
                        type="button"
                      >
                        &lt;&lt;
                      </button>
                      <button
                        className="page-btn"
                        onClick={() => handleOrderPageChange(orderPagination.page - 1)}
                        disabled={orderPagination.page === 1}
                        type="button"
                      >
                        &lt;
                      </button>
                      {Array.from({ length: orderPagination.totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          const current = orderPagination.page
                          const total = orderPagination.totalPages
                          return page === 1 || 
                                 page === total || 
                                 (page >= current - 1 && page <= current + 1)
                        })
                        .map((page, index, array) => {
                          const prevPage = array[index - 1]
                          const showEllipsis = prevPage && page - prevPage > 1
                          
                          return (
                            <span key={page} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              {showEllipsis && <span className="page-ellipsis">...</span>}
                              <button
                                className={`page-number ${orderPagination.page === page ? 'active' : ''}`}
                                onClick={() => handleOrderPageChange(page)}
                                type="button"
                              >
                                {page}
                              </button>
                            </span>
                          )
                        })}
                      <button
                        className="page-btn"
                        onClick={() => handleOrderPageChange(orderPagination.page + 1)}
                        disabled={orderPagination.page >= orderPagination.totalPages}
                        type="button"
                      >
                        &gt;
                      </button>
                      <button
                        className="page-btn"
                        onClick={() => handleOrderPageChange(orderPagination.totalPages)}
                        disabled={orderPagination.page >= orderPagination.totalPages}
                        type="button"
                      >
                        &gt;&gt;
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* 다른 메뉴 콘텐츠 */}
        {activeMenu !== 'dashboard' && activeMenu !== 'products' && activeMenu !== 'orders' && (
          <div className="admin-content">
            <h2>{menuItems.find(item => item.id === activeMenu)?.label || '페이지'}</h2>
            <p>이 기능은 준비 중입니다.</p>
          </div>
        )}
      </main>
    </div>
  )
}
