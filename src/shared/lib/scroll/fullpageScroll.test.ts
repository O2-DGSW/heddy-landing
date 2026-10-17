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

  const transition = (fromKey: string, toKey: string) => {
    const from = stops.find((stop) => stop.key === fromKey);
    const to = stops.find((stop) => stop.key === toKey);
    if (!from || !to) throw new Error("stop missing");
    return fullpagePlan(from.scrollY, to.scrollY, sections, H);
  };

  it("도착한 뒤 목업 모션은 내용을 읽을 만큼 재생한다(이슈 #84, 예전엔 0.4~0.9초에 지나감)", () => {
    // [도착 화면, 최소, 최대(ms)] — 모션 양에 맞춘다
    const expected: [string, string, number, number][] = [
      ["intro", "record", 3000, 3600], // 기록 12건 쌓임
      ["record", "report", 1500, 1900], // 상세 화면 스크롤 + 지표 막대 4개
      ["report", "recommend", 1300, 1700], // 추천 카드 3장 펼침
      ["recommend", "ar", 5800, 6400], // 박스 확대 → 다크 패널 문구 → AR 폰 · 스타일 전환(이슈 #86)
      ["ar", "share", 5000, 6000], // 토글 → QR 모달 → 폰 B → QR 비행 → 공유된 기록(이슈 #86)
    ];
    for (const [from, to, min, max] of expected) {
      const enter = transition(from, to).at(-1);
      expect(enter?.kind).toBe("enter");
      expect(enter?.durationMs).toBeGreaterThanOrEqual(min);
      expect(enter?.durationMs).toBeLessThanOrEqual(max);
    }
  });

  it("떠나기(지금 화면 모션 마무리)도 보이되 화면 이동을 1초 넘게 미루지 않는다", () => {
    const leave = transition("recommend", "ar")[0];
    expect(leave.kind).toBe("leave");
    expect(leave.durationMs).toBeGreaterThanOrEqual(700);
    expect(leave.durationMs).toBeLessThanOrEqual(FULLPAGE.leave.maxMs);
    expect(FULLPAGE.leave.maxMs).toBeLessThanOrEqual(1000);
  });

  it("기록 진입 회전은 폰이 다 나타난 뒤 시작해 첫 카드 전에 끝나고, 실제로 약 1초 동안 돈다(이슈 #84)", () => {
    const record = section("record");
    const [spinStart, spinEnd] = TIMELINE.record.spinVh;
    expect(spinStart).toBeGreaterThanOrEqual(TIMELINE.stageRevealVh[1]);
    const bandStartY = record.top + TIMELINE.record.band[0] * (record.height - H);
    expect(record.top + spinEnd * H).toBeLessThanOrEqual(bandStartY + 1);
    const plan = transition("intro", "record");
    const timeAt = (y: number) => {
      for (let t = 0; t <= 6000; t += 2) if (fullpagePlanPosition(plan, t) >= y) return t;
      return Infinity;
    };
    const spinMs = timeAt(record.top + spinEnd * H) - timeAt(record.top + spinStart * H);
    expect(spinMs).toBeGreaterThanOrEqual(900);
  });

  it("도착은 앞뒤만 부드럽게 가속·감속하고 가운데는 일정한 속도 — 가운데 장면이 몰려 지나가지 않게(이슈 #86)", () => {
    // 곡선 자체를 본다 — 섹션 안 느린 구간(slowRanges)이 없는 AR 도착으로
    const enter = transition("recommend", "ar").at(-1);
    if (!enter) throw new Error("enter missing");
    const plan = [enter];
    const average = (enter.to - enter.from) / enter.durationMs;
    const speedAt = (t: number) =>
      (fullpagePlanPosition(plan, t + 5) - fullpagePlanPosition(plan, t - 5)) / 10;
    for (const f of [0.3, 0.4, 0.5, 0.6, 0.7]) {
      expect(speedAt(enter.durationMs * f)).toBeLessThanOrEqual(average * 1.3);
      expect(speedAt(enter.durationMs * f)).toBeGreaterThanOrEqual(average * 1.2);
    }
    expect(speedAt(enter.durationMs * 0.02)).toBeLessThan(average * 0.3);
  });

  it("공유 도착은 QR 모달·QR 비행·공유된 기록 구간만 더 천천히 — QR 비행 1초 이상, 다른 장면은 그대로(이슈 #86)", () => {
    const share = section("share");
    const enter = transition("ar", "share").at(-1);
    if (!enter) throw new Error("enter missing");
    const plan = [enter];
    const yAt = (p: number) => share.top + p * (share.height - H);
    const timeAt = (y: number) => {
      for (let t = 0; t <= enter.durationMs; t += 2) if (fullpagePlanPosition(plan, t) >= y) return t;
      return enter.durationMs;
    };
    const beat = (p0: number, p1: number) => timeAt(yAt(p1)) - timeAt(yAt(p0));
    expect(beat(TIMELINE.share.linkTap[0], TIMELINE.share.qrModal[1])).toBeGreaterThanOrEqual(500); // 링크 → QR 모달
    expect(beat(...TIMELINE.qrFlight)).toBeGreaterThanOrEqual(1000);
    expect(beat(...TIMELINE.bScanToWebview)).toBeGreaterThanOrEqual(300);
    expect(beat(0.03, 0.26)).toBeGreaterThanOrEqual(800); // 토글 3개
    expect(fullpagePlanPosition(plan, enter.durationMs + 1)).toBe(enter.to);
  });

  it("화면 이동(0.9초)은 그대로다", () => {
    expect(FULLPAGE.slide.durationMs).toBe(900);
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
