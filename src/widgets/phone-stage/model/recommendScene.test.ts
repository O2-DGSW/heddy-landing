import { describe, expect, it } from "vitest";

import { PHONE, PHONE_3D, RECOMMEND_SCREEN, TIMELINE } from "@/shared/config";
import { computeStageLayout, createFrame, stackSections, type SceneFrame } from "@/shared/lib/scroll";

import {
  computeRecommendCards,
  computeRecommendScroll,
  computeRecommendTabSwitch,
  recommendScrollRangePx,
} from "./recommendScene";

const W = 1440;
const H = 900;
const sections = stackSections({}, H);
const layout = computeStageLayout(W, H);
const recommend = sections.find((section) => section.key === "recommend");
const report = sections.find((section) => section.key === "report");
if (!recommend || !report) throw new Error("section not found");

const atScrollY = (scrollY: number, isReducedMotion = false): SceneFrame =>
  createFrame(scrollY, layout, sections, isReducedMotion);
/** recommend 진행도 p 지점 */
const atP = (p: number, isReducedMotion = false): SceneFrame =>
  atScrollY(recommend.top + p * (recommend.height - H), isReducedMotion);

const { cardPop, cardReturn, screenScroll, tabTapBand, tabSlideBand } = TIMELINE.recommend;
/** report end 기준 뷰포트 배수 지점 */
const atReportEndVh = (vh: number, isReducedMotion = false): SceneFrame =>
  atScrollY(report.end + vh * H, isReducedMotion);
const mid = ([a, b]: readonly [number, number]) => (a + b) / 2;
const popEnd = (i: number) => cardPop.start + i * cardPop.stagger + cardPop.duration;
const popStart = (i: number) => cardPop.start + i * cardPop.stagger;
const returnStart = (i: number) => cardReturn.start + i * cardReturn.stagger;
const returnEnd = (i: number) => returnStart(i) + cardReturn.duration;
const CARD_COUNT = 3;

describe("computeRecommendTabSwitch (상세 → 추천: 추천 탭 탭 + 옆으로 밀기)", () => {
  it("탭 전에는 상세 화면 그대로다", () => {
    expect(computeRecommendTabSwitch(atReportEndVh(tabTapBand[0] - 0.01))).toEqual({
      press: 0,
      ripple: 0,
      tabActive: 0,
      slide: 0,
    });
  });

  it("탭 가운데서 추천 탭이 가장 깊이 눌리고 물결이 퍼지며, 탭바 활성 색이 옮겨 가는 중이다", () => {
    const tap = computeRecommendTabSwitch(atReportEndVh(mid(tabTapBand)));
    expect(tap.press).toBeCloseTo(1);
    expect(tap.ripple).toBeGreaterThan(0);
    expect(tap.ripple).toBeLessThan(1);
    expect(tap.tabActive).toBeGreaterThan(0);
    expect(tap.tabActive).toBeLessThan(1);
    expect(tap.slide).toBe(0);
  });

  it("탭이 끝나면 탭바는 추천이 활성이고, 그다음 추천 화면이 오른쪽에서 밀려 들어온다", () => {
    const end = computeRecommendTabSwitch(atReportEndVh(tabTapBand[1]));
    expect(end.press).toBeCloseTo(0);
    expect(end.tabActive).toBe(1);
    expect(end.slide).toBe(0);
    expect(computeRecommendTabSwitch(atReportEndVh(mid(tabSlideBand))).slide).toBeCloseTo(0.5);
  });

  it("slide는 단조 증가한다", () => {
    let prev = -1;
    for (let vh = tabSlideBand[0]; vh <= tabSlideBand[1]; vh += 0.01) {
      const { slide } = computeRecommendTabSwitch(atReportEndVh(vh));
      expect(slide).toBeGreaterThanOrEqual(prev);
      prev = slide;
    }
  });

  it("추천 섹션이 화면에 붙을 때(진행도 0) 이미 추천 화면으로 다 넘어가 있다", () => {
    expect(computeRecommendTabSwitch(atP(0))).toEqual({ press: 0, ripple: 0, tabActive: 1, slide: 1 });
  });

  it("reduced motion이면 누르는 연출 없이 위치에 따라 바로 바뀐다", () => {
    expect(computeRecommendTabSwitch(atReportEndVh(mid(tabTapBand), true)).press).toBe(0);
  });
});

