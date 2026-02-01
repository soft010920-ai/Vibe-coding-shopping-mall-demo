# Cloudinary 설정 가이드

## 필요한 환경변수

Cloudinary 위젯을 사용하기 위해 다음 환경변수가 필요합니다:

### 1. `VITE_CLOUDINARY_CLOUD_NAME`
- **설명**: Cloudinary 계정의 Cloud Name
- **위치**: Cloudinary Dashboard > Settings에서 확인 가능
- **예시**: `demo`, `my-cloud-name`

### 2. `VITE_CLOUDINARY_UPLOAD_PRESET`
- **설명**: Upload Preset 이름
- **위치**: Cloudinary Dashboard > Settings > Upload > Upload presets
- **예시**: `ml_default`, `my-upload-preset`

## 설정 방법

### 1. Cloudinary 계정 생성 및 설정

1. [Cloudinary](https://cloudinary.com)에서 무료 계정 생성
2. Dashboard에 로그인
3. **Cloud Name 확인**:
   - Dashboard 상단에서 Cloud Name 확인
   - 예: `demo`, `my-cloud-name`

4. **Upload Preset 생성**:
   - Settings > Upload 메뉴로 이동
   - "Upload presets" 섹션에서 "Add upload preset" 클릭
   - Preset 이름 입력 (예: `product-images`)
   - **Signing mode**: "Unsigned" 선택 (프론트엔드에서 직접 업로드 가능)
   - "Save" 클릭

### 2. 환경변수 파일 생성

`client` 폴더에 `.env` 파일을 생성하고 다음 내용을 추가:

```env
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

**예시**:
```env
VITE_CLOUDINARY_CLOUD_NAME=demo
VITE_CLOUDINARY_UPLOAD_PRESET=ml_default
```

### 3. 개발 서버 재시작

환경변수를 변경한 후 개발 서버를 재시작해야 합니다:

```bash
# 개발 서버 중지 (Ctrl + C)
# 개발 서버 재시작
npm run dev
```

## 환경변수 확인

환경변수가 제대로 설정되었는지 확인하려면:

1. 브라우저 콘솔을 열어서 확인
2. 이미지 업로드 박스를 클릭했을 때 에러 메시지가 없는지 확인

## 문제 해결

### 환경변수가 인식되지 않는 경우

1. `.env` 파일이 `client` 폴더 루트에 있는지 확인
2. 환경변수 이름이 `VITE_`로 시작하는지 확인
3. 개발 서버를 재시작했는지 확인
4. `.env` 파일에 공백이나 따옴표가 없는지 확인

### Cloudinary 위젯이 열리지 않는 경우

1. `index.html`에 Cloudinary 스크립트가 포함되어 있는지 확인:
   ```html
   <script src="https://widget.cloudinary.com/v2.0/global/all.js" type="text/javascript"></script>
   ```
2. 브라우저 콘솔에서 에러 메시지 확인
3. 네트워크 탭에서 스크립트가 로드되었는지 확인

### 업로드가 실패하는 경우

1. Upload Preset의 "Signing mode"가 "Unsigned"로 설정되어 있는지 확인
2. Cloud Name이 올바른지 확인
3. Upload Preset 이름이 정확한지 확인 (대소문자 구분)

## 참고 자료

- [Cloudinary 공식 문서](https://cloudinary.com/documentation)
- [Upload Widget 문서](https://cloudinary.com/documentation/upload_widget)
- [Upload Presets 가이드](https://cloudinary.com/documentation/upload_presets)
