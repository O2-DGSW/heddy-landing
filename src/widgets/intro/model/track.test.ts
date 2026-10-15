import { describe, expect, it } from "vitest";

import { EASE, pop, seg, track, valueAt } from "./track";

describe("EASE (HTML 원본 이징: out3 · out5 · inOut3 · inOut5 · in3 · linear)", () => {
  it("모든 이징은 0에서 0, 1에서 1", () => {
    for (const fn of Object.values(EASE)) {
      expect(fn(0)).toBeCloseTo(0);
      expect(fn(1)).toBeCloseTo(1);
    }
  });

  it("out은 처음에 빠르고(가운데에서 절반을 넘음), in은 처음에 느리다", () => {
    expect(EASE.out(0.5)).toBeGreaterThan(0.5);
    expect(EASE.out5(0.5)).toBeGreaterThan(EASE.out(0.5));
    expect(EASE.inn(0.5)).toBeLessThan(0.5);
    expect(EASE.io(0.5)).toBeCloseTo(0.5);
  });
});

describe("track · valueAt (AE 키프레임처럼 구간을 이어 붙인 값)", () => {
  const tr = track(seg(1, 0, 2, 10, "lin"), seg(3, 10, 4, 0, "lin"));

  it("첫 구간 전엔 첫 값, 마지막 구간 뒤엔 마지막 값을 유지한다", () => {
    expect(valueAt(tr, 0)).toBe(0);
    expect(valueAt(tr, 9)).toBe(0);
  });

  it("구간 안에선 이징으로 보간하고, 구간 사이에선 앞 구간 끝값을 유지한다", () => {
    expect(valueAt(tr, 1.5)).toBeCloseTo(5);
    expect(valueAt(tr, 2.5)).toBe(10);
    expect(valueAt(tr, 3.5)).toBeCloseTo(5);
  });

  it("구간이 없으면 기본값", () => {
    expect(valueAt(track(), 1, 7)).toBe(7);
  });
});

describe("pop (outBack 근사: 목표를 살짝 넘었다 돌아온다)", () => {
  it("62% 지점에서 목표보다 10% 더 가고 끝에선 목표", () => {
    const tr = track(...pop(0, 0, 1, 100));
    expect(valueAt(tr, 0.62)).toBeCloseTo(110);
    expect(valueAt(tr, 1)).toBeCloseTo(100);
    expect(valueAt(tr, 0)).toBe(0);
  });
});
