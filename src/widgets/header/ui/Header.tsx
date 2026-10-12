"use client";

import { useCallback, useRef } from "react";

import Image from "next/image";

import { DownloadAppButton } from "@/features/download-app";
import { useSceneFrame, type SceneFrame } from "@/shared/lib/scroll";

import { INITIAL_HEADER_STATE, stepHeaderOffset, type HeaderState } from "../model/headerVisibility";

/**
 * 상단바: 로고(PNG) + 다운로드 버튼. 스크롤한 양만큼 헤더가 위로 밀려 올라가고(숨김), 위로 올리면 같은 양만큼 내려온다.
 * 오프셋은 CSS 변수(--header-offset)로만 쓴다(스크롤 프레임마다 setState 금지).
 * TODO(docs/plans/0001, TIMELINE.ar): ar 다크 패널(c>0.95) 구간에서 배경 투명 + 로고 숨김.
 * 로고 PNG(`public/brand/logo-wordmark.png`)는 아직 없다 — 넣으면 그대로 보인다.
 */
export const Header = () => {
  const headerRef = useRef<HTMLElement>(null);
  const stateRef = useRef<HeaderState>(INITIAL_HEADER_STATE);

  const handleFrame = useCallback((frame: SceneFrame) => {
    const header = headerRef.current;
    if (!header) return;
    const next = stepHeaderOffset(stateRef.current, frame.scrollY, header.offsetHeight);
    if (next.offset !== stateRef.current.offset) {
      header.style.setProperty("--header-offset", `${next.offset}px`);
    }
    stateRef.current = next;
  }, []);

  useSceneFrame(handleFrame);

  // 키보드로 헤더 안 버튼에 포커스가 가면 숨겨져 있어도 보이게 한다(focus-within)
  return (
    <header
      ref={headerRef}
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-16 py-4 [transform:translateY(calc(var(--header-offset,0px)*-1))] focus-within:[transform:none]"
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
