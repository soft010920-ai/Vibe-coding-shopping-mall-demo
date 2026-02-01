const User = require('../models/User');
const bcrypt = require('bcryptjs');

// 비밀번호를 제외한 유저 데이터 반환 헬퍼 함수
const sanitizeUser = (user) => {
  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};

// 모든 유저 조회
const getAllUsers = async (req, res) => {
  try {
    const { user_type, email } = req.query;
    
    // 쿼리 조건 설정
    const query = {};
    if (user_type) {
      if (['customer', 'admin'].includes(user_type)) {
        query.user_type = user_type;
      } else {
        return res.status(400).json({
          error: '잘못된 user_type입니다. customer 또는 admin만 가능합니다.'
        });
      }
    }
    if (email) {
      query.email = email.toLowerCase().trim();
    }

    // 유저 목록 조회 (최신순 정렬)
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .select('-password'); // password 필드 제외

    // 조회 성공 응답
    res.status(200).json({
      message: '유저 목록을 성공적으로 조회했습니다.',
      count: users.length,
      users: users
    });
  } catch (error) {
    console.error('유저 목록 조회 오류:', error);
    res.status(500).json({ 
      error: '유저 목록 조회 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
};

// 특정 유저 조회
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // 유저 조회
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        error: '유저를 찾을 수 없습니다.' 
      });
    }

    // 조회 성공 응답
    res.status(200).json({
      message: '유저를 성공적으로 조회했습니다.',
      user: user
    });
  } catch (error) {
    console.error('유저 조회 오류:', error);
    
    // 잘못된 ID 형식인 경우
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: '잘못된 유저 ID입니다.' 
      });
    }

    res.status(500).json({ 
      error: '유저 조회 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
};

// 유저 생성
const createUser = async (req, res) => {
  try {
    const { email, name, password, user_type, address, phone } = req.body;

    // 필수 필드 검증
    if (!email || email.trim() === '') {
      return res.status(400).json({ 
        error: '이메일(email)은 필수입니다.' 
      });
    }

    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        error: '이름(name)은 필수입니다.' 
      });
    }

    if (!password || password.trim() === '') {
      return res.status(400).json({ 
        error: '비밀번호(password)는 필수입니다.' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: '비밀번호는 최소 6자 이상이어야 합니다.' 
      });
    }

    if (!phone || String(phone).trim() === '') {
      return res.status(400).json({
        error: '전화번호(phone)는 필수입니다.'
      });
    }

    // user_type 검증
    if (user_type && !['customer', 'admin'].includes(user_type)) {
      return res.status(400).json({ 
        error: 'user_type은 customer 또는 admin만 가능합니다.' 
      });
    }

    // 새 유저 생성
    const user = new User({
      email: email.trim().toLowerCase(),
      name: name.trim(),
      phone: String(phone).trim(),
      password: password,
      user_type: user_type || 'customer',
      address: address ? address.trim() : ''
    });

    // 데이터베이스에 저장
    const savedUser = await user.save();

    // 비밀번호 제외하고 응답
    const userResponse = sanitizeUser(savedUser);

    // 생성 성공 응답
    res.status(201).json({
      message: '유저가 성공적으로 생성되었습니다.',
      user: userResponse
    });
  } catch (error) {
    console.error('유저 생성 오류:', error);
    
    // 중복 이메일 오류
    if (error.code === 11000) {
      return res.status(409).json({ 
        error: '이미 존재하는 이메일입니다.' 
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
      error: '유저 생성 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
};

// 유저 수정
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, password, user_type, address, phone } = req.body;

    // 유저 존재 확인
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        error: '유저를 찾을 수 없습니다.' 
      });
    }

    // 업데이트할 데이터 구성
    const updateData = {};
    
    if (email !== undefined) {
      if (email.trim() === '') {
        return res.status(400).json({ 
          error: '이메일은 비어있을 수 없습니다.' 
        });
      }
      updateData.email = email.trim().toLowerCase();
    }
    
    if (name !== undefined) {
      if (name.trim() === '') {
        return res.status(400).json({ 
          error: '이름은 비어있을 수 없습니다.' 
        });
      }
      updateData.name = name.trim();
    }
    
    if (password !== undefined) {
      if (password.trim() === '') {
        return res.status(400).json({ 
          error: '비밀번호는 비어있을 수 없습니다.' 
        });
      }
      if (password.length < 6) {
        return res.status(400).json({ 
          error: '비밀번호는 최소 6자 이상이어야 합니다.' 
        });
      }
      // 비밀번호 암호화
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    if (phone !== undefined) {
      if (String(phone).trim() === '') {
        return res.status(400).json({
          error: '전화번호는 비어있을 수 없습니다.'
        });
      }
      updateData.phone = String(phone).trim();
    }
    
    if (user_type !== undefined) {
      if (!['customer', 'admin'].includes(user_type)) {
        return res.status(400).json({ 
          error: 'user_type은 customer 또는 admin만 가능합니다.' 
        });
      }
      updateData.user_type = user_type;
    }
    
    if (address !== undefined) {
      updateData.address = address.trim();
    }

    // 유저 업데이트
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // 비밀번호 제외하고 응답
    const userResponse = sanitizeUser(updatedUser);

    // 수정 성공 응답
    res.status(200).json({
      message: '유저가 성공적으로 수정되었습니다.',
      user: userResponse
    });
  } catch (error) {
    console.error('유저 수정 오류:', error);
    
    // 잘못된 ID 형식인 경우
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: '잘못된 유저 ID입니다.' 
      });
    }

    // 중복 이메일 오류
    if (error.code === 11000) {
      return res.status(409).json({ 
        error: '이미 존재하는 이메일입니다.' 
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
      error: '유저 수정 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
};

// 유저 삭제
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // 유저 존재 확인 및 삭제
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return res.status(404).json({ 
        error: '유저를 찾을 수 없습니다.' 
      });
    }

    // 비밀번호 제외하고 응답
    const userResponse = sanitizeUser(user);

    // 삭제 성공 응답
    res.status(200).json({
      message: '유저가 성공적으로 삭제되었습니다.',
      user: userResponse
    });
  } catch (error) {
    console.error('유저 삭제 오류:', error);
    
    // 잘못된 ID 형식인 경우
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: '잘못된 유저 ID입니다.' 
      });
    }

    res.status(500).json({ 
      error: '유저 삭제 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
