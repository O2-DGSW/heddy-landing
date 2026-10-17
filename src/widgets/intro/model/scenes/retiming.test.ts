import { describe, expect, it } from "vitest";

import { s13, s14 } from "./ending";
import { s12 } from "./features";
import { s01, s02, s04 } from "./opening";
import { S7_LAND, s07 } from "./records";

/** v16(내레이션 기준) 키트의 장면 안 강조 시각 — 모두 장면 원래 시각(이슈 #96) */
describe("v16 장면 안 시각", () => {
  it("S01 단어 타이핑 시각 0.34 / 0.54 / 0.82 / 1.46 / 1.70 / 2.02", () => {
    const times = [0.34, 0.54, 0.82, 1.46, 1.7, 2.02];
    times.forEach((t0, i) => {
      expect(s01(t0 - 0.01).words[i].opacity).toBe(0);
      expect(s01(t0 + 0.35).words[i].opacity).toBeCloseTo(100);
    });
  });

  it("S02 '하나면 충분'은 4.887~5.05초에 진한 글자로 바뀐다", () => {
    expect(s02(4.88).tailInk).toBe(0);
    expect(s02(5.05).tailInk).toBeCloseTo(100);
  });

  it("S04 라벨 강조는 8.9 / 9.686 / 10.2 / 10.897초", () => {
    [8.9, 9.686, 10.2, 10.897].forEach((hl, i) => {
      expect(s04(hl).every((item, k) => k !== i || item.strong.opacity === 0)).toBe(true);
      expect(s04(hl + 0.1)[i].strong.opacity).toBeCloseTo(100);
    });
  });

  it("S07 마지막 문구는 마지막 카드 착지 1.4초 뒤", () => {
    const t0 = S7_LAND[11] + 1.4;
    expect(s07(t0 - 0.01).explain.opacity).toBe(0);
    expect(s07(t0 + 0.5).explain.opacity).toBeCloseTo(100);
  });

  it("S12 '다음 스타일 추천'은 32.33초", () => {
    expect(s12(32.32).title.opacity).toBe(0);
    expect(s12(32.33 + 0.6).title.opacity).toBeCloseTo(100);
  });

  it("S13 둘째 줄은 35.89초", () => {
    expect(s13(35.88).line2.opacity).toBe(0);
    expect(s13(36.29).line2.opacity).toBeCloseTo(100);
    expect(s13(36.39).line2.y).toBeCloseTo(0);
  });

  it("S14 둘째 줄 글자는 38.05초부터 0.13초 간격", () => {
    const chars = s14(38.04).chars;
    expect(chars[0].opacity).toBe(0);
    expect(s14(38.05 + 0.3).chars[0].opacity).toBeCloseTo(100);
    expect(s14(38.05 + 0.13 - 0.01).chars[1].opacity).toBe(0);
  });
});
