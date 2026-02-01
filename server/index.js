const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const router = require('./router');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB 연결
// MongoDB Atlas URL을 우선적으로 사용하고, 없으면 로컬 주소 사용
const MONGODB_URI = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/shoping-mall';

mongoose.connect(MONGODB_URI)
  .then(() => {
    const connectionType = process.env.MONGODB_ATLAS_URI ? 'MongoDB Atlas' : process.env.MONGODB_URI ? 'MongoDB (Custom URI)' : 'MongoDB Local';
    console.log(`✅ ${connectionType} 연결 성공`);
  })
  .catch((error) => {
    console.error('❌ MongoDB 연결 실패:', error);
  });

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ 
    message: 'Shopping Mall API Server',
    status: 'running',
    version: '1.0.0'
  });
});

// API 라우트
app.use('/api', router);

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
