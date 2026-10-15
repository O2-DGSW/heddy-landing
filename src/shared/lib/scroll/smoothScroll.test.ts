import { describe, expect, it } from "vitest";

import { SMOOTH_SCROLL } from "@/shared/config";

import { addScrollTarget, stepSmoothScroll, wheelDeltaPx } from "./smoothScroll";

describe("wheelDeltaPx", () => {
  it("픽셀 단위는 그대로, 줄 단위는 16px, 페이지 단위는 뷰포트 높이로 바꾼다", () => {
    expect(wheelDeltaPx({ deltaY: 100, deltaMode: 0 }, 800)).toBe(100);
    expect(wheelDeltaPx({ deltaY: 3, deltaMode: 1 }, 800)).toBe(48);
    expect(wheelDeltaPx({ deltaY: 1, deltaMode: 2 }, 800)).toBe(800);
  });
});

describe("addScrollTarget", () => {
  it("휠 양을 목표에 더하되 0 ~ 최대 스크롤 안으로 자른다", () => {
    expect(addScrollTarget(500, 120, 2000)).toBe(620);
    expect(addScrollTarget(50, -120, 2000)).toBe(0);
    expect(addScrollTarget(1950, 120, 2000)).toBe(2000);
  });
});

describe("stepSmoothScroll", () => {
  it("한 번에 점프하지 않고 반감기만큼 지나면 남은 거리가 절반이 된다", () => {
    const step = stepSmoothScroll(0, 200, SMOOTH_SCROLL.halfLifeMs);
    expect(step.current).toBeCloseTo(100);
    expect(step.isDone).toBe(false);
  });

  it("짧은 프레임엔 조금만 움직인다(첫 프레임부터 끝까지 가지 않는다)", () => {
    const step = stepSmoothScroll(0, 200, 16);
    expect(step.current).toBeGreaterThan(0);
    expect(step.current).toBeLessThan(40);
  });

  it("거의 다 왔으면 목표에 붙이고 멈춘다", () => {
    const step = stepSmoothScroll(199.8, 200, 16);
    expect(step).toEqual({ current: 200, isDone: true });
  });
});
