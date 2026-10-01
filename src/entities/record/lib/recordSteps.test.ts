import { describe, expect, it } from "vitest";

import { TIMELINE } from "@/shared/config";
import { computeStageLayout, createFrame, stackSections, type SceneFrame } from "@/shared/lib/scroll";

import { computeRecordSteps } from "./recordSteps";

const COUNT = 12;

const frameAtRecord = (p: number, width = 1440, height = 900, isReducedMotion = false): SceneFrame => {
  const sections = stackSections({}, height);
  const record = sections.find((section) => section.key === "record");
  if (!record) throw new Error("record not found");
  const scrollY = record.top + p * (record.height - height);
  return createFrame(scrollY, computeStageLayout(width, height), sections, isReducedMotion);
};

/** 스텝 k 안의 로컬 진행도 u에 해당하는 record 진행도 */
const pAtStep = (k: number, u: number): number => {
  const [start, end] = TIMELINE.record.band;
  // 첫 기록(k=0)은 처음부터 있고, k=1..11이 band에 고르게 들어온다
  return start + ((k - 1 + u) / (COUNT - 1)) * (end - start);
};

describe("computeRecordSteps", () => {
  it("기록 화면이 뜰 때부터 첫 기록이 있다(빈 목록이 보이지 않는다)", () => {
    const steps = computeRecordSteps(frameAtRecord(0), COUNT);
    expect(steps.raw).toBe(1);
    expect(steps.entered[0]).toBe(1);
    expect(steps.entered.slice(1).every((value) => value === 0)).toBe(true);
    expect(steps.focusIndex).toBe(0);
  });

  it("스텝 k의 등장이 끝나면 k+1건이 쌓여 있고 k번째가 포커스다", () => {
    for (const k of [1, 4, 11]) {
      const steps = computeRecordSteps(frameAtRecord(pAtStep(k, 0.6)), COUNT);
      expect(steps.entered.slice(0, k + 1).every((value) => value === 1)).toBe(true);
      expect(steps.entered.slice(k + 1).every((value) => value === 0)).toBe(true);
      expect(steps.focusIndex).toBe(k);
    }
  });

  it("한 스텝 안에서는 새 기록 하나만 들어오는 중이다", () => {
    const steps = computeRecordSteps(frameAtRecord(pAtStep(3, 0.2)), COUNT);
    const inFlight = steps.entered.filter((value) => value > 0 && value < 1);
    expect(inFlight).toHaveLength(1);
    expect(steps.entered[3]).toBeGreaterThan(0);
    expect(steps.focusIndex).toBe(3);
  });

  it("band 끝에서 12건이 모두 쌓이고, settle은 그 뒤에 시작한다", () => {
    const atBandEnd = computeRecordSteps(frameAtRecord(TIMELINE.record.band[1]), COUNT);
    expect(atBandEnd.entered.every((value) => value === 1)).toBe(true);
    expect(atBandEnd.settle).toBe(0);
    expect(computeRecordSteps(frameAtRecord(1), COUNT).settle).toBe(1);
  });

  it("뷰포트 크기와 무관하게 같은 진행도면 같은 스텝이다", () => {
    const base = computeRecordSteps(frameAtRecord(pAtStep(6, 0.3)), COUNT);
    for (const [width, height] of [
      [1920, 1080],
      [1024, 700],
    ] as const) {
      const other = computeRecordSteps(frameAtRecord(pAtStep(6, 0.3), width, height), COUNT);
      expect(other.raw).toBeCloseTo(base.raw);
      expect(other.focusIndex).toBe(base.focusIndex);
    }
  });

  it("reduced motion이면 12건이 모두 쌓인 최종 상태다", () => {
    const steps = computeRecordSteps(frameAtRecord(0, 1440, 900, true), COUNT);
    expect(steps.entered.every((value) => value === 1)).toBe(true);
    expect(steps.focusIndex).toBe(COUNT - 1);
    expect(steps.settle).toBe(1);
  });
});
