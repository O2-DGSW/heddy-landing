export type Range = readonly [number, number];
export type RgbColor = readonly [number, number, number];

/** 값을 min~max(기본 0~1) 사이로 자른다 */
export const clamp = (value: number, min = 0, max = 1): number => Math.min(max, Math.max(min, value));

/** range 구간 안에서 value의 진행도(0~1)를 구한다 */
export const progressIn = (value: number, range: Range): number => {
  const [start, end] = range;
  if (start === end) return value >= end ? 1 : 0;
  return clamp((value - start) / (end - start));
};

/** a와 b 사이를 t(0~1)만큼 선형 보간한다 */
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** 디자인 원본과 동일한 easeInOutCubic 이징 */
export const easeInOutCubic = (t: number): number => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

/** rgb 색상 두 개를 t(0~1)만큼 보간한다(각 채널 반올림) */
export const mixRgb = (a: RgbColor, b: RgbColor, t: number): RgbColor => [
  Math.round(lerp(a[0], b[0], t)),
  Math.round(lerp(a[1], b[1], t)),
  Math.round(lerp(a[2], b[2], t)),
];

/**
 * current를 target 쪽으로 반감기(halfLifeMs)만큼 지수적으로 따라가게 한다. 프레임 간격(dtMs)이
 * 달라도 같은 시간이면 같은 만큼 움직이므로, 빠른 스크롤을 부드러운 움직임으로 바꿀 때 쓴다.
 */
export const damp = (current: number, target: number, dtMs: number, halfLifeMs: number): number => {
  if (halfLifeMs <= 0) return target;
  return target + (current - target) * Math.pow(0.5, dtMs / halfLifeMs);
};

/**
 * 기준점(xs 오름차순, ys)을 지나는 단조 3차 보간(Fritsch–Carlson). 기준점에서 기울기가 이어지고
 * 기준값 사이를 넘치지 않는다 — 여러 단계를 멈춤 없이 한 곡선으로 이을 때 쓴다. 구간 밖은 끝값.
 */
export const monotoneCubic = (xs: readonly number[], ys: readonly number[]): ((x: number) => number) => {
  const n = xs.length;
  const h = xs.slice(1).map((x, i) => x - xs[i]);
  const delta = h.map((hi, i) => (ys[i + 1] - ys[i]) / hi);
  const m = xs.map((_, i) => {
    if (i === 0) return delta[0];
    if (i === n - 1) return delta[n - 2];
    return delta[i - 1] * delta[i] <= 0 ? 0 : (delta[i - 1] + delta[i]) / 2;
  });
  // 넘침 방지: 구간 기울기 대비 접선이 너무 크면 줄인다
  delta.forEach((d, i) => {
    if (d === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      return;
    }
    const a = m[i] / d;
    const b = m[i + 1] / d;
    const s = a * a + b * b;
    if (s > 9) {
      const tau = 3 / Math.sqrt(s);
      m[i] = tau * a * d;
      m[i + 1] = tau * b * d;
    }
  });

  return (x: number): number => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i += 1;
    const t = (x - xs[i]) / h[i];
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h[i] * m[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h[i] * m[i + 1]
    );
  };
};

/** 사인 easeInOut — easeInOutCubic보다 시작·끝이 덜 느려 스크롤에 바로 반응한다 */
export const easeInOutSine = (t: number): number => (1 - Math.cos(Math.PI * t)) / 2;

/**
 * CSS `cubic-bezier(x1, y1, x2, y2)` 이징. 시간 t(0~1)에 대한 진행(0~1) — x(s) = t인 s를 뉴턴법(안 되면 이분법)으로 찾는다.
 */
export const cubicBezier = (x1: number, y1: number, x2: number, y2: number): ((t: number) => number) => {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (s: number) => ((ax * s + bx) * s + cx) * s;
  const sampleY = (s: number) => ((ay * s + by) * s + cy) * s;
  const slopeX = (s: number) => (3 * ax * s + 2 * bx) * s + cx;
  const solve = (t: number): number => {
    let s = t;
    for (let i = 0; i < 8; i++) {
      const error = sampleX(s) - t;
      if (Math.abs(error) < 1e-6) return s;
      const slope = slopeX(s);
      if (Math.abs(slope) < 1e-6) break;
      s -= error / slope;
    }
    let lo = 0;
    let hi = 1;
    s = t;
    for (let i = 0; i < 40; i++) {
      const x = sampleX(s);
      if (Math.abs(x - t) < 1e-6) return s;
      if (x < t) lo = s;
      else hi = s;
      s = (lo + hi) / 2;
    }
    return s;
  };
  return (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : sampleY(solve(t)));
};
