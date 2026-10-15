/**
 * 인트로 애니메이션 엔진(이슈 #70). After Effects 빌드 스크립트(`Heddy_Intro45_Build.jsx`)의 `seg()`·`pop()`을
 * 그대로 옮긴 것 — 속성 하나의 시간 변화를 "구간(t0→t1, v0→v1, 이징)"들을 이어 붙여 표현한다.
 * 시간은 영상 전체 기준 초.
 */

/** HTML 원본 이징: out=out3, out5, io=inOut3, io5=inOut5, inn=in3, lin */
export const EASE = {
  out: (p: number) => 1 - (1 - p) ** 3,
  out5: (p: number) => 1 - (1 - p) ** 5,
  io: (p: number) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2),
  io5: (p: number) => (p < 0.5 ? 16 * p ** 5 : 1 - (-2 * p + 2) ** 5 / 2),
  inn: (p: number) => p ** 3,
  lin: (p: number) => p,
} as const;

export type EaseName = keyof typeof EASE;

export type Seg = { t0: number; t1: number; v0: number; v1: number; ease: EaseName };

/** 정렬된 구간 목록 */
export type Track = readonly Seg[];

export const seg = (t0: number, v0: number, t1: number, v1: number, ease: EaseName = "out"): Seg => ({
  t0,
  t1,
  v0,
  v1,
  ease,
});

/** 구간들을 시작 시각 순으로 묶는다 */
export const track = (...segs: Seg[]): Track => [...segs].sort((a, b) => a.t0 - b.t0);

/** outBack 근사: 62% 지점에서 목표를 over만큼 넘었다가(out) 목표로 돌아온다(io) — AE 스크립트 `pop()` */
export const pop = (t0: number, v0: number, t1: number, v1: number, over = 0.1): Seg[] => {
  const tm = t0 + (t1 - t0) * 0.62;
  const vm = v1 + (v1 - v0) * over;
  return [seg(t0, v0, tm, vm, "out"), seg(tm, vm, t1, v1, "io")];
};

/**
 * 시각 t의 값. 첫 구간 전엔 첫 값, 구간 사이엔 앞 구간의 끝값, 마지막 구간 뒤엔 끝값(AE 키프레임 유지와 같다).
 * 구간이 없으면 fallback.
 */
export const valueAt = (tr: Track, t: number, fallback = 0): number => {
  if (tr.length === 0) return fallback;
  if (t <= tr[0].t0) return tr[0].v0;
  let value = tr[0].v0;
  for (const s of tr) {
    if (t < s.t0) return value;
    if (t <= s.t1) {
      const span = s.t1 - s.t0;
      const p = span <= 0 ? 1 : (t - s.t0) / span;
      return s.v0 + (s.v1 - s.v0) * EASE[s.ease](p);
    }
    value = s.v1;
  }
  return value;
};
