"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { INTRO, INTRO_COPY } from "@/shared/config";

import { loopTime, parseFrozenTime, REDUCED_MOTION_TIME } from "../model/clock";
import { IntroClockContext } from "./IntroClock";

type FrameListener = (t: number) => void;

interface IntroStageProps {
  children: ReactNode;
  /** 무대 크기 — 기본은 화면 높이 꽉(h-svh), 모바일 카드처럼 쓸 땐 비율 상자(aspect-video) */
  className?: string;
}

/**
 * 인트로 무대(이슈 #70): 1920×1080 장면들을 화면 안에 다 들어오게(contain) 줄여 가운데 두고, 시계 하나로
 * 모든 장면을 돌린다. 음소거로 자동 재생하고 끝나면 반복한다. 소리를 켜면 오디오(최종 믹스)를 처음부터 틀고
 * 시계를 오디오 재생 시각에 맞춘다. 화면 밖이면 멈추고, 동작 줄이기면 마지막 문구 장면에서 멈춘다.
 * `?intro-t=초`로 시각을 고정할 수 있다(장면 확인용).
 */
export const IntroStage = ({ children, className = "h-svh" }: IntroStageProps) => {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const listenersRef = useRef(new Set<FrameListener>());
  const [isSoundOn, setIsSoundOn] = useState(false);

  const clock = useMemo(
    () => ({
      subscribe: (listener: FrameListener) => {
        listenersRef.current.add(listener);
        return () => {
          listenersRef.current.delete(listener);
        };
      },
    }),
    [],
  );

  // 무대 크기: 화면 안에 다 들어오게(contain) 줄여 가운데
  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return undefined;
    const handleResize = () => {
      const { width, height } = INTRO.stage;
      const scale = Math.min(root.clientWidth / width, root.clientHeight / height);
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
    const emit = (t: number) => listenersRef.current.forEach((listener) => listener(t));

    if (frozen != null || isReducedMotion) {
      // 장면들이 구독을 마친 뒤 한 번 그린다
      const id = requestAnimationFrame(() => emit(frozen ?? REDUCED_MOTION_TIME));
      return () => cancelAnimationFrame(id);
    }

    let rafId: number | null = null;
    let elapsed = 0;
    let last: number | null = null;
    const tick = (now: number) => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        elapsed = audio.currentTime;
      } else {
        elapsed += last == null ? 0 : Math.min(now - last, 100) / 1000;
      }
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
    const observer = new IntersectionObserver(([entry]) => (entry?.isIntersecting ? start() : stop()));
    observer.observe(root);
    return () => {
      observer.disconnect();
      stop();
    };
  }, []);

  const handleToggleSound = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isSoundOn) {
      audio.pause();
      setIsSoundOn(false);
      return;
    }
    audio.currentTime = 0;
    audio.muted = false;
    void audio.play().then(() => setIsSoundOn(true));
  };

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
        {}
        <audio ref={audioRef} src="/intro/heddy-intro.m4a" preload="none" loop />
        <button
          type="button"
          onClick={handleToggleSound}
          aria-pressed={isSoundOn}
          aria-label={isSoundOn ? INTRO_COPY.soundOff : INTRO_COPY.soundOn}
          className="text-12 absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 font-medium text-white backdrop-blur-md transition-colors hover:bg-black/70 lg:text-14 lg:bottom-6 lg:right-6 lg:gap-2 lg:px-4 lg:py-2"
        >
          <SoundIcon isOn={isSoundOn} />
          {isSoundOn ? INTRO_COPY.soundOff : INTRO_COPY.soundOn}
        </button>
      </section>
    </IntroClockContext.Provider>
  );
};

interface SoundIconProps {
  isOn: boolean;
}

/** 스피커 아이콘(켜짐: 음파, 꺼짐: X) */
const SoundIcon = ({ isOn }: SoundIconProps) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" />
    {isOn ? (
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" strokeLinecap="round" />
    ) : (
      <path d="m16 9 6 6m0-6-6 6" strokeLinecap="round" />
    )}
  </svg>
);
