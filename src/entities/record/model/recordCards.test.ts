import { describe, expect, it } from "vitest";

import { RECORD_CARDS } from "./recordCards";

describe("RECORD_CARDS (record 섹션 카드 스택)", () => {
  it("2026년 카드부터 오래된 순으로 쌓는다", () => {
    expect(RECORD_CARDS.map((card) => card.date)).toEqual([
      "2026.01",
      "2026.03",
      "2026.05",
      "2026.06",
      "2026.07",
      "2026.09",
    ]);
  });

  it("카드 번호는 카드 이미지·Spline 오브젝트 번호(07~12)와 같다 — 날짜가 이미지에 그려져 있다", () => {
    expect(RECORD_CARDS.map((card) => card.cardNo)).toEqual([7, 8, 9, 10, 11, 12]);
  });
});
