const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true,
    validate: {
      validator: function(v) {
        return v && v.trim().length > 0;
      },
      message: 'SKU는 필수이며 비어있을 수 없습니다.'
    }
  },
  name: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return v && v.trim().length > 0;
      },
      message: '상품 이름은 필수이며 비어있을 수 없습니다.'
    }
  },
  price: {
    type: Number,
    required: true,
    min: [0, '상품 가격은 0 이상이어야 합니다.'],
    validate: {
      validator: function(v) {
        return v !== null && v !== undefined && !isNaN(v);
      },
      message: '상품 가격은 유효한 숫자여야 합니다.'
    }
  },
  category: {
    type: String,
    required: true,
    enum: {
      values: ['커튼', '블라인드', '롤스크린', '부자재'],
      message: '카테고리는 커튼, 블라인드, 롤스크린, 부자재 중 하나여야 합니다.'
    }
  },
  images: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        // 이미지 배열의 각 요소가 문자열인지 확인
        return Array.isArray(v) && v.every(img => typeof img === 'string' && img.trim().length > 0);
      },
      message: '이미지는 유효한 URL 문자열 배열이어야 합니다.'
    }
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  // 상품 상태 (판매중, 품절, 판매중지 등)
  status: {
    type: String,
    enum: ['판매중', '품절', '판매중지'],
    default: '판매중'
  },
  // 재고 수량 (선택사항)
  stock: {
    type: Number,
    min: [0, '재고 수량은 0 이상이어야 합니다.'],
    default: 0
  }
}, {
  timestamps: true // createdAt과 updatedAt을 자동으로 관리
});

// SKU 인덱스 추가 (이미 unique: true로 인덱스가 생성되지만 명시적으로 추가)
productSchema.index({ sku: 1 });

// 카테고리별 검색을 위한 인덱스
productSchema.index({ category: 1 });

// 이름 검색을 위한 텍스트 인덱스
productSchema.index({ name: 'text', description: 'text' });

module.exports = productSchema;
