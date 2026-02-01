const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const mongoose = require('mongoose');
// axios는 포트원 API 호출 시 필요 (실제 운영 환경에서 사용)
// const axios = require('axios');

// 포트원(아임포트) 결제 검증 함수
const verifyPayment = async (impUid, merchantUid, expectedAmount) => {
  try {
    if (!impUid || impUid.trim() === '') {
      return { verified: false, error: '결제 정보(imp_uid)가 없습니다.' };
    }

    // 포트원 REST API를 통한 결제 검증
    // 실제 운영 환경에서는 포트원 REST API 키를 사용해야 합니다
    // 포트원 API 엔드포인트: https://api.iamport.kr/payments/{imp_uid}
    
    // 실제 운영 환경에서는 아래 코드를 사용하세요:
    // 1. 포트원 액세스 토큰 발급 (REST API 키 사용)
    // 2. 포트원 API 호출하여 결제 정보 조회
    // 3. 결제 상태, 금액, merchant_uid 검증
    
    // 예시 코드 (실제 사용 시 주석 해제):
    /*
    const axios = require('axios');
    
    // 포트원 액세스 토큰 발급
    const tokenResponse = await axios.post('https://api.iamport.kr/users/getToken', {
      imp_key: process.env.PORTONE_REST_API_KEY,
      imp_secret: process.env.PORTONE_REST_API_SECRET
    });
    
    const accessToken = tokenResponse.data.response.access_token;
    
    // 결제 정보 조회
    const paymentResponse = await axios.get(`https://api.iamport.kr/payments/${impUid}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const paymentData = paymentResponse.data.response;
    
    // 결제 검증
    if (paymentData.status === 'paid' && 
        paymentData.amount === expectedAmount &&
        paymentData.merchant_uid === merchantUid) {
      return { verified: true, paymentData: paymentData };
    } else {
      return { 
        verified: false, 
        error: `결제 검증 실패: 상태=${paymentData.status}, 금액=${paymentData.amount}, merchant_uid=${paymentData.merchant_uid}` 
      };
    }
    */
    
    // 테스트/개발 환경: impUid 형식 검증만 수행
    // imp_uid는 보통 "imp_"로 시작하는 문자열
    if (impUid.startsWith('imp_') || impUid.length > 10) {
      console.log('결제 검증 (테스트 모드):', { impUid, merchantUid, expectedAmount });
      return { 
        verified: true, 
        paymentData: { 
          imp_uid: impUid,
          merchant_uid: merchantUid,
          amount: expectedAmount,
          status: 'paid'
        } 
      };
    }
    
    return { verified: false, error: '유효하지 않은 결제 정보 형식입니다.' };
  } catch (error) {
    console.error('포트원 결제 검증 오류:', error);
    return { verified: false, error: error.message };
  }
};

// 주문 중복 체크 함수
const checkDuplicateOrder = async (userId, cartItemIds, timeWindowMinutes = 5) => {
  try {
    const timeWindow = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    
    // 최근 timeWindowMinutes 분 내에 동일한 사용자가 동일한 장바구니 항목으로 주문한 경우 체크
    const recentOrders = await Order.find({
      user: userId,
      createdAt: { $gte: timeWindow },
      status: { $in: ['주문접수', '결제완료', '결제대기'] }
    }).populate('items.product', '_id');
    
    if (recentOrders.length === 0) {
      return { isDuplicate: false };
    }
    
    // 장바구니 항목 ID로 상품 ID 추출
    const cartItems = await Cart.find({
      _id: { $in: cartItemIds },
      user: userId
    }).populate('product', '_id');
    
    const currentProductIds = cartItems.map(item => item.product._id.toString()).sort();
    
    // 최근 주문들의 상품 ID와 비교
    for (const order of recentOrders) {
      const orderProductIds = order.items
        .map(item => item.product._id.toString())
        .sort();
      
      // 상품 ID 배열이 동일하면 중복 주문으로 판단
      if (JSON.stringify(currentProductIds) === JSON.stringify(orderProductIds)) {
        return {
          isDuplicate: true,
          duplicateOrderId: order._id,
          duplicateOrderNumber: order.orderNumber,
          createdAt: order.createdAt
        };
      }
    }
    
    return { isDuplicate: false };
  } catch (error) {
    console.error('주문 중복 체크 오류:', error);
    // 오류 발생 시 중복이 아닌 것으로 간주 (안전한 쪽으로 처리)
    return { isDuplicate: false };
  }
};

