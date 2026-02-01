const Cart = require('../models/Cart');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// 현재 사용자의 장바구니 목록 조회
const getCartItems = async (req, res) => {
  try {
    const userId = req.userId; // verifyToken 미들웨어에서 설정됨

    // 현재 사용자의 장바구니 항목 조회 (상품 정보 포함)
    const cartItems = await Cart.find({ user: userId })
      .populate('product', 'name price images category sku status stock')
      .sort({ createdAt: -1 });

    // 총 금액 계산
    const totalAmount = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

    res.status(200).json({
      message: '장바구니 목록을 성공적으로 조회했습니다.',
      count: cartItems.length,
      totalAmount: totalAmount,
      items: cartItems
    });
  } catch (error) {
    console.error('장바구니 목록 조회 오류:', error);
    res.status(500).json({
      error: '장바구니 목록 조회 중 오류가 발생했습니다.',
      details: error.message
    });
  }
};

// 장바구니에 상품 추가
const addToCart = async (req, res) => {
  try {
    const userId = req.userId; // verifyToken 미들웨어에서 설정됨
    const { productId, quantity, options } = req.body;

    console.log('장바구니 추가 요청 받음:', { userId, productId, quantity, options });

    // 필수 필드 검증
    if (!productId) {
      console.log('상품 ID가 없습니다.');
      return res.status(400).json({
        error: '상품 ID는 필수입니다.'
      });
    }

    if (!quantity || quantity < 1) {
      console.log('수량이 유효하지 않습니다:', quantity);
      return res.status(400).json({
        error: '수량은 최소 1개 이상이어야 합니다.'
      });
    }

    // 상품 존재 여부 확인
    console.log('상품 조회 시도:', productId);
    console.log('상품 ID 타입:', typeof productId);
    
    // MongoDB ObjectId 형식 검증
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.log('유효하지 않은 상품 ID 형식:', productId);
      return res.status(400).json({
        error: '유효하지 않은 상품 ID 형식입니다.',
        details: `상품 ID: ${productId}`
      });
    }
    
    const product = await Product.findById(productId);
    if (!product) {
      console.log('상품을 찾을 수 없습니다:', productId);
      // 모든 상품 ID 확인 (디버깅용)
      const allProducts = await Product.find({}).select('_id name').limit(5);
      console.log('데이터베이스의 상품 샘플:', allProducts);
      return res.status(404).json({
        error: '상품을 찾을 수 없습니다.',
        details: `상품 ID: ${productId}`
      });
    }

    console.log('상품 조회 성공:', product.name);

    // 판매중인 상품인지 확인
    if (product.status !== '판매중') {
      return res.status(400).json({
        error: '현재 판매중인 상품이 아닙니다.'
      });
    }

    // 재고 확인
    if (product.stock !== undefined && product.stock < quantity) {
      return res.status(400).json({
        error: `재고가 부족합니다. (현재 재고: ${product.stock}개)`
      });
    }

    // 옵션 정보 정리
    const cartOptions = {
      color: options?.color || '',
      pleats: options?.pleats || '',
      width: options?.width || '',
      height: options?.height || '',
      additional: options?.additional || '',
      installation: options?.installation || '',
      rod: options?.rod || ''
    };

    // 같은 상품과 옵션으로 이미 장바구니에 있는지 확인
    const existingCartItem = await Cart.findOne({
      user: userId,
      product: productId,
      'options.color': cartOptions.color,
      'options.pleats': cartOptions.pleats,
      'options.width': cartOptions.width,
      'options.height': cartOptions.height,
      'options.additional': cartOptions.additional,
      'options.installation': cartOptions.installation,
      'options.rod': cartOptions.rod
    });

    if (existingCartItem) {
      // 이미 존재하는 경우 수량만 증가
      const newQuantity = existingCartItem.quantity + quantity;
      const newTotalPrice = product.price * newQuantity;

      existingCartItem.quantity = newQuantity;
      existingCartItem.totalPrice = newTotalPrice;
      await existingCartItem.save();

      // 상품 정보 포함하여 응답
      const populatedCartItem = await Cart.findById(existingCartItem._id)
        .populate('product', 'name price images category sku status stock');

      return res.status(200).json({
        message: '장바구니에 상품이 추가되었습니다.',
        cartItem: populatedCartItem
      });
    }

    // 총 가격 계산
    const totalPrice = product.price * quantity;

    // 새 장바구니 항목 생성
    const cartItem = new Cart({
      user: userId,
      product: productId,
      quantity: quantity,
      options: cartOptions,
      totalPrice: totalPrice
    });

    await cartItem.save();

    // 상품 정보 포함하여 응답
    const populatedCartItem = await Cart.findById(cartItem._id)
      .populate('product', 'name price images category sku status stock');

    res.status(201).json({
      message: '장바구니에 상품이 추가되었습니다.',
      cartItem: populatedCartItem
    });
  } catch (error) {
    console.error('장바구니 추가 오류:', error);
    console.error('에러 스택:', error.stack);

    if (error.name === 'CastError') {
      return res.status(400).json({
        error: '잘못된 상품 ID입니다.',
        details: error.message
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: '유효성 검증 실패',
        details: errors
      });
    }

    // MongoDB 연결 오류
    if (error.name === 'MongoServerError' || error.name === 'MongoError') {
      return res.status(503).json({
        error: '데이터베이스 연결 오류가 발생했습니다.',
        details: error.message
      });
    }

    res.status(500).json({
      error: '장바구니 추가 중 오류가 발생했습니다.',
      details: error.message
    });
  }
};

