const jwt = require('jsonwebtoken');

/**
 * JWT 토큰 검증 미들웨어
 * 요청 헤더의 Authorization에서 토큰을 추출하고 검증합니다.
 * 검증 성공 시 req.userId에 사용자 ID를 설정합니다.
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express next 함수
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: '인증 토큰이 제공되지 않았습니다.',
        details: 'Authorization 헤더가 필요합니다.'
      });
    }

    // Bearer 토큰 형식 확인
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({
        error: '인증 토큰이 유효하지 않습니다.',
        details: '토큰 형식이 올바르지 않습니다.'
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    
    // 토큰 검증
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 요청 객체에 사용자 ID 추가
    req.userId = decoded.userId;
    
    next();
  } catch (error) {
    console.error('토큰 검증 오류:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: '인증 토큰이 유효하지 않습니다.',
        details: '토큰이 손상되었거나 변조되었습니다.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: '인증 토큰이 만료되었습니다.',
        details: '다시 로그인해주세요.'
      });
    }
    
    res.status(401).json({
      error: '토큰 검증 중 오류가 발생했습니다.',
      details: error.message
    });
  }
};

module.exports = {
  verifyToken
};
