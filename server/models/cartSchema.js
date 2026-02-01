const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  // 사용자 ID (User 모델 참조)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // 상품 ID (Product 모델 참조)
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  // 수량
  quantity: {
    type: Number,
    required: true,
    min: [1, '수량은 최소 1개 이상이어야 합니다.'],
    validate: {
      validator: function(v) {
        return v !== null && v !== undefined && !isNaN(v) && Number.isInteger(v);
      },
      message: '수량은 유효한 정수여야 합니다.'
    }
  },
  // 상품 옵션 정보
  options: {
    color: {
      type: String,
      trim: true,
      default: ''
    },
    pleats: {
      type: String,
      trim: true,
      default: ''
    },
    width: {
      type: String,
      trim: true,
      default: ''
    },
    height: {
      type: String,
      trim: true,
      default: ''
    },
    additional: {
      type: String,
      trim: true,
      default: ''
    },
    installation: {
      type: String,
      trim: true,
      default: ''
    },
    rod: {
      type: String,
      trim: true,
      default: ''
    }
  },
  // 선택된 옵션의 총 가격 (옵션에 따라 가격이 변동될 수 있음)
  totalPrice: {
    type: Number,
    required: true,
    min: [0, '총 가격은 0 이상이어야 합니다.'],
    validate: {
      validator: function(v) {
        return v !== null && v !== undefined && !isNaN(v);
      },
      message: '총 가격은 유효한 숫자여야 합니다.'
    }
  }
}, {
  timestamps: true // createdAt과 updatedAt을 자동으로 관리
});

// 사용자와 상품의 복합 인덱스 (같은 사용자가 같은 상품을 중복 추가하는 것을 방지하기 위해)
cartSchema.index({ user: 1, product: 1 });

// 사용자별 장바구니 조회를 위한 인덱스
cartSchema.index({ user: 1, createdAt: -1 });

module.exports = cartSchema;
