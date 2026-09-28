---
status: 완료
owner: 강민
created: 2026-09-27
---

# OS별 다운로드 QR — 아이폰은 App Store, 갤럭시는 원스토어

## 왜

QR 하나로 아이폰은 App Store, 갤럭시(안드로이드)는 원스토어로 보낸다. **스토어 링크는 아직 없다.** 나중에 링크가 생기거나 바뀌어도 이미 인쇄·배포한 QR은 그대로 써야 한다.

## 원칙: QR에는 우리 주소만 넣는다

```
QR = https://<도메인>/download?src=<유입경로>      ← QR에 박히는 건 이것뿐 (도메인 + /download)
          │  서버가 요청마다 판단
          ├─ 링크 있음 · 아이폰        → 307 → APP_STORE_URL (환경변수)
          ├─ 링크 있음 · 안드로이드     → 307 → ONE_STORE_URL (환경변수)
          ├─ 링크 없음 · 휴대폰        → 200 → "출시 준비 중" 화면
          └─ PC                       → 200 → QR + 스토어 버튼 페이지
```

- 실제 스토어 주소는 **코드에 없고 서버 환경변수에만** 있다: `APP_STORE_URL`, `ONE_STORE_URL`.
- 링크가 생기면 Vercel 환경변수만 넣고 재배포 → 같은 QR이 스토어로 가기 시작한다. 코드·QR 수정 없음.
- 스토어 버튼(헤더 팝오버, closing, PC 페이지)도 스토어로 직접 링크하지 않고 `/download?store=appstore|onestore`를 거친다. 그래서 링크를 관리하는 곳이 환경변수 한 곳뿐이다.
- 리다이렉트는 **307(임시)**만 쓴다. 308/301(영구)로 하면 폰 브라우저가 캐시해서 나중에 링크를 바꿔도 예전 곳으로 간다.
- 원스토어는 공식 단축 URL `https://onesto.re/<PID>`를 쓴다(원스토어 앱이 있으면 앱, 없으면 원스토어 모바일 웹이 열려서 예외 처리 불필요). 안드로이드는 제조사와 상관없이 원스토어로 보낸다.
- 절대 바꾸면 안 되는 것: **도메인**, **`/download` 경로**. 이 둘은 QR에 박힌다.

## 할 일

- [x] `src/shared/config/store.ts` (그리고 `shared/config/index.ts`에서 export)
  ```ts
  /** 배포 도메인. QR에 박히는 유일한 값이라 확정 후 절대 바꾸지 않는다 */
  export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://heddy.site";
  /** QR에 박히는 경로. 바꾸면 이미 뿌린 QR이 죽는다 */
  export const DOWNLOAD_PATH = "/download";
  export type StoreKey = "appstore" | "onestore";
  /** 다운로드 진입 주소(상대). store를 주면 OS 판별 대신 그 스토어로 보낸다 */
  export const downloadPath = (src: string, store?: StoreKey) =>
    `${DOWNLOAD_PATH}?src=${encodeURIComponent(src)}${store ? `&store=${store}` : ""}`;
  /** QR에 인코딩되는 절대 주소 */
  export const downloadUrl = (src: string) => `${SITE_URL}${downloadPath(src)}`;
  ```
  스토어 주소 상수는 만들지 않는다.
- [x] `src/features/download-app/lib/detectPlatform.ts` + 테스트 — `(ua) => "ios" | "android" | "desktop"`. `/iPhone|iPad|iPod/` → ios, `/Android/` → android, 나머지 desktop. 실제 UA로: 아이폰 사파리·카톡 인앱 → ios / 갤럭시 크롬·삼성인터넷·네이버 인앱 → android / Mac·Windows·null → desktop.
- [x] `src/features/download-app/lib/resolveStoreUrl.ts` + 테스트 — **테스트 먼저**
  ```ts
  export type StoreEnv = { APP_STORE_URL?: string; ONE_STORE_URL?: string };
  /** 링크가 아직 없으면 null → "출시 준비 중". 우선순위: ?store= 지정 → 기기 OS → PC는 null */
  export const resolveStoreUrl = (platform: Platform, store: string | null | undefined, env: StoreEnv): string | null
  ```
  테스트: 아이폰 → App Store, 안드로이드 → 원스토어 / `?store=`가 OS보다 우선 / PC + 지정 없음 → null / 환경변수 없음·빈 문자열 → null / 모르는 store 값은 무시하고 OS로.
