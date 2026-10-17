"use client";

import { useEffect, useRef, useState } from "react";

import dynamic from "next/dynamic";

import { PHONE_3D, STAGE_LAYOUT } from "@/shared/config";
import { useMediaQuery } from "@/shared/lib/media";
import { useSceneFrame } from "@/shared/lib/scroll";

import { preloadDracoDecoder, preloadSplineRuntime, preloadSplineScene } from "../lib/splinePreload";

const loadPhoneStageContent = () => import("./PhoneStageContent");
const PhoneStageContent = dynamic(loadPhoneStageContent, { ssr: false });

/** Spline 씬 URL. 없으면 CSS 폰만 쓴다(`docs/plans/0003`) */
const SPLINE_HERO_SCENE = process.env.NEXT_PUBLIC_SPLINE_HERO_SCENE;

/**
 * 첫 화면을 그린 직후 데스크톱에서 3D를 준비해 첫 기록 전환의 로딩을 없앤다(이슈 #88). 씬 파일·Spline 런타임·폰 레이어
 * 코드를 한꺼번에 받기 시작하고(예전엔 유휴 대기 뒤 차례로), 폰 레이어는 짧은 유휴 시간 안에 붙인다 — 무거운 3D 초기화가
 * 인트로를 보는 동안 끝난다.
 */
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
    // 받기는 바로 시작한다(네트워크는 인트로와 함께 진행) — 실패는 3D 시작 때 대체용 폰으로 처리한다
    if (SPLINE_HERO_SCENE) {
      preloadSplineScene(SPLINE_HERO_SCENE).catch(() => undefined);
      preloadSplineRuntime().catch(() => undefined);
      preloadDracoDecoder();
    }
    loadPhoneStageContent().catch(() => undefined);
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
