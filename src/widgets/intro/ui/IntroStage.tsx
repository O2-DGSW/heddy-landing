"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";

import { INTRO, INTRO_COPY } from "@/shared/config";
import { scrollToFullpageStop } from "@/shared/lib/scroll";

import { loopTime, parseFrozenTime, REDUCED_MOTION_TIME } from "../model/clock";
import { IntroClockContext } from "./IntroClock";

type FrameListener = (t: number) => void;

interface IntroStageProps {
  children: ReactNode;
  /** 무대 크기 — 기본은 화면 높이 꽉(h-svh), 모바일 카드처럼 쓸 땐 비율 상자(aspect-video) */
  className?: string;
}

/**
 * 인트로 무대(이슈 #70): 1920×1080 장면을 데스크톱에서는 화면에 꽉 채우고(cover), 모바일에서는
 * 전체가 보이도록(contain) 가운데 둔다. 시계 하나로
 * 모든 장면을 돌린다. 소리 없이 자동 재생하고 끝나면 반복한다(이슈 #94). 화면 밖이면 멈추고, 동작 줄이기면
 * 마지막 문구 장면에서 멈춘다.
 * `?intro-t=초`로 시각을 고정할 수 있다(장면 확인용).
 */
export const IntroStage = ({ children, className = "h-svh" }: IntroStageProps) => {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const listenersRef = useRef(new Set<FrameListener>());
  const timeRef = useRef<number>(INTRO.initialTime);

  const clock = useMemo(
    () => ({
      subscribe: (listener: FrameListener) => {
        listenersRef.current.add(listener);
        listener(timeRef.current);
        return () => {
          listenersRef.current.delete(listener);
        };
      },
    }),
    [],
  );

  // 데스크톱은 여백 없이 채우고, 모바일은 장면 전체를 보존한다.
  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return undefined;
    const handleResize = () => {
      const { width, height } = INTRO.stage;
      const scaleToFit = window.matchMedia("(min-width: 1024px)").matches ? Math.max : Math.min;
      const scale = scaleToFit(root.clientWidth / width, root.clientHeight / height);
      const left = (root.clientWidth - width * scale) / 2;
      const top = (root.clientHeight - height * scale) / 2;
      stage.style.transform = `translate(${left}px, ${top}px) scale(${scale})`;
    };
    handleResize();
    const observer = new ResizeObserver(handleResize);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  // 시계: rAF로 시각을 구독자에게 뿌린다(화면에 보일 때만)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const frozen = parseFrozenTime(window.location.search);
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const emit = (t: number) => {
      timeRef.current = t;
      listenersRef.current.forEach((listener) => listener(t));
    };

    if (frozen != null || isReducedMotion) {
      // 장면들이 구독을 마친 뒤 한 번 그린다
      const id = requestAnimationFrame(() => emit(frozen ?? REDUCED_MOTION_TIME));
      return () => cancelAnimationFrame(id);
    }

    let rafId: number | null = null;
    let elapsed: number = INTRO.initialTime;
    let last: number | null = null;
    let isIntersecting = false;
    const tick = (now: number) => {
      elapsed += last == null ? 0 : Math.min(now - last, 100) / 1000;
      last = now;
      emit(loopTime(elapsed));
      rafId = requestAnimationFrame(tick);
    };
    const start = () => {
      if (rafId == null) rafId = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      rafId = null;
      last = null;
    };
    const syncPlayback = () => (isIntersecting && !document.hidden ? start() : stop());
    const observer = new IntersectionObserver(([entry]) => {
      isIntersecting = Boolean(entry?.isIntersecting);
      syncPlayback();
    });
    observer.observe(root);
    document.addEventListener("visibilitychange", syncPlayback);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      stop();
    };
  }, []);

  const handleExplore = () => scrollToFullpageStop(1);

  return (
    <IntroClockContext.Provider value={clock}>
      <section
        ref={rootRef}
        aria-label="Heddy 소개"
        className={`relative w-full overflow-hidden bg-[#F4F5F6] ${className}`}
      >
        <div
          ref={stageRef}
          className="absolute left-0 top-0 h-[1080px] w-[1920px] origin-top-left overflow-hidden font-sans [&_img]:max-w-none"
        >
          {children}
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-24 bg-gradient-to-t from-neutral-950/60 to-transparent lg:block"
        />
        <button
          type="button"
          onClick={handleExplore}
          className="text-14 absolute bottom-7 left-1/2 z-10 hidden min-h-11 -translate-x-1/2 cursor-pointer flex-col items-center gap-1 px-3 font-medium text-white drop-shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white lg:flex"
        >
          {INTRO_COPY.scrollHint}
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </section>
    </IntroClockContext.Provider>
  );
};
