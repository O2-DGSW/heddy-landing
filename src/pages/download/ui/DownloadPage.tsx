import Image from "next/image";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  detectPlatform,
  DownloadQr,
  ipadDownloadHref,
  IpadStoreRedirect,
  resolveDownloadDestination,
} from "@/features/download-app";
import { StoreButtons } from "@/shared/ui";

export interface DownloadPageProps {
  searchParams: Promise<{ store?: string }>;
}

const Logo = () => (
  <div className="relative h-6 w-24">
    <Image src="/brand/logo-wordmark.png" alt="Heddy" fill className="object-contain" priority />
  </div>
);

/**
 * `/download` — store가 없으면(명함에 인쇄된 QR) 랜딩페이지로, 스토어 링크가 있으면 그 스토어로 보낸다(이슈 #48).
 * 아직 링크가 없으면 휴대폰은 모바일 웹(`/mobile`), PC는 QR 페이지를 보여 준다(이슈 #98).
 * 스토어 링크는 서버 환경변수(`APP_STORE_URL`/`ONE_STORE_URL`)에만 있다 (`docs/plans/0002`).
 * 리다이렉트는 모두 307이라 나중에 링크가 생겨도 폰 브라우저가 예전 목적지를 캐시하지 않는다.
 */
export const DownloadPage = async ({ searchParams }: DownloadPageProps) => {
  const { store } = await searchParams;
  const headerList = await headers();
  const platform = detectPlatform(headerList.get("user-agent"));
  const env = { APP_STORE_URL: process.env.APP_STORE_URL, ONE_STORE_URL: process.env.ONE_STORE_URL };

  const destination = resolveDownloadDestination(platform, store, env);
  if (destination.kind === "redirect") redirect(destination.url);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <Logo />
      <DownloadQr source="download-page" size={220} />
      {/* TODO: 안내 문구 확정 필요 (docs/plans/0002) — 지어내지 않음 */}
      <StoreButtons source="download-page" />
      <IpadStoreRedirect href={ipadDownloadHref(env)} />
    </main>
  );
};
