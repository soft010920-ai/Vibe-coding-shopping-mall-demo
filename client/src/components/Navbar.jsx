import { memo } from 'react'
import './Navbar.css'
import SearchBar from './SearchBar'
import UserDropdown from './UserDropdown'

const CATEGORIES = [
  '전체상품',
  '베스트',
  '신상품',
  '기획전',
  '이벤트',
  '커뮤니티',
  '고객센터'
]

const Navbar = memo(({
  user,
  isAdmin,
  searchQuery,
  isDropdownOpen,
  dropdownRef,
  onSearchChange,
  onSearch,
  onToggleDropdown,
  onLogout,
  onMyPageClick,
  onNavigateToLogin,
  onNavigateToSignup,
  onNavigateToAdmin,
  onNavigateToCart,
  onNavigateToMyOrders,
  cartCount = 0
}) => {
  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* 로고 */}
        <div className="nav-logo">
          <h1>로드인</h1>
        </div>

        {/* 검색바 */}
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onSearch={onSearch}
        />

        {/* 사용자 링크 */}
        <div className="nav-user-links">
          {!user ? (
            <>
              <button
                className="nav-link-btn"
                onClick={onNavigateToLogin}
                type="button"
              >
                로그인
              </button>
              <button
                className="nav-link-btn"
                onClick={onNavigateToSignup}
                type="button"
              >
                회원가입
              </button>
            </>
          ) : (
            <UserDropdown
              user={user}
              isOpen={isDropdownOpen}
              dropdownRef={dropdownRef}
              onToggle={onToggleDropdown}
              onLogout={onLogout}
              onMyPageClick={onMyPageClick}
              onNavigateToMyOrders={onNavigateToMyOrders}
            />
          )}
          <button
            className="nav-link-btn cart-btn"
            onClick={onNavigateToCart || (() => alert('장바구니 기능은 준비 중입니다.'))}
            type="button"
          >
            장바구니
            {cartCount > 0 && (
              <span className="cart-badge">{cartCount}</span>
            )}
          </button>
          {user && (
            <button
              className="nav-link-btn"
              onClick={() => alert('마이페이지 기능은 준비 중입니다.')}
              type="button"
            >
              마이페이지
            </button>
          )}
          {isAdmin && onNavigateToAdmin && (
            <button
              className="nav-link-btn admin-btn"
              onClick={onNavigateToAdmin}
              type="button"
            >
              어드민
            </button>
          )}
        </div>
      </div>

      {/* 카테고리 메뉴 */}
      <div className="nav-categories">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            className="category-btn"
            onClick={() => alert(`${category} 기능은 준비 중입니다.`)}
            type="button"
          >
            {category}
          </button>
        ))}
      </div>
    </nav>
  )
})

Navbar.displayName = 'Navbar'

export default Navbar