// 주문 생성 (장바구니에서 주문 생성)
const createOrder = async (req, res) => {
  try {
    const userId = req.userId; // verifyToken 미들웨어에서 설정됨
    const { 
      items, // 직접 상품 정보를 전달하는 경우
      cartItemIds, // 장바구니 ID 배열로 주문하는 경우
      shipping, 
      payment, 
      amounts,
      merchantUid // 포트원 merchant_uid (결제 검증용)
    } = req.body;

    console.log('주문 생성 요청 받음:', { 
      userId, 
      items, 
      cartItemIds, 
      shipping: {
        recipientName: shipping?.recipientName,
        recipientPhone: shipping?.recipientPhone,
        address: shipping?.address,
        addressDetail: shipping?.addressDetail,
        postalCode: shipping?.postalCode,
        shippingFee: shipping?.shippingFee
      }, 
      payment: {
        method: payment?.method,
        status: payment?.status,
        amount: payment?.amount,
        transactionId: payment?.transactionId
      }, 
      amounts 
    });

    // 배송 정보 검증
    if (!shipping) {
      return res.status(400).json({
        error: '배송 정보는 필수입니다.',
        details: '배송 정보를 입력해주세요.'
      });
    }
    
    if (!shipping.recipientName || !shipping.recipientName.trim()) {
      return res.status(400).json({
        error: '배송 정보는 필수입니다.',
        details: '수령인 이름을 입력해주세요.'
      });
    }
    
    if (!shipping.recipientPhone || !shipping.recipientPhone.trim()) {
      return res.status(400).json({
        error: '배송 정보는 필수입니다.',
        details: '수령인 전화번호를 입력해주세요.'
      });
    }
    
    if (!shipping.address || !shipping.address.trim()) {
      return res.status(400).json({
        error: '배송 정보는 필수입니다.',
        details: '배송 주소를 입력해주세요.'
      });
    }

    // 결제 정보 검증
    if (!payment || !payment.method || !payment.amount) {
      return res.status(400).json({
        error: '결제 정보는 필수입니다.',
        details: '결제 방법과 결제 금액을 입력해주세요.'
      });
    }

    // 결제 금액 검증
    if (payment.amount <= 0) {
      return res.status(400).json({
        error: '결제 금액이 유효하지 않습니다.',
        details: '결제 금액은 0보다 커야 합니다.'
      });
    }

    // 주문 중복 체크 (장바구니에서 주문하는 경우만)
    if (cartItemIds && cartItemIds.length > 0) {
      const duplicateCheck = await checkDuplicateOrder(userId, cartItemIds);
      if (duplicateCheck.isDuplicate) {
        return res.status(409).json({
          error: '중복 주문이 감지되었습니다.',
          details: `최근 ${duplicateCheck.createdAt.toLocaleString('ko-KR')}에 동일한 주문이 있습니다.`,
          duplicateOrderId: duplicateCheck.duplicateOrderId,
          duplicateOrderNumber: duplicateCheck.duplicateOrderNumber
        });
      }
    }

    // 결제 검증 (포트원 결제인 경우)
    if (payment.transactionId && payment.transactionId.trim() !== '') {
      // 포트원 결제 검증
      const paymentVerification = await verifyPayment(
        payment.transactionId, // imp_uid
        merchantUid || `ORDER_${Date.now()}`, // merchant_uid
        payment.amount // 예상 결제 금액
      );

      if (!paymentVerification.verified) {
        return res.status(400).json({
          error: '결제 검증에 실패했습니다.',
          details: paymentVerification.error || '결제 정보를 확인할 수 없습니다.'
        });
      }

      // 결제 금액 일치 확인
      if (paymentVerification.paymentData && paymentVerification.paymentData.amount) {
        if (paymentVerification.paymentData.amount !== payment.amount) {
          return res.status(400).json({
            error: '결제 금액이 일치하지 않습니다.',
            details: `결제 금액: ${paymentVerification.paymentData.amount}, 주문 금액: ${payment.amount}`
          });
        }
      }

      // 결제 상태를 '결제완료'로 설정
      payment.status = '결제완료';
      console.log('결제 검증 성공:', paymentVerification.paymentData);
    } else if (payment.method !== '무통장입금') {
      // 무통장입금이 아닌데 transactionId가 없으면 경고
      console.warn('결제 수단이 무통장입금이 아닌데 transactionId가 없습니다.');
    }

    let orderItems = [];

    // 장바구니에서 주문하는 경우
    if (cartItemIds && cartItemIds.length > 0) {
      const cartItems = await Cart.find({
        _id: { $in: cartItemIds },
        user: userId
      }).populate('product', 'name price images category sku status stock');

      if (cartItems.length === 0) {
        return res.status(404).json({
          error: '장바구니 항목을 찾을 수 없습니다.'
        });
      }

      // 상품 재고 확인 및 주문 항목 구성
      for (const cartItem of cartItems) {
        const product = cartItem.product;
        
        // 판매중인 상품인지 확인
        if (product.status !== '판매중') {
          return res.status(400).json({
            error: `상품 "${product.name}"은(는) 현재 판매중이 아닙니다.`
          });
        }

        // 재고 확인
        if (product.stock !== undefined && product.stock < cartItem.quantity) {
          return res.status(400).json({
            error: `상품 "${product.name}"의 재고가 부족합니다. (현재 재고: ${product.stock}개)`
          });
        }

        orderItems.push({
          product: product._id,
          quantity: cartItem.quantity,
          options: cartItem.options
        });
      }
    } 
    // 직접 상품 정보를 전달하는 경우
    else if (items && items.length > 0) {
      for (const item of items) {
        if (!item.productId || !item.quantity) {
          return res.status(400).json({
            error: '상품 ID와 수량은 필수입니다.'
          });
        }

        // 상품 존재 여부 확인
        if (!mongoose.Types.ObjectId.isValid(item.productId)) {
          return res.status(400).json({
            error: '유효하지 않은 상품 ID 형식입니다.'
          });
        }

        const product = await Product.findById(item.productId);
        if (!product) {
          return res.status(404).json({
            error: `상품을 찾을 수 없습니다. (ID: ${item.productId})`
          });
        }

        // 판매중인 상품인지 확인
        if (product.status !== '판매중') {
          return res.status(400).json({
            error: `상품 "${product.name}"은(는) 현재 판매중이 아닙니다.`
          });
        }

        // 재고 확인
        if (product.stock !== undefined && product.stock < item.quantity) {
          return res.status(400).json({
            error: `상품 "${product.name}"의 재고가 부족합니다. (현재 재고: ${product.stock}개)`
          });
        }

        orderItems.push({
          product: product._id,
          quantity: item.quantity,
          options: item.options || {}
        });
      }
    } else {
      return res.status(400).json({
        error: '주문할 상품이 없습니다.',
        details: 'items 또는 cartItemIds를 제공해주세요.'
      });
    }

    // 주문 금액 정보 구성 (Number 타입으로 변환)
    const orderAmounts = {
      discountAmount: Number(amounts?.discountAmount) || 0,
      finalAmount: Number(payment.amount)
    };

    // 주문 생성 (데이터 타입 확인 및 변환)
    const orderData = {
      user: userId,
      items: orderItems,
      shipping: {
        recipientName: String(shipping.recipientName || '').trim(),
        recipientPhone: String(shipping.recipientPhone || '').trim(),
        address: String(shipping.address || '').trim(),
        addressDetail: String(shipping.addressDetail || '').trim(),
        postalCode: String(shipping.postalCode || '').trim(),
        deliveryRequest: String(shipping.deliveryRequest || '').trim(),
        shippingFee: Number(shipping.shippingFee) || 0
      },
      payment: {
        method: String(payment.method || ''),
        status: String(payment.status || '결제대기'),
        amount: Number(payment.amount) || 0,
        transactionId: String(payment.transactionId || '').trim()
      },
      amounts: orderAmounts,
      status: '주문접수'
    };

    console.log('주문 데이터 (스키마 저장 전):', JSON.stringify(orderData, null, 2));

    const order = new Order(orderData);

    await order.save();

    // 주문 생성 후 장바구니에서 해당 항목 삭제 (장바구니에서 주문한 경우)
    if (cartItemIds && cartItemIds.length > 0) {
      await Cart.deleteMany({
        _id: { $in: cartItemIds },
        user: userId
      });
    }

    // 주문 정보 조회 (상품 정보 포함)
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name price images category sku status stock');

    res.status(201).json({
      message: '주문이 생성되었습니다.',
      order: populatedOrder
    });
  } catch (error) {
    console.error('=== 주문 생성 오류 발생 ===');
    console.error('에러 타입:', error.name);
    console.error('에러 메시지:', error.message);
    console.error('에러 스택:', error.stack);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value,
        kind: err.kind
      }));
      console.error('유효성 검증 실패 상세:', JSON.stringify(errors, null, 2));
      console.error('전체 에러 객체:', JSON.stringify(error.errors, null, 2));
      return res.status(400).json({
        error: '유효성 검증 실패',
        details: errors.map(e => `${e.field}: ${e.message} (값: ${JSON.stringify(e.value)}, 타입: ${e.kind})`)
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        error: '잘못된 데이터 형식입니다.',
        details: error.message
      });
    }

    res.status(500).json({
      error: '주문 생성 중 오류가 발생했습니다.',
      details: error.message
    });
  }
};

