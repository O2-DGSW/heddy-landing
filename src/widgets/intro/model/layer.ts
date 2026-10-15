/**
 * After Effects 레이어 하나의 한 순간 상태(원본 단위 그대로: 위치 px, 크기 %, 불투명도 0~100, 흐림 AE 값).
 * 위치(x, y)는 기준점(anchor)이 놓이는 자리이고, 크기·회전은 기준점을 중심으로 한다 — AE와 같다.
 */
export type LayerState = {
  x: number;
  y: number;
  /** 가로·세로 크기(%) — 하나만 주면 둘 다 */
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  rotate?: number;
  /** 0~100 */
  opacity?: number;
  /** AE Gaussian Blur 흐림 값 */
  blur?: number;
};

/** AE 흐림 값 → CSS blur 반경(px). AE 흐림은 대략 CSS 표준편차의 두 배 */
const BLUR_RATIO = 0.5;

/** CSS transform 문자열(무대 px) */
export const layerTransform = (state: LayerState): string => {
  const sx = (state.scaleX ?? state.scale ?? 100) / 100;
  const sy = (state.scaleY ?? state.scale ?? 100) / 100;
  const rotate = state.rotate ? ` rotate(${state.rotate}deg)` : "";
  return `translate(${state.x}px, ${state.y}px)${rotate} scale(${sx}, ${sy})`;
};

export const layerOpacity = (state: LayerState): string => String((state.opacity ?? 100) / 100);

export const layerFilter = (state: LayerState): string =>
  state.blur && state.blur > 0.01 ? `blur(${state.blur * BLUR_RATIO}px)` : "none";

/** 엘리먼트에 레이어 상태를 쓴다(프레임마다 ref로만) */
export const applyLayer = (el: HTMLElement | SVGElement | null, state: LayerState): void => {
  if (!el) return;
  el.style.transform = layerTransform(state);
  el.style.opacity = layerOpacity(state);
  el.style.filter = layerFilter(state);
};
