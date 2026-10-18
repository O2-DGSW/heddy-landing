/** 배포 도메인. QR에 박히는 유일한 값이라 확정 후 절대 바꾸지 않는다 (2026-09-28 확정) */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://heddy.site";

/** QR에 박히는 경로. 바꾸면 이미 뿌린 QR이 죽는다 */
export const DOWNLOAD_PATH = "/download";

/** 모바일 웹(heddy-app, `docs/plans/0006`). 스토어 링크가 없는 동안 다운로드 진입이 여기로 간다(이슈 #98) */
export const MOBILE_WEB_PATH = "/mobile";

export type StoreKey = "appstore" | "onestore";

/**
 * `/download`의 store 값. 없으면 랜딩페이지(명함에 인쇄된 QR), `auto`는 기기 OS별 스토어,
 * `appstore`·`onestore`는 그 스토어로 보낸다(이슈 #48, `docs/plans/0002`)
 */
export type DownloadStore = StoreKey | "auto";

/** 다운로드 진입 주소(상대) */
export const downloadPath = (src: string, store?: DownloadStore): string =>
  `${DOWNLOAD_PATH}?src=${encodeURIComponent(src)}${store ? `&store=${store}` : ""}`;

/** QR에 인코딩되는 절대 주소. 사이트 안 QR은 `auto`(OS별 스토어) — store 없는 주소는 명함 QR(랜딩)이다 */
export const downloadUrl = (src: string, store?: DownloadStore): string =>
  `${SITE_URL}${downloadPath(src, store)}`;
