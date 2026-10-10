import { describe, expect, it } from "vitest";

import { DETAIL_SCREEN, PHONE, TIMELINE } from "@/shared/config";
import { computeStageLayout, createFrame, stackSections, type SceneFrame } from "@/shared/lib/scroll";

import { computeDetailBars, computeDetailScroll, detailScrollRangePx } from "./detailScroll";

const H = 900;
const sections = stackSections({}, H);
const layout = computeStageLayout(1440, H);
const report = sections.find((section) => section.key === "report");
if (!report) throw new Error("report not found");

const atP = (p: number, isReducedMotion = false): SceneFrame =>
  createFrame(report.top + p * (report.height - H), layout, sections, isReducedMotion);

const screen = { width: PHONE.screenWidth, height: PHONE.screenHeight };

describe("computeDetailScroll", () => {
  const [start, end] = TIMELINE.report.detailScroll;
  const max = detailScrollRangePx(screen, DETAIL_SCREEN);

  it("본문은 화면에 다 안 들어올 만큼 길어서 스크롤할 거리가 있다", () => {
    expect(max).toBeGreaterThan(100);
  });

  it("구간 이전에는 맨 위(0), 이후에는 끝에서 멈춘다", () => {
    expect(computeDetailScroll(atP(0), screen).offsetPx).toBe(0);
    expect(computeDetailScroll(atP(start), screen).offsetPx).toBe(0);
    expect(computeDetailScroll(atP(end), screen).offsetPx).toBeCloseTo(max);
    expect(computeDetailScroll(atP(1), screen).offsetPx).toBeCloseTo(max);
  });

  it("진행에 따라 단조 증가하고 중간이면 절반 언저리다", () => {
    let prev = -1;
    for (let i = 0; i <= 40; i += 1) {
      const { offsetPx } = computeDetailScroll(atP(i / 40), screen);
      expect(offsetPx).toBeGreaterThanOrEqual(prev);
      prev = offsetPx;
    }
    const mid = computeDetailScroll(atP((start + end) / 2), screen);
    expect(mid.progress).toBeCloseTo(0.5);
    expect(mid.offsetPx).toBeCloseTo(max / 2);
  });

  it("끝에서 본문 바닥(수정/공유/삭제)이 하단 탭바 바로 위에 온다", () => {
    const scale = screen.width / DETAIL_SCREEN.imageWidthPx;
    const bodyBottom = DETAIL_SCREEN.fixedTopPx * scale + DETAIL_SCREEN.bodyHeightPx * scale - max;
    const tabBarTop = screen.height - DETAIL_SCREEN.fixedBottomPx * scale;
    expect(bodyBottom).toBeCloseTo(tabBarTop);
  });

  it("reduced motion이면 움직이지 않는다", () => {
    expect(computeDetailScroll(atP(0.5, true), screen).offsetPx).toBe(0);
  });
});

describe("computeDetailBars", () => {
  const [start, end] = TIMELINE.report.detailScroll;
  const atDetail = (progress: number) => atP(start + progress * (end - start));
  const scale = screen.width / DETAIL_SCREEN.imageWidthPx;
  const windowBottomAt = (offsetPx: number) =>
    offsetPx + screen.height - (DETAIL_SCREEN.fixedTopPx + DETAIL_SCREEN.fixedBottomPx) * scale;
  const barBottom = (i: number) => (DETAIL_SCREEN.bars.centerY[i] + DETAIL_SCREEN.bars.height / 2) * scale;

  it("막대 수는 이미지 속 막대 수(4)와 같다", () => {
    expect(computeDetailBars(atP(0), screen)).toHaveLength(DETAIL_SCREEN.bars.centerY.length);
  });

  it("본문이 스크롤되기 전에는 모두 비어 있고, 끝에서는 모두 찬다", () => {
    expect(computeDetailBars(atP(0), screen).every((fill) => fill === 0)).toBe(true);
    expect(computeDetailBars(atP(1), screen).every((fill) => fill === 1)).toBe(true);
  });

  it("창 안에 들어오기 전에는 차지 않는다", () => {
    for (let k = 0; k <= 40; k += 1) {
      const frame = atDetail(k / 40);
      const { offsetPx } = computeDetailScroll(frame, screen);
      computeDetailBars(frame, screen).forEach((fill, i) => {
        if (barBottom(i) > windowBottomAt(offsetPx)) expect(fill).toBe(0);
      });
    }
  });

  it("위 막대부터 차례로 찬다", () => {
    for (let k = 0; k <= 40; k += 1) {
      const fills = computeDetailBars(atDetail(k / 40), screen);
      for (let i = 1; i < fills.length; i += 1) expect(fills[i]).toBeLessThanOrEqual(fills[i - 1]);
    }
  });

  it("reduced motion이면 처음부터 다 찬 상태다", () => {
    expect(computeDetailBars(atP(0, true), screen).every((fill) => fill === 1)).toBe(true);
  });
});
