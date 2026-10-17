import { clamp } from "@/shared/lib/motion";
import type { SectionKey } from "@/shared/config";

import type { SectionFrame, StageLayout } from "./stageLayout";

export type SceneFrame = {
  scrollY: number;
  /** 지금까지 본 가장 아래 위치(이슈 #89) — 다시 올라와도 줄지 않는다 */
  seenScrollY: number;
  layout: StageLayout;
  sections: readonly SectionFrame[];
  isReducedMotion: boolean;
  /**
   * 섹션 모션을 계산할 위치: 섹션이 화면에 보이면 본 가장 아래 위치, 아직 화면 아래면 지금 위치.
   * 이미 본 모션은 다시 올라와도 역재생하지 않고 결과로 남는다(이슈 #89)
   */
  sceneY: (key: SectionKey) => number;
  /** 섹션의 스크롤 진행도(0~1). p = (sceneY - top) / (height - 뷰포트높이) */
  progress: (key: SectionKey) => number;
};

/** 스크롤 위치 하나에서 모든 섹션의 진행도를 계산할 수 있는 프레임을 만든다 */
export const createFrame = (
  scrollY: number,
  layout: StageLayout,
  sections: readonly SectionFrame[],
  isReducedMotion: boolean,
  seen: number = scrollY,
): SceneFrame => {
  const seenScrollY = Math.max(scrollY, seen);
  const find = (key: SectionKey) => sections.find((candidate) => candidate.key === key);

  const sceneY = (key: SectionKey): number => {
    const section = find(key);
    if (!section || scrollY <= section.top - layout.viewportHeight) return scrollY;
    return seenScrollY;
  };

  const progress = (key: SectionKey): number => {
    const section = find(key);
    if (!section) return 0;
    const denom = Math.max(section.height - layout.viewportHeight, 1);
    return clamp((sceneY(key) - section.top) / denom);
  };

  return { scrollY, seenScrollY, layout, sections, isReducedMotion, sceneY, progress };
};
