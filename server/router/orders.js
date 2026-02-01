const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  cancelOrder
} = require('../controllers/orderController');
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

// 관리자 권한 확인 미들웨어 (선택적)
const checkAdmin = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    
    if (user && user.user_type === 'admin') {
      req.isAdmin = true;
    } else {
      req.isAdmin = false;
    }
    
    next();
  } catch (error) {
    console.error('관리자 권한 확인 오류:', error);
    req.isAdmin = false;
    next();
  }
};

// 주문 생성 (인증 필요)
// POST /api/orders
// 헤더: Authorization: Bearer <token>
// Body: { items: [{ productId, quantity, options }] 또는 cartItemIds: [...], shipping: {...}, payment: {...}, amounts: {...} }
router.post('/', checkMongoConnection, verifyToken, checkAdmin, createOrder);

// 주문 목록 조회 (인증 필요)
// GET /api/orders?status=주문접수&page=1&limit=10
// 헤더: Authorization: Bearer <token>
router.get('/', checkMongoConnection, verifyToken, checkAdmin, getOrders);

// 주문 상세 조회 (인증 필요)
// GET /api/orders/:id
// 헤더: Authorization: Bearer <token>
router.get('/:id', checkMongoConnection, verifyToken, checkAdmin, getOrderById);

// 주문 수정 (인증 필요)
// PUT /api/orders/:id
// 헤더: Authorization: Bearer <token>
// Body: { status, payment: {...}, tracking: {...}, cancellation: {...} }
router.put('/:id', checkMongoConnection, verifyToken, checkAdmin, updateOrder);

// 주문 취소 (인증 필요)
// DELETE /api/orders/:id
// 헤더: Authorization: Bearer <token>
router.delete('/:id', checkMongoConnection, verifyToken, checkAdmin, cancelOrder);

module.exports = router;
