import { damp } from "@/shared/lib/motion";

import { createFrame, type SceneFrame } from "./sceneFrame";

type Listener = (frame: SceneFrame) => void;
type SmoothGroup = {
  listeners: Set<Listener>;
  scrollY: number | null;
  lastTime: number | null;
};

/** 한 시계에서 DOM → 보간 모션 → 캔버스 순서로 처리한다. 같은 반감기의 모션은 같은 프레임을 공유한다. */
export const createSceneDispatcher = () => {
  const listeners = new Set<Listener>();
  const afterListeners = new Set<Listener>();
  const smoothGroups = new Map<number, SmoothGroup>();
  let latest: SceneFrame | null = null;

  const subscribe = (listener: Listener) => {
    listeners.add(listener);
    if (latest) listener(latest);
    return () => {
      listeners.delete(listener);
    };
  };

  const subscribeSmooth = (listener: Listener, halfLifeMs: number) => {
    let group = smoothGroups.get(halfLifeMs);
    if (!group) {
      group = { listeners: new Set(), scrollY: latest?.scrollY ?? null, lastTime: null };
      smoothGroups.set(halfLifeMs, group);
    }
    group.listeners.add(listener);
    if (latest)
      listener(
        createFrame(group.scrollY ?? latest.scrollY, latest.layout, latest.sections, latest.isReducedMotion),
      );
    return () => {
      group.listeners.delete(listener);
      if (group.listeners.size === 0) smoothGroups.delete(halfLifeMs);
    };
  };

  const subscribeAfterFrame = (listener: Listener) => {
    afterListeners.add(listener);
    return () => {
      afterListeners.delete(listener);
    };
  };

  const emit = (frame: SceneFrame, time: number): boolean => {
    latest = frame;
    listeners.forEach((listener) => listener(frame));
    let needsFrame = false;
    smoothGroups.forEach((group, halfLifeMs) => {
      const dt = group.lastTime == null ? 16 : Math.min(time - group.lastTime, 100);
      let scrollY =
        group.scrollY == null || frame.isReducedMotion
          ? frame.scrollY
          : damp(group.scrollY, frame.scrollY, dt, halfLifeMs);
      if (Math.abs(frame.scrollY - scrollY) < 0.5) scrollY = frame.scrollY;
      group.scrollY = scrollY;
      group.lastTime = scrollY === frame.scrollY ? null : time;
      needsFrame ||= scrollY !== frame.scrollY;
      const smoothFrame = createFrame(scrollY, frame.layout, frame.sections, frame.isReducedMotion);
      group.listeners.forEach((listener) => listener(smoothFrame));
    });
    afterListeners.forEach((listener) => listener(frame));
    return needsFrame;
  };

  return { subscribe, subscribeSmooth, subscribeAfterFrame, emit };
};
