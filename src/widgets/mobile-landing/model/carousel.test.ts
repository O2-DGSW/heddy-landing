import { describe, expect, it } from "vitest";

import { COPY } from "@/shared/config";

import { CAROUSEL, nearestIndex, nextIndex, RECOMMEND_CAROUSEL_CARDS } from "./carousel";

describe("추천 카드 캐러셀(이슈 #52, 토스 상품 카드 참고)", () => {
  it("카드는 추천 결과 Top 3 그대로(순위 순, 같은 문구)", () => {
    expect(RECOMMEND_CAROUSEL_CARDS.map((card) => card.rank)).toEqual(["1순위", "2순위", "3순위"]);
    expect(RECOMMEND_CAROUSEL_CARDS.map((card) => card.style)).toEqual(
      COPY.phoneScreens.recommend.cards.map((card) => card.style),
    );
  });

  it("다음 카드로 넘기고, 마지막 다음엔 처음으로 돌아간다", () => {
    expect(nextIndex(0, 3)).toBe(1);
    expect(nextIndex(1, 3)).toBe(2);
    expect(nextIndex(2, 3)).toBe(0);
  });

  it("지금 카드는 가운데에 가장 가까운 카드다", () => {
    // 카드 가운데 x(트랙 기준)와 보이는 영역 가운데
    const centers = [150, 450, 750];
    expect(nearestIndex(160, centers)).toBe(0);
    expect(nearestIndex(420, centers)).toBe(1);
    expect(nearestIndex(900, centers)).toBe(2);
  });

  it("천천히 넘긴다(읽을 시간), 만지면 넘기기를 잠시 멈춘다", () => {
    expect(CAROUSEL.intervalMs).toBeGreaterThanOrEqual(2500);
    expect(CAROUSEL.pauseAfterTouchMs).toBeGreaterThan(CAROUSEL.intervalMs);
  });
});
