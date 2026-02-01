const User = require('../models/User');
const jwt = require('jsonwebtoken');

// 비밀번호를 제외한 유저 데이터 반환 헬퍼 함수
const sanitizeUser = (user) => {
  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};

// JWT 토큰 생성 함수
const generateToken = (userId) => {
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
  
  const token = jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  
  // 토큰 디코딩하여 만료 시간 추출
  const decoded = jwt.decode(token);
  const expiresAt = decoded ? new Date(decoded.exp * 1000).toISOString() : null;
  
  return {
    token,
    expiresIn: JWT_EXPIRES_IN,
    expiresAt
  };
};

// 로그인
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 필수 필드 검증
    if (!email || email.trim() === '') {
      return res.status(400).json({
        error: '이메일(email)은 필수입니다.'
      });
    }

    if (!password || password.trim() === '') {
      return res.status(400).json({
        error: '비밀번호(password)는 필수입니다.'
      });
    }

    // 이메일로 유저 찾기
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    
    if (!user) {
      return res.status(401).json({
        error: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // 비밀번호 확인
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // JWT 토큰 생성
    const tokenData = generateToken(user._id);

    // 비밀번호 제외하고 응답
    const userResponse = sanitizeUser(user);

    // 로그인 성공 응답
    res.status(200).json({
      message: '로그인에 성공했습니다.',
      token: tokenData.token,
      tokenExpiresIn: tokenData.expiresIn,
      tokenExpiresAt: tokenData.expiresAt,
      user: userResponse
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({
      error: '로그인 중 오류가 발생했습니다.',
      details: error.message
    });
  }
};

// verifyToken 미들웨어는 server/middleware/authMiddleware.js로 분리됨

// 토큰으로 현재 로그인한 사용자 정보 조회
const getUserByToken = async (req, res) => {
  try {
    // verifyToken 미들웨어를 통해 req.userId가 설정됨
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        error: '사용자를 찾을 수 없습니다.',
        details: '토큰에 해당하는 사용자가 존재하지 않습니다.'
      });
    }

    // 비밀번호 제외하고 응답
    const userResponse = sanitizeUser(user);

    res.status(200).json({
      message: '사용자 정보를 성공적으로 조회했습니다.',
      user: userResponse
    });
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    
    // 잘못된 ID 형식인 경우
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: '잘못된 사용자 ID입니다.',
        details: '토큰에 포함된 사용자 ID가 유효하지 않습니다.'
      });
    }

    res.status(500).json({
      error: '사용자 정보 조회 중 오류가 발생했습니다.',
      details: error.message
    });
  }
};

module.exports = {
  loginUser,
  getUserByToken
};
