import { COPY, RECOMMEND_SCREEN } from "@/shared/config";

/** 추천 카드 캐러셀 타이밍(이슈 #52) */
export const CAROUSEL = {
  /** 다음 카드로 넘기는 간격(ms) */
  intervalMs: 2800,
  /** 사용자가 만진 뒤 자동 넘김을 쉬는 시간(ms) */
  pauseAfterTouchMs: 6000,
} as const;

/** 캐러셀 카드 — 추천 결과 Top 3(데스크톱 추천 화면과 같은 문구·사진 영역) */
export const RECOMMEND_CAROUSEL_CARDS = COPY.phoneScreens.recommend.cards.map((card, index) => ({
  ...card,
  /** 사진(`/screens/recommend/photo.webp`) 중 이 카드가 쓰는 영역 — 117px 상자 기준 */
  crop: RECOMMEND_SCREEN.photoCrops[index],
}));

/** 다음 카드 — 마지막 다음엔 처음으로 */
export const nextIndex = (index: number, count: number): number => (index + 1) % count;

/** 보이는 영역 가운데(viewCenter)에 가장 가까운 카드 */
export const nearestIndex = (viewCenter: number, cardCenters: readonly number[]): number =>
  cardCenters.reduce(
    (best, center, index) =>
      Math.abs(center - viewCenter) < Math.abs(cardCenters[best] - viewCenter) ? index : best,
    0,
  );
