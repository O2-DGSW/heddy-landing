"use client";

import { createContext, useEffect, useRef, type ReactNode } from "react";

import { SECTION_KEYS, STAGE_LAYOUT } from "@/shared/config";

import { createFrame, type SceneFrame } from "./sceneFrame";
import { stableViewportSize, type ViewportSize } from "./stableViewport";
import { computeStageLayout } from "./stageLayout";
import { useSmoothWheelScroll } from "./useSmoothWheelScroll";
import { useFullpageScroll } from "./useFullpageScroll";
import type { SectionFrame } from "./stageLayout";

type FrameListener = (frame: SceneFrame) => void;

type ScrollSceneContextValue = {
  subscribe: (listener: FrameListener) => () => void;
};

export const ScrollSceneContext = createContext<ScrollSceneContextValue | null>(null);

interface ScrollSceneProviderProps {
  children: ReactNode;
}

/** [data-section] 엘리먼트를 측정하고, 스크롤/리사이즈마다 rAF 1회로 구독자에게 SceneFrame을 전달한다 */
export const ScrollSceneProvider = ({ children }: ScrollSceneProviderProps) => {
  const listenersRef = useRef(new Set<FrameListener>());
  const sectionsRef = useRef<SectionFrame[]>([]);
  const rafIdRef = useRef<number | null>(null);
  const frameRef = useRef<SceneFrame | null>(null);
  // 휠 스크롤을 관성 스크롤로 — 프레임은 실제 스크롤 위치(scroll 이벤트)에서 그대로 나온다
  useSmoothWheelScroll();
  useFullpageScroll();

  useEffect(() => {
    const measure = () => {
      const nodes = document.querySelectorAll<HTMLElement>("[data-section]");
      sectionsRef.current = Array.from(nodes).flatMap((node) => {
        const key = SECTION_KEYS.find((candidate) => candidate === node.dataset.section);
        if (!key) return [];
        const top = node.getBoundingClientRect().top + window.scrollY;
        const height = node.offsetHeight;
        return [
          {
            key,
            top,
            height,
            end: top + height,
          },
        ];
      });
    };

    // 모바일 주소창이 접히고 펴져도 폰 크기·자리가 출렁이지 않게 높이를 붙잡아 둔다(이슈 #50)
    let viewport: ViewportSize | null = null;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;

    const emit = () => {
      rafIdRef.current = null;
      // 폭은 스크롤바를 뺀 폭(clientWidth) — 폰이 스크롤바만큼 오른쪽으로 밀리지 않게(fixed 폰 레이어와 같은 폭)
      // CSS 미디어 쿼리(lg)는 스크롤바 포함 폭으로 판단하므로, 데스크톱으로 보이는 동안엔 모바일 레이아웃으로 넘어가지 않게 한다
      const { breakpoint } = STAGE_LAYOUT.desktop;
      const clientWidth = document.documentElement.clientWidth;
      const width = window.innerWidth >= breakpoint ? Math.max(clientWidth, breakpoint) : clientWidth;
      viewport = stableViewportSize(viewport, { width, height: window.innerHeight }, isTouch);
      const layout = computeStageLayout(viewport.width, viewport.height);
      const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const frame = createFrame(window.scrollY, layout, sectionsRef.current, isReducedMotion);
      frameRef.current = frame;
      listenersRef.current.forEach((listener) => listener(frame));
    };

    const schedule = () => {
      if (rafIdRef.current != null) return;
      rafIdRef.current = requestAnimationFrame(emit);
    };

    const handleResize = () => {
      measure();
      schedule();
    };

    measure();
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", handleResize);
      if (rafIdRef.current != null) {
        // StrictMode(dev)에서 effect가 mount→cleanup→mount로 다시 실행되므로,
        // 취소한 rAF id를 null로 되돌려야 재마운트 시 schedule()이 다시 예약한다.
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  const subscribe = (listener: FrameListener) => {
    listenersRef.current.add(listener);
    if (frameRef.current) listener(frameRef.current);
    return () => listenersRef.current.delete(listener);
  };

  return <ScrollSceneContext.Provider value={{ subscribe }}>{children}</ScrollSceneContext.Provider>;
};
