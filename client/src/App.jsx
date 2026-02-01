import { useState } from 'react'
import './App.css'
import MainPage from './pages/MainPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import AdminPage from './pages/admin/AdminPage.jsx'
import ProductRegisterPage from './pages/admin/ProductRegisterPage.jsx'
import ProductDetailPage from './pages/ProductDetailPage.jsx'
import CartPage from './pages/CartPage.jsx'
import OrderPage from './pages/OrderPage.jsx'
import CheckoutPage from './pages/CheckoutPage.jsx'
import OrderCompletePage from './pages/OrderCompletePage.jsx'
import MyOrdersPage from './pages/MyOrdersPage.jsx'

export default function App() {
  const [currentPage, setCurrentPage] = useState('main') // 'main', 'login', 'signup', 'admin', 'product-register', 'product-detail-:id', 'cart', 'order', 'checkout', 'order-complete-:id', 'order-failed-:id'
  const [orderCartItemIds, setOrderCartItemIds] = useState([])
  
  const handleNavigateToOrderComplete = (orderId) => {
    setCurrentPage(`order-complete-${orderId}`)
  }
  
  const handleNavigateToOrderFailed = (errorMessage) => {
    // 에러 메시지를 URL 인코딩하여 전달
    const encodedError = encodeURIComponent(errorMessage)
    setCurrentPage(`order-failed-error:${encodedError}`)
  }

  return (
    <div className="app">
      {currentPage === 'main' ? (
        <MainPage
          onNavigateToSignup={() => setCurrentPage('signup')}
          onNavigateToLogin={() => setCurrentPage('login')}
          onNavigateToAdmin={() => setCurrentPage('admin')}
          onNavigateToProductDetail={(productId) => setCurrentPage(`product-detail-${productId}`)}
          onNavigateToCart={() => setCurrentPage('cart')}
          onNavigateToMyOrders={() => setCurrentPage('my-orders')}
        />
      ) : currentPage === 'login' ? (
        <LoginPage
          onNavigateToMain={() => setCurrentPage('main')}
          onNavigateToSignup={() => setCurrentPage('signup')}
        />
      ) : currentPage === 'admin' ? (
        <AdminPage
          onNavigateToMain={() => setCurrentPage('main')}
          onNavigateToProductRegister={(productId) => setCurrentPage(productId ? `product-edit-${productId}` : 'product-register')}
        />
      ) : currentPage === 'product-register' ? (
        <ProductRegisterPage
          onNavigateToAdmin={() => setCurrentPage('admin')}
        />
      ) : currentPage.startsWith('product-edit-') ? (
        <ProductRegisterPage
          productId={currentPage.replace('product-edit-', '')}
          onNavigateToAdmin={() => setCurrentPage('admin')}
        />
      ) : currentPage.startsWith('product-detail-') ? (
        <ProductDetailPage
          productId={currentPage.replace('product-detail-', '')}
          onNavigateToMain={() => setCurrentPage('main')}
          onNavigateToLogin={() => setCurrentPage('login')}
          onNavigateToCart={() => setCurrentPage('cart')}
          onNavigateToMyOrders={() => setCurrentPage('my-orders')}
        />
      ) : currentPage === 'cart' ? (
        <CartPage
          onNavigateToMain={() => setCurrentPage('main')}
          onNavigateToLogin={() => setCurrentPage('login')}
          onNavigateToSignup={() => setCurrentPage('signup')}
          onNavigateToAdmin={() => setCurrentPage('admin')}
          onNavigateToOrder={(cartItemIds) => {
            setOrderCartItemIds(cartItemIds)
            setCurrentPage('order')
          }}
          onNavigateToMyOrders={() => setCurrentPage('my-orders')}
        />
      ) : currentPage === 'order' ? (
        <OrderPage
          cartItemIds={orderCartItemIds}
          onNavigateToMain={() => setCurrentPage('main')}
          onNavigateToLogin={() => setCurrentPage('login')}
          onNavigateToSignup={() => setCurrentPage('signup')}
          onNavigateToAdmin={() => setCurrentPage('admin')}
          onNavigateToOrderComplete={handleNavigateToOrderComplete}
          onNavigateToOrderFailed={handleNavigateToOrderFailed}
          onNavigateToMyOrders={() => setCurrentPage('my-orders')}
        />
      ) : currentPage === 'checkout' ? (
        <CheckoutPage
          cartItemIds={orderCartItemIds}
          onNavigateToMain={() => setCurrentPage('main')}
          onNavigateToLogin={() => setCurrentPage('login')}
          onNavigateToSignup={() => setCurrentPage('signup')}
          onNavigateToAdmin={() => setCurrentPage('admin')}
          onNavigateToOrderComplete={handleNavigateToOrderComplete}
          onNavigateToOrderFailed={handleNavigateToOrderFailed}
          onNavigateToMyOrders={() => setCurrentPage('my-orders')}
        />
      ) : currentPage.startsWith('order-complete-') ? (
        <OrderCompletePage
          orderId={currentPage.replace('order-complete-', '')}
          onNavigateToMain={() => setCurrentPage('main')}
          onNavigateToMyOrders={() => setCurrentPage('my-orders')}
        />
      ) : currentPage === 'my-orders' ? (
        <MyOrdersPage
          onNavigateToMain={() => setCurrentPage('main')}
          onNavigateToLogin={() => setCurrentPage('login')}
          onNavigateToOrderDetail={(orderNumber) => {
            // 주문번호로 주문 상세 조회 (orderNumber로 주문 ID 찾기 필요)
            // 임시로 order-complete 페이지로 이동
            setCurrentPage(`order-complete-${orderNumber}`)
          }}
        />
      ) : currentPage.startsWith('order-failed-') ? (
        <OrderCompletePage
          orderId=""
          isFailure={true}
          errorMessage={currentPage.includes('error:') ? decodeURIComponent(currentPage.split('error:')[1]) : '주문 처리 중 오류가 발생했습니다.'}
          onNavigateToMain={() => setCurrentPage('main')}
          onNavigateToMyOrders={() => setCurrentPage('my-orders')}
        />
      ) : (
        <SignupPage onNavigateToMain={() => setCurrentPage('main')} />
      )}
    </div>
  )
}
