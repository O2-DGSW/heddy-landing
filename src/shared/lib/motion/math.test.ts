import { describe, expect, it } from "vitest";

import { clamp, easeInOutCubic, lerp, mixRgb, progressIn } from "./math";

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
