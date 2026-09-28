/** 배포 도메인. QR에 박히는 유일한 값이라 확정 후 절대 바꾸지 않는다 (2026-09-28 확정) */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://heddy.site";

/** QR에 박히는 경로. 바꾸면 이미 뿌린 QR이 죽는다 */
export const DOWNLOAD_PATH = "/download";

export type StoreKey = "appstore" | "onestore";

/** 다운로드 진입 주소(상대). store를 주면 OS 판별 대신 그 스토어로 보낸다 */
export const downloadPath = (src: string, store?: StoreKey): string =>
  `${DOWNLOAD_PATH}?src=${encodeURIComponent(src)}${store ? `&store=${store}` : ""}`;

/** QR에 인코딩되는 절대 주소 */
export const downloadUrl = (src: string): string => `${SITE_URL}${downloadPath(src)}`;
