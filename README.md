# 막차야호~☆ (MakchaYaho)

내 주변 막차 정류장이랑 시간을 반짝반짝 알려주는 **갸루 감성 심야 막차 앱**♡
Next.js + 카카오맵 + Vercel 프록시.

## 컨셉
- 밤에 쓰는 앱이라 핑크·보라 네온 + 반짝이 별
- 갸루 말투 ("막차 놓치면 택시비 폭탄이야~ 🏃‍♀️💨")
- 칵테일 야호 시리즈 감성

## 왜 프록시 구조?
폰 앱에서 ODsay를 직접 부르면 referer/IP 문제로 인증 실패가 났음.
`pages/api/*` 프록시(=Vercel 서버)가 대신 호출 → 인증 문제 해결 + API 키 숨김.

```
📱 브라우저 ──> 🌐 /api/nearby (Vercel) ──> ODsay API
```

## 로컬 실행
```bash
npm install
cp .env.local.example .env.local   # 카카오 JS 키 넣기
npm run dev                         # http://localhost:3000
```

## 필요한 키
| 키 | 용도 | 상태 |
|---|---|---|
| `NEXT_PUBLIC_KAKAO_JS_KEY` | 지도 표시 | **발급 필요** |
| `ODSAY_API_KEY` | 주변 정류장 | 콘솔 접근 복구 필요 (지금은 데모 폴백) |
| `SEOUL_API_KEY` | 지하철 막차 | 나중에 (데모) |
| `GG_BUS_API_KEY` | 버스 막차 | 나중에 (데모) |

### 카카오 JS 키
1. developers.kakao.com → 내 애플리케이션 → JavaScript 키 복사
2. 플랫폼 → Web → 사이트 도메인에 `http://localhost:3000` + Vercel 도메인 추가

## Vercel 배포
1. GitHub에 푸시 (아래 순서)
2. vercel.com → Add New → Project → 이 repo import
3. Settings → Environment Variables에 위 키들 등록
4. Deploy

### GitHub 올리기 (폴더 중첩 주의!)
`package.json`이 바로 보이는 폴더 안에서:
```bash
git init
git add .
git commit -m "막차야호 초기 버전"
git branch -M main
git remote add origin https://github.com/본인아이디/makchayaho.git
git push -u origin main
```

## 데모 모드
API 키가 없거나 ODsay 인증이 실패하면 자동으로 데모 정류장(별빛역, 핑크 정류장 등)이
내 위치 주변에 떠서 UI가 전부 작동함. 진짜 API 연결되면 자동으로 실데이터로 바뀜.

## 다음 할 일
- [ ] 카카오 JS 키 넣고 지도 확인
- [ ] ODsay 콘솔 복구 (카카오/네이버 소셜 로그인 시도)
- [ ] 서울 지하철 막차 API 연결
- [ ] 경기 버스 막차 API 연결 (Expo에서 짠 로직 이식)
- [ ] 막차까지 남은 시간 카운트다운 ("앞으로 23분!⏰")
- [ ] 즐겨찾기 (자주 타는 정류장 별표)
