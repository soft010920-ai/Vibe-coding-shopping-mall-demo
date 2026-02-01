const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, '유효한 이메일 주소를 입력해주세요.']
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: [6, '비밀번호는 최소 6자 이상이어야 합니다.']
  },
  user_type: {
    type: String,
    required: true,
    enum: ['customer', 'admin'],
    default: 'customer'
  },
  address: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true // createdAt과 updatedAt을 자동으로 관리
});

// 비밀번호 암호화 (저장 전)
userSchema.pre('save', async function(next) {
  // password 필드가 변경되지 않았으면 다음으로 진행
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // 비밀번호를 해시화 (salt rounds: 10)
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 비밀번호 비교 메서드
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = userSchema;
