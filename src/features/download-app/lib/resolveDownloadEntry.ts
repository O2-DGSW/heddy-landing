import { downloadPath, MOBILE_WEB_PATH } from "@/shared/config";

import type { Platform } from "./detectPlatform";
import { resolveStoreUrl, type StoreEnv } from "./resolveStoreUrl";

/**
 * `/download`로 들어온 요청을 랜딩페이지로 보낼지(이슈 #48). `store`가 없는 주소는 명함 뒷면에 인쇄된 QR
 * (`/download?src=header`)이라 서비스 소개(랜딩)를 먼저 보여 준다. 사이트 안 QR·휴대폰 헤더 버튼은
 * `store=auto`(OS별 스토어), 스토어 버튼은 `store=appstore|onestore`라 그대로 스토어로 간다.
 */
export const isLandingEntry = (store: string | null | undefined): boolean => !store;

export type DownloadDestination = { kind: "redirect"; url: string } | { kind: "qr" };

/**
 * `/download` 목적지(이슈 #98): 명함 QR → 랜딩, 스토어 링크 있음 → 스토어, 없으면 휴대폰은 모바일 웹,
 * PC는 QR 페이지(휴대폰으로 찍으면 모바일 웹). 스토어 링크 환경변수만 넣으면 코드 수정 없이 스토어로 바뀐다.
 */
export const resolveDownloadDestination = (
  platform: Platform,
  store: string | null | undefined,
  env: StoreEnv,
): DownloadDestination => {
  if (isLandingEntry(store)) return { kind: "redirect", url: "/" };
  const storeUrl = resolveStoreUrl(platform, store, env);
  if (storeUrl) return { kind: "redirect", url: storeUrl };
  if (platform !== "desktop") return { kind: "redirect", url: MOBILE_WEB_PATH };
  return { kind: "qr" };
};

/**
 * iPad(데스크톱 UA로 위장)가 PC용 QR 페이지에서 갈 곳. App Store 링크가 없을 때 `store=appstore`로 보내면
 * 다시 QR 페이지가 나와 무한 반복되므로 모바일 웹으로 보낸다.
 */
export const ipadDownloadHref = (env: StoreEnv): string =>
  env.APP_STORE_URL ? downloadPath("ipad", "appstore") : MOBILE_WEB_PATH;
