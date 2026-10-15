import { INTRO_LAYOUT } from "@/shared/config";

import {
  at,
  baselineY,
  clamp01,
  fadeUp,
  pop,
  reveal,
  sceneFade,
  seg,
  tileX,
  track,
  tween,
  valueAt,
  type LayerState,
} from "./common";

/* ===== S05 11.6–14.6 흩어진 시술 기록을 + 화면 패널 줄 + 헤디 카드 ===== */

export const S5_PANELS = [
  ["detail.png", 1005, 2818],
  ["share.png", 1005, 2380],
  ["recommend.png", 1005, 2823],
  ["qrscreen.png", 1005, 2185],
  ["ar1.png", 402, 874],
  ["shared.png", 1005, 2185],
  ["list.png", 1005, 2185],
] as const;
export const S5_HEAD_LEFT = 960 - INTRO_LAYOUT.s5.w / 2;
export const S5_HEAD_Y = baselineY(300, 60);

export const s05 = (t: number) => ({
  scene: sceneFade(t, 14.4, 14.6),
  tiles: [0, 1, 2, 3].map((i): LayerState => ({
    x: tween(t, 11.6, tileX(i), 12.15, 960 + (i - 1.5) * 58, "io"),
    y: tween(t, 11.6, 470, 12.15, 250, "io"),
    scale: tween(t, 11.6, 100, 12.15, 34, "io"),
  })),
  words: INTRO_LAYOUT.s5.x.map((x, i) => reveal(t, 11.95 + i * 0.12, 0.6, 30, S5_HEAD_LEFT + x, S5_HEAD_Y)),
  drift: tween(t, 11.6, 0, 14.6, -90, "lin"),
  panels: S5_PANELS.map((_, i): LayerState => {
    const d = Math.abs(i - 3) * 0.06;
    return {
      x: 960 + (i - 3) * 340,
      y: tween(t, 11.8 + d, 1270, 12.4 + d, 770, "out5"),
      opacity: tween(t, 11.8 + d, 0, 12.4 + d, 100, "out5"),
    };
  }),
  brandCard: {
    x: 960,
    y: tween(t, 12.9, 1490, 13.5, 770, "out5"),
    opacity: t >= 12.9 ? 100 : 0,
  } satisfies LayerState,
});

/* ===== S06 14.6–17.2 한 곳에 차곡차곡 + 큰 리스트 UI + 떠다니는 아이콘 ===== */

export const S6_FLOATS = [
  ["scissors", 150, 1520, 250, -8],
  ["share", 96, 1630, 640, 10],
  ["ar", 120, 890, 820, -12],
  ["rec", 84, 960, 170, 8],
] as const;

export const s06 = (t: number) => {
  const local = t - 14.6;
  return {
    ui: {
      x: 1260,
      y: tween(t, 14.6, 790, 15.2, 490, "out5"),
      opacity: tween(t, 14.6, 0, 15.2, 100, "out5"),
      scale: tween(t, 14.6, 100, 17.2, 105, "lin"),
    } satisfies LayerState,
    lines: [
      reveal(t, 14.85, 0.6, 40, 260, baselineY(400, 76)),
      reveal(t, 15.05, 0.6, 40, 260, baselineY(500, 76)),
    ],
    floats: S6_FLOATS.map(([, , x, y, rotate], i): LayerState => ({
      x,
      y: y + Math.sin(local * 1.6 + i * 1.7) * 14,
      rotate: rotate + Math.sin(local + i) * 4,
      scale: valueAt(track(...pop(15.0 + i * 0.12, 0, 15.55 + i * 0.12, 100)), t),
    })),
  };
};

/* ===== S07 17.2–20.2 폰 + 시술기록 카드 12장 팝 쌓임(가속) + 카운트 ===== */

/** 카드 j가 리스트에 내려앉는 시각 — 간격이 0.38초에서 0.78배씩 줄어든다(최소 0.06) */
export const S7_LAND = (() => {
  const land = [17.85];
  let gap = 0.38;
  for (let j = 1; j < 12; j += 1) {
    land.push(land[j - 1] + gap);
    gap = Math.max(0.06, gap * 0.78);
  }
  return land;
})();
/** 카드 j가 튀어나와 내려앉기까지 걸리는 시간과 시작 시각 */
const S7_DROP = S7_LAND.map((lt, j) => (j ? Math.min(0.4, 0.95 * (lt - S7_LAND[j - 1])) : 0.4));
const S7_APPEAR = S7_LAND.map((lt, j) => lt - S7_DROP[j]);
export const S7_SLOT_STEP = 118;
export const S7_CARD_Y = 209;
export const S7_CARD_PITCH = 134;
/** 팝 카드 자리(무대): 폰(1270, 540, 98%) 안 첫 카드 */
export const S7_POP_Y = 540 + 0.98 * (S7_CARD_Y - 437);

