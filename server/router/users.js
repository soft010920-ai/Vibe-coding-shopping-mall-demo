const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/usersController');
const { verifyToken } = require('../middleware/authMiddleware');
const { getUserByToken } = require('../controllers/authController');

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

// 모든 유저 조회
router.get('/', checkMongoConnection, getAllUsers);

// 현재 로그인한 사용자 정보 조회 (토큰 필요)
// GET /api/users/me
// 헤더: Authorization: Bearer <token>
router.get('/me', checkMongoConnection, verifyToken, getUserByToken);

// 특정 유저 조회
router.get('/:id', checkMongoConnection, getUserById);

// 유저 생성
router.post('/', checkMongoConnection, createUser);

// 유저 수정
router.put('/:id', checkMongoConnection, updateUser);

// 유저 삭제
router.delete('/:id', checkMongoConnection, deleteUser);

module.exports = router;
