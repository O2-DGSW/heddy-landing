import { describe, expect, it } from "vitest";

import {
  clamp,
  cubicBezier,
  damp,
  easeInOutCubic,
  easeInOutSine,
  lerp,
  mixRgb,
  monotoneCubic,
  progressIn,
} from "./math";

describe("clamp", () => {
  it("범위 안 값은 그대로 반환한다", () => {
    expect(clamp(0.5)).toBe(0.5);
  });
  it("범위를 벗어나면 경계값으로 자른다", () => {
    expect(clamp(-1)).toBe(0);
    expect(clamp(2)).toBe(1);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe("progressIn", () => {
  it("구간 시작 이전은 0, 끝 이후는 1이다", () => {
    expect(progressIn(0, [10, 20])).toBe(0);
    expect(progressIn(30, [10, 20])).toBe(1);
  });
  it("구간 중간은 선형 비율이다", () => {
    expect(progressIn(15, [10, 20])).toBeCloseTo(0.5);
  });
  it("start와 end가 같으면 0 또는 1만 반환한다", () => {
    expect(progressIn(5, [10, 10])).toBe(0);
    expect(progressIn(10, [10, 10])).toBe(1);
  });
});

describe("lerp", () => {
  it("t=0이면 a, t=1이면 b를 반환한다", () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
  });
  it("t=0.5면 중간값이다", () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
  });
});

describe("easeInOutCubic", () => {
  it("경계값은 그대로 유지된다", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
  });
  it("t=0.5는 0.5다", () => {
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5);
  });
  it("전반부는 4t³ 공식과 같다", () => {
    expect(easeInOutCubic(0.25)).toBeCloseTo(4 * 0.25 ** 3);
  });
});

describe("mixRgb", () => {
  it("t=0이면 첫 색, t=1이면 두번째 색이다", () => {
    expect(mixRgb([0, 0, 0], [100, 200, 255], 0)).toEqual([0, 0, 0]);
    expect(mixRgb([0, 0, 0], [100, 200, 255], 1)).toEqual([100, 200, 255]);
  });
  it("중간값은 반올림된 평균이다", () => {
    expect(mixRgb([0, 0, 0], [10, 10, 11], 0.5)).toEqual([5, 5, 6]);
  });
});

describe("damp", () => {
  it("반감기만큼 지나면 남은 거리가 절반이 된다", () => {
    expect(damp(0, 100, 90, 90)).toBeCloseTo(50);
  });
  it("프레임을 나눠도 같은 시간이면 같은 결과다", () => {
    const once = damp(0, 100, 32, 90);
    const twice = damp(damp(0, 100, 16, 90), 100, 16, 90);
    expect(twice).toBeCloseTo(once);
  });
  it("반감기가 0이면 바로 목표값이다", () => {
    expect(damp(0, 100, 16, 0)).toBe(100);
  });
});

describe("monotoneCubic", () => {
  const xs = [0, 0.3, 0.8, 1];
  const ys = [1, 2, 10, 11];
  const f = monotoneCubic(xs, ys);

  it("기준점을 그대로 지난다", () => {
    xs.forEach((x, i) => expect(f(x)).toBeCloseTo(ys[i]));
  });
  it("기준점이 늘어나기만 하면 사이도 줄지 않는다(넘치지 않음)", () => {
    let prev = f(0);
    for (let x = 0.01; x <= 1; x += 0.01) {
      const y = f(x);
      expect(y).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = y;
    }
  });
  it("구간 밖은 끝값으로 자른다", () => {
    expect(f(-1)).toBe(1);
    expect(f(2)).toBe(11);
  });
  it("기준점에서 기울기가 끊기지 않는다(양쪽 기울기가 같다)", () => {
    const h = 1e-5;
    const left = (f(0.3) - f(0.3 - h)) / h;
    const right = (f(0.3 + h) - f(0.3)) / h;
    expect(right).toBeCloseTo(left, 2);
  });
});

describe("easeInOutSine", () => {
  it("0 → 0, 0.5 → 0.5, 1 → 1", () => {
    expect(easeInOutSine(0)).toBeCloseTo(0);
    expect(easeInOutSine(0.5)).toBeCloseTo(0.5);
    expect(easeInOutSine(1)).toBeCloseTo(1);
  });
  it("시작이 easeInOutCubic보다 빨리 반응한다", () => {
    expect(easeInOutSine(0.1)).toBeGreaterThan(easeInOutCubic(0.1));
  });
});

describe("cubicBezier (CSS cubic-bezier)", () => {
  it("배민 화면 이동 곡선(0.4, 0, 0.2, 1): 끝점이 맞고 앞쪽에서 빠르게 가다 길게 감속한다", () => {
    const ease = cubicBezier(0.4, 0, 0.2, 1);
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    // 배민 측정(0.9초 기준): 35% ≈ 51%, 57% ≈ 82%, 79% ≈ 96%
    expect(ease(0.35)).toBeGreaterThan(0.45);
    expect(ease(0.35)).toBeLessThan(0.62);
    expect(ease(0.57)).toBeGreaterThan(0.78);
    expect(ease(0.79)).toBeGreaterThan(0.93);
  });

  it("직선(0, 0, 1, 1)은 그대로", () => {
    const linear = cubicBezier(0, 0, 1, 1);
    for (const t of [0.1, 0.5, 0.9]) expect(linear(t)).toBeCloseTo(t, 4);
  });
});
