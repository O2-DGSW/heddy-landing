"use client";

import { createContext, useContext, useEffect, useRef, type RefObject } from "react";

import { isInScene } from "../model/clock";
import { applySceneVisibility } from "../model/sceneVisibility";

type FrameListener = (t: number) => void;

type IntroClockValue = { subscribe: (listener: FrameListener) => () => void };

export const IntroClockContext = createContext<IntroClockValue | null>(null);

/** 인트로 시계(초)를 구독한다. setState 없이 ref로만 반영할 것 */
export const useIntroFrame = (onFrame: FrameListener): void => {
  const context = useContext(IntroClockContext);
  const onFrameRef = useRef(onFrame);

  useEffect(() => {
    onFrameRef.current = onFrame;
  });

  useEffect(() => {
    if (!context) return undefined;
    return context.subscribe((t) => onFrameRef.current(t));
  }, [context]);
};

/**
 * 장면 하나를 구독한다: 장면 구간 밖이면 장면 루트를 숨기고 계산하지 않는다. 구간 안이면 update(t, 루트)를 부른다.
 * 반환한 ref를 장면 루트에 단다.
 */
export const useIntroScene = (
  window: readonly [number, number],
  update: (t: number, root: HTMLDivElement) => void,
): RefObject<HTMLDivElement | null> => {
  const rootRef = useRef<HTMLDivElement>(null);
  useIntroFrame((t) => {
    const root = rootRef.current;
    if (!root) return;
    const isActive = isInScene(t, window);
    applySceneVisibility(root, isActive);
    if (isActive) update(t, root);
  });
  return rootRef;
};
