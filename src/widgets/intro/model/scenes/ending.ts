import { INTRO_COPY, INTRO_LAYOUT } from "@/shared/config";

import { at, baselineY, pop, seg, track, tween, type LayerState } from "./common";
import { wordmarkReveal } from "./opening";

/* ===== S13 33.6–36.6 "여～러" 번의 기록으로 완성되는 / 나만의 (심볼) 헤디로 ===== */

const S13 = INTRO_LAYOUT.s13;
const S13_TOP = 380;
const S13_GAP = 150;
export const S13_LEFT = 960 - (S13.yw + S13_GAP + S13.rw + 26 + S13.a) / 2;
const S13_R_X = S13_LEFT + S13.yw + S13_GAP;
/** 물결선 자리(레이어 원점)와 폭 */
export const S13_WAVE = { x: S13_LEFT + S13.yw, y: S13_TOP + 74 - 30, width: S13_GAP };
export const S13_LINE2 = { left: 960 - S13.l2w / 2, top: 560 };

/**
 * 물결선 점들("여～러"): draw(0~1)만큼 왼쪽부터 그려지고, 시간에 따라 오른쪽으로 흐른다(속도 17.6, 진폭 7, 파장 50).
 * 양 끝은 진폭이 줄어든다. AE 셰이프 경로 익스프레션 그대로.
 */
export const wavePoints = (draw: number, local: number): [number, number][] => {
  const phase = local * 17.6;
  const x1 = 16;
  const span = S13_GAP - 32;
  const x2 = x1 + span * draw;
  const points: [number, number][] = [];
  for (let x = x1; x <= x2 + 0.01; x += 2) {
    const u = (x - x1) / span;
    const envelope = Math.min(1, u * 5, (1 - u) * 5);
    points.push([x, 30 + 7 * (0.35 + 0.65 * envelope) * Math.sin(((x - x1) / 50) * 2 * Math.PI - phase)]);
  }
  return points.length < 2
    ? [
        [x1, 30],
        [x1 + 0.01, 30],
      ]
    : points;
};

export const s13 = (t: number) => {
  const draw = tween(t, 33.9, 0, 34.5, 1, "io");
  return {
    yeo: {
      x: S13_LEFT,
      y: tween(t, 33.65, baselineY(S13_TOP, 120) + 30, 34.05, baselineY(S13_TOP, 120), "out5"),
      opacity: tween(t, 33.65, 0, 33.9, 100, "out5"),
      blur: tween(t, 33.65, 12, 34.05, 0, "out5"),
    } satisfies LayerState,
    reo: {
      x: tween(t, 33.8, S13_R_X + 240, 34.4, S13_R_X, "out5"),
      y: baselineY(S13_TOP, 120),
      scaleX: tween(t, 33.8, 150, 34.4, 100, "out5"),
      opacity: tween(t, 33.8, 0, 34.1, 100, "out5"),
      blur: tween(t, 33.8, 20, 34.4, 0, "out5"),
    } satisfies LayerState,
    wave: draw > 0.001 ? wavePoints(draw, t - 33.6) : null,
    tail: {
      x: S13_R_X + S13.rw + 26,
      y: baselineY(440, 48),
      opacity: tween(t, 33.95, 0, 34.35, 100, "out"),
    } satisfies LayerState,
    line2: {
      x: 0,
      y: tween(t, 33.9, 20, 34.4, 0, "out"),
      opacity: tween(t, 33.9, 0, 34.3, 100, "out"),
    } satisfies LayerState,
  };
};

/* ===== S14 36.6–40.0 민트 · 내 머리의 기록이, / 다음 스타일의 기준이 되다(한 글자씩) ===== */

export const S14_LEFT = 960 - INTRO_LAYOUT.s14.w / 2;
/** 둘째 줄 글자(공백 제외)와 x */
export const S14_CHARS = INTRO_COPY.s14b
  .split("")
  .map((char, i) => ({ char, x: S14_LEFT + INTRO_LAYOUT.s14.x[i] }))
  .filter(({ char }) => char !== " ");

