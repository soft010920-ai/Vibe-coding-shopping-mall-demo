import { memo } from 'react'

const TopBanner = memo(() => {
  return (
    <div className="top-banner">
      <p>신규 회원가입 시 3,000P 적립!</p>
    </div>
  )
})

TopBanner.displayName = 'TopBanner'

export default TopBanner
