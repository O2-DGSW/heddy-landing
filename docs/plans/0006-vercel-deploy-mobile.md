---
status: 진행
owner: 강민
created: 2026-10-11
---

# Vercel 배포 — heddy.site는 랜딩, /mobile은 heddy-app

## 왜

지금 `heddy.site`를 heddy-app(Vite SPA)이 차지하고 있어 랜딩이 안 보이고, QR이 가리키는 `heddy.site/download`도 동작하지 않는다. 루트는 랜딩이, `/mobile`은 heddy-app이 맡게 나눈다.

## 구조

```
heddy.site/            → heddy-landing (이 저장소, Next.js)
heddy.site/download    → heddy-landing (스토어 307, `docs/plans/0002`)
heddy.site/mobile/...  → heddy-landing rewrites → heddy-app 배포 주소/... (프록시, 주소창은 그대로)
```

- 랜딩 `next.config.ts`의 `rewrites()`가 `/mobile/:path*`를 `MOBILE_APP_ORIGIN/:path*`로 넘긴다(`/mobile`을 뗀다). 주소는 서버 환경변수에만 둔다.
- heddy-app은 웹 배포에서만 Vite `base`를 `/mobile/`로 빌드한다(`VITE_BASE_PATH`). 자산을 `/mobile/assets/...`로 요청하고, 라우터는 `basename="/mobile"`. 네이티브(Capacitor) 빌드는 그대로 `/` — O2-DGSW/heddy-app#183.
- `/mobile/ar-server/...`도 같은 경로로 heddy-app의 Vercel rewrites(AR 서버 프록시)까지 간다.

## 할 일

- [x] 랜딩 `next.config.ts` `/mobile` rewrites (`MOBILE_APP_ORIGIN`)
- [x] heddy-app base 경로 대응(PR, heddy-app#183)
- [x] 로컬 확인: heddy-app을 `/mobile/`로 빌드해 루트에서 서빙 + 랜딩 프로덕션 빌드로 프록시 → `/mobile`(→ `/mobile/welcome`), `/mobile/login` 직접 진입, 자산·폰트·이미지 200, 랜딩 `/`·`/download` 그대로
- [ ] Vercel(사용자): 아래 순서

## Vercel 설정 순서 (대시보드)

1. **heddy-landing 프로젝트 만들기**: Add New → Project → `O2-DGSW/heddy-landing` import(Framework: Next.js). Environment Variables(Production·Preview):
   - `APP_STORE_URL`, `ONE_STORE_URL` — 스토어 주소(`docs/plans/0002`)
   - `NEXT_PUBLIC_SPLINE_HERO_SCENE` — Spline 씬 URL(`.env.local`과 같은 값)
   - `MOBILE_APP_ORIGIN` — heddy-app의 Vercel 기본 주소(예: `https://heddy-app-xxx.vercel.app`, heddy-app 프로젝트 → Domains의 `*.vercel.app`)
   - Deploy 후 `*.vercel.app/` 랜딩이 뜨는지 확인
2. **heddy-app 프로젝트**: Settings → Environment Variables에 `VITE_BASE_PATH=/mobile/`(Production) 추가 → #183 머지된 브랜치로 Redeploy
3. **도메인 옮기기**(2 직후 바로): heddy-app 프로젝트 → Settings → Domains에서 `heddy.site`(와 `www.heddy.site`) 제거 → heddy-landing 프로젝트 → Domains에 추가. DNS는 같은 Vercel 계정이면 그대로 둔다.
4. 확인: `https://heddy.site/`(랜딩), `https://heddy.site/download`(스토어 307), `https://heddy.site/mobile`(앱), `https://heddy.site/mobile/login` 새로고침

2와 3 사이에는 heddy.site가 잠깐 깨진다(앱이 `/mobile/` 자산을 찾는데 아직 루트에 물려 있음). 둘을 붙여서 한다.

## 완료 기준

- [ ] 위 4의 주소가 모두 동작
- [ ] `pnpm verify` 통과

## 변경 기록

- 2026-10-11: 생성, 코드(랜딩 rewrites + heddy-app base) 작업과 로컬 확인 완료. Vercel 설정은 대기.
