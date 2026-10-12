"use client";

import { useCallback, useRef } from "react";

import Image from "next/image";

import { DownloadAppButton } from "@/features/download-app";
import { useSceneFrame, type SceneFrame } from "@/shared/lib/scroll";

import { INITIAL_HEADER_STATE, stepHeaderVisibility, type HeaderState } from "../model/headerVisibility";

/**
 * 상단바: 로고(PNG) + 다운로드 버튼. 아래로 스크롤하면 위로 숨고, 위로 올리면 다시 나온다.
 * 숨김은 data-hidden으로만 바꾼다(스크롤 프레임마다 setState 금지) — 슬라이드는 CSS transition.
 * TODO(docs/plans/0001, TIMELINE.ar): ar 다크 패널(c>0.95) 구간에서 배경 투명 + 로고 숨김.
 * 로고 PNG(`public/brand/logo-wordmark.png`)는 아직 없다 — 넣으면 그대로 보인다.
 */
export const Header = () => {
  const headerRef = useRef<HTMLElement>(null);
  const stateRef = useRef<HeaderState>(INITIAL_HEADER_STATE);

  const handleFrame = useCallback((frame: SceneFrame) => {
    const next = stepHeaderVisibility(stateRef.current, frame.scrollY);
    if (next.isVisible !== stateRef.current.isVisible && headerRef.current) {
      headerRef.current.dataset.hidden = String(!next.isVisible);
    }
    stateRef.current = next;
  }, []);

  useSceneFrame(handleFrame);

  // 키보드로 헤더 안 버튼에 포커스가 가면 숨겨져 있어도 보이게 한다(focus-within)
  return (
    <header
      ref={headerRef}
      data-hidden="false"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-16 py-4 transition-transform duration-300 ease-out data-[hidden=true]:-translate-y-full data-[hidden=true]:focus-within:translate-y-0"
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
