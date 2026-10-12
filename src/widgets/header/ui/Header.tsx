"use client";

import { useRef } from "react";

import Image from "next/image";

import { DownloadAppButton } from "@/features/download-app";

import { useHeaderOffset } from "../model/useHeaderOffset";

/**
 * 상단바: 로고(PNG) + 다운로드 버튼. 아래로 스크롤하면 헤더가 먼저 올라가 숨고(그동안 화면은 멈춤), 숨은 뒤에 화면이 스크롤된다.
 * 위로 스크롤하면 화면이 스크롤되는 만큼 헤더가 내려온다. 동작은 `useHeaderOffset`.
 * TODO(docs/plans/0001, TIMELINE.ar): ar 다크 패널(c>0.95) 구간에서 배경 투명 + 로고 숨김.
 * 로고 PNG(`public/brand/logo-wordmark.png`)는 아직 없다 — 넣으면 그대로 보인다.
 */
export const Header = () => {
  const headerRef = useRef<HTMLElement>(null);
  useHeaderOffset(headerRef);

  // 키보드로 헤더 안 버튼에 포커스가 가면 숨겨져 있어도 보이게 한다(focus-within)
  return (
    <header
      ref={headerRef}
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-16 py-4 [transform:translateY(calc(var(--header-offset,0px)*-1))] transition-transform duration-200 ease-out focus-within:[transform:none] motion-reduce:transition-none"
    >
      <div className="relative h-7 w-20">
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
