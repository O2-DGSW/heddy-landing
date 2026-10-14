import { AR_SCREEN, TIMELINE } from "@/shared/config";
import { clamp, easeInOutCubic, lerp, progressIn } from "@/shared/lib/motion";
import type { SceneFrame } from "@/shared/lib/scroll";

type Triple = [number, number, number];

export type ArStyle = {
  /** 캐릭터 이미지 3장(일자 풀뱅·다운펌·가르마 댄디컷) 불투명도, 합은 1 */
  imageWeights: Triple;
  /** 스타일 이름 3개 불투명도 */
  labelWeights: Triple;
  /** 캐러셀 가운데에 온 항목 위치(실수, `AR_SCREEN.carousel` 인덱스) */
  carouselPos: number;
  /** 다음 썸네일을 누르는 터치 표시 */
  touch: { opacity: number; carouselIndex: number };
};

/** 전환 한 번(t = 0~1)의 단계 진행도 */
const stepsOf = (t: number) => ({
  touch: progressIn(t, TIMELINE.ar.styleTouch),
  slide: easeInOutCubic(progressIn(t, TIMELINE.ar.styleSlide)),
  image: easeInOutCubic(progressIn(t, TIMELINE.ar.styleImage)),
});

/** 이름은 캐러셀이 반쯤 밀렸을 때 짧게 크로스페이드한다 */
const labelSwap = (slide: number): number => progressIn(slide, [0.4, 0.6]);

/**
 * 스크롤 위치로 고른 목표 스타일(0 · 1 · 2). 전환 지점(`TIMELINE.ar.styleSteps`)을 넘으면 다음 스타일이다 —
 * 전환 자체는 스크롤로 문지르지 않고 `stepStyleClock`이 시간으로 재생한다(팀 피드백 2026-10-14).
 */
export const arStyleTarget = (frame: SceneFrame): number => {
  const p = frame.progress("ar");
  const [second, third] = TIMELINE.ar.styleSteps;
  return (p >= second ? 1 : 0) + (p >= third ? 1 : 0);
};

/** 표시 중인 스타일 s를 목표 쪽으로 dtMs만큼 옮긴다 — 전환 한 번(1)에 `styleDurationMs`, 넘치지 않는다 */
export const stepStyleClock = (current: number, target: number, dtMs: number): number => {
  const step = dtMs / TIMELINE.ar.styleDurationMs;
  return current < target ? Math.min(current + step, target) : Math.max(current - step, target);
};

/**
 * AR 화면 스타일 3단 전환(레퍼런스 영상 2, `docs/plans/0008`): 다음 썸네일에 터치 표시 →
 * 캐러셀이 밀려 선택이 가운데로 → 캐릭터 이미지 교체. 일자 풀뱅 → 다운펌 → 가르마 댄디컷.
 * s(0~2)는 시간으로 재생되는 표시 위치 — s = 1이면 다운펌, 2면 가르마 댄디컷.
 */
export const computeArStyleAt = (s: number): ArStyle => {
  const [first, second, third] = AR_SCREEN.styleCarouselIndex;
  const t2 = clamp(s);
  const t3 = clamp(s - 1);
  const a = stepsOf(t2);
  const b = stepsOf(t3);
  const isSecond = t2 >= 1;
  const touch = isSecond ? b.touch : a.touch;
  const la = labelSwap(a.slide);
  const lb = labelSwap(b.slide);
  return {
    imageWeights: [1 - a.image, a.image * (1 - b.image), b.image],
    labelWeights: [1 - la, la * (1 - lb), lb],
    carouselPos: first + a.slide + b.slide,
    touch: {
      opacity: touch > 0 && touch < 1 ? Math.sin(Math.PI * touch) : 0,
      carouselIndex: isSecond ? third : second,
    },
  };
};

/** 항목 i와 가운데(pos) 사이 거리를 원형 캐러셀 기준 [-n/2, n/2)로 감는다 */
export const wrapCarouselOffset = (offset: number, count: number): number =>
  ((((offset + count / 2) % count) + count) % count) - count / 2;

/** 가운데에서 |d|칸 떨어진 자리의 지름(피그마 80 / 62 / 50, 그 너머는 50) */
const sizeAt = (distance: number): number => {
  const sizes = AR_SCREEN.carouselSizes;
  const i = Math.min(Math.floor(distance), sizes.length - 1);
  const next = sizes[Math.min(i + 1, sizes.length - 1)];
  return lerp(sizes[i], next, distance - Math.floor(distance));
};

/** 가운데에서 정수 칸 k만큼 떨어진 썸네일 중심까지 거리(가장자리 간격 25) */
const centerAt = (k: number): number => {
  let x = 0;
  for (let i = 1; i <= k; i += 1) x += sizeAt(i - 1) / 2 + AR_SCREEN.carouselGap + sizeAt(i) / 2;
  return x;
};

/**
 * 캐러셀에서 가운데로부터 d칸(실수, 음수는 왼쪽) 떨어진 자리: 중심 x(피그마 px), 지름, 선택 테두리 진하기,
 * 불투명도(두 칸 넘게 멀어지면 사라짐).
 */
export const carouselSlot = (d: number): { x: number; size: number; selected: number; opacity: number } => {
  const distance = Math.abs(d);
  const k = Math.floor(distance);
  const x = lerp(centerAt(k), centerAt(k + 1), distance - k) * Math.sign(d);
  return {
    x,
    size: sizeAt(distance),
    selected: clamp(1 - distance),
    opacity: 1 - clamp(distance - 2),
  };
};
