"use client";

import { useRef } from "react";

import { COPY, FULLPAGE, TIMELINE, type SectionKey } from "@/shared/config";
import { activeFullpageIndex, fullpageStops, scrollToFullpageStop, useSceneFrame } from "@/shared/lib/scroll";

/** 새 광고 문구 대신 기존 섹션 문구로 화면 이동 버튼의 접근성 이름을 구성한다. */
const stopLabel = (key: SectionKey, progress: number): string => {
  if (key === "intro") return "Heddy 소개";
  if (key === "closing") return COPY.sections.closing.title.join(" ");
  if (key === "ar" && progress < 0.5) return COPY.sections.ar.panelCopy.join(" ");
  return COPY.sections[key].eyebrow;
};

const LABELS = [...FULLPAGE.stops.map(([key, progress]) => stopLabel(key, progress)), "푸터"];

/** 완성 화면으로 이동하는 데스크톱 점 내비게이션. 프레임마다 React 상태 대신 현재 버튼 속성만 갱신한다. */
const FullpageNavigation = () => {
  const navRef = useRef<HTMLElement>(null);
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useSceneFrame((frame) => {
    if (frame.layout.isMobile) return;
    const stops = fullpageStops(
      frame.sections,
      frame.layout.viewportHeight,
      document.documentElement.scrollHeight - window.innerHeight,
    );
    const active = activeFullpageIndex(stops, frame.scrollY);
    buttonsRef.current.forEach((button, index) => {
      if (!button) return;
      const isActive = index === active;
      if (button.dataset.active === String(isActive)) return;
      button.dataset.active = String(isActive);
      if (isActive) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    const ar = frame.sections.find((section) => section.key === "ar");
    if (navRef.current) {
      const isDark = String(
        Boolean(
          ar &&
          frame.scrollY >= ar.top &&
          frame.scrollY < ar.end &&
          frame.progress("ar") > TIMELINE.ar.pillMorph[1],
        ),
      );
      if (navRef.current.dataset.dark !== isDark) navRef.current.dataset.dark = isDark;
    }
  });

  const handleNavigate = (index: number) => scrollToFullpageStop(index);

  return (
    <nav
      ref={navRef}
      aria-label="화면 이동"
      className="fixed right-4 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-center rounded-full bg-white/80 py-2 text-neutral-700 backdrop-blur-md lg:flex data-[dark=true]:bg-neutral-900/80 data-[dark=true]:text-white"
    >
      {LABELS.map((label, index) => (
        <button
          key={label}
          ref={(node) => {
            buttonsRef.current[index] = node;
          }}
          type="button"
          aria-label={`${index + 1}. ${label}`}
          aria-current={index === 0 ? "step" : undefined}
          data-active={index === 0}
          onClick={() => handleNavigate(index)}
          className="group flex h-10 w-10 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main-50"
        >
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-current opacity-40 transition-[transform,opacity] group-hover:opacity-100 group-data-[active=true]:scale-150 group-data-[active=true]:opacity-100 motion-reduce:transition-none"
          />
        </button>
      ))}
    </nav>
  );
};

export default FullpageNavigation;