export const s14 = (t: number) => ({
  lead: { x: 960, y: baselineY(380, 52), opacity: tween(t, 36.75, 0, 37.2, 92, "out") } satisfies LayerState,
  leadTracking: tween(t, 36.75, 150, 37.6, 0, "out5"),
  chars: S14_CHARS.map(({ x }, k): LayerState => {
    const t0 = 37.5 + k * 0.11;
    const y = baselineY(470, 104);
    return {
      x,
      y: tween(t, t0, y + 24, t0 + 0.3, y, "out5"),
      opacity: tween(t, t0, 0, t0 + 0.3, 100, "out5"),
    };
  }),
});

/* ===== S15 40.0–45.0 원 → 심볼 → 워드마크 + QR(소개 페이지) + URL 바 ===== */

const S15_WIDTH = 500;
const K15 = S15_WIDTH / 2003;
const S15_TOP = 370 - (S15_WIDTH * 677) / 2003 / 2;
const S15_E = { x: 960 - S15_WIDTH / 2 + 590 * K15, y: S15_TOP + 332 * K15 };
const S15_E_SCALE = ((394 * K15 * 1004) / 980 / 300) * 100;
const S15_COLUMN = Math.max(INTRO_LAYOUT.s15.bar, INTRO_LAYOUT.s15.cap, INTRO_LAYOUT.s15.sub);
const S15_ROW = 260 + 56 + S15_COLUMN;
export const S15_QR = { left: 960 - S15_ROW / 2, top: 560 };
export const S15_TEXT_X = S15_QR.left + 316;

export const s15 = (t: number) => {
  const toE = tween(t, 41.0, 0, 41.6, 1, "io5");
  return {
    circle: {
      x: 960,
      y: 370,
      scale: at(track(...pop(40.1, 0, 40.45, 100)), t),
      opacity: tween(t, 40.4, 100, 40.7, 0, "out"),
    } satisfies LayerState,
    symbol: {
      x: 960 + (S15_E.x - 960) * toE,
      y: 370 + (S15_E.y - 370) * toE,
      scale: at(track(...pop(40.4, 0, 40.8, 100), seg(41.0, 100, 41.6, S15_E_SCALE, "io5")), t),
      opacity: t < 40.4 || t >= 41.8 ? 0 : tween(t, 41.65, 100, 41.8, 0, "lin"),
    } satisfies LayerState,
    wordmark: { visible: t >= 41.45, ...wordmarkReveal(tween(t, 41.45, 0, 42.05, 1, "io")) },
    qr: {
      x: S15_QR.left + 130,
      y: S15_QR.top + 130,
      scale: at(track(...pop(42.25, 80, 42.8, 100)), t),
      opacity: tween(t, 42.25, 0, 42.5, 100, "out"),
    } satisfies LayerState,
    title: {
      x: S15_TEXT_X,
      y: tween(t, 42.45, baselineY(S15_QR.top + 28, 30) + 16, 42.95, baselineY(S15_QR.top + 28, 30), "out5"),
      opacity: tween(t, 42.45, 0, 42.95, 100, "out5"),
    } satisfies LayerState,
    sub: {
      x: S15_TEXT_X,
      y: tween(t, 42.45, baselineY(S15_QR.top + 76, 20) + 16, 42.95, baselineY(S15_QR.top + 76, 20), "out5"),
      opacity: tween(t, 42.45, 0, 42.95, 100, "out5"),
    } satisfies LayerState,
    urlBar: {
      x: S15_TEXT_X,
      y: tween(t, 42.6, S15_QR.top + 164, 43.1, S15_QR.top + 148, "out5"),
      opacity: tween(t, 42.6, 0, 43.1, 100, "out5"),
    } satisfies LayerState,
  };
};
