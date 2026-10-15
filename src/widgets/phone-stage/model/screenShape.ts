/** 모서리 한 개를 그리는 분할 수 */
const CORNER_STEPS = 24;

type Point = readonly [number, number];

/**
 * 슈퍼타원 모서리의 둥근 사각형(스쿼클) 윤곽 점. 3D 폰 화면은 원·타원이 아니라 곡률이 매끄럽게 바뀌는 모서리라
 * CSS border-radius로는 맞지 않는다(2026-10-15, 모서리가 베젤 밖으로 뾰족하게 튀어나와 보였다).
 * 지수 2면 원 모서리, 클수록 각진다.
 * 시계 방향(오른쪽 위 → 오른쪽 아래 → 왼쪽 아래 → 왼쪽 위), 화면 좌상단 원점.
 */
export const squirclePoints = (width: number, height: number, radius: number, exponent: number): Point[] => {
  const w = width;
  const h = height;
  const r = radius;
  const curve = (i: number) => {
    const t = (Math.PI / 2) * (i / CORNER_STEPS);
    // 끝점은 정확히 변 위에 놓이게(cos(π/2)가 0이 아닌 오차 제거)
    const u = i === CORNER_STEPS ? 0 : Math.cos(t) ** (2 / exponent);
    const v = i === 0 ? 0 : Math.sin(t) ** (2 / exponent);
    return { u, v };
  };
  const points: Point[] = [];
  const push = (x: number, y: number) => points.push([x, y]);
  for (let i = 0; i <= CORNER_STEPS; i += 1) {
    const { u, v } = curve(i);
    push(w - r + r * v, r - r * u);
  }
  for (let i = 0; i <= CORNER_STEPS; i += 1) {
    const { u, v } = curve(i);
    push(w - r + r * u, h - r + r * v);
  }
  for (let i = 0; i <= CORNER_STEPS; i += 1) {
    const { u, v } = curve(i);
    push(r - r * v, h - r + r * u);
  }
  for (let i = 0; i <= CORNER_STEPS; i += 1) {
    const { u, v } = curve(i);
    push(r - r * u, r - r * v);
  }
  return points;
};

/** `squirclePoints`를 CSS `clip-path: path()`에 넣을 경로 문자열로 */
export const squirclePath = (width: number, height: number, radius: number, exponent: number): string => {
  const points = squirclePoints(width, height, radius, exponent);
  return `M ${points.map(([x, y]) => `${Math.round(x * 100) / 100} ${Math.round(y * 100) / 100}`).join(" L ")} Z`;
};
