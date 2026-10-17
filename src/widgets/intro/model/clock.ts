import { INTRO } from "@/shared/config";

/** 동작 줄이기에서 멈춰 보여 줄 화면 시각 — S14 "내 머리의 기록이, / 다음 스타일의 기준이 되다"가 다 나온 뒤 */
export const REDUCED_MOTION_TIME = 42.1;

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

/** 현재·다음 장면만 준비한다. 마지막 다음에는 첫 장면을 준비해 반복 경계를 보존한다. */
export const introSceneIndices = (t: number): readonly [number, number] => {
  const scenes = Object.values(INTRO.scenes);
  const current = Math.max(
    0,
    scenes.findIndex((range) => isInScene(t, range)),
  );
  return [current, (current + 1) % scenes.length];
};

/**
 * 화면 시각 → 장면 원래 시각(이슈 #96, 키트 v16 WARP). 장면 안 키프레임은 원래 시각으로 쓰여 있어 장면마다 이 값을 넘긴다.
 * 기준점 사이는 직선, 구간 밖은 끝 기준점으로 고정한다.
 */
export const introSceneTime = (key: string, t: number): number => {
  const knots = INTRO.warp[key];
  if (!knots || knots.length === 0) return t;
  if (t <= knots[0][0]) return knots[0][1];
  for (let i = 1; i < knots.length; i += 1) {
    const [n0, o0] = knots[i - 1];
    const [n1, o1] = knots[i];
    if (t <= n1) return n1 === n0 ? o1 : o0 + ((t - n0) / (n1 - n0)) * (o1 - o0);
  }
  return knots[knots.length - 1][1];
};
