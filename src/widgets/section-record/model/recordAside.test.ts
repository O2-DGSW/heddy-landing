import { describe, expect, it } from "vitest";

import { MOCK_RECORDS } from "@/entities/record";
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
  return start + ((k + u) / MOCK_RECORDS.length) * (end - start);
};

describe("computeRecordAside", () => {
  it("처음엔 첫 기록 날짜가 연한 색으로, 캡션은 '첫 기록'이다", () => {
    const aside = computeRecordAside(atP(0), MOCK_RECORDS);
    expect(aside.date).toBe("2025.03");
    expect(aside.prevDate).toBeNull();
    expect(aside.dateColor).toEqual([214, 208, 196]);
    expect(aside.caption).toBe("첫 기록");
    expect(aside.railScale).toBeCloseTo(0.08);
  });

  it("폰에 기록 k가 들어오는 동안 날짜가 k-1 → k로 굴러 올라간다", () => {
    const entering = computeRecordAside(atP(pAtStep(4, 0.2)), MOCK_RECORDS);
    expect(entering.date).toBe("2025.09");
    expect(entering.prevDate).toBe("2025.07");
    expect(entering.roll).toBeGreaterThan(0);
    expect(entering.roll).toBeLessThan(1);

    const settled = computeRecordAside(atP(pAtStep(4, 0.8)), MOCK_RECORDS);
    expect(settled.roll).toBe(1);
    expect(settled.caption).toBe("기록 5건 · 0년 6개월");
  });

  it("끝에서 마지막 기록이 거의 검정색이고 레일이 꽉 찬다", () => {
    const aside = computeRecordAside(atP(1), MOCK_RECORDS);
    expect(aside.date).toBe("2026.09");
    expect(aside.dateColor).toEqual([13, 13, 13]);
    expect(aside.caption).toBe("기록 12건 · 1년 6개월");
    expect(aside.railScale).toBeCloseTo(1);
  });

  it("reduced motion이면 최종 상태다", () => {
    const aside = computeRecordAside(atP(0, true), MOCK_RECORDS);
    expect(aside.date).toBe("2026.09");
    expect(aside.railScale).toBe(1);
  });
});
