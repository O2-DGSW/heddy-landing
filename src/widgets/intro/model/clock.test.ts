import { describe, expect, it } from "vitest";

import { INTRO } from "@/shared/config";

import { isInScene, loopTime, parseFrozenTime } from "./clock";

describe("parseFrozenTime (?intro-t=초)", () => {
  it("0~45초 숫자만 받는다", () => {
    expect(parseFrozenTime("?intro-t=12.5")).toBe(12.5);
    expect(parseFrozenTime("?intro-t=0")).toBe(0);
    expect(parseFrozenTime("?intro-t=99")).toBeNull();
    expect(parseFrozenTime("?intro-t=abc")).toBeNull();
    expect(parseFrozenTime("")).toBeNull();
  });
});

describe("loopTime", () => {
  it("45초가 지나면 처음부터", () => {
    expect(loopTime(46)).toBeCloseTo(1);
    expect(loopTime(10)).toBe(10);
  });
});

describe("isInScene", () => {
  it("장면 시작은 포함, 끝은 다음 장면", () => {
    expect(isInScene(3.0, INTRO.scenes.s02)).toBe(true);
    expect(isInScene(3.0, INTRO.scenes.s01)).toBe(false);
  });

  it("장면 구간은 0초부터 45초까지 빈틈없이 이어진다", () => {
    const windows = Object.values(INTRO.scenes);
    expect(windows[0][0]).toBe(0);
    expect(windows[windows.length - 1][1]).toBe(INTRO.duration);
    for (let i = 1; i < windows.length; i += 1) expect(windows[i][0]).toBe(windows[i - 1][1]);
    expect(isInScene(45, INTRO.scenes.s15)).toBe(true);
  });
});
