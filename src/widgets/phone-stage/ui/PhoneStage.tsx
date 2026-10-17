"use client";

import { useEffect, useRef, useState } from "react";

import dynamic from "next/dynamic";

import { PHONE_3D, STAGE_LAYOUT } from "@/shared/config";
import { useMediaQuery } from "@/shared/lib/media";
import { useSceneFrame } from "@/shared/lib/scroll";

const PhoneStageContent = dynamic(() => import("./PhoneStageContent"), { ssr: false });

/** 첫 화면을 그린 뒤 데스크톱의 유휴 시간에 3D를 준비해 첫 기록 전환의 로딩을 줄인다. */
export const PhoneStage = () => {
  const [isReady, setIsReady] = useState(false);
  const isReadyRef = useRef(false);
  const isDesktop = useMediaQuery(`(min-width: ${STAGE_LAYOUT.desktop.breakpoint}px)`);
  const isReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  useSceneFrame((frame) => {
    if (isReadyRef.current || frame.layout.isMobile) return;
    const record = frame.sections.find((section) => section.key === "record");
    if (!record || frame.scrollY < record.top - frame.layout.viewportHeight) return;
    isReadyRef.current = true;
    setIsReady(true);
  });

  useEffect(() => {
    if (!isDesktop || isReducedMotion || isReadyRef.current) return undefined;
    let idleId: number | undefined;
    let timerId: number | undefined;
    const scheduleTimeout = window.setTimeout;
    const prepare = () => {
      isReadyRef.current = true;
      setIsReady(true);
    };
    const frameId = window.requestAnimationFrame(() => {
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(prepare, { timeout: PHONE_3D.warmupTimeoutMs });
      } else {
        timerId = scheduleTimeout(prepare, 0);
      }
    });
    return () => {
      window.cancelAnimationFrame(frameId);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timerId !== undefined) window.clearTimeout(timerId);
    };
  }, [isDesktop, isReducedMotion]);

  return isReady ? (
    <PhoneStageContent />
  ) : (
    <div data-phone-stage className="pointer-events-none fixed inset-0 opacity-0" />
  );
};