const S7_ROLL = track(
  ...S7_LAND.slice(1).flatMap((lt, k) => {
    const j = k + 1;
    const d = Math.min(0.22, 0.85 * (lt - S7_LAND[j - 1]));
    const from = -(j - 1) * S7_SLOT_STEP;
    const to = -j * S7_SLOT_STEP;
    return j < 11 ? [seg(lt - d, from, lt, to, "out")] : pop(lt - d, from, lt, to, 0.1);
  }),
);

export const s07 = (t: number) => {
  const roll = valueAt(S7_ROLL, t);
  // 굴러가는 속도(px/s)로 흐림(AE 익스프레션 velocity)
  const velocity = (valueAt(S7_ROLL, t + 0.01) - valueAt(S7_ROLL, t - 0.01)) / 0.02;
  const f = Math.max(0, Math.min(11, -roll / S7_SLOT_STEP));
  const i0 = Math.floor(f);
  const i1 = Math.min(11, i0 + 1);
  const widths = INTRO_LAYOUT.s7w;
  const lastScale = track(
    seg(S7_LAND[11], 100, S7_LAND[11] + 0.15, 114, "out"),
    seg(S7_LAND[11] + 0.15, 114, S7_LAND[11] + 0.3, 100, "io"),
  );
  return {
    phone: {
      x: 1270,
      y: tween(t, 17.2, 1440, 17.75, 540, "out5"),
      scale: 98,
      opacity: 100,
    } satisfies LayerState,
    /** 리스트 안 카드(화면 좌표) — 카드 j(위에서 j번째로 쌓인 것)는 뒤 카드가 들어올 때마다 한 칸씩 밀린다 */
    listCards: S7_LAND.map((lt, j): LayerState => {
      const moves = track(
        ...S7_LAND.slice(j + 1).map((ltm, k) => {
          const m = j + 1 + k;
          return seg(
            S7_APPEAR[m] + 0.1 * S7_DROP[m],
            S7_CARD_Y + S7_CARD_PITCH * (m - j - 1),
            ltm,
            S7_CARD_Y + S7_CARD_PITCH * (m - j),
            "out",
          );
        }),
      );
      const dim =
        j < 11
          ? track(
              seg(S7_APPEAR[j + 1], 100, S7_LAND[j + 1], 45, "out"),
              seg(S7_LAND[j + 1], 45, S7_LAND[j + 1] + 0.2, 100, "io"),
            )
          : track();
      return { x: 201, y: valueAt(moves, t, S7_CARD_Y), opacity: t >= lt ? valueAt(dim, t, 100) : 0 };
    }),
    popCards: S7_LAND.map((lt, j): LayerState => ({
      x: 1270,
      y: S7_POP_Y,
      scale: tween(t, S7_APPEAR[j], 160, lt, 98, "io"),
      opacity:
        t >= S7_APPEAR[j] && t < lt
          ? tween(t, S7_APPEAR[j], 0, S7_APPEAR[j] + S7_DROP[j] * 0.15, 100, "lin")
          : 0,
    })),
    slot: {
      ...fadeUp(t, 17.45, 17.95, 40, 220, 426),
      y: tween(t, 17.45, 466, 17.95, 426, "out5"),
    } satisfies LayerState,
    roll,
    slotWords: widths.map((_, i) => ({
      opacity: clamp01(1 - Math.abs(i - -roll / S7_SLOT_STEP) * 0.85) * 100,
      blur: Math.min(12, (Math.abs(velocity) / S7_SLOT_STEP) * 0.7),
      scale: i === 11 ? at(lastScale, t, 100) : 100,
    })),
    /** "번의 기록이," — 슬롯 단어 폭을 따라 x가 움직인다 */
    countTail: {
      ...fadeUp(
        t,
        17.45,
        17.95,
        40,
        220 + widths[i0] + (widths[i1] - widths[i0]) * (f - i0) + 24,
        baselineY(440, 84),
      ),
    } satisfies LayerState,
    explain: reveal(t, S7_LAND[11] + 0.15, 0.5, 40, 220, baselineY(550, 84)),
  };
};

/* ===== S08 20.2–22.4 상세 리포트 확대 + 스크롤 + 막대 그래프 ===== */

export const S8_K = 700 / 402;
export const S8_BARS = [
  [694, 253.2],
  [759.2, 212.4],
  [824, 243.2],
  [889.2, 123.2],
] as const;

export const s08 = (t: number) => ({
  panel: {
    x: 960,
    y: tween(t, 20.2, 800, 20.6, 600, "out5"),
    scale: tween(t, 20.2, 85, 20.6, 100, "out5"),
    opacity: tween(t, 20.2, 0, 20.6, 100, "out5"),
  } satisfies LayerState,
  scroll: tween(t, 20.4, -120, 22.3, -820, "io"),
  bars: S8_BARS.map((_, i) => tween(t, 21.0 + i * 0.18, 0, 21.8 + i * 0.18, 100, "out")),
});
