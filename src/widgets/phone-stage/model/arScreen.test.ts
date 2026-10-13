import { describe, expect, it } from "vitest";

import { AR_SCREEN, TIMELINE } from "@/shared/config";
import { computeStageLayout, createFrame, stackSections, type SceneFrame } from "@/shared/lib/scroll";

import { carouselSlot, computeArStyle, wrapCarouselOffset } from "./arScreen";

const H = 900;
const sections = stackSections({}, H);
const layout = computeStageLayout(1440, H);
const ar = sections.find((section) => section.key === "ar");
if (!ar) throw new Error("section not found");
const atP = (p: number, isReducedMotion = false): SceneFrame =>
  createFrame(ar.top + p * (ar.height - H), layout, sections, isReducedMotion);

const { styleTransition2: t2, styleTransition3: t3, styleTouch, styleSlide, styleImage } = TIMELINE.ar;
/** 전환 구간 [a, b] 안의 t 지점 */
const inBand = ([a, b]: readonly [number, number], t: number) => a + (b - a) * t;
const sum = (values: readonly number[]) => values.reduce((acc, v) => acc + v, 0);
const [first, second, third] = AR_SCREEN.styleCarouselIndex;

describe("computeArStyle (스타일 3단 전환)", () => {
  it("처음엔 일자 풀뱅: 캐릭터·이름·캐러셀 선택이 모두 스타일 0", () => {
    const style = computeArStyle(atP(0.5));
    expect(style.imageWeights).toEqual([1, 0, 0]);
    expect(style.labelWeights).toEqual([1, 0, 0]);
    expect(style.carouselPos).toBe(first);
    expect(style.touch.opacity).toBe(0);
  });

  it("전환 처음엔 다음 썸네일(다운펌)에 터치 표시가 나타난다", () => {
    const style = computeArStyle(atP(inBand(t2, (styleTouch[0] + styleTouch[1]) / 2)));
    expect(style.touch.opacity).toBeGreaterThan(0.9);
    expect(style.touch.carouselIndex).toBe(second);
  });

  it("그다음 캐러셀이 밀려 다운펌이 가운데로 오고, 이름은 반쯤 밀렸을 때 바뀐다", () => {
    const mid = computeArStyle(atP(inBand(t2, (styleSlide[0] + styleSlide[1]) / 2)));
    expect(mid.carouselPos).toBeGreaterThan(first);
    expect(mid.carouselPos).toBeLessThan(second);
    const done = computeArStyle(atP(inBand(t2, styleSlide[1])));
    expect(done.carouselPos).toBeCloseTo(second);
    expect(done.labelWeights[1]).toBeCloseTo(1);
  });

  it("캐릭터 이미지는 캐러셀이 밀리기 시작한 뒤 크로스페이드한다(합은 늘 1)", () => {
    expect(computeArStyle(atP(inBand(t2, styleImage[0]))).imageWeights[0]).toBeCloseTo(1);
    const mid = computeArStyle(atP(inBand(t2, (styleImage[0] + styleImage[1]) / 2)));
    expect(mid.imageWeights[0]).toBeGreaterThan(0);
    expect(mid.imageWeights[1]).toBeGreaterThan(0);
    for (let p = 0.5; p <= 1; p += 0.01) expect(sum(computeArStyle(atP(p)).imageWeights)).toBeCloseTo(1);
  });

  it("두 번째 전환이 끝나면 가르마 댄디컷", () => {
    const style = computeArStyle(atP(t3[1]));
    expect(style.imageWeights).toEqual([0, 0, 1]);
    expect(style.labelWeights[2]).toBeCloseTo(1);
    expect(style.carouselPos).toBeCloseTo(third);
  });

  it("reduced motion이면 터치·밀기 없이 구간 가운데서 바로 바뀐다", () => {
    const before = computeArStyle(atP(inBand(t2, 0.4), true));
    expect(before.carouselPos).toBe(first);
    expect(before.touch.opacity).toBe(0);
    const after = computeArStyle(atP(inBand(t2, 0.6), true));
    expect(after.carouselPos).toBe(second);
    expect(after.imageWeights).toEqual([0, 1, 0]);
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
