"use client";

import { createContext, useEffect, useRef, type ReactNode } from "react";

import { createFrame, type SceneFrame } from "./sceneFrame";
import { computeStageLayout } from "./stageLayout";
import type { SectionFrame } from "./stageLayout";
import type { SectionKey } from "@/shared/config";

type FrameListener = (frame: SceneFrame) => void;

type ScrollSceneContextValue = {
  subscribe: (listener: FrameListener) => () => void;
};

export const ScrollSceneContext = createContext<ScrollSceneContextValue | null>(
  null,
);

interface ScrollSceneProviderProps {
  children: ReactNode;
}

/** [data-section] 엘리먼트를 측정하고, 스크롤/리사이즈마다 rAF 1회로 구독자에게 SceneFrame을 전달한다 */
export const ScrollSceneProvider = ({ children }: ScrollSceneProviderProps) => {
  const listenersRef = useRef(new Set<FrameListener>());
  const sectionsRef = useRef<SectionFrame[]>([]);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const measure = () => {
      const nodes = document.querySelectorAll<HTMLElement>("[data-section]");
      sectionsRef.current = Array.from(nodes).map((node) => {
        const top = node.offsetTop;
        const height = node.offsetHeight;
        return {
          key: node.dataset.section as SectionKey,
          top,
          height,
          end: top + height,
        };
      });
    };

    const emit = () => {
      rafIdRef.current = null;
      const layout = computeStageLayout(window.innerWidth, window.innerHeight);
      const isReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const frame = createFrame(
        window.scrollY,
        layout,
        sectionsRef.current,
        isReducedMotion,
      );
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
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  const subscribe = (listener: FrameListener) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  };

  return (
    <ScrollSceneContext.Provider value={{ subscribe }}>
      {children}
    </ScrollSceneContext.Provider>
  );
};
