export type Range = readonly [number, number];
export type RgbColor = readonly [number, number, number];

/** 값을 min~max(기본 0~1) 사이로 자른다 */
export const clamp = (value: number, min = 0, max = 1): number =>
  Math.min(max, Math.max(min, value));

/** range 구간 안에서 value의 진행도(0~1)를 구한다 */
export const progressIn = (value: number, range: Range): number => {
  const [start, end] = range;
  if (start === end) return value >= end ? 1 : 0;
  return clamp((value - start) / (end - start));
};

/** a와 b 사이를 t(0~1)만큼 선형 보간한다 */
export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

/** 디자인 원본과 동일한 easeInOutCubic 이징 */
export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;

/** rgb 색상 두 개를 t(0~1)만큼 보간한다(각 채널 반올림) */
export const mixRgb = (a: RgbColor, b: RgbColor, t: number): RgbColor => [
  Math.round(lerp(a[0], b[0], t)),
  Math.round(lerp(a[1], b[1], t)),
  Math.round(lerp(a[2], b[2], t)),
];
