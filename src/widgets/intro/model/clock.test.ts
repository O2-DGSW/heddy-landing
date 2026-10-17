import { describe, expect, it } from "vitest";

import { INTRO } from "@/shared/config";

import { introSceneTime, isInScene, loopTime, parseFrozenTime, REDUCED_MOTION_TIME } from "./clock";

describe("parseFrozenTime (?intro-t=초)", () => {
  it("0~48.91초 숫자만 받는다", () => {
    expect(parseFrozenTime("?intro-t=12.5")).toBe(12.5);
    expect(parseFrozenTime("?intro-t=0")).toBe(0);
    expect(parseFrozenTime("?intro-t=48")).toBe(48);
    expect(parseFrozenTime("?intro-t=99")).toBeNull();
    expect(parseFrozenTime("?intro-t=abc")).toBeNull();
    expect(parseFrozenTime("")).toBeNull();
  });
});

describe("loopTime", () => {
  it("48.91초(v16 영상 길이)가 지나면 처음부터", () => {
    expect(INTRO.duration).toBe(48.91);
    expect(loopTime(49.91)).toBeCloseTo(1);
    expect(loopTime(10)).toBe(10);
  });
});

describe("isInScene", () => {
  it("장면 시작은 포함, 끝은 다음 장면", () => {
    expect(isInScene(2.75, INTRO.scenes.s02)).toBe(true);
    expect(isInScene(2.75, INTRO.scenes.s01)).toBe(false);
  });

  it("장면 구간(화면 시각)은 0초부터 끝까지 빈틈없이 이어진다", () => {
    const windows = Object.values(INTRO.scenes);
    expect(windows[0][0]).toBe(0);
    expect(windows[windows.length - 1][1]).toBe(INTRO.duration);
    for (let i = 1; i < windows.length; i += 1) expect(windows[i][0]).toBe(windows[i - 1][1]);
    expect(isInScene(INTRO.duration, INTRO.scenes.s15)).toBe(true);
  });

  it("시간 재배치 표의 처음·끝 화면 시각이 장면 구간과 같다", () => {
    for (const [key, window] of Object.entries(INTRO.scenes)) {
      const knots = INTRO.warp[key];
      expect(knots[0][0]).toBe(window[0]);
      expect(knots[knots.length - 1][0]).toBe(window[1]);
    }
  });
});

describe("introSceneTime (화면 시각 → 장면 원래 시각, v16 WARP)", () => {
  it("기준점에서는 표의 원래 시각", () => {
    expect(introSceneTime("s02", 2.75)).toBeCloseTo(3.0);
    expect(introSceneTime("s02", 3.95)).toBeCloseTo(4.6);
    expect(introSceneTime("s04", 8.9)).toBeCloseTo(9.0);
    expect(introSceneTime("s04", 13.6)).toBeCloseTo(11.6);
    expect(introSceneTime("s15", 48.91)).toBeCloseTo(46.71);
  });

  it("기준점 사이는 직선(S04 뒷부분은 4.7초를 2.6초로 천천히)", () => {
    expect(introSceneTime("s04", (8.9 + 13.6) / 2)).toBeCloseTo((9.0 + 11.6) / 2);
  });

  it("위치만 옮긴 장면은 그대로 밀린다(S07 +0.1초 앞, S13 1.8초 앞)", () => {
    expect(introSceneTime("s07", 19)).toBeCloseTo(18.9);
    expect(introSceneTime("s13", 36)).toBeCloseTo(34.2);
  });

  it("구간 밖은 끝 기준점으로 고정", () => {
    expect(introSceneTime("s01", -1)).toBe(0);
    expect(introSceneTime("s15", 60)).toBeCloseTo(46.71);
  });
});

describe("REDUCED_MOTION_TIME", () => {
  it("S14 문구가 다 나온 화면 시각(S14 구간 안)", () => {
    expect(isInScene(REDUCED_MOTION_TIME, INTRO.scenes.s14)).toBe(true);
    // 마지막 글자 원래 시각 38.05 + 11 × 0.13 + 0.3 = 39.78 → 화면 시각 41.98 이후
    expect(introSceneTime("s14", REDUCED_MOTION_TIME)).toBeGreaterThan(39.78);
  });
});
