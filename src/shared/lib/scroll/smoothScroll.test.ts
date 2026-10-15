import { describe, expect, it } from "vitest";

import { SCROLL_STOP, SMOOTH_SCROLL } from "@/shared/config";

import {
  addScrollTarget,
  firstStopCrossed,
  isStopReleased,
  scrollStopsPx,
  stepSmoothScroll,
  wheelDeltaPx,
} from "./smoothScroll";

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

describe("firstStopCrossed (스크롤 멈춤 지점, 팀 피드백 2026-10-14)", () => {
  const stops = [1000, 2000, 3000];

  it("내려갈 때 지나는 첫 멈춤 지점을 준다(출발 지점은 빼고 도착 지점은 넣는다)", () => {
    expect(firstStopCrossed(900, 2500, stops)).toBe(1000);
    expect(firstStopCrossed(1000, 1500, stops)).toBeNull();
    expect(firstStopCrossed(1500, 2000, stops)).toBe(2000);
  });

  it("올라갈 때도 지나는 첫 멈춤 지점(가장 가까운 위쪽)을 준다", () => {
    expect(firstStopCrossed(2500, 900, stops)).toBe(2000);
    expect(firstStopCrossed(2000, 1500, stops)).toBeNull();
  });
});

describe("scrollStopsPx", () => {
  it("섹션 진행도로 적은 멈춤 지점을 페이지 px로 바꾸고, 숨은 섹션(높이 0)은 뺀다", () => {
    const sections = [
      { key: "hero", top: 0, height: 900, end: 900 },
      { key: "archive", top: 900, height: 1980, end: 2880 },
      { key: "record", top: 2880, height: 0, end: 2880 },
    ] as const;
    const stops = scrollStopsPx(
      [
        ["archive", 0],
        ["archive", 0.5],
        ["record", 0],
      ],
      sections,
      900,
    );
    expect(stops).toEqual([900, 900 + 0.5 * (1980 - 900)]);
  });
});

describe("isStopReleased (멈춘 뒤 풀리는 조건)", () => {
  const { minHoldMs, quietMs, maxHoldMs } = SCROLL_STOP;

  it("멈춤 지점에 닿기 전엔 풀리지 않는다", () => {
    expect(isStopReleased({ now: 5000, arrivedAt: null, lastWheelAt: 0, absorbedPx: 0 }, 900)).toBe(false);
  });

  it("닿고 나서 잠깐(minHoldMs) 머물고, 휠이 멈춘 뒤(quietMs) 다음 휠에서 풀린다", () => {
    const base = { arrivedAt: 1000, lastWheelAt: 1000, absorbedPx: 0 };
    expect(isStopReleased({ ...base, now: 1000 + minHoldMs - 1 }, 900)).toBe(false);
    expect(isStopReleased({ ...base, now: 1000 + Math.max(minHoldMs, quietMs) }, 900)).toBe(true);
  });

  it("트랙패드처럼 휠이 쉬지 않고 들어와도 maxHoldMs(1초 이하)가 지나면 풀린다 — AR에서 막히던 버그", () => {
    expect(maxHoldMs).toBeLessThanOrEqual(1000);
    const hold = { arrivedAt: 1000, absorbedPx: 0 };
    expect(
      isStopReleased({ ...hold, lastWheelAt: 1000 + maxHoldMs - 10, now: 1000 + maxHoldMs - 1 }, 900),
    ).toBe(false);
    expect(isStopReleased({ ...hold, lastWheelAt: 1000 + maxHoldMs, now: 1000 + maxHoldMs }, 900)).toBe(true);
  });

  it("세게 굴리면 흡수한 휠이 뷰포트 비율(0.5 이하)을 넘는 순간 풀린다", () => {
    expect(SCROLL_STOP.maxAbsorbOfViewport).toBeLessThanOrEqual(0.5);
    const absorbedPx = SCROLL_STOP.maxAbsorbOfViewport * 900 + 1;
    expect(isStopReleased({ now: 1010, arrivedAt: 1000, lastWheelAt: 1005, absorbedPx }, 900)).toBe(true);
  });
});

describe("SCROLL_STOP 지점", () => {
  it("멈춤 지점끼리는 섹션 진행도로 0.15 넘게 떨어져 있다(한 섹션에 몰리지 않게)", () => {
    const bySection = new Map<string, number[]>();
    for (const [key, p] of SCROLL_STOP.points) bySection.set(key, [...(bySection.get(key) ?? []), p]);
    for (const list of bySection.values()) {
      const sorted = [...list].sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i += 1) expect(sorted[i] - sorted[i - 1]).toBeGreaterThan(0.15);
    }
  });
});
