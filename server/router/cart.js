const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const {
  getCartItems,
  addToCart,
  updateCartItem,
  deleteCartItem,
  clearCart
} = require('../controllers/cartController');
const { verifyToken } = require('../middleware/authMiddleware');

// MongoDB 연결 상태 확인 미들웨어
const checkMongoConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: '데이터베이스에 연결할 수 없습니다.',
      details: 'MongoDB 연결이 완료되지 않았습니다.',
      connectionState: mongoose.connection.readyState,
    });
  }
  next();
};

// 현재 사용자의 장바구니 목록 조회 (인증 필요)
// GET /api/cart
// 헤더: Authorization: Bearer <token>
router.get('/', checkMongoConnection, verifyToken, getCartItems);

// 장바구니에 상품 추가 (인증 필요)
// POST /api/cart
// 헤더: Authorization: Bearer <token>
// Body: { productId, quantity, options: { color, pleats, width, height, additional, installation, rod } }
router.post('/', checkMongoConnection, verifyToken, addToCart);

// 장바구니 항목 수정 (인증 필요)
// PUT /api/cart/:id
// 헤더: Authorization: Bearer <token>
// Body: { quantity, options: { ... } }
router.put('/:id', checkMongoConnection, verifyToken, updateCartItem);

// 장바구니 항목 삭제 (인증 필요)
// DELETE /api/cart/:id
// 헤더: Authorization: Bearer <token>
router.delete('/:id', checkMongoConnection, verifyToken, deleteCartItem);

// 현재 사용자의 장바구니 전체 삭제 (인증 필요)
// DELETE /api/cart
// 헤더: Authorization: Bearer <token>
router.delete('/', checkMongoConnection, verifyToken, clearCart);

module.exports = router;