// 주문 목록 조회
const getOrders = async (req, res) => {
  try {
    const userId = req.userId; // verifyToken 미들웨어에서 설정됨
    const { status, page = 1, limit = 10, dateFrom, dateTo, paymentMethod } = req.query;
    const isAdmin = req.isAdmin; // 관리자 여부 (필요시 미들웨어에서 설정)

    // 쿼리 구성
    const query = {};
    
    // 일반 사용자는 자신의 주문만 조회
    if (!isAdmin) {
      query.user = userId;
    }

    // 상태 필터
    if (status) {
      query.status = status;
    }

    // 결제 수단 필터
    if (paymentMethod) {
      query['payment.method'] = paymentMethod;
    }

    // 날짜 필터
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999); // 해당 날짜의 끝까지
        query.createdAt.$lte = endDate;
      }
    }

    // 페이지네이션
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // 주문 목록 조회
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('items.product', 'name price images category sku')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // 전체 개수
    const total = await Order.countDocuments(query);

    res.status(200).json({
      message: '주문 목록을 성공적으로 조회했습니다.',
      count: orders.length,
      total: total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      orders: orders
    });
  } catch (error) {
    console.error('주문 목록 조회 오류:', error);
    res.status(500).json({
      error: '주문 목록 조회 중 오류가 발생했습니다.',
      details: error.message
    });
  }
};

