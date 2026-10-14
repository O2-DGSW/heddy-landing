"use client";

import { useCallback, useRef } from "react";

import Image from "next/image";

import { DownloadAppButton } from "@/features/download-app";
import { useSceneFrame, type SceneFrame } from "@/shared/lib/scroll";

import { isHeaderOverDarkPanel } from "../model/headerOverDark";
import { useHeaderOffset } from "../model/useHeaderOffset";

/**
 * 상단바: 로고(PNG) + 다운로드 버튼. 아래로 스크롤하면 헤더가 먼저 올라가 숨고(그동안 화면은 멈춤), 숨은 뒤에 화면이 스크롤된다.
 * 위로 스크롤하면 화면이 스크롤되는 만큼 헤더가 내려온다. 동작은 `useHeaderOffset`.
 * 배경은 흰색 90% + 블러 — 뒤로 지나가는 본문이 비쳐 겹쳐 보이지 않게 한다.
 * AR 다크 패널이 헤더 자리를 덮는 동안엔 배경을 투명하게 하고 로고를 숨긴다(`docs/plans/0008`).
 * 로고 PNG(`public/brand/logo-wordmark.png`)는 아직 없다 — 넣으면 그대로 보인다.
 */
export const Header = () => {
  const headerRef = useRef<HTMLElement>(null);
  useHeaderOffset(headerRef);

  const handleFrame = useCallback((frame: SceneFrame) => {
    const header = headerRef.current;
    if (!header) return;
    const isDark = String(isHeaderOverDarkPanel(frame));
    if (header.dataset.dark !== isDark) header.dataset.dark = isDark;
  }, []);
  useSceneFrame(handleFrame);

  // 키보드로 헤더 안 버튼에 포커스가 가면 숨겨져 있어도 보이게 한다(focus-within)
  return (
    <header
      ref={headerRef}
      data-dark="false"
      className="group fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-white/90 px-5 py-4 lg:px-gutter backdrop-blur-md data-[dark=true]:bg-transparent data-[dark=true]:backdrop-blur-none [transform:translateY(calc(var(--header-offset,0px)*-1))] transition-[transform,background-color] duration-200 ease-out focus-within:[transform:none] motion-reduce:transition-none"
    >
      <div className="relative h-7 w-20 transition-opacity duration-300 group-data-[dark=true]:opacity-0">
        <Image
          src="/brand/logo-wordmark.png"
          alt="Heddy"
          fill
          sizes="96px"
          className="object-contain"
          priority
        />
      </div>
      <DownloadAppButton />
    </header>
  );
};
