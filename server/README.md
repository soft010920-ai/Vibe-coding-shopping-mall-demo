# Shopping Mall Server

Node.js, Express, MongoDB를 사용한 쇼핑몰 백엔드 서버입니다.

## 설치 방법

1. 의존성 설치:
```bash
npm install
```

2. 환경 변수 설정:
`.env.example` 파일을 참고하여 `.env` 파일을 생성하고 MongoDB 연결 정보를 입력하세요.

3. 서버 실행:
```bash
# 개발 모드 (nodemon 사용)
npm run dev

# 프로덕션 모드
npm start
```

## 환경 변수

- `PORT`: 서버 포트 (기본값: 5000)
- `MONGODB_URI`: MongoDB 연결 문자열

## API 엔드포인트

- `GET /`: 서버 상태 확인
- `GET /api/health`: 헬스 체크

## 기술 스택

- Node.js
- Express.js
- MongoDB (Mongoose)
- CORS
- dotenv
