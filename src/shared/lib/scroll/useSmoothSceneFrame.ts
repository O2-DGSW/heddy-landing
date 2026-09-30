"use client";

import { useContext, useEffect, useRef } from "react";

import { damp } from "@/shared/lib/motion";

import { ScrollSceneContext } from "./ScrollSceneProvider";
import { createFrame, type SceneFrame } from "./sceneFrame";

/** 표시 위치가 실제 스크롤과 이만큼(px) 이내면 따라잡은 것으로 보고 멈춘다 */
const SETTLE_PX = 0.5;

/**
 * `useSceneFrame`과 같지만, 스크롤 위치를 반감기(halfLifeMs)로 부드럽게 따라가는 프레임을 준다.
 * 빠르게 스크롤해 몇 스텝을 한 번에 건너뛰어도 그 사이 모션이 전부 재생된다.
 * 같은 halfLifeMs를 쓰는 구독자끼리는 같은 rAF 시각으로 계산하므로 서로 맞는다.
 */
export const useSmoothSceneFrame = (
  onFrame: (frame: SceneFrame) => void,
  halfLifeMs: number,
): void => {
  const context = useContext(ScrollSceneContext);
  const onFrameRef = useRef(onFrame);

  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    if (!context) return undefined;
    let latest: SceneFrame | null = null;
    let smoothY: number | null = null;
    let lastTime: number | null = null;
    let rafId: number | null = null;

    const tick = (time: number) => {
      rafId = null;
      if (!latest) return;
      const dt = lastTime == null ? 16 : Math.min(time - lastTime, 100);
      lastTime = time;
      const target = latest.scrollY;
      smoothY = smoothY == null || latest.isReducedMotion ? target : damp(smoothY, target, dt, halfLifeMs);
      if (Math.abs(target - smoothY) < SETTLE_PX) smoothY = target;
      onFrameRef.current(createFrame(smoothY, latest.layout, latest.sections, latest.isReducedMotion));
      if (smoothY !== target) rafId = requestAnimationFrame(tick);
      else lastTime = null;
    };

    const unsubscribe = context.subscribe((frame) => {
      latest = frame;
      if (rafId == null) rafId = requestAnimationFrame(tick);
    });

    return () => {
      unsubscribe();
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, [context, halfLifeMs]);
};
