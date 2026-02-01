const Product = require('../models/Product');

// 모든 상품 조회
const getAllProducts = async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 2 } = req.query;
    
    // 쿼리 조건 설정
    const query = {};
    
    if (category) {
      if (['커튼', '블라인드', '롤스크린', '부자재'].includes(category)) {
        query.category = category;
      } else {
        return res.status(400).json({
          error: '잘못된 카테고리입니다. 커튼, 블라인드, 롤스크린, 부자재 중 하나를 선택해주세요.'
        });
      }
    }
    
    if (status) {
      if (['판매중', '품절', '판매중지'].includes(status)) {
        query.status = status;
      } else {
        return res.status(400).json({
          error: '잘못된 상태입니다. 판매중, 품절, 판매중지 중 하나를 선택해주세요.'
        });
      }
    }
    
    // 검색 기능 (이름 또는 설명에서 검색)
    if (search && search.trim() !== '') {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    // 페이지네이션
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // 상품 목록 조회 (최신순 정렬)
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // 전체 개수 조회
    const total = await Product.countDocuments(query);

    // 조회 성공 응답
    res.status(200).json({
      message: '상품 목록을 성공적으로 조회했습니다.',
      count: products.length,
      total: total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      products: products
    });
  } catch (error) {
    console.error('상품 목록 조회 오류:', error);
    res.status(500).json({ 
      error: '상품 목록 조회 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
};

// 특정 상품 조회 (ID로)
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // 상품 조회
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ 
        error: '상품을 찾을 수 없습니다.' 
      });
    }

    // 조회 성공 응답
    res.status(200).json({
      message: '상품을 성공적으로 조회했습니다.',
      product: product
    });
  } catch (error) {
    console.error('상품 조회 오류:', error);
    
    // 잘못된 ID 형식인 경우
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: '잘못된 상품 ID입니다.' 
      });
    }

    res.status(500).json({ 
      error: '상품 조회 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
};

// SKU로 상품 조회
const getProductBySku = async (req, res) => {
  try {
    const { sku } = req.params;

    if (!sku || sku.trim() === '') {
      return res.status(400).json({
        error: 'SKU는 필수입니다.'
      });
    }

    // 상품 조회 (SKU는 대문자로 변환)
    const product = await Product.findOne({ sku: sku.trim().toUpperCase() });
    
    if (!product) {
      return res.status(404).json({ 
        error: '상품을 찾을 수 없습니다.' 
      });
    }

    // 조회 성공 응답
    res.status(200).json({
      message: '상품을 성공적으로 조회했습니다.',
      product: product
    });
  } catch (error) {
    console.error('상품 조회 오류:', error);
    res.status(500).json({ 
      error: '상품 조회 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
};

// 상품 생성
const createProduct = async (req, res) => {
  try {
    const { sku, name, price, category, images, description, status, stock } = req.body;

    // 필수 필드 검증
    if (!sku || sku.trim() === '') {
      return res.status(400).json({ 
        error: 'SKU는 필수입니다.' 
      });
    }

    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        error: '상품 이름(name)은 필수입니다.' 
      });
    }

    if (price === undefined || price === null) {
      return res.status(400).json({ 
        error: '상품 가격(price)은 필수입니다.' 
      });
    }

    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ 
        error: '상품 가격은 0 이상의 숫자여야 합니다.' 
      });
    }

    if (!category || category.trim() === '') {
      return res.status(400).json({ 
        error: '카테고리(category)는 필수입니다.' 
      });
    }

    if (!['커튼', '블라인드', '롤스크린', '부자재'].includes(category)) {
      return res.status(400).json({ 
        error: '카테고리는 커튼, 블라인드, 롤스크린, 부자재 중 하나여야 합니다.' 
      });
    }

    // 이미지 배열 검증
    if (images !== undefined && !Array.isArray(images)) {
      return res.status(400).json({
        error: '이미지(images)는 배열 형식이어야 합니다.'
      });
    }

    // 상태 검증
    if (status && !['판매중', '품절', '판매중지'].includes(status)) {
      return res.status(400).json({
        error: '상태는 판매중, 품절, 판매중지 중 하나여야 합니다.'
      });
    }

    // 재고 검증
    if (stock !== undefined && (typeof stock !== 'number' || stock < 0)) {
      return res.status(400).json({
        error: '재고 수량은 0 이상의 숫자여야 합니다.'
      });
    }

    // 새 상품 생성
    const product = new Product({
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      price: price,
      category: category.trim(),
      images: images || [],
      description: description ? description.trim() : '',
      status: status || '판매중',
      stock: stock !== undefined ? stock : 0
    });

    // 데이터베이스에 저장
    const savedProduct = await product.save();

    // 생성 성공 응답
    res.status(201).json({
      message: '상품이 성공적으로 생성되었습니다.',
      product: savedProduct
    });
  } catch (error) {
    console.error('상품 생성 오류:', error);
    
    // 중복 SKU 오류
    if (error.code === 11000) {
      return res.status(409).json({ 
        error: '이미 존재하는 SKU입니다.' 
      });
    }

    // 유효성 검증 오류
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: '유효성 검증 실패',
        details: errors 
      });
    }

    res.status(500).json({ 
      error: '상품 생성 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
};

// 상품 수정
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { sku, name, price, category, images, description, status, stock } = req.body;

    // 상품 존재 확인
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ 
        error: '상품을 찾을 수 없습니다.' 
      });
    }

    // 업데이트할 데이터 구성
    const updateData = {};
    
    if (sku !== undefined) {
      if (sku.trim() === '') {
        return res.status(400).json({ 
          error: 'SKU는 비어있을 수 없습니다.' 
        });
      }
      updateData.sku = sku.trim().toUpperCase();
    }
    
    if (name !== undefined) {
      if (name.trim() === '') {
        return res.status(400).json({ 
          error: '상품 이름은 비어있을 수 없습니다.' 
        });
      }
      updateData.name = name.trim();
    }
    
    if (price !== undefined) {
      if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({ 
          error: '상품 가격은 0 이상의 숫자여야 합니다.' 
        });
      }
      updateData.price = price;
    }
    
    if (category !== undefined) {
      if (!['커튼', '블라인드', '롤스크린', '부자재'].includes(category)) {
        return res.status(400).json({ 
          error: '카테고리는 커튼, 블라인드, 롤스크린, 부자재 중 하나여야 합니다.' 
        });
      }
      updateData.category = category.trim();
    }
    
    if (images !== undefined) {
      if (!Array.isArray(images)) {
        return res.status(400).json({
          error: '이미지는 배열 형식이어야 합니다.'
        });
      }
      updateData.images = images;
    }
    
    if (description !== undefined) {
      updateData.description = description.trim();
    }
    
    if (status !== undefined) {
      if (!['판매중', '품절', '판매중지'].includes(status)) {
        return res.status(400).json({
          error: '상태는 판매중, 품절, 판매중지 중 하나여야 합니다.'
        });
      }
      updateData.status = status;
    }
    
    if (stock !== undefined) {
      if (typeof stock !== 'number' || stock < 0) {
        return res.status(400).json({
          error: '재고 수량은 0 이상의 숫자여야 합니다.'
        });
      }
      updateData.stock = stock;
    }

    // 상품 업데이트
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // 수정 성공 응답
    res.status(200).json({
      message: '상품이 성공적으로 수정되었습니다.',
      product: updatedProduct
    });
  } catch (error) {
    console.error('상품 수정 오류:', error);
    
    // 잘못된 ID 형식인 경우
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: '잘못된 상품 ID입니다.' 
      });
    }

    // 중복 SKU 오류
    if (error.code === 11000) {
      return res.status(409).json({ 
        error: '이미 존재하는 SKU입니다.' 
      });
    }

    // 유효성 검증 오류
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: '유효성 검증 실패',
        details: errors 
      });
    }

    res.status(500).json({ 
      error: '상품 수정 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
};

// 상품 삭제
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // 상품 존재 확인 및 삭제
    const product = await Product.findByIdAndDelete(id);
    
    if (!product) {
      return res.status(404).json({ 
        error: '상품을 찾을 수 없습니다.' 
      });
    }

    // 삭제 성공 응답
    res.status(200).json({
      message: '상품이 성공적으로 삭제되었습니다.',
      product: product
    });
  } catch (error) {
    console.error('상품 삭제 오류:', error);
    
    // 잘못된 ID 형식인 경우
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: '잘못된 상품 ID입니다.' 
      });
    }

    res.status(500).json({ 
      error: '상품 삭제 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductBySku,
  createProduct,
  updateProduct,
  deleteProduct
};
