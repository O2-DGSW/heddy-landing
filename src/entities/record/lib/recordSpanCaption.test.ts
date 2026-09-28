import { describe, expect, it } from "vitest";

import { MOCK_RECORDS } from "../model/mockRecords";
import { recordSpanCaption } from "./recordSpanCaption";

describe("recordSpanCaption", () => {
  it("첫 기록은 '첫 기록'이다", () => {
    expect(recordSpanCaption(MOCK_RECORDS, 0)).toBe("첫 기록");
  });

  it("N번째 기록은 건수와 경과 기간을 보여준다", () => {
    // r1: 2025.03, r5: 2025.09 → 6개월, 5번째(index 4)까지 쌓임
    expect(recordSpanCaption(MOCK_RECORDS, 4)).toBe("기록 5건 · 0년 6개월");
  });

  it("연 단위가 넘어가면 Y년 M개월로 나눈다", () => {
    // r1: 2025.03, r12: 2026.09 → 18개월 = 1년 6개월
    expect(recordSpanCaption(MOCK_RECORDS, 11)).toBe("기록 12건 · 1년 6개월");
  });
});