- [x] `pnpm add qrcode.react` → `features/download-app/ui/DownloadQr.tsx`(client, `interface DownloadQrProps { source: string; size?: number }`): `QRCodeSVG value={downloadUrl(source)} level="H" marginSize={0}`, 가운데 `/brand/logo-symbol.png` 22% 크기 `excavate: true`.
- [x] `shared/ui/StoreButtons` — Props에 `source` 추가, 버튼 두 개 "App Store" → `downloadPath(source, "appstore")`, "원스토어" → `downloadPath(source, "onestore")`. Google Play 버튼 제거. 사용처(헤더 팝오버 `header`, closing `closing`)에 source 전달.
- [x] `DownloadButton` — `handleClick`: `matchMedia("(pointer: coarse)")`면 `location.href = downloadPath("header")`, 아니면 팝오버 토글. 팝오버에 `<DownloadQr source="header" />`.
- [x] `features/download-app/ui/IpadStoreRedirect.tsx`(client): `Macintosh` UA + `maxTouchPoints > 1`이면 `location.replace(downloadPath("ipad", "appstore"))`.
- [x] `copy.ts`의 `DOWNLOAD_COPY`에 `comingSoon` 추가 (문구는 사람에게 확인. 임시: "헤디는 출시 준비 중이에요").
- [x] `src/pages/download/ui/DownloadPage.tsx`(async 서버 컴포넌트, `interface DownloadPageProps { searchParams: Promise<{ store?: string }> }`)
  - `resolveStoreUrl(detectPlatform(UA), store, { APP_STORE_URL: process.env.APP_STORE_URL, ONE_STORE_URL: process.env.ONE_STORE_URL })`
  - 결과가 있으면 `redirect(target)` (307)
  - 없고 휴대폰이거나 `store`가 지정됐으면 → 로고 + "출시 준비 중"
  - PC면 → 로고 + 큰 QR(`source="download-page"`) + 안내 문구 + 스토어 버튼 + `<IpadStoreRedirect />`
  - ⚠️ `IpadStoreRedirect`는 **PC 분기 안에만** 둔다. "출시 준비 중" 화면에 두면 iPad에서 무한 새로고침된다.
  - 루트 `app/download/page.tsx`는 re-export만.
- [ ] `.env.example`에 `NEXT_PUBLIC_SITE_URL=`, `APP_STORE_URL=`, `ONE_STORE_URL=` 추가(값은 비워둠). **미완료** — 이 저장소 권한 설정(`.env*` 쓰기 차단)에 막혀 Claude가 만들지 못함. 사람이 직접 추가 필요.

## 완료 기준

- [x] `pnpm test -- detectPlatform resolveStoreUrl` 통과, `pnpm verify` · `pnpm build` 통과 (`/download`가 `ƒ (Dynamic)`)
- [x] **같은 빌드**로 환경변수만 바꿔 두 번 확인한다(= 링크를 나중에 넣어도 코드·QR이 안 바뀐다는 증명):
  ```bash
  IP="Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X)"; GX="Mozilla/5.0 (Linux; Android 15; SM-S928N)"
  # ① 링크 없음
  pnpm start
  curl -s -o /dev/null -w '%{http_code}\n' -A "$IP" localhost:3000/download   # 200 (출시 준비 중)
  curl -s -o /dev/null -w '%{http_code}\n' -A "$GX" localhost:3000/download   # 200 (출시 준비 중)
  # ② 링크 있음 (재빌드 없이)
  APP_STORE_URL=https://apps.apple.com/kr/app/id6700000000 ONE_STORE_URL=https://onesto.re/0000799999 pnpm start
  curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' -A "$IP" localhost:3000/download   # 307 https://apps.apple.com/...
  curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' -A "$GX" localhost:3000/download   # 307 https://onesto.re/...
  curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' "localhost:3000/download?store=onestore" # 307 https://onesto.re/...
  ```

