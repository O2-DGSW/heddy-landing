import { TIMELINE } from "@/shared/config";
import { easeInOutCubic, progressIn } from "@/shared/lib/motion";
import type { SceneFrame } from "@/shared/lib/scroll";

/**
 * 리포트 지표 막대 i의 scaleX = E(R(scrollY, top − 0.3H + i·0.06H ~ top + 0.4L + i·0.06H)) × 값
 * (L = end − top, `docs/design/spec.md` §5).
 */
export const computeReportBars = (frame: SceneFrame): number[] => {
  const { barStartOffsetVh, barStaggerVh, barDurationRatioOfL, barValues } = TIMELINE.report;
  if (frame.isReducedMotion) return [...barValues];

  const report = frame.sections.find((section) => section.key === "report");
  if (!report) throw new Error("[section-report] section not found: report");

  const H = frame.layout.viewportHeight;
  const L = report.end - report.top;

  return barValues.map((value, i) => {
    const stagger = i * barStaggerVh * H;
    const start = report.top + barStartOffsetVh * H + stagger;
    const end = report.top + barDurationRatioOfL * L + stagger;
    return easeInOutCubic(progressIn(frame.scrollY, [start, end])) * value;
  });
};