// 장바구니 항목 수정
const updateCartItem = async (req, res) => {
  try {
    const userId = req.userId; // verifyToken 미들웨어에서 설정됨
    const { id } = req.params;
    const { quantity, options } = req.body;

    // 장바구니 항목 조회
    const cartItem = await Cart.findById(id).populate('product');

    if (!cartItem) {
      return res.status(404).json({
        error: '장바구니 항목을 찾을 수 없습니다.'
      });
    }

    // 본인의 장바구니인지 확인
    if (cartItem.user.toString() !== userId) {
      return res.status(403).json({
        error: '권한이 없습니다.'
      });
    }

    // 수량 업데이트
    if (quantity !== undefined) {
      if (quantity < 1) {
        return res.status(400).json({
          error: '수량은 최소 1개 이상이어야 합니다.'
        });
      }

      // 재고 확인
      if (cartItem.product.stock !== undefined && cartItem.product.stock < quantity) {
        return res.status(400).json({
          error: `재고가 부족합니다. (현재 재고: ${cartItem.product.stock}개)`
        });
      }

      cartItem.quantity = quantity;
    }

    // 옵션 업데이트
    if (options) {
      if (options.color !== undefined) cartItem.options.color = options.color;
      if (options.pleats !== undefined) cartItem.options.pleats = options.pleats;
      if (options.width !== undefined) cartItem.options.width = options.width;
      if (options.height !== undefined) cartItem.options.height = options.height;
      if (options.additional !== undefined) cartItem.options.additional = options.additional;
      if (options.installation !== undefined) cartItem.options.installation = options.installation;
      if (options.rod !== undefined) cartItem.options.rod = options.rod;
    }

    // 총 가격 재계산
    cartItem.totalPrice = cartItem.product.price * cartItem.quantity;
    await cartItem.save();

    // 상품 정보 포함하여 응답
    const populatedCartItem = await Cart.findById(cartItem._id)
      .populate('product', 'name price images category sku status stock');

    res.status(200).json({
      message: '장바구니 항목이 수정되었습니다.',
      cartItem: populatedCartItem
    });
  } catch (error) {
    console.error('장바구니 수정 오류:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        error: '잘못된 장바구니 ID입니다.'
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
      error: '장바구니 수정 중 오류가 발생했습니다.',
      details: error.message
    });
  }
};

// 장바구니 항목 삭제
const deleteCartItem = async (req, res) => {
  try {
    const userId = req.userId; // verifyToken 미들웨어에서 설정됨
    const { id } = req.params;

    // 장바구니 항목 조회
    const cartItem = await Cart.findById(id);

    if (!cartItem) {
      return res.status(404).json({
        error: '장바구니 항목을 찾을 수 없습니다.'
      });
    }

    // 본인의 장바구니인지 확인
    if (cartItem.user.toString() !== userId) {
      return res.status(403).json({
        error: '권한이 없습니다.'
      });
    }

    await Cart.findByIdAndDelete(id);

    res.status(200).json({
      message: '장바구니 항목이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('장바구니 삭제 오류:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        error: '잘못된 장바구니 ID입니다.'
      });
    }

    res.status(500).json({
      error: '장바구니 삭제 중 오류가 발생했습니다.',
      details: error.message
    });
  }
};

// 현재 사용자의 장바구니 전체 삭제
const clearCart = async (req, res) => {
  try {
    const userId = req.userId; // verifyToken 미들웨어에서 설정됨

    const result = await Cart.deleteMany({ user: userId });

    res.status(200).json({
      message: '장바구니가 비워졌습니다.',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('장바구니 전체 삭제 오류:', error);
    res.status(500).json({
      error: '장바구니 전체 삭제 중 오류가 발생했습니다.',
      details: error.message
    });
  }
};

module.exports = {
  getCartItems,
  addToCart,
  updateCartItem,
  deleteCartItem,
  clearCart
};