// 주문 상세 조회
const getOrderById = async (req, res) => {
  try {
    const userId = req.userId; // verifyToken 미들웨어에서 설정됨
    const { id } = req.params;
    const isAdmin = req.isAdmin; // 관리자 여부

    // 주문 조회
    const order = await Order.findById(id)
      .populate('user', 'name email phone address')
      .populate('items.product', 'name price images category sku status stock description');

    if (!order) {
      return res.status(404).json({
        error: '주문을 찾을 수 없습니다.'
      });
    }

    // 권한 확인 (일반 사용자는 자신의 주문만 조회 가능)
    if (!isAdmin && order.user._id.toString() !== userId) {
      return res.status(403).json({
        error: '권한이 없습니다.'
      });
    }

    res.status(200).json({
      message: '주문 정보를 성공적으로 조회했습니다.',
      order: order
    });
  } catch (error) {
    console.error('주문 상세 조회 오류:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        error: '잘못된 주문 ID입니다.'
      });
    }

    res.status(500).json({
      error: '주문 상세 조회 중 오류가 발생했습니다.',
      details: error.message
    });
  }
};

// 주문 수정 (상태 변경 등)
const updateOrder = async (req, res) => {
  try {
    const userId = req.userId; // verifyToken 미들웨어에서 설정됨
    const { id } = req.params;
    const { status, payment, tracking, cancellation } = req.body;
    const isAdmin = req.isAdmin; // 관리자 여부

    // 주문 조회
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        error: '주문을 찾을 수 없습니다.'
      });
    }

    // 권한 확인 (일반 사용자는 자신의 주문만 수정 가능, 취소만 가능)
    if (!isAdmin && order.user.toString() !== userId) {
      return res.status(403).json({
        error: '권한이 없습니다.'
      });
    }

    // 일반 사용자는 취소만 가능
    if (!isAdmin && status && status !== '주문취소') {
      return res.status(403).json({
        error: '주문 취소만 가능합니다.'
      });
    }

    // 주문 상태 업데이트
    if (status) {
      order.status = status;
    }

    // 결제 정보 업데이트
    if (payment) {
      if (payment.status) order.payment.status = payment.status;
      if (payment.transactionId) order.payment.transactionId = payment.transactionId;
      if (payment.status === '결제완료' && !order.payment.paidAt) {
        order.payment.paidAt = new Date();
      }
      if (payment.refund) {
        if (payment.refund.amount !== undefined) order.payment.refund.amount = payment.refund.amount;
        if (payment.refund.reason) order.payment.refund.reason = payment.refund.reason;
        if (payment.refund.refundedAt) order.payment.refund.refundedAt = payment.refund.refundedAt;
      }
    }

    // 배송 추적 정보 업데이트
    if (tracking) {
      if (tracking.trackingNumber) order.tracking.trackingNumber = tracking.trackingNumber;
      if (tracking.carrier) order.tracking.carrier = tracking.carrier;
      if (tracking.shippedAt) order.tracking.shippedAt = tracking.shippedAt;
      if (tracking.deliveredAt) order.tracking.deliveredAt = tracking.deliveredAt;
    }

    // 취소 정보 업데이트
    if (cancellation) {
      if (cancellation.cancelledAt) order.cancellation.cancelledAt = cancellation.cancelledAt;
      if (cancellation.cancelledBy) order.cancellation.cancelledBy = cancellation.cancelledBy;
    }

    // 취소 시 취소 일시 설정
    if (status === '주문취소' && !order.cancellation.cancelledAt) {
      order.cancellation.cancelledAt = new Date();
      if (!order.cancellation.cancelledBy) {
        order.cancellation.cancelledBy = isAdmin ? 'admin' : 'customer';
      }
    }

    await order.save();

    // 업데이트된 주문 정보 조회
    const updatedOrder = await Order.findById(order._id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name price images category sku');

    res.status(200).json({
      message: '주문이 수정되었습니다.',
      order: updatedOrder
    });
  } catch (error) {
    console.error('주문 수정 오류:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        error: '잘못된 주문 ID입니다.'
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: '유효성 검증 실패',
        details: errors
      });
    }

    res.status(500).json({
      error: '주문 수정 중 오류가 발생했습니다.',
      details: error.message
    });
  }
};

