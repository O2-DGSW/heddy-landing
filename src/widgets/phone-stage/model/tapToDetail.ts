import { TIMELINE } from "@/shared/config";
import { easeInOutCubic, progressIn } from "@/shared/lib/motion";
import type { SceneFrame } from "@/shared/lib/scroll";

export type TapToDetail = {
  /** 맨 위 카드가 눌린 정도(0 → 1 → 0) */
  press: number;
  /** 탭 물결 진행도(0이면 없음) */
  ripple: number;
  /** 상세 화면이 오른쪽에서 들어온 정도(0~1, 이징 적용) */
  push: number;
};

/**
 * 3D 폰에서 기록 리스트 → 상세 화면: 맨 위 카드(최신 기록 = 상세 화면의 그 기록)를 눌렀다 떼고,
 * 상세 화면이 오른쪽에서 밀려 들어온다(`docs/plans/0005`). record 섹션 end 기준 구간.
 */
export const computeTapToDetail = (frame: SceneFrame): TapToDetail => {
  if (frame.isReducedMotion) return { press: 0, ripple: 0, push: 1 };

  const record = frame.sections.find((section) => section.key === "record");
  if (!record) throw new Error("[phone-stage] section not found: record");

  const vh = frame.layout.viewportHeight;
  const { tapBand, pushBand } = TIMELINE.report;
  const tap = progressIn(frame.scrollY, [record.end + tapBand[0] * vh, record.end + tapBand[1] * vh]);
  const push = progressIn(frame.scrollY, [record.end + pushBand[0] * vh, record.end + pushBand[1] * vh]);

  const isTapping = tap > 0 && tap < 1;
  return {
    press: isTapping ? Math.sin(Math.PI * tap) : 0,
    ripple: isTapping ? tap : 0,
    push: easeInOutCubic(push),
  };
};
