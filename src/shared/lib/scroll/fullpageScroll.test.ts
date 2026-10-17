import { describe, expect, it } from "vitest";

import { PHONE_3D, SECTION_KEYS, TIMELINE } from "@/shared/config";

import {
  activeFullpageIndex,
  consumeFullpageWheel,
  fullpageDuration,
  fullpagePosition,
  fullpageStops,
  nextFullpageIndex,
} from "./fullpageScroll";
import { stackSections } from "./stageLayout";

const H = 900;
const sections = stackSections({}, H);
const maxScroll = sections[sections.length - 1].end - H + 180;
const stops = fullpageStops(sections, H, maxScroll);

describe("fullpageStops", () => {
  it("인트로부터 마지막까지 한 섹션에 한 번만 정지한 뒤 푸터에 도착한다", () => {
    expect(SECTION_KEYS).toEqual(["intro", "record", "report", "recommend", "ar", "share", "closing"]);
    expect(stops.map((stop) => stop.key)).toEqual([
      "intro",
      "record",
      "report",
      "recommend",
      "ar",
      "share",
      "closing",
      "footer",
    ]);
    expect(stops[0].scrollY).toBe(0);
    expect(stops[stops.length - 1].scrollY).toBe(maxScroll);
    expect(stops.every((stop, i) => i === 0 || stop.scrollY > stops[i - 1].scrollY)).toBe(true);
  });

  it("섹션의 sticky 길이로 완성 상태를 계산한다", () => {
    const record = sections.find((section) => section.key === "record");
    if (!record) throw new Error("record missing");
    expect(stops[1].scrollY).toBe(record.end - H);
    const ar = sections.find((section) => section.key === "ar");
    if (!ar) throw new Error("ar missing");
    expect(stops[4].scrollY).toBe(ar.top + (ar.height - H) * 0.92);
  });

  it("푸터 높이가 없으면 마지막과 중복된 정지 지점을 만들지 않는다", () => {
    const withoutFooter = fullpageStops(sections, H, maxScroll - 180);
    expect(withoutFooter[withoutFooter.length - 1].key).toBe("closing");
    expect(fullpageStops([], H, 0)).toEqual([]);
  });

  it("낮은 데스크톱도 폰이 나타나기 전에 Spline 합체를 끝낸다", () => {
    for (const height of [500, 600, 900, 1080]) {
      const record = stackSections({}, height).find((section) => section.key === "record");
      if (!record) throw new Error("record missing");
      expect(record.top + TIMELINE.stageRevealVh[0] * height).toBeGreaterThanOrEqual(
        PHONE_3D.mergeEndScrollPx,
      );
    }
  });
});

describe("fullpage navigation", () => {
  it("정지 상태에서는 한 화면씩 이동하고 양 끝에서 넘어가지 않는다", () => {
    expect(nextFullpageIndex(stops, stops[1].scrollY, 1)).toBe(2);
    expect(nextFullpageIndex(stops, stops[1].scrollY, -1)).toBe(0);
    expect(nextFullpageIndex(stops, 0, -1)).toBe(0);
    expect(nextFullpageIndex(stops, maxScroll, 1)).toBe(stops.length - 1);
    expect(nextFullpageIndex([], 0, 1)).toBe(-1);
  });

  it("스크롤바로 중간에 왔다면 방향에 있는 가장 가까운 화면으로 간다", () => {
    const between = (stops[1].scrollY + stops[2].scrollY) / 2;
    expect(nextFullpageIndex(stops, between, 1)).toBe(2);
    expect(nextFullpageIndex(stops, between, -1)).toBe(1);
    expect(activeFullpageIndex(stops, stops[2].scrollY + 0.5)).toBe(2);
    expect(activeFullpageIndex([], 0)).toBe(-1);
  });
});

describe("fullpage animation", () => {
  it("초반 지연과 중간 급가속 없이 일정한 속도 변화로 이동한다", () => {
    const duration = fullpageDuration();
    expect(fullpagePosition(0, 1000, duration * 0.2, duration)).toBeCloseTo(95.49, 1);
    const beforeMiddle = fullpagePosition(0, 1000, duration * 0.4, duration);
    const afterMiddle = fullpagePosition(0, 1000, duration * 0.6, duration);
    expect(afterMiddle - beforeMiddle).toBeLessThan(320);
    expect(fullpagePosition(0, 1000, duration * 0.8, duration)).toBeCloseTo(904.51, 1);
  });

  it("작은 휠로 시작한 이동도 중간 모션을 보여 주며 5초에 도착한다", () => {
    const duration = fullpageDuration();
    expect(duration).toBe(5000);
    for (const distance of [H, H * 3, H * 100]) {
      expect(fullpagePosition(0, distance, duration, duration)).toBe(distance);
      expect(fullpagePosition(0, distance, duration / 2, duration)).toBeCloseTo(distance / 2);
      expect(fullpagePosition(0, distance, 1800, duration)).toBeLessThan(distance / 2);
    }
  });

  it("일정한 전환 시간 안에서 시작·중간 모션을 지나 정확히 목표에 멈춘다", () => {
    const duration = fullpageDuration();
    expect(fullpagePosition(100, 1000, 0, duration)).toBe(100);
    expect(fullpagePosition(100, 1000, duration / 2, duration)).toBeCloseTo(550);
    expect(fullpagePosition(100, 1000, duration + 20, duration)).toBe(1000);
    expect(fullpagePosition(1000, 100, duration / 2, duration)).toBeCloseTo(550);
    expect(fullpagePosition(100, 1000, 0, 0)).toBe(1000);
  });
});

describe("trackpad gesture", () => {
  it("1px·소수점 휠도 임계값 없이 시작하며 이동 중 입력은 예약하지 않는다", () => {
    for (const delta of [1, 0.1, -1, -0.1]) {
      const first = consumeFullpageWheel({ lastTime: null, direction: 0 }, 0, delta, false);
      expect(first.shouldAdvance).toBe(true);
      expect(consumeFullpageWheel(first.gesture, 500, delta, true).shouldAdvance).toBe(false);
    }
  });

  it("300ms 간격의 느린 관성 꼬리도 새 입력으로 보지 않는다", () => {
    const gesture = { lastTime: 0, direction: 1 };
    expect(consumeFullpageWheel(gesture, 300, 2, false).shouldAdvance).toBe(false);
    expect(consumeFullpageWheel(gesture, 500, 120, false).shouldAdvance).toBe(true);
  });

  it("관성 입력이 계속 오면 애니메이션이 끝나도 다음 화면으로 연달아 넘어가지 않는다", () => {
    let gesture = { lastTime: null as number | null, direction: 0 };
    let advances = 0;
    for (let time = 0; time < 4000; time += 16) {
      const result = consumeFullpageWheel(gesture, time, 8, time > 0 && time < 1000);
      gesture = result.gesture;
      if (result.shouldAdvance) advances++;
    }
    expect(advances).toBe(1);
    expect(consumeFullpageWheel(gesture, 5000, 8, false).shouldAdvance).toBe(true);
  });

  it("동작 중 새 제스처는 쌓지 않고 정지 후 방향 전환은 바로 받는다", () => {
    const gesture = { lastTime: 0, direction: 1 };
    expect(consumeFullpageWheel(gesture, 1000, 8, true).shouldAdvance).toBe(false);
    expect(consumeFullpageWheel(gesture, 16, -8, false).shouldAdvance).toBe(true);
    expect(consumeFullpageWheel(gesture, 16, 0, false).shouldAdvance).toBe(false);
  });
});
