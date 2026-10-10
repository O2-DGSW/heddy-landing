import { TIMELINE } from "@/shared/config";
import { computeReportBarProgress, type SceneFrame } from "@/shared/lib/scroll";

/** 리포트 섹션 카피 막대 i의 scaleX = 찬 정도 × 값 (`computeReportBarProgress`) */
export const computeReportBars = (frame: SceneFrame): number[] =>
  TIMELINE.report.barValues.map((value, i) => computeReportBarProgress(frame, i) * value);
