import { useState, useCallback, useRef, useEffect } from 'react'
import './ProductRegisterPage.css'
import { STORAGE_KEYS } from '../../utils/storage'

/**
 * Cloudinary 위젯 사용을 위한 환경변수 설정
 * 
 * 필요한 환경변수:
 * 1. VITE_CLOUDINARY_CLOUD_NAME - Cloudinary 계정의 Cloud Name
 *    - Cloudinary Dashboard > Settings에서 확인 가능
 *    - 예: "demo", "my-cloud-name"
 * 
 * 2. VITE_CLOUDINARY_UPLOAD_PRESET - Upload Preset 이름
 *    - Cloudinary Dashboard > Settings > Upload > Upload presets에서 생성
 *    - "Signing mode"를 "Unsigned"로 설정하면 프론트엔드에서 직접 업로드 가능
 *    - 예: "ml_default", "my-upload-preset"
 * 
 * 환경변수 설정 방법:
 * client 폴더에 .env 파일을 생성하고 다음 내용을 추가:
 * 
 * VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
 * VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
 * 
 * 환경변수 변경 후 개발 서버를 재시작해야 합니다.
 */
const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
}

// 환경변수 검증 함수
const validateCloudinaryConfig = () => {
  const missing = []
  if (!CLOUDINARY_CONFIG.cloudName) {
    missing.push('VITE_CLOUDINARY_CLOUD_NAME')
  }
  if (!CLOUDINARY_CONFIG.uploadPreset) {
    missing.push('VITE_CLOUDINARY_UPLOAD_PRESET')
  }
  return missing
}