describe("computeRecommendCards (카드 팝아웃)", () => {
  it("카드는 3장이다", () => {
    expect(computeRecommendCards(atP(0.5))).toHaveLength(CARD_COUNT);
  });

  it("팝아웃 전에는 모든 카드가 슬롯에 있고 보이지 않는다", () => {
    for (const card of computeRecommendCards(atP(popStart(0) - 0.01))) {
      expect(card.amount).toBe(0);
      expect(card.isVisible).toBe(false);
    }
  });

  it("1 → 2 → 3 순서로 차례로 떠오른다", () => {
    const mid = computeRecommendCards(atP(popStart(1) + cardPop.duration / 2));
    expect(mid[0].amount).toBeGreaterThan(mid[1].amount);
    expect(mid[1].amount).toBeGreaterThan(mid[2].amount);
  });

  it("다 떠오르면 오른쪽으로 dx만큼 비켜 나고 정해진 각도·크기가 된다", () => {
    const cards = computeRecommendCards(atP(popEnd(CARD_COUNT - 1)));
    cards.forEach((card, i) => {
      expect(card.amount).toBeCloseTo(1);
      expect(card.x).toBeCloseTo(RECOMMEND_SCREEN.pop.dx);
      expect(card.y).toBeCloseTo(RECOMMEND_SCREEN.pop.dy[i]);
      expect(card.rotateDeg).toBeCloseTo(RECOMMEND_SCREEN.pop.rotateDeg[i]);
      expect(card.scale).toBeCloseTo(RECOMMEND_SCREEN.pop.scale);
      expect(card.isVisible).toBe(true);
    });
  });

  it("떠오른 뒤 복귀 전까지 머문다(읽는 시간)", () => {
    const holdStart = popEnd(CARD_COUNT - 1);
    const holdEnd = returnStart(0);
    expect(holdEnd - holdStart).toBeGreaterThanOrEqual(0.15);
    for (const card of computeRecommendCards(atP((holdStart + holdEnd) / 2))) expect(card.amount).toBeCloseTo(1);
  });

  it("복귀가 끝나면 슬롯으로 돌아가 다시 숨는다", () => {
    for (const card of computeRecommendCards(atP(returnEnd(CARD_COUNT - 1)))) {
      expect(card.amount).toBe(0);
      expect(card.x).toBe(0);
      expect(card.isVisible).toBe(false);
    }
  });

  it("화면 스크롤은 카드가 다 돌아온 뒤에 시작한다", () => {
    expect(screenScroll[0]).toBeGreaterThanOrEqual(returnEnd(CARD_COUNT - 1));
  });

  it("reduced motion이면 카드가 떠오르지 않는다", () => {
    for (const card of computeRecommendCards(atP(0.5, true))) expect(card.isVisible).toBe(false);
  });
});

describe("computeRecommendScroll (화면 안 스크롤)", () => {
  const screen3d = { width: PHONE_3D.screen.width, height: PHONE_3D.screen.height };
  const screenCss = { width: PHONE.screenWidth, height: PHONE.screenHeight };

  it("스크롤 범위 = 본문 높이 − (화면 높이 − 고정 상·하단), 피그마 px", () => {
    const { designWidth, fixedTop, fixedBottom, bodyHeight } = RECOMMEND_SCREEN;
    const designHeight = (screen3d.height / screen3d.width) * designWidth;
    expect(recommendScrollRangePx(screen3d)).toBeCloseTo(bodyHeight - (designHeight - fixedTop - fixedBottom));
    expect(recommendScrollRangePx(screen3d)).toBeGreaterThan(0);
  });

  it("구간 전에는 맨 위, 끝나면 끝까지 내려가 있다", () => {
    expect(computeRecommendScroll(atP(screenScroll[0] - 0.01), screen3d).offsetPx).toBe(0);
    expect(computeRecommendScroll(atP(screenScroll[1]), screen3d).offsetPx).toBeCloseTo(
      recommendScrollRangePx(screen3d),
    );
  });

  it("CSS 폰(화면 비율이 다름)도 섹션 끝에서 끝까지 내려가 3D에서 넘겨받을 때 이음새가 없다", () => {
    expect(computeRecommendScroll(atP(1), screenCss).offsetPx).toBeCloseTo(recommendScrollRangePx(screenCss));
  });

  it("reduced motion이면 맨 위에 둔다", () => {
    expect(computeRecommendScroll(atP(1, true), screen3d).offsetPx).toBe(0);
  });
});
