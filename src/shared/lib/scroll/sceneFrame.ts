import { clamp } from "@/shared/lib/motion";
import type { SectionKey } from "@/shared/config";

import type { SectionFrame, StageLayout } from "./stageLayout";

export type SceneFrame = {
  scrollY: number;
  layout: StageLayout;
  sections: readonly SectionFrame[];
  isReducedMotion: boolean;
  /** 섹션의 스크롤 진행도(0~1). p = (scrollY - top) / (height - 뷰포트높이) */
  progress: (key: SectionKey) => number;
};

/** 스크롤 위치 하나에서 모든 섹션의 진행도를 계산할 수 있는 프레임을 만든다 */
export const createFrame = (
  scrollY: number,
  layout: StageLayout,
  sections: readonly SectionFrame[],
  isReducedMotion: boolean,
): SceneFrame => {
  const progress = (key: SectionKey): number => {
    const section = sections.find((candidate) => candidate.key === key);
    if (!section) return 0;
    const denom = Math.max(section.height - layout.viewportHeight, 1);
    return clamp((scrollY - section.top) / denom);
  };

  return { scrollY, layout, sections, isReducedMotion, progress };
};
