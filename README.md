# 식품 성분 돋보기 (Vercel 버전)

## 구조

```
브라우저 (index.html)  ──요청──▶  /api/food (Vercel 서버 함수)  ──키 붙여서 요청──▶  식품안전나라
                      ◀──결과──                                 ◀──결과──
```

- `index.html`: 화면. 인증키가 없어요.
- `api/food.js`: Vercel 서버에서 실행되는 함수. 환경변수 `FOODSAFETY_KEY`에서 키를 꺼내 식품안전나라에 대신 요청해요.
- 브라우저는 `/api/food`만 부르기 때문에 키를 볼 수 없어요.
- `vercel.json`: 서버 함수를 서울(icn1)에서 실행하도록 설정해요.

## 배포 순서

1. GitHub 저장소에 이 폴더의 파일을 올려요. (`index.html`, `api` 폴더, `vercel.json`, `package.json`, `README.md`)
2. [vercel.com](https://vercel.com)에 GitHub 계정으로 가입해요. 요금제는 **Hobby(무료)**.
3. **Add New… → Project** → GitHub 저장소 옆 **Import**.
4. Framework Preset은 **Other** 그대로 두고, **Environment Variables**를 펼쳐서
   - Key: `FOODSAFETY_KEY`
   - Value: 인증키
   를 넣고 **Add**를 눌러요.
5. **Deploy**를 누르면 1분 안에 주소가 생겨요.
6. 사이트의 **연결 확인** 탭에서 키가 작동하는지 확인해요.

## 키를 나중에 넣었거나 바꿨다면

Project → **Settings** → **Environment Variables**에서 수정한 뒤, **Deployments** 탭 → 최신 배포 옆 **⋯** → **Redeploy**를 눌러야 적용돼요.
