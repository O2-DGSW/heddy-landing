import { describe, expect, it } from "vitest";

import { TIMELINE } from "@/shared/config";
import { computeStageLayout, createFrame, stackSections, type SceneFrame } from "@/shared/lib/scroll";

import { computeReportBars } from "./reportBars";

const H = 900;
const sections = stackSections({}, H);
const layout = computeStageLayout(1440, H);
const report = sections.find((section) => section.key === "report");
if (!report) throw new Error("report not found");
const L = report.end - report.top;
const { barStartOffsetVh, barStaggerVh, barDurationRatioOfL, barValues } = TIMELINE.report;

const at = (scrollY: number, isReducedMotion = false): SceneFrame =>
  createFrame(scrollY, layout, sections, isReducedMotion);

/** 막대 i 구간: top − 0.3H + i·0.06H ~ top + 0.4L + i·0.06H (`docs/design/spec.md` §5) */
const barRange = (i: number): [number, number] => [
  report.top + barStartOffsetVh * H + i * barStaggerVh * H,
  report.top + barDurationRatioOfL * L + i * barStaggerVh * H,
];

describe("computeReportBars", () => {
  it("막대 수는 값 수와 같다", () => {
    expect(computeReportBars(at(0))).toHaveLength(barValues.length);
  });

  it("각 막대 구간 전에는 0이다", () => {
    barValues.forEach((_, i) => {
      expect(computeReportBars(at(barRange(i)[0] - 1))[i]).toBe(0);
    });
  });

  it("각 막대 구간 끝에서 제 값까지 차고 그 뒤로 멈춘다", () => {
    barValues.forEach((value, i) => {
      expect(computeReportBars(at(barRange(i)[1]))[i]).toBeCloseTo(value);
      expect(computeReportBars(at(report.end))[i]).toBeCloseTo(value);
    });
  });

  it("구간 가운데서 이징으로 값의 절반이다", () => {
    const [start, end] = barRange(1);
    expect(computeReportBars(at((start + end) / 2))[1]).toBeCloseTo(barValues[1] / 2);
  });

  it("뒤 막대일수록 늦게 찬다(스태거)", () => {
    const [start, end] = barRange(0);
    const ratios = computeReportBars(at((start + end) / 2)).map((scale, i) => scale / barValues[i]);
    expect(ratios[0]).toBeGreaterThan(ratios[1]);
    expect(ratios[1]).toBeGreaterThan(ratios[2]);
  });

  it("reduced motion이면 처음부터 다 찬 상태다", () => {
    expect(computeReportBars(at(0, true))).toEqual([...barValues]);
  });
});
