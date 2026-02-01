// 서버 시작 로그
console.log('🚀 서버 시작 중...');
console.log('📍 현재 디렉토리:', process.cwd());
console.log('📦 Node 버전:', process.version);

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const router = require('./router');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

console.log('✅ Express 앱 생성 완료');

// CORS 설정
const corsOptions = {
  origin: function (origin, callback) {
    // 환경변수에서 허용할 origin 목록 가져오기
    const allowedOrigins = process.env.CLIENT_URL 
      ? process.env.CLIENT_URL.split(',').map(url => url.trim())
      : ['http://localhost:3000', 'http://localhost:5173'];
    
    // origin이 없거나 (같은 도메인), 허용 목록에 있으면 허용
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.some(url => origin.includes(url))) {
      callback(null, true);
    } else {
      console.log('⚠️ CORS 차단된 origin:', origin);
      console.log('✅ 허용된 origins:', allowedOrigins);
      callback(null, true); // 개발 중에는 모두 허용, 프로덕션에서는 false로 변경
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('✅ CORS 설정 완료');
console.log('📍 허용된 CLIENT_URL:', process.env.CLIENT_URL || '기본값 사용');

// MongoDB 연결
// MongoDB Atlas URL을 우선적으로 사용하고, 없으면 로컬 주소 사용
const MONGODB_URI = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/shoping-mall';

// MongoDB 연결 (비동기, 서버는 MongoDB 연결 실패해도 시작)
mongoose.connect(MONGODB_URI)
  .then(() => {
    const connectionType = process.env.MONGODB_ATLAS_URI ? 'MongoDB Atlas' : process.env.MONGODB_URI ? 'MongoDB (Custom URI)' : 'MongoDB Local';
    console.log(`✅ ${connectionType} 연결 성공`);
  })
  .catch((error) => {
    console.error('❌ MongoDB 연결 실패:', error);
    console.error('⚠️ 서버는 계속 실행되지만 데이터베이스 기능이 작동하지 않을 수 있습니다.');
  });

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ 
    message: 'Shopping Mall API Server',
    status: 'running',
    version: '1.0.0',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 헬스 체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API 라우트
app.use('/api', router);

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error('서버 오류:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: 'error'
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
}).on('error', (err) => {
  console.error('❌ 서버 시작 실패:', err);
  process.exit(1);
});

// 프로세스 에러 핸들링
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
