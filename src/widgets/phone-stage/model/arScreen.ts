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
 * AR 화면 스타일 3단 전환(레퍼런스 영상 2, `docs/plans/0008`): 다음 썸네일에 터치 표시 →
 * 캐러셀이 밀려 선택이 가운데로 → 캐릭터 이미지 크로스페이드. 일자 풀뱅 → 다운펌 → 가르마 댄디컷.
 * t2 = R(p, .62~.72), t3 = R(p, .80~.90) (`docs/design/spec.md` §5 ar).
 */
export const computeArStyle = (frame: SceneFrame): ArStyle => {
  const [first, second, third] = AR_SCREEN.styleCarouselIndex;
  const p = frame.progress("ar");
  const t2 = progressIn(p, TIMELINE.ar.styleTransition2);
  const t3 = progressIn(p, TIMELINE.ar.styleTransition3);

  if (frame.isReducedMotion) {
    const step = (t2 >= 0.5 ? 1 : 0) + (t3 >= 0.5 ? 1 : 0);
    const weights: Triple = [step === 0 ? 1 : 0, step === 1 ? 1 : 0, step === 2 ? 1 : 0];
    return {
      imageWeights: weights,
      labelWeights: weights,
      carouselPos: first + step,
      touch: { opacity: 0, carouselIndex: second },
    };
  }

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
