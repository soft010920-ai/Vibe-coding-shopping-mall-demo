import { memo } from 'react'

const SearchBar = memo(({ searchQuery, onSearchChange, onSearch }) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSearch()
    }
  }

  return (
    <div className="nav-search">
      <input
        type="text"
        placeholder="상품을 검색하세요"
        value={searchQuery}
        onChange={onSearchChange}
        onKeyPress={handleKeyPress}
        className="search-input"
      />
      <button type="button" className="search-btn" onClick={onSearch}>
        🔍
      </button>
    </div>
  )
})

SearchBar.displayName = 'SearchBar'

export default SearchBar
