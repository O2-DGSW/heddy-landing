import Image from "next/image";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { detectPlatform, DownloadQr, IpadStoreRedirect, resolveStoreUrl } from "@/features/download-app";
import { DOWNLOAD_COPY } from "@/shared/config";
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
 * `/download` — QR 하나로 아이폰은 App Store, 안드로이드는 원스토어로 보낸다.
 * 스토어 링크는 서버 환경변수(`APP_STORE_URL`/`ONE_STORE_URL`)에만 있다 (`docs/plans/0002`).
 */
export const DownloadPage = async ({ searchParams }: DownloadPageProps) => {
  const { store } = await searchParams;
  const headerList = await headers();
  const platform = detectPlatform(headerList.get("user-agent"));

  const target = resolveStoreUrl(platform, store ?? null, {
    APP_STORE_URL: process.env.APP_STORE_URL,
    ONE_STORE_URL: process.env.ONE_STORE_URL,
  });

  if (target) redirect(target);

  const isComingSoon = platform !== "desktop" || Boolean(store);

  if (isComingSoon) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Logo />
        <p className="text-16">{DOWNLOAD_COPY.comingSoon}</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <Logo />
      <DownloadQr source="download-page" size={220} />
      {/* TODO: 안내 문구 확정 필요 (docs/plans/0002) — 지어내지 않음 */}
      <StoreButtons source="download-page" />
      <IpadStoreRedirect />
    </main>
  );
};
