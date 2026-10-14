import { describe, expect, it } from "vitest";

import { AR_SCREEN, TIMELINE } from "@/shared/config";
import { computeStageLayout, createFrame, stackSections, type SceneFrame } from "@/shared/lib/scroll";

import {
  arStyleTarget,
  carouselSlot,
  computeArStyleAt,
  stepStyleClock,
  wrapCarouselOffset,
} from "./arScreen";

const H = 900;
const sections = stackSections({}, H);
const layout = computeStageLayout(1440, H);
const ar = sections.find((section) => section.key === "ar");
if (!ar) throw new Error("section not found");
const atP = (p: number, isReducedMotion = false): SceneFrame =>
  createFrame(ar.top + p * (ar.height - H), layout, sections, isReducedMotion);

const { styleSteps, styleDurationMs, styleTouch, styleSlide, styleImage } = TIMELINE.ar;
const sum = (values: readonly number[]) => values.reduce((acc, v) => acc + v, 0);
const [first, second, third] = AR_SCREEN.styleCarouselIndex;

describe("arStyleTarget (스크롤 근사값으로 고른 스타일, 팀 피드백 2026-10-14)", () => {
  it("스크롤이 전환 지점을 넘으면 다음 스타일을 목표로 한다(중간값 없이 0 · 1 · 2)", () => {
    expect(arStyleTarget(atP(0.5))).toBe(0);
    expect(arStyleTarget(atP(styleSteps[0] - 0.001))).toBe(0);
    expect(arStyleTarget(atP(styleSteps[0]))).toBe(1);
    expect(arStyleTarget(atP(styleSteps[1] - 0.001))).toBe(1);
    expect(arStyleTarget(atP(styleSteps[1]))).toBe(2);
    expect(arStyleTarget(atP(1))).toBe(2);
  });
});

describe("stepStyleClock (전환은 스크롤이 아니라 시간으로 재생)", () => {
  it("목표 쪽으로 한 번 전환(1)을 styleDurationMs에 걸쳐 일정하게 간다", () => {
    expect(stepStyleClock(0, 1, styleDurationMs / 2)).toBeCloseTo(0.5);
    expect(stepStyleClock(0.5, 1, styleDurationMs / 2)).toBe(1);
  });

  it("목표를 넘지 않고, 위로 스크롤하면 거꾸로 돌아간다", () => {
    expect(stepStyleClock(0.9, 1, styleDurationMs)).toBe(1);
    expect(stepStyleClock(2, 1, styleDurationMs / 4)).toBeCloseTo(1.75);
  });
});

describe("computeArStyleAt (스타일 3단 전환, s = 0~2)", () => {
  it("처음엔 일자 풀뱅: 캐릭터·이름·캐러셀 선택이 모두 스타일 0", () => {
    const style = computeArStyleAt(0);
    expect(style.imageWeights).toEqual([1, 0, 0]);
    expect(style.labelWeights).toEqual([1, 0, 0]);
    expect(style.carouselPos).toBe(first);
    expect(style.touch.opacity).toBe(0);
  });

  it("전환 처음엔 다음 썸네일(다운펌)에 터치 표시가 나타난다", () => {
    const style = computeArStyleAt((styleTouch[0] + styleTouch[1]) / 2);
    expect(style.touch.opacity).toBeGreaterThan(0.9);
    expect(style.touch.carouselIndex).toBe(second);
  });

  it("그다음 캐러셀이 밀려 다운펌이 가운데로 오고, 이름은 반쯤 밀렸을 때 바뀐다", () => {
    const mid = computeArStyleAt((styleSlide[0] + styleSlide[1]) / 2);
    expect(mid.carouselPos).toBeGreaterThan(first);
    expect(mid.carouselPos).toBeLessThan(second);
    const done = computeArStyleAt(styleSlide[1]);
    expect(done.carouselPos).toBeCloseTo(second);
    expect(done.labelWeights[1]).toBeCloseTo(1);
  });

  it("두 머리가 겹쳐 보이는 중간 장면은 전환 한 번의 15% 이하로 짧다(합은 늘 1)", () => {
    let overlapped = 0;
    const samples = 1000;
    for (let i = 0; i <= samples; i += 1) {
      const [w0, w1] = computeArStyleAt(i / samples).imageWeights;
      if (w0 > 0.05 && w1 > 0.05) overlapped += 1;
    }
    expect(overlapped / samples).toBeLessThanOrEqual(0.15);
    expect(styleImage[0]).toBeGreaterThanOrEqual(styleSlide[0]);
    for (let s = 0; s <= 2; s += 0.01) expect(sum(computeArStyleAt(s).imageWeights)).toBeCloseTo(1);
  });

  it("두 번째 전환이 끝나면 가르마 댄디컷", () => {
    const style = computeArStyleAt(2);
    expect(style.imageWeights).toEqual([0, 0, 1]);
    expect(style.labelWeights[2]).toBeCloseTo(1);
    expect(style.carouselPos).toBeCloseTo(third);
    expect(computeArStyleAt(1.5).touch.carouselIndex).toBe(third);
  });
});

describe("carouselSlot (캐러셀 자리)", () => {
  it("가운데(선택)는 80, 한 칸 옆 62, 두 칸 옆 50 — 피그마 크기", () => {
    expect(carouselSlot(0).size).toBe(AR_SCREEN.carouselSizes[0]);
    expect(carouselSlot(1).size).toBe(AR_SCREEN.carouselSizes[1]);
    expect(carouselSlot(-2).size).toBe(AR_SCREEN.carouselSizes[2]);
  });

  it("썸네일 사이 간격은 25(가장자리 기준)", () => {
    const [s0, s1, s2] = AR_SCREEN.carouselSizes;
    expect(carouselSlot(1).x).toBeCloseTo(s0 / 2 + AR_SCREEN.carouselGap + s1 / 2);
    expect(carouselSlot(2).x - carouselSlot(1).x).toBeCloseTo(s1 / 2 + AR_SCREEN.carouselGap + s2 / 2);
    expect(carouselSlot(-1).x).toBeCloseTo(-carouselSlot(1).x);
  });

  it("선택 테두리는 가운데에서만 진하다", () => {
    expect(carouselSlot(0).selected).toBe(1);
    expect(carouselSlot(0.5).selected).toBeCloseTo(0.5);
    expect(carouselSlot(1).selected).toBe(0);
  });

  it("두 칸 넘게 멀어지면 사라진다", () => {
    expect(carouselSlot(2).opacity).toBe(1);
    expect(carouselSlot(2.5).opacity).toBeLessThan(1);
  });

  it("원형으로 돈다: 항목 거리는 [-2.5, 2.5)로 감긴다", () => {
    const n = AR_SCREEN.carousel.length;
    expect(wrapCarouselOffset(4 - 1, n)).toBe(-2);
    expect(wrapCarouselOffset(0 - 3, n)).toBe(2);
    expect(wrapCarouselOffset(1 - 1, n)).toBe(0);
  });
});
