import { memo } from 'react'

const Footer = memo(() => {
  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>고객센터</h3>
          <p>1661-7772</p>
          <p>월-금 AM 09:00 ~ PM 18:00</p>
        </div>
        <div className="footer-section">
          <h3>회사정보</h3>
          <p>대표: 홍길동</p>
          <p>사업자등록번호: 123-45-67890</p>
          <p>주소: 서울시 강남구 테헤란로 123</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>Copyright © 2024 쇼핑몰. All rights reserved.</p>
      </div>
    </footer>
  )
})

Footer.displayName = 'Footer'

export default Footer
