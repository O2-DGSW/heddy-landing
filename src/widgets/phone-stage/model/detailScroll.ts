import { DETAIL_SCREEN, TIMELINE } from "@/shared/config";
import { easeInOutCubic, progressIn } from "@/shared/lib/motion";
import type { SceneFrame } from "@/shared/lib/scroll";

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
 * 본문 속 "상태 지표" 막대 채움(0~1). 막대가 창 아래에서 올라와 보이기 시작하는 진행도부터
 * `detailBarFillSpan` 동안 이징으로 찬다 — 첫 막대는 본문 스크롤 시작과 함께, 아래 막대는 올라올 때 찬다.
 */
export const computeDetailBars = (frame: SceneFrame, screen: ScreenSize): number[] => {
  const { centerY, height } = DETAIL_SCREEN.bars;
  if (frame.isReducedMotion) return centerY.map(() => 1);

  const { progress } = computeDetailScroll(frame, screen);
  const range = detailScrollRangePx(screen, DETAIL_SCREEN);
  const scale = screen.width / DETAIL_SCREEN.imageWidthPx;
  const window = screen.height - (DETAIL_SCREEN.fixedTopPx + DETAIL_SCREEN.fixedBottomPx) * scale;
  const { detailBarRevealPx, detailBarFillSpan } = TIMELINE.report;

  return centerY.map((y) => {
    const bottom = (y + height / 2) * scale;
    const start = range > 0 ? Math.min(1, Math.max(0, (bottom + detailBarRevealPx - window) / range)) : 0;
    if (progress <= start) return 0;
    return easeInOutCubic(progressIn(progress, [start, start + detailBarFillSpan]));
  });
};
