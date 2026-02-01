# 주문 스키마 디자인 문서

## 개요
쇼핑몰의 주문 정보를 저장하는 MongoDB 스키마입니다. 주문 생성부터 배송 완료까지의 전체 프로세스를 추적할 수 있도록 설계되었습니다.

## 주요 필드 설명

### 1. 주문 식별 정보
- **orderNumber** (String, Unique, Required)
  - 고유한 주문 번호
  - 형식: `ORD-YYYYMMDD-HHMMSS-XXXX` (예: `ORD-20240115-143022-1234`)
  - 자동 생성되며 중복 방지 로직 포함

### 2. 사용자 정보
- **user** (ObjectId, Ref: User, Required)
  - 주문한 사용자 ID
  - User 모델 참조

### 3. 주문 상품 목록 (items)
각 주문 상품은 다음 정보를 포함합니다:
- **product** (ObjectId, Ref: Product)
  - 상품 ID (현재 상품 정보 조회용)
- **productSnapshot** (Object)
  - 주문 시점의 상품 정보 스냅샷
  - 상품 정보가 변경되어도 주문 정보는 유지됨
  - 필드: name, sku, price, category, image
- **quantity** (Number, Required)
  - 주문 수량
- **options** (Object)
  - 상품 옵션 정보
  - 필드: color, pleats, width, height, additional, installation, rod
- **itemTotal** (Number, Required)
  - 해당 상품의 총 가격 (단가 × 수량)

### 4. 배송 정보 (shipping)
- **recipientName** (String, Required)
  - 수령인 이름
- **recipientPhone** (String, Required)
  - 수령인 전화번호
- **address** (String, Required)
  - 배송 주소
- **addressDetail** (String)
  - 상세 주소
- **postalCode** (String)
  - 우편번호
- **deliveryRequest** (String)
  - 배송 요청사항
- **shippingFee** (Number, Required)
  - 배송비

### 5. 결제 정보 (payment)
- **method** (String, Required, Enum)
  - 결제 방법: '카드결제', '계좌이체', '무통장입금', '휴대폰결제', '간편결제'
- **status** (String, Required, Enum)
  - 결제 상태: '결제대기', '결제완료', '결제실패', '환불완료', '부분환불'
- **amount** (Number, Required)
  - 결제 금액
- **paidAt** (Date)
  - 결제 일시
- **transactionId** (String)
  - PG사에서 제공하는 거래 번호
- **refund** (Object)
  - 환불 정보
  - 필드: amount, reason, refundedAt

### 6. 주문 금액 정보 (amounts)
- **itemsTotal** (Number, Required)
  - 상품 총액 (모든 상품의 itemTotal 합계)
- **shippingFee** (Number, Required)
  - 배송비
- **discountAmount** (Number, Required)
  - 할인 금액
- **finalAmount** (Number, Required)
  - 최종 결제 금액 (상품 총액 + 배송비 - 할인 금액)
  - 자동 계산됨

### 7. 주문 상태 (status)
- **status** (String, Required, Enum, Indexed)
  - 주문 상태: '주문접수', '결제완료', '배송준비', '배송중', '배송완료', '주문취소', '환불처리중', '환불완료'
  - 기본값: '주문접수'

### 8. 주문 취소 정보 (cancellation)
- **reason** (String)
  - 취소 사유
- **cancelledAt** (Date)
  - 취소 일시
- **cancelledBy** (String, Enum)
  - 취소한 사람: 'customer', 'admin'

### 9. 배송 추적 정보 (tracking)
- **trackingNumber** (String)
  - 운송장 번호
- **carrier** (String)
  - 택배사
- **shippedAt** (Date)
  - 배송 시작 일시
- **deliveredAt** (Date)
  - 배송 완료 일시

### 10. 관리자 메모 (adminMemo)
- **adminMemo** (String)
  - 관리자용 메모

### 11. 타임스탬프
- **createdAt** (Date, Auto)
  - 주문 생성 일시
- **updatedAt** (Date, Auto)
  - 주문 수정 일시

## 인덱스
1. **orderNumber**: 고유 인덱스 (주문 번호 조회)
2. **user + createdAt**: 복합 인덱스 (사용자별 주문 조회)
3. **status + createdAt**: 복합 인덱스 (상태별 주문 조회)

## 주요 기능

### 1. 주문 번호 자동 생성
- `generateOrderNumber()` 스태틱 메서드로 고유한 주문 번호 생성
- 저장 전 자동으로 생성되며 중복 체크 수행

### 2. 최종 결제 금액 자동 계산
- `itemsTotal`, `shippingFee`, `discountAmount` 변경 시 자동으로 `finalAmount` 계산

## 사용 예시

### 주문 생성
```javascript
const order = new Order({
  user: userId,
  items: [
    {
      product: productId,
      productSnapshot: {
        name: '우드 블라인드',
        sku: 'WB-001',
        price: 30000,
        category: '블라인드',
        image: 'https://...'
      },
      quantity: 2,
      options: {
        color: '아이보리',
        width: '160cm',
        height: '140cm'
      },
      itemTotal: 60000
    }
  ],
  shipping: {
    recipientName: '홍길동',
    recipientPhone: '010-1234-5678',
    address: '서울시 강남구 테헤란로 123',
    addressDetail: '456호',
    postalCode: '06234',
    deliveryRequest: '문 앞에 놔주세요',
    shippingFee: 3000
  },
  payment: {
    method: '카드결제',
    status: '결제대기',
    amount: 63000
  },
  amounts: {
    itemsTotal: 60000,
    shippingFee: 3000,
    discountAmount: 0,
    finalAmount: 63000
  },
  status: '주문접수'
});

await order.save();
```

### 주문 상태 업데이트
```javascript
order.status = '결제완료';
order.payment.status = '결제완료';
order.payment.paidAt = new Date();
order.payment.transactionId = 'TXN-123456789';
await order.save();
```

### 배송 정보 업데이트
```javascript
order.tracking.trackingNumber = '1234567890123';
order.tracking.carrier = 'CJ대한통운';
order.tracking.shippedAt = new Date();
order.status = '배송중';
await order.save();
```

## 주의사항
1. **productSnapshot**: 주문 시점의 상품 정보를 저장하므로, 상품 정보가 변경되어도 주문 정보는 유지됩니다.
2. **finalAmount**: 자동 계산되지만, 수동으로 설정할 수도 있습니다.
3. **orderNumber**: 고유성을 보장하기 위해 저장 전 중복 체크를 수행합니다.
