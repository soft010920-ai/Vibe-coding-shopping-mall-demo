import { memo } from 'react'

const UserDropdown = memo(({ 
  user, 
  isOpen, 
  dropdownRef, 
  onToggle, 
  onLogout, 
  onMyPageClick,
  onNavigateToMyOrders
}) => {
  const handleMyOrdersClick = () => {
    if (onNavigateToMyOrders) {
      onNavigateToMyOrders()
    }
    onToggle() // 드롭다운 닫기
  }

  return (
    <div className="user-welcome-nav" ref={dropdownRef}>
      <button
        className="nav-link-btn welcome-btn"
        onClick={onToggle}
        type="button"
      >
        {user.name}님 환영합니다
        <span className="dropdown-arrow">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>
      {isOpen && (
        <div className="dropdown-menu">
          <button
            className="dropdown-item"
            onClick={onMyPageClick}
            type="button"
          >
            마이페이지
          </button>
          <button
            className="dropdown-item"
            onClick={handleMyOrdersClick}
            type="button"
          >
            내 주문 목록
          </button>
          <button
            className="dropdown-item"
            onClick={onLogout}
            type="button"
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  )
})

UserDropdown.displayName = 'UserDropdown'

export default UserDropdown
