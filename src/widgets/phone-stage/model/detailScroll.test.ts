import { describe, expect, it } from "vitest";

import { DETAIL_SCREEN, PHONE, TIMELINE } from "@/shared/config";
import {
  computeReportBarProgress,
  computeStageLayout,
  createFrame,
  stackSections,
  type SceneFrame,
} from "@/shared/lib/scroll";

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
  const { scores } = DETAIL_SCREEN.bars;

  it("막대 수는 이미지 속 막대 수(4)와 같다", () => {
    expect(computeDetailBars(atP(0))).toHaveLength(4);
  });

  it("섹션 카피 막대와 같은 순간·같은 시차로 차고, 길이는 점수 비례다", () => {
    for (let k = 0; k <= 40; k += 1) {
      const frame = atP(k / 40);
      computeDetailBars(frame).forEach((scale, i) => {
        expect(scale).toBeCloseTo(computeReportBarProgress(frame, i) * scores[i]);
      });
    }
    const sectionBars = computeReportBarProgress(atP(0.2), 0);
    expect(sectionBars).toBeGreaterThan(0);
  });

  it("리포트 섹션 전에는 비어 있고, 끝에서는 점수만큼 찬다", () => {
    const before = createFrame(report.top - H, layout, sections, false);
    expect(computeDetailBars(before).every((scale) => scale === 0)).toBe(true);
    computeDetailBars(atP(1)).forEach((scale, i) => expect(scale).toBeCloseTo(scores[i]));
  });

  it("reduced motion이면 처음부터 점수만큼 찬 상태다", () => {
    computeDetailBars(atP(0, true)).forEach((scale, i) => expect(scale).toBeCloseTo(scores[i]));
  });
});
