import { INTRO_COPY, INTRO_LAYOUT } from "@/shared/config";

import { at, baselineY, clamp01, pop, sceneFade, seg, tileX, track, tween, type LayerState } from "./common";

/* ===== S01 0–3.0 민트 · 단어 타이핑 ===== */

const S1_TIMES = [0.3, 0.6, 0.9, 1.4, 1.7, 2.0];
const S1_GAP = 26;
const S1_SIZE = 88;
const S1_TOP = 480;
/** 단어 i의 줄 안 x(앞 단어 폭 + 간격 누적) */
export const S1_WORD_X = INTRO_LAYOUT.s1.reduce<number[]>((xs, _, i) => {
  xs.push(i === 0 ? 0 : xs[i - 1] + INTRO_LAYOUT.s1[i - 1] + S1_GAP);
  return xs;
}, []);
/** 단어 n개가 나왔을 때 줄 폭 */
const lineWidth = (n: number): number => (n ? S1_WORD_X[n - 1] + INTRO_LAYOUT.s1[n - 1] : 0);

/** 줄(LINE 널) x — 나온 단어들이 늘 가운데 오게 단어가 나올 때마다 밀린다 */
const S1_LINE = track(
  ...S1_TIMES.map((t0, i) => {
    const end = i < S1_TIMES.length - 1 ? Math.min(t0 + 0.35, S1_TIMES[i + 1]) : t0 + 0.35;
    return seg(t0, 960 - lineWidth(i) / 2, end, 960 - lineWidth(i + 1) / 2, "out");
  }),
);

export const s01 = (t: number): { line: number; words: LayerState[] } => ({
  line: at(S1_LINE, t),
  words: S1_TIMES.map((t0, i) => ({
    x: tween(t, t0, S1_WORD_X[i] + 30, t0 + 0.35, S1_WORD_X[i], "out"),
    y: baselineY(S1_TOP, S1_SIZE),
    opacity: tween(t, t0, 0, t0 + 0.35, 100, "out"),
    blur: tween(t, t0, 16, t0 + 0.35, 0, "out"),
  })),
});

/* ===== S02 3.0–5.6 슬롯 롤링 문구 ===== */

const S2 = INTRO_LAYOUT.s2;
const S2_FW = S2.items[S2.items.length - 1];
const S2_GAP = 22;
export const S2_LEFT = 960 - (40 + S2_FW + S2_GAP + S2.tail + 40) / 2;
export const S2_TOP = 500 - 38;
export const S2_ROLL_STEP = 84;
export const S2_GEOMETRY = {
  tailX: S2_LEFT + 40 + S2_FW + S2_GAP,
  closeQuoteX: S2_LEFT + 40 + S2_FW + S2_GAP + S2.tail + 8,
  rollX: S2_LEFT + 40,
  rollWidth: S2_FW + 10,
  underline: { x: S2_LEFT + 40, y: 500 + 50, width: S2_FW },
};
const S2_ROLL = track(
  seg(3.3, 0.6 * S2_ROLL_STEP, 4.9, -(INTRO_COPY.s2Roll.length - 1) * S2_ROLL_STEP, "out"),
);
const S2_BLUR = track(seg(3.3, 11, 4.6, 2, "lin"), seg(4.6, 2, 4.8, 0, "lin"));

export const s02 = (
  t: number,
): {
  scene: number;
  pins: number;
  underline: number;
  roll: number;
  items: { opacity: number; blur: number }[];
} => {
  const roll = at(S2_ROLL, t);
  const f = -roll / S2_ROLL_STEP;
  const blur = at(S2_BLUR, t);
  return {
    scene: sceneFade(t, 5.35, 5.6, "inn"),
    pins: tween(t, 3.05, 0, 3.35, 100, "out"),
    underline: tween(t, 3.1, 0, 3.6, 100, "io"),
    roll,
    items: INTRO_COPY.s2Roll.map((_, i) => ({ opacity: clamp01(1 - Math.abs(i - f) * 0.9) * 100, blur })),
  };
};

/* ===== S03 5.6–8.2 로고: 원 → 심볼 → 워드마크 e 자리 → 민트 반전 + 스윕 ===== */

