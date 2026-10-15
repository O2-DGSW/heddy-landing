import { INTRO } from "@/shared/config";

import type { LayerState } from "../layer";
import { seg, track, valueAt, type EaseName, type Track } from "../track";

export { pop, seg, track, valueAt } from "../track";
export type { LayerState } from "../layer";

/** 텍스트 기준선 y — AE `tx()`: 글자 상자 위 + 0.95 × 크기 */
export const baselineY = (top: number, size: number): number => top + INTRO.baseline * size;

/** 0~1로 자른다 */
export const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

/** 한 구간짜리 값 */
export const tween = (
  t: number,
  t0: number,
  v0: number,
  t1: number,
  v1: number,
  ease: EaseName = "out",
): number => valueAt(track(seg(t0, v0, t1, v1, ease)), t);

export const at = (tr: Track, t: number, fallback?: number): number => valueAt(tr, t, fallback);

/**
 * 단어 순차 등장(AE `reveal()`, HTML reveal): 시작 t0에서 dur 동안 아래(dy)에서 올라오며(out5) 나타나고(dur×0.6, out)
 * 흐림이 걷힌다(10 → 0, out5). (x, y)는 제자리 기준선.
 */
export const reveal = (t: number, t0: number, dur: number, dy: number, x: number, y: number): LayerState => ({
  x,
  y: tween(t, t0, y + dy, t0 + dur, y, "out5"),
  opacity: tween(t, t0, 0, t0 + dur * 0.6, 100, "out"),
  blur: tween(t, t0, 10, t0 + dur, 0, "out5"),
});

/** 아래(dy)에서 올라오며 나타남(AE `fadeUp()`) */
export const fadeUp = (
  t: number,
  t0: number,
  t1: number,
  dy: number,
  x: number,
  y: number,
  ease: EaseName = "out5",
): LayerState => ({
  x,
  y: dy ? tween(t, t0, y + dy, t1, y, ease) : y,
  opacity: tween(t, t0, 0, t1, 100, ease),
});

/** 기능 타일 4개의 가로 중심(S04·S05) */
export const tileX = (n: number): number => 960 + (n - 1.5) * 230;

/** 장면 전체 페이드아웃(AE `sceneFadeOut`) — 장면 루트 불투명도 */
export const sceneFade = (t: number, t0: number, t1: number, ease: EaseName = "lin"): number =>
  tween(t, t0, 100, t1, 0, ease);
