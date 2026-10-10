import { TIMELINE } from "@/shared/config";
import { easeInOutCubic, progressIn } from "@/shared/lib/motion";

import type { SceneFrame } from "./sceneFrame";

/**
 * 리포트 지표 막대 i가 찬 정도(0~1, 이징 적용) = E(R(scrollY, top − 0.3H + i·0.06H ~ top + 0.4L + i·0.06H))
 * (L = end − top, `docs/design/spec.md` §5). 섹션 카피 막대와 폰 화면 막대가 같이 쓴다 — 값을 곱하면 scaleX.
 */
export const computeReportBarProgress = (frame: SceneFrame, index: number): number => {
  if (frame.isReducedMotion) return 1;

  const report = frame.sections.find((section) => section.key === "report");
  if (!report) throw new Error("[scroll] section not found: report");

  const { barStartOffsetVh, barStaggerVh, barDurationRatioOfL } = TIMELINE.report;
  const H = frame.layout.viewportHeight;
  const L = report.end - report.top;
  const stagger = index * barStaggerVh * H;
  const start = report.top + barStartOffsetVh * H + stagger;
  const end = report.top + barDurationRatioOfL * L + stagger;
  return easeInOutCubic(progressIn(frame.scrollY, [start, end]));
};
