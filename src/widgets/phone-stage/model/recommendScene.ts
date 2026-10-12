import { RECOMMEND_SCREEN, TIMELINE } from "@/shared/config";
import { easeInOutCubic, progressIn } from "@/shared/lib/motion";
import type { SceneFrame } from "@/shared/lib/scroll";

type ScreenSize = { width: number; height: number };

type Stagger = { start: number; stagger: number; duration: number };

/** 카드 i의 진행 구간 [start + i·stagger, start + i·stagger + duration] */
const staggerRange = ({ start, stagger, duration }: Stagger, index: number): [number, number] => [
  start + index * stagger,
  start + index * stagger + duration,
];

const sectionEnd = (frame: SceneFrame, key: "report" | "recommend"): number =>
  frame.sections.find((section) => section.key === key)?.end ?? 0;

export type RecommendTabSwitch = {
  /** "추천" 탭이 눌린 정도(0 → 1 → 0) */
  press: number;
  /** 탭 물결 진행도(0이면 없음) */
  ripple: number;
  /** 탭바 활성 색이 기록 → 추천으로 옮겨 간 정도(0~1) */
  tabActive: number;
  /** 추천 화면이 오른쪽에서 들어온 정도(0~1, 이징 적용) — 상세 화면은 같은 만큼 왼쪽으로 나간다 */
  slide: number;
};

/**
 * 리포트 상세 → 추천 화면: 하단 "추천" 탭을 눌렀다 떼면(물결) 탭바 활성 색이 옮겨 가고, 추천 화면이
 * 오른쪽에서 밀려 들어온다(`docs/plans/0007`). report 섹션 end 기준 구간이라 추천 섹션이 화면에 붙을 때
 * 이미 다 넘어가 있다.
 */
export const computeRecommendTabSwitch = (frame: SceneFrame): RecommendTabSwitch => {
  const vh = frame.layout.viewportHeight;
  const end = sectionEnd(frame, "report");
  const { tabTapBand, tabSlideBand, tabActiveIn } = TIMELINE.recommend;
  const tap = progressIn(frame.scrollY, [end + tabTapBand[0] * vh, end + tabTapBand[1] * vh]);
  const slide = progressIn(frame.scrollY, [end + tabSlideBand[0] * vh, end + tabSlideBand[1] * vh]);
  if (frame.isReducedMotion) {
    const isSwitched = slide > 0;
    return { press: 0, ripple: 0, tabActive: isSwitched ? 1 : 0, slide: isSwitched ? 1 : 0 };
  }

  const isTapping = tap > 0 && tap < 1;
  return {
    press: isTapping ? Math.sin(Math.PI * tap) : 0,
    ripple: isTapping ? tap : 0,
    tabActive: progressIn(tap, tabActiveIn),
    slide: easeInOutCubic(slide),
  };
};

export type RecommendCardPose = {
  /** 떠오른 정도(0 = 슬롯, 1 = 다 떠오름) — 그림자 세기에도 쓴다 */
  amount: number;
  /** 슬롯 기준 이동(피그마 px) */
  x: number;
  y: number;
  rotateDeg: number;
  scale: number;
  /** 슬롯에 있을 땐 화면 속 카드가 보이므로 떠오른 카드는 숨긴다 */
  isVisible: boolean;
};

/**
 * 추천 카드 3장이 폰 밖으로 떠올랐다가 돌아오는 자세(레퍼런스 영상, `docs/plans/0007`).
 * 1 → 2 → 3 순서로 떠오르고, 머문 뒤 함께(살짝 엇갈려) 제자리로 돌아간다.
 */
export const computeRecommendCards = (frame: SceneFrame): RecommendCardPose[] => {
  const { pop } = RECOMMEND_SCREEN;
  const p = frame.progress("recommend");
  return pop.dy.map((dy, index) => {
    const out = frame.isReducedMotion ? 0 : progressIn(p, staggerRange(TIMELINE.recommend.cardPop, index));
    const back = frame.isReducedMotion
      ? 0
      : progressIn(p, staggerRange(TIMELINE.recommend.cardReturn, index));
    const amount = easeInOutCubic(out) * (1 - easeInOutCubic(back));
    return {
      amount,
      x: pop.dx * amount,
      y: dy * amount,
      rotateDeg: pop.rotateDeg[index] * amount,
      scale: 1 + (pop.scale - 1) * amount,
      isVisible: amount > 0,
    };
  });
};

/** 화면 크기를 피그마 px로 옮긴 높이(폭 402 기준) */
const designHeightOf = (screen: ScreenSize): number =>
  (screen.height / screen.width) * RECOMMEND_SCREEN.designWidth;

/**
 * 본문이 올라갈 수 있는 최대 거리(피그마 px). "본문 높이 − (화면 높이 − 상단·하단 고정)" —
 * 끝에서 본문 바닥이 탭바 바로 위에 온다. 3D 폰과 CSS 폰은 화면 비율이 달라 값이 다르다.
 */
export const recommendScrollRangePx = (screen: ScreenSize): number => {
  const { fixedTop, fixedBottom, bodyHeight } = RECOMMEND_SCREEN;
  return Math.max(0, bodyHeight - (designHeightOf(screen) - fixedTop - fixedBottom));
};

/** 추천 화면 안 스크롤(피그마 px). 손가락으로 내리는 느낌이 나도록 선형 */
export const computeRecommendScroll = (
  frame: SceneFrame,
  screen: ScreenSize,
): { progress: number; offsetPx: number } => {
  if (frame.isReducedMotion) return { progress: 0, offsetPx: 0 };
  const progress = progressIn(frame.progress("recommend"), TIMELINE.recommend.screenScroll);
  return { progress, offsetPx: progress * recommendScrollRangePx(screen) };
};
