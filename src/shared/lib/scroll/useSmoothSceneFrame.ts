"use client";

import { useContext, useEffect, useRef } from "react";

import { ScrollSceneContext } from "./ScrollSceneProvider";
import type { SceneFrame } from "./sceneFrame";

/**
 * `useSceneFrame`과 같지만, 스크롤 위치를 반감기(halfLifeMs)로 부드럽게 따라가는 프레임을 준다.
 * 빠르게 스크롤해 몇 스텝을 한 번에 건너뛰어도 그 사이 모션이 전부 재생된다.
 * 같은 halfLifeMs를 쓰는 구독자끼리는 같은 rAF 시각으로 계산하므로 서로 맞는다.
 */
export const useSmoothSceneFrame = (onFrame: (frame: SceneFrame) => void, halfLifeMs: number): void => {
  const context = useContext(ScrollSceneContext);
  const onFrameRef = useRef(onFrame);

  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    if (!context) return undefined;
    return context.subscribeSmooth((frame) => onFrameRef.current(frame), halfLifeMs);
  }, [context, halfLifeMs]);
};