## 인쇄용 QR 이미지 (포스터 · 전시 부스)

도메인만 확정되면 **스토어 링크가 없어도 지금 인쇄해도 된다.** 출시 전엔 "출시 준비 중"이 뜨고, 출시 후엔 같은 QR이 스토어로 간다.

```bash
npx qrcode -e H -w 1200 -o heddy-download-qr.png "https://<도메인>/download?src=poster"
npx qrcode -e H -o heddy-download-qr.svg "https://<도메인>/download?src=poster"
```

- `-e H`: 오류 복원율 최대 → 가운데 로고(QR 폭의 25% 이하)를 얹어도 읽힌다.
- 장소마다 `src`를 다르게(`poster`, `exhibition`) 하면 유입 경로를 구분할 수 있다.
- 인쇄 전 휴대폰 카메라로 실제 확인.

## 출시 때 할 일 (코드 수정 없음)

1. Vercel → Settings → Environment Variables에 `APP_STORE_URL`(`https://apps.apple.com/kr/app/id<Apple ID 숫자>`), `ONE_STORE_URL`(`https://onesto.re/<PID>`) 추가
2. 재배포(Redeploy) — 환경변수는 다음 배포부터 적용된다
3. 아이폰·갤럭시로 QR을 찍어 확인

## 지금 확정할 것

- [x] 배포 도메인 → `NEXT_PUBLIC_SITE_URL` = `https://heddy.site` (2026-09-28 확정). QR에 박히는 유일한 값이라 인쇄 전에 반드시 확정.

## 나중에 (범위 밖)

- 앱이 깔려 있으면 스토어 대신 앱을 여는 것(토스 방식): iOS Universal Links + Android App Links를 이 도메인에 올리고 heddy-app(Capacitor)에 도메인 연결 필요. 이것도 같은 `/download` 주소 위에서 동작하므로 QR은 그대로.

## 참고

- 원스토어 연동규격(링크 형식): https://onestore-dev.gitbook.io/dev/tools/app-links

## 변경 기록

- 2026-09-27: 생성. 스토어 링크를 환경변수로 분리하고 모든 진입점이 `/download`를 거치게 함. 같은 빌드에서 환경변수 유무만 바꿔 검증(없음 → 휴대폰 200 출시 준비 중 / 있음 → 아이폰 307 App Store, 갤럭시 307 원스토어, PC 200 QR).
- 2026-09-28: 구현 완료. `detectPlatform`·`resolveStoreUrl` 테스트를 먼저 쓰고 통과시킴(총 33개 테스트 통과). `pnpm verify`·`pnpm build` 통과, `/download`는 `ƒ (Dynamic)`로 확인. 프로덕션 빌드(`pnpm start`) 하나로 환경변수만 바꿔 두 번 실측: env 없음 → 아이폰·갤럭시 UA 모두 200(출시 준비 중) / env 채움(재빌드 없이) → 아이폰 307 App Store, 갤럭시 307 원스토어, `?store=onestore`·`?store=appstore` 각각 UA 무관하게 307 → 지정한 스토어. PC(데스크톱 UA) 200 + QR·App Store·원스토어 버튼 렌더 확인. `.env.example`은 이 저장소 권한 설정(`.env*` 쓰기 차단)에 막혀 Claude가 만들지 못함 — 사람이 직접 추가 필요.
