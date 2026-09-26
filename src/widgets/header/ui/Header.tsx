import Image from "next/image";

import { DownloadAppButton } from "@/features/download-app";

/**
 * 상단바: 로고(PNG) + 다운로드 버튼.
 * TODO(docs/plans/0001, TIMELINE.ar): ar 다크 패널(c>0.95) 구간에서 배경 투명 + 로고 숨김.
 * 로고 PNG(`public/brand/logo-wordmark.png`)는 아직 없다 — 넣으면 그대로 보인다.
 */
export const Header = () => {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-4">
      <div className="relative h-6 w-24">
        <Image
          src="/brand/logo-wordmark.png"
          alt="Heddy"
          fill
          className="object-contain"
          priority
        />
      </div>
      <DownloadAppButton />
    </header>
  );
};
