# Shopping Mall Client

React + Vite로 구축된 쇼핑몰 프론트엔드 프로젝트입니다.

## 설치 방법

1. 의존성 설치:
```bash
npm install
```

2. 개발 서버 실행:
```bash
npm run dev
```

서버는 `http://localhost:3000`에서 실행됩니다.

## 사용 가능한 스크립트

- `npm run dev` - 개발 서버 시작 (포트: 3000)
- `npm run build` - 프로덕션 빌드
- `npm run preview` - 빌드된 앱 미리보기
- `npm run lint` - ESLint로 코드 검사

## 프로젝트 구조

```
client/
├── public/          # 정적 파일
├── src/
│   ├── App.jsx      # 메인 앱 컴포넌트
│   ├── App.css      # 앱 스타일
│   ├── main.jsx     # 진입점
│   └── index.css    # 전역 스타일
├── index.html       # HTML 템플릿
├── vite.config.js   # Vite 설정
└── package.json     # 프로젝트 설정
```

## 백엔드 연동

백엔드 서버는 `http://localhost:5000`에서 실행되어야 합니다.
Vite의 프록시 설정을 통해 `/api` 경로의 요청이 자동으로 백엔드로 전달됩니다.

## 기술 스택

- React 19
- Vite 7
- ESLint
