# 장바구니 오류 디버깅 가이드

## 문제: "상품을 찾을 수 없습니다" 오류 (404)

### 1단계: 서버 실행 확인

**서버가 실행 중인지 확인하세요:**

1. 터미널에서 `server` 폴더로 이동:
   ```bash
   cd server
   ```

2. 서버 실행:
   ```bash
   npm run dev
   ```

3. 서버가 정상적으로 실행되면 다음과 같은 메시지가 표시됩니다:
   ```
   ✅ MongoDB 연결 성공
   🚀 Server is running on http://localhost:5000
   ```

### 2단계: 브라우저 콘솔 확인

1. 브라우저에서 F12를 눌러 개발자 도구 열기
2. **Console** 탭 확인:
   - "장바구니 추가 요청:" 로그에서 전송된 데이터 확인
   - "상품 정보 로드 성공:" 로그에서 상품 ID 확인
   - 에러 메시지 확인

3. **Network** 탭 확인:
   - `/api/cart` 요청 클릭
   - **Headers** 탭에서 요청 URL 확인
   - **Payload** 탭에서 전송된 데이터 확인
   - **Response** 탭에서 서버 응답 확인

### 3단계: 서버 콘솔 확인

서버 터미널에서 다음 로그를 확인하세요:

- "장바구니 추가 요청 받음:" - 요청이 서버에 도달했는지 확인
- "상품 조회 시도:" - 어떤 상품 ID로 조회하는지 확인
- "상품을 찾을 수 없습니다:" - 상품이 DB에 없는 경우
- "데이터베이스의 상품 샘플:" - DB에 있는 상품 ID 확인

### 4단계: 상품이 DB에 있는지 확인

**방법 1: 메인 페이지에서 확인**
- 메인 페이지에서 상품이 표시되는지 확인
- 상품이 표시되면 DB에 상품이 있는 것입니다

**방법 2: API 직접 호출**
브라우저 콘솔에서 다음 명령 실행:
```javascript
fetch('/api/products')
  .then(r => r.json())
  .then(data => console.log('상품 목록:', data))
```

### 5단계: 상품 ID 확인

상품 상세 페이지에서 브라우저 콘솔 열고:
```javascript
// 현재 페이지의 상품 ID 확인
console.log('현재 상품 ID:', window.location.pathname)
```

또는 React DevTools를 사용하여 `product` 상태 확인

### 6단계: 일반적인 해결 방법

1. **서버 재시작**
   ```bash
   # 서버 폴더에서
   # Ctrl + C로 중지 후
   npm run dev
   ```

2. **클라이언트 재시작**
   ```bash
   # client 폴더에서
   # Ctrl + C로 중지 후
   npm run dev
   ```

3. **브라우저 새로고침**
   - Ctrl + Shift + R (하드 리프레시)

4. **로그인 확인**
   - 로그인이 되어 있는지 확인
   - 토큰이 유효한지 확인

### 7단계: 여전히 문제가 있다면

다음 정보를 확인해주세요:

1. **서버 콘솔의 전체 에러 메시지**
2. **브라우저 콘솔의 에러 메시지**
3. **Network 탭의 `/api/cart` 요청 상세 정보**:
   - Request URL
   - Request Headers
   - Request Payload
   - Response Status
   - Response Body

4. **상품이 실제로 DB에 있는지**:
   - Admin 페이지에서 상품 목록 확인
   - 또는 MongoDB에서 직접 확인
