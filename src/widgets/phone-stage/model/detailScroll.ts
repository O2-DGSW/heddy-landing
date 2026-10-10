import { DETAIL_SCREEN, TIMELINE } from "@/shared/config";
import { progressIn } from "@/shared/lib/motion";
import { computeReportBarProgress, type SceneFrame } from "@/shared/lib/scroll";

type ScreenSize = { width: number; height: number };
type DetailImage = typeof DETAIL_SCREEN;

/**
 * 본문이 올라갈 수 있는 최대 거리(화면 px). 이미지를 화면 폭에 맞춰 줄였을 때
 * "본문 높이 − (화면 높이 − 상단·하단 고정 높이)" — 끝에서 본문 바닥이 탭바 바로 위에 온다.
 */
export const detailScrollRangePx = (screen: ScreenSize, image: DetailImage): number => {
  const scale = screen.width / image.imageWidthPx;
  const window = screen.height - (image.fixedTopPx + image.fixedBottomPx) * scale;
  return Math.max(0, image.bodyHeightPx * scale - window);
};

/**
 * 리포트 구간 폰 안 스크롤(`docs/plans/0005`). 손가락으로 스크롤하는 느낌이 나도록 선형으로 움직인다.
 */
export const computeDetailScroll = (
  frame: SceneFrame,
  screen: ScreenSize,
): { progress: number; offsetPx: number } => {
  if (frame.isReducedMotion) return { progress: 0, offsetPx: 0 };
  const progress = progressIn(frame.progress("report"), TIMELINE.report.detailScroll);
  return { progress, offsetPx: progress * detailScrollRangePx(screen, DETAIL_SCREEN) };
};

/**
 * 본문 속 "상태 지표" 막대 i의 scaleX = 섹션 카피 막대와 같은 찬 정도(`computeReportBarProgress`) × 점수.
 * 섹션 막대와 같은 순간·같은 시차로 움직인다(2026-10-10 결정 — 아래 막대는 화면 밖에서 차 있을 수 있다).
 */
export const computeDetailBars = (frame: SceneFrame): number[] =>
  DETAIL_SCREEN.bars.scores.map((score, i) => computeReportBarProgress(frame, i) * score);
