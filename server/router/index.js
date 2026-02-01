const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const usersRouter = require('./users');
const authRouter = require('./auth');
const productsRouter = require('./products');
const cartRouter = require('./cart');
const ordersRouter = require('./orders');

// 루트 경로
router.get('/', (req, res) => {
  res.json({ 
    message: 'Shopping Mall API Server',
    status: 'running',
    version: '1.0.0'
  });
});

// 헬스 체크 (MongoDB 연결 상태 포함)
router.get('/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState;
  // 0 = disconnected
  // 1 = connected
  // 2 = connecting
  // 3 = disconnecting
  
  const statusMessages = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.json({ 
    status: 'ok',
    mongodb: {
      status: statusMessages[mongoStatus],
      readyState: mongoStatus
    },
    timestamp: new Date().toISOString() 
  });
});

// 유저 라우터
router.use('/users', usersRouter);

// 인증 라우터
router.use('/auth', authRouter);

// 상품 라우터
router.use('/products', productsRouter);

// 장바구니 라우터
router.use('/cart', cartRouter);

// 주문 라우터
router.use('/orders', ordersRouter);

module.exports = router;
