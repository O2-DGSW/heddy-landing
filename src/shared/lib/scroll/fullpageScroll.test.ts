import { describe, expect, it } from "vitest";

import { FULLPAGE, PHONE_3D, SECTION_KEYS, TIMELINE } from "@/shared/config";

import {
  activeFullpageIndex,
  consumeFullpageWheel,
  fullpagePlan,
  fullpagePlanKind,
  fullpagePlanPosition,
  fullpageStops,
  interruptedTarget,
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

describe("fullpagePlan (전환을 화면 이동 · 화면 고정 구간으로 나눔, 이슈 #82)", () => {
  const section = (key: string) => {
    const found = sections.find((candidate) => candidate.key === key);
    if (!found) throw new Error(`${key} missing`);
    return found;
  };
  const totalMs = (plan: ReturnType<typeof fullpagePlan>) =>
    plan.reduce((sum, seg) => sum + seg.durationMs, 0);

  it("다음 화면이 올라오는 화면 이동 구간은 전환마다 같은 0.9초다(배민 측정)", () => {
    for (let i = 0; i < stops.length - 2; i++) {
      const plan = fullpagePlan(stops[i].scrollY, stops[i + 1].scrollY, sections, H);
      const slides = plan.filter((seg) => seg.kind === "slide");
      expect(slides).toHaveLength(1);
      expect(slides[0].to - slides[0].from).toBeCloseTo(H);
      expect(slides[0].durationMs).toBe(FULLPAGE.slide.durationMs);
    }
  });

  it("인트로의 숨은 구간(폰 숨김·합체)은 0초로 건너뛰어 휠 직후 바로 화면이 움직인다", () => {
    const plan = fullpagePlan(stops[0].scrollY, stops[1].scrollY, sections, H);
    expect(plan[0]).toMatchObject({ kind: "hidden", durationMs: 0 });
    expect(plan[1].kind).toBe("slide");
    expect(plan[1].from).toBeCloseTo(section("record").top - H);
    expect(fullpagePlanPosition(plan, 1)).toBeGreaterThan(section("record").top - H);
  });

  it("도착 구간은 새 화면의 모션을 화면당 시간으로 재생한다(기록 12건 약 2.1초, 최대 3초)", () => {
    const plan = fullpagePlan(stops[0].scrollY, stops[1].scrollY, sections, H);
    const enter = plan[plan.length - 1];
    expect(enter.kind).toBe("enter");
    expect(enter.durationMs).toBeCloseTo(5 * FULLPAGE.enter.msPerViewport, -1);
    expect(totalMs(plan)).toBeLessThan(3500);
  });

  it("AR 도착은 다크 패널 문구를 읽을 수 있게 더 천천히(화면당 600ms)", () => {
    const recommendStop = stops.find((stop) => stop.key === "recommend");
    const arStop = stops.find((stop) => stop.key === "ar");
    if (!recommendStop || !arStop) throw new Error("stop missing");
    const enter = fullpagePlan(recommendStop.scrollY, arStop.scrollY, sections, H).at(-1);
    expect(enter?.kind).toBe("enter");
    expect(enter?.durationMs).toBeCloseTo(0.92 * 5 * (FULLPAGE.enter.msPerViewportBySection.ar ?? 0), -1);
  });

  it("떠나기 구간(지금 화면 모션 마무리)은 짧다 — 화면 이동이 늦게 시작하지 않게", () => {
    const recommendStop = stops.find((stop) => stop.key === "recommend");
    const arStop = stops.find((stop) => stop.key === "ar");
    if (!recommendStop || !arStop) throw new Error("stop missing");
    const leave = fullpagePlan(recommendStop.scrollY, arStop.scrollY, sections, H)[0];
    expect(leave.kind).toBe("leave");
    expect(leave.durationMs).toBeLessThanOrEqual(FULLPAGE.leave.maxMs);
  });

  it("역방향도 같은 규칙: 지금 화면 마무리 → 0.9초 화면 이동 → 이전 화면 도착", () => {
    const plan = fullpagePlan(stops[2].scrollY, stops[1].scrollY, sections, H);
    expect(plan.map((seg) => seg.kind)).toEqual(["leave", "slide"]);
    expect(plan[1].durationMs).toBe(FULLPAGE.slide.durationMs);
    expect(fullpagePlanPosition(plan, totalMs(plan) + 10)).toBe(stops[1].scrollY);
  });

  it("마지막 → 푸터처럼 한 화면보다 짧은 이동은 짧게(최소 450ms)", () => {
    const plan = fullpagePlan(stops[stops.length - 2].scrollY, maxScroll, sections, H);
    expect(plan).toHaveLength(1);
    expect(plan[0].kind).toBe("slide");
    expect(plan[0].durationMs).toBeGreaterThanOrEqual(450);
    expect(plan[0].durationMs).toBeLessThan(FULLPAGE.slide.durationMs);
  });

  it("경과 시간 → 위치는 끊김 없이 이어지고 정확히 목표에서 멈춘다", () => {
    const plan = fullpagePlan(stops[3].scrollY, stops[4].scrollY, sections, H);
    const total = totalMs(plan);
    expect(fullpagePlanPosition(plan, 0)).toBe(stops[3].scrollY);
    expect(fullpagePlanPosition(plan, total + 1)).toBe(stops[4].scrollY);
    let previous = stops[3].scrollY;
    for (let t = 0; t <= total; t += 4) {
      const y = fullpagePlanPosition(plan, t);
      expect(y).toBeGreaterThanOrEqual(previous - 1e-6);
      expect(y - previous).toBeLessThan(H * 0.05);
      previous = y;
    }
    expect(fullpagePlan(100, 100, sections, H)).toEqual([]);
  });

  it("지금 화면 이동 중인지 — 이동 중에만 입력을 막는다", () => {
    const plan = fullpagePlan(stops[0].scrollY, stops[1].scrollY, sections, H);
    expect(fullpagePlanKind(plan, 10)).toBe("slide");
    expect(fullpagePlanKind(plan, FULLPAGE.slide.durationMs + 50)).toBe("enter");
    expect(fullpagePlanKind(plan, 1e9)).toBeNull();
  });
});

describe("interruptedTarget (도착 중 끼어든 입력)", () => {
  it("같은 방향이면 진행 중인 목표의 다음 화면, 반대면 지금 위치 뒤의 화면", () => {
    const halfway = (stops[1].scrollY + stops[2].scrollY) / 2;
    expect(interruptedTarget(stops, halfway, 2, 1)).toBe(3);
    expect(interruptedTarget(stops, halfway, 2, -1)).toBe(1);
    expect(interruptedTarget(stops, halfway, stops.length - 1, 1)).toBe(stops.length - 1);
    expect(interruptedTarget(stops, halfway, null, 1)).toBe(2);
  });
});

describe("trackpad gesture", () => {
  it("1px·소수점 휠도 임계값 없이 시작하며 화면 이동 중 입력은 예약하지 않는다", () => {
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
