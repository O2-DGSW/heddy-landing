import { describe, expect, it } from "vitest";

import { RECORD_CARDS } from "@/entities/record";
import { TIMELINE } from "@/shared/config";
import { computeStageLayout, createFrame, stackSections, type SceneFrame } from "@/shared/lib/scroll";

import { computeRecordAside } from "./recordAside";

const H = 900;
const sections = stackSections({}, H);
const layout = computeStageLayout(1440, H);
const record = sections.find((section) => section.key === "record");
if (!record) throw new Error("record not found");

const atP = (p: number, isReducedMotion = false): SceneFrame =>
  createFrame(record.top + p * (record.height - H), layout, sections, isReducedMotion);

const pAtStep = (k: number, u: number): number => {
  const [start, end] = TIMELINE.record.band;
  return start + ((k - 1 + u) / (RECORD_CARDS.length - 1)) * (end - start);
};

describe("computeRecordAside", () => {
  it("처음엔 첫 카드의 연·월이 연한 색으로 보인다", () => {
    const aside = computeRecordAside(atP(0), RECORD_CARDS);
    expect(aside.date).toBe("2026.01");
    expect(aside.prevDate).toBeNull();
    expect(aside.dateColor).toEqual([214, 208, 196]);
    expect(aside.railScale).toBeCloseTo(0.08);
  });

  it("폰에 카드 k가 들어오는 동안 날짜가 k-1 → k로 굴러 올라간다", () => {
    const entering = computeRecordAside(atP(pAtStep(4, 0.2)), RECORD_CARDS);
    expect(entering.date).toBe("2026.07");
    expect(entering.prevDate).toBe("2026.06");
    expect(entering.roll).toBeGreaterThan(0);
    expect(entering.roll).toBeLessThan(1);

    expect(computeRecordAside(atP(pAtStep(4, 0.8)), RECORD_CARDS).roll).toBe(1);
  });

  it("끝에서 마지막 카드 날짜가 거의 검정색이고 레일이 꽉 찬다", () => {
    const aside = computeRecordAside(atP(1), RECORD_CARDS);
    expect(aside.date).toBe("2026.09");
    expect(aside.dateColor).toEqual([13, 13, 13]);
    expect(aside.railScale).toBeCloseTo(1);
  });

  it("reduced motion이면 최종 상태다", () => {
    const aside = computeRecordAside(atP(0, true), RECORD_CARDS);
    expect(aside.date).toBe("2026.09");
    expect(aside.railScale).toBe(1);
  });
});