export default function ProductRegisterPage({ onNavigateToAdmin, productId }) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    sku: '',
    summary: '',
    briefDescription: '',
    description: '',
    category: '커튼',
    status: '판매중',
    stock: 0,
    images: {
      detail: '',
      list: '',
      smallList: '',
      thumbnail: '',
      additional: []
    }
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [skuChecked, setSkuChecked] = useState(false)
  const [descriptionMode, setDescriptionMode] = useState('edibot') // 'edibot' or 'direct'
  const [imageMode, setImageMode] = useState('representative') // 'representative', 'individual', 'uploader'
  const [uploadingImage, setUploadingImage] = useState(null) // 현재 업로드 중인 이미지 타입
  const [isEditMode, setIsEditMode] = useState(false) // 수정 모드 여부
  const [loadingProduct, setLoadingProduct] = useState(false) // 상품 정보 로딩 중
  const fileInputRefs = useRef({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
    if (name === 'sku') {
      setSkuChecked(false)
    }
  }

  // Cloudinary 위젯 및 환경변수 확인
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.cloudinary) {
      console.warn('Cloudinary 위젯이 로드되지 않았습니다. index.html에 스크립트가 포함되어 있는지 확인하세요.')
    }
    
    // 환경변수 검증
    const missingEnvVars = validateCloudinaryConfig()
    if (missingEnvVars.length > 0) {
      console.error('Cloudinary 환경변수가 설정되지 않았습니다:', missingEnvVars.join(', '))
      console.error('client 폴더에 .env 파일을 생성하고 다음 환경변수를 설정하세요:')
      console.error('VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name')
      console.error('VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset')
    }
  }, [])

  // 상품 정보 가져오기 (수정 모드)
  useEffect(() => {
    if (productId) {
      setIsEditMode(true)
      setLoadingProduct(true)
      
      const fetchProduct = async () => {
        try {
          const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
          const response = await fetch(`/api/products/${productId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          if (response.ok) {
            const data = await response.json()
            const product = data.product
            
            // 이미지 분리 (첫 번째 이미지를 상세이미지로, 나머지는 추가이미지로)
            const images = product.images || []
            const detailImage = images[0] || ''
            const listImage = images[1] || ''
            const smallListImage = images[2] || ''
            const thumbnailImage = images[3] || ''
            const additionalImages = images.slice(4) || []

            setFormData({
              name: product.name || '',
              price: product.price || '',
              sku: product.sku || '',
              summary: '',
              briefDescription: product.description || '',
              description: product.description || '',
              category: product.category || '커튼',
              status: product.status || '판매중',
              stock: product.stock || 0,
              images: {
                detail: detailImage,
                list: listImage,
                smallList: smallListImage,
                thumbnail: thumbnailImage,
                additional: additionalImages
              }
            })
            setSkuChecked(true) // 수정 모드에서는 SKU 중복 확인 불필요
          } else {
            alert('상품 정보를 불러올 수 없습니다.')
            if (onNavigateToAdmin) onNavigateToAdmin()
          }
        } catch (error) {
          console.error('상품 정보 조회 오류:', error)
          alert('상품 정보를 불러오는 중 오류가 발생했습니다.')
          if (onNavigateToAdmin) onNavigateToAdmin()
        } finally {
          setLoadingProduct(false)
        }
      }

      fetchProduct()
    }
  }, [productId, onNavigateToAdmin])

  const handleImageChange = (type, value) => {
    setFormData((prev) => ({
      ...prev,
      images: {
        ...prev.images,
        [type]: value
      }
    }))
  }

  // Cloudinary 위젯을 사용한 이미지 업로드
  const openCloudinaryWidget = useCallback((imageType) => {
    // Cloudinary 위젯 스크립트 확인
    if (!window.cloudinary) {
      setErrorMessage('Cloudinary 위젯을 불러올 수 없습니다. 페이지를 새로고침해주세요.')
      return
    }

    // 환경변수 검증
    const missingEnvVars = validateCloudinaryConfig()
    if (missingEnvVars.length > 0) {
      setErrorMessage(
        `Cloudinary 환경변수가 설정되지 않았습니다: ${missingEnvVars.join(', ')}\n` +
        'client 폴더에 .env 파일을 생성하고 환경변수를 설정해주세요.'
      )
      return
    }

    setUploadingImage(imageType)
    setErrorMessage('')

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: CLOUDINARY_CONFIG.cloudName,
        uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
        sources: ['local', 'camera', 'url'],
        multiple: imageType === 'additional',
        maxFiles: imageType === 'additional' ? 20 : 1,
        clientAllowedFormats: ['png', 'jpg', 'jpeg', 'gif'],
        maxFileSize: 5000000, // 5MB
        showAdvancedOptions: false,
        cropping: false,
        resourceType: 'image',
        folder: 'products', // 업로드된 이미지를 products 폴더에 저장 (선택사항)
        tags: ['product', 'shopping-mall'] // 태그 추가 (선택사항)
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary 업로드 오류:', error)
          setErrorMessage(`이미지 업로드 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`)
          setUploadingImage(null)
          return
        }

        if (result && result.event === 'success') {
          // 업로드 성공 시 secure_url 사용 (HTTPS)
          const imageUrl = result.info.secure_url || result.info.url
          
          if (imageType === 'additional') {
            // 추가 이미지인 경우 배열에 추가
            setFormData((prev) => ({
              ...prev,
              images: {
                ...prev.images,
                additional: [...prev.images.additional, imageUrl]
              }
            }))
          } else {
            // 단일 이미지인 경우 해당 타입에 설정
            handleImageChange(imageType, imageUrl)
          }
          
          setUploadingImage(null)
        } else if (result && result.event === 'close') {
          // 위젯이 닫혔을 때
          setUploadingImage(null)
        } else if (result && result.event === 'abort') {
          // 업로드가 취소되었을 때
          setUploadingImage(null)
        }
      }
    )

    widget.open()
  }, [])

  const removeAdditionalImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: {
        ...prev.images,
        additional: prev.images.additional.filter((_, i) => i !== index)
      }
    }))
  }

  // SKU 중복 확인
  const checkSkuDuplicate = useCallback(async () => {
    if (!formData.sku || formData.sku.trim() === '') {
      setErrors((prev) => ({ ...prev, sku: 'SKU를 입력해주세요.' }))
      return
    }

    try {
      const response = await fetch(`/api/products/sku/${formData.sku.trim().toUpperCase()}`)
      
      if (response.status === 404) {
        // SKU가 없으면 사용 가능
        setSkuChecked(true)
        setErrors((prev) => ({ ...prev, sku: '' }))
      } else if (response.ok) {
        // SKU가 이미 존재함
        setSkuChecked(false)
        setErrors((prev) => ({ ...prev, sku: '이미 사용 중인 SKU입니다.' }))
      } else {
        setSkuChecked(false)
      }
    } catch (error) {
      console.error('SKU 중복 확인 오류:', error)
      setSkuChecked(false)
    }
  }, [formData.sku])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setErrors({})

    // 필수 필드 검증
    const newErrors = {}
    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = '상품명은 필수입니다.'
    } else if (formData.name.length > 250) {
      newErrors.name = '상품명은 250자 이하여야 합니다.'
    }

    if (!formData.price || formData.price === '') {
      newErrors.price = '판매가는 필수입니다.'
    } else if (isNaN(formData.price) || Number(formData.price) < 0) {
      newErrors.price = '판매가는 0 이상의 숫자여야 합니다.'
    }

    if (!formData.sku || formData.sku.trim() === '') {
      newErrors.sku = '자체 상품코드는 필수입니다.'
    } else if (formData.sku.length > 40) {
      newErrors.sku = '자체 상품코드는 40자 이하여야 합니다.'
    } else if (!skuChecked) {
      newErrors.sku = 'SKU 중복 확인을 해주세요.'
    }

    if (formData.summary && formData.summary.length > 255) {
      newErrors.summary = '상품 요약설명은 255자 이하여야 합니다.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)

    try {
      // 이미지 배열 구성 (모든 이미지를 하나의 배열로 합침)
      const allImages = []
      if (formData.images.detail) allImages.push(formData.images.detail)
      if (formData.images.list) allImages.push(formData.images.list)
      if (formData.images.smallList) allImages.push(formData.images.smallList)
      if (formData.images.thumbnail) allImages.push(formData.images.thumbnail)
      allImages.push(...formData.images.additional)

      const productData = {
        sku: formData.sku.trim().toUpperCase(),
        name: formData.name.trim(),
        price: Number(formData.price),
        category: formData.category,
        images: allImages,
        description: formData.description || formData.briefDescription || '',
        status: formData.status,
        stock: Number(formData.stock) || 0
      }

      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      
      // 토큰 확인
      if (!token) {
        setErrorMessage('로그인이 필요합니다. 다시 로그인해주세요.')
        setLoading(false)
        return
      }

      // 요청 데이터 로깅 (디버깅용)
      console.log('상품 등록 요청 데이터:', productData)
      console.log('요청 URL:', '/api/products')
      console.log('토큰 존재 여부:', !!token)

      const url = isEditMode ? `/api/products/${productId}` : '/api/products'
      const method = isEditMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData),
      })

      console.log('응답 상태:', response.status, response.statusText)

      let data = null
      try {
        const text = await response.text()
        console.log('응답 본문 (raw):', text)
        if (text) {
          data = JSON.parse(text)
        }
      } catch (e) {
        console.error('응답 파싱 오류:', e)
        data = null
      }

      console.log('응답 데이터:', data)

      if (response.ok) {
        setSuccessMessage(isEditMode ? '상품이 성공적으로 수정되었습니다!' : '상품이 성공적으로 등록되었습니다!')
        // 폼 초기화
        setFormData({
          name: '',
          price: '',
          sku: '',
          summary: '',
          briefDescription: '',
          description: '',
          category: '커튼',
          status: '판매중',
          stock: 0,
          images: {
            detail: '',
            list: '',
            smallList: '',
            thumbnail: '',
            additional: []
          }
        })
        setSkuChecked(false)
        
        setTimeout(() => {
          if (onNavigateToAdmin) onNavigateToAdmin()
        }, 1500)
      } else {
        // 에러 처리
        let errorMsg = '상품 등록에 실패했습니다.'
        
        if (response.status === 401) {
          errorMsg = '인증이 만료되었습니다. 다시 로그인해주세요.'
        } else if (response.status === 403) {
          errorMsg = '관리자 권한이 필요합니다.'
        } else if (response.status === 400) {
          errorMsg = data?.error || '입력한 정보를 확인해주세요.'
          if (data?.details) {
            if (Array.isArray(data.details)) {
              errorMsg = `${data.error || '유효성 검증 실패'}: ${data.details.join(', ')}`
            } else {
              errorMsg = `${data.error || '유효성 검증 실패'}: ${data.details}`
            }
          }
        } else if (response.status === 409) {
          errorMsg = data?.error || '이미 존재하는 SKU입니다.'
        } else if (response.status === 500) {
          errorMsg = data?.error || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        } else if (response.status === 503) {
          errorMsg = '데이터베이스에 연결할 수 없습니다.'
        } else if (data?.error) {
          errorMsg = data.error
        }
        
        setErrorMessage(errorMsg)
        
        // 상세 에러 로깅
        if (data?.details) {
          console.error('상품 등록 실패 상세:', data.details)
        }
        console.error('상품 등록 실패 - 상태 코드:', response.status)
        console.error('상품 등록 실패 - 응답:', data)
      }
    } catch (error) {
      console.error('상품 등록 네트워크 오류:', error)
      setErrorMessage(`서버에 연결할 수 없습니다: ${error.message}. 백엔드 서버가 실행 중인지 확인해주세요.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="product-register-page">
      <div className="product-register-container">
        <div className="register-header">
          <h1>{isEditMode ? '상품 수정' : '기본 정보'}</h1>
          <button className="btn-back" onClick={onNavigateToAdmin} type="button">
            ← 돌아가기
          </button>
        </div>

        {loadingProduct ? (
          <div className="loading-state">상품 정보를 불러오는 중...</div>
        ) : (
          <form onSubmit={handleSubmit} className="register-form">
          {errorMessage && (
            <div className="message message-error">
              {errorMessage}
              <button className="close-btn" onClick={() => setErrorMessage('')} type="button">
                ×
              </button>
            </div>
          )}
          {successMessage && (
            <div className="message message-success">{successMessage}</div>
          )}

          {/* 기본 정보 섹션 */}
          <section className="form-section">
            <h2 className="section-title">기본 정보</h2>

            {/* 상품명 */}
            <div className="form-row">
              <label className="form-label required">
                상품명
              </label>
              <div className="form-input-group">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder="예시) 플라워 미니 원피스"
                  maxLength={250}
                  disabled={loading}
                />
                <span className="char-count">[{formData.name.length}/250]</span>
              </div>
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            {/* 판매가 */}
            <div className="form-row">
              <label className="form-label required">
                판매가
              </label>
              <div className="form-input-group">
                <span className="input-prefix">원</span>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className={`form-input ${errors.price ? 'error' : ''}`}
                  placeholder="0"
                  min="0"
                  disabled={loading}
                />
                <div className="price-info">
                  <span>상품가: {formData.price ? Number(formData.price).toLocaleString() : 0}원</span>
                  <span>과세금액: {formData.price ? Math.floor(Number(formData.price) / 1.1).toLocaleString() : 0}원</span>
                  <span>과세상품: 10%</span>
                  <button type="button" className="btn-tax-setting">과세율 설정</button>
                </div>
              </div>
              {errors.price && <span className="error-text">{errors.price}</span>}
            </div>

            {/* 자체 상품코드 (SKU) */}
            <div className="form-row">
              <label className="form-label">
                자체 상품코드
              </label>
              <div className="form-input-group">
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className={`form-input ${errors.sku ? 'error' : ''} ${skuChecked ? 'success' : ''}`}
                  placeholder="상품 코드를 입력하세요"
                  maxLength={40}
                  disabled={loading}
                />
                <span className="char-count">[{formData.sku.length}/40]</span>
                <button
                  type="button"
                  className="btn-check-duplicate"
                  onClick={checkSkuDuplicate}
                  disabled={loading || !formData.sku || formData.sku.trim() === ''}
                >
                  중복확인
                </button>
                {skuChecked && <span className="success-text">✓ 사용 가능한 SKU입니다.</span>}
              </div>
              {errors.sku && <span className="error-text">{errors.sku}</span>}
            </div>

            {/* 상품 요약설명 */}
            <div className="form-row">
              <label className="form-label">
                상품 요약설명
              </label>
              <div className="form-input-group">
                <textarea
                  name="summary"
                  value={formData.summary}
                  onChange={handleChange}
                  className="form-textarea"
                  rows="3"
                  maxLength={255}
                  disabled={loading}
                />
                <span className="char-count">[{formData.summary.length}/255]</span>
              </div>
            </div>

            {/* 상품 간략설명 */}
            <div className="form-row">
              <label className="form-label">
                상품 간략설명
              </label>
              <div className="form-input-group">
                <textarea
                  name="briefDescription"
                  value={formData.briefDescription}
                  onChange={handleChange}
                  className="form-textarea"
                  rows="3"
                  placeholder="상품의 간단한 추가 정보를 입력할 수 있습니다."
                  disabled={loading}
                />
              </div>
            </div>

            {/* 카테고리 */}
            <div className="form-row">
              <label className="form-label required">
                카테고리
              </label>
              <div className="form-input-group">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="form-select"
                  disabled={loading}
                >
                  <option value="커튼">커튼</option>
                  <option value="블라인드">블라인드</option>
                  <option value="롤스크린">롤스크린</option>
                  <option value="부자재">부자재</option>
                </select>
              </div>
            </div>

            {/* 상태 */}
            <div className="form-row">
              <label className="form-label">
                상품 상태
              </label>
              <div className="form-input-group">
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-select"
                  disabled={loading}
                >
                  <option value="판매중">판매중</option>
                  <option value="품절">품절</option>
                  <option value="판매중지">판매중지</option>
                </select>
              </div>
            </div>

            {/* 재고 */}
            <div className="form-row">
              <label className="form-label">
                재고 수량
              </label>
              <div className="form-input-group">
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="0"
                  min="0"
                  disabled={loading}
                />
              </div>
            </div>
          </section>

          {/* 상품 상세설명 섹션 */}
          <section className="form-section">
            <h2 className="section-title">상품 상세설명</h2>
            <div className="description-mode-selector">
              <button
                type="button"
                className={`mode-btn ${descriptionMode === 'edibot' ? 'active' : ''}`}
                onClick={() => setDescriptionMode('edibot')}
              >
                에디봇 작성
              </button>
              <button
                type="button"
                className={`mode-btn ${descriptionMode === 'direct' ? 'active' : ''}`}
                onClick={() => setDescriptionMode('direct')}
              >
                직접 작성
              </button>
            </div>

            {descriptionMode === 'edibot' ? (
              <div className="edibot-info">
                <p>템플릿 선택하고 이미지만 넣으면 3분 만에 제작 완료! 블로그처럼 쉽고 빠르게 콘텐츠를 제작해보세요.</p>
                <button type="button" className="btn-edibot">
                  에디봇으로 작성 &gt;
                </button>
                <p className="browser-note">
                  - Google Chrome에 최적화된 서비스로 타 브라우저에서는 일부 기능이 제한될 수 있습니다.
                </p>
              </div>
            ) : (
              <div className="form-row">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="form-textarea description-textarea"
                  rows="10"
                  placeholder="상품 상세 설명을 입력하세요."
                  disabled={loading}
                />
              </div>
            )}
          </section>

          {/* 이미지 섹션 */}
          <section className="form-section">
            <h2 className="section-title">이미지</h2>
            
            <div className="image-mode-selector">
              <label className="radio-option">
                <input
                  type="radio"
                  name="imageMode"
                  value="representative"
                  checked={imageMode === 'representative'}
                  onChange={(e) => setImageMode(e.target.value)}
                />
                <span>대표이미지등록</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="imageMode"
                  value="individual"
                  checked={imageMode === 'individual'}
                  onChange={(e) => setImageMode(e.target.value)}
                />
                <span>개별이미지등록</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="imageMode"
                  value="uploader"
                  checked={imageMode === 'uploader'}
                  onChange={(e) => setImageMode(e.target.value)}
                />
                <span>파일업로더 등록</span>
              </label>
            </div>

            <div className="image-upload-grid">
              {/* 상세이미지 */}
              <div className="image-upload-item">
                <label className="image-label">상세이미지</label>
                <div 
                  className="image-upload-box"
                  onClick={() => !formData.images.detail && !uploadingImage && openCloudinaryWidget('detail')}
                  style={{ cursor: formData.images.detail || uploadingImage ? 'default' : 'pointer' }}
                >
                  {formData.images.detail ? (
                    <div className="image-preview">
                      <img src={formData.images.detail} alt="상세이미지" />
                      <button
                        type="button"
                        className="remove-image"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleImageChange('detail', '')
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : uploadingImage === 'detail' ? (
                    <div className="upload-placeholder">
                      <span className="upload-icon">⏳</span>
                      <span className="upload-size">업로드 중...</span>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <span className="upload-icon">+</span>
                      <span className="upload-size">권장 500px * 500px</span>
                      <span className="upload-hint">클릭하여 이미지 업로드</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 목록이미지 */}
              <div className="image-upload-item">
                <label className="image-label">목록이미지</label>
                <div 
                  className="image-upload-box"
                  onClick={() => !formData.images.list && !uploadingImage && openCloudinaryWidget('list')}
                  style={{ cursor: formData.images.list || uploadingImage ? 'default' : 'pointer' }}
                >
                  {formData.images.list ? (
                    <div className="image-preview">
                      <img src={formData.images.list} alt="목록이미지" />
                      <button
                        type="button"
                        className="remove-image"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleImageChange('list', '')
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : uploadingImage === 'list' ? (
                    <div className="upload-placeholder">
                      <span className="upload-icon">⏳</span>
                      <span className="upload-size">업로드 중...</span>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <span className="upload-icon">+</span>
                      <span className="upload-size">권장 300px * 300px</span>
                      <span className="upload-hint">클릭하여 이미지 업로드</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 작은목록이미지 */}
              <div className="image-upload-item">
                <label className="image-label">작은목록이미지</label>
                <div 
                  className="image-upload-box"
                  onClick={() => !formData.images.smallList && !uploadingImage && openCloudinaryWidget('smallList')}
                  style={{ cursor: formData.images.smallList || uploadingImage ? 'default' : 'pointer' }}
                >
                  {formData.images.smallList ? (
                    <div className="image-preview">
                      <img src={formData.images.smallList} alt="작은목록이미지" />
                      <button
                        type="button"
                        className="remove-image"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleImageChange('smallList', '')
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : uploadingImage === 'smallList' ? (
                    <div className="upload-placeholder">
                      <span className="upload-icon">⏳</span>
                      <span className="upload-size">업로드 중...</span>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <span className="upload-icon">+</span>
                      <span className="upload-size">권장 100px * 100px</span>
                      <span className="upload-hint">클릭하여 이미지 업로드</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 축소이미지 */}
              <div className="image-upload-item">
                <label className="image-label">축소이미지</label>
                <div 
                  className="image-upload-box"
                  onClick={() => !formData.images.thumbnail && !uploadingImage && openCloudinaryWidget('thumbnail')}
                  style={{ cursor: formData.images.thumbnail || uploadingImage ? 'default' : 'pointer' }}
                >
                  {formData.images.thumbnail ? (
                    <div className="image-preview">
                      <img src={formData.images.thumbnail} alt="축소이미지" />
                      <button
                        type="button"
                        className="remove-image"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleImageChange('thumbnail', '')
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : uploadingImage === 'thumbnail' ? (
                    <div className="upload-placeholder">
                      <span className="upload-icon">⏳</span>
                      <span className="upload-size">업로드 중...</span>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <span className="upload-icon">+</span>
                      <span className="upload-size">권장 220px * 220px</span>
                      <span className="upload-hint">클릭하여 이미지 업로드</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className="image-note">
              등록이미지 : 5M 이하 / gif, png, jpg(jpeg)
            </p>

            {/* 추가이미지 */}
            <div className="additional-images-section">
              <label className="image-label">
                추가이미지 [{formData.images.additional.length}/20]
              </label>
              <div className="additional-images-grid">
                {formData.images.additional.map((img, index) => (
                  <div key={index} className="image-upload-box small">
                    <div className="image-preview">
                      <img src={img} alt={`추가이미지 ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-image"
                        onClick={() => removeAdditionalImage(index)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
                {formData.images.additional.length < 20 && (
                  <div 
                    className="image-upload-box small"
                    onClick={() => !uploadingImage && openCloudinaryWidget('additional')}
                    style={{ cursor: uploadingImage ? 'default' : 'pointer' }}
                  >
                    {uploadingImage === 'additional' ? (
                      <div className="upload-placeholder">
                        <span className="upload-icon">⏳</span>
                        <span className="upload-size">업로드 중...</span>
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <span className="upload-icon">+</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="image-note">
                권장이미지 : 500px * 500px / 5M 이하 / gif, png, jpg(jpeg) / 20개까지 추가 가능
              </p>
            </div>
          </section>

          {/* 제출 버튼 */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onNavigateToAdmin}
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? (isEditMode ? '수정 중...' : '등록 중...') : (isEditMode ? '상품 수정' : '상품 등록')}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  )
}