// 주문 취소
const cancelOrder = async (req, res) => {
  try {
    const userId = req.userId; // verifyToken 미들웨어에서 설정됨
    const { id } = req.params;
    const isAdmin = req.isAdmin; // 관리자 여부

    // 주문 조회
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        error: '주문을 찾을 수 없습니다.'
      });
    }

    // 권한 확인
    if (!isAdmin && order.user.toString() !== userId) {
      return res.status(403).json({
        error: '권한이 없습니다.'
      });
    }

    // 취소 가능한 상태인지 확인
    const cancellableStatuses = ['주문접수', '결제완료', '배송준비'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        error: '취소할 수 없는 주문 상태입니다.',
        details: `현재 상태: ${order.status}`
      });
    }

    // 주문 취소 처리
    order.status = '주문취소';
    order.cancellation.cancelledAt = new Date();
    order.cancellation.cancelledBy = isAdmin ? 'admin' : 'customer';

    await order.save();

    res.status(200).json({
      message: '주문이 취소되었습니다.',
      order: order
    });
  } catch (error) {
    console.error('주문 취소 오류:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        error: '잘못된 주문 ID입니다.'
      });
    }

    res.status(500).json({
      error: '주문 취소 중 오류가 발생했습니다.',
      details: error.message
    });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  cancelOrder
};
