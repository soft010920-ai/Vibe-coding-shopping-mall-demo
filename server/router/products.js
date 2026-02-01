const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const {
  getAllProducts,
  getProductById,
  getProductBySku,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productsController');
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

// 모든 상품 조회
// GET /api/products?category=커튼&status=판매중&search=검색어&page=1&limit=10
router.get('/', checkMongoConnection, getAllProducts);

// SKU로 상품 조회 (ID 조회보다 먼저 정의해야 함)
// GET /api/products/sku/CURTAIN-001
router.get('/sku/:sku', checkMongoConnection, getProductBySku);

// 특정 상품 조회 (ID로)
// GET /api/products/:id
router.get('/:id', checkMongoConnection, getProductById);

// 상품 생성 (인증 필요)
// POST /api/products
router.post('/', checkMongoConnection, verifyToken, createProduct);

// 상품 수정 (인증 필요)
// PUT /api/products/:id
router.put('/:id', checkMongoConnection, verifyToken, updateProduct);

// 상품 삭제 (인증 필요)
// DELETE /api/products/:id
router.delete('/:id', checkMongoConnection, verifyToken, deleteProduct);

module.exports = router;