const WK = 720 / 2003;
const E_CX = 600 + 590 * WK;
const E_CY = 540 - 121.65 + 332 * WK;
const E_SIZE = ((394 * WK * 1004) / 980 / 320) * 100;

/** 워드마크 드러내기: e 자리(원본 x 590)에서 양옆으로 벌어진다 — clip-path inset(왼 %, 오른 %) */
export const wordmarkReveal = (p: number): { left: number; right: number } => ({
  left: ((590 * (1 - p)) / 2003) * 100,
  right: ((2003 - (590 + (2003 - 590) * p)) / 2003) * 100,
});

const S3_SYMBOL_SCALE = track(...pop(5.95, 0, 6.35, 100), seg(6.4, 100, 7.0, E_SIZE, "io5"));

export const s03 = (t: number) => {
  const toE = tween(t, 6.4, 0, 7.0, 1, "io5");
  return {
    isMint: t >= 7.45,
    circle: {
      x: 960,
      y: 540,
      scale: at(track(...pop(5.65, 0, 6.0, 100)), t),
      opacity: tween(t, 5.95, 100, 6.25, 0, "out"),
    } satisfies LayerState,
    symbol: {
      x: 960 + (E_CX - 960) * toE,
      y: 540 + (E_CY - 540) * toE,
      scale: at(S3_SYMBOL_SCALE, t),
      opacity: t < 5.95 || t >= 7.12 ? 0 : tween(t, 7.0, 100, 7.12, 0, "lin"),
    } satisfies LayerState,
    wordmarkBlack: { visible: t >= 6.85 && t < 7.45, ...wordmarkReveal(tween(t, 6.85, 0, 7.4, 1, "io")) },
    /** 민트 반전 뒤 흰 워드마크 크기(바탕 35% + 스윕) */
    whiteScale: tween(t, 7.45, 100, 8.2, 104, "lin"),
    /** 스윕(Linear Wipe) 완료도 100 → 0 */
    wipe: tween(t, 7.5, 100, 8.05, 0, "io"),
  };
};

/* ===== S04 8.2–11.6 기능 아이콘 4종 + 라벨 하이라이트 ===== */

const S4_HIGHLIGHT = [9.2, 9.75, 10.3, 10.85];
export const S4_LABEL_Y = baselineY(575, 28);

export const s04 = (t: number) =>
  INTRO_COPY.s4.map((_, i) => {
    const t0 = 8.3 + i * 0.14;
    const hl = S4_HIGHLIGHT[i];
    const a0 = 8.4 + i * 0.14;
    const scale = track(
      ...pop(t0, 0, t0 + 0.55, 100),
      seg(hl, 100, hl + 0.15, 108, "out"),
      seg(hl + 0.55, 108, hl + 0.7, 100, "out"),
    );
    const shadow = track(seg(hl, 30, hl + 0.15, 55, "out"), seg(hl + 0.55, 55, hl + 0.7, 30, "out"));
    const labelY = tween(t, a0, S4_LABEL_Y + 20, a0 + 0.5, S4_LABEL_Y, "out");
    const gray = track(
      seg(a0, 0, a0 + 0.4, 100, "out"),
      seg(hl + 0.06, 100, hl + 0.09, 0, "lin"),
      seg(hl + 0.6, 0, hl + 0.63, 100, "lin"),
    );
    const strong = track(seg(hl + 0.06, 0, hl + 0.09, 100, "lin"), seg(hl + 0.6, 100, hl + 0.63, 0, "lin"));
    return {
      tile: {
        x: tileX(i),
        y: tween(t, t0, 530, t0 + 0.45, 470, "out"),
        scale: at(scale, t),
        opacity: tween(t, t0, 0, t0 + 0.2, 100, "out"),
      } satisfies LayerState,
      shadow: at(shadow, t, 30),
      gray: { x: tileX(i), y: labelY, opacity: at(gray, t) } satisfies LayerState,
      strong: { x: tileX(i), y: labelY, opacity: at(strong, t) } satisfies LayerState,
    };
  });
