import { AR_PANEL, TIMELINE } from "@/shared/config";
import { easeInOutCubic, easeInOutSine, monotoneCubic, progressIn } from "@/shared/lib/motion";
import type { SceneFrame } from "@/shared/lib/scroll";

export type ArScene = {
  /** 데스크톱은 세로 pill(문구 좌우), 모바일은 가로 pill(문구 위아래) */
  isVertical: boolean;
  pill: { width: number; height: number; radius: number; opacity: number };
  /** 다크 패널이 화면을 덮은 정도(c 단계 진행도) */
  panel: number;
  /** 화면 중심에서 분할 문구 안쪽 가장자리까지 거리(px) */
  splitOffset: number;
  panelCopy: { opacity: number; y: number };
  copy: { opacity: number; y: number };
};

/**
 * AR 섹션: "거울 앞에 | 앉기 전에" 사이 pill이 한 곡선으로 커져 화면을 덮고(다크 패널), 패널 문구가
 * 나왔다 사라진 뒤 카피가 들어온다(`docs/design/spec.md` §5 ar, `docs/plans/0008`).
 */
export const computeArScene = (frame: SceneFrame): ArScene => {
  const { viewportWidth: W, viewportHeight: H, isMobile } = frame.layout;
  const isVertical = !isMobile;
  const full = { cross: isVertical ? W : H, main: isVertical ? H : W };
  const b = isVertical
    ? { cross: AR_PANEL.pillB.desktop.crossOfWidth * W, main: AR_PANEL.pillB.desktop.mainOfHeight * H }
    : { cross: AR_PANEL.pillB.mobile.crossOfHeight * H, main: AR_PANEL.pillB.mobile.mainOfWidth * W };

  const p = frame.isReducedMotion ? 1 : frame.progress("ar");
  const ar = TIMELINE.ar;
  // 시작 → a → b → 전체를 한 곡선으로 잇는다(이슈 #43). 크기는 로그 스케일로 보간해 작을 땐 천천히,
  // 커질수록 빠르게 — 단계 사이에서 멈추지 않는다
  const t = easeInOutSine(progressIn(p, ar.pillMorph));
  const sizeAt = (values: readonly number[]) => Math.exp(monotoneCubic(ar.pillKnots, values.map(Math.log))(t));
  const cross = sizeAt([AR_PANEL.pillStart.cross, AR_PANEL.pillA.cross, b.cross, full.cross]);
  const main = sizeAt([AR_PANEL.pillStart.main, AR_PANEL.pillA.main, b.main, full.main]);
  const width = isVertical ? cross : main;
  const height = isVertical ? main : cross;
  // 작을 땐 알약, 커지면 둥근 사각형(반지름 상한) — 마지막 구간(b → 전체)에서 모서리가 각지며 화면을 덮는다
  const c = easeInOutCubic(progressIn(t, [ar.pillKnots[2], 1]));
  const radius = Math.min(Math.min(width, height) / 2, AR_PANEL.maxRadius) * (1 - c);

  const panelIn = easeInOutCubic(progressIn(p, ar.panelCopyIn));
  const panelOut = progressIn(p, ar.panelCopyOut);
  const copyIn = easeInOutCubic(progressIn(p, ar.copyIn));

  if (frame.isReducedMotion) {
    return {
      isVertical,
      pill: { width, height, radius, opacity: 1 },
      panel: 1,
      splitOffset: (isVertical ? width : height) / 2 + AR_PANEL.splitGap,
      panelCopy: { opacity: 0, y: 0 },
      copy: { opacity: 1, y: 0 },
    };
  }

  return {
    isVertical,
    pill: { width, height, radius, opacity: progressIn(p, ar.pillFadeIn) },
    panel: c,
    splitOffset: (isVertical ? width : height) / 2 + AR_PANEL.splitGap,
    panelCopy: { opacity: panelIn * (1 - panelOut), y: (1 - panelIn) * AR_PANEL.panelCopyRisePx },
    copy: { opacity: copyIn, y: (1 - copyIn) * AR_PANEL.copyRisePx },
  };
};
