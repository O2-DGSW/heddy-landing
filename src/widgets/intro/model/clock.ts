import { INTRO } from "@/shared/config";

/** 동작 줄이기에서 멈춰 보여 줄 시각 — S14 "내 머리의 기록이, / 다음 스타일의 기준이 되다"가 다 나온 뒤 */
export const REDUCED_MOTION_TIME = 39.9;

/** 주소의 `intro-t`(초)로 시각을 고정한다(장면 확인용). 범위 밖·숫자가 아니면 null */
export const parseFrozenTime = (search: string): number | null => {
  const raw = new URLSearchParams(search).get("intro-t");
  if (raw == null || raw === "") return null;
  const t = Number(raw);
  return Number.isFinite(t) && t >= 0 && t <= INTRO.duration ? t : null;
};

/** 흐른 시간(초)을 반복 재생 시각으로 감는다 */
export const loopTime = (elapsed: number): number => {
  const d = INTRO.duration;
  return ((elapsed % d) + d) % d;
};

/** 장면 [t0, t1) 안에 있는가 — 마지막 장면은 끝 시각도 포함 */
export const isInScene = (t: number, [t0, t1]: readonly [number, number]): boolean =>
  t >= t0 && (t < t1 || (t1 === INTRO.duration && t <= t1));
