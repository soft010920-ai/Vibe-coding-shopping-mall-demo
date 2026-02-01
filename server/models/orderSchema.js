const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // 주문 번호 (고유한 주문 식별자)
  // pre('save') 훅에서 자동 생성되므로 required 제거
  orderNumber: {
    type: String,
    unique: true,
    index: true,
    trim: true,
    default: null // 기본값을 null로 설정하여 required 검증 우회
  },
  
  // 사용자 ID (User 모델 참조)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // 주문 상품 목록
  items: [{
    // 상품 ID (Product 모델 참조)
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
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
    }
  }],
  
  // 배송 정보
  shipping: {
    // 수령인 이름
    recipientName: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function(v) {
          return v && v.trim().length > 0;
        },
        message: '수령인 이름은 필수입니다.'
      }
    },
    // 수령인 전화번호
    recipientPhone: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function(v) {
          return v && v.trim().length > 0;
        },
        message: '수령인 전화번호는 필수입니다.'
      }
    },
    // 배송 주소
    address: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function(v) {
          return v && v.trim().length > 0;
        },
        message: '배송 주소는 필수입니다.'
      }
    },
    // 상세 주소
    addressDetail: {
      type: String,
      trim: true,
      default: ''
    },
    // 우편번호
    postalCode: {
      type: String,
      trim: true,
      default: ''
    },
    // 배송 요청사항
    deliveryRequest: {
      type: String,
      trim: true,
      default: ''
    },
    // 배송비
    shippingFee: {
      type: Number,
      required: true,
      min: [0, '배송비는 0 이상이어야 합니다.'],
      default: 0
    }
  },
  
  // 결제 정보
  payment: {
    // 결제 방법
    method: {
      type: String,
      required: true,
      enum: {
        values: ['카드결제', '계좌이체', '실시간 계좌이체', '무통장입금', '가상계좌', '휴대폰결제', '간편결제'],
        message: '유효한 결제 방법을 선택해주세요.'
      }
    },
    // 결제 상태
    status: {
      type: String,
      required: true,
      enum: {
        values: ['결제대기', '결제완료', '결제실패', '환불완료', '부분환불'],
        message: '유효한 결제 상태를 선택해주세요.'
      },
      default: '결제대기'
    },
    // 결제 금액
    amount: {
      type: Number,
      required: true,
      min: [0, '결제 금액은 0 이상이어야 합니다.']
    },
    // 결제 일시
    paidAt: {
      type: Date,
      default: null
    },
    // 결제 거래 ID (PG사에서 제공하는 거래 번호)
    transactionId: {
      type: String,
      trim: true,
      default: ''
    },
    // 환불 정보
    refund: {
      amount: {
        type: Number,
        default: 0,
        min: [0, '환불 금액은 0 이상이어야 합니다.']
      },
      reason: {
        type: String,
        trim: true,
        default: ''
      },
      refundedAt: {
        type: Date,
        default: null
      }
    }
  },
  
  // 주문 금액 정보
  amounts: {
    // 할인 금액
    discountAmount: {
      type: Number,
      required: true,
      min: [0, '할인 금액은 0 이상이어야 합니다.'],
      default: 0
    },
    // 최종 결제 금액
    finalAmount: {
      type: Number,
      required: true,
      min: [0, '최종 결제 금액은 0 이상이어야 합니다.']
    }
  },
  
  // 주문 상태
  status: {
    type: String,
    required: true,
    enum: {
      values: ['주문접수', '결제완료', '배송준비', '배송중', '배송완료', '주문취소', '환불처리중', '환불완료'],
      message: '유효한 주문 상태를 선택해주세요.'
    },
    default: '주문접수',
    index: true
  },
  
  // 주문 취소 정보
  cancellation: {
    cancelledAt: {
      type: Date,
      default: null
    },
    cancelledBy: {
      type: String,
      enum: ['customer', 'admin'],
      default: null
    }
  },
  
  // 배송 추적 정보
  tracking: {
    // 운송장 번호
    trackingNumber: {
      type: String,
      trim: true,
      default: ''
    },
    // 택배사
    carrier: {
      type: String,
      trim: true,
      default: ''
    },
    // 배송 시작 일시
    shippedAt: {
      type: Date,
      default: null
    },
    // 배송 완료 일시
    deliveredAt: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true, // createdAt과 updatedAt을 자동으로 관리
  validateBeforeSave: true // 검증 활성화 (pre('save') 훅이 먼저 실행됨)
});

// 주문 번호 생성 함수 (스키마 메서드)
orderSchema.statics.generateOrderNumber = function() {
  // 형식: ORD-YYYYMMDD-HHMMSS-XXXX (랜덤 4자리)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `ORD-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
};

// 주문 번호 자동 생성 (저장 전)
// validateBeforeSave를 false로 설정하여 검증 전에 실행되도록 함
orderSchema.pre('save', { document: true, query: false }, async function(next) {
  try {
    // orderNumber가 없거나 빈 문자열이면 자동 생성
    if (!this.orderNumber || (typeof this.orderNumber === 'string' && this.orderNumber.trim() === '')) {
      let orderNumber;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10; // 무한 루프 방지
      
      // 고유한 주문 번호 생성 (중복 체크)
      while (!isUnique && attempts < maxAttempts) {
        orderNumber = this.constructor.generateOrderNumber();
        const existingOrder = await this.constructor.findOne({ orderNumber });
        if (!existingOrder) {
          isUnique = true;
        }
        attempts++;
      }
      
      if (!isUnique) {
        return next(new Error('주문 번호 생성에 실패했습니다. 다시 시도해주세요.'));
      }
      
      this.orderNumber = orderNumber;
      console.log('주문 번호 자동 생성:', orderNumber);
    }
  } catch (error) {
    console.error('주문 번호 생성 오류:', error);
    return next(error);
  }
  
  // 최종 결제 금액 자동 계산 (할인 금액 변경 시)
  if (this.isModified('amounts.discountAmount')) {
    // payment.amount에서 discountAmount를 빼서 계산
    // 단, payment.amount가 설정되어 있는 경우에만
    if (this.payment && this.payment.amount) {
      this.amounts.finalAmount = this.payment.amount - this.amounts.discountAmount;
    }
  }
  
  next();
});

// 사용자별 주문 조회를 위한 인덱스
orderSchema.index({ user: 1, createdAt: -1 });

// 주문 상태별 조회를 위한 인덱스
orderSchema.index({ status: 1, createdAt: -1 });

// 주문 번호 조회를 위한 인덱스 (이미 unique: true로 인덱스가 생성되지만 명시적으로 추가)
orderSchema.index({ orderNumber: 1 });

module.exports = orderSchema;
